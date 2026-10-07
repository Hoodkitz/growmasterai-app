#!/bin/bash
# Spezifische Google OAuth Tests

BACKEND="https://psp-productivity-intersection-inches.trycloudflare.com"

echo "=== Google OAuth Spezifische Tests ==="
echo ""

# Test 1: State-Parameter Dekodierung
echo "Test 1: State-Parameter Struktur"
STATE=$(echo '{"mode":"mobile","clientRedirect":"http://localhost:8081"}' | base64)
echo "Original: {\"mode\":\"mobile\",\"clientRedirect\":\"http://localhost:8081\"}"
echo "Base64: $STATE"
echo "Dekodiert: $(echo $STATE | base64 -d)"
echo ""

# Test 2: Google Auth URL Struktur prüfen
echo "Test 2: Google OAuth URL Struktur (Web)"
RESPONSE=$(curl -sI "$BACKEND/api/auth/google?mode=web&redirect_uri=http://localhost:8081")
LOCATION=$(echo "$RESPONSE" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

echo "Prüfe URL-Komponenten:"
echo "$LOCATION" | grep -q "accounts.google.com" && echo "✓ Google Domain korrekt"
echo "$LOCATION" | grep -q "client_id=" && echo "✓ Client ID vorhanden"
echo "$LOCATION" | grep -q "redirect_uri=" && echo "✓ Redirect URI vorhanden"
echo "$LOCATION" | grep -q "scope=" && echo "✓ Scopes vorhanden"
echo "$LOCATION" | grep -q "state=" && echo "✓ State-Parameter vorhanden"
echo "$LOCATION" | grep -q "response_type=code" && echo "✓ Response Type = code"
echo "$LOCATION" | grep -q "prompt=select_account" && echo "✓ Prompt = select_account"
echo ""

# Test 3: Mobile vs Web Callback Unterschied
echo "Test 3: Callback-URL Unterschied (Web vs Mobile)"
WEB_RESPONSE=$(curl -sI "$BACKEND/api/auth/google?mode=web")
MOBILE_RESPONSE=$(curl -sI "$BACKEND/api/auth/google?mode=mobile")

WEB_LOCATION=$(echo "$WEB_RESPONSE" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')
MOBILE_LOCATION=$(echo "$MOBILE_RESPONSE" | grep -i "Location:" | cut -d' ' -f2 | tr -d '\r')

if echo "$WEB_LOCATION" | grep -q "callback%2Fmobile"; then
  echo "✗ Web-Mode verwendet fälschlicherweise Mobile-Callback"
else
  echo "✓ Web-Mode: Callback ohne '/mobile'"
fi

if echo "$MOBILE_LOCATION" | grep -q "callback%2Fmobile"; then
  echo "✓ Mobile-Mode: Callback mit '/mobile'"
else
  echo "✗ Mobile-Mode sollte '/mobile' Callback verwenden"
fi
echo ""

# Test 4: CORS Headers
echo "Test 4: CORS Headers"
CORS_RESPONSE=$(curl -s -I -H "Origin: http://localhost:8081" "$BACKEND/api/health")
echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin" && echo "✓ CORS Origin-Header vorhanden"
echo "$CORS_RESPONSE" | grep -i "access-control-allow-credentials: true" && echo "✓ Credentials erlaubt"
echo ""

# Test 5: Session Token Struktur
echo "Test 5: Session Token JWT Struktur"
# Registrierung für Token
EMAIL="jwt_test_$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"TestPass123!\",\"name\":\"JWT Test\"}" \
  "$BACKEND/api/auth/register")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.app_session_id')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ Token erhalten: ${TOKEN:0:50}..."
  
  # JWT Struktur prüfen (3 Teile: Header.Payload.Signature)
  PARTS=$(echo "$TOKEN" | tr '.' '\n' | wc -l)
  if [ "$PARTS" -eq 3 ]; then
    echo "✓ JWT hat 3 Teile (Header.Payload.Signature)"
    
    # Payload dekodieren (Base64)
    PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2)
    # Padding hinzufügen falls nötig
    PADDING=$(( (4 - ${#PAYLOAD} % 4) % 4 ))
    PAYLOAD="${PAYLOAD}$(printf '=%.0s' $(seq 1 $PADDING))"
    
    DECODED=$(echo "$PAYLOAD" | base64 -d 2>/dev/null)
    echo "Payload: $DECODED"
    
    echo "$DECODED" | jq -r '.openId' > /dev/null 2>&1 && echo "✓ openId im Payload"
    echo "$DECODED" | jq -r '.appId' > /dev/null 2>&1 && echo "✓ appId im Payload"
    echo "$DECODED" | jq -r '.name' > /dev/null 2>&1 && echo "✓ name im Payload"
    echo "$DECODED" | jq -r '.exp' > /dev/null 2>&1 && echo "✓ exp (Expiration) im Payload"
  else
    echo "✗ JWT sollte 3 Teile haben, hat aber $PARTS"
  fi
else
  echo "✗ Kein Token erhalten"
fi
echo ""

# Test 6: Deep Link Format
echo "Test 6: Deep Link Format (simuliert)"
DEEP_LINK="manus20251231214615://auth/google/callback?token=$TOKEN"
echo "Deep Link: ${DEEP_LINK:0:80}..."

# Prüfe Schema
if echo "$DEEP_LINK" | grep -q "^manus20251231214615://"; then
  echo "✓ Korrekte Deep Link Schema"
else
  echo "✗ Falsches Deep Link Schema"
fi

# Prüfe Token-Parameter
if echo "$DEEP_LINK" | grep -q "token="; then
  echo "✓ Token-Parameter vorhanden"
else
  echo "✗ Token-Parameter fehlt"
fi
echo ""

echo "=== Tests abgeschlossen ==="
