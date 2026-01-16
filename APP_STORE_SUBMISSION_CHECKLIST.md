# ✅ App Store Submission Checklist

## 🎯 Status: Ready for Submission

---

## 📱 APPLE APP STORE

### Account & Setup
- [ ] Apple Developer Account ($99/year)
- [ ] App ID created in Developer Portal
- [ ] Certificates configured
- [ ] Bundle ID: `space.manus.growmaster.app.t20251231214615`

### App Information
- [x] App Name: GrowMaster AI
- [x] Subtitle: AI Diagnosis, Reminders & Grow Tracking
- [x] Description: (See STORE_LISTING.md)
- [x] Keywords: (See STORE_LISTING.md)
- [x] Category: Lifestyle
- [x] Age Rating: 17+

### Required Assets
- [ ] App Icon (1024x1024 PNG)
- [ ] Screenshots (6.5", 5.5", iPad sizes)
- [ ] App Preview Video (optional, recommended)
- [ ] Privacy Policy URL
- [ ] Support URL

### Technical
- [ ] Build with EAS: `eas build --platform ios --profile production`
- [ ] TestFlight beta testing
- [ ] No crashes in testing
- [ ] Performance >60fps
- [ ] App size <200MB

### Legal & Compliance
- [x] Privacy Policy URL: https://growmaster.ai/privacy
- [x] Terms of Service URL: https://growmaster.ai/terms
- [x] Age-appropriate content rating
- [x] Content warning about cannabis
- [ ] COPPA compliant (no data from <13)

### In-App Purchases (RevenueCat)
- [ ] Premium Monthly ($6.99)
- [ ] Premium Yearly ($59.99)
- [ ] Pro Monthly ($12.99)
- [ ] Pro Yearly ($99.99)
- [ ] Products created in App Store Connect
- [ ] RevenueCat configured

### Review Preparation
- [x] Review notes prepared
- [ ] Test account created
- [ ] Demo mode works
- [ ] All features accessible

---

## 🤖 GOOGLE PLAY STORE

### Account & Setup
- [ ] Google Play Console account ($25 one-time)
- [ ] App created in console
- [ ] Package name: `space.manus.growmaster.app`

### App Information
- [x] App Name: GrowMaster AI
- [x] Short Description: (80 chars)
- [x] Full Description: (See STORE_LISTING.md)
- [x] Category: House & Home
- [x] Content Rating: Mature 17+

### Required Assets
- [ ] App Icon (512x512 PNG)
- [ ] Feature Graphic (1024x500 PNG)
- [ ] Screenshots (minimum 2, up to 8)
- [ ] Privacy Policy URL

### Technical
- [ ] Build with EAS: `eas build --platform android --profile production`
- [ ] Signed AAB
- [ ] Internal testing track
- [ ] No crashes
- [ ] <150MB app size

### Store Listing
- [ ] High-resolution icon
- [ ] Feature graphic
- [ ] Screenshots
- [ ] Video (optional)

### Legal & Compliance
- [x] Privacy Policy
- [x] Content rating questionnaire
- [x] Target audience
- [ ] Data safety section filled

### In-App Products
- [ ] Products created in Play Console
- [ ] Prices set
- [ ] RevenueCat configured for Android

---

## 🚀 Pre-Submission Commands

### Build for iOS
```bash
# Configure EAS (if not done)
eas build:configure

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Build for Android
```bash
# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

---

## 📋 Final Testing Checklist

### Functionality
- [ ] All screens load without errors
- [ ] Login/Signup works
- [ ] Create plant works
- [ ] Add journal entry works
- [ ] Take photo works (AI Diagnosis)
- [ ] AI Coach responds
- [ ] Reminders can be set
- [ ] Push notifications work
- [ ] Community feed loads
- [ ] Marketplace loads
- [ ] Settings work
- [ ] Logout works

### Performance
- [ ] App launches <3 seconds
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks
- [ ] Images load quickly
- [ ] No ANR (Android Not Responding)
- [ ] Battery usage reasonable

### UI/UX
- [ ] Consistent across screens
- [ ] All buttons respond to touch
- [ ] Loading states show
- [ ] Error messages are clear
- [ ] Navigation makes sense
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area handled correctly

### Edge Cases
- [ ] Works without internet (offline mode)
- [ ] Handles poor connection
- [ ] Works on different screen sizes
- [ ] Handles no camera permission
- [ ] Handles no notification permission
- [ ] Empty states look good

---

