/**
 * Quick test of diagnosis caching
 */

// Simulate a simple image hash
const testImages = [
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
];

console.log("Testing diagnosis cache...\n");

const apiUrl = "http://localhost:3000/trpc/diagnosis.analyze";

async function testDiagnosis(iteration) {
  const start = Date.now();
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        images: testImages,
        notes: "Test diagnosis",
      }),
    });

    const duration = Date.now() - start;
    const status = response.ok ? "✓" : "✗";
    
    console.log(`${status} Request ${iteration}: ${duration}ms (${response.status})`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  Problem: ${data.problem?.substring(0, 50)}...`);
    }
    
    return duration;
  } catch (error) {
    console.error(`✗ Request ${iteration} failed:`, error.message);
    return -1;
  }
}

async function main() {
  console.log("First request (cache miss, should take ~20-40s):");
  const time1 = await testDiagnosis(1);
  
  console.log("\nSecond request (cache hit, should be <100ms):");
  const time2 = await testDiagnosis(2);
  
  console.log("\n=== Results ===");
  console.log(`First request: ${time1}ms`);
  console.log(`Second request: ${time2}ms`);
  
  if (time2 > 0 && time2 < time1 * 0.1) {
    console.log("✅ Cache is working! Speedup: " + Math.round(time1 / time2) + "x");
  } else if (time2 > 0) {
    console.log("⚠️  Cache might not be working as expected");
  }
}

main().catch(console.error);
