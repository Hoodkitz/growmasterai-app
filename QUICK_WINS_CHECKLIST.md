# Quick Wins Implementation Checklist

## Top 5 Revenue Opportunities - Ready to Implement

---

## 1. ✅ 7-Day Premium Trial (Highest Priority)

### Files to Modify:
- [ ] `lib/purchases.ts` - Configure RevenueCat trial offering
- [ ] `lib/subscription.ts` - Add trial state tracking
- [ ] `lib/subscription-context.tsx` - Expose trial status in context
- [ ] `app/paywall.tsx` - Update CTA to "Start 7-Day Free Trial"
- [ ] `components/upgrade-prompt.tsx` - Show trial availability

### RevenueCat Dashboard:
- [ ] Create Premium trial offering (7 days, $0)
- [ ] Configure auto-renewal to €4.99/mo after trial
- [ ] Set up webhook for `INITIAL_PURCHASE` event

### Implementation Steps:
```typescript
// 1. lib/subscription.ts - Add trial tracking
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  inTrial: boolean;
  trialEndsAt?: Date;
}

// 2. lib/purchases.ts - Check trial eligibility
export async function isTrialEligible(): Promise<boolean> {
  const customerInfo = await Purchases.getCustomerInfo();
  // User is eligible if never subscribed to Premium or Pro
  return !customerInfo.entitlements.active['premium'] && 
         !customerInfo.entitlements.active['pro'];
}

// 3. app/paywall.tsx - Update CTA
{isTrialEligible ? (
  <Text>Start 7-Day Free Trial</Text>
) : (
  <Text>Subscribe to Premium</Text>
)}
```

### Success Metrics:
- Trial start rate: >50% of paywall viewers
- Trial→Paid conversion: >40%
- Monitor cancellation timing (identify drop-off days)

---

## 2. ✅ Annual Billing Default (Lowest Effort, High Impact)

### Files to Modify:
- [ ] `app/paywall.tsx` - Add billing toggle, default annual
- [ ] `components/upgrade-prompt.tsx` - Mention annual savings

### Implementation Steps:
```typescript
// app/paywall.tsx
const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly'); // ← Default annual

// Show savings prominently
const monthlySavings = TIER_PRICING.premium.monthly - TIER_PRICING.premium.yearlyMonthly;

<View className="savings-badge bg-green-500 px-3 py-1 rounded-full">
  <Text className="text-white font-bold">Save €{monthlySavings.toFixed(2)}/mo</Text>
</View>

// Billing toggle
<View className="flex-row border rounded-xl">
  <TouchableOpacity 
    className={billingPeriod === 'monthly' ? 'bg-primary' : 'bg-transparent'}
    onPress={() => setBillingPeriod('monthly')}
  >
    <Text>Monthly</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    className={billingPeriod === 'yearly' ? 'bg-primary' : 'bg-transparent'}
    onPress={() => setBillingPeriod('yearly')}
  >
    <Text>Annual (Save 33%)</Text>
  </TouchableOpacity>
</View>
```

### Success Metrics:
- Annual subscription rate: >60%
- LTV increase: +25-30%
- Churn rate reduction: -40%

---

## 3. ✅ Soft Usage Warnings (Better UX = Higher Conversion)

### Files to Modify:
- [ ] `app/(tabs)/diagnose.tsx` - Add 75% warning banner
- [ ] `app/(tabs)/coach.tsx` - Add 75% warning banner
- [ ] `components/upgrade-prompt.tsx` - Add "soft" variant

### Implementation Steps:
```typescript
// app/(tabs)/diagnose.tsx
const usagePercent = (dailyDiagnoses / limits.diagnosesPerDay) * 100;

{usagePercent >= 75 && usagePercent < 100 && (
  <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
    <View className="flex-row items-center gap-2">
      <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#F59E0B" />
      <Text className="flex-1 text-sm text-yellow-800">
        {remainingDiagnoses} diagnosis left today. Upgrade for unlimited access.
      </Text>
    </View>
    <TouchableOpacity 
      className="mt-2 bg-yellow-500 py-2 px-4 rounded-lg"
      onPress={() => router.push('/paywall')}
    >
      <Text className="text-white font-semibold text-center">View Premium</Text>
    </TouchableOpacity>
  </View>
)}

// At 100% (hard limit) - existing UpgradePrompt
{usagePercent >= 100 && (
  <UpgradePrompt feature="Diagnosen" limit={limits.diagnosesPerDay} />
)}
```

### Success Metrics:
- Soft warning→upgrade rate: >5%
- Reduced hard limit frustration (survey users)
- Lower churn among free users

---

## 4. ✅ Analytics Tracking (Foundation for All Optimization)

### Files to Create:
- [ ] `lib/analytics.ts` - Event tracking wrapper

