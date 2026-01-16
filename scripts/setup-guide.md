# 🚀 GrowMaster AI - Lokaler Setup Guide

## Aktuelle Situation

✅ **Erfolgreich abgeschlossen:**
- .env Datei erstellt und konfiguriert
- 5/6 kritische Variablen gesetzt
- Projekt-Dependencies installiert

⚠️ **Noch ausstehend:**
- MySQL Installation/Konfiguration
- Gemini API Key (optional für AI-Features)
- Database Migrationen

---

## 🗄️ Database Setup Optionen

### Option 1: Lokales MySQL (Empfohlen für lokale Entwicklung)

#### Windows Installation:

1. **Download MySQL:**
   - https://dev.mysql.com/downloads/mysql/
   - Oder: https://dev.mysql.com/downloads/installer/
   - Wähle: "MySQL Installer for Windows"

2. **Installation:**
   - MySQL Server installieren
   - Root-Passwort festlegen (z.B. "password")
   - Port: 3306 (Standard)

3. **Service starten:**
   ```powershell
   net start MySQL80
   # oder
   net start MySQL
   ```

4. **Database erstellen:**
   ```powershell
   # MySQL CLI öffnen
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
   
   # In MySQL:
   CREATE DATABASE growmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

5. **.env aktualisieren:**
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/growmaster"
   ```

6. **Migrationen ausführen:**
   ```powershell
   pnpm db:push
   ```

---

### Option 2: Docker MySQL (Schnellste Option)

Wenn Docker installiert ist:

```powershell
# MySQL Container starten
docker run --name growmaster-mysql `
  -e MYSQL_ROOT_PASSWORD=password `
  -e MYSQL_DATABASE=growmaster `
  -p 3306:3306 `
  -d mysql:8

# Warten bis bereit
Start-Sleep -Seconds 10

# .env bleibt gleich:
DATABASE_URL="mysql://root:password@localhost:3306/growmaster"

# Migrationen ausführen
pnpm db:push
```

**Container Management:**
```powershell
# Stoppen
docker stop growmaster-mysql

# Starten
docker start growmaster-mysql

# Entfernen
docker rm -f growmaster-mysql
```

---

### Option 3: Cloud Database (Für Testing ohne lokale Installation)

#### PlanetScale (Kostenlos):
1. Gehe zu: https://planetscale.com/
2. Erstelle Account
3. Erstelle neue Database: "growmaster"
4. Kopiere Connection String
5. Update .env:
   ```env
   DATABASE_URL="mysql://user:pass@host.us-east-3.psdb.cloud/growmaster?ssl={"rejectUnauthorized":true}"
   ```

#### Railway (Kostenlos):
1. Gehe zu: https://railway.app/
2. Erstelle Account
3. New Project → MySQL
4. Kopiere Connection String
5. Update .env

---

## 🚀 Ohne Database starten (Nur Frontend)

Wenn du **nur das Frontend/UI** testen willst:

1. **Kommentiere Backend aus:**
   ```typescript
   // In app/_layout.tsx - tRPC Provider temporär deaktivieren
   ```

2. **Verwende Mock-Daten:**
   ```typescript
   // Frontend läuft auch ohne Backend
   // API-Calls werden fehlschlagen, aber UI ist testbar
   ```

3. **Start nur Metro:**
   ```powershell
   npx expo start
   ```

---

## ✅ Vollständiger Setup-Flow (Empfohlen)

### Schritt 1: Database (Wähle eine Option oben)
```powershell
# Mit Docker (schnellste Option):
docker run --name growmaster-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=growmaster -p 3306:3306 -d mysql:8
```

### Schritt 2: Database Schema erstellen
```powershell
pnpm db:push
```

### Schritt 3: Dev Server starten
```powershell
pnpm dev
```

Dieser Befehl startet:
- ✅ Backend Server (Port 3000)
- ✅ Expo Metro Bundler (Port 8081)

### Schritt 4: App öffnen

**Web:**
- Öffne: http://localhost:8081

**iOS Simulator:**
```powershell
# Drücke 'i' im Terminal
# Oder:
npx expo run:ios
```

**Android Emulator:**
```powershell
# Drücke 'a' im Terminal
# Oder:
npx expo run:android
```

**Physical Device:**
1. Installiere "Expo Go" App
2. Scanne QR Code im Terminal

---

## 🧪 Minimal Testing (Ohne Database)

```powershell
# Nur Metro starten (kein Backend)
npx expo start --web

# Öffnet Web-Version
# Backend-Calls werden fehlschlagen, aber UI ist sichtbar
```

---

## 🔧 Troubleshooting

### "Port 3000 already in use"
```powershell
# Finde Prozess
netstat -ano | findstr :3000

# Töte Prozess
taskkill /PID <PID> /F
```

### "Cannot connect to database"
```powershell
# Prüfe MySQL Service
Get-Service -Name "*mysql*"

# Starte Service
net start MySQL80
```

### "pnpm command not found"
```powershell
npm install -g pnpm
```

---

## 📊 Status Check

**Führe Setup-Checks aus:**
```powershell
# Environment Check
node scripts/setup-check.js

# Database Check (wenn MySQL läuft)
node scripts/db-setup.js
```

---

## 🎯 Empfohlener nächster Schritt

**Für schnellsten Start:**

1. **Docker MySQL** (5 Minuten):
   ```powershell
   docker run --name growmaster-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=growmaster -p 3306:3306 -d mysql:8
   Start-Sleep -Seconds 15
   pnpm db:push
   pnpm dev
   ```

2. **Oder ohne Database** (1 Minute):
   ```powershell
   npx expo start --web
   # Teste nur UI/Frontend
   ```

Welche Option bevorzugen Sie?
