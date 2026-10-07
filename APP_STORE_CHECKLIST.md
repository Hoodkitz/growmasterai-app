# App Store & Play Store Veröffentlichungs-Checkliste
## GrowMaster AI - Komplette Pre-Launch Checkliste

**Status-Stand:** Oktober 2026  
**Version:** 1.0.0  
**Bundle-ID:** com.growmasterai.app

---

## ✅ 1. App-Konfiguration (app.config.ts)

### Basis-Metadaten
- [x] **App-Name:** GrowMaster AI
- [x] **Slug:** growmaster-app
- [x] **Version:** 1.0.0
- [x] **Runtime Version:** 1.0.0
- [x] **Bundle-ID iOS:** com.growmasterai.app
- [x] **Package Android:** com.growmasterai.app
- [x] **Orientation:** portrait
- [x] **User Interface Style:** dark
- [x] **Owner:** growmasterai
- [x] **EAS Project ID:** 107675ed-cb12-4ace-a851-8113f28add85

### Icons & Splash Screen
- [x] **App Icon:** `./assets/images/icon.png` (500x500px)
- [x] **Splash Icon:** `./assets/images/splash-icon.png` (2048x2048px)
- [x] **Favicon:** `./assets/images/favicon.png`
- [x] **Android Adaptive Icon:**
  - [x] Foreground: `./assets/images/android-icon-foreground.png` (4.3MB)
  - [x] Background: `./assets/images/android-icon-background.png` (18KB)
  - [x] Monochrome: `./assets/images/android-icon-monochrome.png` (4.1KB)
  - [x] Background Color: #0A0F0D

### Berechtigungen & Permissions
- [x] **Camera Permission:** "Allow $(PRODUCT_NAME) to access your camera for plant diagnosis."
- [x] **Photos Permission:** "Allow $(PRODUCT_NAME) to access your photos for plant diagnosis."
- [x] **Location Permission:** "Allow $(PRODUCT_NAME) to use your location to find growshops near you."
- [x] **Microphone Permission:** "Allow $(PRODUCT_NAME) to access your microphone."
- [x] **Android Permissions:** POST_NOTIFICATIONS

### Android Build-Konfiguration
- [x] **Build Archs:** armeabi-v7a, arm64-v8a
- [x] **compileSdkVersion:** 35
- [x] **targetSdkVersion:** 35
- [x] **minSdkVersion:** 24
- [x] **versionCode:** 1

---

## ⚠️ 2. Store-Assets (FEHLEND - MUSS ERSTELLT WERDEN!)

### App Icon (1024x1024px)
- [ ] **iOS App Store Icon:** 1024x1024px PNG ohne Transparenz
- [ ] **Google Play Store Icon:** 512x512px PNG (32-bit, transparenter Hintergrund möglich)

**AKTION ERFORDERLICH:** 
- Aktueller Icon ist nur 500x500px
- Muss auf 1024x1024px hochskaliert werden (für iOS)
- Separate 512x512px Version für Google Play erstellen

### Screenshots (KOMPLETT FEHLEND!)

#### iOS Screenshots benötigt:
- [ ] **iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max):** 1290x2796px (min. 3 Screenshots)
- [ ] **iPhone 6.5" (iPhone XS Max, 11 Pro Max):** 1242x2688px (min. 3 Screenshots)
- [ ] **iPhone 5.5" (iPhone 8 Plus):** 1242x2208px (optional)
- [ ] **iPad Pro 12.9" (3. Gen):** 2048x2732px (optional, wenn iPad unterstützt)

#### Android Screenshots benötigt:
- [ ] **Smartphone:** Min. 2 Screenshots, empfohlen 8
  - Auflösung: 1080x1920px oder höher
  - Format: JPG oder PNG (24-bit, kein Alpha)
- [ ] **7-Zoll Tablet:** Optional
- [ ] **10-Zoll Tablet:** Optional

