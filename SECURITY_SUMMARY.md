# Security Audit - Zusammenfassung

**Datum:** 6. Oktober 2026  
**Status:** 🟡 Guter Zustand mit kritischen Verbesserungspotenzialen

---

## 🚨 KRITISCH - Sofort beheben (Woche 1)

### 1. CORS-Konfiguration unsicher 🔴
**Problem:** Server akzeptiert **jeden Origin** mit Credentials
```typescript
// ❌ AKTUELL (server/_core/index.ts:34-46):
const origin = req.headers.origin;
if (origin) {
  res.header("Access-Control-Allow-Origin", origin);  // Jede Domain!
}
res.header("Access-Control-Allow-Credentials", "true");
```

**Risiko:** Session-Hijacking, CSRF-Angriffe möglich

**Fix:**
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:3000',
  process.env.PRODUCTION_DOMAIN,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  // ... rest
});
```

### 2. SQL-Template-Literals prüfen 🔴
**Dateien:** `server/routers.ts` Zeilen 447, 678, 727, 1007, 1021, 1032

**Gefunden:**
```typescript
sql`${adBanners.startsAt} <= ${now}`  // Woher kommt 'now'?
sql`${communityPosts.likes} + 1`      // ✅ Column Reference - OK
```

**Aktion:**
- Verifizieren Sie die Herkunft von `now` Variablen
- Ersetzen Sie durch type-safe Drizzle Queries:
```typescript
// ✅ BESSER:
.where(and(
  lte(adBanners.startsAt, new Date()),
  gte(adBanners.endsAt, new Date())
))
```

---

## ⚠️ WICHTIG - Kurzfristig (Woche 2-3)

### 3. Environment Variable Validation ⚠️
**Problem:** Fehlende Secrets führen zu leeren Strings

**Fix:** `server/_core/env.ts`
```typescript
const REQUIRED = ['JWT_SECRET', 'DATABASE_URL', 'OAUTH_SERVER_URL'];
REQUIRED.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing: ${key}`);
  }
});
```

### 4. tRPC Rate Limiting fehlt ⚠️
**Problem:** Nur OAuth-Routes haben Rate Limiting, tRPC-Endpoints nicht

**Risiko:** AI-Endpoints (Diagnose, Coach) können gespammt werden

**Fix:** `server/_core/trpc.ts`
```typescript
export const rateLimitedProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const result = liveScanLimiter.check(`trpc:${ctx.user.id}`);
    if (!result.allowed) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
    }
    return next();
  }
);
```

### 5. Session-Cookies zu langlebig ⚠️
**Problem:** 1-Jahr-Sessions (ONE_YEAR_MS)

**Empfehlung:** Refresh-Token-Pattern
```typescript
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 Tage
const REFRESH_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 Tage
```

---

## ℹ️ VERBESSERUNGEN - Nice-to-have (Woche 4+)

### 6. Request-Size-Limits
- Aktuell: 50MB Body-Limit (zu groß)
- Empfohlen: Endpoint-spezifisch (1MB Standard, 10MB Uploads)

### 7. URL-Sanitization
- Template Literals in URLs (`tel:${phone}`, `?lat=${lat}`)
- Inputs validieren vor URL-Konstruktion

---

## ✅ GUT - Bereits vorhanden

- ✅ **Input-Validation:** Zod-Schemas auf allen tRPC-Endpunkten
- ✅ **Rate Limiting:** Login (10/15min), Register (5/1h), Forgot-Password (3/1h)
- ✅ **Kein XSS:** 0 Vorkommen von `dangerouslySetInnerHTML`
- ✅ **Auth-Middleware:** `publicProcedure`, `protectedProcedure`, `adminProcedure`
- ✅ **User-Enumeration-Protection:** Generische Forgot-Password-Responses
- ✅ **Password-Validation:** Min. 8 Zeichen, Max. 200 Zeichen
- ✅ **Type-Safe SQL:** Drizzle ORM, keine `.raw()` Queries

---

## 📊 Risiko-Übersicht

| Kategorie | Anzahl | Status |
|-----------|--------|--------|
| 🔴 High Risk | 2 | **Sofort beheben** |
| ⚠️ Medium Risk | 3 | Kurzfristig |
| ℹ️ Low Risk | 2 | Nice-to-have |
| ✅ Good Practices | 7 | Beibehalten |

---

## 🎯 Empfohlene Priorisierung

**Sprint 1 (Woche 1):**
1. CORS Whitelist implementieren
2. SQL-Queries auditieren

**Sprint 2 (Woche 2):**
3. ENV-Validation hinzufügen
4. tRPC Rate Limiting

**Sprint 3 (Woche 3):**
5. Session-Management verbessern
6. Security Headers hinzufügen

---

## 📝 Nächste Schritte

1. [ ] Team-Review dieses Dokuments
2. [ ] Tickets für High-Risk-Items erstellen
3. [ ] CORS-Fix in Dev-Environment testen
4. [ ] Follow-up Audit in 4 Wochen

---

**Vollständiger Bericht:** `SECURITY_AUDIT.md`  
**Kontakt:** security@growmaster.app
