# Google Play Console Setup - GrowMaster AI

Diese Anleitung führt dich durch die Erstellung der In-App-Produkte in der Google Play Console für die GrowMaster AI App.

---

## Voraussetzungen

Bevor du beginnst, stelle sicher dass:
- Du einen **Google Play Developer Account** hast ($25 einmalige Gebühr)
- Die App bereits in der Play Console als Draft angelegt ist
- Du Zugriff auf die **Monetarisierung**-Sektion hast

---

## 1. App in Google Play Console anlegen

Falls noch nicht geschehen:

1. Gehe zu [https://play.google.com/console](https://play.google.com/console)
2. Klicke **"Create app"**
3. Fülle die Grundinformationen aus:

| Feld | Wert |
|------|------|
| **App name** | GrowMaster AI |
| **Default language** | Deutsch (Deutschland) |
| **App or game** | App |
| **Free or paid** | Free |

4. Akzeptiere die Bedingungen und klicke **"Create app"**

---

## 2. Subscriptions erstellen

### 2.1 Monthly Subscription

1. Gehe zu **Monetize** → **Products** → **Subscriptions**
2. Klicke **"Create subscription"**
3. Fülle aus:

| Feld | Wert |
|------|------|
| **Product ID** | `monthly` |
| **Name** | GrowMaster Pro Monatlich |
| **Description** | Monatliches Abo für alle Pro-Features |

4. Klicke **"Create"**

5. Erstelle ein **Base plan**:
   - Klicke **"Add base plan"**
   - **Base plan ID**: `monthly-base`
   - **Renewal type**: Auto-renewing
   - **Billing period**: 1 Month
   - **Grace period**: 7 days (empfohlen)

6. Füge **Preise** hinzu:
   - Klicke **"Set prices"**
   - Wähle **Germany** als Hauptmarkt
   - Preis: **€4,99** / Monat
   - Klicke **"Update prices"** um Preise für andere Länder automatisch zu berechnen

7. **Aktiviere** das Base plan

---

### 2.2 Yearly Subscription

1. Klicke erneut **"Create subscription"**
2. Fülle aus:

| Feld | Wert |
|------|------|
| **Product ID** | `yearly` |
| **Name** | GrowMaster Pro Jährlich |
| **Description** | Jährliches Abo - spare 40%! |

3. Erstelle ein **Base plan**:
   - **Base plan ID**: `yearly-base`
   - **Renewal type**: Auto-renewing
   - **Billing period**: 1 Year
   - **Grace period**: 14 days

4. Füge **Preise** hinzu:
   - Preis: **€35,99** / Jahr (entspricht ~€3/Monat, 40% Ersparnis)

5. **Optional:** Füge ein **Offer** hinzu für Erstnutzer:
   - Klicke **"Add offer"**
   - **Offer ID**: `yearly-intro`
   - **Eligibility**: New customer acquisition
   - **Offer type**: Free trial
   - **Duration**: 7 days

6. **Aktiviere** das Base plan

---

### 2.3 Lifetime Purchase (One-Time)

Für Lifetime-Käufe verwendest du ein **In-app product** statt einer Subscription:

1. Gehe zu **Monetize** → **Products** → **In-app products**
2. Klicke **"Create product"**
3. Fülle aus:

| Feld | Wert |
|------|------|
| **Product ID** | `lifetime` |
| **Name** | GrowMaster Pro Lifetime |
| **Description** | Einmalzahlung für lebenslangen Zugang |

4. Füge **Preise** hinzu:
   - Preis: **€89,99** (einmalig)

5. **Aktiviere** das Produkt

---

## 3. Produkt-Übersicht

Nach der Einrichtung solltest du folgende Produkte haben:

| Product ID | Typ | Preis | Billing |
|------------|-----|-------|---------|
| `monthly` | Subscription | €4,99 | Monatlich |
| `yearly` | Subscription | €35,99 | Jährlich |
| `lifetime` | In-app product | €89,99 | Einmalig |

---

## 4. Lizenz-Testing einrichten

Um Käufe zu testen ohne echtes Geld auszugeben:

### 4.1 License Tester hinzufügen

1. Gehe zu **Setup** → **License testing**
2. Füge deine Test-E-Mail-Adressen hinzu:
   - `deine-email@gmail.com`
   - `support@growmaster.app`
3. Wähle **License response**: `RESPOND_NORMALLY`

### 4.2 Internal Testing Track

1. Gehe zu **Testing** → **Internal testing**
2. Klicke **"Create new release"**
3. Lade eine signierte APK/AAB hoch
4. Füge Tester hinzu (E-Mail-Liste)
5. **Review and roll out**

> **Wichtig:** Nur Nutzer auf dem Internal Testing Track können Test-Käufe durchführen!

---

## 5. Verknüpfung mit RevenueCat prüfen

Nachdem die Produkte erstellt sind:

1. Gehe zurück zu **RevenueCat Dashboard**
2. Navigiere zu **Products**
3. Klicke auf jedes Produkt und dann **"Import"**
4. RevenueCat sollte die Produkte aus Google Play automatisch erkennen

Falls nicht:
- Prüfe ob die Service Account Credentials korrekt sind
- Stelle sicher dass die Product IDs exakt übereinstimmen
- Warte 24-48 Stunden (Google Play API kann verzögert sein)

---

## 6. App-Signierung einrichten

Für Produktions-Releases:

1. Gehe zu **Setup** → **App signing**
2. Aktiviere **Google Play App Signing** (empfohlen)
3. Lade deinen Upload Key hoch oder lass Google einen erstellen

### Keystore erstellen (falls nötig)

```bash
keytool -genkey -v -keystore growmaster-upload.keystore \
  -alias growmaster -keyalg RSA -keysize 2048 -validity 10000
```

---

## 7. Store Listing vorbereiten

Für die Veröffentlichung benötigst du:

| Element | Anforderung |
|---------|-------------|
| **App Icon** | 512x512 PNG |
| **Feature Graphic** | 1024x500 PNG |
| **Screenshots** | Mind. 2 pro Gerätekategorie |
| **Short description** | Max. 80 Zeichen |
| **Full description** | Max. 4000 Zeichen |
| **Privacy Policy URL** | Pflicht für Apps mit Käufen |

---

## Checkliste vor dem Launch

- [ ] Alle 3 Produkte erstellt und aktiviert
- [ ] Preise für alle Zielmärkte festgelegt
- [ ] License Tester hinzugefügt
- [ ] Internal Testing Release erstellt
- [ ] RevenueCat Verknüpfung geprüft
- [ ] App-Signierung eingerichtet
- [ ] Store Listing vollständig
- [ ] Datenschutzerklärung verlinkt

---

## Nächster Schritt

Nachdem Google Play eingerichtet ist, kannst du mit dem **Sandbox-Testing** beginnen. Siehe: [SANDBOX_TESTING.md](./SANDBOX_TESTING.md)