#### Screenshot-Inhalte (gemäß PLAY_STORE_LISTING.md):
1. [ ] Home Dashboard mit Pflanzen-Übersicht
2. [ ] KI-Diagnose mit Kamera-Interface
3. [ ] AI Coach Chat-Screen
4. [ ] Grow Journal Eintrag
5. [ ] Sorten-Datenbank Ansicht
6. [ ] Community Feed
7. [ ] Marketplace/Shop
8. [ ] Gamification / Achievements Screen

### Video Preview (Optional aber empfohlen)
- [ ] **iOS:** App Preview Video (15-30 Sek., max. 500MB)
- [ ] **Android:** Feature Graphic 1024x500px + optional Promo Video (max. 2 Min.)

### Feature Graphic (nur Google Play)
- [ ] **Feature Graphic:** 1024x500px PNG/JPG für Play Store Header

---

## 📄 3. Rechtliche Dokumente

### Privacy Policy (Datenschutzerklärung)
- [x] **Datei vorhanden:** `legal/privacy.md` + `docs/legal/privacy.html`
- [x] **DSGVO-konform:** Ja
- [⚠️] **Impressum/Anbieter:** UNVOLLSTÄNDIG - "[Ihr Name / Firma]" + "[Adresse]" Platzhalter

**AKTION ERFORDERLICH:**
```markdown
Aktuell in privacy.md:
**GrowMaster AI**
[Ihr Name / Firma]
[Adresse]
[PLZ Ort]
```

**MUSS ERSETZT WERDEN durch:**
```markdown
**GrowMaster AI**
Julien Paarmann
[Vollständige Adresse]
[PLZ Ort]
Deutschland
```

- [x] **Hosting-Hinweis:** Ja (externer Hoster)
- [x] **Datenerfassung:** Vollständig dokumentiert
- [x] **Rechtsgrundlagen:** DSGVO Art. 6 korrekt referenziert
- [x] **Nutzerrechte:** Vollständig aufgeführt (Art. 15-21 DSGVO)
- [x] **Drittanbieter:** Google Sign-In, Apple Sign-In, RevenueCat dokumentiert
- [x] **KI-Dienste:** Gemini API erwähnt
- [x] **Kontakt:** support@growmaster.app
- [x] **Stand:** Januar 2026

### Terms of Service (AGB)
- [x] **Datei vorhanden:** `legal/terms.md` + `docs/legal/terms.html`
- [⚠️] **Impressum/Anbieter:** UNVOLLSTÄNDIG - "[Ihr Name / Firma]" + "[Adresse]" Platzhalter

**AKTION ERFORDERLICH:** Gleiche Ergänzung wie bei Privacy Policy

- [x] **Preisangaben:** 
  - Premium: 4,99€/Monat oder 39,99€/Jahr
  - Pro: 9,99€/Monat oder 79,99€/Jahr
- [x] **Widerrufsrecht:** Vollständig
- [x] **Abonnement-Verwaltung:** Apple & Google Play Hinweise
- [x] **Community-Richtlinien:** Ja
- [x] **Haftungsausschluss:** Ja (inkl. KI-Diagnosen)
- [x] **Anwendbares Recht:** Deutschland
- [x] **Stand:** Januar 2026

### Öffentliche URLs
- [x] **Privacy URL:** https://hoodkitz.github.io/growmasterai-legal/privacy.html
- [x] **Terms URL:** https://hoodkitz.github.io/growmasterai-legal/terms.html
- [ ] **URLs online verfügbar:** MUSS GEPRÜFT WERDEN

---

## 🏪 4. App Store Listing (iOS)

### Metadaten
- [ ] **App-Name:** GrowMaster AI - Cannabis Grow Assistent (max. 30 Zeichen)
- [ ] **Untertitel:** KI-Pflanzendiagnose & Grow-Coach (max. 30 Zeichen)
- [ ] **Beschreibung:** VORLAGE ERSTELLEN (max. 4000 Zeichen)

