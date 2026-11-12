/**
 * Smart Grow: Sensoren, Aktoren und Befehle für das vernetzte Zelt.
 *
 * Reine Typen/Konstanten – Server, App und Geräte-Protokoll nutzen dieselben Namen.
 */

export const METRICS = [
  "airTemp", // °C Lufttemperatur
  "airRh", // % relative Luftfeuchte
  "co2", // ppm
  "leafTemp", // °C Blatttemperatur (IR-Sensor)
  "waterTemp", // °C Tank
  "waterEc", // mS/cm Tank
  "waterPh", // Tank
  "waterLevel", // % Füllstand Tank
  "soilMoisture", // % Substratfeuchte
  "soilEc", // mS/cm Substrat
  "soilPh", // Substrat
  "soilTemp", // °C Substrat
  "ppfd", // µmol/m²/s Lichtsensor
  "leak", // 0 = trocken, 1 = Wasser am Boden
  "runoffEc", // mS/cm Drainwasser (Salzstau erkennen)
  "runoffPh", // Drainwasser
  "dissolvedOxygen", // mg/l gelöster Sauerstoff (Hydro)
  "smoke", // 0/1 Rauchmelder
  "power", // W Stromverbrauch
  "door", // 0 = zu, 1 = offen
] as const;
export type Metric = (typeof METRICS)[number];

export const METRIC_INFO: Record<
  Metric,
  { label: string; unit: string; min: number; max: number; decimals: number }
> = {
  // min/max = physikalisch plausibler Messbereich; Werte außerhalb gelten als Sensorfehler
  airTemp: {
    label: "Lufttemperatur",
    unit: "°C",
    min: -10,
    max: 60,
    decimals: 1,
  },
  airRh: { label: "Luftfeuchte", unit: "%", min: 0, max: 100, decimals: 0 },
  co2: { label: "CO₂", unit: "ppm", min: 150, max: 10000, decimals: 0 },
  leafTemp: {
    label: "Blatttemperatur",
    unit: "°C",
    min: -10,
    max: 60,
    decimals: 1,
  },
  waterTemp: {
    label: "Wassertemperatur",
    unit: "°C",
    min: 0,
    max: 45,
    decimals: 1,
  },
  waterEc: { label: "EC Wasser", unit: "mS/cm", min: 0, max: 10, decimals: 2 },
  waterPh: { label: "pH Wasser", unit: "", min: 0, max: 14, decimals: 2 },
  waterLevel: {
    label: "Tankfüllstand",
    unit: "%",
    min: 0,
    max: 100,
    decimals: 0,
  },
  soilMoisture: {
    label: "Substratfeuchte",
    unit: "%",
    min: 0,
    max: 100,
    decimals: 0,
  },
  soilEc: { label: "EC Substrat", unit: "mS/cm", min: 0, max: 10, decimals: 2 },
  soilPh: { label: "pH Substrat", unit: "", min: 0, max: 14, decimals: 2 },
  soilTemp: {
    label: "Substrattemperatur",
    unit: "°C",
    min: -10,
    max: 50,
    decimals: 1,
  },
  ppfd: {
    label: "Lichtstärke (PPFD)",
    unit: "µmol/m²/s",
    min: 0,
    max: 3000,
    decimals: 0,
  },
  leak: { label: "Leck-Sensor", unit: "", min: 0, max: 1, decimals: 0 },
  runoffEc: {
    label: "EC Drainwasser",
    unit: "mS/cm",
    min: 0,
    max: 15,
    decimals: 2,
  },
  runoffPh: { label: "pH Drainwasser", unit: "", min: 0, max: 14, decimals: 2 },
  dissolvedOxygen: {
    label: "Sauerstoff im Wasser",
    unit: "mg/l",
    min: 0,
    max: 25,
    decimals: 1,
  },
  smoke: { label: "Rauchmelder", unit: "", min: 0, max: 1, decimals: 0 },
  power: {
    label: "Stromverbrauch",
    unit: "W",
    min: 0,
    max: 10000,
    decimals: 0,
  },
  door: { label: "Zelt-Tür", unit: "", min: 0, max: 1, decimals: 0 },
};

