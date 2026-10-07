# OAuth API Endpoints - Übersicht

**Backend:** https://psp-productivity-intersection-inches.trycloudflare.com  
**Dokumentation:** OAUTH_INTEGRATION_TEST.md

---

## 🔐 Authentication Endpoints

### Google OAuth

| Endpoint | Method | Auth | Beschreibung |
|----------|--------|------|--------------|
| `/api/auth/google` | GET | - | OAuth Flow starten (Web oder Mobile) |
| `/api/auth/google/callback` | GET | - | OAuth Callback für Web (Cookie) |
| `/api/auth/google/callback/mobile` | GET | - | OAuth Callback für Mobile (JSON + Deep Link) |

**Parameter:**
- `mode` (optional): `web` (default) oder `mobile`
- `redirect_uri` (optional): Frontend-URL für Redirect

**Beispiel:**
```bash
curl -I "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/google?mode=mobile"
```

---

### Email Authentication

| Endpoint | Method | Auth | Beschreibung |
|----------|--------|------|--------------|
| `/api/auth/register` | POST | - | Neuen User registrieren |
| `/api/auth/login` | POST | - | Mit Email/Password anmelden |

**Request Body (Registrierung):**
```json
{
  "email": "user@example.com",
  "password": "MinLength8!",
  "name": "Max Mustermann"
}
```

**Request Body (Login):**
```json
{
  "email": "user@example.com",
  "password": "MinLength8!"
}
```

**Response:**
```json
{
  "app_session_id": "eyJhbG...",
  "user": {
    "id": 1,
    "openId": "email_hash...",
    "name": "Max Mustermann",
    "email": "user@example.com",
    "loginMethod": "email",
    "lastSignedIn": "2026-10-06T11:44:09.000Z"
  }
}
```

---

### Session Management

| Endpoint | Method | Auth | Beschreibung |
|----------|--------|------|--------------|
| `/api/auth/me` | GET | Bearer oder Cookie | Aktuellen User abrufen |
| `/api/auth/session` | POST | Bearer | Bearer Token → Cookie konvertieren |
| `/api/auth/logout` | POST | - | Session beenden (Cookie löschen) |

**Beispiel: User abrufen (Bearer)**
```bash
curl -H "Authorization: Bearer eyJhbG..." \
  "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/me"
```

**Beispiel: User abrufen (Cookie)**
```bash
curl -b "app_session_id=eyJhbG..." \
  "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/me"
```

**Beispiel: Bearer → Cookie**
```bash
curl -X POST -H "Authorization: Bearer eyJhbG..." \
  "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/session"
```

---

## 📊 HTTP Status Codes

| Code | Bedeutung | Wann |
|------|-----------|------|
| 200 | OK | Erfolgreiche Request |
| 302 | Redirect | OAuth Flow Start (zu Google) |
| 400 | Bad Request | Fehlende oder ungültige Parameter |
| 401 | Unauthorized | Ungültiger oder fehlender Token |
| 403 | Forbidden | User hat OAuth abgelehnt |
| 409 | Conflict | Email bereits registriert |
| 500 | Internal Server Error | Backend-Fehler (ungültiger Code, etc.) |

---

## 🔑 Authentication Methoden

### 1. Bearer Token (Mobile App)
```bash
curl -H "Authorization: Bearer eyJhbG..." \
  "https://.../api/auth/me"
```

**Verwendung:**
- Mobile Apps (React Native, Expo)
- Token in SecureStore gespeichert
- Wird bei jedem Request mitgeschickt

### 2. Cookie (Web Browser)
```bash
curl -b "app_session_id=eyJhbG..." \
  "https://.../api/auth/me"
```

**Verwendung:**
- Web-Apps (Browser)
- Cookie wird automatisch gesetzt (httpOnly)
- Browser sendet Cookie automatisch mit

### 3. Deep Link (Mobile → Token)
```
manus20251231214615://auth/google/callback?token=eyJhbG...
```

**Workflow:**
1. OAuth Flow startet in Browser
2. Nach Google Login: Deep Link mit Token
3. App fängt Deep Link ab
4. Token wird in SecureStore gespeichert
5. Token wird für API-Requests verwendet

---

## 🧪 Test-Befehle

### Backend Health
```bash
curl https://psp-productivity-intersection-inches.trycloudflare.com/api/health
# Response: {"ok":true,"timestamp":1791287037103}
```

### Google OAuth Start (Web)
```bash
curl -I "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/google?mode=web"
# Response: 302 → Google OAuth URL
```

### Email Registrierung
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}' \
  "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/register"
```

### User-Info abrufen (Bearer)
```bash
TOKEN="eyJhbG..."
curl -H "Authorization: Bearer $TOKEN" \
  "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/me"
```

### Logout
```bash
curl -X POST \
  "https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/logout"
```

---

## 📱 Mobile Integration (Quick Reference)

### 1. Deep Link Handler
```typescript
import * as Linking from 'expo-linking';

const handleDeepLink = async ({ url }) => {
  const { queryParams } = Linking.parse(url);
  const token = queryParams?.token;
  
  if (token) {
    await SecureStore.setItemAsync('app_session_id', token);
    navigation.replace('Home');
  }
};

useEffect(() => {
  const subscription = Linking.addEventListener('url', handleDeepLink);
  return () => subscription.remove();
}, []);
```

### 2. OAuth Flow starten
```typescript
import * as WebBrowser from 'expo-web-browser';

const handleGoogleLogin = async () => {
  const authUrl = 'https://psp-productivity-intersection-inches.trycloudflare.com/api/auth/google?mode=mobile';
  const redirectUrl = 'manus20251231214615://auth/google/callback';
  
  await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
};
```

### 3. API-Request mit Token
```typescript
import * as SecureStore from 'expo-secure-store';

const apiRequest = async (endpoint) => {
  const token = await SecureStore.getItemAsync('app_session_id');
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
};

// Verwendung
const user = await apiRequest('/api/auth/me');
```

---

## 🔒 Sicherheit

### JWT Token Struktur
```json
{
  "openId": "email_hash... oder Google Email",
  "appId": "growmaster-ai",
  "name": "Max Mustermann",
  "exp": 1822823466
}
```

### Cookie Konfiguration
```typescript
{
  httpOnly: true,      // JavaScript kann nicht zugreifen
  secure: true,        // Nur HTTPS
  sameSite: 'lax',     // CSRF-Schutz
  maxAge: ONE_YEAR_MS, // 365 Tage
  path: '/',
  domain: '.trycloudflare.com'
}
```

### Rate Limits
- **Login:** 5 Versuche / 15 Minuten
- **Registrierung:** 3 Versuche / Stunde
- **Passwort-Reset:** 3 Versuche / Stunde

---

## 📚 Vollständige Dokumentation

- **Backend:** [OAUTH_INTEGRATION_TEST.md](./OAUTH_INTEGRATION_TEST.md)
- **Mobile:** [OAUTH_MOBILE_INTEGRATION_GUIDE.md](./OAUTH_MOBILE_INTEGRATION_GUIDE.md)
- **Übersicht:** [OAUTH_ZUSAMMENFASSUNG.md](./OAUTH_ZUSAMMENFASSUNG.md)
- **Quick Start:** [OAUTH_README.md](./OAUTH_README.md)

---

**Status:** ✅ Production-Ready | **Tests:** 16/16 (100%)