**VORLAGE Deutsch:**
```
GrowMaster AI ist dein intelligenter Begleiter für den Cannabis-Anbau. 

🤖 KI-PFLANZENDIAGNOSE
Fotografiere deine Pflanze und erhalte sofortige KI-gestützte Analysen zu:
• Nährstoffmangel & Überdüngung
• Schädlingsbefall
• Krankheiten & Pilze
• pH-Wert Probleme
• Licht- & Wasserstress

💬 AI GROW-COACH
Dein persönlicher 24/7 Berater für alle Fragen zu:
• Bewässerung & Nährstoffe
• Beleuchtung & Klima
• Training-Techniken (LST, HST, ScrOG)
• Problemlösung in allen Wachstumsphasen

🌿 PFLANZEN-MANAGEMENT
• Verwalte unbegrenzt viele Pflanzen
• Wachstumsphasen automatisch tracken
• Fortschritt visuell dokumentieren

📔 GROW JOURNAL
• Detailliertes Tagebuch mit Fotos
• Messwerte protokollieren (pH, EC, Temp.)
• Fortschritt analysieren

🧬 SORTEN-DATENBANK
• 1000+ Cannabis-Strains
• THC/CBD-Gehalte
• Blütezeiten & Erträge
• Anbau-Schwierigkeit

👥 COMMUNITY & SOCIAL
• Teile deine Grows
• Lerne von Profis
• Direktnachrichten
• Likes & Kommentare

🛠️ SMART TOOLS
• VPD-Rechner (Vapor Pressure Deficit)
• Nährstoff-Rechner
• CO2-Rechner
• Grow-Kalender mit Mondphasen
• Kosten-Tracker
• Ernte-Prognose

🎮 GAMIFICATION
• Level-System & XP
• Achievements freischalten
• Tägliche Streaks
• Leaderboard

🛒 MARKETPLACE
• Seeds, Nährstoffe, Equipment
• Verifizierte Händler
• Community-Bewertungen

PREMIUM-FEATURES:
✓ Unbegrenzte KI-Diagnosen
✓ Unbegrenzter Coach-Chat
✓ Erweiterte Pflanzen-Verwaltung
✓ Werbefrei
✓ Prioritäts-Support

DSGVO-konform • In Deutschland entwickelt • Sichere Datenspeicherung

Hinweis: Diese App dient ausschließlich dem legalen Cannabis-Anbau im Rahmen der geltenden Gesetze.
```

**VORLAGE Englisch:**
```
GrowMaster AI is your intelligent companion for cannabis cultivation.

🤖 AI PLANT DIAGNOSIS
Photo-based AI analysis detects:
• Nutrient deficiencies & toxicities
• Pest infestations
• Diseases & fungi
• pH issues
• Light & water stress

💬 AI GROW COACH
24/7 personal advisor for:
• Watering & nutrients
• Lighting & climate
• Training techniques (LST, HST, ScrOG)
• Problem-solving at any stage

🌿 PLANT MANAGEMENT
• Manage unlimited plants
• Auto-track growth phases
• Visual progress documentation

📔 GROW JOURNAL
• Detailed diary with photos
• Log measurements (pH, EC, temp)
• Analyze progress

🧬 STRAIN DATABASE
• 1000+ cannabis strains
• THC/CBD levels
• Flowering times & yields
• Grow difficulty ratings

👥 COMMUNITY & SOCIAL
• Share your grows
• Learn from pros
• Direct messaging
• Likes & comments

🛠️ SMART TOOLS
• VPD Calculator
• Nutrient Calculator
• CO2 Calculator
• Lunar grow calendar
• Cost tracker
• Harvest forecast

🎮 GAMIFICATION
• Level system & XP
• Unlock achievements
• Daily streaks
• Leaderboard

🛒 MARKETPLACE
• Seeds, nutrients, equipment
• Verified vendors
• Community reviews

PREMIUM FEATURES:
✓ Unlimited AI diagnoses
✓ Unlimited coach chat
✓ Extended plant management
✓ Ad-free
✓ Priority support

GDPR-compliant • Made in Germany • Secure data storage

Note: This app is intended for legal cannabis cultivation only.
```

### Keywords (iOS)
- [ ] **Keywords:** cannabis,grow,anbau,pflanze,diagnose,ki,ai,coach,journal,tracker (max. 100 Zeichen)

### Kategorien
- [ ] **Primärkategorie:** Lifestyle oder Produktivität
- [ ] **Sekundärkategorie:** Bildung

