# 🌱 GrowMaster AI

**Die ultimative KI-gestützte Mobile App für Cannabis-Anbau**

Eine React Native App mit intelligenter Pflanzendiagnose, AI-Coach, Community-Features und vollständiger Monetarisierung.

![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## ✨ Features

### 🤖 KI-Funktionen
- **Pflanzen-Diagnose**: Gemini Vision API analysiert Pflanzenfotos und erkennt Probleme
- **AI Coach**: Chatbot mit Grow-Expertise für Fragen rund um den Anbau
- **Smart-Tipps**: Kontextbasierte Empfehlungen und Ratschläge

### 🌿 Pflanzen-Management
- **Meine Pflanzen**: Verwaltung mehrerer Pflanzen mit Details
- **Grow Journal**: Tägliche Einträge mit Fotos, Notizen und Messwerten
- **Wachstums-Tracking**: Visualisierung des Fortschritts
- **Strain-Datenbank**: Informationen zu verschiedenen Cannabis-Sorten

### 👥 Community & Social
- **Community Feed**: Teile Grows, Erfolge und Erfahrungen
- **Likes & Kommentare**: Interagiere mit anderen Growern
- **Direktnachrichten**: Private Kommunikation
- **Grow-Galerie**: Inspirierende Bilder der Community

### 🎮 Gamification
- **Level-System**: Sammle XP durch Aktivitäten
- **Achievements**: Freischaltbare Erfolge und Badges
- **Streak-System**: Tägliche Login-Belohnungen
- **Leaderboard**: Vergleiche dich mit anderen

### 🛒 Marketplace
- **Produkt-Katalog**: Seeds, Nährstoffe, Equipment
- **Vendor Portal**: Händler können Produkte einstellen
- **Affiliate-System**: Verdiene Provisionen
- **Bewertungen**: Community-basierte Produktbewertungen

### 💰 Monetarisierung
- **Freemium Model**: 3 Tier-System (Free, Premium, Pro)
- **In-App-Purchases**: RevenueCat Integration
- **Werbung**: Banner-Ads für Free-Nutzer
- **Feature-Limits**: Gestaffelte Zugriffsbeschränkungen

### 🔐 Admin-Features
- **Admin Dashboard**: Nutzer- und Content-Verwaltung
- **Moderation**: Community-Beiträge prüfen und moderieren
- **Analytics**: Nutzungsstatistiken und Metriken
- **Content-Management**: Strain-Datenbank pflegen

## 🏗️ Tech Stack

### Frontend
- **Framework**: React Native 0.81.5
- **UI Library**: Expo SDK 54
- **Routing**: Expo Router v6 (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: React Query + tRPC
- **Forms**: React Hook Form
- **Icons**: SF Symbols (iOS), Material Icons (Android)

### Backend
- **API**: tRPC (type-safe API)
- **Server**: Express.js
- **Database**: MySQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT + OAuth (Google, Apple)
- **AI**: Google Gemini Vision API

### Infrastructure
- **Monetization**: RevenueCat
- **Push Notifications**: Expo Notifications
- **Storage**: Local storage (AsyncStorage, SecureStore)
- **Image Handling**: Expo Image Picker, Expo Camera

### Development
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Testing**: Vitest
- **Linting**: ESLint (Expo config)
- **Formatting**: Prettier

## 📋 Prerequisites

- **Node.js**: >= 18.x
- **pnpm**: >= 9.x
- **Expo CLI**: Latest version
- **iOS**: Xcode (for iOS development)
- **Android**: Android Studio (for Android development)
- **MySQL**: Database server

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repository
git clone <repository-url>
cd growmaster-app

# Install dependencies
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/growmaster"

# API Keys
GEMINI_API_KEY="your-gemini-api-key"
REVENUECAT_API_KEY="your-revenuecat-api-key"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
APPLE_CLIENT_ID="your-apple-client-id"

# Server
PORT=3000
NODE_ENV=development

# App Configuration
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate and run migrations
pnpm db:push
```

### 4. Start Development

```bash
# Start both server and Expo dev server
pnpm dev

# Or start separately
pnpm dev:server  # Backend on port 3000
pnpm dev:metro   # Expo on port 8081
```

### 5. Run on Device/Simulator

```bash
# iOS
pnpm ios

# Android
pnpm android

# Web
# Already running on http://localhost:8081
```

## 📱 Building for Production

### Android (APK/AAB)

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

### iOS (IPA)

```bash
# Build for TestFlight
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

### Web

```bash
# Build static website
npx expo export:web

# Output in dist/ folder
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/subscription.test.ts

# Type checking
pnpm check

# Linting
pnpm lint

# Format code
pnpm format
```

## 📂 Project Structure

```
growmaster-app/
├── app/                      # Expo Router pages
│   ├── (tabs)/              # Main tab navigation
│   │   ├── index.tsx        # Home screen
│   │   ├── diagnose.tsx     # Plant diagnosis
│   │   ├── coach.tsx        # AI Coach chat
│   │   ├── community.tsx    # Community feed
│   │   ├── plants.tsx       # My plants
│   │   └── journal.tsx      # Grow journal
│   ├── oauth/               # OAuth callback
│   ├── _layout.tsx          # Root layout
│   ├── login.tsx            # Login modal
│   ├── paywall.tsx          # Subscription paywall
│   ├── settings.tsx         # Settings
│   ├── admin.tsx            # Admin dashboard
│   ├── marketplace.tsx      # Product marketplace
│   └── vendor-portal.tsx    # Vendor management
├── components/              # Reusable components
│   ├── ui/                  # UI primitives
│   ├── error-boundary.tsx   # Error handling
│   ├── screen-container.tsx # Layout wrapper
│   └── upgrade-prompt.tsx   # Paywall prompt
├── lib/                     # Core libraries
│   ├── _core/              # Framework utilities
│   ├── auth-context.tsx    # Authentication state
│   ├── subscription-context.tsx # Subscription state
│   ├── gamification-context.tsx # Gamification state
│   ├── trpc.ts             # tRPC client
│   ├── logger.ts           # Logging utility
│   └── purchases.ts        # RevenueCat integration
├── server/                  # Backend code
│   ├── _core/              # Server framework
│   ├── routers.ts          # tRPC routers
│   ├── db.ts               # Database queries
│   └── storage.ts          # File storage
├── drizzle/                # Database schema
│   └── schema.ts           # Table definitions
├── hooks/                   # Custom React hooks
├── constants/              # App constants
├── assets/                 # Images, fonts, etc.
├── tests/                  # Test files
└── docs/                   # Documentation
```

## 🔑 Key Concepts

### Subscription Tiers

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Pflanzen | 2 | 10 | Unlimited |
| Diagnosen/Tag | 3 | 10 | Unlimited |
| Coach Messages/Tag | 5 | 20 | Unlimited |
| Journal Einträge | 20 | 100 | Unlimited |
| Werbung | ✅ | ❌ | ❌ |
| Community Posts | 5/Tag | 20/Tag | Unlimited |
| Marketplace | Browse | Browse | Sell |
| Prioritäts-Support | ❌ | ✅ | ✅ |

### Authentication Flow

1. User opens app → Sees onboarding/login
2. Chooses login method (Google/Apple/Email)
3. OAuth callback → JWT token issued
4. Token stored in SecureStore
5. Auto-login on next app start

### AI Diagnosis Flow

1. User takes/uploads plant photo
2. Image sent to Gemini Vision API
3. AI analyzes image for problems
4. Returns diagnosis + recommendations
5. Saved to database with photo

## 🛠️ Configuration

### App Configuration

Edit `app.config.ts`:

```typescript
{
  appName: "GrowMaster AI",
  appSlug: "growmaster-app",
  logoUrl: "your-logo-url",
  iosBundleId: "space.manus.growmaster.app.xxx",
  androidPackage: "space.manus.growmaster.app.xxx"
}
```

### Theme Customization

Edit `tailwind.config.js` and `theme.config.js`:

```javascript
colors: {
  primary: '#10B981',    // Green
  secondary: '#8B5CF6',  // Purple
  background: '#0A0F0D', // Dark background
  // ...
}
```

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `plants` - User's plants
- `journal_entries` - Daily grow logs
- `diagnoses` - AI diagnosis history
- `community_posts` - Social posts
- `products` - Marketplace items
- `achievements` - Unlockable badges
- `strains` - Cannabis strain info

See `drizzle/schema.ts` for complete schema.

## 🔒 Security

- JWT tokens for authentication
- Secure token storage (Expo SecureStore)
- API rate limiting
- Input validation with Zod
- SQL injection protection (Drizzle ORM)
- Environment variables for secrets
- CORS configuration
- XSS protection

## 🚦 Performance

- React Query caching
- Image optimization (Expo Image)
- Lazy loading
- Code splitting
- Bundle size optimization
- Database indexing
- tRPC batching

## 🐛 Debugging

```bash
# View backend logs
pnpm dev:server

# Enable React Native debugger
# Shake device → "Debug"

# View tRPC queries in React Query DevTools
# (Web only)
```

## 📝 Known Issues

- iOS camera permission sometimes requires app restart
- RevenueCat sandbox mode required for testing purchases
- Web export has SSR limitations for some routes (mobile builds unaffected)

## 🤝 Contributing

This is a proprietary project. Contact the owner for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 👨‍💻 Author

Created with ❤️ by the GrowMaster AI Team

## 📞 Support

- Email: support@growmaster.ai
- Documentation: [Link to docs]
- Community: [Link to community]

---

**Happy Growing! 🌿**
