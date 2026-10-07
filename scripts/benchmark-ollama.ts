#!/usr/bin/env tsx
/**
 * Benchmark Ollama response times with different configurations
 */

import { readFileSync } from "fs";

// Test image (small sample)
const TEST_IMAGE_BASE64 = readFileSync(
  process.argv[2] || "/dev/null",
  "base64"
).slice(0, 50000); // truncate for testing

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";

type OllamaConfig = {
  model: string;
  num_ctx?: number;
  num_predict?: number;
  temperature?: number;
};

const configs: Array<{ name: string; config: OllamaConfig }> = [
  {
    name: "llava-phi3 (baseline)",
    config: {
      model: "llava-phi3",
    },
  },
  {
    name: "llava-phi3 (optimized ctx=2048)",
    config: {
      model: "llava-phi3",
      num_ctx: 2048,
      num_predict: 512,
      temperature: 0.7,
    },
  },
  {
    name: "llava:7b (baseline)",
    config: {
      model: "llava:7b",
    },
  },
  {
    name: "llava:7b (optimized ctx=2048)",
    config: {
      model: "llava:7b",
      num_ctx: 2048,
      num_predict: 512,
      temperature: 0.7,
    },
  },
];

const CONCISE_PROMPT = `You are a cannabis plant health expert. Analyze the image and identify issues.

Return JSON:
{
  "problem": "Issue description",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "severity": "low"|"medium"|"high"
}`;

const VERBOSE_PROMPT = `Du bist ein Experte für Cannabis-Pflanzengesundheit und -diagnose. Analysiere die bereitgestellten Bilder und identifiziere alle Probleme, Krankheiten, Schädlinge oder Nährstoffmängel.

WICHTIG: Bestimme auch das Geschlecht der Pflanze (männlich/weiblich/hermaphrodit) anhand sichtbarer Blüten, Pollensäcke oder Stigmata.

Antworte IMMER auf Deutsch und im folgenden JSON-Format:
{
  "problem": "Detaillierte Beschreibung des identifizierten Problems",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
  "careTips": ["Pflege-Tipp 1", "Pflege-Tipp 2", "Pflege-Tipp 3"],
  "severity": "low" | "medium" | "high",
  "plantGender": "male" | "female" | "hermaphrodite" | "unknown",
  "genderConfidence": 0-100 (Zahl),
  "voiceResponse": "Kurze, gesprochene Zusammenfassung für Text-to-Speech (1-2 Sätze)"
}`;

async function benchmark(
  name: string,
  model: string,
  prompt: string,
  options?: Record<string, any>
): Promise<number> {
  const payload = {
    model,
    prompt,
    images: TEST_IMAGE_BASE64 ? [TEST_IMAGE_BASE64] : [],
    stream: false,
    ...(options ? { options } : {}),
  };

  const start = Date.now();
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const duration = Date.now() - start;

    console.log(
      `✓ ${name}: ${duration}ms (response length: ${data.response?.length || 0} chars)`
    );
    return duration;
  } catch (error) {
    console.error(`✗ ${name}: ${error}`);
    return -1;
  }
}

async function main() {
  console.log("=== Ollama Diagnosis Performance Benchmark ===\n");

  if (!TEST_IMAGE_BASE64) {
    console.log(
      "⚠️  No test image provided. Usage: tsx benchmark-ollama.ts <image.jpg>"
    );
    console.log("Running without image (text-only benchmark)...\n");
  }

  const results: Array<{ name: string; time: number }> = [];

  // Test verbose prompt
  console.log("## Verbose Prompt Tests\n");
  for (const { name, config } of configs) {
    const time = await benchmark(
      `${name} + verbose`,
      config.model,
      VERBOSE_PROMPT,
      config.num_ctx ? config : undefined
    );
    results.push({ name: `${name} + verbose`, time });
    await new Promise((r) => setTimeout(r, 2000)); // cooldown
  }

  console.log("\n## Concise Prompt Tests\n");
  for (const { name, config } of configs) {
    const time = await benchmark(
      `${name} + concise`,
      config.model,
      CONCISE_PROMPT,
      config.num_ctx ? config : undefined
    );
    results.push({ name: `${name} + concise`, time });
    await new Promise((r) => setTimeout(r, 2000)); // cooldown
  }

  console.log("\n=== Summary ===\n");
  const sorted = results.filter((r) => r.time > 0).sort((a, b) => a.time - b.time);
  
  for (const { name, time } of sorted) {
    const status = time < 20000 ? "🎯" : time < 30000 ? "⚡" : "⏱️ ";
    console.log(`${status} ${name}: ${time}ms`);
  }

  const fastest = sorted[0];
  if (fastest) {
    console.log(`\n✨ Fastest: ${fastest.name} (${fastest.time}ms)`);
    
    if (fastest.time < 20000) {
      console.log("✅ Target achieved: < 20s response time");
    } else {
      console.log(`⚠️  Still above target (${fastest.time - 20000}ms over)`);
    }
  }
}

main().catch(console.error);