### Support & Marketing
- [ ] **Support-URL:** https://hoodkitz.github.io/growmasterai-legal/ oder support@growmaster.app
- [ ] **Marketing-URL:** Optional
- [ ] **Copyright:** © 2026 Julien Paarmann

### Altersfreigabe (iOS)
- [ ] **Rating:** 17+ (Cannabis Reference)
- [ ] **Begründung:** Frequent/Intense Alcohol, Tobacco, or Drug Use or References

---

## 🤖 5. Google Play Store Listing

### Metadaten
- [ ] **App-Name:** GrowMaster AI - Cannabis Grow Assistent (max. 50 Zeichen)
- [x] **Kurzbeschreibung:** "KI-Pflanzendiagnose, Grow-Coach & Community fuer Cannabis-Anbau" (max. 80 Zeichen)
- [x] **Vollständige Beschreibung:** Siehe PLAY_STORE_LISTING.md (max. 4000 Zeichen)

### Kategorien
- [ ] **Kategorie:** Lifestyle oder Tools
- [ ] **Tags:** cannabis, grow, anbau, pflanze, diagnose, ki, ai, grow assistant, pflanzen tracker, grow journal

### Content Rating
- [ ] **Fragebogen ausfüllen:** IARC-Questionnaire
- [ ] **Erwartetes Rating:** PEGI 18 / USK 18 / ESRB Mature 17+
- [ ] **Begründung:** Cannabis-Bezug

### Developer-Informationen
- [ ] **Entwickler-Name:** Julien Paarmann
- [ ] **E-Mail:** support@growmaster.app
- [ ] **Adresse:** Vollständige Postadresse erforderlich
- [ ] **Telefon:** Optional
- [ ] **Website:** https://hoodkitz.github.io/growmasterai-legal/

### Datenschutz & Sicherheit
- [x] **Privacy Policy URL:** https://hoodkitz.github.io/growmasterai-legal/privacy.html
- [ ] **Data Safety Form:** Ausfüllen (welche Daten werden gesammelt)
  - [ ] Standortdaten (optional, für Shop-Finder)
  - [ ] Persönliche Informationen (Name, E-Mail)
  - [ ] Fotos (Pflanzenbilder)
  - [ ] App-Aktivität (Nutzungsstatistiken)

---

## 🔧 6. EAS Build-Konfiguration

### eas.json
- [x] **Datei vorhanden:** Ja
- [x] **CLI Version:** >= 5.0.0
- [x] **App Version Source:** local

### Build-Profile
- [x] **Development:** ✅ Konfiguriert (developmentClient, internal)
- [x] **Preview:** ✅ Konfiguriert (APK für Android)
- [x] **Production:** ✅ Konfiguriert (AAB für Android)

### Android Production-Build
- [x] **buildType:** app-bundle (AAB)
- [x] **credentialsSource:** local
- [ ] **Keystore erstellt:** MUSS GEPRÜFT WERDEN
- [ ] **google-play-service-account.json:** MUSS ERSTELLT WERDEN

### Submit-Konfiguration
- [x] **serviceAccountKeyPath:** ./google-play-service-account.json
- [x] **track:** internal
- [ ] **Service Account JSON:** FEHLT (für automatisches Submit)

---

## 🔐 7. App Signing & Certificates

### iOS
- [ ] **Apple Developer Account:** Registriert?
- [ ] **App ID registriert:** com.growmasterai.app
- [ ] **Distribution Certificate:** Erstellt
- [ ] **Provisioning Profile:** Production App Store Profile
- [ ] **Push Notification Zertifikat:** Falls Benachrichtigungen verwendet

### Android
- [ ] **Google Play Console Account:** Registriert?
- [ ] **App erstellt:** com.growmasterai.app
- [ ] **Keystore-Datei:** Erstellt & sicher gespeichert
- [ ] **Key Alias:** Dokumentiert
- [ ] **Keystore Passwort:** Sicher verwahrt
- [ ] **App Signing by Google Play:** Aktiviert (empfohlen)

---

## 💳 8. Monetarisierung & RevenueCat

