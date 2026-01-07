# Changelog - GrowMaster AI

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

---

## [1.8.0] - 2025-01-07 - Google Play Store Release

### Neu hinzugefügt
- **Store-Assets**: Feature-Grafik (1024x500) und 8 professionelle Screenshots
- **Store-Listing**: Vollständige Beschreibungen in Deutsch und Englisch
- **Release-Dokumentation**: Umfassende Checkliste für den Store-Upload
- **Backend-Deployment**: dist/ Verzeichnis wird jetzt korrekt deployed

### Behoben
- Backend-Deployment-Fehler beim APK-Build (dist/ war in .gitignore)
- Pflanzen-Persistenz: Pflanzen aus Onboarding werden jetzt im Plants-Tab angezeigt

### Dokumentation
- `docs/GOOGLE_PLAY_STORE_LISTING.md` - Store-Texte und Grafik-Anforderungen
- `docs/RELEASE_CHECKLIST.md` - Vollständige Release-Checkliste

---

## [1.7.1] - 2025-01-07 - Backend Deployment Fix

### Behoben
- dist/ Verzeichnis aus .gitignore entfernt für korrektes Backend-Deployment
- CJS-Format für Server-Build für maximale Kompatibilität

---

## [1.7.0] - 2025-01-07 - Bug Fixes

### Behoben
- Pflanzen-Synchronisation zwischen Onboarding und Plants-Tab
- AsyncStorage Integration mit useFocusEffect für automatische Updates

---

## [1.6.0] - 2025-01-06 - Monetarisierung

### Neu hinzugefügt
- RevenueCat SDK Integration
- Freemium-Modell (Free/Premium/Pro)
- Paywall mit Tier-Vergleich
- Feature-Gating basierend auf Subscription-Status
- Affiliate-Links für Partner-Shops

---

## [1.5.0] - 2025-01-05 - Community & Gamification

### Neu hinzugefügt
- Community Feed mit Posts und Kommentaren
- Leaderboard und Achievements
- XP-System und Level-Progression
- Tägliche Login-Streaks
- Gewinnspiele und Verlosungen

---

## [1.4.0] - 2025-01-04 - Erweiterte Features

### Neu hinzugefügt
- Sorten-Datenbank mit 100+ Strains
- Grow-Tools (VPD-Rechner, Nährstoff-Rechner, etc.)
- News & Gesetzgebung
- Shop-Finder & Member-Radar
- Tutorial-Videos

---

## [1.3.0] - 2025-01-03 - KI-Features

### Neu hinzugefügt
- KI-Diagnose mit Kamera und Galerie
- Live-Kamera-Analyse mit Overlays
- Grow Coach AI-Chat
- Geschlechtsbestimmung und Reifegrad-Erkennung

---

## [1.2.0] - 2025-01-02 - Pflanzen-Management

### Neu hinzugefügt
- Pflanzen-Tracking mit Phasen
- Grow Journal mit Foto-Dokumentation
- Automatische Erinnerungen
- PDF-Export für Grow-Reports

---

## [1.1.0] - 2025-01-01 - Onboarding

### Neu hinzugefügt
- Mehrstufiges Onboarding
- Erste Pflanze anlegen
- Standort-Auswahl (Indoor/Outdoor)
- Strain-Auswahl

---

## [1.0.0] - 2024-12-31 - Initial Release

### Neu hinzugefügt
- Grundlegende App-Struktur
- Tab-Navigation (Home, Pflanzen, Journal, Community, Einstellungen)
- Dark Theme Design
- NativeWind/Tailwind CSS Styling
