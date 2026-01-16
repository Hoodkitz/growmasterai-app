# 🏗️ Build Guide - GrowMaster AI

Complete guide for building production-ready APK and IPA files.

## Prerequisites

- EAS CLI installed: `npm install -g eas-cli`
- Expo account (free tier is sufficient)
- Apple Developer Account (for iOS)
- Google Play Developer Account (for Android)

## EAS Configuration

### 1. Initialize EAS

```bash
# Login to Expo
eas login

# Initialize EAS in your project
eas build:configure
```

This creates `eas.json` with build profiles.

### 2. Configure eas.json

Create/update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "bundleIdentifier": "space.manus.growmaster.app.t20251231214615"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Android Build

### APK (For Testing)

```bash
# Build APK for testing
eas build --platform android --profile preview

# Download APK when done
# Install on device: adb install path/to/app.apk
```

### AAB (For Play Store)

```bash
# Build AAB for production
eas build --platform android --profile production

# This creates an Android App Bundle (.aab)
# Upload to Google Play Console
```

### Android Signing

1. **Generate Keystore** (first time only):
   ```bash
   # EAS handles this automatically
   # Or use existing keystore:
   eas build --platform android --profile production
   # Choose: Use existing keystore
   ```

2. **Configure Credentials**:
   - Go to [Expo Dashboard](https://expo.dev/)
   - Navigate to project → Credentials
   - Add Android keystore details

### Testing APK

```bash
# Install via USB
adb install app.apk

# Or share APK link from EAS build
# Users can download and install (enable "Unknown Sources")
```

## iOS Build

### IPA (For TestFlight)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Submit to TestFlight
eas submit --platform ios
```

### IPA (For App Store)

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### iOS Signing

1. **Configure Apple Account**:
   ```bash
   eas credentials
   # Select: iOS
   # Choose: App Store Connect API Key
   ```

2. **Required Credentials**:
   - Apple Developer Account
   - App Store Connect API Key
   - Bundle Identifier matches `app.config.ts`
   - Provisioning Profile

3. **Manual Certificate** (alternative):
   - Create in Apple Developer Portal
   - Download provisioning profile
   - Upload to EAS credentials

### Testing IPA

```bash
# Install via TestFlight
# 1. Upload build to TestFlight
# 2. Add internal testers
# 3. Testers install via TestFlight app

# Or install via Xcode:
# 1. Open Xcode → Window → Devices and Simulators
# 2. Connect device
# 3. Drag IPA to device
```

## Local Builds (Alternative)

### Android Local Build

```bash
# Prebuild native code
npx expo prebuild --platform android

# Open in Android Studio
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### iOS Local Build

```bash
# Prebuild native code
npx expo prebuild --platform ios

# Open in Xcode
open ios/GrowMasterAI.xcworkspace

# Build → Archive → Distribute
```

## Environment Variables for Builds

### Set Build Secrets

```bash
# Set environment variables for EAS build
eas secret:create --name GEMINI_API_KEY --value "your-key"
eas secret:create --name DATABASE_URL --value "mysql://..."
eas secret:create --name REVENUECAT_API_KEY --value "appl_..."
```

### Update app.config.ts for Build-time Vars

```typescript
export default {
  // ...
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    // Add other build-time variables
  },
};
```

### Access in App

```typescript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

## Build Profiles Explained

### Development
- Development client
- Fast builds
- Debugging enabled
- Local development

### Preview
- Internal distribution
- APK for Android (not AAB)
- TestFlight for iOS
- Testing with testers

### Production
- Store distribution
- Optimized builds
- AAB for Android
- App Store for iOS

## Build Checklist

### Pre-Build
- [ ] Update version in `app.config.ts`
- [ ] Set all environment variables
- [ ] Test locally with `expo start`
- [ ] Run `pnpm check` (TypeScript)
- [ ] Run `pnpm test` (all tests pass)
- [ ] Update CHANGELOG.md
- [ ] Commit all changes

### Android
- [ ] Bundle ID matches Google Play
- [ ] Icons and splash screen set
- [ ] Permissions configured
- [ ] Keystore configured in EAS
- [ ] Privacy policy URL set
- [ ] RevenueCat Android setup complete

### iOS
- [ ] Bundle ID matches App Store
- [ ] Icons and splash screen set
- [ ] Capabilities configured
- [ ] Provisioning profile valid
- [ ] Privacy descriptions set
- [ ] RevenueCat iOS setup complete

## Build Commands Reference

```bash
# List all builds
eas build:list

# Cancel a build
eas build:cancel

# View build logs
eas build:view <build-id>

# Download build artifact
eas build:download <build-id>

# Check build status
eas build:list --status=in-progress

# Build for both platforms
eas build --platform all --profile production
```

## Troubleshooting

### Build Failed: Missing Credentials

```bash
# Reconfigure credentials
eas credentials
```

### Build Failed: Gradle Error (Android)

```bash
# Clear cache and rebuild
eas build --platform android --clear-cache
```

### Build Failed: CocoaPods Error (iOS)

```bash
# Update dependencies
cd ios && pod update && cd ..
eas build --platform ios --clear-cache
```

### Bundle Size Too Large

```typescript
// Enable Hermes engine (already enabled by default in Expo 50+)
// In app.config.ts:
export default {
  ios: {
    jsEngine: "hermes"
  },
  android: {
    jsEngine: "hermes"
  }
};
```

### Upload Failed

```bash
# Check internet connection
# Verify credentials
eas submit --platform ios --verbose
```

## Optimization Tips

### Reduce Bundle Size

1. **Remove unused dependencies**:
   ```bash
   npx depcheck
   ```

2. **Enable code splitting**:
   ```typescript
   // Use dynamic imports
   const Screen = lazy(() => import('./screens/HeavyScreen'));
   ```

3. **Optimize images**:
   - Use WebP format
   - Compress images
   - Use appropriate resolutions

### Improve Build Time

1. **Use cache**:
   ```bash
   eas build --platform android --cache
   ```

2. **Skip dependency install** (if unchanged):
   ```json
   {
     "build": {
       "production": {
         "cache": {
           "disabled": false
         }
       }
     }
   }
   ```

## Store Submission

### Google Play Store

1. Create app in Play Console
2. Upload AAB from EAS
3. Fill store listing
4. Set content rating
5. Complete privacy policy
6. Submit for review

### Apple App Store

1. Create app in App Store Connect
2. Upload build via EAS submit or TestFlight
3. Fill app information
4. Add screenshots
5. Set privacy details
6. Submit for review

## CI/CD Integration

### GitHub Actions Example

```yaml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g eas-cli
      - run: pnpm install
      - run: pnpm test
      - run: eas build --platform all --non-interactive --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## Next Steps

After successful build:
1. Test on physical devices
2. Conduct beta testing
3. Gather feedback
4. Fix issues
5. Submit to stores

## Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)
