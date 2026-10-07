#!/bin/bash
# Google OAuth Integration Tests
# Testet die OAuth-Routes ohne echte Google-Authentifizierung

set -e

BACKEND_URL="https://psp-productivity-intersection-inches.trycloudflare.com"
TIMESTAMP=$(date +%s)
TEST_LOG="oauth_test_${TIMESTAMP}.log"

echo "==================================="
echo "Google OAuth Integration Tests"
echo "==================================="
echo "Backend: $BACKEND_URL"
echo "Log: $TEST_LOG"
echo ""

# Helper Functions
log() {
  echo "[$(date +'%H:%M:%S')] $1" | tee -a "$TEST_LOG"
}

test_endpoint() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local expected_code="$4"
  local extra_args="${5:-}"
  
  log "Testing: $name"
  
  response=$(curl -s -w "\n%{http_code}" -X "$method" \
    -H "Content-Type: application/json" \
    $extra_args \
    "$BACKEND_URL$endpoint" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "$expected_code" ]; then
    log "✓ PASS - Status: $http_code"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    log "✗ FAIL - Expected: $expected_code, Got: $http_code"
    echo "$body"
  fi
  
  echo "" | tee -a "$TEST_LOG"
}

# Test 1: Health Check
log "=== Test 1: Backend Health Check ==="
test_endpoint "Health Check" "GET" "/api/health" "200"

