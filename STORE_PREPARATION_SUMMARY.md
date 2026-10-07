# App-Store-Vorbereitung - Executive Summary

**Projekt:** GrowMaster AI  
**Geprüft am:** 6. Oktober 2026  
**Status:** Bereit für Pre-Launch-Phase, **aber kritische Assets fehlen**

---

## ✅ Was ist bereits vorhanden?

### 1. App-Konfiguration (app.config.ts)
- [x] Vollständig konfiguriert
- [x] Bundle-IDs korrekt: `com.growmasterai.app`
- [x] Version 1.0.0, versionCode 1
- [x] Icons & Splash Screen vorhanden (aber zu klein)
- [x] Alle Permissions definiert
- [x] Android Build-Config korrekt (SDK 24-35)

### 2. EAS Build-Setup (eas.json)
- [x] Development, Preview, Production Profiles konfiguriert
- [x] Android AAB für Production
- [x] Submit-Config vorhanden (benötigt Service Account JSON)

### 3. Rechtliche Dokumente
- [x] Privacy Policy vorhanden (`legal/privacy.md`)
- [x] Terms of Service vorhanden (`legal/terms.md`)
- [x] HTML-Versionen vorhanden (`docs/legal/*.html`)
- [x] DSGVO-konform strukturiert
- [x] URLs definiert: `https://hoodkitz.github.io/growmasterai-legal/`

### 4. Store Listings
- [x] Play Store Beschreibung fertig (`docs/PLAY_STORE_LISTING.md`)
- [x] Kurzbeschreibung (DE): "KI-Pflanzendiagnose, Grow-Coach & Community fuer Cannabis-Anbau"
- [x] Vollständige Beschreibung mit Features
- [x] Keywords definiert

---

## 🚨 KRITISCHE BLOCKER (muss vor Submission erledigt werden!)

### 1. ⚠️ App Icons - FALSCHE GRÖßE!
**Problem:**
- Aktuell: `icon.png` ist nur **500 x 500 px**
- iOS benötigt: **1024 x 1024 px** (ohne Transparenz)
- Android benötigt: **512 x 512 px**

**Lösung:** Siehe `SCREENSHOT_GUIDE.md` Abschnitt "App Icon"

---

### 2. ⚠️ Screenshots - KOMPLETT FEHLEND!
**Problem:**
- Keine Store-Screenshots vorhanden
- iOS benötigt min. 3 Screenshots (1290 x 2796 px)
- Android benötigt min. 2 Screenshots (1080 x 1920 px)

**Benötigte Screens (8 total):**
1. Home Dashboard
2. KI-Diagnose
3. AI Coach Chat
4. Grow Journal
5. Sorten-Datenbank
6. Community Feed
7. Marketplace
8. Achievements

**Lösung:** Siehe `SCREENSHOT_GUIDE.md` für komplette Anleitung

---

### 3. ⚠️ Impressum - PLATZHALTER NICHT ERSETZT!
**Problem:**
Sowohl `privacy.md` als auch `terms.md` enthalten:
```
**GrowMaster AI**
[Ihr Name / Firma]    ← PLATZHALTER!
[Adresse]             ← PLATZHALTER!
[PLZ Ort]             ← PLATZHALTER!
```

**Muss ersetzt werden durch:**
```
**GrowMaster AI**
Julien Paarmann
[Vollständige Straße + Hausnummer]
[PLZ Ort]
Deutschland
```

**Rechtliche Konsequenz:** 
- Ohne gültiges Impressum: App-Ablehnung durch Apple/Google
- DSGVO-Verstoß (Art. 13/14)
- TMG § 5 Verstoß (Impressumspflicht)
- Abmahnrisiko bis 50.000€

**Lösung:** Siehe `LEGAL_DOCUMENTS_FIXES_REQUIRED.md`

---

### 4. ⚠️ Feature Graphic (Android) - FEHLT
**Problem:**
- Google Play benötigt 1024 x 500 px Header-Grafik
- Nicht vorhanden

**Lösung:** Siehe `SCREENSHOT_GUIDE.md` Abschnitt "Feature Graphic"

---

### 5. ⚠️ Online-Verfügbarkeit der Legal-URLs
**Problem:**
- URLs definiert, aber nicht geprüft ob online erreichbar
- `https://hoodkitz.github.io/growmasterai-legal/privacy.html`
- `https://hoodkitz.github.io/growmasterai-legal/terms.html`

