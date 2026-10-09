#!/usr/bin/env tsx
/**
 * Performance Audit Script
 *
 * Analysiert:
 * - Bundle-Size
 * - Unnötige Dependencies
 * - Console-Logs in Production
 * - Fehlende React.memo-Optimierungen
 * - Memory-Leak-Risiken
 */

import { execSync } from "child_process";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const PROJECT_ROOT = process.cwd();

// Farben für Terminal-Output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Bundle-Size prüfen
function checkBundleSize() {
  log("blue", "\n📦 Bundle-Size-Analyse...");

  try {
    const nodeModulesSize = execSync("du -sh node_modules 2>/dev/null", {
      encoding: "utf8",
    });
    log("green", `   node_modules: ${nodeModulesSize.split("\t")[0]}`);
  } catch {
    log("yellow", "   node_modules nicht gefunden");
  }

  // Source-Code-Statistik
  try {
    const tsFiles = execSync(
      'find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | wc -l',
      { encoding: "utf8" },
    );
    const totalLines = execSync(
      'find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | xargs wc -l | tail -1',
      { encoding: "utf8" },
    );
    log("green", `   TypeScript-Dateien: ${tsFiles.trim()}`);
    log("green", `   Gesamt-Zeilen: ${totalLines.split(" ")[0].trim()}`);
  } catch {
    log("red", "   Fehler bei Code-Statistik");
  }
}

// 2. Unnötige Dependencies
function checkDependencies() {
  log("blue", "\n🔍 Dependency-Check...");

  try {
    const result = execSync("npx depcheck --json", {
      encoding: "utf8",
      stdio: "pipe",
    });
    const data = JSON.parse(result);

    if (data.dependencies?.length > 0) {
      log("red", `   ❌ ${data.dependencies.length} ungenutzte Dependencies:`);
      data.dependencies.forEach((dep: string) => {
        log("red", `      - ${dep}`);
      });
    } else {
      log("green", "   ✅ Keine ungenutzten Dependencies");
    }

    if (data.devDependencies?.length > 0) {
      log(
        "yellow",
        `   ⚠️  ${data.devDependencies.length} ungenutzte DevDependencies:`,
      );
      data.devDependencies.forEach((dep: string) => {
        log("yellow", `      - ${dep}`);
      });
    }
  } catch {
    log("yellow", "   depcheck nicht verfügbar (npm install -g depcheck)");
  }
}

// 3. Console-Logs in Production
function scanConsoleLogs(
  dir: string,
  results: { file: string; count: number }[] = [],
): { file: string; count: number }[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (entry === "node_modules" || entry === ".git" || entry === "dist")
      continue;

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanConsoleLogs(fullPath, results);
    } else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) {
      const content = readFileSync(fullPath, "utf8");
      const matches = content.match(/console\.(log|warn|error|time|timeEnd)/g);

      if (matches && matches.length > 0) {
        // Prüfe ob __DEV__-Guard vorhanden
        const hasDevGuard =
          content.includes("__DEV__") || content.includes("NODE_ENV");

        if (!hasDevGuard) {
          results.push({
            file: fullPath.replace(PROJECT_ROOT, "."),
            count: matches.length,
          });
        }
      }
    }
  }

  return results;
}

function checkConsoleLogs() {
  log("blue", "\n🚨 Production-Console-Logs...");

  const logs = scanConsoleLogs(PROJECT_ROOT);
  const total = logs.reduce((sum, item) => sum + item.count, 0);

  if (logs.length > 0) {
    log("red", `   ❌ ${total} Console-Statements in ${logs.length} Dateien:`);

    // Top 10 anzeigen
    logs
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach(({ file, count }) => {
        log("red", `      ${count}x - ${file}`);
      });

    if (logs.length > 10) {
      log("yellow", `      ... und ${logs.length - 10} weitere Dateien`);
    }
  } else {
    log("green", "   ✅ Keine Production-Logs gefunden");
  }
}

