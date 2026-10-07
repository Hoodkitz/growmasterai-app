#!/bin/bash
# Comprehensive GrowMaster AI Flow Tests

set -e

echo "=== GrowMaster AI - Comprehensive Flow Tests ==="
echo "Timestamp: $(date)"
echo ""

# Test 1: Coach Ask (should complete quickly)
echo "=== Test 1: Coach Ask (Simple Question) ==="
start=$(date +%s)
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "http://localhost:3000/api/trpc/coach.ask?batch=1" \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"question":"Was ist die ideale Temperatur für Cannabis-Anbau?"}}}' \
  --max-time 95)
end=$(date +%s)
duration=$((end - start))

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE:")

echo "Duration: ${duration}s"
echo "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  echo "✅ Coach Ask: SUCCESS (${duration}s)"
  echo "Response preview: ${body:0:200}..."
else
  echo "❌ Coach Ask: FAILED (HTTP $http_code)"
  echo "$body"
fi
echo ""

# Test 2: Coach Ask with Image
echo "=== Test 2: Coach Ask (With Image) ==="
start=$(date +%s)
test_image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "http://localhost:3000/api/trpc/coach.ask?batch=1" \
  -H "Content-Type: application/json" \
  -d "{\"0\":{\"json\":{\"question\":\"Was siehst du auf dem Bild?\",\"images\":[\"$test_image\"]}}}" \
  --max-time 95)
end=$(date +%s)
duration=$((end - start))

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE:")

echo "Duration: ${duration}s"
echo "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  echo "✅ Coach Ask with Image: SUCCESS (${duration}s)"
  echo "Response preview: ${body:0:200}..."
else
  echo "❌ Coach Ask with Image: FAILED (HTTP $http_code)"
  echo "$body"
fi
echo ""

# Test 3: Diagnosis Analyze
echo "=== Test 3: Diagnosis Analyze ==="
start=$(date +%s)
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "http://localhost:3000/api/trpc/diagnosis.analyze?batch=1" \
  -H "Content-Type: application/json" \
  -d "{\"0\":{\"json\":{\"images\":[\"$test_image\"],\"notes\":\"Test diagnosis request\"}}}" \
  --max-time 95)
end=$(date +%s)
duration=$((end - start))

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | grep -v "HTTP_CODE:")

echo "Duration: ${duration}s"
echo "HTTP Code: $http_code"

if [ "$http_code" = "200" ]; then
  echo "✅ Diagnosis Analyze: SUCCESS (${duration}s)"
  echo "Response preview: ${body:0:200}..."
else
  echo "❌ Diagnosis Analyze: FAILED (HTTP $http_code)"
  echo "$body"
fi
echo ""

# Test 4: Multiple Coach Requests (stress test)
echo "=== Test 4: Rapid Coach Requests (3 sequential) ==="
for i in {1..3}; do
  start=$(date +%s)
  response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
    "http://localhost:3000/api/trpc/coach.ask?batch=1" \
    -H "Content-Type: application/json" \
    -d '{"0":{"json":{"question":"Welche Nährstoffe brauchen Cannabis-Pflanzen?"}}}' \
    --max-time 95)
  end=$(date +%s)
  duration=$((end - start))
  http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
  
  if [ "$http_code" = "200" ]; then
    echo "  Request $i: ✅ SUCCESS (${duration}s)"
  else
    echo "  Request $i: ❌ FAILED (HTTP $http_code, ${duration}s)"
  fi
done
echo ""

# Summary
echo "=== Test Summary ==="
echo "All critical flows tested."
echo "Check server logs for Ollama fallback messages:"
echo "  tail -50 ~/projects/growmasterai-app/server.log | grep -i ollama"
echo ""
echo "Server status:"
lsof -i :3000 || echo "No process on port 3000"
