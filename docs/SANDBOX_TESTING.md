# Sandbox Testing - GrowMaster AI

Diese Anleitung erklärt, wie du In-App-Käufe im Sandbox-Modus testen kannst, ohne echtes Geld auszugeben.

---

## Übersicht

RevenueCat und Google Play bieten Sandbox-Umgebungen, in denen du den kompletten Kaufprozess testen kannst. Sandbox-Käufe werden nicht berechnet und Abos erneuern sich in beschleunigten Intervallen.

| Sandbox-Verhalten | Produktions-Verhalten |
|-------------------|----------------------|
| Keine echte Zahlung | Echte Zahlung |
| Monatliches Abo erneuert alle 5 Minuten | Monatliches Abo erneuert nach 30 Tagen |
| Jährliches Abo erneuert alle 30 Minuten | Jährliches Abo erneuert nach 365 Tagen |
| Max. 6 Erneuerungen | Unbegrenzte Erneuerungen |

---

## 1. Google Play Sandbox einrichten

### 1.1 License Tester hinzufügen

1. Öffne die [Google Play Console](https://play.google.com/console)
2. Gehe zu **Setup** → **License testing**
3. Füge die E-Mail-Adressen deiner Tester hinzu:
   ```
   dein-test-account@gmail.com
   support@growmaster.app
   ```
4. Setze **License response** auf: `RESPOND_NORMALLY`
5. Klicke **"Save changes"**

### 1.2 Internal Testing Track

Für Sandbox-Tests muss die App über einen Test-Track installiert werden:

1. Gehe zu **Testing** → **Internal testing**
2. Erstelle einen neuen Release mit deiner APK/AAB
3. Füge Tester per E-Mail hinzu
4. Teile den **Opt-in Link** mit den Testern

> **Wichtig:** Tester müssen den Opt-in Link akzeptieren und die App über den Play Store installieren!

---

## 2. Test-Gerät vorbereiten

### 2.1 Voraussetzungen

- Android-Gerät oder Emulator mit Google Play Services
- Google-Account der als License Tester registriert ist
- App über Internal Testing Track installiert

### 2.2 Account prüfen

Stelle sicher, dass auf dem Testgerät:
1. Der richtige Google-Account als **primärer Account** eingeloggt ist
2. Der Account als License Tester in der Play Console registriert ist
3. Die App über den Play Store (nicht via APK-Sideload) installiert wurde

---

## 3. Sandbox-Käufe testen

### 3.1 Test-Szenario: Monatliches Abo

1. Öffne die GrowMaster AI App
2. Gehe zum **Paywall-Screen** (über Upgrade-Button)
3. Wähle **"Monatlich"**
4. Der Google Play Kaufdialog erscheint
5. Du siehst den Hinweis: **"This is a test purchase"**
6. Bestätige den Kauf

**Erwartetes Ergebnis:**
- Kauf wird sofort bestätigt
- Entitlement "GrowMaster AI Pro" ist aktiv
- Keine echte Zahlung erfolgt
- Abo erneuert sich alle 5 Minuten (Sandbox)

### 3.2 Test-Szenario: Restore Purchases

1. Deinstalliere die App
2. Installiere die App neu
3. Öffne die App und gehe zu **Einstellungen**
4. Tippe auf **"Käufe wiederherstellen"**

**Erwartetes Ergebnis:**
- Vorherige Käufe werden wiederhergestellt
- Pro-Status ist wieder aktiv

### 3.3 Test-Szenario: Kündigung

1. Öffne die **Google Play Store App**
2. Gehe zu **Abos**
3. Finde "GrowMaster AI"
4. Tippe auf **"Abo kündigen"**

**Erwartetes Ergebnis:**
- Abo wird zum Ende der Laufzeit gekündigt
- In der App: `willRenew` ist `false`
- Nach Ablauf: Entitlement wird entfernt

---

## 4. RevenueCat Sandbox Dashboard

RevenueCat bietet ein separates Dashboard für Sandbox-Transaktionen:

1. Öffne das [RevenueCat Dashboard](https://app.revenuecat.com)
2. Wähle dein Projekt **"GrowMaster AI"**
3. Gehe zu **Customers**
4. Aktiviere den Filter **"Sandbox"**

Hier siehst du:
- Alle Test-Transaktionen
- Aktive Entitlements
- Subscription-Status
- Event-Historie

### 4.1 Customer Details prüfen

1. Suche nach deinem Test-User (App User ID)
2. Klicke auf den User
3. Prüfe:
   - **Active Entitlements**: Sollte "GrowMaster AI Pro" zeigen
   - **Subscription Status**: Active
   - **Management URL**: Link zur Google Play Abo-Verwaltung

---

## 5. Debug-Logs in der App

Die App loggt alle RevenueCat-Aktivitäten. Um Logs zu sehen:

### 5.1 Android Studio Logcat

```bash
adb logcat | grep -E "\[Purchases\]|\[PurchaseContext\]"
```

### 5.2 Erwartete Log-Ausgaben

**Bei App-Start:**
```
[Purchases] RevenueCat initialized successfully with key: test_tEDiR...
[Purchases] Current offering: default
[Purchases] Available packages: 3
[Purchases]   - $rc_monthly: €4,99
[Purchases]   - $rc_annual: €35,99
[Purchases]   - $rc_lifetime: €89,99
```

**Bei Kauf:**
```
[Purchases] Attempting purchase: $rc_monthly
[Purchases] Purchase successful! Pro active: true
```

**Bei Restore:**
```
[Purchases] Restoring purchases...
[Purchases] Restore successful! Pro active: true
```

---

## 6. Häufige Probleme und Lösungen

### Problem: "Item not available"

**Ursache:** Produkt nicht aktiv oder nicht mit RevenueCat verknüpft

**Lösung:**
1. Prüfe in Google Play Console ob Produkt aktiviert ist
2. Prüfe in RevenueCat ob Produkt importiert wurde
3. Warte 24 Stunden (Google Play API Verzögerung)

### Problem: "This version of the app is not configured for billing"

**Ursache:** App nicht über Play Store installiert

**Lösung:**
1. Deinstalliere die App
2. Installiere über Internal Testing Track
3. Stelle sicher dass der richtige Account eingeloggt ist

### Problem: Entitlement nicht aktiv nach Kauf

**Ursache:** Entitlement nicht mit Produkt verknüpft

**Lösung:**
1. Gehe zu RevenueCat → Products
2. Prüfe ob "GrowMaster AI Pro" Entitlement zugewiesen ist
3. Führe "Restore Purchases" in der App aus

### Problem: Sandbox-Käufe erscheinen nicht in RevenueCat

**Ursache:** Service Account Credentials fehlen oder falsch

**Lösung:**
1. Prüfe Google Cloud Service Account
2. Prüfe Berechtigungen in Play Console
3. Lade JSON-Key erneut in RevenueCat hoch

---

## 7. Test-Checkliste

Führe alle Tests durch bevor du live gehst:

### Kauf-Tests
- [ ] Monatliches Abo kaufen
- [ ] Jährliches Abo kaufen
- [ ] Lifetime kaufen
- [ ] Kauf abbrechen (User cancels)

### Restore-Tests
- [ ] Käufe nach Neuinstallation wiederherstellen
- [ ] Käufe nach Logout/Login wiederherstellen

### Entitlement-Tests
- [ ] Pro-Features nach Kauf verfügbar
- [ ] Pro-Features nach Restore verfügbar
- [ ] Free-Limits nach Kündigung aktiv

### Edge Cases
- [ ] Offline-Kauf (Gerät offline während Kauf)
- [ ] Doppelter Kauf-Versuch
- [ ] Wechsel zwischen Abo-Typen

---

## 8. Von Sandbox zu Produktion

Wenn alle Tests erfolgreich sind:

1. **API Key wechseln:**
   - Erstelle einen neuen **Production API Key** in RevenueCat
   - Ersetze `test_tEDiRPvpJterHZOUuSHVMqocEXE` in der App

2. **App veröffentlichen:**
   - Erstelle einen Production Release in Google Play
   - Durchlaufe den Review-Prozess

3. **Monitoring einrichten:**
   - Aktiviere RevenueCat Webhooks
   - Richte Alerts für fehlgeschlagene Käufe ein

---

## Zusammenfassung

| Test | Status |
|------|--------|
| License Tester eingerichtet | ⬜ |
| Internal Testing Track aktiv | ⬜ |
| Monatliches Abo getestet | ⬜ |
| Jährliches Abo getestet | ⬜ |
| Lifetime getestet | ⬜ |
| Restore getestet | ⬜ |
| Kündigung getestet | ⬜ |
| RevenueCat Dashboard geprüft | ⬜ |

Markiere jeden Test als erledigt (✅) wenn erfolgreich!
