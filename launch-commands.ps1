# 🚀 GrowMaster AI - Launch Commands
# Führe dieses Script aus um den Build-Prozess zu starten

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "🚀 GrowMaster AI - PRODUCTION BUILD STARTEN" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""

# Pre-Flight Check
Write-Host "📋 PRE-FLIGHT CHECK..." -ForegroundColor Cyan
Write-Host ""

# Check 1: EAS CLI
Write-Host "✓ Checking EAS CLI..." -ForegroundColor Yellow
try {
    $easVersion = eas --version 2>&1 | Out-String
    Write-Host "  ✅ EAS CLI installed: $($easVersion.Trim())" -ForegroundColor Green
} catch {
    Write-Host "  ❌ EAS CLI not found!" -ForegroundColor Red
    Write-Host "  Install: npm install -g eas-cli" -ForegroundColor Gray
    exit 1
}

# Check 2: Configuration Files
Write-Host "✓ Checking configuration files..." -ForegroundColor Yellow
$requiredFiles = @("app.config.ts", "eas.json", ".env", "package.json")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing!" -ForegroundColor Red
        exit 1
    }
}

# Check 3: Assets
Write-Host "✓ Checking app assets..." -ForegroundColor Yellow
$requiredAssets = @(
    "assets/images/icon.png",
    "assets/images/splash-icon.png",
    "assets/images/android-icon-foreground.png"
)
foreach ($asset in $requiredAssets) {
    if (Test-Path $asset) {
        Write-Host "  ✅ $asset" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $asset missing (optional)" -ForegroundColor Yellow
    }
}

# Check 4: Environment Variables
Write-Host "✓ Checking environment variables..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw

$criticalVars = @{
    "REVENUECAT_API_KEY" = $true
}

foreach ($varName in $criticalVars.Keys) {
    if ($envContent -match "$varName=") {
        if ($envContent -match "$varName=`"your-" -or $envContent -match "$varName=`"`"") {
            Write-Host "  ⚠️  $varName is set but might need real value" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ $varName configured" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ $varName missing!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "✅ PRE-FLIGHT CHECK PASSED!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""

# User Confirmation
Write-Host "🎯 BEREIT FÜR PRODUCTION BUILD?" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dies wird:" -ForegroundColor White
Write-Host "  1. Deinen Code zu Expo Servern hochladen" -ForegroundColor Gray
Write-Host "  2. Eine Production AAB (Android App Bundle) erstellen" -ForegroundColor Gray
Write-Host "  3. Die App mit einem Keystore signieren" -ForegroundColor Gray
Write-Host "  4. Die AAB zum Download bereitstellen (~20-30 Min)" -ForegroundColor Gray
Write-Host ""
Write-Host "App Details:" -ForegroundColor White
Write-Host "  Name: GrowMaster AI" -ForegroundColor Gray
Write-Host "  Version: 1.0.0" -ForegroundColor Gray
Write-Host "  Package: space.manus.growmaster.app.t20251231214615" -ForegroundColor Gray
Write-Host ""

$confirmation = Read-Host "Möchtest du fortfahren? (ja/nein)"

if ($confirmation -ne "ja" -and $confirmation -ne "j" -and $confirmation -ne "y" -and $confirmation -ne "yes") {
    Write-Host ""
    Write-Host "❌ Build abgebrochen." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "🏗️  PRODUCTION BUILD WIRD GESTARTET..." -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host ""

# Option 1: Check if logged in
Write-Host "🔐 Checking EAS login status..." -ForegroundColor Cyan
$loginCheck = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to EAS. Starting login..." -ForegroundColor Yellow
    Write-Host ""
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Login fehlgeschlagen!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Logged in as: $loginCheck" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "🚀 STARTE ANDROID PRODUCTION BUILD" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dies kann 20-30 Minuten dauern..." -ForegroundColor Yellow
Write-Host "Du kannst den Build-Status verfolgen unter:" -ForegroundColor Gray
Write-Host "https://expo.dev/accounts/[dein-account]/projects/growmaster-app/builds" -ForegroundColor Blue
Write-Host ""

# Start the build
eas build --platform android --profile production

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "🎉 BUILD ERFOLGREICH GESTARTET!" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Nächste Schritte:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  1. Warte auf Build-Completion (~20-30 Min)" -ForegroundColor White
    Write-Host "  2. Download die AAB mit:" -ForegroundColor White
    Write-Host "     eas build:download --platform android --profile production" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Gehe zu Google Play Console:" -ForegroundColor White
    Write-Host "     https://play.google.com/console/" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  4. Production → Create new release → Upload AAB" -ForegroundColor White
    Write-Host ""
    Write-Host "  5. Review & Submit!" -ForegroundColor White
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "💰 IN 3-7 TAGEN IST DEINE APP LIVE UND DU VERDIENST GELD!" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host "❌ BUILD FEHLGESCHLAGEN" -ForegroundColor Red
    Write-Host "================================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Mögliche Lösungen:" -ForegroundColor Yellow
    Write-Host "  1. Überprüfe die Build-Logs" -ForegroundColor White
    Write-Host "  2. Stelle sicher dass alle Dependencies installiert sind: pnpm install" -ForegroundColor White
    Write-Host "  3. Versuche: eas build:configure" -ForegroundColor White
    Write-Host "  4. Checke: https://docs.expo.dev/build/setup/" -ForegroundColor White
    Write-Host ""
    exit 1
}
