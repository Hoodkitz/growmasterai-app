// Grow tips by phase. Each tip is taken from a Vince and Weed video and links to the
// exact moment it is explained, so it can be checked. Paraphrased in German from the
// (auto-generated) transcript; units converted (°F to °C, inch to cm).

export type TipPhase =
  | "germination"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "harvest";

export interface PhaseTip {
  id: string;
  /** Phases in which the tip is relevant. */
  phases: TipPhase[];
  topic: string;
  text: string;
  videoId: string;
  /** Start of the explanation in the video, in seconds. */
  start: number;
}

export const TIP_VIDEO_CHANNEL = "Vince and Weed";

export const TIP_VIDEOS: Record<string, string> = {
  hylMwwNgp5c: "Samen richtig keimen lassen – WAS KANN SCHIEFGEHEN",
  "54JClBM_cOc": "Typische Anfängerfehler im Garten – Was du wissen solltest!",
};

const GERM = "hylMwwNgp5c";
const BEGIN = "54JClBM_cOc";

export const PHASE_TIPS: PhaseTip[] = [
  {
    id: "germ-conditions",
    phases: ["germination"],
    topic: "Keimbedingungen",
    text: "Optimal sind ca. 20–26 °C, Dunkelheit und feuchtes (nicht nasses) Substrat. Der Samen liegt etwa 1–1,5 cm tief. Eine Keimrate von 100 % ist nie garantiert.",
    videoId: GERM,
    start: 85,
  },
  {
    id: "germ-soil",
    phases: ["germination"],
    topic: "Keimen in Erde",
    text: "Vince empfiehlt, direkt in Erde zu keimen statt im Papiertuch oder Wasserglas: Dort drohen Überwässerung, beschädigte Pfahlwurzeln und Abbrechen beim Umsetzen.",
    videoId: GERM,
    start: 270,
  },
  {
    id: "germ-soil-prep",
    phases: ["germination"],
    topic: "Erde vorbereiten",
    text: "Leicht vorgedüngte Anzuchterde vorher gleichmäßig anfeuchten. Nie stark gedüngte Erde oder Dünger bei der Keimung verwenden – Nährsalze führen zu Wachstumsproblemen und Verbrennungen.",
    videoId: GERM,
    start: 345,
  },
  {
    id: "germ-planting",
    phases: ["germination"],
    topic: "Einpflanzen",
    text: "Mit einem Stab ein ca. 1,5 cm tiefes Loch machen, Samen hineinlegen, Loch schließen und andrücken. So bleibt die Samenschale in der Erde hängen und wird abgestreift.",
    videoId: GERM,
    start: 367,
  },
  {
    id: "germ-shell",
    phases: ["germination", "seedling"],
    topic: "Samenschale hängt noch",
    text: "Bleibt die Schale an den Keimblättern hängen, vorsichtig mit sauberer Pinzette entfernen (dabei kann viel kaputtgehen). Beim nächsten Mal den Samen 2–5 mm tiefer setzen.",
    videoId: GERM,
    start: 240,
  },
  {
    id: "germ-box",
    phases: ["germination"],
    topic: "Klima halten",
    text: "Töpfe in ein kleines Gewächshaus oder eine durchsichtige Box stellen, nicht ganz verschließen (Schimmel). Fensterbank (Zugluft) und Heizung (zu warm, trocknet aus) sind ungünstig.",
    videoId: GERM,
    start: 397,
  },
  {
    id: "germ-extra",
    phases: ["germination"],
    topic: "Reserve einplanen",
    text: "10–20 % mehr Samen ankeimen, als du brauchst. Ungenutzte Samen dunkel, sehr trocken und bei 2–5 °C lagern – dann bleiben sie bis zu 6 Jahre keimfähig.",
    videoId: GERM,
    start: 450,
  },
  {
    id: "stretch-light",
    phases: ["seedling"],
    topic: "Vergeilen vermeiden",
    text: "Bekommt der Keimling zu wenig Licht, streckt er sich, wird lang und dünn und kippt ab ca. 7 cm leicht um. Herstellerangaben der Lampe beachten; bei dimmbaren Lampen etwa 30–40 cm Abstand, mit 10–15 % Leistung starten und langsam steigern.",
    videoId: BEGIN,
    start: 341,
  },
  {
    id: "stretch-thread",
    phases: ["seedling", "vegetative"],
    topic: "Lampenabstand messen",
    text: "Praxis-Trick: Einen Faden in Wunschlänge (z. B. 35–40 cm) mit einer Mutter an der Lampe befestigen – wächst die Pflanze darüber hinaus, die Lampe abends höher hängen.",
    videoId: BEGIN,
    start: 393,
  },
  {
    id: "water-balance",
    phases: ["seedling", "vegetative", "flowering"],
    topic: "Gießen: zu wenig vs. zu viel",
    text: "Zu wenig und zu viel Wasser lassen beide die Blätter hängen. Dauerhaft zu trockene Erde wird wasserabweisend (Wasser läuft sofort unten durch). Zu viel Wasser macht die Pflanze weich und gummiartig, dazu kommen große gelbe/braune Flecken.",
    videoId: BEGIN,
    start: 21,
  },
  {
    id: "water-lift",
    phases: ["seedling", "vegetative", "flowering"],
    topic: "Gießen: Topf anheben",
    text: "Topf anheben: Wirkt er zu schwer, wurde wahrscheinlich zu viel gegossen. Die Wurzeln brauchen auch Sauerstoff – dauerhaft nasse Erde blockiert Nährstoff- und Wasseraufnahme.",
    videoId: BEGIN,
    start: 79,
  },
  {
    id: "feed-deficiency",
    phases: ["vegetative", "flowering"],
    topic: "Gelb von unten: Mangel",
    text: "Vergilbt die Pflanze von unten nach oben (wie ein Weihnachtsbaum), fehlen Nährstoffe in der Erde und sie zehrt von ihren Reserven – typisch Stickstoff. Dann hätte etwas früher gedüngt werden sollen.",
    videoId: BEGIN,
    start: 185,
  },
  {
    id: "feed-burn",
    phases: ["vegetative", "flowering"],
    topic: "Gelbe Blattspitzen oben: zu viel Dünger",
    text: "Werden die Blattspitzen oben gelb-braun (oft bei sattem Dunkelgrün), war die Nährlösung zu stark („Nährstoffbrand“): Dünger besteht aus Salzen und entzieht der Pflanze Wasser.",
    videoId: BEGIN,
    start: 220,
  },
  {
    id: "repot",
    phases: ["seedling", "vegetative"],
    topic: "Umtopfen",
    text: "Vince topft zweimal um: erst, wenn der Topf komplett durchwurzelt ist (Topf massieren, die Wurzeln müssen die Erde halten). Der neue Topf sollte rundum mindestens 4–5 cm mehr Platz bieten, z. B. 1 l, dann 1,5–2,5 l, dann der Endtopf.",
    videoId: BEGIN,
    start: 436,
  },
  {
    id: "repot-feed",
    phases: ["seedling", "vegetative"],
    topic: "Düngen erst im Endtopf",
    text: "Auf dem Weg vom ersten bis zum letzten Topf muss man als Anfänger in der Regel nicht düngen – gedüngt wird erst ab dem letzten Topf.",
    videoId: BEGIN,
    start: 477,
  },
  {
    id: "harvest-trichomes",
    phases: ["harvest", "flowering"],
    topic: "Erntezeitpunkt",
    text: "Nicht nach den Härchen gehen. Besser die Trichome prüfen: durchsichtig = zu früh, milchig = guter Zeitpunkt, bernsteinfarben = die Inhaltsstoffe beginnen abzubauen. Dafür eine Lupe (25x bis 200x) nutzen.",
    videoId: BEGIN,
    start: 598,
  },
  {
    id: "harvest-patience",
    phases: ["harvest", "flowering"],
    topic: "Geduld",
    text: "Der Erntetag kommt später, als man warten möchte. Geduld ist laut Vince das größte Hindernis für eine gute Ernte.",
    videoId: BEGIN,
    start: 585,
  },
];

export const TIP_PHASE_LABEL: Record<TipPhase, string> = {
  germination: "Keimung",
  seedling: "Keimling",
  vegetative: "Wachstum",
  flowering: "Blüte",
  harvest: "Ernte",
};

export function tipVideoUrl(tip: Pick<PhaseTip, "videoId" | "start">): string {
  return `https://www.youtube.com/watch?v=${tip.videoId}&t=${tip.start}s`;
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function tipsForPhase(phase: TipPhase): PhaseTip[] {
  return PHASE_TIPS.filter((t) => t.phases.includes(phase));
}
