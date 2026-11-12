# Smart Grow – Browser-E2E

1. Test-DB: `DATABASE_URL=mysql://root@127.0.0.1:3307/growmaster_e2e npx drizzle-kit migrate`
2. Server: `PORT=3100 DATABASE_URL=… JWT_SECRET=<32+ Zeichen> WEB_APP_URL=http://localhost:8099 npx tsx server/_core/index.ts`
3. Web-Export: `EXPO_PUBLIC_API_BASE_URL=http://localhost:3100 npx expo export --platform web --output-dir /tmp/gm-web`
4. Statisch ausliefern: `node scripts/e2e/serve-static.mjs /tmp/gm-web 8099`
5. Test: `PLAYWRIGHT_CORE=<pfad>/playwright-core/index.js node scripts/e2e/smartgrow-web.mjs /tmp`

Die Registrierung ist rate-limitiert: bei 429 den Server neu starten.