// 4. React.memo-Analyse
function scanReactMemo(
  dir: string,
  results: { total: number; withMemo: number; components: string[] } = {
    total: 0,
    withMemo: 0,
    components: [],
  },
): typeof results {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (entry === "node_modules" || entry === ".git" || entry === "dist")
      continue;

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanReactMemo(fullPath, results);
    } else if (entry.endsWith(".tsx")) {
      const content = readFileSync(fullPath, "utf8");

      // Zähle Komponenten
      const componentMatches = content.match(
        /^export (default )?(function|const) \w+/gm,
      );
      if (componentMatches) {
        results.total += componentMatches.length;

        // Prüfe auf Memo-Optimierung
        const hasMemo =
          content.includes("React.memo") ||
          content.includes("useMemo") ||
          content.includes("useCallback");

        if (!hasMemo) {
          results.components.push(fullPath.replace(PROJECT_ROOT, "."));
        } else {
          results.withMemo += componentMatches.length;
        }
      }
    }
  }

  return results;
}

function checkReactMemo() {
  log("blue", "\n⚡ React.memo-Analyse...");

  const { total, withMemo, components } = scanReactMemo(PROJECT_ROOT);
  const withoutMemo = total - withMemo;
  const percentage = total > 0 ? Math.round((withoutMemo / total) * 100) : 0;

  log("green", `   Gesamt-Komponenten: ${total}`);
  log("green", `   Mit Memo: ${withMemo}`);

  if (withoutMemo > 0) {
    log("red", `   ❌ Ohne Memo: ${withoutMemo} (${percentage}%)`);

    log("yellow", "\n   Komponenten ohne Optimierung:");
    components.slice(0, 15).forEach((file) => {
      log("yellow", `      - ${file}`);
    });

    if (components.length > 15) {
      log("yellow", `      ... und ${components.length - 15} weitere`);
    }
  } else {
    log("green", "   ✅ Alle Komponenten optimiert");
  }
}

// 5. Große Dateien finden
function checkLargeFiles() {
  log("blue", "\n📊 Größte Dateien...");

  try {
    const result = execSync(
      'find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | xargs wc -l | sort -rn | head -10',
      { encoding: "utf8" },
    );

    const lines = result.trim().split("\n").slice(0, -1); // Letzte Zeile (total) entfernen

    lines.forEach((line) => {
      const [count, file] = line.trim().split(/\s+/);
      if (parseInt(count) > 400) {
        log("red", `   ❌ ${count} Zeilen - ${file}`);
      } else if (parseInt(count) > 300) {
        log("yellow", `   ⚠️  ${count} Zeilen - ${file}`);
      } else {
        log("green", `   ${count} Zeilen - ${file}`);
      }
    });
  } catch {
    log("red", "   Fehler bei Datei-Analyse");
  }
}

// 6. Zusammenfassung
function printSummary() {
  log("magenta", "\n" + "=".repeat(60));
  log("magenta", "📋 ZUSAMMENFASSUNG");
  log("magenta", "=".repeat(60));

  log("yellow", "\nEmpfohlene Maßnahmen:");
  log("yellow", "  1. Unnötige Dependencies entfernen (siehe oben)");
  log("yellow", "  2. Console-Logs mit __DEV__-Guard schützen");
  log("yellow", "  3. React.memo für große Komponenten (>100 Zeilen)");
  log("yellow", "  4. Große Dateien (>500 Zeilen) aufteilen");
  log(
    "yellow",
    "  5. Lazy Loading für statische Daten (strains-data, locations-data)",
  );

  log("blue", "\nNächste Schritte:");
  log("blue", "  → Siehe PERFORMANCE_QUICKFIXES.md für konkrete Fixes");
  log("blue", "  → Siehe PERFORMANCE_AUDIT.md für vollständigen Report");
}

// Main
async function main() {
  log("magenta", "🚀 Performance Audit gestartet...\n");

  checkBundleSize();
  checkDependencies();
  checkConsoleLogs();
  checkReactMemo();
  checkLargeFiles();
  printSummary();

  log("green", "\n✅ Audit abgeschlossen!\n");
}

main().catch((err) => {
  log("red", `\n❌ Fehler: ${err.message}\n`);
  process.exit(1);
});