### Files to Modify:
- [ ] `app/paywall.tsx` - Track views, CTA clicks, exits
- [ ] `components/upgrade-prompt.tsx` - Track impressions, dismissals
- [ ] `lib/purchases.ts` - Track purchase events
- [ ] `app/(tabs)/diagnose.tsx` - Track limit hits
- [ ] `app/(tabs)/coach.tsx` - Track limit hits

### Implementation Steps:
```typescript
// lib/analytics.ts
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties,
    timestamp: Date.now(),
  };
  
  // Log locally for now (later: send to PostHog/Amplitude)
  console.log('[Analytics]', analyticsEvent);
  
  // Store in AsyncStorage for batch upload
  AsyncStorage.getItem('@analytics_queue').then(queue => {
    const events = queue ? JSON.parse(queue) : [];
    events.push(analyticsEvent);
    AsyncStorage.setItem('@analytics_queue', JSON.stringify(events.slice(-100)));
  });
}

// Key events to track:

// Paywall funnel
trackEvent('paywall_viewed', { tier: 'premium', source: 'diagnose_limit' });
trackEvent('paywall_cta_clicked', { tier: 'premium', billingPeriod: 'yearly' });
trackEvent('paywall_dismissed', { tier: 'premium', timeOnPage: 15 });

// Purchase funnel
trackEvent('checkout_started', { tier: 'premium', price: 4.99 });
trackEvent('purchase_completed', { tier: 'premium', price: 4.99, billingPeriod: 'yearly' });
trackEvent('purchase_failed', { tier: 'premium', error: 'payment_declined' });

// Feature usage
trackEvent('feature_limit_hit', { feature: 'diagnose', remaining: 0 });
trackEvent('upgrade_prompt_shown', { feature: 'diagnose', tier: 'free' });
trackEvent('upgrade_prompt_dismissed', { feature: 'diagnose', dismissCount: 3 });

// Trial
trackEvent('trial_started', { tier: 'premium' });
trackEvent('trial_ended', { tier: 'premium', converted: true });
```

### Add to Key Screens:
```typescript
// app/paywall.tsx
useEffect(() => {
  trackEvent('paywall_viewed', { 
    tier: selectedTier,
    source: route.params?.source || 'unknown' 
  });
}, []);

// components/upgrade-prompt.tsx
useEffect(() => {
  trackEvent('upgrade_prompt_shown', { 
    feature, 
    tier, 
    remaining 
  });
}, [feature, tier]);

const handleDismiss = () => {
  trackEvent('upgrade_prompt_dismissed', { feature, tier });
  onClose();
};

// lib/purchases.ts
const handlePurchase = async (packageToPurchase: Package) => {
  trackEvent('checkout_started', {
    tier: getTierFromPackage(packageToPurchase),
    price: packageToPurchase.product.price
  });
  
  try {
    const purchase = await Purchases.purchasePackage(packageToPurchase);
    trackEvent('purchase_completed', {
      tier: getTierFromPackage(packageToPurchase),
      price: packageToPurchase.product.price,
      billingPeriod: packageToPurchase.identifier.includes('annual') ? 'yearly' : 'monthly'
    });
  } catch (error) {
    trackEvent('purchase_failed', {
      tier: getTierFromPackage(packageToPurchase),
      error: error.message
    });
  }
};
```

### Success Metrics:
- 100% event coverage of conversion funnel
- Identify drop-off points (e.g., 50% exit at checkout)
- Track feature→upgrade correlation

---

## 5. ✅ Abandoned Checkout Recovery

### Files to Create:
- [ ] `lib/checkout-recovery.ts` - Track abandonment & schedule recovery

### Files to Modify:
- [ ] `app/paywall.tsx` - Log paywall views
- [ ] `lib/purchases.ts` - Mark checkout as completed
- [ ] `app/_layout.tsx` - Check for abandoned checkouts on startup

### Implementation Steps:
```typescript
// lib/checkout-recovery.ts
const RECOVERY_KEY = '@checkout_recovery';

interface CheckoutSession {
  tier: SubscriptionTier;
  timestamp: number;
  completed: boolean;
  reminderSent: boolean;
}

export async function trackPaywallView(tier: SubscriptionTier) {
  const session: CheckoutSession = {
    tier,
    timestamp: Date.now(),
    completed: false,
    reminderSent: false
  };
  await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(session));
}

export async function markCheckoutComplete() {
  const session = await getCheckoutSession();
  if (session) {
    session.completed = true;
    await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(session));
  }
}

export async function checkAbandonedCheckout() {
  const session = await getCheckoutSession();
  
  if (!session || session.completed || session.reminderSent) return;
  
  const hoursSinceView = (Date.now() - session.timestamp) / (1000 * 60 * 60);
  
  // Send reminder after 1 hour
  if (hoursSinceView >= 1) {
    await sendRecoveryNotification(session.tier);
    session.reminderSent = true;
    await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(session));
  }
}

async function sendRecoveryNotification(tier: SubscriptionTier) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Still interested in Premium? 🌱",
      body: "Unlock unlimited diagnoses and expert coaching. Start your free trial now!",
      data: { screen: '/paywall', tier }
    },
    trigger: null // Send immediately
  });
  
  trackEvent('recovery_notification_sent', { tier, timeSinceView: '1h' });
}
```

