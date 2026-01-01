/**
 * GrowMaster AI - Vendor Outreach System
 * 
 * Automatisiertes System zur Akquise von Anbietern/Partnern.
 * Enthält Email-Templates und Outreach-Funktionen.
 */

export interface VendorContact {
  companyName: string;
  contactName?: string;
  email: string;
  website?: string;
  type: "seedbank" | "growshop" | "headshop" | "nutrient" | "equipment" | "other";
  country?: string;
  notes?: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: "initial" | "followup" | "partnership" | "advertising";
}

// Email-Templates für verschiedene Anbieter-Typen
export const EMAIL_TEMPLATES: OutreachTemplate[] = [
  {
    id: "seedbank-initial",
    name: "Samenbank - Erstanfrage",
    type: "initial",
    subject: "Partnerschaft mit GrowMaster AI - Europas führende Grow-App",
    body: `Sehr geehrte Damen und Herren,

mein Name ist [IHR_NAME] und ich bin der Gründer von GrowMaster AI, einer innovativen Mobile App für Cannabis-Anbauer mit über [NUTZER_ANZAHL] aktiven Nutzern in Deutschland.

Unsere App bietet:
• KI-gestützte Pflanzendiagnose und Krankheitserkennung
• Umfassende Sorten-Datenbank mit Bewertungen
• Community mit über [COMMUNITY_ANZAHL] aktiven Growern
• Grow-Journal und Ertrags-Tracking

Wir möchten Ihnen folgende Partnerschaftsmöglichkeiten anbieten:

1. **Affiliate-Partnerschaft**: Direkte Integration Ihrer Produkte in unsere Sorten-Datenbank mit Kauflinks
2. **Sponsored Strains**: Hervorgehobene Platzierung Ihrer Sorten in unserer Datenbank
3. **Banner-Werbung**: Gezielte Werbung an unsere kaufkräftige Zielgruppe
4. **Gewinnspiele**: Gemeinsame Aktionen zur Kundenbindung

Unsere Nutzer sind:
• 85% männlich, 25-45 Jahre
• Durchschnittliches Einkommen: überdurchschnittlich
• Hohe Kaufbereitschaft für Premium-Genetik

Ich würde mich freuen, die Möglichkeiten einer Zusammenarbeit in einem kurzen Gespräch zu besprechen.

Mit freundlichen Grüßen,
[IHR_NAME]
GrowMaster AI
[EMAIL]
[TELEFON]`,
  },
  {
    id: "growshop-initial",
    name: "Growshop - Erstanfrage",
    type: "initial",
    subject: "Exklusive Partnerschaft für [SHOP_NAME] in der GrowMaster AI App",
    body: `Sehr geehrte Damen und Herren,

als Betreiber der GrowMaster AI App, der führenden Cannabis-Grow-App im deutschsprachigen Raum, möchte ich Ihnen eine exklusive Partnerschaft anbieten.

**Was wir bieten:**
• Listung in unserem Shop-Finder mit [NUTZER_ANZAHL] monatlichen Suchanfragen
• Verifiziertes Partner-Badge für erhöhtes Vertrauen
• Direkte Verlinkung zu Ihrem Online-Shop
• Bewertungssystem für Kundenfeedback
• Exklusive Rabattcodes für unsere Community

**Unsere Reichweite:**
• [NUTZER_ANZAHL] aktive App-Nutzer
• [COMMUNITY_ANZAHL] Community-Mitglieder
• Durchschnittlich [SESSIONS] App-Sessions pro Tag

**Partnerschafts-Pakete:**

BASIC (kostenlos):
- Einfache Listung im Shop-Finder
- Grundlegende Kontaktdaten

PROFESSIONAL (€49/Monat):
- Verifiziertes Partner-Badge
- Erweiterte Shop-Beschreibung
- Produktkatalog-Integration
- Monatliche Performance-Reports

ENTERPRISE (€149/Monat):
- Alle Professional-Features
- Exklusive Banner-Platzierung
- Gewinnspiel-Möglichkeiten
- Prioritäts-Support
- Individuelle Kampagnen

Lassen Sie uns gemeinsam Ihre Reichweite erhöhen!

Mit freundlichen Grüßen,
[IHR_NAME]
GrowMaster AI`,
  },
  {
    id: "equipment-initial",
    name: "Equipment-Hersteller - Erstanfrage",
    type: "initial",
    subject: "Produktplatzierung in GrowMaster AI - [NUTZER_ANZAHL] potenzielle Kunden",
    body: `Sehr geehrte Damen und Herren,

GrowMaster AI ist die meistgenutzte Grow-App im deutschsprachigen Raum. Unsere Nutzer suchen aktiv nach hochwertigem Equipment für ihren Anbau.

**Warum eine Partnerschaft mit uns?**

Unsere App enthält:
• Grow-Kalender mit Equipment-Empfehlungen
• Phasen-basierte Produktvorschläge
• VPD- und Nährstoff-Rechner mit Produktlinks
• Tutorial-Bereich mit Equipment-Reviews

**Ihre Vorteile:**
• Direkte Produktempfehlungen an kaufbereite Nutzer
• Integration in unsere Grow-Guides
• Affiliate-Provisionen von 5-15%
• Detaillierte Conversion-Reports

**Besonders gefragt sind:**
• LED-Grow-Lights
• Growzelte und Belüftung
• Messgeräte (pH, EC, Temperatur)
• Nährstoffe und Substrate

Ich würde Ihnen gerne unsere Partnerschaftsmöglichkeiten in einem persönlichen Gespräch vorstellen.

Mit freundlichen Grüßen,
[IHR_NAME]
GrowMaster AI`,
  },
  {
    id: "followup",
    name: "Follow-Up Email",
    type: "followup",
    subject: "Re: Partnerschaft mit GrowMaster AI - Kurze Nachfrage",
    body: `Sehr geehrte Damen und Herren,

ich möchte kurz an meine Email von letzter Woche erinnern bezüglich einer möglichen Partnerschaft mit GrowMaster AI.

Unsere App wächst stetig und wir haben gerade [NEUE_NUTZER] neue Nutzer im letzten Monat gewonnen. Das Interesse an hochwertigen Produkten ist enorm.

Hätten Sie diese Woche Zeit für ein kurzes 15-minütiges Gespräch? Ich bin flexibel und richte mich gerne nach Ihrem Kalender.

Alternativ können Sie sich auch direkt über unsere App als Partner registrieren: [PARTNER_LINK]

Mit freundlichen Grüßen,
[IHR_NAME]
GrowMaster AI`,
  },
  {
    id: "advertising",
    name: "Werbepartnerschaft",
    type: "advertising",
    subject: "Werben Sie in GrowMaster AI - Erreichen Sie [NUTZER_ANZAHL] Cannabis-Enthusiasten",
    body: `Sehr geehrte Damen und Herren,

möchten Sie Ihre Produkte direkt an Cannabis-Anbauer vermarkten? GrowMaster AI bietet Ihnen die perfekte Plattform.

**Unsere Werbemöglichkeiten:**

📱 **In-App Banner**
- Home-Screen Banner: €0.05 CPC
- Community-Feed Banner: €0.03 CPC
- Sorten-Datenbank Banner: €0.08 CPC

🎁 **Gewinnspiele & Verlosungen**
- Erreichen Sie tausende potenzielle Kunden
- Generieren Sie Leads und Newsletter-Anmeldungen
- Steigern Sie Ihre Markenbekanntheit

🏆 **Sponsored Content**
- Gesponserte Sorten in unserer Datenbank
- Produktreviews in unserem Tutorial-Bereich
- Featured Partner im Shop-Finder

**Warum GrowMaster AI?**
• Hochengagierte Zielgruppe
• Durchschnittliche Session-Dauer: 8 Minuten
• 70% der Nutzer kaufen online
• Premium-Segment mit hoher Kaufkraft

Fordern Sie jetzt unser Media-Kit an oder vereinbaren Sie einen Termin für eine Demo.

Mit freundlichen Grüßen,
[IHR_NAME]
GrowMaster AI
Werbepartnerschaften`,
  },
];

