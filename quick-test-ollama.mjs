/**
 * Quick Ollama performance test
 */

const prompt = `You are a cannabis plant health expert. Analyze the image and identify issues.

Return JSON:
{
  "problem": "Issue description",
  "recommendations": ["Action 1", "Action 2"],
  "severity": "low"|"medium"|"high"
}`;

async function testOllama(model, options = {}) {
  const payload = {
    model,
    prompt,
    stream: false,
    options,
  };

  console.log(`\nTesting ${model} with options:`, options);
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

    console.log(`✓ Response time: ${duration}ms`);
    console.log(`  Output length: ${data.response?.length || 0} chars`);
    console.log(`  First 100 chars: ${data.response?.substring(0, 100)}...`);

    return duration;
  } catch (error) {
    console.error(`✗ Error:`, error.message);
    return -1;
  }
}

async function main() {
  console.log("=== Ollama Performance Test (text-only) ===");
  
  // Test baseline
  const baseline = await testOllama("llava-phi3", {});
  
  // Test optimized
  const optimized = await testOllama("llava-phi3", {
    num_ctx: 2048,
    num_predict: 512,
    temperature: 0.7,
  });

  console.log("\n=== Summary ===");
  if (baseline > 0 && optimized > 0) {
    const improvement = Math.round(((baseline - optimized) / baseline) * 100);
    console.log(`Baseline: ${baseline}ms`);
    console.log(`Optimized: ${optimized}ms`);
    console.log(`Improvement: ${improvement}% faster`);
  }
}

main().catch(console.error);
