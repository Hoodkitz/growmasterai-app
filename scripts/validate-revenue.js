#!/usr/bin/env node
/**
 * Revenue Infrastructure Validation
 * 
 * Validates that all revenue infrastructure is properly configured
 */

console.log('🧪 Validating Revenue Infrastructure\n');

const fs = require('fs');
const path = require('path');

const checks = [];

// Check 1: Required files exist
console.log('✅ Check 1: Required Files');
const requiredFiles = [
  'lib/purchases.ts',
  'lib/purchase-context.tsx',
  'lib/entitlements.ts',
  'lib/subscription.ts',
  'lib/subscription-context.tsx',
  'app/paywall.tsx',
  'components/upgrade-prompt.tsx',
  'app/(tabs)/diagnose.tsx',
  'app/(tabs)/coach.tsx',
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  checks.push(exists);
});
console.log('');

// Check 2: TypeScript compilation
console.log('✅ Check 2: TypeScript Compilation');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  console.log('  ✅ TypeScript compiles without errors');
  checks.push(true);
} catch {
  console.log('  ❌ TypeScript compilation errors');
  checks.push(false);
}
console.log('');

// Check 3: Environment variables documented
console.log('✅ Check 3: Environment Variables');
const envExample = path.join(__dirname, '..', '.env.example');
if (fs.existsSync(envExample)) {
  const content = fs.readFileSync(envExample, 'utf8');
  const hasRC = content.includes('EXPO_PUBLIC_REVENUECAT');
  console.log(`  ${hasRC ? '✅' : '❌'} RevenueCat API key documented`);
  checks.push(hasRC);
} else {
  console.log('  ⚠️  .env.example not found (optional)');
  checks.push(true);
}
console.log('');

// Check 4: Component integration
console.log('✅ Check 4: Component Integration');
const appLayout = fs.readFileSync(path.join(__dirname, '..', 'app/_layout.tsx'), 'utf8');
const hasPurchaseProvider = appLayout.includes('PurchaseProvider');
const hasSubscriptionContext = appLayout.includes('SubscriptionProvider');
console.log(`  ${hasPurchaseProvider ? '✅' : '❌'} PurchaseProvider integrated`);
console.log(`  ${hasSubscriptionContext ? '✅' : '❌'} SubscriptionProvider integrated`);
checks.push(hasPurchaseProvider && hasSubscriptionContext);
console.log('');

// Check 5: Feature gates
console.log('✅ Check 5: Feature Gates');
const diagnoseScreen = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/diagnose.tsx'), 'utf8');
const coachScreen = fs.readFileSync(path.join(__dirname, '..', 'app/(tabs)/coach.tsx'), 'utf8');
const hasLimitCheck = diagnoseScreen.includes('canDiagnose') || diagnoseScreen.includes('remainingDiagnoses');
const hasCoachLimit = coachScreen.includes('canSendMessage') || coachScreen.includes('remainingMessages');
console.log(`  ${hasLimitCheck ? '✅' : '❌'} Diagnosis limits enforced`);
console.log(`  ${hasCoachLimit ? '✅' : '❌'} Coach message limits enforced`);
checks.push(hasLimitCheck && hasCoachLimit);
console.log('');

// Check 6: Paywall UI
console.log('✅ Check 6: Paywall UI');
const paywall = fs.readFileSync(path.join(__dirname, '..', 'app/paywall.tsx'), 'utf8');
const hasUpgradeButton = paywall.includes('handlePurchase');
const hasRestoreButton = paywall.includes('handleRestore');
const hasPricing = paywall.includes('TIER_PRICING');
console.log(`  ${hasUpgradeButton ? '✅' : '❌'} Purchase button implemented`);
console.log(`  ${hasRestoreButton ? '✅' : '❌'} Restore purchases implemented`);
console.log(`  ${hasPricing ? '✅' : '❌'} Pricing displayed`);
checks.push(hasUpgradeButton && hasRestoreButton && hasPricing);
console.log('');

// Summary
console.log('📊 Summary');
console.log('━'.repeat(50));
const passed = checks.filter(Boolean).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

if (percentage === 100) {
  console.log(`✅ All checks passed (${passed}/${total})`);
  console.log('🎯 Revenue infrastructure is ready!');
} else {
  console.log(`⚠️  ${passed}/${total} checks passed (${percentage}%)`);
  console.log('🔧 Some issues need attention');
}
console.log('');

console.log('Next steps:');
console.log('1. Set up RevenueCat account and API keys');
console.log('2. Configure products in App Store Connect / Play Console');
console.log('3. Test purchase flow in sandbox environment');
console.log('4. Run: npm run test-revenue (if available)');

process.exit(percentage === 100 ? 0 : 1);
