# Store Assets - README

Dieser Ordner enthält alle für den App Store & Play Store benötigten Assets.

## 📁 Ordnerstruktur

```
store-assets/
├── icons/                      # App Icons
│   ├── ios-1024.png           # 1024x1024 für App Store (BENÖTIGT)
│   ├── android-512.png        # 512x512 für Play Store (BENÖTIGT)
│   └── source.svg             # Original-Vektordatei (optional)
│
├── screenshots/
│   ├── ios/
│   │   ├── 6.7-inch/          # iPhone 14 Pro Max, 15 Pro Max (1290 x 2796)
│   │   │   ├── 01-home.png
│   │   │   ├── 02-diagnose.png
│   │   │   ├── 03-coach.png
│   │   │   ├── 04-journal.png
│   │   │   ├── 05-strains.png
│   │   │   ├── 06-community.png
│   │   │   ├── 07-marketplace.png
│   │   │   └── 08-achievements.png
│   │   │
│   │   └── 6.5-inch/          # iPhone XS Max, 11 Pro Max (1242 x 2688) - Optional
│   │       └── ... (gleiche Dateien)
│   │
│   └── android/
│       ├── phone/             # 1080 x 1920 oder höher
│       │   ├── 01-home.png
│       │   ├── 02-diagnose.png
│       │   ├── ... (8 Screenshots total)
│       │
│       └── feature/
│           └── feature-graphic.png  # 1024 x 500 für Play Store Header
│
└── descriptions/              # Store-Beschreibungen als Textdateien
    ├── app-store-de.txt
    ├── app-store-en.txt
    ├── play-store-de.txt
    └── play-store-en.txt

```

## ✅ Checkliste

### Icons
- [ ] `icons/ios-1024.png` - 1024x1024px PNG ohne Transparenz
- [ ] `icons/android-512.png` - 512x512px PNG

### iOS Screenshots (6.7-inch - PFLICHT)
- [ ] `screenshots/ios/6.7-inch/01-home.png` - 1290 x 2796 px
- [ ] `screenshots/ios/6.7-inch/02-diagnose.png`
- [ ] `screenshots/ios/6.7-inch/03-coach.png`
- [ ] `screenshots/ios/6.7-inch/04-journal.png`
- [ ] `screenshots/ios/6.7-inch/05-strains.png`
- [ ] `screenshots/ios/6.7-inch/06-community.png`
- [ ] `screenshots/ios/6.7-inch/07-marketplace.png`
- [ ] `screenshots/ios/6.7-inch/08-achievements.png`

### Android Screenshots (Phone - PFLICHT, min. 2)
- [ ] `screenshots/android/phone/01-home.png` - 1080 x 1920 px oder höher
- [ ] `screenshots/android/phone/02-diagnose.png`
- [ ] ... (8 total empfohlen)

### Android Feature Graphic (PFLICHT)
- [ ] `screenshots/android/feature/feature-graphic.png` - 1024 x 500 px

## 🛠️ Erstellung

Siehe `../SCREENSHOT_GUIDE.md` für detaillierte Anleitungen zur Erstellung aller Assets.

**Quick-Start:**
1. App im Simulator/Emulator starten
2. Zu jedem Screen navigieren (Home, Diagnose, Coach, etc.)
3. Screenshot machen (Cmd+S iOS / Toolbar Android)
4. In entsprechenden Ordner ablegen
5. Icons hochskalieren auf korrekte Größe

## 📝 Hinweise

- **Format:** PNG oder JPG
- **Farbraum iOS:** sRGB oder P3
- **Farbraum Android:** sRGB (24-bit, kein Alpha)
- **Pixelgenaue Auflösungen** erforderlich!
- **Min. 3 Screenshots** für iOS, **min. 2** für Android
- **Max. 10 Screenshots** pro Plattform

---

**Status:** ⚠️ Leer - Assets müssen erstellt werden  
**Siehe auch:** `../APP_STORE_CHECKLIST.md`, `../SCREENSHOT_GUIDE.md`
