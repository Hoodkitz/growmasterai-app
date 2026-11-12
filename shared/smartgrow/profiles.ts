/**
 * Zielwerte je Wachstumsabschnitt (Richtwerte aus der gängigen Indoor-Praxis).
 *
 * Tag = Licht an, Nacht = Licht aus. Der Regler versucht, in der Mitte des Bereichs zu bleiben;
 * die KI darf Zielwerte nur innerhalb der Sicherheitsgrenzen (safety.ts) verschieben.
 */
import type { Medium, Range, Stage } from "./types";

export type StageProfile = {
  /** Stunden Licht pro Tag */
  lightHours: number;
  /** Lichtleistung in % der Lampe (wenn kein PPFD-Sensor) */
  lightLevel: number;
  /** Ziel-PPFD, wenn ein Lichtsensor vorhanden ist */
  ppfd: Range;
  tempDay: Range;
  tempNight: Range;
  rh: Range;
  /** Dampfdruckdefizit in kPa */
  vpd: Range;
  /** CO₂-Ziel bei Licht an; 0 = keine Anreicherung */
  co2Target: number;
  /** EC des Gießwassers (mS/cm); max 0 = nur Wasser */
  ec: Range;
  /** Substratfeuchte: gießen unter min, Ziel max */
  soilMoisture: Range;
};

export const STAGE_PROFILES: Record<Stage, StageProfile> = {
  seedling: {
    lightHours: 18,
    lightLevel: 35,
    ppfd: { min: 200, max: 400 },
    tempDay: { min: 23, max: 26 },
    tempNight: { min: 20, max: 23 },
    rh: { min: 65, max: 75 },
    vpd: { min: 0.4, max: 0.8 },
    co2Target: 0,
    ec: { min: 0.4, max: 0.8 },
    soilMoisture: { min: 45, max: 65 },
  },
  veg: {
    lightHours: 18,
    lightLevel: 65,
    ppfd: { min: 400, max: 650 },
    tempDay: { min: 22, max: 28 },
    tempNight: { min: 19, max: 23 },
    rh: { min: 55, max: 70 },
    vpd: { min: 0.8, max: 1.2 },
    co2Target: 900,
    ec: { min: 1.0, max: 1.6 },
    soilMoisture: { min: 35, max: 60 },
  },
  earlyFlower: {
    lightHours: 12,
    lightLevel: 85,
    ppfd: { min: 600, max: 900 },
    tempDay: { min: 22, max: 27 },
    tempNight: { min: 18, max: 22 },
    rh: { min: 45, max: 55 },
    vpd: { min: 1.0, max: 1.5 },
    co2Target: 1100,
    ec: { min: 1.4, max: 2.0 },
    soilMoisture: { min: 35, max: 55 },
  },
  lateFlower: {
    lightHours: 12,
    lightLevel: 90,
    ppfd: { min: 650, max: 950 },
    tempDay: { min: 20, max: 26 },
    tempNight: { min: 17, max: 21 },
    rh: { min: 40, max: 50 },
    vpd: { min: 1.2, max: 1.6 },
    co2Target: 900,
    ec: { min: 1.2, max: 1.8 },
    soilMoisture: { min: 30, max: 50 },
  },
  flush: {
    lightHours: 12,
    lightLevel: 80,
    ppfd: { min: 550, max: 850 },
    tempDay: { min: 20, max: 25 },
    tempNight: { min: 16, max: 20 },
    rh: { min: 38, max: 48 },
    vpd: { min: 1.2, max: 1.6 },
    co2Target: 0,
    ec: { min: 0, max: 0.4 },
    soilMoisture: { min: 30, max: 50 },
  },
  drying: {
    // Trocknen im Zelt: dunkel, kühl, ~60 % rF, nur sanfte Luftbewegung
    lightHours: 0,
    lightLevel: 0,
    ppfd: { min: 0, max: 0 },
    tempDay: { min: 17, max: 20 },
    tempNight: { min: 17, max: 20 },
    rh: { min: 55, max: 62 },
    vpd: { min: 0.8, max: 1.0 },
    co2Target: 0,
    ec: { min: 0, max: 0 },
    soilMoisture: { min: 0, max: 0 },
  },
};

