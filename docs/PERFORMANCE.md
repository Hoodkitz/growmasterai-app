# Performance-Optimierung: GrowMaster AI

Dieses Verzeichnis enthält alle Tools und Dokumentation zur Performance-Optimierung der App.

## 📋 Übersicht

- **PERFORMANCE_AUDIT.md** - Vollständiger Audit-Report mit detaillierten Analysen
- **PERFORMANCE_QUICKFIXES.md** - Checkliste für sofortige Optimierungen (< 1 Stunde)
- **scripts/performance-audit.ts** - Automatisiertes Audit-Tool
- **scripts/apply-quick-fixes.ts** - Automatische Anwendung der Quick-Fixes

## 🚀 Quick Start

### 1. Performance-Audit durchführen

```bash
# Audit-Script ausführen
npx tsx scripts/performance-audit.ts

# Output:
# - Bundle-Size-Statistiken
# - Unnötige Dependencies
# - Production-Console-Logs
# - React.memo-Coverage
# - Größte Dateien
```

### 2. Quick-Fixes anwenden

```bash
# Automatische Fixes (empfohlen)
npx tsx scripts/apply-quick-fixes.ts

# Oder manuell:
# Siehe PERFORMANCE_QUICKFIXES.md für Schritt-für-Schritt-Anleitung
```

### 3. Ergebnis testen

```bash
# Type-Check
pnpm check

# App starten
pnpm dev

# → Achte auf Launch-Time in Console: "📊 Launch-Time: XXXms"
```

## 📊 Aktueller Status

### Bundle-Size
- **node_modules:** 900-914 MB
- **Source-Code:** 141 TypeScript-Dateien, ~24.400 Zeilen
- **Größte Dateien:** server/routers.ts (1.386 Zeilen), community.tsx (835 Zeilen)

### Dependencies
- **12 ungenutzte Pakete** identifiziert (siehe PERFORMANCE_AUDIT.md)
- **Einsparungspotenzial:** ~40-50 MB

### Code-Qualität
- **177 Production-Console-Logs** in 29 Dateien
- **41 von 56 Komponenten (73%)** ohne React.memo-Optimierung
- **8 verschachtelte Context-Provider** in _layout.tsx

### Performance-Ziele

| Metrik | Vorher | Ziel | Nach Quick-Fixes |
|--------|--------|------|------------------|
| Bundle-Size | 914 MB | 850 MB | ~874 MB (-40 MB) |
| Launch-Time | ~1.500ms | <1.200ms | ~1.200-1.300ms |
| Memory-Usage | Basis | -20% | -10-15% |
| Console-Logs | 177 | <30 | <30 |

## 🛠️ Tools

### Performance-Audit-Script

Analysiert automatisch:
- ✅ Bundle-Size (node_modules + Source-Code)
- ✅ Unnötige Dependencies (via depcheck)
- ✅ Production-Console-Logs ohne __DEV__-Guard
- ✅ React.memo-Coverage
- ✅ Große Dateien (>400 Zeilen)

**Verwendung:**
```bash
npx tsx scripts/performance-audit.ts
```

### Quick-Fix-Automation

Wendet automatisch an:
- ✅ Console.log-Entfernung in theme-provider.tsx
- ✅ Subscription/Purchase-Context Error-Log-Guards
- ✅ Performance-Messung in _layout.tsx
- ✅ Onboarding-Check-Optimierung
- ✅ Logger-Utility-Erstellung
- ✅ React.memo für AdBanner
- ✅ Entfernung unnötiger Dependencies

**Verwendung:**
```bash
npx tsx scripts/apply-quick-fixes.ts
```

## 📚 Dokumentation

### PERFORMANCE_AUDIT.md

Vollständiger Report mit:
1. **Bundle-Size-Analyse** - Unnötige Dependencies, Tree-Shaking-Probleme
2. **Launch-Time-Analyse** - Context-Provider-Verschachtelung, Lazy-Loading
3. **Memory-Leak-Analyse** - React.memo, useCallback, useMemo
4. **Console-Log-Pollution** - Production-Logs, Performance-Killer
5. **Konkrete Optimierungsvorschläge** - Quick Wins, Mittelfristig, Langfristig
6. **Metriken & Monitoring** - Launch-Time-Tracking, Memory-Warnings
7. **Priorisierte Action-Items** - Was zuerst tun?
8. **Erwartete Verbesserungen** - Messbare Ziele

### PERFORMANCE_QUICKFIXES.md

Schritt-für-Schritt-Checkliste:
- ✅ 10 Quick-Fixes (< 1 Stunde Gesamtaufwand)
- ✅ Code-Snippets für jeden Fix
- ✅ Impact-Beschreibung
- ✅ Vor/Nach-Vergleich

## 🎯 Priorisierte Maßnahmen

### Priorität 1 (HEUTE) - 30 Min

1. Console.log in theme-provider.tsx entfernen (Zeile 64)
2. Unnötige Dependencies entfernen:
   ```bash
   pnpm remove expo-audio expo-image expo-keep-awake expo-video @expo/ngrok @types/qrcode
   ```
