#!/bin/bash
# Session-Persistenz Tests

BACKEND="https://psp-productivity-intersection-inches.trycloudflare.com"

echo "=== Session-Persistenz Tests ==="
echo ""

# Test 1: Email-Login und Token erhalten
echo "Test 1: Email-Login und Token-Generierung"
EMAIL="session_test_$(date +%s)@example.com"
REGISTER=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"SessionTest123!\",\"name\":\"Session Test\"}" \
  "$BACKEND/api/auth/register")

TOKEN=$(echo "$REGISTER" | jq -r '.app_session_id')
USER_ID=$(echo "$REGISTER" | jq -r '.user.id')
USER_EMAIL=$(echo "$REGISTER" | jq -r '.user.email')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "✓ Token erfolgreich generiert"
  echo "  User ID: $USER_ID"
  echo "  Email: $USER_EMAIL"
else
  echo "✗ Token-Generierung fehlgeschlagen"
  exit 1
fi
echo ""

# Test 2: Token-Validierung via /api/auth/me
echo "Test 2: Token-Validierung (Bearer Auth)"
ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/api/auth/me")
ME_EMAIL=$(echo "$ME_RESPONSE" | jq -r '.user.email')

if [ "$ME_EMAIL" = "$USER_EMAIL" ]; then
  echo "✓ Token gültig - User erkannt"
  echo "$ME_RESPONSE" | jq '.'
else
  echo "✗ Token-Validierung fehlgeschlagen"
  echo "$ME_RESPONSE"
fi
echo ""

# Test 3: Cookie-basierte Session (simuliert)
echo "Test 3: Cookie-basierte Session"
COOKIE_RESPONSE=$(curl -s -c /tmp/cookies.txt -b /tmp/cookies.txt \
  -H "Authorization: Bearer $TOKEN" \
  -X POST "$BACKEND/api/auth/session")

echo "$COOKIE_RESPONSE" | jq '.'

if [ -f /tmp/cookies.txt ]; then
  echo "Cookie-Datei:"
  cat /tmp/cookies.txt | grep -v "^#"
  
  # Prüfe ob Cookie gesetzt wurde
  if grep -q "app_session_id" /tmp/cookies.txt; then
    echo "✓ Session-Cookie wurde gesetzt"
  else
    echo "⚠ Session-Cookie nicht in Cookie-Datei (möglicherweise httpOnly)"
  fi
fi
echo ""

# Test 4: Session-Persistenz (mehrere Requests)
echo "Test 4: Session-Persistenz über mehrere Requests"
for i in 1 2 3; do
  RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/api/auth/me")
  STATUS=$(echo "$RESPONSE" | jq -r '.user.email')
  
  if [ "$STATUS" = "$USER_EMAIL" ]; then
    echo "✓ Request $i: Session persistent"
  else
    echo "✗ Request $i: Session verloren"
  fi
  sleep 0.5
done
echo ""

# Test 5: Ungültiger Token
echo "Test 5: Ungültiger Token (Fehlerbehandlung)"
INVALID_RESPONSE=$(curl -s -H "Authorization: Bearer invalid_token_xyz" "$BACKEND/api/auth/me")
INVALID_ERROR=$(echo "$INVALID_RESPONSE" | jq -r '.error')

if [ "$INVALID_ERROR" = "Not authenticated" ]; then
  echo "✓ Ungültiger Token korrekt abgelehnt"
else
  echo "✗ Ungültiger Token sollte abgelehnt werden"
fi
echo ""

# Test 6: Abgelaufener Token (simuliert)
echo "Test 6: Token-Expiration Check"
# JWT Payload extrahieren und exp prüfen
PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2)
PADDING=$(( (4 - ${#PAYLOAD} % 4) % 4 ))
PAYLOAD="${PAYLOAD}$(printf '=%.0s' $(seq 1 $PADDING))"
DECODED=$(echo "$PAYLOAD" | base64 -d 2>/dev/null)
EXP=$(echo "$DECODED" | jq -r '.exp')
NOW=$(date +%s)
DAYS_VALID=$(( ($EXP - $NOW) / 86400 ))

echo "Token Expiration: $(date -d @$EXP 2>/dev/null || date -r $EXP 2>/dev/null)"
echo "Gültig für: $DAYS_VALID Tage"

if [ $DAYS_VALID -gt 360 ] && [ $DAYS_VALID -lt 370 ]; then
  echo "✓ Token-Gültigkeit ~1 Jahr (korrekt)"
else
  echo "⚠ Token-Gültigkeit: $DAYS_VALID Tage (erwartet: ~365)"
fi
echo ""

# Test 7: Logout
echo "Test 7: Logout-Funktionalität"
LOGOUT_RESPONSE=$(curl -s -X POST "$BACKEND/api/auth/logout")
echo "$LOGOUT_RESPONSE" | jq '.'

if echo "$LOGOUT_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✓ Logout erfolgreich"
else
  echo "✗ Logout fehlgeschlagen"
fi
echo ""

# Test 8: Session nach Logout
echo "Test 8: Token-Validierung nach Logout"
echo "Hinweis: Token ist noch gültig (JWT ist stateless)"
POST_LOGOUT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND/api/auth/me")
POST_LOGOUT_EMAIL=$(echo "$POST_LOGOUT" | jq -r '.user.email')

if [ "$POST_LOGOUT_EMAIL" = "$USER_EMAIL" ]; then
  echo "✓ JWT-Token bleibt gültig (stateless, Cookie wurde gelöscht)"
  echo "  → Mobile Apps nutzen Token weiterhin"
  echo "  → Web-Browser verlieren Cookie-basierte Session"
else
  echo "✗ Unerwartetes Verhalten"
fi
echo ""

# Cleanup
rm -f /tmp/cookies.txt

echo "=== Session-Persistenz Tests abgeschlossen ==="
