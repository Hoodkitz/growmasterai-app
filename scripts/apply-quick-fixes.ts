#!/usr/bin/env tsx
/**
 * Performance Quick-Fix Automation
 * 
 * Automatische Anwendung der wichtigsten Performance-Fixes
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function applyFix(name: string, fn: () => void) {
  try {
    log('blue', `\n🔧 ${name}...`);
    fn();
    log('green', `   ✅ Erfolgreich`);
    return true;
  } catch (err) {
    log('red', `   ❌ Fehler: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// Fix 1: Console.log in theme-provider entfernen
function fixThemeProviderLog() {
  const file = 'lib/theme-provider.tsx';
  let content = readFileSync(file, 'utf8');
  
  // Entferne Zeile 64: console.log(value, themeVariables)
  content = content.replace(/\s*console\.log\(value,\s*themeVariables\)\s*\n?/g, '\n');
  
  writeFileSync(file, content);
}

// Fix 2: Dependencies entfernen
function removeUnusedDependencies() {
  const packages = [
    'expo-audio',
    'expo-image',
    'expo-keep-awake',
    'expo-video',
    '@expo/ngrok',
    '@types/qrcode',
  ];
  
  log('yellow', `   Entferne: ${packages.join(', ')}`);
  execSync(`pnpm remove ${packages.join(' ')}`, { stdio: 'inherit' });
}

// Fix 3: React.memo für AdBanner
function addReactMemoAdBanner() {
  const file = 'components/ad-banner.tsx';
  let content = readFileSync(file, 'utf8');
  
  // Prüfe ob bereits React.memo vorhanden
  if (content.includes('React.memo')) {
    log('yellow', '   Bereits optimiert');
    return;
  }
  
  // Füge React.memo hinzu
  content = content.replace(
    /export (function|const) AdBanner\(/g,
    'export const AdBanner = React.memo(function AdBanner('
  );
  
  // Schließende Klammer für React.memo
  const lines = content.split('\n');
  const lastExportIndex = lines.findIndex(l => l.startsWith('}'));
  if (lastExportIndex !== -1) {
    lines[lastExportIndex] = lines[lastExportIndex] + ');';
  }
  
  writeFileSync(file, lines.join('\n'));
}

// Fix 4: Subscription-Context Error-Logs
function fixSubscriptionContextLogs() {
  const file = 'lib/subscription-context.tsx';
  let content = readFileSync(file, 'utf8');
  
  // Ersetze console.error durch __DEV__-Guard
  content = content.replace(
    /console\.error\("Error refreshing subscription:".+\);/g,
    'if (__DEV__) console.error("Error refreshing subscription:", error);'
  );
  
  writeFileSync(file, content);
}

// Fix 5: Purchase-Context Listener Dependencies
function fixPurchaseContextDeps() {
  const file = 'lib/purchase-context.tsx';
  let content = readFileSync(file, 'utf8');
  
  // Finde useEffect mit CustomerInfoUpdate und ersetze Dependencies
  content = content.replace(
    /(const unsubscribe = addCustomerInfoUpdateListener\(handleCustomerInfoUpdate\);[\s\S]+?return unsubscribe;\s*}\s*,\s*)\[setTier\]/g,
    '$1[]'
  );
  
  writeFileSync(file, content);
}

// Fix 6: Performance-Messung in _layout.tsx
function addPerformanceMeasurement() {
  const file = 'app/_layout.tsx';
  let content = readFileSync(file, 'utf8');
  
  // Prüfe ob bereits vorhanden
  if (content.includes('console.time')) {
    log('yellow', '   Bereits vorhanden');
    return;
  }
  
  // Füge nach "export default function RootLayout()" ein
  const performanceCode = `
  // Performance-Tracking
  useEffect(() => {
    const startTime = performance.now();
    console.time('⚡ App Launch');
    
    return () => {
      const endTime = performance.now();
      console.timeEnd('⚡ App Launch');
      if (__DEV__) {
        console.log(\`📊 Launch-Time: \${(endTime - startTime).toFixed(0)}ms\`);
      }
    };
  }, []);
`;
  
  content = content.replace(
    /(export default function RootLayout\(\) \{)/,
    `$1${performanceCode}`
  );
  
  writeFileSync(file, content);
}

// Fix 7: Onboarding-Check optimieren
function optimizeOnboardingCheck() {
  const file = 'app/_layout.tsx';
  let content = readFileSync(file, 'utf8');
  
  // Ersetze dynamic import durch direkten AsyncStorage-Check
  content = content.replace(
    /React\.useEffect\(\(\) => \{\s+import\('@\/components\/onboarding\/onboarding-flow'\)\.then\(\(\{ getOnboardingStatus \}\) => \{\s+getOnboardingStatus\(\)\.then\(setOnboardingComplete\);\s+\}\);\s+\}, \[\]\);/,
    `React.useEffect(() => {
    // Direkt aus AsyncStorage lesen statt Dynamic-Import
    AsyncStorage.getItem('ONBOARDING_COMPLETE').then((val) => {
      setOnboardingComplete(val === 'true');
    });
  }, []);`
  );
  
  // Import hinzufügen falls nicht vorhanden
  if (!content.includes('AsyncStorage')) {
    content = content.replace(
      /import \{ router \} from "expo-router";/,
      'import { router } from "expo-router";\nimport AsyncStorage from "@react-native-async-storage/async-storage";'
    );
  }
  
  writeFileSync(file, content);
}

// Fix 8: Logger-Utility erstellen
function createLoggerUtility() {
  const loggerCode = `/**
 * Production-Safe Logger
 * 
 * Wrapper um console.* der in Production automatisch deaktiviert wird.
 * Nur console.error bleibt aktiv für Crash-Reporting (Sentry, etc.)
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

export const logger = {
  log: __DEV__ ? console.log.bind(console) : () => {},
  warn: __DEV__ ? console.warn.bind(console) : () => {},
  error: console.error.bind(console), // Immer aktiv für Crash-Reporting
  info: __DEV__ ? console.info.bind(console) : () => {},
  debug: __DEV__ ? console.debug.bind(console) : () => {},
  time: __DEV__ ? console.time.bind(console) : () => {},
  timeEnd: __DEV__ ? console.timeEnd.bind(console) : () => {},
  table: __DEV__ ? console.table?.bind(console) : () => {},
};

// Performance-Marker für Launch-Time-Tracking
export const perf = {
  mark: (name: string) => {
    if (__DEV__ && performance?.mark) {
      performance.mark(name);
    }
  },
  measure: (name: string, startMark: string, endMark: string) => {
    if (__DEV__ && performance?.measure) {
      performance.measure(name, startMark, endMark);
      const entry = performance.getEntriesByName(name)[0];
      logger.log(\`⚡ \${name}: \${entry.duration.toFixed(2)}ms\`);
    }
  },
};
`;

  writeFileSync('lib/logger.ts', loggerCode);
  log('blue', '   Neue Datei erstellt: lib/logger.ts');
}

// Main
async function main() {
  log('blue', '🚀 Performance Quick-Fixes werden angewendet...\n');
  
  let successCount = 0;
  let totalFixes = 0;
  
  const fixes = [
    { name: 'Console.log in theme-provider.tsx entfernen', fn: fixThemeProviderLog },
    { name: 'Subscription-Context Error-Logs schützen', fn: fixSubscriptionContextLogs },
    { name: 'Purchase-Context Dependencies optimieren', fn: fixPurchaseContextDeps },
    { name: 'Performance-Messung in _layout.tsx', fn: addPerformanceMeasurement },
    { name: 'Onboarding-Check optimieren', fn: optimizeOnboardingCheck },
    { name: 'Logger-Utility erstellen', fn: createLoggerUtility },
    { name: 'React.memo für AdBanner', fn: addReactMemoAdBanner },
  ];
  
  for (const fix of fixes) {
    totalFixes++;
    if (applyFix(fix.name, fix.fn)) {
      successCount++;
    }
  }
  
  // Dependencies als letztes (dauert am längsten)
  log('blue', '\n🗑️  Entferne unnötige Dependencies...');
  log('yellow', '   Dies kann einige Minuten dauern...');
  
  try {
    removeUnusedDependencies();
    successCount++;
    totalFixes++;
    log('green', '   ✅ Dependencies entfernt');
  } catch (err) {
    log('red', `   ❌ Fehler: ${err instanceof Error ? err.message : String(err)}`);
    totalFixes++;
  }
  
  // Zusammenfassung
  log('blue', '\n' + '='.repeat(60));
  log('green', `✅ ${successCount}/${totalFixes} Fixes erfolgreich angewendet`);
  log('blue', '='.repeat(60));
  
  log('yellow', '\n📋 Nächste Schritte:');
  log('yellow', '  1. Type-Check: pnpm check');
  log('yellow', '  2. App testen: pnpm dev');
  log('yellow', '  3. Launch-Time in Console prüfen: "📊 Launch-Time: XXXms"');
  log('yellow', '  4. Weitere Optimierungen: siehe PERFORMANCE_AUDIT.md');
  
  log('green', '\n🎉 Quick-Fixes abgeschlossen!\n');
}

main().catch(err => {
  log('red', `\n❌ Fehler: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
