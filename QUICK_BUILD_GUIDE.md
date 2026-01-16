# 🚀 QUICK REFERENCE - BUILD & SUBMIT

## COMMANDS (In neuem PowerShell Fenster ausführen):

### 1. EAS konfigurieren:
```
eas build:configure
```
→ Bei allen Fragen: YES

### 2. Build starten:
```
eas build --platform android --profile production
```
→ Wartezeit: ~30 Minuten
→ Status: https://expo.dev

### 3. AAB downloaden:
```
eas build:download --platform android --profile production
```

### 4. Upload zu Google Play:
→ https://play.google.com/console/
→ Production → Create release → Upload AAB

---

## WÄHREND BUILD:

✅ Google Play Account erstellen ()
✅ Store Listing vorbereiten (siehe SUBMIT_CHECKLIST.md)
✅ Screenshots machen
✅ Content Rating ausfüllen

---

## NACH SUBMIT:

✅ Features implementieren (siehe DIAMANT_OPTIMIERUNGEN.md)
✅ Warte auf Review (1-7 Tage)
✅ Deploy OTA Update nach Approval

---

## WICHTIGE LINKS:

• Google Play Console: https://play.google.com/console/
• Expo Dashboard: https://expo.dev
• EAS Docs: https://docs.expo.dev/eas/

---

## SUPPORT:

Bei Problemen siehe:
• SUBMIT_CHECKLIST.md → Troubleshooting
• LAUNCH_JETZT.md → Detaillierte Anleitung