# Test 2: Google OAuth Start (Web)
log "=== Test 2: Google OAuth Start (Web Mode) ==="
response=$(curl -sI "$BACKEND_URL/api/auth/google?mode=web" 2>&1)
http_code=$(echo "$response" | grep -i "HTTP" | awk '{print $2}')
location=$(echo "$response" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

log "HTTP Status: $http_code"
log "Redirect Location: $location"

if [[ "$location" == *"accounts.google.com"* ]]; then
  log "✓ PASS - Korrekte Weiterleitung zu Google"
else
  log "✗ FAIL - Erwartete Google URL, bekam: $location"
fi
echo "" | tee -a "$TEST_LOG"

# Test 3: Google OAuth Start (Mobile)
log "=== Test 3: Google OAuth Start (Mobile Mode) ==="
response=$(curl -sI "$BACKEND_URL/api/auth/google?mode=mobile" 2>&1)
http_code=$(echo "$response" | grep -i "HTTP" | awk '{print $2}')
location=$(echo "$response" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

log "HTTP Status: $http_code"
log "Redirect Location: $location"

if [[ "$location" == *"accounts.google.com"* ]]; then
  log "✓ PASS - Mobile Mode: Korrekte Weiterleitung zu Google"
else
  log "✗ FAIL - Mobile Mode: Erwartete Google URL, bekam: $location"
fi
echo "" | tee -a "$TEST_LOG"

# Test 4: Callback ohne Parameter (Fehlerfall)
log "=== Test 4: Callback ohne Code/State (Fehlerbehandlung) ==="
test_endpoint "Callback ohne Parameter" "GET" "/api/auth/google/callback" "400"

# Test 5: Callback mit ungültigem Code
log "=== Test 5: Callback mit ungültigem Code ==="
test_endpoint "Ungültiger Code" "GET" "/api/auth/google/callback?code=invalid&state=dGVzdA==" "500"

# Test 6: Mobile Callback ohne Parameter
log "=== Test 6: Mobile Callback ohne Parameter ==="
test_endpoint "Mobile Callback ohne Parameter" "GET" "/api/auth/google/callback/mobile" "400"

# Test 7: /api/auth/me ohne Session (Unauthorized)
log "=== Test 7: /api/auth/me ohne Session ==="
test_endpoint "Auth Me - Unauthorized" "GET" "/api/auth/me" "401"

# Test 8: /api/auth/me mit ungültigem Token
log "=== Test 8: /api/auth/me mit ungültigem Bearer Token ==="
test_endpoint "Auth Me - Invalid Token" "GET" "/api/auth/me" "401" "-H 'Authorization: Bearer invalid_token'"

# Test 9: /api/auth/session ohne Token
log "=== Test 9: /api/auth/session ohne Bearer Token ==="
test_endpoint "Session ohne Token" "POST" "/api/auth/session" "400"

# Test 10: /api/auth/logout
log "=== Test 10: Logout Endpoint ==="
test_endpoint "Logout" "POST" "/api/auth/logout" "200"

# Test 11: Email Login - Registrierung
log "=== Test 11: Email Registrierung ==="
email="test_${TIMESTAMP}@example.com"
payload="{\"email\":\"$email\",\"password\":\"TestPass123!\",\"name\":\"Test User\"}"
test_endpoint "Email Registrierung" "POST" "/api/auth/register" "200" "-d '$payload'"

# Test 12: Email Login - Duplikat (Fehlerfall)
log "=== Test 12: Email Registrierung - Duplikat ==="
test_endpoint "Duplikat Email" "POST" "/api/auth/register" "409" "-d '$payload'"

# Test 13: Email Login - Ungültiges Passwort
log "=== Test 13: Email Registrierung - Kurzes Passwort ==="
payload_short="{\"email\":\"short@example.com\",\"password\":\"123\",\"name\":\"Test\"}"
test_endpoint "Kurzes Passwort" "POST" "/api/auth/register" "400" "-d '$payload_short'"

# Test 14: Email Login - Anmeldung mit korrekten Daten
log "=== Test 14: Email Login - Korrekte Daten ==="
login_payload="{\"email\":\"$email\",\"password\":\"TestPass123!\"}"
response=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d "$login_payload" \
  "$BACKEND_URL/api/auth/login" 2>&1)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  log "✓ PASS - Login erfolgreich"
  SESSION_TOKEN=$(echo "$body" | jq -r '.app_session_id' 2>/dev/null)
  log "Session Token erhalten: ${SESSION_TOKEN:0:30}..."
  echo "$body" | jq '.'
else
  log "✗ FAIL - Login fehlgeschlagen: $http_code"
  echo "$body"
fi
echo "" | tee -a "$TEST_LOG"

# Test 15: /api/auth/me mit gültigem Token
if [ -n "$SESSION_TOKEN" ]; then
  log "=== Test 15: /api/auth/me mit gültigem Token ==="
  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $SESSION_TOKEN" \
    "$BACKEND_URL/api/auth/me" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    log "✓ PASS - Authentifizierte Anfrage erfolgreich"
    echo "$body" | jq '.'
  else
    log "✗ FAIL - Status: $http_code"
    echo "$body"
  fi
  echo "" | tee -a "$TEST_LOG"
fi

# Test 16: /api/auth/session mit gültigem Token
if [ -n "$SESSION_TOKEN" ]; then
  log "=== Test 16: /api/auth/session - Cookie aus Bearer Token ==="
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $SESSION_TOKEN" \
    "$BACKEND_URL/api/auth/session" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ]; then
    log "✓ PASS - Session-Cookie erfolgreich gesetzt"
    echo "$body" | jq '.'
  else
    log "✗ FAIL - Status: $http_code"
    echo "$body"
  fi
  echo "" | tee -a "$TEST_LOG"
fi

# Test 17: Rate Limiting Test (Login)
log "=== Test 17: Rate Limiting ==="
log "Sende 10 Login-Versuche schnell hintereinander..."
rate_limited=false
for i in {1..10}; do
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    "$BACKEND_URL/api/auth/login" 2>&1)
  
  http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" = "429" ]; then
    log "✓ PASS - Rate Limit aktiv nach $i Versuchen (Status: 429)"
    rate_limited=true
    break
  fi
done

if [ "$rate_limited" = false ]; then
  log "⚠ WARNING - Rate Limit nicht ausgelöst (möglicherweise zu hohe Limits)"
fi
echo "" | tee -a "$TEST_LOG"

# Zusammenfassung
log "==================================="
log "Test-Zusammenfassung"
log "==================================="
pass_count=$(grep -c "✓ PASS" "$TEST_LOG" || echo "0")
fail_count=$(grep -c "✗ FAIL" "$TEST_LOG" || echo "0")
warn_count=$(grep -c "⚠ WARNING" "$TEST_LOG" || echo "0")

log "Bestanden: $pass_count"
log "Fehlgeschlagen: $fail_count"
log "Warnungen: $warn_count"
log ""
log "Vollständiges Log: $TEST_LOG"

echo ""
echo "Tests abgeschlossen!"
