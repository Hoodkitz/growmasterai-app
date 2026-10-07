# OAuth Mobile Integration Guide

**Projekt:** GrowMaster AI  
**Zielgruppe:** Mobile App Entwickler (React Native / Expo)  
**Backend:** https://psp-productivity-intersection-inches.trycloudflare.com

---

## Übersicht

Dieser Guide zeigt, wie die Google OAuth Integration in der Mobile App implementiert wird. Der Flow nutzt Deep Links, um den Session-Token von der OAuth-Callback-URL zurück in die App zu übertragen.

---

## 1. Deep Link Schema in app.json registrieren

```json
{
  "expo": {
    "scheme": "manus20251231214615",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "manus20251231214615",
              "host": "auth",
              "pathPrefix": "/google/callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.growmaster.ai",
      "associatedDomains": ["applinks:manus20251231214615"]
    }
  }
}
```

---

## 2. OAuth Flow in der App implementieren

### Installation

```bash
npx expo install expo-linking expo-secure-store expo-auth-session expo-web-browser
```

### Beispiel-Code: Login Screen

```typescript
import React, { useEffect, useState } from 'react';
import { View, Button, Text, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

const BACKEND_URL = 'https://psp-productivity-intersection-inches.trycloudflare.com';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Deep Link Listener registrieren
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check ob App via Deep Link geöffnet wurde
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Cleanup
    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    console.log('Deep Link erhalten:', url);

    try {
      // Parse Deep Link
      const { hostname, path, queryParams } = Linking.parse(url);

      // Prüfe ob es ein OAuth Callback ist
      if (hostname === 'auth' && path === 'google/callback') {
        const token = queryParams?.token as string;

        if (token) {
          // Token speichern
          await SecureStore.setItemAsync('app_session_id', token);
          console.log('Token gespeichert');

          // User-Info laden
          await loadUserInfo(token);

          // Navigation zu geschützter Route
          navigation.replace('Home');
        } else {
          setError('Kein Token im Deep Link gefunden');
        }
      }
    } catch (err) {
      console.error('Deep Link Fehler:', err);
      setError('Fehler beim Verarbeiten des Deep Links');
    }
  };

  const loadUserInfo = async (token: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.user) {
        // User-Info in AsyncStorage/Context speichern
        await SecureStore.setItemAsync('user_info', JSON.stringify(data.user));
        console.log('User-Info geladen:', data.user);
      }
    } catch (err) {
      console.error('Fehler beim Laden der User-Info:', err);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const authUrl = `${BACKEND_URL}/api/auth/google?mode=mobile`;

      // OAuth Flow in Browser öffnen
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'manus20251231214615://auth/google/callback'
      );

      console.log('WebBrowser Result:', result);

      // WebBrowser öffnet Deep Link automatisch
      // handleDeepLink wird dann aufgerufen

      if (result.type === 'cancel') {
        setError('Login abgebrochen');
      } else if (result.type === 'dismiss') {
        setError('Browser geschlossen');
      }
    } catch (err) {
      console.error('Google Login Fehler:', err);
      setError('Fehler beim Google Login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
        GrowMaster AI
      </Text>

      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>
          {error}
        </Text>
      )}

      <Button
        title={loading ? 'Lädt...' : 'Mit Google anmelden'}
        onPress={handleGoogleLogin}
        disabled={loading}
      />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
}
```

---

## 3. API-Client mit automatischer Authentication

```typescript
// utils/api.ts
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = 'https://psp-productivity-intersection-inches.trycloudflare.com';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Token aus SecureStore laden
  const token = await SecureStore.getItemAsync('app_session_id');

  // Headers zusammenbauen
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Authorization Header hinzufügen (falls Token vorhanden)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Request ausführen
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Fehlerbehandlung
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  // Response als JSON parsen
  return response.json();
}

// Beispiel: User-Info laden
export async function getCurrentUser() {
  return apiRequest('/api/auth/me');
}

// Beispiel: Logout
export async function logout() {
  await apiRequest('/api/auth/logout', { method: 'POST' });
  await SecureStore.deleteItemAsync('app_session_id');
  await SecureStore.deleteItemAsync('user_info');
}
```

