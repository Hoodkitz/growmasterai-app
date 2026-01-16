# 🚀 Deployment Guide - GrowMaster AI

Vollständiger Leitfaden für Production Deployment.

## Table of Contents
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Database Migration](#database-migration)
- [Backend Deployment](#backend-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

### ✅ Code Quality

```bash
# TypeScript Check
pnpm check

# Linting
pnpm lint

# Tests
pnpm test

# Build Test
pnpm build
```

**Alle müssen erfolgreich sein!**

### ✅ Security Review

- [ ] Review `docs/SECURITY.md` checklist
- [ ] All secrets in environment variables (not hardcoded)
- [ ] JWT_SECRET is strong (min 32 chars, randomly generated)
- [ ] Database credentials are secure
- [ ] API keys are valid and not development keys
- [ ] CORS is properly configured for production domains
- [ ] Rate limiting is enabled
- [ ] SSL/HTTPS is enforced
- [ ] Error messages don't leak sensitive info

### ✅ Configuration

- [ ] `.env.production` created with production values
- [ ] API URLs point to production servers
- [ ] Database is production-ready (backups configured)
- [ ] Push notifications configured
- [ ] Analytics tracking setup
- [ ] Error tracking (Sentry) configured
- [ ] RevenueCat production keys set

### ✅ Documentation

- [ ] README.md is up to date
- [ ] API documentation is current
- [ ] Deployment runbook created
- [ ] Incident response plan documented

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```env
# ===========================================
# PRODUCTION CONFIGURATION
# ===========================================

# Database (Production MySQL/PostgreSQL)
DATABASE_URL="mysql://user:secure_password@production-db.example.com:3306/growmaster_prod"

# AI Services
GEMINI_API_KEY="your-production-gemini-key"

# RevenueCat (Production)
REVENUECAT_API_KEY="production-key-from-revenuecat"

# OAuth (Production Credentials)
GOOGLE_CLIENT_ID="production-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="production-google-secret"
APPLE_CLIENT_ID="com.yourdomain.growmaster"
APPLE_TEAM_ID="TEAMID1234"
APPLE_KEY_ID="KEYID1234"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Server
PORT=3000
NODE_ENV=production
API_BASE_URL="https://api.yourdomain.com"

# Expo/App
EXPO_PUBLIC_API_URL="https://api.yourdomain.com"

# JWT (Generate secure secret)
JWT_SECRET="production-secret-min-32-chars-randomly-generated"
JWT_EXPIRES_IN="30d"

# Admin
OWNER_OPEN_ID="your-production-admin-email@domain.com"

# Storage (Production S3/Cloudinary)
STORAGE_TYPE="s3"
AWS_S3_BUCKET="growmaster-prod"
AWS_S3_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# Push Notifications
EXPO_PUSH_TOKEN="production-expo-token"

# Monitoring
SENTRY_DSN="https://examplePublicKey@o0.ingest.sentry.io/0"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15

# Feature Flags
FEATURE_MARKETPLACE=true
FEATURE_COMMUNITY=true
FEATURE_AI_COACH=true
```

### Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Migration

### 1. Backup Existing Data (if any)

```bash
# MySQL backup
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql

# Or use your cloud provider's backup feature
```

### 2. Run Migrations

```bash
# Load production environment
export $(cat .env.production | xargs)

# Run Drizzle migrations
pnpm db:push

# Verify schema
pnpm db:studio
```

### 3. Seed Initial Data (if needed)

```bash
# Run seed script
node scripts/seed-production.js
```

---

## Backend Deployment

### Option 1: Docker Deployment

#### Dockerfile

Create `Dockerfile` in root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy source
COPY . .

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start
CMD ["pnpm", "start:server"]
```

#### Build and Deploy

```bash
# Build Docker image
docker build -t growmaster-api:latest .

# Tag for registry
docker tag growmaster-api:latest registry.example.com/growmaster-api:latest

# Push to registry
docker push registry.example.com/growmaster-api:latest

# Run container
docker run -d \
  --name growmaster-api \
  -p 3000:3000 \
  --env-file .env.production \
  growmaster-api:latest
```

### Option 2: Platform as a Service

#### Heroku

```bash
# Install Heroku CLI
# heroku login

# Create app
heroku create growmaster-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="..."
heroku config:set GEMINI_API_KEY="..."
# ... (set all env vars)

# Deploy
git push heroku main

# Run migrations
heroku run pnpm db:push
```

#### Railway

1. Go to https://railway.app/
2. New Project → Deploy from GitHub
3. Select repository
4. Add environment variables
5. Deploy

#### Render

1. Go to https://render.com/
2. New Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start:server`
5. Add environment variables
6. Deploy

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/yourusername/growmaster-app.git
cd growmaster-app

# Install dependencies
pnpm install --prod

# Copy production env
cp .env.production .env

# Run migrations
pnpm db:push

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start pnpm --name growmaster-api -- start:server

# Save PM2 config
pm2 save
pm2 startup

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/growmaster
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/growmaster /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Mobile App Deployment

### iOS App Store

#### 1. Prepare App

```bash
# Update version in app.config.ts
version: "1.0.0"
buildNumber: "1"

# Build for App Store
eas build --platform ios --profile production
```

#### 2. Submit to App Store

```bash
# Automated submission
eas submit --platform ios --latest

# Or manual:
# 1. Download IPA from EAS
# 2. Open Xcode → Transporter
# 3. Upload IPA
# 4. Go to App Store Connect
# 5. Create new version
# 6. Fill app information
# 7. Submit for review
```

#### 3. App Store Information

Required:
- App Name
- Subtitle
- Description
- Keywords
- Support URL
- Marketing URL
- Privacy Policy URL
- Screenshots (all device sizes)
- App Icon
- Age Rating
- App Category

### Android Play Store

#### 1. Prepare App

```bash
# Update version in app.config.ts
version: "1.0.0"
versionCode: 1

# Build for Play Store
eas build --platform android --profile production
```

#### 2. Submit to Play Store

```bash
# Automated submission
eas submit --platform android --latest

# Or manual:
# 1. Go to Google Play Console
# 2. Create new release
# 3. Upload AAB from EAS
# 4. Fill release notes
# 5. Submit for review
```

#### 3. Play Store Information

Required:
- App Name
- Short Description
- Full Description
- Screenshots (phone, tablet, TV if applicable)
- Feature Graphic
- App Icon
- Content Rating
- Category
- Privacy Policy URL
- Store Listing Contact

---

## Post-Deployment

### 1. Verification

```bash
# Test API health
curl https://api.yourdomain.com/health

# Test database connection
curl https://api.yourdomain.com/api/health/db

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/test
```

### 2. Monitoring Setup

**Sentry (Error Tracking):**
```bash
# Install Sentry
pnpm add @sentry/react-native @sentry/node

# Initialize in app
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: "production",
});
```

**Analytics:**
```typescript
// Google Analytics, Mixpanel, or similar
```

### 3. Performance Monitoring

- Setup uptime monitoring (UptimeRobot, Pingdom)
- Configure APM (New Relic, DataDog)
- Setup logging aggregation (Loggly, Papertrail)

### 4. Backup Strategy

```bash
# Automated database backups
# Cron job for daily backups
0 2 * * * /usr/bin/mysqldump -u user -p'password' database > /backups/db_$(date +\%Y\%m\%d).sql
```

### 5. Documentation

- Document deployment process
- Create rollback procedure
- Setup on-call rotation
- Create incident response runbook

---

## Rollback Procedure

### Backend Rollback

```bash
# If using Docker
docker stop growmaster-api
docker run -d --name growmaster-api previous-image:tag

# If using PM2
pm2 stop growmaster-api
git checkout previous-commit
pnpm install
pm2 restart growmaster-api

# Database rollback (if needed)
mysql -u user -p database < backup_YYYYMMDD.sql
```

### App Rollback

**iOS:**
- Can't rollback immediately
- Fix bug and submit hotfix (1-2 days review)
- Or pull app if critical

**Android:**
- Can rollback to previous version in Play Console
- Takes few hours to propagate

---

## Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor uptime
- Review analytics

**Weekly:**
- Database backup verification
- Security updates check
- Performance review

**Monthly:**
- Dependency updates
- Security audit
- Cost analysis

---

## Troubleshooting

### App won't start

1. Check logs: `pm2 logs growmaster-api`
2. Verify environment variables
3. Test database connection
4. Check disk space

### Database connection issues

1. Verify DATABASE_URL
2. Check firewall rules
3. Verify credentials
4. Test from server: `mysql -h host -u user -p`

### High memory usage

1. Check for memory leaks
2. Optimize queries
3. Add caching
4. Scale horizontally

---

## Support Contacts

- DevOps: devops@yourdomain.com
- Backend: backend@yourdomain.com
- Mobile: mobile@yourdomain.com
- On-call: oncall@yourdomain.com

---

**Last Updated:** 2026-01-08
**Version:** 1.0.0
