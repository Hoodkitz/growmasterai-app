# 🚀 Vercel Deployment - Step by Step

## Status: Tunnel läuft in separatem Fenster! ✅

Schau in das PowerShell-Fenster das sich geöffnet hat - dort sollte nach ~1 Minute stehen:

```
› Tunnel ready at: https://XXXXX.exp.direct
```

**→ DIESER LINK ist für den Designer!**

---

## Jetzt: Vercel Deployment für permanenten Link

### Schritt 1: Static Build erstellen

```powershell
npx expo export --platform web
```

⏱️ Dauert ~5-10 Minuten beim ersten Mal

### Schritt 2: Vercel installieren (einmalig)

```powershell
npm install -g vercel
```

### Schritt 3: Deployen

```powershell
cd dist
vercel --prod
```

Beim ersten Mal fragt Vercel:
- "Set up and deploy?" → **YES**
- "Which scope?" → Wähle deinen Account
- "Link to existing project?" → **NO** (neues Projekt)
- "Project name?" → **growmaster-app**
- "In which directory is your code?" → **.** (aktueller Ordner)

### Ergebnis:

```
✅ Production: https://growmaster-app.vercel.app
```

---

## Alternative: Vercel via Web-Interface (noch einfacher!)

1. **Build erstellen:**
   ```powershell
   npx expo export --platform web
   ```

2. **Auf Vercel.com:**
   - Gehe zu: https://vercel.com/new
   - Ziehe den `dist` Ordner ins Browser-Fenster
   - Klick "Deploy"
   - Fertig! ✅

---

## Was du dann hast:

1. **Tunnel-Link** (läuft jetzt): `https://abc123.exp.direct`
   - Für sofortiges Feedback
   - Zeigt Live-Updates
   - Läuft solange dein PC an ist

2. **Vercel-Link** (permanent): `https://growmaster-app.vercel.app`
   - 24/7 erreichbar
   - Professionell
   - Teile mit Team, Investoren, etc.

---

## 🎯 Nächster Schritt:

Lass den Build jetzt starten, während du den Tunnel-Link checkst!

```powershell
npx expo export --platform web
```