3. React.memo für AdBanner, UpgradePrompt, SubscriptionBadge

**Erwartete Verbesserung:** -40 MB Bundle, -200ms Launch-Time

### Priorität 2 (DIESE WOCHE) - 2-3 Std

1. Logger-Wrapper erstellen und alle console.* ersetzen
2. Performance-Messung in _layout.tsx einbauen
3. Memory-Leak-Fixes in Subscription/Purchase-Context
4. Lazy Loading für strains-data.ts implementieren

**Erwartete Verbesserung:** -60 MB Bundle, -500ms Launch-Time, -20% Memory

### Priorität 3 (NÄCHSTE WOCHE) - 1-2 Tage

1. Code-Splitting für Community/Diagnose-Screens
2. Axios durch fetch ersetzen
3. Bundle-Analyzer Report erstellen
4. Provider-Architektur optimieren

**Erwartete Verbesserung:** -80 MB Bundle, -1.000ms Launch-Time, -30% Memory

## 📈 Monitoring

### Launch-Time messen

Nach Quick-Fixes wird in `_layout.tsx` automatisch gemessen:

```typescript
// Console-Output bei jedem App-Start:
⚡ App Launch: 1234ms
📊 Launch-Time: 1234ms
```

**Zielwerte:**
- Free Tier: < 2.000ms
- Pro Tier: < 1.500ms

### Bundle-Size tracken

```bash
# Aktuelle Größe
du -sh node_modules

# Nach jedem Update
pnpm build && du -sh dist/
```

### Memory-Warnings

React Native warnt automatisch bei Memory-Problemen:
```
MEMORY WARNING - Check for leaks!
```

## 🔄 Workflow

### Vor jeder Optimierung

1. **Audit durchführen:**
   ```bash
   npx tsx scripts/performance-audit.ts > audit-$(date +%Y%m%d).log
   ```

2. **Baseline messen:**
   - Bundle-Size: `du -sh node_modules`
   - Launch-Time: App starten, Console prüfen

### Nach Optimierungen

1. **Type-Check:**
   ```bash
   pnpm check
   ```

2. **Tests:**
   ```bash
   pnpm test
   ```

3. **Performance-Check:**
   - Bundle-Size vergleichen
   - Launch-Time vergleichen
   - App manuell testen (keine Regressions)

4. **Commit:**
   ```bash
   git add .
   git commit -m "perf: [description] - reduces bundle by XMB, launch by Xms"
   ```

## 🐛 Bekannte Issues

### Depcheck False Positives

Einige Dependencies werden als "unused" gemeldet, sind aber nötig:

- `@react-navigation/native` - Wird von Expo Router intern genutzt
- `expo-splash-screen` - Wird automatisch von Expo geladen
- `expo-system-ui` - Wird in _layout.tsx verwendet
- `react-native-svg` - Wird in icon-symbol.tsx verwendet

→ **Nicht entfernen!**

### Type-Check-Fehler nach Fixes

Falls TypeScript-Fehler auftreten:

```bash
# Cache löschen
rm -rf node_modules/.cache
pnpm install

# Type-Check erneut
pnpm check
```

## 📞 Support

Bei Fragen oder Problemen:

1. Siehe **PERFORMANCE_AUDIT.md** für detaillierte Erklärungen
2. Siehe **PERFORMANCE_QUICKFIXES.md** für konkrete Code-Beispiele
3. Führe `npx tsx scripts/performance-audit.ts` aus für aktuellen Status

## 🎓 Best Practices

### 1. Console-Logs

```typescript
// ❌ FALSCH
console.log('User logged in', user);

// ✅ RICHTIG
import { logger } from '@/lib/logger';
logger.log('User logged in', user);
```

### 2. React.memo

```typescript
// ❌ FALSCH (Re-Renders bei jedem Parent-Update)
export function MyComponent({ data }: Props) {
  return <View>...</View>;
}

// ✅ RICHTIG
export const MyComponent = React.memo(function MyComponent({ data }: Props) {
  return <View>...</View>;
});
```

### 3. Context-Values

```typescript
// ❌ FALSCH (Neues Objekt bei jedem Render)
return (
  <Context.Provider value={{ user, setUser }}>
    {children}
  </Context.Provider>
);

// ✅ RICHTIG
const value = useMemo(() => ({ user, setUser }), [user, setUser]);
return (
  <Context.Provider value={value}>
    {children}
  </Context.Provider>
);
```

### 4. Lazy Loading

```typescript
// ❌ FALSCH (Immer geladen, auch wenn nicht genutzt)
import { STRAINS_DATABASE } from '@/lib/strains-data';

// ✅ RICHTIG
const loadStrains = async () => {
  const { STRAINS_DATABASE } = await import('@/lib/strains-data');
  return STRAINS_DATABASE;
};
```

---

**Letzte Aktualisierung:** 2026-10-06  
**Nächstes Audit:** Nach Implementierung der Priorität-1-Fixes