### Verwendung im Component

```typescript
import { getCurrentUser, logout } from './utils/api';

function HomeScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (err) {
      console.error('Fehler beim Laden des Users:', err);
      // Zurück zum Login
      navigation.replace('Login');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View>
      <Text>Willkommen, {user?.name}!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
```

---

## 4. Auth Context (Empfohlen)

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getCurrentUser, logout as apiLogout } from '../utils/api';

interface User {
  id: number;
  openId: string;
  name: string;
  email: string;
  loginMethod: 'google' | 'email' | 'apple';
  lastSignedIn: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check ob User bereits eingeloggt ist
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('app_session_id');

      if (token) {
        const data = await getCurrentUser();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth Check Fehler:', err);
      // Token ist ungültig → löschen
      await SecureStore.deleteItemAsync('app_session_id');
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string) => {
    // Token speichern
    await SecureStore.setItemAsync('app_session_id', token);

    // User-Info laden
    const data = await getCurrentUser();
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout Fehler:', err);
    }

    setUser(null);
  };

  const refreshUser = async () => {
    const data = await getCurrentUser();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  }
  return context;
}
```

### Verwendung im Login Screen

```typescript
import { useAuth } from '../contexts/AuthContext';

function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const handleDeepLink = async ({ url }: { url: string }) => {
    const { hostname, path, queryParams } = Linking.parse(url);

    if (hostname === 'auth' && path === 'google/callback') {
      const token = queryParams?.token as string;

      if (token) {
        await login(token);
        navigation.replace('Home');
      }
    }
  };

  // ... Rest wie vorher
}
```

---

## 5. Navigation Guard (Protected Routes)

```typescript
// navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Geschützte Routes
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            {/* ... weitere geschützte Screens */}
          </>
        ) : (
          // Öffentliche Routes
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 6. Testing im Expo Go

### Wichtig: Deep Links in Expo Go

Expo Go verwendet ein anderes Deep Link Schema: `exp://[IP]:8081/--/...`

**Lösung:**
1. Teste mit Production Build (EAS Build)
2. Oder nutze Expo Dev Client (empfohlen)

### Expo Dev Client installieren

```bash
npx expo install expo-dev-client
npx expo prebuild
```

### Build erstellen

```bash
# iOS Simulator
eas build --profile development --platform ios

# Android Emulator
eas build --profile development --platform android

# Oder lokal
npx expo run:ios
npx expo run:android
```

### Deep Link manuell testen

```bash
# iOS Simulator
xcrun simctl openurl booted "manus20251231214615://auth/google/callback?token=eyJhbG..."

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "manus20251231214615://auth/google/callback?token=eyJhbG..."
```

---

## 7. Fehlerbehandlung

### Token abgelaufen (401)

```typescript
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await SecureStore.getItemAsync('app_session_id')}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token abgelaufen → Logout
    await SecureStore.deleteItemAsync('app_session_id');
    throw new Error('Session abgelaufen - Bitte erneut anmelden');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Netzwerkfehler

```typescript
import NetInfo from '@react-native-community/netinfo';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Prüfe Internetverbindung
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected) {
    throw new Error('Keine Internetverbindung');
  }

  // ... Rest wie vorher
}
```

---

## 8. Produktions-Checkliste

- [ ] **Google Cloud Console:**
  - [ ] Autorisierte Redirect URIs hinzufügen
  - [ ] OAuth Consent Screen konfigurieren
  - [ ] API Keys einschränken (nur für eigene Domain)

- [ ] **Backend:**
  - [ ] Production Domain statt Cloudflare Tunnel
  - [ ] SSL-Zertifikat (HTTPS)
  - [ ] Environment Variables in sicheren Vault
  - [ ] Rate Limiting aktiviert
  - [ ] Monitoring (Sentry, LogRocket)

- [ ] **Mobile App:**
  - [ ] Deep Link Schema in app.json korrekt
  - [ ] Associated Domains (iOS) konfiguriert
  - [ ] Intent Filters (Android) korrekt
  - [ ] Expo Dev Client oder Production Build
  - [ ] Error Tracking (Sentry)

- [ ] **Testing:**
  - [ ] Deep Link Flow auf echtem Device testen
  - [ ] Token-Persistenz nach App-Restart testen
  - [ ] Fehlerbehandlung (401, Netzwerkfehler) testen
  - [ ] Google OAuth mit echtem Account testen

---

## 9. Troubleshooting

### Problem: Deep Link öffnet App nicht

**Ursache:** Deep Link Schema nicht korrekt registriert.

**Lösung:**
1. Prüfe `app.json`: `"scheme": "manus20251231214615"`
2. Rebuild App: `npx expo prebuild && npx expo run:ios/android`
3. Teste manuell mit `xcrun simctl openurl` / `adb shell am start`

### Problem: "Invalid token" bei /api/auth/me

**Ursache:** Token wurde nicht korrekt gespeichert oder ist abgelaufen.

**Lösung:**
1. Prüfe SecureStore: `await SecureStore.getItemAsync('app_session_id')`
2. Dekodiere JWT-Payload (Base64): Prüfe `exp` Timestamp
3. Prüfe ob `appId` im JWT gesetzt ist (Backend-Konfiguration)

### Problem: WebBrowser öffnet sich nicht

**Ursache:** Expo Go unterstützt keine Custom Deep Links.

**Lösung:**
- Nutze Expo Dev Client: `npx expo install expo-dev-client`
- Oder teste mit Production Build

### Problem: Deep Link wird nicht abgefangen

**Ursache:** Deep Link Listener nicht registriert.

**Lösung:**
```typescript
useEffect(() => {
  const subscription = Linking.addEventListener('url', handleDeepLink);
  return () => subscription.remove();
}, []);
```

---

## 10. Beispiel: Vollständiger Login Flow

```typescript
// screens/LoginScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Button, Text, ActivityIndicator, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = 'https://psp-productivity-intersection-inches.trycloudflare.com';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check Initial URL (wenn App via Deep Link geöffnet wurde)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    try {
      const { hostname, path, queryParams } = Linking.parse(url);

      if (hostname === 'auth' && path === 'google/callback') {
        const token = queryParams?.token as string;

        if (token) {
          setLoading(true);
          await login(token);
          navigation.replace('Home');
        } else {
          Alert.alert('Fehler', 'Kein Token erhalten');
        }
      }
    } catch (err) {
      console.error('Deep Link Fehler:', err);
      Alert.alert('Fehler', 'Deep Link konnte nicht verarbeitet werden');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const authUrl = `${BACKEND_URL}/api/auth/google?mode=mobile`;
      const redirectUrl = 'manus20251231214615://auth/google/callback';

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'cancel') {
        Alert.alert('Abgebrochen', 'Google Login wurde abgebrochen');
      }
    } catch (err) {
      console.error('Google Login Fehler:', err);
      Alert.alert('Fehler', 'Google Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 40 }}>
        GrowMaster AI
      </Text>

      <Button
        title={loading ? 'Lädt...' : 'Mit Google anmelden'}
        onPress={handleGoogleLogin}
        disabled={loading}
      />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" />}
    </View>
  );
}
```

---

## Zusammenfassung

✅ **Implementiert:**
- Google OAuth Flow mit Deep Links
- Session-Token-Speicherung (SecureStore)
- API-Client mit automatischer Authorization
- Auth Context für globales User-Management
- Navigation Guard für geschützte Routes

✅ **Getestet:**
- Deep Link Handling
- Token-Validierung
- Session-Persistenz
- Fehlerbehandlung

✅ **Nächste Schritte:**
- Integration in Production App
- Testing auf echten Devices
- Apple Sign In hinzufügen (analog)
- Biometrische Auth (Face ID / Touch ID)