/** pH-Bereich je Substrat (Gießwasser). */
export const PH_RANGE: Record<Medium, Range> = {
  soil: { min: 6.2, max: 6.8 },
  coco: { min: 5.8, max: 6.3 },
  hydro: { min: 5.6, max: 6.1 },
};

/**
 * "Lila-Finish": In den letzten 1–2 Wochen vor der Ernte nachts unter 15 °C. Das kann bei dafür
 * veranlagten Sorten (Anthocyane) eine violette Färbung fördern – ohne Veranlagung färbt sich nichts.
 */
export const PURPLE_NIGHT: Range = { min: 12, max: 14.5 };
export const PURPLE_DAYS_BEFORE_HARVEST = 14;

export type TentSettings = {
  stage: Stage;
  medium: Medium;
  /** Licht an, "HH:MM" Ortszeit */
  lightsOn: string;
  /** eigene Lichtdauer statt Profil (z. B. Autoflower 20 h) */
  lightHoursOverride?: number | null;
  /** Dauer Sonnenaufgang/-untergang in Minuten */
  rampMinutes: number;
  /** Tankvolumen in Litern (für Dosierung) */
  reservoirLiters: number;
  purpleFinish: boolean;
  /** geplantes Erntedatum (ISO) – für Lila-Finish */
  harvestDate?: string | null;
  /** letzte Kalibrierung der pH-/EC-Sonden (ISO) – für Erinnerungen */
  probesCalibratedAt?: string | null;
  /** IANA-Zeitzone, z. B. Europe/Berlin */
  timeZone: string;
};

export type Targets = StageProfile & { ph: Range; lightHours: number };

/** KI-Anpassungen (begrenzt durch safety.clampAdjustments). */
export type Adjustments = {
  tempOffset?: number; // °C auf Tag und Nacht
  rhOffset?: number; // %-Punkte
  ecTarget?: Range | null; // eigener EC-Bereich
  lightLevelOffset?: number; // %-Punkte
  co2Target?: number | null;
};

export function targetsFor(
  t: TentSettings,
  adj: Adjustments = {},
  now = Date.now(),
): Targets {
  const p = STAGE_PROFILES[t.stage];
  const off = adj.tempOffset ?? 0;
  const rhOff = adj.rhOffset ?? 0;
  let tempNight = { min: p.tempNight.min + off, max: p.tempNight.max + off };
  if (
    t.purpleFinish &&
    t.harvestDate &&
    (t.stage === "lateFlower" || t.stage === "flush")
  ) {
    const days = (Date.parse(t.harvestDate) - now) / 86_400_000;
    if (days >= 0 && days <= PURPLE_DAYS_BEFORE_HARVEST)
      tempNight = { ...PURPLE_NIGHT };
  }
  return {
    ...p,
    lightHours: t.lightHoursOverride ?? p.lightHours,
    lightLevel: Math.max(
      0,
      Math.min(100, p.lightLevel + (adj.lightLevelOffset ?? 0)),
    ),
    tempDay: { min: p.tempDay.min + off, max: p.tempDay.max + off },
    tempNight,
    rh: { min: p.rh.min + rhOff, max: p.rh.max + rhOff },
    ec: adj.ecTarget ?? p.ec,
    co2Target: adj.co2Target ?? p.co2Target,
    ph: PH_RANGE[t.medium],
  };
}

/** Sättigungsdampfdruck (kPa) nach Tetens. */
export const svp = (tempC: number) =>
  0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));

/** Blatt-VPD in kPa: Blatttemperatur (oder Luft − 2 °C geschätzt) gegen Luftfeuchte. */
export function vpd(airTemp: number, rh: number, leafTemp?: number): number {
  const leaf = leafTemp ?? airTemp - 2;
  return Math.max(0, svp(leaf) - svp(airTemp) * (rh / 100));
}
