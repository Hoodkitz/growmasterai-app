# 🔒 Security Guide - GrowMaster AI

Security best practices and implementation details for the GrowMaster AI app.

## Table of Contents
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Input Validation](#input-validation)
- [Dependency Security](#dependency-security)
- [Storage Security](#storage-security)
- [Network Security](#network-security)
- [Security Checklist](#security-checklist)

## Authentication & Authorization

### JWT Token Management

**Implementation:**
- JWT tokens are used for user authentication
- Tokens stored in Expo SecureStore (encrypted on device)
- Token expiration: 30 days (configurable)
- Automatic token refresh on API calls

**Security Measures:**
```typescript
// lib/_core/auth.ts
- Tokens signed with strong secret (min 32 characters)
- Tokens include user ID and role
- Server validates token on every protected endpoint
- Expired tokens automatically rejected
```

**Best Practices:**
- ✅ Never store JWT in AsyncStorage (use SecureStore)
- ✅ Use HTTPS only in production
- ✅ Implement token rotation for sensitive operations
- ✅ Clear tokens on logout
- ⚠️ Consider refresh tokens for long-lived sessions

### OAuth Security

**Google/Apple Sign In:**
- OAuth 2.0 flow with PKCE
- State parameter for CSRF protection
- Redirect URL validation
- Short-lived authorization codes

**Configuration:**
```typescript
// Validate redirect URLs in production
const ALLOWED_REDIRECT_URLS = [
  'https://yourdomain.com/oauth/callback',
  // Add production URLs only
];
```

### Role-Based Access Control (RBAC)

**Roles:**
- `user` - Default role
- `admin` - Full access
- `vendor` - Marketplace access

**Implementation:**
```typescript
// server/_core/trpc.ts
export const adminProcedure = t.procedure.use(requireAdmin);

// Usage in routers
adminProcedure
  .input(z.object({ ... }))
  .mutation(async ({ ctx, input }) => {
    // Only accessible by admins
  });
```

## Data Protection

### Sensitive Data Handling

**User Data:**
- Passwords: Never stored (OAuth only)
- Email: Encrypted in database
- Personal info: Minimal collection
- User content: Access-controlled

**Database Security:**
```sql
-- User table with minimal PII
CREATE TABLE users (
  id INT PRIMARY KEY,
  openId VARCHAR(255) UNIQUE,  -- OAuth ID
  name VARCHAR(255),            -- Display name only
  email VARCHAR(255),           -- Optional
  role ENUM('user', 'admin', 'vendor')
);

-- No password field!
```

### Data Encryption

**At Rest:**
- Database: MySQL encrypted storage
- Files: Server-side encryption
- Tokens: SecureStore encryption (device)

**In Transit:**
- HTTPS/TLS 1.3 for all API calls
- Certificate pinning (recommended for production)
- No sensitive data in URLs

### Privacy Compliance

**GDPR/Privacy:**
- User consent for data collection
- Data export functionality
- Account deletion support
- Privacy policy link
- Data minimization principle

**Implementation:**
```typescript
// Add to user settings
export async function deleteUserAccount(userId: string) {
  // 1. Delete user data
  await db.delete(users).where(eq(users.id, userId));
  // 2. Anonymize posts (keep content, remove author)
  await db.update(posts).set({ userId: null });
  // 3. Delete personal files
  await storage.deleteUserFiles(userId);
}
```

## API Security

### Rate Limiting

**Implementation:**
```typescript
// server/_core/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later',
});

app.use('/api/', limiter);
```

**Endpoint-Specific Limits:**
- Login: 5 attempts per 15 minutes
- Diagnose: 10 per hour (free tier)
- Coach: 20 messages per hour (free tier)
- Upload: 10 files per hour

### CORS Configuration

**Current Setup:**
```typescript
// Allow all origins in development
res.header("Access-Control-Allow-Origin", origin);
res.header("Access-Control-Allow-Credentials", "true");
```

**Production Setup (TODO):**
```typescript
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'https://app.yourdomain.com',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
```

### Request Validation

**Input Validation with Zod:**
```typescript
// All tRPC endpoints use Zod schemas
const createPlantSchema = z.object({
  name: z.string().min(1).max(100),
  strain: z.string().optional(),
  growthStage: z.enum(['seedling', 'vegetative', 'flowering', 'harvest']),
});

// SQL Injection Prevention:
// ✅ Drizzle ORM with parameterized queries
// ✅ No raw SQL strings with user input
```

### XSS Protection

**Prevention:**
- React Native auto-escapes by default
- No `dangerouslySetInnerHTML` usage
- Input sanitization on server
- Content Security Policy headers (web)

**Implementation:**
```typescript
// Sanitize user input before storing
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], // Strip all HTML
  });
}
```

## Input Validation

### Client-Side Validation

**Form Validation:**
```typescript
// Using Zod + React Hook Form
const schema = z.object({
  plantName: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Invalid characters'),
});
```

### Server-Side Validation

**Always validate on server:**
```typescript
// Never trust client input
protectedProcedure
  .input(z.object({
    content: z.string().max(5000), // Prevent abuse
    images: z.array(z.string()).max(5), // Limit uploads
  }))
  .mutation(async ({ ctx, input }) => {
    // Additional business logic validation
    if (input.content.includes('spam')) {
      throw new TRPCError({ code: 'BAD_REQUEST' });
    }
  });
```

## Dependency Security

### Package Auditing

```bash
# Regular security audits
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Check for outdated packages
pnpm outdated
```

### Dependency Management

**Best Practices:**
- ✅ Pin exact versions in production
- ✅ Review dependencies before adding
- ✅ Use official packages only
- ✅ Check npm package reputation
- ⚠️ Avoid packages with few downloads/maintainers

**Package.json Security:**
```json
{
  "dependencies": {
    "react": "19.1.0",  // Exact version, not ^19.1.0
  }
}
```

## Storage Security

### Local Storage

**Secure Storage:**
```typescript
// lib/_core/auth.ts
import * as SecureStore from 'expo-secure-store';

// ✅ DO: Use SecureStore for sensitive data
await SecureStore.setItemAsync('session_token', token);

// ❌ DON'T: Use AsyncStorage for tokens
// await AsyncStorage.setItem('session_token', token);
```

**Storage Classification:**
- **SecureStore**: Tokens, API keys, user credentials
- **AsyncStorage**: Preferences, cache, non-sensitive data
- **FileSystem**: Images, documents (encrypt if sensitive)

### File Upload Security

**Image Upload Protection:**
```typescript
// Validate file type
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateUpload(file: File): boolean {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  return true;
}
```

**File Storage Best Practices:**
- ✅ Store files outside web root
- ✅ Rename files on upload (UUID)
- ✅ Scan for malware (production)
- ✅ Use signed URLs for access
- ✅ Implement file size limits

## Network Security

### HTTPS Enforcement

**Production Configuration:**
```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

### Certificate Pinning (Recommended)

```typescript
// React Native - implement in production
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://api.yourdomain.com', {
  method: 'GET',
  sslPinning: {
    certs: ['sha256/AAAAAAAAAA...'], // Your cert hash
  },
});
```

### API Security Headers

```typescript
// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  next();
});
```

## Security Checklist

### Pre-Production Checklist

**Authentication:**
- [ ] JWT secret is strong and unique (min 32 chars)
- [ ] Tokens expire after reasonable time
- [ ] Logout clears all tokens
- [ ] OAuth redirect URLs are whitelisted
- [ ] Password reset flow is secure (if implemented)

**API Security:**
- [ ] Rate limiting enabled
- [ ] CORS properly configured for production
- [ ] All inputs validated with Zod
- [ ] Error messages don't leak sensitive info
- [ ] Admin endpoints require admin role

**Data Protection:**
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced in production
- [ ] Database credentials in env vars
- [ ] User data deletion implemented
- [ ] Privacy policy accessible

**Dependencies:**
- [ ] `pnpm audit` shows no critical vulnerabilities
- [ ] All dependencies are up to date
- [ ] No dev dependencies in production build
- [ ] License compliance verified

**Storage:**
- [ ] Tokens in SecureStore, not AsyncStorage
- [ ] File uploads validated and limited
- [ ] User files properly access-controlled
- [ ] No sensitive data in logs

**Environment:**
- [ ] `.env` not committed to git
- [ ] Production env vars different from dev
- [ ] API keys rotated regularly
- [ ] Database uses strong password
- [ ] Server has firewall configured

**Testing:**
- [ ] Security tests written and passing
- [ ] Penetration testing completed
- [ ] Third-party security audit (recommended)

### Regular Maintenance

**Monthly:**
- Run `pnpm audit`
- Review access logs
- Check for new CVEs in dependencies
- Rotate API keys

**Quarterly:**
- Full security audit
- Update dependencies
- Review and update security policies
- Test incident response plan

## Incident Response

### Security Breach Protocol

1. **Detect & Assess**
   - Identify breach scope
   - Determine affected systems/data

2. **Contain**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

3. **Notify**
   - Inform affected users (if PII exposed)
   - Report to authorities (if required by law)
   - Document incident

4. **Remediate**
   - Patch vulnerabilities
   - Reset passwords/tokens
   - Update security measures

5. **Review**
   - Post-mortem analysis
   - Update policies
   - Improve monitoring

### Contact

For security issues, contact:
- Email: security@growmaster.ai
- Do NOT open public GitHub issues for security vulnerabilities
- Use responsible disclosure

## Resources

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Expo Security](https://docs.expo.dev/guides/security/)
- [tRPC Security](https://trpc.io/docs/server/authorization)

---

**Last Updated:** 2026-01-08
**Version:** 1.0.0