**Aktion:** 
- GitHub Pages Deployment prüfen
- URLs testen

---

## 📋 Zusätzliche Anforderungen (vor Submission)

### Developer Accounts
- [ ] **Apple Developer Program:** $99/Jahr registrieren
- [ ] **Google Play Console:** $25 einmalig registrieren

### App Signing
- [ ] **iOS:** Certificates & Provisioning Profiles erstellen
- [ ] **Android:** Keystore generieren & sichern

### RevenueCat Setup
- [ ] RevenueCat Project erstellen
- [ ] Products konfigurieren:
  - Premium Monthly (€4.99)
  - Premium Yearly (€39.99)
  - Pro Monthly (€9.99)
  - Pro Yearly (€79.99)
- [ ] In-App Products in App Store Connect erstellen
- [ ] In-App Products in Play Console erstellen

### Google Play Service Account
- [ ] `google-play-service-account.json` erstellen (für auto-submit)

---

## 📊 Dokumentation erstellt

Folgende Dokumente wurden generiert:

1. **`APP_STORE_CHECKLIST.md`**
   - Komplette Pre-Launch-Checkliste
   - Alle Store-Anforderungen
   - Timeline-Empfehlung (4 Wochen)

2. **`LEGAL_DOCUMENTS_FIXES_REQUIRED.md`**
   - Detaillierte Anleitung zur Impressums-Korrektur
   - Rechtliche Begründung
   - Schritt-für-Schritt-Fixes

3. **`SCREENSHOT_GUIDE.md`**
   - Anleitung für Screenshot-Erstellung
   - Icon-Upscaling-Methoden
   - Feature Graphic Design-Tipps
   - Ordnerstruktur-Empfehlung

---

## 🎯 Empfohlene Vorgehensweise

### Phase 1: Kritische Fixes (1-2 Tage)
1. **Impressum vervollständigen** in Privacy & Terms
2. **App Icons erstellen** (1024x1024 & 512x512)
3. **Legal-Seiten online deployen** und URLs testen

### Phase 2: Store Assets (3-5 Tage)
4. **Screenshots erstellen** (alle 8 Screens, iOS + Android)
5. **Feature Graphic erstellen** (1024x500)
6. **Optional:** Device Frames & Marketing-Overlays hinzufügen

### Phase 3: Accounts & Setup (3-5 Tage)
7. **Developer Accounts** registrieren (Apple + Google)
8. **App Signing** konfigurieren (Certificates, Keystore)
9. **RevenueCat** komplett einrichten + In-App Products

### Phase 4: Testing & Launch (7-14 Tage)
10. **TestFlight/Internal Testing** Beta
11. **Feedback sammeln** & Bugs fixen
12. **Store Listings finalisieren**
13. **Submission** zu App Store & Play Store
14. **Review-Prozess abwarten** (7-14 Tage iOS, 2-7 Tage Android)

**Gesamtdauer:** Ca. 4 Wochen bis zum Launch

---

## ✅ Sofort-Aktionen

**Starte mit diesen 3 Schritten:**

1. **Impressum ergänzen:**
   ```bash
   # Bearbeite diese Dateien:
   nano legal/privacy.md      # Zeilen 46-50
   nano legal/terms.md        # Zeilen 14-17
   ```

2. **Icons hochskalieren:**
   ```bash
   # Mit ImageMagick oder Online-Tool (upscale.media)
   # Ziel: 1024x1024px (iOS) & 512x512px (Android)
   ```

3. **Screenshots-Ordner vorbereiten:**
   ```bash
   cd ~/projects/growmasterai-app
   mkdir -p store-assets/screenshots/ios/6.7-inch
   mkdir -p store-assets/screenshots/android/phone
   mkdir -p store-assets/icons
   ```

---

## 📞 Support & Weitere Infos

- **Komplette Checkliste:** `APP_STORE_CHECKLIST.md`
- **Legal Fixes:** `LEGAL_DOCUMENTS_FIXES_REQUIRED.md`
- **Screenshot-Anleitung:** `SCREENSHOT_GUIDE.md`
- **Bestehende Docs:** `docs/PLAY_STORE_LISTING.md`, `docs/GOOGLE_PLAY_SETUP.md`

---

**Status:** ⚠️ **Nicht bereit für Submission** - Kritische Assets fehlen  
**Nächster Meilenstein:** Impressum + Icons + Screenshots = **Launch-ready**

**Letzte Prüfung:** 6. Oktober 2026
