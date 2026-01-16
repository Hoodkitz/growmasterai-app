# 🎨 GrowMaster App - Designer Preview Links

## ⚡ Option 1: Sofortiger Tunnel-Link (Empfohlen für Designer)

### Schnellstart (5 Minuten):

```powershell
# Im Projekt-Ordner ausführen:
pnpm install
npx expo start --web --tunnel
```

**Was passiert:**
- Expo startet einen Dev-Server
- Erstellt automatisch einen öffentlichen ngrok/Expo-Tunnel
- Du bekommst eine URL wie: `https://abc123.exp.direct`
- Diese URL kann der Designer direkt im Browser öffnen
- ✅ **Zeigt die ECHTE App mit allen Funktionen**
- ✅ **Aktualisiert sich automatisch bei Code-Änderungen**

**Screenshot teilen:**
Wenn der Tunnel läuft, siehst du im Terminal:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Web is waiting on http://localhost:8081

› Tunnel ready at: https://abc123.exp.direct  ← DIESER LINK!
```

---

## 🌐 Option 2: Statischer Web-Build (Dauerhaft hostbar)

### Für permanenten Link (10 Minuten):

```powershell
# 1. Build erstellen
npx expo export --platform web

# 2. Geht in den Ordner 'dist'
cd dist

# 3. Einfachen Web-Server starten (zum Testen)
npx serve
```

### Auf Vercel/Netlify deployen:

**Vercel (Empfohlen - 2 Minuten):**
```bash
# Installation (einmalig)
npm install -g vercel

# Im dist-Ordner:
cd dist
vercel --prod
```
→ Gibt dir eine permanente URL: `https://growmaster-abc123.vercel.app`

**Netlify:**
```bash
# Installation (einmalig)
npm install -g netlify-cli

# Im dist-Ordner:
cd dist
netlify deploy --prod --dir .
```

**Oder per Drag & Drop:**
1. Gehe zu https://app.netlify.com/drop
2. Ziehe den `dist` Ordner in den Browser
3. Fertig! Permanenter Link wird erstellt

---

## 📱 Was der Designer sieht:

### Mit beiden Optionen bekommt er:
- ✅ Vollständige App-Navigation (alle Tabs)
- ✅ Echtes UI/UX mit allen Screens
- ✅ Funktionierendes Design-System (Farben, Fonts, Spacing)
- ✅ Responsive Design (Mobile/Desktop)
- ✅ Alle Komponenten und Layouts

### Einschränkungen im Web-Preview:
- ⚠️ Keine nativen Features (Kamera, Push-Notifications)
- ⚠️ Manche Animationen können anders aussehen
- ✅ Aber: 95% des UI/UX ist identisch zur nativen App

---

## 🚀 Meine Empfehlung:

**FÜR DESIGNER:** Start mit **Option 1** (Tunnel)
- Schnellster Start
- Zeigt Live-Updates
- Perfekt für iteratives Design-Feedback

**FÜR LANGFRISTIG:** Deploy mit **Option 2** (Vercel)
- Permanenter Link
- Teile mit mehreren Stakeholdern
- Kein laufender Dev-Server nötig

---

## 🎯 Nächste Schritte für dich:

1. **Jetzt sofort:** Führe `tmp_rovodev_start_tunnel.ps1` aus → Link in 2 Minuten
2. **Später heute:** Deploy auf Vercel für permanenten Link
3. **Dem Designer geben:** Link + Screenshot + "Schau dir das UI/UX an und arbeite am 9-6-3 Design"

---

## 💡 Troubleshooting:

**"Tunnel funktioniert nicht":**
```powershell
npx expo start --web --localhost
# Dann manuell mit ngrok:
ngrok http 8081
```

**"Build dauert zu lange":**
- Normal! Erster Build kann 5-10 Minuten dauern
- Danach geht's schneller

**"Designer sieht leeren Screen":**
- Warte 30 Sekunden (Metro Bundler lädt)
- Refresh im Browser (F5)
- Check Console für Fehler (F12)
