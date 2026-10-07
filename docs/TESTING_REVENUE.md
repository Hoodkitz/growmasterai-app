# Revenue Infrastructure Testing Guide

## Quick Start

```bash
# Validate infrastructure
node scripts/validate-revenue.js

# Run app for testing
npx expo start
```

## Sandbox Testing Checklist

### iOS Testing

1. **Setup Sandbox Account**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to Users and Access → Sandbox Testers
   - Create a new sandbox tester account
   - Note down credentials (don't use a real email)

2. **Sign into Sandbox**
   - On your test device: Settings → App Store
   - Scroll to bottom: Sandbox Account
   - Sign in with test account credentials

3. **Test Purchase Flow**
   ```bash
   # Build for iOS
   npx expo run:ios --device
   
   # Or use simulator
   npx expo run:ios
   ```
   
   - Navigate to Settings → See upgrade options
   - Or trigger paywall by hitting a limit
   - Select a subscription tier
   - Complete purchase (won't be charged)
   - Verify subscription badge appears
   - Check limits increased

4. **Test Restore**
   - Delete and reinstall app
   - Navigate to Settings
   - Tap "Restore Purchases"
   - Verify subscription restored

### Android Testing

1. **Setup Test Account**
   - Go to [Google Play Console](https://play.google.com/console)
   - Setup → License testing
   - Add your Gmail account as a license tester

2. **Upload Test Build**
   ```bash
   # Build APK
   eas build --platform android --profile preview
   
   # Or build locally
   npx expo run:android
   ```

3. **Test Purchase Flow**
   - Install app on test device
   - Navigate to paywall
   - Select subscription
   - Complete test purchase
   - Verify features unlock

4. **Test Restore**
   - Clear app data or reinstall
   - Restore purchases from settings
   - Verify subscription state

## Manual Testing (No Purchase)

### Mock Subscription Tier

Temporarily force a premium tier to test UI:

```typescript
// In lib/subscription-context.tsx
const [tier, setTier] = useState<SubscriptionTier>("pro"); // Force pro tier
```

### Test Scenarios

1. **Free Tier Limits**
   - Make 3 diagnoses → should see limit
   - Send 5 coach messages → should see limit
   - Try to add 3rd plant → should block
   - Check upgrade prompts appear

2. **Paywall UI**
   - Navigate to `/paywall`
   - Toggle monthly/yearly/lifetime
   - Verify pricing displays
   - Check feature comparison table
   - Test restore button (no-op on first install)

3. **Premium Features**
   - With tier = "pro":
     - Unlimited diagnoses
     - Unlimited messages
     - All features unlocked
     - No upgrade prompts

4. **Upgrade Prompts**
   - Hit free tier limits
   - Verify upgrade prompt shows
   - Tap upgrade → navigates to paywall
   - Check "Remaining X/Y" indicators

## Feature Gate Testing

### Diagnosis Limits
```typescript
// Free: 3/day
// Premium: 15/day  
// Pro: unlimited

// Test in app/(tabs)/diagnose.tsx
- Take photo and analyze
- Check UsageIndicator shows count
- At limit: see UpgradePrompt
```

### Coach Message Limits
```typescript
// Free: 5/day
// Premium: 50/day
// Pro: unlimited

// Test in app/(tabs)/coach.tsx
- Send messages
- Check counter decrements
- At limit: see UpgradePrompt
```

### Plants Limit
```typescript
// Free: 2 plants
// Premium: 10 plants
// Pro: unlimited

// Test plant addition
- Add plants up to limit
- Try to add one more
- Should show upgrade prompt
```

## Environment Variables

Create `.env` with:

```bash
# RevenueCat (required for real purchases)
EXPO_PUBLIC_REVENUECAT_API_KEY=your_key_here

# Entitlements (default: "GrowMaster AI Pro")
EXPO_PUBLIC_RC_ENTITLEMENT_PRO="GrowMaster AI Pro"
EXPO_PUBLIC_RC_ENTITLEMENT_PREMIUM=""  # Empty = no premium tier

# Offerings (optional, uses "current" by default)
EXPO_PUBLIC_RC_OFFERING_PRO=""
EXPO_PUBLIC_RC_OFFERING_PREMIUM=""
```

## RevenueCat Dashboard Setup

### 1. Create Project
- Sign up at [RevenueCat](https://www.revenuecat.com)
- Create new project
- Add iOS and/or Android app
- Copy API keys

### 2. Configure Products

**Product IDs:**
- `monthly` - Monthly subscription
- `yearly` - Annual subscription  
- `lifetime` - One-time purchase (optional)

**Create these in:**
- iOS: App Store Connect → In-App Purchases
- Android: Play Console → Monetization → Products

### 3. Create Entitlements

In RevenueCat dashboard:
- Create entitlement: `GrowMaster AI Pro`
- Attach to all products
- (Optional) Create separate `GrowMaster AI Premium` for tiered pricing

### 4. Create Offerings

- Create offering: `default` (or named offerings)
- Add packages:
  - `$rc_monthly` → monthly product
  - `$rc_annual` → yearly product
  - `$rc_lifetime` → lifetime product (optional)

## Debugging

### Common Issues

**"No packages found"**
```bash
# Check:
- EXPO_PUBLIC_REVENUECAT_API_KEY is set
- Products configured in stores
- Offerings created in RevenueCat
- App bundle ID matches RevenueCat project
```

**"Purchase failed"**
```bash
# Check:
- Using sandbox account (iOS)
- License tester added (Android)
- Product IDs match exactly
- RevenueCat dashboard shows no errors
```

**Tier not updating**
```bash
# Check:
- Entitlement ID matches exactly
- CustomerInfo listener is active
- Try restore purchases
- Check RevenueCat dashboard customer info
```

### Debug Logs

Add to `lib/purchases.ts`:

```typescript
// Enable debug logs
Purchases.setLogLevel(LOG_LEVEL.DEBUG);
```

View logs:
```bash
# iOS
npx react-native log-ios

# Android  
npx react-native log-android
```

## Platform-Specific Notes

### Web / Expo Go

- In-app purchases are **not available**
- Paywall shows informational view only
- No actual purchase buttons
- Use physical device or built app for testing

### iOS

- Requires physical device or simulator with Apple ID
- Sandbox purchases don't charge real money
- Can test multiple times with same account
- Subscriptions auto-renew faster in sandbox (minutes, not months)

### Android

- Can test on emulator with Google Play
- Test purchases may show "Item already owned" on retry
- Clear Play Store cache if stuck
- Use different test accounts for fresh testing

## Validation Checklist

Before submitting to stores:

- [ ] All TypeScript compiles (`npx tsc --noEmit`)
- [ ] Products created in stores
- [ ] RevenueCat configured with real keys
- [ ] Sandbox purchases tested
- [ ] Restore purchases tested
- [ ] Feature gates working
- [ ] Paywall UI polished
- [ ] Legal links functional
- [ ] Subscription management works
- [ ] Analytics tracking purchases (if implemented)

## Quick Commands

```bash
# Validate infrastructure
node scripts/validate-revenue.js

# Type check
npx tsc --noEmit

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android

# Build for testing
eas build --platform ios --profile preview
eas build --platform android --profile preview

# View logs
npx react-native log-ios
npx react-native log-android
```

## Support

- RevenueCat Docs: https://www.revenuecat.com/docs
- Apple IAP: https://developer.apple.com/in-app-purchase/
- Google Play Billing: https://developer.android.com/google/play/billing

## Notes

- **Don't test with real accounts** - use sandbox/test accounts only
- **Sandbox subscriptions renew faster** - minutes instead of months
- **First purchase may require App Store/Play password** even in sandbox
- **Clear app data between tests** for fresh state
- **Check RevenueCat dashboard** for real-time purchase events
