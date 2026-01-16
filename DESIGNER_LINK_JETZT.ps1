# === GrowMaster App - Designer Link Generator ===
# Dieses Script gibt dir einen öffentlichen Link für den Designer

Write-Host ""
Write-Host "=== GROWMASTER APP - DESIGNER PREVIEW ===" -ForegroundColor Green
Write-Host ""

# Check ob pnpm installiert ist
Write-Host "1. Checke Dependencies..." -ForegroundColor Yellow
if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "   ❌ pnpm nicht gefunden!" -ForegroundColor Red
    Write-Host "   Installiere mit: npm install -g pnpm" -ForegroundColor Yellow
    exit
}
Write-Host "   ✅ pnpm gefunden" -ForegroundColor Green

Write-Host ""
Write-Host "2. Starte Expo Dev Server..." -ForegroundColor Yellow
Write-Host "   (Dies dauert ~30 Sekunden)" -ForegroundColor Gray
Write-Host ""

# Starte Expo mit Tunnel
Write-Host "   Führe aus: npx expo start --web --tunnel" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== ANLEITUNG ===" -ForegroundColor Magenta
Write-Host "Nach ~1 Minute siehst du:" -ForegroundColor White
Write-Host ""
Write-Host '  › Tunnel ready at: https://xxxxx.exp.direct' -ForegroundColor Yellow
Write-Host ""
Write-Host "→ DIESER LINK ist für den Designer!" -ForegroundColor Green
Write-Host "→ Teile ihn per Email/Slack/WhatsApp" -ForegroundColor Green
Write-Host ""
Write-Host "Alternative: http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Drücke ENTER um zu starten..."
Read-Host

# Starte Expo
npx expo start --web --tunnel --port 8081
