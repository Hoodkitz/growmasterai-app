# Screenshot & Store Assets Erstellung - Anleitung

## 📸 Übersicht: Benötigte Screenshots

Für einen erfolgreichen App-Store-Launch brauchst du professionelle Screenshots in verschiedenen Größen für iOS und Android.

---

## 📱 iOS App Store Screenshots

### Erforderliche Auflösungen

Apple verlangt Screenshots für verschiedene Gerätetypen. **Mindestens** die größte Auflösung pro Geräteklasse ist Pflicht:

| Gerätetyp | Auflösung (Portrait) | Anzahl | Priorität |
|-----------|---------------------|--------|-----------|
| **iPhone 6.7"** (14 Pro Max, 15 Pro Max) | 1290 x 2796 px | Min. 3, Max. 10 | ⭐⭐⭐ PFLICHT |
| iPhone 6.5" (XS Max, 11 Pro Max) | 1242 x 2688 px | Min. 3, Max. 10 | ⭐⭐ Empfohlen |
| iPhone 5.5" (8 Plus) | 1242 x 2208 px | Min. 3, Max. 10 | ⭐ Optional |
| **iPad Pro 12.9"** (3. Gen+) | 2048 x 2732 px | Min. 3, Max. 10 | Falls iPad unterstützt |

**Format:** PNG oder JPG (RGB, kein Alpha)  
**Farbraum:** sRGB oder P3

### Wichtige Hinweise für iOS
- Screenshots müssen **pixelgenau** die angegebene Auflösung haben
- Hochformat (Portrait) für alle Phone-Screenshots
- Kein Geräte-Rahmen ("Device Frame") erforderlich, aber erlaubt
- Keine Statusbar oben nötig (wird von Apple hinzugefügt)

---

## 🤖 Google Play Store Screenshots

### Erforderliche Auflösungen

Android ist flexibler, aber bestimmte Mindestanforderungen müssen erfüllt werden:

| Gerätetyp | Empfohlene Auflösung | Min./Max. | Anzahl | Priorität |
|-----------|---------------------|-----------|--------|-----------|
| **Smartphone** | 1080 x 1920 px oder höher | Min: 320px, Max: 3840px | Min. 2, Max. 8 | ⭐⭐⭐ PFLICHT |
| 7" Tablet | 1200 x 1920 px | Min: 320px, Max: 3840px | Min. 2, Max. 8 | ⭐ Optional |
| 10" Tablet | 1600 x 2560 px | Min: 320px, Max: 3840px | Min. 2, Max. 8 | ⭐ Optional |

**Format:** PNG oder JPG (24-bit, kein Alpha)  
**Seitenverhältnis:** 16:9 oder 9:16 empfohlen

### Zusätzliche Assets für Google Play
- **Feature Graphic:** 1024 x 500 px (PFLICHT für Header)
- **Promo Video:** Optional, max. 2 Minuten (YouTube-Link)

---

## 🎨 Welche Screens fotografieren?

Gemäß `PLAY_STORE_LISTING.md` solltest du folgende 8 Haupt-Screens zeigen:

### 1. Home Dashboard mit Pflanzen-Übersicht
**Route:** `/` (app/(tabs)/index.tsx)
- Zeigt alle Pflanzen des Nutzers
- Übersicht über Wachstumsphasen
- Navigation zu anderen Features
- **Wichtig:** Zeigt den Hauptwert der App

### 2. KI-Diagnose mit Kamera-Interface
**Route:** `/diagnose` (app/(tabs)/diagnose.tsx)
- Kamera-Aufnahme-Screen
- Oder: Upload von Galerie
- **Alternativ:** Ergebnis-Screen mit KI-Analyse
- **Wichtig:** Zeigt Haupt-KI-Feature

### 3. AI Coach Chat
**Route:** `/coach` (app/(tabs)/coach.tsx)
- Chat-Interface mit Grow-Coach
- Beispiel-Konversation zu einem Grow-Problem
- **Wichtig:** Zeigt persönlichen AI-Assistenten

