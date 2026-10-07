#!/bin/bash

# GrowMaster AI - Critical Flow Tests
# Tests coach.ask and diagnosis.analyze with timeout tracking

set -e

BASE_URL="http://localhost:3000"
TUNNEL_URL="https://sensitive-consumers-remained-tale.trycloudflare.com"
LOG_FILE="/tmp/growmaster-test-$(date +%s).log"

echo "=== GrowMaster AI Critical Flow Tests ===" | tee -a "$LOG_FILE"
echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Function to measure request time
measure_request() {
  local endpoint=$1
  local payload=$2
  local description=$3
  
  echo "Testing: $description" | tee -a "$LOG_FILE"
  echo "Endpoint: $endpoint" | tee -a "$LOG_FILE"
  
  start_time=$(date +%s)
  
  # Make request with timeout
  http_code=$(curl -w "%{http_code}" -o /tmp/response.json -s \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --max-time 95 \
    "$BASE_URL/api/trpc/$endpoint" || echo "TIMEOUT")
  
  end_time=$(date +%s)
  duration=$((end_time - start_time))
  
  echo "HTTP Code: $http_code" | tee -a "$LOG_FILE"
  echo "Duration: ${duration}s" | tee -a "$LOG_FILE"
  
  if [ "$http_code" = "TIMEOUT" ]; then
    echo "❌ FAILED: Request timed out (>95s)" | tee -a "$LOG_FILE"
    return 1
  elif [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS: Request completed in ${duration}s" | tee -a "$LOG_FILE"
    response=$(cat /tmp/response.json)
    echo "Response preview: ${response:0:200}..." | tee -a "$LOG_FILE"
  else
    echo "❌ FAILED: HTTP $http_code" | tee -a "$LOG_FILE"
    cat /tmp/response.json | tee -a "$LOG_FILE"
    return 1
  fi
  
  echo "" | tee -a "$LOG_FILE"
  return 0
}

# Test 1: Coach Ask
echo "=== Test 1: Coach Ask ===" | tee -a "$LOG_FILE"
coach_payload='{
  "0": {
    "json": {
      "question": "Wie oft sollte ich meine Cannabis-Pflanzen in der vegetativen Phase gießen?"
    }
  }
}'

measure_request "coach.ask" "$coach_payload" "Coach Ask - Simple Question"
coach_result=$?

# Test 2: Diagnosis Analyze (with test image)
echo "=== Test 2: Diagnosis Analyze ===" | tee -a "$LOG_FILE"

# Generate a small test image (1x1 pixel base64)
test_image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

diagnosis_payload=$(cat <<EOF
{
  "0": {
    "json": {
      "images": ["$test_image"],
      "notes": "Test diagnosis request"
    }
  }
}
EOF
)

measure_request "diagnosis.analyze" "$diagnosis_payload" "Diagnosis Analyze - Test Image"
diagnosis_result=$?

# Summary
echo "=== Test Summary ===" | tee -a "$LOG_FILE"
echo "Coach Ask: $([ $coach_result -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
echo "Diagnosis Analyze: $([ $diagnosis_result -eq 0 ] && echo '✅ PASSED' || echo '❌ FAILED')" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Server logs check
echo "=== Recent Server Logs ===" | tee -a "$LOG_FILE"
journalctl -u growmaster-api.service -n 50 --no-pager 2>/dev/null || \
  (echo "No systemd service, checking process logs..." && ps aux | grep "node.*dist/index.js" | head -5) | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "Full log saved to: $LOG_FILE" | tee -a "$LOG_FILE"

# Exit with failure if any test failed
[ $coach_result -eq 0 ] && [ $diagnosis_result -eq 0 ]