// Potenzielle Partner-Datenbank (Beispiel)
export const POTENTIAL_PARTNERS: VendorContact[] = [
  // Samenbanken
  { companyName: "Sensi Seeds", email: "info@sensiseeds.com", type: "seedbank", website: "https://sensiseeds.com", country: "NL" },
  { companyName: "Royal Queen Seeds", email: "info@royalqueenseeds.com", type: "seedbank", website: "https://royalqueenseeds.com", country: "NL" },
  { companyName: "Dutch Passion", email: "info@dutch-passion.com", type: "seedbank", website: "https://dutch-passion.com", country: "NL" },
  { companyName: "Barney's Farm", email: "info@barneysfarm.com", type: "seedbank", website: "https://barneysfarm.com", country: "NL" },
  { companyName: "Fast Buds", email: "info@fastbuds.com", type: "seedbank", website: "https://fastbuds.com", country: "ES" },
  { companyName: "Seedsman", email: "affiliates@seedsman.com", type: "seedbank", website: "https://seedsman.com", country: "UK" },
  { companyName: "Zamnesia", email: "affiliates@zamnesia.com", type: "seedbank", website: "https://zamnesia.com", country: "NL" },
  
  // Growshops
  { companyName: "Growland", email: "info@growland.net", type: "growshop", website: "https://growland.net", country: "DE" },
  { companyName: "Grow-Shop24", email: "info@grow-shop24.de", type: "growshop", website: "https://grow-shop24.de", country: "DE" },
  { companyName: "Headshop24", email: "info@headshop24.de", type: "headshop", website: "https://headshop24.de", country: "DE" },
  
  // Equipment
  { companyName: "SANlight", email: "info@sanlight.com", type: "equipment", website: "https://sanlight.com", country: "AT" },
  { companyName: "Lumatek", email: "info@lumatek.com", type: "equipment", website: "https://lumatek.com", country: "UK" },
  { companyName: "Secret Jardin", email: "info@secretjardin.com", type: "equipment", website: "https://secretjardin.com", country: "BE" },
  
  // Nährstoffe
  { companyName: "BioBizz", email: "info@biobizz.com", type: "nutrient", website: "https://biobizz.com", country: "NL" },
  { companyName: "Advanced Nutrients", email: "info@advancednutrients.com", type: "nutrient", website: "https://advancednutrients.com", country: "CA" },
  { companyName: "Canna", email: "info@canna.com", type: "nutrient", website: "https://canna.com", country: "NL" },
];

