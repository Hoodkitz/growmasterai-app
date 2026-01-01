# RevenueCat Dashboard Setup - GrowMaster AI

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung von RevenueCat für deine GrowMaster AI App.

---

## 1. RevenueCat Account erstellen

Besuche [https://app.revenuecat.com/signup](https://app.revenuecat.com/signup) und erstelle einen kostenlosen Account. RevenueCat ist kostenlos bis zu **$2.500 monatlichem Umsatz** (MTR), danach fallen 1% Gebühren an.

Nach der Registrierung wirst du zum Dashboard weitergeleitet.

---

## 2. Neues Projekt anlegen

1. Klicke im Dashboard auf **"Create new project"**
2. Gib als Projektnamen ein: **GrowMaster AI**
3. Klicke auf **"Create project"**

---

## 3. Android App hinzufügen

1. Im Projekt, klicke auf **"+ Add app"**
2. Wähle **"Google Play Store"** als Plattform
3. Gib folgende Informationen ein:

| Feld | Wert |
|------|------|
| **App name** | GrowMaster AI |
| **Google Play package** | `space.manus.growmaster.app` (oder dein Package Name aus app.config.ts) |

4. Klicke auf **"Save changes"**

### Google Play Service Credentials einrichten

RevenueCat benötigt Zugriff auf die Google Play Developer API:

1. Gehe zu **Google Cloud Console** → [https://console.cloud.google.com](https://console.cloud.google.com)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere die **Google Play Android Developer API**
4. Erstelle einen **Service Account**:
   - Gehe zu "IAM & Admin" → "Service Accounts"
   - Klicke "Create Service Account"
   - Name: `revenuecat-service`
   - Klicke "Create and Continue"
   - Rolle: Keine (wird in Play Console vergeben)
   - Klicke "Done"
5. Erstelle einen **JSON Key**:
   - Klicke auf den erstellten Service Account
   - Tab "Keys" → "Add Key" → "Create new key"
   - Format: JSON
   - Speichere die Datei sicher!

6. In der **Google Play Console** ([https://play.google.com/console](https://play.google.com/console)):
   - Gehe zu "Users and permissions" → "Invite new users"
   - E-Mail: Die Service Account E-Mail (endet auf `@...iam.gserviceaccount.com`)
   - Berechtigungen:
     - ✅ View app information and download bulk reports
     - ✅ View financial data, orders, and cancellation survey responses
     - ✅ Manage orders and subscriptions
   - Klicke "Invite user"

7. Zurück in **RevenueCat**:
   - Gehe zu Project Settings → Google Play Store
   - Lade die JSON-Datei hoch unter "Service Account credentials"
   - Klicke "Save changes"

---

## 4. Entitlement erstellen

Entitlements definieren, welche Features ein Nutzer nach dem Kauf freischalten kann.

1. Gehe zu **"Entitlements"** im linken Menü
2. Klicke **"+ New"**
3. Erstelle folgendes Entitlement:

| Feld | Wert |
|------|------|
| **Identifier** | `GrowMaster AI Pro` |
| **Description** | Vollzugriff auf alle Premium-Features |

4. Klicke **"Add"**

---

## 5. Produkte anlegen

Produkte in RevenueCat müssen mit den Produkt-IDs in Google Play übereinstimmen.

### 5.1 Produkte erstellen

Gehe zu **"Products"** im linken Menü und erstelle diese drei Produkte:

| Identifier | Store | Store Product ID | Entitlement |
|------------|-------|------------------|-------------|
| `monthly` | Google Play | `monthly` | GrowMaster AI Pro |
| `yearly` | Google Play | `yearly` | GrowMaster AI Pro |
| `lifetime` | Google Play | `lifetime` | GrowMaster AI Pro |

Für jedes Produkt:
1. Klicke **"+ New"**
2. Wähle **"Google Play Store"** als App
3. Gib die **Product Identifier** ein (z.B. `monthly`)
4. Wähle das Entitlement **"GrowMaster AI Pro"**
5. Klicke **"Add"**

---

## 6. Offering konfigurieren

Offerings gruppieren Produkte zu Paketen, die dem Nutzer angezeigt werden.

1. Gehe zu **"Offerings"** im linken Menü
2. Das Default Offering sollte bereits existieren
3. Klicke auf **"default"** um es zu bearbeiten
4. Füge **Packages** hinzu:

| Package | Product |
|---------|---------|
| `$rc_monthly` | monthly |
| `$rc_annual` | yearly |
| `$rc_lifetime` | lifetime |

Für jedes Package:
1. Klicke **"+ New"** unter Packages
2. Wähle den Package-Typ (Monthly, Annual, Lifetime)
3. Wähle das entsprechende Produkt
4. Klicke **"Add"**

---

## 7. API Keys notieren

Für die App benötigst du den **Public API Key**:

1. Gehe zu **Project Settings** → **API Keys**
2. Kopiere den **Public app-specific API key** für Android
3. Dieser Key ist bereits in der App konfiguriert: `test_tEDiRPvpJterHZOUuSHVMqocEXE`

> **Wichtig:** Für die Produktion solltest du einen neuen API Key erstellen und den Test-Key ersetzen!

---

## 8. Webhook einrichten (Optional)

Für Server-seitige Validierung:

1. Gehe zu **Project Settings** → **Integrations** → **Webhooks**
2. Klicke **"+ New"**
3. URL: `https://deine-domain.com/api/webhooks/revenuecat`
4. Wähle die Events:
   - ✅ Initial Purchase
   - ✅ Renewal
   - ✅ Cancellation
   - ✅ Expiration
5. Klicke **"Save"**

---

## Zusammenfassung der Konfiguration

| Element | Wert |
|---------|------|
| **Projekt** | GrowMaster AI |
| **Entitlement** | GrowMaster AI Pro |
| **Produkte** | monthly, yearly, lifetime |
| **API Key** | test_tEDiRPvpJterHZOUuSHVMqocEXE |

---

## Nächster Schritt

Nachdem RevenueCat eingerichtet ist, müssen die Produkte in der **Google Play Console** erstellt werden. Siehe: [GOOGLE_PLAY_SETUP.md](./GOOGLE_PLAY_SETUP.md)