### RevenueCat Setup
- [x] **Integration:** react-native-purchases v9.6.12 installiert
- [ ] **RevenueCat Project:** Erstellt
- [ ] **API Keys:** Konfiguriert (.env)
  - [ ] iOS API Key
  - [ ] Android API Key
- [ ] **Products erstellt:**
  - [ ] Premium Monthly (€4.99)
  - [ ] Premium Yearly (€39.99)
  - [ ] Pro Monthly (€9.99)
  - [ ] Pro Yearly (€79.99)
- [ ] **Entitlements konfiguriert:** premium_access, pro_access

### iOS In-App Purchases
- [ ] **Agreements akzeptiert:** Paid Applications Agreement
- [ ] **Bankdaten hinterlegt:** In App Store Connect
- [ ] **Tax Forms ausgefüllt:** Banking & Tax
- [ ] **Products in App Store Connect:**
  - [ ] premium_monthly (4.99€ Auto-Renewable)
  - [ ] premium_yearly (39.99€ Auto-Renewable)
  - [ ] pro_monthly (9.99€ Auto-Renewable)
  - [ ] pro_yearly (79.99€ Auto-Renewable)

### Android In-App Billing
- [ ] **Merchant Account:** Google Play Console Zahlungskonto
- [ ] **Products in Play Console:**
  - [ ] premium_monthly (4.99€ Subscription)
  - [ ] premium_yearly (39.99€ Subscription)
  - [ ] pro_monthly (9.99€ Subscription)
  - [ ] pro_yearly (79.99€ Subscription)

---

## 🧪 9. Testing & Qualitätssicherung

### Funktionale Tests
- [ ] **Login/Registration:** Google, Apple, E-Mail
- [ ] **KI-Diagnose:** Bildupload & Analyse
- [ ] **AI Coach:** Chat-Funktionalität
- [ ] **Pflanzen-Management:** CRUD-Operationen
- [ ] **Journal:** Einträge erstellen/bearbeiten
- [ ] **Community:** Posts, Likes, Kommentare
- [ ] **Subscriptions:** Purchase Flow (Sandbox)
- [ ] **Deep Links:** Schema growmasterai://
- [ ] **Push Notifications:** Empfang & Handling

### Performance
- [ ] **App-Startzeit:** < 3 Sekunden
- [ ] **Bildlade-Zeiten:** Optimiert
- [ ] **Memory Leaks:** Keine
- [ ] **Crash-Rate:** < 1%

### Geräte-Kompatibilität
- [ ] **iOS:** iPhone 12, 13, 14, 15 (physische Geräte)
- [ ] **Android:** Verschiedene Hersteller & OS-Versionen (24-35)
- [ ] **Tablets:** iPad, Android Tablets (falls unterstützt)
- [ ] **Verschiedene Bildschirmgrößen:** Klein bis groß

### Sandbox/TestFlight
- [ ] **iOS TestFlight:** Beta-Tester eingeladen
- [ ] **Android Internal Testing:** Tester eingeladen
- [ ] **Subscription Testing:** Sandbox-Käufe durchgeführt
- [ ] **Feedback gesammelt:** Bugs behoben

---

## 📊 10. Analytics & Monitoring

### Eingerichtete Tools
- [ ] **Crash Reporting:** Sentry, Firebase Crashlytics?
- [ ] **Analytics:** Google Analytics, Mixpanel?
- [ ] **Performance Monitoring:** Firebase Performance?
- [ ] **RevenueCat Webhooks:** Für Subscription Events

---

## 📝 11. Store-Submission Checkliste

### iOS App Store (App Store Connect)
- [ ] **App erstellt:** In App Store Connect
- [ ] **Build hochgeladen:** eas build --platform ios --profile production
- [ ] **App-Informationen:**
  - [ ] Name, Untertitel, Beschreibung (DE + EN)
  - [ ] Keywords
  - [ ] Screenshots (alle Größen)
  - [ ] App Icon 1024x1024px
  - [ ] Privacy Policy URL
  - [ ] Support URL
  - [ ] Marketing URL (optional)
  - [ ] Copyright
