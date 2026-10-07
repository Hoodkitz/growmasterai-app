# Diagnosis Performance Optimization

## Overview
Optimizations to reduce Ollama diagnosis response time from ~40s to <20s target.

## Changes

### 1. Diagnosis Response Caching (`server/_core/diagnosisCache.ts`)
- **File-based cache**: Stores diagnosis responses by image hash (SHA-256)
- **Memory cache**: LRU cache (100 entries) for hot responses  
- **Request deduplication**: Prevents duplicate concurrent requests for same image
- **Default TTL**: 24 hours (configurable via `DIAGNOSIS_CACHE_TTL`)

### 2. Ollama Optimizations (`server/_core/llm.ts`)
- **Configurable model**: Set via `OLLAMA_MODEL` env var (default: llava-phi3)
- **Reduced context window**: `num_ctx: 2048` (down from 4096)
- **Limited output**: `num_predict: 512` tokens
- **Optimized prompt**: Concise English prompt instead of verbose German

### 3. Enhanced Diagnosis Router (`server/routers.ts`)
- Cache lookup before LLM invocation
- Request deduplication for concurrent identical requests
- Response time logging
- Automatic cache population on successful diagnosis

## Environment Variables

```bash
# Ollama model selection (try llava:7b for potentially faster inference)
OLLAMA_MODEL=llava-phi3  # or llava:7b

# Cache settings
DIAGNOSIS_CACHE_DIR=.cache/diagnoses  # default: .cache/diagnoses in project root
DIAGNOSIS_CACHE_TTL=86400000          # default: 24h in milliseconds
```

## Performance Testing

### Benchmark Script
```bash
# With test image
npx tsx scripts/benchmark-ollama.ts path/to/plant.jpg

# Text-only (faster, for testing configs)
npx tsx scripts/benchmark-ollama.ts
```

### Expected Results
- **Cache hit**: <100ms (instant response)
- **llava-phi3 optimized**: ~20-30s (down from ~40s)
- **llava:7b optimized**: ~15-25s (potentially faster)
- **Duplicate request**: Same as cache hit (deduplicated)

## Model Comparison

| Model | Size | Expected Speed | Quality |
|-------|------|---------------|---------|
| llava-phi3 | 2.9 GB | Baseline (~40s) | Good |
| llava:7b | ~4 GB | Potentially faster | Better |

## Usage

1. **Development**: Cache is automatically used, check logs for hits/misses
   ```
   [Diagnosis] Cache hit: a3f7d2b8c1e4
   [Diagnosis] Cache miss, invoking LLM: 9e2c8f1a5b3d
   [Diagnosis] LLM response time: 23456ms
   ```

2. **Clear cache**: Delete `.cache/diagnoses` directory

3. **Monitor cache stats**: Available via `getCacheStats()` function
   ```typescript
   import { getCacheStats } from "./_core/diagnosisCache";
   console.log(getCacheStats());
   // { memoryEntries: 42, activeRequests: 2 }
   ```

## Monitoring

Response times are logged to console:
```
[Diagnosis] Cache hit: abc123def456
[Diagnosis] Cache miss, invoking LLM: 789ghi012jkl
[Diagnosis] LLM response time: 18234ms
```

## Future Optimizations

If <20s target is not met:
- Try different models (llava:13b if hardware allows)
- Implement streaming responses (show partial results)
- Use GPU acceleration if available
- Reduce image resolution before sending to Ollama
- Implement Redis for distributed caching
