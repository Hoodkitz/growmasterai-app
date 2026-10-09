/**
 * Test Ollama vision performance with actual image
 */

// Create a tiny test image (1x1 red pixel PNG)
const testImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

const verbosePrompt = `Du bist ein Experte für Cannabis-Pflanzengesundheit und -diagnose. Analysiere die bereitgestellten Bilder und identifiziere alle Probleme, Krankheiten, Schädlinge oder Nährstoffmängel.

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
}

Geschlechts-Bestimmung:
- "male": Pollensäcke sichtbar (kleine grüne Bälle an Nodien)
- "female": Weiße Stigmata (Härchen) sichtbar
- "hermaphrodite": Sowohl Pollensäcke als auch Stigmata
- "unknown": Geschlecht nicht erkennbar (z.B. vegetative Phase)

Analysiere diese Cannabis-Pflanze und identifiziere alle Probleme oder Auffälligkeiten.`;

const concisePrompt = `You are a cannabis plant health expert. Analyze the image and identify issues (diseases, pests, deficiencies).

Determine plant gender (male/female/hermaphrodite/unknown) based on visible flowers, pollen sacs, or stigmas.

Return JSON:
{
  "problem": "Description of identified problem",
  "recommendations": ["Action 1", "Action 2", "Action 3"],
  "careTips": ["Tip 1", "Tip 2", "Tip 3"],
  "severity": "low"|"medium"|"high",
  "plantGender": "male"|"female"|"hermaphrodite"|"unknown",
  "genderConfidence": 0-100,
  "voiceResponse": "1-2 sentence spoken summary"
}`;

async function testOllama(name, prompt, model = "llava-phi3") {
  const payload = {
    model,
    prompt,
    images: [testImage],
    stream: false,
  };

  console.log(`\n${name}:`);
  const start = Date.now();

  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const duration = Date.now() - start;

    console.log(`✓ ${duration}ms (${data.response?.length || 0} chars)`);
    
    // Try to parse JSON
    try {
      const parsed = JSON.parse(data.response);
      console.log(`  Problem: ${parsed.problem?.substring(0, 60)}...`);
    } catch {
      console.log(`  Raw: ${data.response?.substring(0, 100)}...`);
    }

    return duration;
  } catch (error) {
    console.error(`✗ Error:`, error.message);
    return -1;
  }
}

async function main() {
  console.log("=== Vision Model Performance Test ===");
  console.log("Model: llava-phi3");
  console.log("Image: 1x1 test pixel\n");
  
  const verbose = await testOllama("Verbose prompt (current)", verbosePrompt);
  await new Promise(r => setTimeout(r, 2000));
  
  const concise = await testOllama("Concise prompt (optimized)", concisePrompt);

  console.log("\n=== Results ===");
  if (verbose > 0 && concise > 0) {
    const improvement = verbose - concise;
    const pct = Math.round((improvement / verbose) * 100);
    console.log(`Verbose: ${verbose}ms`);
    console.log(`Concise: ${concise}ms`);
    console.log(`Improvement: ${improvement}ms (${pct}%)`);
    
    if (concise < 20000) {
      console.log("✅ Under 20s target!");
    } else {
      console.log(`⚠️  Still ${concise - 20000}ms over target`);
    }
  }
}

main().catch(console.error);
