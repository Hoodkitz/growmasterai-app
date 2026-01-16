# 🚀 Quick Setup Guide - GrowMaster AI

## Minimale Konfiguration für lokalen Start

### ✅ Was ist bereits konfiguriert:
- ✅ Database URL (Standard MySQL)
- ✅ JWT Secret (Development)
- ✅ Server Port (3000)
- ✅ Node Environment (development)
- ✅ API URLs

### ❌ Was noch benötigt wird:

#### 1. **GEMINI_API_KEY** (ERFORDERLICH für AI-Features)

**Schnell-Anleitung:**
1. Gehe zu: https://makersuite.google.com/app/apikey
2. Melde dich mit Google-Account an
3. Klicke "Create API Key"
4. Kopiere den Key
5. Ersetze in `.env`:
   ```
   GEMINI_API_KEY="AIzaSy..."
   ```

**Ohne diesen Key:**
- ❌ Plant Diagnosis funktioniert nicht
- ❌ AI Coach funktioniert nicht
- ✅ Andere Features funktionieren

---

#### 2. **REVENUECAT_API_KEY** (Optional für Testing ohne Subscriptions)

**Wenn du Subscription-Features testen willst:**
1. Gehe zu: https://app.revenuecat.com/
2. Erstelle Account (kostenlos)
3. Erstelle neues Projekt
4. Kopiere API Key
5. Ersetze in `.env`:
   ```
   REVENUECAT_API_KEY="appl_..."
   ```

**Ohne diesen Key:**
- ⚠️ Subscription-Features sind deaktiviert
- ✅ App läuft im "Free Mode"

---

#### 3. **Database Setup**

**MySQL muss laufen:**

**Windows:**
```powershell
# MySQL Service starten
net start MySQL

# Oder via Services App
```

**macOS/Linux:**
```bash
# MySQL starten
brew services start mysql
# oder
sudo systemctl start mysql
```

**Database erstellen:**
```sql
mysql -u root -p

CREATE DATABASE growmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Connection testen:**
```bash
mysql -u root -p growmaster
# Sollte ohne Fehler verbinden
```

---

## 🚦 Minimal Setup (Ohne API Keys)

Wenn du **nur die App-Struktur** testen willst:

1. **Mock Gemini API** (für lokale Tests):
   ```typescript
   // In server/routers.ts - AI Features werden gemockt
   // Die App startet auch ohne echten API Key
   ```

2. **Subscription Features deaktivieren:**
   ```env
   FEATURE_SUBSCRIPTIONS=false
   ```

---

## ✅ Setup-Status prüfen

```bash
node scripts/setup-check.js
```

---

## 🎯 Nächster Schritt

Sobald mindestens DATABASE_URL konfiguriert ist:

```bash
# Database Migrationen ausführen
pnpm db:push

# Dev Server starten
pnpm dev
```

---

## 💡 Tipp: Schnellstart OHNE externe APIs

Für einen **schnellen lokalen Test** ohne API-Keys:

1. Kommentiere AI-Features temporär aus
2. Verwende Mock-Daten
3. Teste UI und Navigation
4. Füge später API-Keys hinzu

Die App ist so designed, dass sie auch ohne alle Keys startet (mit eingeschränkten Features).