## 📸 Asset Creation Guide

### App Icon Design
**Requirements:**
- 1024x1024 PNG (iOS)
- 512x512 PNG (Android)
- No transparency
- High contrast
- Recognizable at small sizes

**Design Suggestions:**
- Green cannabis leaf
- 🌱 + AI brain icon
- Minimalist design
- Brand colors: Green (#10B981)

**Tools:**
- Figma
- Canva
- Adobe Illustrator

### Screenshots
**Tips:**
- Use actual app screens
- Add text overlay with benefits
- Show key features
- Use diverse plant examples
- Professional quality

**Required Sizes (iOS):**
1. 1284 x 2778 (iPhone 14 Pro Max)
2. 1242 x 2208 (iPhone 8 Plus)
3. 2048 x 2732 (iPad Pro)

**Required Sizes (Android):**
1. 1080 x 1920 (Phone)
2. 1200 x 1920 (Tablet - optional)

### Feature Graphic (Android Only)
**Size:** 1024 x 500 PNG
**Content:** Hero shot of app with tagline

---

## 🌐 Required Website Pages

### 1. Privacy Policy
**Must include:**
- What data is collected
- How data is used
- Third-party services (RevenueCat, Analytics)
- User rights (GDPR)
- Contact information
- Age restrictions

**Template:** https://www.privacypolicygenerator.info/

### 2. Terms of Service
**Must include:**
- Acceptable use policy
- User responsibilities
- Legal disclaimers
- Content ownership
- Termination clause
- Governing law

### 3. Support Page
**Must include:**
- FAQs
- Contact email
- Response time
- Common issues
- Video tutorials (optional)

---

## 💰 Pricing Configuration

### RevenueCat Setup
1. Create products in RevenueCat dashboard
2. Link to App Store Connect products
3. Link to Play Console products
4. Configure entitlements:
   - `premium` - Premium tier
   - `pro` - Pro tier

### App Store Connect
1. Go to In-App Purchases
2. Create consumable/subscriptions
3. Set prices
4. Add localized descriptions
5. Submit for review

### Play Console
1. Go to Monetize > Products > Subscriptions
2. Create products
3. Set prices
4. Add descriptions
5. Activate

---

## 🎬 Launch Day Checklist

### Morning of Launch
- [ ] Final build submitted and approved
- [ ] All store listings complete
- [ ] Pricing configured
- [ ] Landing page live
- [ ] Social media posts scheduled

### Launch
- [ ] Press "Release" button
- [ ] Monitor for crashes
- [ ] Check analytics
- [ ] Respond to early reviews
- [ ] Fix critical bugs immediately

### First Week
- [ ] Daily crash monitoring
- [ ] Review responses
- [ ] User feedback collection
- [ ] Prepare hotfix if needed

---

## 📊 Success Metrics to Track

### Week 1
- Downloads
- Crash rate
- DAU/MAU
- Conversion rate (free to paid)

### Month 1
- Retention (Day 1, 7, 30)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
- Review rating

### Ongoing
- Feature adoption
- Session length
- Churn rate
- Revenue

---

## 🆘 Troubleshooting

### iOS Rejection Reasons
**Common:**
- Missing age rating
- Incomplete metadata
- Guideline violations
- Crashes during review

**Solutions:**
- Review notes clear
- Demo account works
- No cannabis sales
- Educational purpose clear

### Android Rejection
**Common:**
- Privacy policy missing
- Content rating wrong
- Icon quality low
- Metadata violations

**Solutions:**
- Fill all required fields
- Professional assets
- Clear descriptions
- Accurate ratings

---

## 📞 Support Contacts

**Apple Developer Support:**
- Phone: 1-800-633-2152
- https://developer.apple.com/contact/

**Google Play Support:**
- https://support.google.com/googleplay/android-developer/

**RevenueCat Support:**
- support@revenuecat.com
- https://docs.revenuecat.com/

---

## ✅ Final Pre-Launch Checklist

One day before submission:

- [ ] All code committed to git
- [ ] Version number updated (1.0.0)
- [ ] Build number incremented
- [ ] All TODOs resolved
- [ ] No console.logs in production
- [ ] Analytics configured
- [ ] Error tracking configured
- [ ] All secrets in environment variables
- [ ] Database backups configured
- [ ] Team notified
- [ ] Marketing materials ready
- [ ] Support email monitored

---

**🚀 READY TO LAUNCH!**

Last updated: 2026-01-08
Version: 1.0.0
