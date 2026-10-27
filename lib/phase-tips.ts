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
  a2dvPckbWEU: "WIE du dein CANNABIS richtig TROCKNEST",
  ww7_81UuxDA:
    "Wie erkennt man ob eine Cannabis Pflanze männlich oder weiblich ist?",
  bo3uA5hqh50:
    "Maximaler Ertrag – So füllst du dein gesamtes Zelt mit Low und High Stress Training",
};

const GERM = "hylMwwNgp5c";
const BEGIN = "54JClBM_cOc";
const DRY = "a2dvPckbWEU";
const TRAIN = "bo3uA5hqh50";
const SEX = "ww7_81UuxDA";

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
    id: "train-topping",
    phases: ["vegetative"],
    topic: "Toppen",
    text: "Beim Toppen schneidest du den Haupttrieb mit der Schere ab. Die unteren Seitentriebe konkurrieren dann um die Rolle des neuen Haupttriebs, die Pflanze wird buschiger – besonders wichtig auf kleinem Raum. Vince toppt das erste Mal an der dritten Nodie (Blattachsel).",
    videoId: TRAIN,
    start: 85,
  },
  {
    id: "train-topping-repeat",
    phases: ["vegetative"],
    topic: "Mehrfach toppen",
    text: "Aus z. B. 6 Haupttrieben werden durch erneutes Toppen 12 – so füllt die Pflanze mit der Zeit die Fläche im Zelt aus.",
    videoId: TRAIN,
    start: 165,
  },
  {
    id: "train-wait",
    phases: ["vegetative"],
    topic: "Nach dem Toppen erst wachsen lassen",
    text: "Direkt nach dem Beschnitt nicht gleich trainieren oder Triebe runterbinden – das stresst die Pflanze und bremst das Wachstum. Erst wachsen lassen und auf ausreichend Nährstoffe und Wasser achten.",
    videoId: TRAIN,
    start: 300,
  },
  {
    id: "train-second-topping",
    phases: ["vegetative"],
    topic: "Zweites Toppen",
    text: "Erst toppen, wenn die Triebe kräftig sind (kleine Blätter in den Blattachseln). Dann an allen neuen Spitzen oben über der letzten großen Verzweigung abschneiden und danach unten aufräumen.",
    videoId: TRAIN,
    start: 478,
  },
  {
    id: "train-lst",
    phases: ["vegetative"],
    topic: "Low Stress Training (LST)",
    text: "Triebe mit Clips oder Draht um etwa 90° runterbiegen und am Topf fixieren, sodass eine gleichmäßige Oberfläche entsteht. Die Triebe dabei so positionieren, dass auch die unteren Licht abbekommen.",
    videoId: TRAIN,
    start: 660,
  },
  {
    id: "train-clips-remove",
    phases: ["vegetative", "flowering"],
    topic: "Clips rechtzeitig entfernen",
    text: "Sobald die Pflanze verholzt, die Clips abnehmen. Sonst wächst sie in die Clips ein und kann sich verletzen.",
    videoId: TRAIN,
    start: 1186,
  },
  {
    id: "dry-prep",
    phases: ["harvest"],
    topic: "Vor der Ernte",
    text: "Vince empfiehlt, vor der Ernte 24–48 Stunden das Licht auszulassen. Ziel ist ein sauberes, nicht verschimmeltes Produkt.",
    videoId: DRY,
    start: 83,
  },
  {
    id: "dry-hang",
    phases: ["harvest"],
    topic: "Ganz abschneiden und aufhängen",
    text: "Die komplette Pflanze unten abschneiden, die großen Fächerblätter entfernen, die Blätter direkt an den Blüten dranlassen und die Pflanze kopfüber aufhängen. Nicht in kleinen Stücken auf Netze legen – dabei gehen Trichome verloren.",
    videoId: DRY,
    start: 127,
  },
  {
    id: "dry-no-wet-trim",
    phases: ["harvest"],
    topic: "Erst trocknen, dann trimmen",
    text: "Kein Nass-Trimmen direkt bei der Ernte: Offene Schnittstellen lassen Sporen eindringen und Feuchtigkeit entweichen, das Trocknen läuft zu schnell. Trimmen am besten, wenn die Pflanze schon trocken ist.",
    videoId: DRY,
    start: 168,
  },
  {
    id: "dry-clean",
    phases: ["harvest"],
    topic: "Sauber arbeiten",
    text: "Handschuhe tragen und desinfizierte Scheren benutzen – jede Verunreinigung kann am Ende zu Schimmel führen.",
    videoId: DRY,
    start: 211,
  },
  {
    id: "dry-air",
    phases: ["harvest"],
    topic: "Luft und Geruchsfilter",
    text: "Den Abluftfilter nicht ausschalten (die Trocknung riecht stark). Dauerhaft ein leichter Luftzug im Zelt, damit keine Staunässe entsteht – den Lüfter nicht direkt auf die Pflanzen richten.",
    videoId: DRY,
    start: 254,
  },
  {
    id: "dry-climate",
    phases: ["harvest"],
    topic: "Klima beim Trocknen",
    text: "Ideal sind laut Vince 45–55 % relative Luftfeuchte und 15–18 °C. Ab etwa 20–22 °C verflüchtigen sich viele Terpene.",
    videoId: DRY,
    start: 296,
  },
  {
    id: "dry-snap",
    phases: ["harvest"],
    topic: "Wann ins Glas?",
    text: "Stängel-Test: Frisch geerntet knickt er weich und lautlos, trocken knackt er hörbar. Anfänger nehmen die Blüten ab, wenn der Stängel knackt, und füllen sie dann in die Gläser.",
    videoId: DRY,
    start: 338,
  },
  {
    id: "dry-jars",
    phases: ["harvest"],
    topic: "Gefäße",
    text: "Vince bevorzugt Gefäße mit großer Öffnung, in die man die Blüten samt Blättern legen kann. Durchsichtige Gefäße kühl und dunkel lagern (ca. 15–18 °C), damit Cannabinoide und Terpene nicht abgebaut werden.",
    videoId: DRY,
    start: 426,
  },
  {
    id: "dry-hygro",
    phases: ["harvest"],
    topic: "Feuchte im Glas kontrollieren",
    text: "Ein Hygrometer im Glas (und ggf. Feuchtigkeitsbeutel mit 62 %) zeigt, ob du im richtigen Bereich bist: etwa 62–65 %. Liegt der Wert darüber, das Glas 1–2 Stunden offen lassen (Beutel vorher herausnehmen) und dann wieder schließen.",
    videoId: DRY,
    start: 555,
  },
  {
    id: "dry-mold",
    phases: ["harvest"],
    topic: "Schimmel kontrollieren",
    text: "Dicke, kompakte Blüten regelmäßig innen prüfen: Rötlich-braune, faserige Beläge sind verdächtig. Ist ein Glas kontaminiert, im Zweifel wegwerfen – Schimmel gehört nicht in die Lunge. Ein Heu-/Grasgeruch am Anfang ist normal und verfliegt nach ca. 7–10 Tagen.",
    videoId: DRY,
    start: 767,
  },
  {
    id: "sex-why",
    phases: ["vegetative", "flowering"],
    topic: "Warum das Geschlecht wichtig ist",
    text: "Nur weibliche Pflanzen tragen die begehrten Blüten. Wird eine Pflanze bestäubt, steckt sie ihre Kraft in Samen, bildet weniger Blüten und der Cannabinoid-Gehalt sinkt. Männchen deshalb sofort aus dem Garten nehmen.",
    videoId: SEX,
    start: 58,
  },
  {
    id: "sex-feminized",
    phases: ["seedling", "vegetative"],
    topic: "Feminisierte Samen sind keine Garantie",
    text: "Auch feminisiertes Saatgut kann zwittern, und eine kleine Restwahrscheinlichkeit (etwa 1 %) für ein Männchen bleibt. Kontrolliere deshalb trotzdem.",
    videoId: SEX,
    start: 137,
  },
  {
    id: "sex-timing",
    phases: ["vegetative", "flowering"],
    topic: "Wann man das Geschlecht sieht",
    text: "Das Geschlecht zeigt sich erst, wenn die Pflanze in die Blüte geht – aus Samen meist nach 3–5 Wochen. Indoor leitest du die Blüte ein, indem du die Lichtdauer von 18 auf 12 Stunden stellst.",
    videoId: SEX,
    start: 169,
  },
  {
    id: "sex-female",
    phases: ["vegetative", "flowering"],
    topic: "Weibchen erkennen",
    text: "Weibliche Vorblüten sehen aus wie kleine weiße, V-förmig angeordnete Härchen am Blütenkelch. Du findest sie an den Nodien im mittleren und oberen Teil der Pflanze.",
    videoId: SEX,
    start: 235,
  },
  {
    id: "sex-wait",
    phases: ["vegetative", "flowering"],
    topic: "Geduld beim Bestimmen",
    text: "Mit einer Lupe sind die Vorblüten etwa 7–10 Tage nach Blütebeginn gut zu erkennen. Zeigt die Pflanze noch nichts, 2–3 Tage warten und den Garten täglich kontrollieren, bis alle Pflanzen ihr Geschlecht gezeigt haben.",
    videoId: SEX,
    start: 269,
  },
  {
    id: "sex-male",
    phases: ["vegetative", "flowering"],
    topic: "Männchen erkennen",
    text: "Männliche Pflanzen bilden Pollensäcke – keine V-förmigen Härchen, sondern kleine Kügelchen (unter der Lupe wie winzige Bananenstauden), ebenfalls an den Nodien im mittleren bis oberen Bereich.",
    videoId: SEX,
    start: 317,
  },
  {
    id: "sex-remove",
    phases: ["vegetative", "flowering"],
    topic: "Männchen vorsichtig entfernen",
    text: "Beim Entfernen behutsam vorgehen: Öffnet sich ein Pollensack, können die weiblichen Pflanzen ungewollt bestäubt werden.",
    videoId: SEX,
    start: 376,
  },
  {
    id: "sex-herma",
    phases: ["flowering"],
    topic: "Zwitter (Hermaphroditen)",
    text: "Zwitter bilden männliche und weibliche Merkmale. Auslöser können Stress, Nährstoffmangel oder -überschuss oder Dürre sein. Zwitter können auch spät und über die gesamte Blüte entstehen – mach daher regelmäßig Stichproben.",
    videoId: SEX,
    start: 403,
  },
  {
    id: "sex-banana",
    phases: ["flowering"],
    topic: "„Bananen“ erkennen",
    text: "Bei Zwittern wachsen männliche Staubgefäße („Bananen“, oft hellgrün oder gelb, manchmal gebündelt) aus den weiblichen Blüten, meist erst spät in der Blüte. Sie können jederzeit Pollen freisetzen.",
    videoId: SEX,
    start: 477,
  },
  {
    id: "sex-herma-late",
    phases: ["flowering", "harvest"],
    topic: "Zwitter spät entdeckt",
    text: "Vince entfernt Zwitter grundsätzlich. Wird einer erst in den letzten 1–1,5 Wochen entdeckt, kann man die Bananen vorsichtig entfernen und ein paar Samen riskieren – oder etwas früher ernten und dafür weniger Ertrag in Kauf nehmen.",
    videoId: SEX,
    start: 519,
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
