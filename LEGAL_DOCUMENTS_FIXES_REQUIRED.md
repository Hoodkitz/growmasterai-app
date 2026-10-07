# Rechtliche Dokumente - Erforderliche Korrekturen

## Zusammenfassung

Die Privacy Policy und Terms of Service sind grundsätzlich gut strukturiert und DSGVO-konform. **ABER:** Beide Dokumente enthalten Platzhalter-Text, der vor der Veröffentlichung zwingend durch echte Daten ersetzt werden muss.

---

## 🚨 KRITISCH: Fehlende Impressums-Daten

### Betroffene Dateien
1. `legal/privacy.md` (Zeilen 46-50)
2. `legal/terms.md` (Zeilen 14-17)
3. `docs/legal/privacy.html` (falls vorhanden)
4. `docs/legal/terms.html` (falls vorhanden)

### Aktuelle Platzhalter (UNGÜLTIG!)

**In `legal/privacy.md` (Zeile 46-50):**
```markdown
**GrowMaster AI**
[Ihr Name / Firma]
[Adresse]
[PLZ Ort]

E-Mail: support@growmaster.app
```

**In `legal/terms.md` (Zeile 14-18):**
```markdown
**GrowMaster AI**
[Ihr Name / Firma]
[Adresse]
[PLZ Ort]
Deutschland

E-Mail: support@growmaster.app
```

---

## ✅ Erforderliche Korrekturen

### MUSS ersetzt werden durch:

```markdown
**GrowMaster AI**
Julien Paarmann
[Vollständige Straße + Hausnummer]
[PLZ Ort]
Deutschland

E-Mail: support@growmaster.app
```

**Beispiel (mit fiktiver Adresse):**
```markdown
**GrowMaster AI**
Julien Paarmann
Musterstraße 42
12345 Musterstadt
Deutschland

E-Mail: support@growmaster.app
```

---

## 📋 Zu erledigende Schritte

### 1. Informationen beschaffen
- [ ] **Name:** Julien Paarmann (bereits bekannt)
- [ ] **Straße + Hausnummer:** Vollständige Postadresse erforderlich
- [ ] **PLZ + Ort:** Vollständige Postadresse erforderlich
- [ ] **Land:** Deutschland (bereits eingetragen in terms.md)
- [ ] **Optional - Telefonnummer:** Nicht zwingend, aber empfohlen für Support
- [ ] **Optional - Handelsregisternummer:** Falls gewerblich registriert
- [ ] **Optional - USt-ID:** Falls vorhanden

### 2. Dateien aktualisieren

#### Datei 1: `legal/privacy.md`
**Zeilen 46-52 ersetzen:**
```bash
# Aktuell:
**GrowMaster AI**
[Ihr Name / Firma]
[Adresse]
[PLZ Ort]

E-Mail: support@growmaster.app

# Ersetzen durch:
**GrowMaster AI**
Julien Paarmann
[Ihre echte Straße + Hausnummer]
[Ihre echte PLZ + Ort]
Deutschland

E-Mail: support@growmaster.app
Telefon: [Optional]
```

#### Datei 2: `legal/terms.md`
**Zeilen 14-20 ersetzen:**
```bash
# Aktuell:
**GrowMaster AI**
[Ihr Name / Firma]
[Adresse]
[PLZ Ort]
Deutschland

E-Mail: support@growmaster.app

# Ersetzen durch:
**GrowMaster AI**
Julien Paarmann
[Ihre echte Straße + Hausnummer]
[Ihre echte PLZ + Ort]
Deutschland

E-Mail: support@growmaster.app
Telefon: [Optional]
```

#### Datei 3 & 4: HTML-Versionen
Falls `docs/legal/privacy.html` und `docs/legal/terms.html` existieren:
- [ ] Auch dort Platzhalter durch echte Daten ersetzen
- [ ] Oder automatisch aus den .md-Dateien generieren (empfohlen)

### 3. Online-Deployment
- [ ] Aktualisierte Dateien auf https://hoodkitz.github.io/growmasterai-legal/ hochladen
- [ ] Erreichbarkeit testen:
  - https://hoodkitz.github.io/growmasterai-legal/privacy.html
  - https://hoodkitz.github.io/growmasterai-legal/terms.html

---

## ⚖️ Rechtliche Begründung

### Warum ist das wichtig?

1. **DSGVO Art. 13 & 14:** Informationspflicht
   - Name und Kontaktdaten des Verantwortlichen müssen angegeben werden
   
2. **§ 5 TMG (Telemediengesetz):** Impressumspflicht
   - Auch Apps benötigen ein Impressum mit:
     - Name und Anschrift
     - Kontaktmöglichkeit (E-Mail)
     - Bei Gewerbe: Handelsregistereintrag, USt-ID
     
3. **App Store Requirements:**
   - Apple & Google verlangen vollständige Kontaktdaten
   - Bei Verstößen: App-Ablehnung oder Entfernung

4. **Abmahnrisiko:**
   - Fehlende/unvollständige Impressumsdaten = abmahnfähig
   - Bußgelder bis zu 50.000€ möglich

---

## 📱 App Store Connect & Play Console

### Diese Daten werden AUCH benötigt für:

#### Apple App Store Connect
- Developer-Name: **Julien Paarmann**
- Adresse: **Vollständige Postadresse**
- E-Mail: **support@growmaster.app**
- Telefon: **Optional, aber empfohlen**

#### Google Play Console
- Developer-Name: **Julien Paarmann**
- Adresse: **Vollständige Postadresse** (PFLICHT!)
- E-Mail: **support@growmaster.app**
- Telefon: **Optional**
- Website: **https://hoodkitz.github.io/growmasterai-legal/**

---

## ✅ Checkliste vor Submission

- [ ] **Privacy Policy:** Platzhalter durch echte Daten ersetzt
- [ ] **Terms of Service:** Platzhalter durch echte Daten ersetzt
- [ ] **HTML-Versionen:** Aktualisiert (oder aus .md generiert)
- [ ] **Online-Deployment:** URLs erreichbar
- [ ] **App Store Connect:** Developer-Informationen eingetragen
- [ ] **Play Console:** Developer-Informationen eingetragen
- [ ] **Rechtskonformität:** Von Anwalt prüfen lassen (empfohlen)

---

## 💡 Empfehlung: Automatische Generierung

Um Duplikate zu vermeiden, könntest du:

1. **Zentrales Config-File erstellen:**
```typescript
// legal-config.ts
export const LEGAL_INFO = {
  companyName: "GrowMaster AI",
  owner: "Julien Paarmann",
  street: "[Ihre Straße + Hausnummer]",
  zip: "[PLZ]",
  city: "[Ort]",
  country: "Deutschland",
  email: "support@growmaster.app",
  phone: "[Optional]", // kann leer bleiben
  website: "https://hoodkitz.github.io/growmasterai-legal/",
};
```

2. **Script zum Generieren der HTML-Dateien:**
```bash
# Markdown zu HTML konvertieren + Platzhalter ersetzen
pnpm add -D marked
node scripts/generate-legal-pages.js
```

3. **GitHub Pages Deployment:**
   - Bei jedem Commit automatisch aktualisiert
   - Keine manuellen Duplikate

---

## 📞 Support

Bei Fragen zu den rechtlichen Anforderungen:
- **DSGVO:** https://gdpr.eu
- **TMG:** https://www.gesetze-im-internet.de/tmg/
- **Rechtsberatung:** Anwalt für IT-Recht konsultieren

---

**Erstellt:** 6. Oktober 2026  
**Nächster Schritt:** Vollständige Adressdaten von Julien Paarmann eintragen