/**
 * Generiert eine personalisierte Email aus einem Template
 */
export function generateEmail(
  template: OutreachTemplate,
  vendor: VendorContact,
  customData: Record<string, string> = {}
): { subject: string; body: string } {
  const replacements: Record<string, string> = {
    "[SHOP_NAME]": vendor.companyName,
    "[COMPANY_NAME]": vendor.companyName,
    "[CONTACT_NAME]": vendor.contactName || "Damen und Herren",
    "[IHR_NAME]": customData.senderName || "Max Mustermann",
    "[EMAIL]": customData.senderEmail || "partner@growmaster.app",
    "[TELEFON]": customData.senderPhone || "+49 123 456789",
    "[NUTZER_ANZAHL]": customData.userCount || "10.000+",
    "[COMMUNITY_ANZAHL]": customData.communityCount || "5.000+",
    "[SESSIONS]": customData.dailySessions || "15.000",
    "[NEUE_NUTZER]": customData.newUsers || "2.000",
    "[PARTNER_LINK]": customData.partnerLink || "https://growmaster.app/partner",
    ...customData,
  };

  let subject = template.subject;
  let body = template.body;

  Object.entries(replacements).forEach(([key, value]) => {
    subject = subject.replace(new RegExp(key.replace(/[[\]]/g, "\\$&"), "g"), value);
    body = body.replace(new RegExp(key.replace(/[[\]]/g, "\\$&"), "g"), value);
  });

  return { subject, body };
}

/**
 * Erstellt eine Outreach-Kampagne für mehrere Anbieter
 */
export function createOutreachCampaign(
  vendors: VendorContact[],
  templateId: string,
  customData: Record<string, string> = {}
): Array<{
  vendor: VendorContact;
  email: { subject: string; body: string };
}> {
  const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  return vendors.map(vendor => ({
    vendor,
    email: generateEmail(template, vendor, customData),
  }));
}

/**
 * Filtert potenzielle Partner nach Typ
 */
export function getPartnersByType(type: VendorContact["type"]): VendorContact[] {
  return POTENTIAL_PARTNERS.filter(p => p.type === type);
}

/**
 * Generiert einen Mailto-Link für eine Email
 */
export function generateMailtoLink(
  email: string,
  subject: string,
  body: string
): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Outreach-Status Tracking
 */
export type OutreachStatus = "pending" | "sent" | "opened" | "replied" | "converted" | "rejected";

export interface OutreachRecord {
  id: string;
  vendorId: string;
  vendor: VendorContact;
  templateId: string;
  status: OutreachStatus;
  sentAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  notes?: string;
}

// In-Memory Tracking (in Produktion: Datenbank)
const outreachRecords: OutreachRecord[] = [];

export function trackOutreach(record: Omit<OutreachRecord, "id">): OutreachRecord {
  const newRecord: OutreachRecord = {
    ...record,
    id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  outreachRecords.push(newRecord);
  return newRecord;
}

export function updateOutreachStatus(id: string, status: OutreachStatus, notes?: string): void {
  const record = outreachRecords.find(r => r.id === id);
  if (record) {
    record.status = status;
    if (notes) record.notes = notes;
    if (status === "sent") record.sentAt = new Date();
    if (status === "opened") record.openedAt = new Date();
    if (status === "replied") record.repliedAt = new Date();
  }
}

export function getOutreachStats(): {
  total: number;
  byStatus: Record<OutreachStatus, number>;
  conversionRate: number;
} {
  const byStatus: Record<OutreachStatus, number> = {
    pending: 0,
    sent: 0,
    opened: 0,
    replied: 0,
    converted: 0,
    rejected: 0,
  };

  outreachRecords.forEach(record => {
    byStatus[record.status]++;
  });

  const total = outreachRecords.length;
  const conversionRate = total > 0 ? (byStatus.converted / total) * 100 : 0;

  return { total, byStatus, conversionRate };
}