- [ ] **Preise & Verfügbarkeit:**
  - [ ] Länder ausgewählt
  - [ ] Verfügbarkeitsdatum
- [ ] **App-Datenschutz:**
  - [ ] Datenschutz-Fragebogen ausgefüllt
- [ ] **Altersfreigabe:** 17+
- [ ] **App Review-Informationen:**
  - [ ] Demo-Account (falls Login erforderlich)
  - [ ] Test-Anweisungen
  - [ ] Kontaktinformationen
- [ ] **Zur Prüfung eingereicht:** Submit for Review

### Google Play Store (Play Console)
- [ ] **App erstellt:** In Play Console
- [ ] **Build hochgeladen:** eas build --platform android --profile production
- [ ] **Store-Eintrag:**
  - [ ] App-Name, Kurzbeschreibung, Beschreibung (DE + EN)
  - [ ] Screenshots (min. 2, empf. 8)
  - [ ] App Icon 512x512px
  - [ ] Feature Graphic 1024x500px
  - [ ] Kategorie & Tags
- [ ] **Content-Rating:** IARC-Fragebogen ausgefüllt
- [ ] **Preise & Vertrieb:**
  - [ ] Länder ausgewählt
  - [ ] Kostenlos/Kostenpflichtig
  - [ ] Content-Richtlinien akzeptiert
- [ ] **App-Inhalte:**
  - [ ] Datenschutzerklärung URL
  - [ ] Anzeigen (Ja/Nein)
  - [ ] Zielgruppe & Inhalt
- [ ] **Zur Prüfung freigegeben:** Submit for Review

---

## ⚠️ KRITISCHE BLOCKER (MUSS VOR SUBMISSION)

1. **IMPRESSUM VERVOLLSTÄNDIGEN**
   - Privacy Policy & Terms: Julien Paarmann + vollständige Adresse eintragen
   
2. **APP ICONS ERSTELLEN**
   - iOS: 1024x1024px PNG ohne Transparenz
   - Android: 512x512px PNG
   
3. **SCREENSHOTS ERSTELLEN**
   - Mindestens 3-8 Screenshots pro Plattform
   - Empfohlen: alle 8 Screen-Typen aus PLAY_STORE_LISTING.md
   
4. **LEGAL URLS ONLINE STELLEN**
   - privacy.html & terms.html auf https://hoodkitz.github.io/growmasterai-legal/ deployen
   - Erreichbarkeit testen
   
5. **DEVELOPER ACCOUNTS**
   - Apple Developer Program ($99/Jahr)
   - Google Play Developer ($25 einmalig)
   
6. **APP SIGNING**
   - iOS: Certificates & Provisioning Profiles
   - Android: Keystore generieren & sichern
   
7. **REVENUECAT SETUP**
   - Project erstellen, Products konfigurieren
   - In-App Products in App Store Connect & Play Console
   
8. **SERVICE ACCOUNT JSON** (für automatisches Submit)
   - google-play-service-account.json für EAS Submit

---

## 📅 Empfohlene Timeline

**Woche 1:**
- Impressum vervollständigen
- App Icons in richtiger Größe erstellen
- Screenshots aufnehmen (alle 8 Screens)

**Woche 2:**
- Developer Accounts registrieren
- Legal-Seiten online deployen
- App Signing konfigurieren

**Woche 3:**
- RevenueCat + In-App Products setup
- TestFlight/Internal Testing Beta
- Feedback sammeln & Bugs fixen

**Woche 4:**
- Store Listings finalisieren (Texte, Screenshots)
- Final Build & Submission
- Review-Prozess (7-14 Tage iOS, 2-7 Tage Android)

---

## 📧 Kontakte & Ressourcen

- **Support-E-Mail:** support@growmaster.app
- **Developer:** Julien Paarmann
- **Legal Docs:** https://hoodkitz.github.io/growmasterai-legal/
- **EAS Project ID:** 107675ed-cb12-4ace-a851-8113f28add85

---

**Erstellt:** 6. Oktober 2026  
**Letzte Aktualisierung:** 6. Oktober 2026
