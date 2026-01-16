# 🚀 Vercel Deployment - Permanenter Link

## Schritt-für-Schritt Anleitung

### 1️⃣ Build erstellen (5-10 Minuten)

Öffne PowerShell im Projekt-Ordner:

```powershell
npx expo export --platform web
```

**Was passiert:**
- Metro Bundler kompiliert die App
- Erstellt statische HTML/CSS/JS Dateien
- Speichert alles im `dist` Ordner
- ⏱️ Dauert beim ersten Mal ~5-10 Minuten

**Du siehst:**
```
Starting Metro Bundler
Web node_modules\expo-router\entry.js ▓▓▓▓▓▓▓▓ 100%
λ node_modules\expo-router\node\render.js ▓▓▓▓▓▓▓▓ 100%

✓ Exported 15 files
```

---

### 2️⃣ Vercel deployen

**Option A: Via CLI (empfohlen)**

```powershell
# 1. Vercel installieren (einmalig)
npm install -g vercel

# 2. In dist-Ordner wechseln
cd dist

# 3. Deployen
vercel --prod
```

**Beim ersten Mal fragt Vercel:**
```
? Set up and deploy "~/dist"?  
→ YES

? Which scope do you want to deploy to?
→ [Wähle deinen Account]

? Link to existing project?
→ NO

? What's your project's name?
→ growmaster-app

? In which directory is your code located?
→ ./ (einfach ENTER drücken)
```

**Ergebnis:**
```
✅ Production: https://growmaster-app.vercel.app
🔗 Deployed to production. Run `vercel --prod` to overwrite later.
```

---

**Option B: Via Browser (noch einfacher!)**

1. Gehe zu: https://vercel.com/new
2. Drag & Drop den `dist` Ordner
3. Klick "Deploy"
4. Fertig! ✅

---

### 3️⃣ Link teilen

Dein permanenter Link:
```
https://growmaster-app.vercel.app
```

**Vorteile:**
- ✅ 24/7 online
- ✅ Schnelles CDN
- ✅ Automatische HTTPS
- ✅ Kostenlos für Hobby-Projekte

---

## 🔄 Updates deployen

Jedes Mal wenn du Änderungen machst:

```powershell
# 1. Neuen Build erstellen
npx expo export --platform web

# 2. Re-deployen
cd dist
vercel --prod
```

→ Vercel deployed automatisch, Link bleibt gleich!

---

## 🎯 Was der Designer dann hat:

**2 Links:**

1. **Tunnel** (temporär): `https://abc123.exp.direct`
   - Für Live-Development
   - Zeigt Änderungen sofort
   - Läuft nur wenn dein Server an ist

2. **Vercel** (permanent): `https://growmaster-app.vercel.app`
   - Immer online
   - Professionell
   - Teile mit Team/Investoren

---

## ⚡ Quick Commands

```powershell
# Alles in einem:
npx expo export --platform web && cd dist && vercel --prod && cd ..

# Oder step-by-step:
npx expo export --platform web  # Build
cd dist                          # In Ordner
vercel --prod                    # Deploy
cd ..                           # Zurück
```

---

## 💡 Troubleshooting

**"Build dauert zu lange"**
- Normal beim ersten Mal (5-10 Min)
- Danach schneller (~2 Min)
- Läuft im Background, du kannst weiterarbeiten

**"Vercel fragt nach Login"**
- Beim ersten Mal: `vercel login`
- Email/GitHub/GitLab Account nutzen
- Einmalig, danach automatisch

**"Dist Ordner leer"**
- Build noch nicht fertig
- Check Terminal Output
- Warte bis "✓ Exported X files"

**"Designer sieht leere Seite"**
- Warte 10-20 Sekunden (First Load)
- Hard Refresh (Ctrl+Shift+R)
- Check Browser Console (F12)