### 4. Grow Journal Eintrag
**Route:** `/journal` (app/(tabs)/journal.tsx)
- Tagebuch mit Fotos und Notizen
- Messwerte (pH, EC, Temperatur)
- Fortschritts-Dokumentation
- **Wichtig:** Zeigt Tracking-Funktionalität

### 5. Sorten-Datenbank Ansicht
**Route:** (vermutlich Unterseite von Plants)
- Liste von Cannabis-Strains
- THC/CBD-Gehalte
- Blütezeiten, Ertrag, Schwierigkeit
- **Wichtig:** Zeigt Wissensdatenbank

### 6. Community Feed
**Route:** `/community` (app/(tabs)/community.tsx)
- Social-Feed mit Posts
- Likes, Kommentare
- Interaktion mit anderen Growern
- **Wichtig:** Zeigt Community-Aspekt

### 7. Marketplace/Shop
**Route:** `/marketplace` (app/marketplace.tsx)
- Produkt-Katalog (Seeds, Nährstoffe, Equipment)
- Vendor-Angebote
- Bewertungen
- **Wichtig:** Zeigt Shopping-Funktion

### 8. Gamification / Achievements
**Route:** (vermutlich Settings oder Profil)
- Level-System & XP-Anzeige
- Freigeschaltete Achievements/Badges
- Leaderboard
- Streak-System
- **Wichtig:** Zeigt Motivations-Features

---

## 🛠️ Screenshot-Erstellung: Schritt-für-Schritt

### Option A: Simulator/Emulator Screenshots (Einfachste Methode)

#### iOS (Xcode Simulator)
1. **Simulator starten:**
   ```bash
   cd ~/projects/growmasterai-app
   pnpm ios
   ```

