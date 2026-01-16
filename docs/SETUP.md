# 🚀 GrowMaster AI - Setup Guide

Complete setup instructions for developers.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [API Keys](#api-keys)
- [OAuth Setup](#oauth-setup)
- [RevenueCat Setup](#revenuecat-setup)
- [Running the App](#running-the-app)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   # Should output v18.x or higher
   ```

2. **pnpm** (v9 or higher)
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   expo --version
   ```

4. **MySQL** (v8 or higher)
   - macOS: `brew install mysql`
   - Windows: Download from [mysql.com](https://dev.mysql.com/downloads/mysql/)
   - Linux: `sudo apt-get install mysql-server`

5. **Git**
   ```bash
   git --version
   ```

### Platform-Specific Requirements

#### iOS Development
- **macOS only**
- Xcode (latest version from App Store)
- iOS Simulator
- CocoaPods: `sudo gem install cocoapods`

#### Android Development
- **Any OS**
- Android Studio
- Android SDK
- Java JDK 11 or higher

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd growmaster-app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env  # or use your preferred editor
```

## Database Setup

### 1. Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE growmaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, for security)
CREATE USER 'growmaster_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON growmaster.* TO 'growmaster_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Update DATABASE_URL in .env

```env
DATABASE_URL="mysql://growmaster_user:your_password@localhost:3306/growmaster"
```

### 3. Run Migrations

```bash
# Generate migration files and apply them
pnpm db:push
```

### 4. Verify Database

```bash
mysql -u growmaster_user -p growmaster

# List tables
SHOW TABLES;

# Should see: users, plants, journal_entries, diagnoses, etc.
```

## API Keys

### Gemini API (Required for AI features)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Add to `.env`:
   ```env
   GEMINI_API_KEY="AIzaSy..."
   ```

### Testing Gemini API

```bash
# Test with curl
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Configure OAuth consent screen
6. Create OAuth Client ID:
   - **Type**: Web application
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/oauth/google/callback` (dev)
     - `https://your-domain.com/api/oauth/google/callback` (prod)
7. For mobile:
   - Create iOS OAuth Client ID (Bundle ID from app.config.ts)
   - Create Android OAuth Client ID (Package name from app.config.ts)
8. Copy Client ID and Secret to `.env`:
   ```env
   GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-abc123..."
   ```

### Apple Sign In

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles
3. Identifiers → "+" → App IDs
4. Register App ID with Sign In with Apple capability
5. Create Service ID:
   - Identifier: `com.yourcompany.growmaster.signin`
   - Enable Sign In with Apple
   - Configure domains and redirect URLs
6. Create Key:
   - Key Type: Sign In with Apple
   - Download .p8 key file
7. Add to `.env`:
   ```env
   APPLE_CLIENT_ID="com.yourcompany.growmaster.signin"
   APPLE_TEAM_ID="ABCD123456"
   APPLE_KEY_ID="KEY123456"
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

## RevenueCat Setup

### 1. Create RevenueCat Account

1. Go to [RevenueCat](https://www.revenuecat.com/)
2. Sign up for free account
3. Create new project: "GrowMaster AI"

### 2. Configure App

1. Add new app in RevenueCat:
   - **iOS**: Bundle ID from `app.config.ts`
   - **Android**: Package name from `app.config.ts`
2. Upload credentials:
   - iOS: App Store Connect API Key
   - Android: Google Service Account JSON

### 3. Create Products

1. Go to "Products" in RevenueCat
2. Create entitlements:
   - `premium` (Premium tier)
   - `pro` (Pro tier)
3. Create products matching your App Store/Play Store:
   - `premium_monthly` ($9.99/month)
   - `premium_yearly` ($79.99/year)
   - `pro_monthly` ($19.99/month)
   - `pro_yearly` ($149.99/year)
4. Attach products to entitlements

### 4. Get API Key

1. Go to "API Keys" in RevenueCat
2. Copy public API key
3. Add to `.env`:
   ```env
   REVENUECAT_API_KEY="appl_..."
   ```

### 5. Test in Sandbox

- iOS: Use Sandbox Apple ID
- Android: Add test account in Play Console

## Running the App

### Start Development Servers

```bash
# Start both backend and frontend
pnpm dev

# Or separately:
pnpm dev:server  # Backend on port 3000
pnpm dev:metro   # Expo on port 8081
```

### Run on iOS

```bash
# Start iOS simulator
pnpm ios

# Or manually:
# 1. Open Xcode
# 2. Open iOS Simulator
# 3. In terminal: pnpm dev
# 4. Press 'i' in terminal
```

### Run on Android

```bash
# Start Android emulator
pnpm android

# Or manually:
# 1. Open Android Studio
# 2. Start AVD (Android Virtual Device)
# 3. In terminal: pnpm dev
# 4. Press 'a' in terminal
```

### Run on Physical Device

1. Install Expo Go app from App Store/Play Store
2. Make sure device is on same WiFi as computer
3. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL="http://YOUR_LOCAL_IP:3000"
   ```
4. Start dev server: `pnpm dev`
5. Scan QR code with Expo Go

### Run on Web

1. Start dev server: `pnpm dev`
2. Open browser: `http://localhost:8081`

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Failed

1. Check MySQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mysql
   
   # Windows
   # Check Services app
   ```

2. Test connection:
   ```bash
   mysql -u root -p
   ```

3. Verify DATABASE_URL format:
   ```
   mysql://username:password@host:port/database
   ```

### Expo Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
npx expo start --clear
```

### iOS Build Failed

```bash
# Clean and rebuild
cd ios
pod install
cd ..
npx expo run:ios --clean
```

### Android Build Failed

```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..
npx expo run:android --clean
```

### API Requests Failing

1. Check backend is running: `http://localhost:3000/api/health`
2. Check EXPO_PUBLIC_API_URL in `.env`
3. For Android emulator, use: `http://10.0.2.2:3000`
4. For iOS simulator, use: `http://localhost:3000`
5. For physical device, use your computer's local IP

### RevenueCat Not Working

1. Verify API key is correct
2. Ensure app is in sandbox mode for testing
3. Check iOS/Android credentials in RevenueCat
4. Verify Bundle ID / Package name matches

## Next Steps

- Read [DEVELOPMENT.md](./DEVELOPMENT.md) for development workflow
- Check [API.md](./API.md) for API documentation
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Getting Help

- Check [FAQ.md](./FAQ.md)
- Review GitHub Issues
- Contact support team
