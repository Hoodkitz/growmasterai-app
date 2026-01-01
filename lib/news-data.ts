// News and Legal Information for Cannabis in Germany

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "law" | "politics" | "science" | "community" | "tips";
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: Date;
  isPinned?: boolean;
}

export interface LegalInfo {
  id: string;
  title: string;
  description: string;
  details: string[];
  lastUpdated: Date;
  category: "possession" | "cultivation" | "clubs" | "driving" | "minors" | "public";
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Current German Cannabis Law (CanG) - as of April 2024
export const LEGAL_INFO: LegalInfo[] = [
  {
    id: "possession",
    title: "Besitz",
    description: "Erlaubte Mengen für den Eigenbesitz",
    details: [
      "Bis zu 25g Cannabis in der Öffentlichkeit erlaubt",
      "Bis zu 50g Cannabis zu Hause erlaubt",
      "Gilt nur für Personen ab 18 Jahren",
      "Überschreitung ist eine Ordnungswidrigkeit oder Straftat",
    ],
    lastUpdated: new Date("2024-04-01"),
    category: "possession",
  },
  {
    id: "cultivation",
    title: "Eigenanbau",
    description: "Regeln für den privaten Anbau",
    details: [
      "Maximal 3 blühende Pflanzen pro Person erlaubt",
      "Nur für den Eigenbedarf",
      "Pflanzen müssen vor Zugriff durch Minderjährige geschützt sein",
      "Anbau muss am Wohnsitz erfolgen",
      "Samen und Stecklinge dürfen nicht verkauft werden",
    ],
    lastUpdated: new Date("2024-04-01"),
    category: "cultivation",
  },
  {
    id: "clubs",
    title: "Cannabis Social Clubs",
    description: "Anbauvereinigungen ab Juli 2024",
    details: [
      "Maximal 500 Mitglieder pro Club",
      "Mitgliedschaft nur für Volljährige mit Wohnsitz in Deutschland",
      "Maximal 25g pro Tag, 50g pro Monat pro Mitglied",
      "Abgabe nur an Mitglieder, kein Verkauf",
      "Konsum nur außerhalb des Clubs",
      "Mindestabstand 200m zu Schulen und Kitas",
    ],
    lastUpdated: new Date("2024-07-01"),
    category: "clubs",
  },
  {
    id: "driving",
    title: "Autofahren",
    description: "THC-Grenzwerte im Straßenverkehr",
    details: [
      "Neuer THC-Grenzwert: 3,5 ng/ml im Blut",
      "Für Fahranfänger (Probezeit) gilt 0,0 ng/ml",
      "Mischkonsum mit Alkohol ist verboten",
      "Bei Auffälligkeiten droht MPU",
      "Bußgeld ab 500€ bei Überschreitung",
    ],
    lastUpdated: new Date("2024-04-01"),
    category: "driving",
  },
  {
    id: "public",
    title: "Öffentlicher Konsum",
    description: "Wo ist Konsum erlaubt?",
    details: [
      "Konsum in Fußgängerzonen zwischen 7-20 Uhr verboten",
      "200m Abstand zu Schulen, Kitas, Spielplätzen",
      "Konsum in Sportstätten verboten",
      "Private Räume und Gärten erlaubt",
      "Kommunen können weitere Verbotszonen einrichten",
    ],
    lastUpdated: new Date("2024-04-01"),
    category: "public",
  },
  {
    id: "minors",
    title: "Jugendschutz",
    description: "Regeln zum Schutz Minderjähriger",
    details: [
      "Abgabe an unter 18-Jährige ist strafbar",
      "Konsum in Gegenwart von Minderjährigen verboten",
      "Werbung für Cannabis ist verboten",
      "Pflanzen müssen vor Kindern gesichert sein",
      "Verstöße werden streng geahndet",
    ],
    lastUpdated: new Date("2024-04-01"),
    category: "minors",
  },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "news1",
    title: "Cannabis-Gesetz tritt in Kraft",
    summary: "Seit dem 1. April 2024 ist der Besitz und Anbau von Cannabis für Erwachsene in Deutschland legal.",
    content: "Das Cannabisgesetz (CanG) ist am 1. April 2024 in Kraft getreten. Erwachsene dürfen nun bis zu 25 Gramm Cannabis in der Öffentlichkeit und bis zu 50 Gramm zu Hause besitzen. Der private Anbau von bis zu drei blühenden Pflanzen ist ebenfalls erlaubt.",
    category: "law",
    source: "Bundesregierung",
    sourceUrl: "https://www.bundesregierung.de",
    publishedAt: new Date("2024-04-01"),
    isPinned: true,
  },
  {
    id: "news2",
    title: "Cannabis Social Clubs starten",
    summary: "Ab Juli 2024 können Anbauvereinigungen gegründet werden.",
    content: "Cannabis Social Clubs dürfen ab dem 1. Juli 2024 gegründet werden. Diese nicht-kommerziellen Vereine können bis zu 500 Mitglieder haben und Cannabis für den Eigenbedarf anbauen. Die Abgabe ist auf 25g pro Tag und 50g pro Monat begrenzt.",
    category: "law",
    source: "BMG",
    sourceUrl: "https://www.bundesgesundheitsministerium.de",
    publishedAt: new Date("2024-07-01"),
  },
  {
    id: "news3",
    title: "Neuer THC-Grenzwert für Autofahrer",
    summary: "Der THC-Grenzwert im Straßenverkehr wurde auf 3,5 ng/ml festgelegt.",
    content: "Nach langer Diskussion wurde der THC-Grenzwert für Autofahrer auf 3,5 Nanogramm pro Milliliter Blut festgelegt. Dieser Wert soll vergleichbar mit der 0,5-Promille-Grenze für Alkohol sein. Für Fahranfänger gilt weiterhin ein striktes Verbot.",
    category: "law",
    source: "ADAC",
    sourceUrl: "https://www.adac.de",
    publishedAt: new Date("2024-03-22"),
  },
  {
    id: "news4",
    title: "Tipps für den ersten Grow",
    summary: "Was Anfänger beim Eigenanbau beachten sollten.",
    content: "Der legale Eigenanbau stellt viele vor neue Herausforderungen. Experten empfehlen, mit robusten Sorten zu beginnen und auf Qualitätserde sowie ausreichend Licht zu achten. Autoflowering-Sorten sind besonders für Anfänger geeignet.",
    category: "tips",
    source: "GrowMaster",
    sourceUrl: "https://growmaster.app",
    publishedAt: new Date("2024-04-15"),
  },
  {
    id: "news5",
    title: "Studie: Medizinisches Cannabis wirksam",
    summary: "Neue Forschungsergebnisse bestätigen Wirksamkeit bei chronischen Schmerzen.",
    content: "Eine aktuelle Studie der Charité Berlin zeigt, dass medizinisches Cannabis bei chronischen Schmerzen signifikante Linderung bringen kann. Die Forscher untersuchten über 1.000 Patienten über einen Zeitraum von zwei Jahren.",
    category: "science",
    source: "Charité Berlin",
    sourceUrl: "https://www.charite.de",
    publishedAt: new Date("2024-05-10"),
  },
];