export const ACTUATORS = [
  "light", // 0–100 % (dimmbar) bzw. 0/100
  "exhaust", // Abluft 0–100 %
  "intake", // Zuluft 0–100 %
  "circulation", // Umluft-Ventilator 0–100 %
  "heater", // 0/100
  "cooler", // Klimagerät 0/100
  "humidifier", // 0/100
  "dehumidifier", // 0/100
  "co2", // CO₂-Ventil 0/100
  "pump", // Bewässerung: läuft N Sekunden
  "doser", // Dosierpumpen: ml je Kanal
  "waterValve", // Magnetventil Wasserzulauf zum Tank 0/100
  "chiller", // Wasserkühler 0/100
  "airPump", // Luftpumpe/Sprudelstein 0/100
] as const;
export type Actuator = (typeof ACTUATORS)[number];

export const ACTUATOR_LABEL: Record<Actuator, string> = {
  light: "Licht",
  exhaust: "Abluft",
  intake: "Zuluft",
  circulation: "Umluft",
  heater: "Heizung",
  cooler: "Kühlung",
  humidifier: "Luftbefeuchter",
  dehumidifier: "Entfeuchter",
  co2: "CO₂-Ventil",
  pump: "Bewässerung",
  doser: "Dosierpumpen",
  waterValve: "Tank-Zulauf (Ventil)",
  chiller: "Wasserkühler",
  airPump: "Luftpumpe",
};

export const DOSER_CHANNELS = [
  "nutrientA",
  "nutrientB",
  "bloom",
  "calmag",
  "phDown",
  "phUp",
] as const;
export type DoserChannel = (typeof DOSER_CHANNELS)[number];
export const DOSER_LABEL: Record<DoserChannel, string> = {
  nutrientA: "Dünger A",
  nutrientB: "Dünger B",
  bloom: "Blütedünger",
  calmag: "Cal-Mag",
  phDown: "pH minus",
  phUp: "pH plus",
};

/** Ein Befehl an ein Gerät. */
export type Command =
  | {
      actuator: Exclude<Actuator, "pump" | "doser">;
      kind: "set";
      value: number;
    }
  | { actuator: "pump"; kind: "run"; seconds: number }
  | { actuator: "doser"; kind: "dose"; channel: DoserChannel; ml: number };

export type CommandSource = "controller" | "ai" | "user" | "safety";

/** Wachstumsabschnitt für Zielwerte. */
export const STAGES = [
  "seedling",
  "veg",
  "earlyFlower",
  "lateFlower",
  "flush",
  "drying",
] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  seedling: "Keimling",
  veg: "Wachstum",
  earlyFlower: "Frühe Blüte",
  lateFlower: "Späte Blüte",
  flush: "Spülen (vor der Ernte)",
  drying: "Trocknen",
};

export const MEDIA = ["soil", "coco", "hydro"] as const;
export type Medium = (typeof MEDIA)[number];
export const MEDIUM_LABEL: Record<Medium, string> = {
  soil: "Erde",
  coco: "Kokos",
  hydro: "Hydro",
};

/** Autopilot-Modus: aus, nur Vorschläge (Sicherheitsabschaltungen laufen trotzdem), voll autonom. */
export const MODES = ["off", "assist", "auto"] as const;
export type Mode = (typeof MODES)[number];
export const MODE_LABEL: Record<Mode, string> = {
  off: "Aus",
  assist: "Vorschläge",
  auto: "Autopilot",
};

export type Range = { min: number; max: number };

/** Ein Messwert mit Zeitstempel (ms). */
export type Reading = { metric: Metric; value: number; ts: number };

/** Was ein Gerät kann: Liste der Sensoren und Aktoren (Licht dimmbar? Dosierkanäle?). */
export type DeviceCaps = {
  sensors: Metric[];
  actuators: {
    type: Actuator;
    dimmable?: boolean;
    channels?: DoserChannel[];
  }[];
};

export const isMetric = (m: string): m is Metric =>
  (METRICS as readonly string[]).includes(m);
export const isActuator = (a: string): a is Actuator =>
  (ACTUATORS as readonly string[]).includes(a);