2. **Gerät wählen:**
   - Menü: File → Open Simulator → iPhone 15 Pro Max (6.7")

3. **Screenshots machen:**
   - Tastenkombination: `Cmd + S`
   - Oder: Menü → Device → Screenshot
   - Speicherort: Desktop
   - **Format:** Automatisch 1290 x 2796 px PNG

4. **Zu jedem Screen navigieren:**
   - Navigiere zu /home, /diagnose, /coach, etc.
   - Mache jeweils Screenshot
   - Wiederhole für iPhone XS Max (6.5") falls nötig

#### Android (Android Studio Emulator)
1. **Emulator starten:**
   ```bash
   cd ~/projects/growmasterai-app
   pnpm android
   ```

2. **Gerät wählen:**
   - Android Studio → AVD Manager
   - Pixel 7 Pro (1440 x 3120) oder ähnlich

3. **Screenshots machen:**
   - Emulator-Toolbar → Camera-Icon
   - Oder: Android Studio → Screenshot-Tool
   - **Format:** Wird automatisch korrekt gespeichert

4. **Speichern:**
   - Speicherort wählen (z.B. `~/projects/growmasterai-app/store-assets/screenshots/android/`)

### Option B: Physisches Gerät (Beste Qualität)

#### iOS (iPhone)
1. **App auf physischem iPhone installieren:**
   ```bash
   eas build --profile preview --platform ios
   # Über TestFlight installieren
   ```

2. **Screenshots machen:**
   - Seitentaste + Lauter-Taste gleichzeitig
   - Screenshots landen in Fotos-App

3. **Übertragen:**
   - AirDrop zum Mac
   - Oder: iCloud Photos Sync
   - Oder: USB-Kabel + Image Capture App

#### Android (Smartphone)
1. **App installieren:**
   ```bash
   eas build --profile preview --platform android
   # APK herunterladen & installieren
   ```

2. **Screenshots machen:**
   - Power + Leiser-Taste gleichzeitig
   - Screenshots landen in Galerie

3. **Übertragen:**
   - USB-Kabel + Android File Transfer
   - Oder: Google Drive/Dropbox Upload

### Option 3: Professionelle Tools (Empfohlen für Marketing)

#### Screenshot-Design mit Frames
Tools wie **Figma**, **Sketch**, oder **Shotsnapp.com** erlauben:
- Device-Frames hinzufügen (iPhone/Android Gehäuse)
- Text-Overlays ("KI-Diagnose in Sekunden!")
- Hintergrund-Effekte
- Mehrere Screens in einem Bild

**Workflow:**
1. Screenshots aus Simulator/Emulator extrahieren
2. In Figma/Sketch importieren
3. Device-Frame hinzufügen
4. Marketing-Text als Overlay
5. Exportieren in korrekter Auflösung

#### Screenshot-Generator-Services
- **AppLaunchpad.com:** Automatische Screenshot-Generierung
- **DaVinci Apps:** Screenshot-Mockup-Tool
- **Placeit.net:** Device-Mockups mit Hintergründen

---

## 🖼️ App Icon - Korrekte Größen

### Aktueller Status
- **Vorhanden:** 500 x 500 px (`assets/images/icon.png`)
- **Problem:** Zu klein für App Stores!

### Erforderliche Größen

#### iOS App Store
- **1024 x 1024 px**
- Format: PNG (kein Alpha/Transparenz!)
- Farbraum: sRGB oder P3
- **Keine abgerundeten Ecken** (Apple fügt automatisch hinzu)

#### Google Play Store
- **512 x 512 px**
- Format: PNG (32-bit)
- Transparenz erlaubt (Hintergrund kann transparent sein)

### Icon-Erstellung: Anleitung

#### Option 1: Upscaling mit Bildbearbeitung
```bash
# Mit ImageMagick (falls installiert)
convert assets/images/icon.png -resize 1024x1024 assets/store-assets/icon-ios-1024.png
convert assets/images/icon.png -resize 512x512 assets/store-assets/icon-android-512.png
```

**Problem:** Bei Upscaling von 500px kann Qualitätsverlust entstehen!

#### Option 2: Professionelle Neugestaltung (EMPFOHLEN)
1. **Original-Design laden** (falls Vektordatei vorhanden: SVG, AI, Sketch)
2. **In Figma/Illustrator öffnen**
3. **Artboard auf 1024x1024px setzen**
4. **Exportieren als PNG:**
   - iOS: 1024x1024px, kein Alpha
   - Android: 512x512px, Alpha erlaubt

#### Option 3: AI-Tool nutzen
- **Upscale.media:** KI-basiertes Upscaling auf 1024x1024px
- **Let's Enhance:** Foto-Upscaling ohne Qualitätsverlust

### Icon-Checkliste
- [ ] iOS: 1024x1024px PNG ohne Transparenz
- [ ] Android: 512x512px PNG
- [ ] Kein Text im Icon (lesbar auch bei 40x40px)
- [ ] Hoher Kontrast für Sichtbarkeit
- [ ] Unique & wiedererkennbar

---

## 📐 Feature Graphic (nur Google Play)

### Spezifikationen
- **Größe:** 1024 x 500 px
- **Format:** PNG oder JPG (24-bit)
- **Zweck:** Header-Bild im Play Store

### Design-Tipps
- App-Icon + App-Name + Slogan
- Zeige 2-3 Haupt-Features (KI-Diagnose, Grow-Coach, Community)
- Verwende Brand-Farben (#10B981 Grün, #0A0F0D Dunkel)
- Kein kleiner Text (schwer lesbar)

### Template-Idee
```
┌──────────────────────────────────────────────────────┐
│                                                        │
│  [App Icon]  GrowMaster AI                           │
│              KI-Pflanzendiagnose & Grow-Coach         │
│                                                        │
│  [Screenshot 1]  [Screenshot 2]  [Screenshot 3]      │
│   Diagnose        AI Coach        Community          │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 📂 Empfohlene Ordnerstruktur

Erstelle folgende Struktur für alle Assets:

```
growmasterai-app/
├── store-assets/
│   ├── icons/
│   │   ├── ios-1024.png          # 1024x1024 für App Store
│   │   ├── android-512.png       # 512x512 für Play Store
│   │   └── source.svg            # Original-Vektordatei (falls vorhanden)
│   ├── screenshots/
│   │   ├── ios/
│   │   │   ├── 6.7-inch/         # 1290 x 2796
│   │   │   │   ├── 01-home.png
│   │   │   │   ├── 02-diagnose.png
│   │   │   │   ├── 03-coach.png
│   │   │   │   ├── 04-journal.png
│   │   │   │   ├── 05-strains.png
│   │   │   │   ├── 06-community.png
│   │   │   │   ├── 07-marketplace.png
│   │   │   │   └── 08-achievements.png
│   │   │   └── 6.5-inch/         # 1242 x 2688 (optional)
│   │   └── android/
│   │       ├── phone/            # 1080 x 1920
│   │       │   ├── 01-home.png
│   │       │   ├── 02-diagnose.png
│   │       │   ├── ... (8 total)
│   │       └── feature-graphic.png  # 1024 x 500
│   └── descriptions/
│       ├── app-store-de.txt
│       ├── app-store-en.txt
│       ├── play-store-de.txt
│       └── play-store-en.txt
```

---

## ⚡ Quick-Start Kommandos

### Screenshots-Ordner erstellen
```bash
cd ~/projects/growmasterai-app
mkdir -p store-assets/screenshots/ios/6.7-inch
mkdir -p store-assets/screenshots/ios/6.5-inch
mkdir -p store-assets/screenshots/android/phone
mkdir -p store-assets/icons
```

### Simulator-Screenshots automatisieren (iOS)
```bash
# Xcode Simulator öffnen
open -a Simulator

# Über Simulator UI navigieren & Cmd+S drücken
# Screenshots landen automatisch auf Desktop

# Danach verschieben:
mv ~/Desktop/Simulator*.png store-assets/screenshots/ios/6.7-inch/
```

### Android Screenshots via ADB
```bash
# App starten
pnpm android

# Screenshot via ADB
adb exec-out screencap -p > store-assets/screenshots/android/phone/01-home.png

# Für alle 8 Screens wiederholen
```

---

## ✅ Pre-Submission Checkliste

### Icons
- [ ] iOS Icon: 1024x1024px erstellt & ohne Transparenz
- [ ] Android Icon: 512x512px erstellt
- [ ] Icons hochgeladen zu App Store Connect / Play Console

### Screenshots iOS
- [ ] Min. 3 Screenshots (6.7") erstellt (besser: 8)
- [ ] Korrekte Auflösung: 1290 x 2796 px
- [ ] PNG/JPG, sRGB Farbraum
- [ ] Hochgeladen zu App Store Connect

### Screenshots Android
- [ ] Min. 2 Screenshots (besser: 8) erstellt
- [ ] Auflösung: 1080 x 1920 px oder höher
- [ ] PNG/JPG, 24-bit
- [ ] Feature Graphic (1024 x 500 px) erstellt
- [ ] Hochgeladen zu Play Console

### Optional (aber empfohlen)
- [ ] App Preview Video (iOS, 15-30 Sek.)
- [ ] Promo Video (Android, YouTube-Link)
- [ ] Professionelle Device-Frames hinzugefügt
- [ ] Marketing-Text-Overlays auf Screenshots

---

## 🎯 Nächste Schritte

1. **App lokal starten:**
   ```bash
   cd ~/projects/growmasterai-app
   pnpm dev
   ```

2. **Simulator/Emulator öffnen** (iOS oder Android)

3. **Zu jedem Screen navigieren** und Screenshot machen:
   - Home Dashboard
   - KI-Diagnose
   - AI Coach
   - Journal
   - Strains
   - Community
   - Marketplace
   - Achievements

4. **Screenshots in `store-assets/` ablegen**

5. **Icon hochskalieren** auf 1024x1024px (iOS) & 512x512px (Android)

6. **Feature Graphic erstellen** (1024x500px für Android)

7. **Alle Assets in APP_STORE_CHECKLIST.md abhaken**

---

**Fragen?** Siehe `APP_STORE_CHECKLIST.md` für vollständige Submission-Checkliste.

**Letzte Aktualisierung:** 6. Oktober 2026