### Integration:
```typescript
// app/paywall.tsx
useEffect(() => {
  trackPaywallView(selectedTier);
}, [selectedTier]);

// lib/purchases.ts
const handlePurchase = async (packageToPurchase: Package) => {
  try {
    const purchase = await Purchases.purchasePackage(packageToPurchase);
    await markCheckoutComplete(); // ← Mark completed
    // ...
  } catch (error) {
    // Don't mark complete on error
  }
};

// app/_layout.tsx (on app startup)
useEffect(() => {
  checkAbandonedCheckout();
}, []);
```

### Success Metrics:
- Recovery notification open rate: >30%
- Abandoned→Purchase conversion: >10%
- Time to recovery conversion: <24 hours

---

## Additional Quick Wins (Lower Priority, Still High ROI)

### 6. Promotional Offers Infrastructure
- [ ] Add promo code input to paywall
- [ ] Create offers in RevenueCat dashboard
- [ ] Track promo code usage

### 7. Social Proof in Paywall
- [ ] Add user count: "Join 10,000+ growers"
- [ ] Add testimonials with photos
- [ ] Add rating: "4.8★ from Pro users"

### 8. Exit-Intent Discount
- [ ] Track paywall dismissals
- [ ] Show 20% discount on 2nd dismissal
- [ ] Time-limit offer (10 minutes)

---

## Testing Checklist

Before deploying to production:

### Functional Testing
- [ ] Trial subscription works in sandbox
- [ ] Annual billing shows correct pricing
- [ ] Soft warnings appear at 75% usage
- [ ] Analytics events fire correctly
- [ ] Recovery notifications send after 1 hour
- [ ] Promo codes apply discounts

### Edge Cases
- [ ] User starts trial, cancels, tries to start again (should block)
- [ ] User switches from monthly to annual mid-subscription
- [ ] Analytics queue doesn't grow unbounded
- [ ] Recovery notification doesn't spam if user opens paywall multiple times

### Metrics Validation
- [ ] All events appear in analytics dashboard
- [ ] Conversion funnel shows correct drop-off points
- [ ] Revenue attribution matches RevenueCat

---

## Deployment Plan

### Phase 1 (Week 1): Foundation
1. Deploy analytics tracking
2. Test in staging for 48 hours
3. Monitor event volume and accuracy
4. Deploy to 10% of users (A/B test)

### Phase 2 (Week 2): Trial + Annual
1. Configure RevenueCat trial offering
2. Update paywall with trial CTA and annual default
3. Test purchase flows in sandbox
4. Deploy to 25% of users

### Phase 3 (Week 3): Soft Warnings + Recovery
1. Add soft usage warnings
2. Implement checkout recovery
3. Test notification delivery
4. Deploy to 50% of users

### Phase 4 (Week 4): Full Rollout
1. Monitor metrics for anomalies
2. Roll out to 100% if metrics positive
3. Collect user feedback
4. Iterate based on data

---

## Success Criteria

After 30 days, we should see:
- ✅ Trial start rate: >50% of paywall viewers
- ✅ Trial→Paid conversion: >40%
- ✅ Annual billing rate: >60%
- ✅ Free→Premium conversion: +15-20%
- ✅ Recovery notification→purchase: >10%
- ✅ MRR growth: +20-25%

---

## Risk Mitigation

### Technical Risks
- **RevenueCat downtime:** Cache last known subscription status locally
- **Analytics overflow:** Limit queue to 100 events, batch upload daily
- **Notification spam:** Rate-limit to 1 recovery notification per 48 hours

### Business Risks
- **Trial abuse:** Track device IDs, block repeat trials
- **Refund spike:** Monitor refund rate, adjust trial length if >15%
- **User confusion:** Add FAQ, improve upgrade messaging

### Rollback Plan
If metrics worsen after deployment:
1. Revert to previous paywall (feature flag)
2. Disable trials for new users
3. Analyze drop-off points in funnel
4. Iterate and re-deploy

---

## Next Steps

**Immediate (Today):**
1. Create `lib/analytics.ts`
2. Add tracking to paywall and upgrade prompts
3. Test event logging in development

**This Week:**
1. Configure RevenueCat trial offering
2. Update paywall UI for annual default
3. Add soft usage warnings
4. Deploy to staging environment

**Next Week:**
1. Implement checkout recovery
2. Run A/B test: trial vs no trial
3. Monitor conversion metrics
4. Iterate based on data

---

**Remember:** Start small, measure everything, iterate quickly. Each 1% conversion improvement = significant MRR growth over time.
