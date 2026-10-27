// Pure scheduling logic for per-plant reminders. No native imports, so it can be unit tested;
// lib/plant-reminders.ts turns the planned events into local notifications.

export type PlantPhase = "seedling" | "vegetative" | "flowering" | "harvest";

export interface ReminderSettings {
  enabled: boolean;
  watering: boolean;
  wateringEveryDays: number;
  feeding: boolean;
  feedingEveryDays: number;
  repotCheck: boolean;
  flip: boolean;
  harvest: boolean;
  /** Local hour of day at which reminders ring. */
  hour: number;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  watering: true,
  wateringEveryDays: 3,
  feeding: false,
  feedingEveryDays: 7,
  repotCheck: true,
  flip: true,
  harvest: true,
  hour: 9,
};

export interface PlannedEvent {
  /** Stable key, e.g. "water-3". */
  key: string;
  kind: "watering" | "feeding" | "repot" | "flip" | "harvest" | "drying";
  title: string;
  body: string;
  at: Date;
}

export interface ScheduleInput {
  plantName: string;
  phase: PlantPhase;
  /** ISO date the plant was started. */
  startDate: string;
  /** ISO date flowering was started (light switched to 12/12). */
  floweringStart?: string;
  /** ISO date harvest happened. */
  harvestDate?: string;
  /** ISO timestamp of the last watering / feeding the user logged. */
  lastWatered?: string;
  lastFed?: string;
  /** Breeder's indoor flowering time text, e.g. "55–60 Tage". */
  floweringText?: string;
  settings: ReminderSettings;
  now: Date;
}

const DAY_MS = 86_400_000;
const WATERING_OCCURRENCES = 12;
const FEEDING_OCCURRENCES = 6;

/** "55–60 Tage" or "8–9 Wochen" to a range in days; null if the text has no such range. */
export function parseFloweringDays(
  text?: string | null,
): { min: number; max: number } | null {
  if (!text) return null;
  const m = /(\d+)(?:\s*[–-]\s*(\d+))?\s*(Tage|Wochen)/i.exec(text);
  if (!m) return null;
  const factor = m[3].toLowerCase() === "wochen" ? 7 : 1;
  const a = parseInt(m[1], 10) * factor;
  const b = m[2] ? parseInt(m[2], 10) * factor : a;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

function atHour(date: Date, hour: number): Date {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function parseDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** All upcoming reminders (strictly in the future) for one plant. */
export function buildPlantEvents(input: ScheduleInput): PlannedEvent[] {
  const { settings, now, plantName } = input;
  if (!settings.enabled) return [];
  const events: PlannedEvent[] = [];
  const push = (e: PlannedEvent) => {
    if (e.at.getTime() > now.getTime()) events.push(e);
  };
  const start = parseDate(input.startDate) ?? now;
  const flowerStart = parseDate(input.floweringStart);
  const harvestDate = parseDate(input.harvestDate);
  const isGrowing = input.phase !== "harvest";

  if (settings.watering && isGrowing) {
    const every = Math.max(1, Math.round(settings.wateringEveryDays));
    const base = parseDate(input.lastWatered) ?? now;
    for (let i = 1; i <= WATERING_OCCURRENCES; i++) {
      push({
        key: `water-${i}`,
        kind: "watering",
        title: `💧 ${plantName} gießen?`,
        body: "Erst prüfen: Topf anheben – ist er leicht, ist die Erde trocken. Nur dann gießen, zu viel Wasser schadet mehr als zu wenig.",
        at: atHour(addDays(base, i * every), settings.hour),
      });
    }
  }

  if (settings.feeding && isGrowing && input.phase !== "seedling") {
    const every = Math.max(1, Math.round(settings.feedingEveryDays));
    const base = parseDate(input.lastFed) ?? now;
    for (let i = 1; i <= FEEDING_OCCURRENCES; i++) {
      push({
        key: `feed-${i}`,
        kind: "feeding",
        title: `🌿 ${plantName} düngen?`,
        body: "Dünger nach Packungsangabe dosieren. Gelbe Spitzen oben deuten auf zu viel Dünger hin, Gelb von unten auf Mangel.",
        at: atHour(addDays(base, i * every), settings.hour),
      });
    }
  }

  if (
    settings.repotCheck &&
    (input.phase === "seedling" || input.phase === "vegetative")
  ) {
    for (const weeks of [2, 4, 6]) {
      push({
        key: `repot-${weeks}`,
        kind: "repot",
        title: `🪴 ${plantName}: Wurzeln prüfen`,
        body: "Ist der Topf komplett durchwurzelt (Topf leicht drücken, die Wurzeln halten die Erde)? Dann umtopfen – der neue Topf sollte rundum mind. 4–5 cm mehr Platz haben.",
        at: atHour(addDays(start, weeks * 7), settings.hour),
      });
    }
  }

  if (
    settings.flip &&
    (input.phase === "seedling" || input.phase === "vegetative")
  ) {
    push({
      key: "flip",
      kind: "flip",
      title: `🌸 ${plantName}: Blüte einleiten?`,
      body: "Photoperiodische Sorten gehen nach etwa 3–5 Wochen Wachstum in die Blüte, wenn du das Licht von 18 auf 12 Stunden stellst. Nicht für Autoflowers. Danach hier „Blüte starten“ tippen.",
      at: atHour(addDays(start, 28), settings.hour),
    });
  }

  if (settings.harvest && input.phase === "flowering" && flowerStart) {
    const days = parseFloweringDays(input.floweringText);
    if (days) {
      const marks: [string, number, string, string][] = [
        [
          "harvest-soon",
          Math.max(1, days.min - 7),
          `🔎 ${plantName}: Ernte rückt näher`,
          `Laut Hersteller dauert die Blüte ${days.min}–${days.max} Tage. Ab jetzt die Trichome mit der Lupe prüfen: klar = zu früh, milchig = guter Zeitpunkt, bernsteinfarben = Abbau beginnt.`,
        ],
        [
          "harvest-start",
          days.min,
          `✂️ ${plantName}: Erntefenster beginnt`,
          "Herstellerangabe erreicht (früheste Blütezeit). Trichome prüfen, nicht nach den Härchen gehen.",
        ],
        [
          "harvest-end",
          days.max,
          `⏰ ${plantName}: Erntefenster endet`,
          "Herstellerangabe (späteste Blütezeit) erreicht. Prüfe die Trichome und plane die Ernte, bernsteinfarbene Trichome heißen: nicht länger warten.",
        ],
      ];
      for (const [key, day, title, body] of marks) {
        push({
          key,
          kind: "harvest",
          title,
          body,
          at: atHour(addDays(flowerStart, day), settings.hour),
        });
      }
    }
  }

  if (input.phase === "harvest" && harvestDate) {
    for (const day of [7, 10, 14]) {
      push({
        key: `drying-${day}`,
        kind: "drying",
        title: `🌾 ${plantName}: Trocknung prüfen`,
        body: "Stängel-Test: Knickt der Stängel noch weich, ist es zu früh. Knackt er hörbar, kommen die Blüten vom Stängel ins Glas (dunkel und kühl lagern).",
        at: atHour(addDays(harvestDate, day), settings.hour),
      });
    }
  }

  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}