export const FAQ_DATA: FAQ[] = [
  {
    id: "faq1",
    question: "Wie viel Cannabis darf ich besitzen?",
    answer: "In der Öffentlichkeit darfst du bis zu 25 Gramm Cannabis bei dir tragen. Zu Hause sind bis zu 50 Gramm erlaubt. Diese Mengen gelten pro Person und nur für Erwachsene ab 18 Jahren.",
    category: "possession",
  },
  {
    id: "faq2",
    question: "Wie viele Pflanzen darf ich anbauen?",
    answer: "Du darfst maximal 3 blühende Cannabispflanzen gleichzeitig anbauen. Der Anbau muss an deinem Wohnsitz erfolgen und die Pflanzen müssen vor dem Zugriff durch Minderjährige geschützt sein.",
    category: "cultivation",
  },
  {
    id: "faq3",
    question: "Darf ich nach dem Konsum Auto fahren?",
    answer: "Der THC-Grenzwert liegt bei 3,5 ng/ml im Blut. Da THC lange nachweisbar ist, solltest du nach dem Konsum mindestens 24 Stunden warten. Für Fahranfänger gilt ein striktes Verbot (0,0 ng/ml).",
    category: "driving",
  },
  {
    id: "faq4",
    question: "Wo darf ich Cannabis konsumieren?",
    answer: "Konsum ist in privaten Räumen und Gärten erlaubt. In Fußgängerzonen ist er zwischen 7-20 Uhr verboten. Halte 200m Abstand zu Schulen, Kitas und Spielplätzen. Kommunen können weitere Verbotszonen einrichten.",
    category: "public",
  },
  {
    id: "faq5",
    question: "Was ist ein Cannabis Social Club?",
    answer: "Ein Cannabis Social Club ist eine nicht-kommerzielle Anbauvereinigung mit maximal 500 Mitgliedern. Mitglieder können dort Cannabis für den Eigenbedarf beziehen (max. 25g/Tag, 50g/Monat). Der Konsum ist nur außerhalb des Clubs erlaubt.",
    category: "clubs",
  },
  {
    id: "faq6",
    question: "Darf ich Samen oder Stecklinge kaufen?",
    answer: "Ja, der Kauf von Samen und Stecklingen ist für Erwachsene legal. Der Verkauf ist jedoch nur über lizenzierte Händler erlaubt. Online-Bestellungen aus dem EU-Ausland sind möglich.",
    category: "cultivation",
  },
  {
    id: "faq7",
    question: "Was passiert bei Überschreitung der Grenzen?",
    answer: "Bei geringfügiger Überschreitung droht ein Bußgeld. Bei erheblicher Überschreitung kann es sich um eine Straftat handeln. Die genauen Konsequenzen hängen von der Menge und den Umständen ab.",
    category: "possession",
  },
  {
    id: "faq8",
    question: "Darf ich Cannabis an Freunde weitergeben?",
    answer: "Die unentgeltliche Weitergabe kleiner Mengen an Erwachsene ist grundsätzlich erlaubt. Verkauf ist jedoch verboten. Die Weitergabe an Minderjährige ist eine Straftat.",
    category: "possession",
  },
];

// Helper function to get category label
export function getCategoryLabel(category: NewsArticle["category"]): string {
  const labels: Record<NewsArticle["category"], string> = {
    law: "Gesetzgebung",
    politics: "Politik",
    science: "Wissenschaft",
    community: "Community",
    tips: "Tipps",
  };
  return labels[category];
}

// Helper function to get category color
export function getCategoryColor(category: NewsArticle["category"]): string {
  const colors: Record<NewsArticle["category"], string> = {
    law: "#EF4444",
    politics: "#8B5CF6",
    science: "#3B82F6",
    community: "#10B981",
    tips: "#F59E0B",
  };
  return colors[category];
}

// Helper function to format date
export function formatNewsDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Heute";
  if (days === 1) return "Gestern";
  if (days < 7) return `Vor ${days} Tagen`;
  if (days < 30) return `Vor ${Math.floor(days / 7)} Wochen`;
  
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
