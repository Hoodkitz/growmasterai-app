/**
 * Sicherheitsschicht: harte Grenzen, die weder Regler noch KI noch Nutzerbefehle überschreiten.
 *
 * Jeder Befehl läuft durch guard(). Notfall-Aktionen (emergency) laufen in jedem Modus – auch bei
 * "Vorschläge" –, weil sie nur abschalten oder lüften und nie etwas zuführen.
 */
import { STAGE_PROFILES, type Adjustments } from "./profiles";
import type {
  Actuator,
  Command,
  DeviceCaps,
  DoserChannel,
  Metric,
  Stage,
} from "./types";

export type SafetyLimits = {
  airTempMax: number;
  airTempMin: number;
  rhMax: number;
  /** CO₂-Obergrenze für die Anreicherung */
  co2Max: number;
  /** ab hier Alarm + Notlüftung (Gefahr auch für Menschen) */
  co2Alarm: number;
  leafTempMax: number;
  waterTempMax: number;
  /** max. ml je Einzeldosis und Kanal */
  doseMaxMl: number;
  /** max. ml pro Kanal und Tag */
  doseMaxMlPerDay: number;
  /** max. Sekunden je Bewässerung */
  pumpMaxSeconds: number;
  /** max. Pumpsekunden pro Tag */
  pumpMaxSecondsPerDay: number;
  /** min. Abstand zwischen zwei Bewässerungen */
  pumpMinIntervalMin: number;
  /** Tank darunter: keine Pumpe, keine Dosierung */
  waterLevelMin: number;
};

export const DEFAULT_LIMITS: SafetyLimits = {
  airTempMax: 32,
  airTempMin: 12,
  rhMax: 80,
  co2Max: 1300,
  co2Alarm: 2500,
  leafTempMax: 31,
  waterTempMax: 26,
  doseMaxMl: 10,
  doseMaxMlPerDay: 60,
  pumpMaxSeconds: 90,
  pumpMaxSecondsPerDay: 900,
  pumpMinIntervalMin: 45,
  waterLevelMin: 10,
};

/** Was Nutzer höchstens einstellen dürfen (kein Wert darüber, egal wer fragt). */
export const HARD_LIMITS = {
  airTempMax: { min: 24, max: 38 },
  airTempMin: { min: 5, max: 20 },
  rhMax: { min: 55, max: 90 },
  co2Max: { min: 400, max: 1500 },
  co2Alarm: { min: 1500, max: 5000 },
  leafTempMax: { min: 24, max: 35 },
  waterTempMax: { min: 18, max: 30 },
  doseMaxMl: { min: 0.5, max: 50 },
  doseMaxMlPerDay: { min: 1, max: 300 },
  pumpMaxSeconds: { min: 5, max: 600 },
  pumpMaxSecondsPerDay: { min: 10, max: 3600 },
  pumpMinIntervalMin: { min: 10, max: 1440 },
  waterLevelMin: { min: 5, max: 50 },
} satisfies Record<keyof SafetyLimits, { min: number; max: number }>;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export function sanitizeLimits(
  input: Partial<SafetyLimits> | null | undefined,
): SafetyLimits {
  const out = { ...DEFAULT_LIMITS };
  for (const k of Object.keys(HARD_LIMITS) as (keyof SafetyLimits)[]) {
    const v = input?.[k];
    if (typeof v === "number" && Number.isFinite(v))
      out[k] = clamp(v, HARD_LIMITS[k].min, HARD_LIMITS[k].max);
  }
  // CO₂-Alarm muss über der Anreicherungsgrenze liegen
  if (out.co2Alarm <= out.co2Max)
    out.co2Alarm = Math.min(HARD_LIMITS.co2Alarm.max, out.co2Max + 500);
  if (out.airTempMin >= out.airTempMax - 5) out.airTempMin = out.airTempMax - 5;
  return out;
}

/** KI-Anpassungen begrenzen: kleine Schritte, nie außerhalb der Sicherheitsgrenzen. */
export function clampAdjustments(
  adj: Adjustments,
  stage: Stage,
  limits: SafetyLimits,
): Adjustments {
  const p = STAGE_PROFILES[stage];
  const out: Adjustments = {};
  if (typeof adj.tempOffset === "number")
    out.tempOffset = Math.round(clamp(adj.tempOffset, -2, 2) * 10) / 10;
  if (typeof adj.rhOffset === "number")
    out.rhOffset = Math.round(clamp(adj.rhOffset, -8, 8));
  if (typeof adj.lightLevelOffset === "number")
    out.lightLevelOffset = Math.round(clamp(adj.lightLevelOffset, -20, 15));
  if (
    adj.ecTarget &&
    Number.isFinite(adj.ecTarget.min) &&
    Number.isFinite(adj.ecTarget.max)
  ) {
    const hi = p.ec.max === 0 ? 0 : p.ec.max + 0.4;
    const min = Math.round(clamp(adj.ecTarget.min, 0, hi) * 100) / 100;
    const max = Math.round(clamp(adj.ecTarget.max, min, hi) * 100) / 100;
    out.ecTarget = { min, max };
  }
  if (typeof adj.co2Target === "number")
    out.co2Target = Math.round(clamp(adj.co2Target, 0, limits.co2Max));
  return out;
}

export type GuardContext = {
  limits: SafetyLimits;
  stage: Stage;
  isDay: boolean;
  values: Partial<Record<Metric, number>>;
  state: Partial<Record<Actuator, number>>;
  caps: DeviceCaps["actuators"];
  pumpSecondsToday: number;
  lastPumpAt?: number | null;
  dosedToday: Partial<Record<DoserChannel, number>>;
  now: number;
  /** angemeldete Sensoren, die gerade keinen gültigen Wert liefern (veraltet/unplausibel/fehlend) */
  missing?: Metric[];
};

export type GuardResult =
  | { ok: true; cmd: Command; note?: string }
  | { ok: false; reason: string };

const NUTRIENT_CHANNELS: DoserChannel[] = [
  "nutrientA",
  "nutrientB",
  "bloom",
  "calmag",
];

/** Prüft (und begrenzt) einen Befehl. Was hier nicht durchkommt, wird nie gesendet. */
export function guard(cmd: Command, g: GuardContext): GuardResult {
  const cap = g.caps.find((c) => c.type === cmd.actuator);
  if (!cap)
    return { ok: false, reason: "Kein Gerät für diesen Aktor verbunden." };
  const v = g.values;
  const L = g.limits;
  const missing = new Set(g.missing ?? []);
  // ausgefallener Leck-/Füllstandsensor zählt wie "Leck" bzw. "Tank leer" (sicher statt blind)
  const leak = (v.leak ?? 0) >= 1 || missing.has("leak");
  const tankLow =
    (v.waterLevel !== undefined && v.waterLevel < L.waterLevelMin) ||
    missing.has("waterLevel");

  // Stoppen ist immer erlaubt – gerade bei Leck oder Tageslimit
  if (cmd.kind === "run" && cmd.seconds <= 0)
    return { ok: true, cmd: { ...cmd, seconds: 0 } };

  if (cmd.kind === "set") {
    let value = clamp(Math.round(cmd.value), 0, 100);
    if (
      !cap.dimmable &&
      [
        "light",
        "heater",
        "cooler",
        "humidifier",
        "dehumidifier",
        "co2",
        "waterValve",
        "chiller",
        "airPump",
      ].includes(cmd.actuator)
    )
      value = value > 0 ? 100 : 0;
    if (value > 0) {
      if ((v.smoke ?? 0) >= 1 && cmd.actuator !== "waterValve")
        return {
          ok: false,
          reason: "Rauchmelder ausgelöst – alles bleibt aus.",
        };
      if (cmd.actuator === "waterValve") {
        if (leak)
          return { ok: false, reason: "Leck erkannt – Wasserzulauf gesperrt." };
        if (v.waterLevel === undefined)
          return { ok: false, reason: "Wasserzulauf nur mit Füllstandsensor." };
        if (v.waterLevel >= 95) return { ok: false, reason: "Tank ist voll." };
      }
      if (cmd.actuator === "co2" && (v.door ?? 0) >= 1)
        return { ok: false, reason: "Zelt-Tür offen – kein CO₂." };
      if (cmd.actuator === "co2") {
        if (!g.isDay) return { ok: false, reason: "CO₂ nur bei Licht an." };
        if (v.co2 === undefined)
          return { ok: false, reason: "Ohne CO₂-Sensor kein CO₂-Ventil." };
        if (v.co2 >= L.co2Max)
          return {
            ok: false,
            reason: `CO₂ schon bei ${Math.round(v.co2)} ppm (Grenze ${L.co2Max}).`,
          };
        if ((g.state.exhaust ?? 0) > 40)
          return {
            ok: false,
            reason: "Abluft läuft stark – CO₂ würde nur abgesaugt.",
          };
      }
      if (cmd.actuator === "heater") {
        if (v.airTemp === undefined)
          return { ok: false, reason: "Heizung nur mit Temperatursensor." };
        if (v.airTemp >= L.airTempMax - 2)
          return { ok: false, reason: "Zu warm für die Heizung." };
      }
      if (
        cmd.actuator === "humidifier" &&
        v.airRh !== undefined &&
        v.airRh >= L.rhMax
      )
        return { ok: false, reason: "Luftfeuchte schon an der Obergrenze." };
      if (
        cmd.actuator === "light" &&
        v.leafTemp !== undefined &&
        v.leafTemp > L.leafTempMax + 2
      )
        value = Math.min(value, 50);
    }
    return { ok: true, cmd: { ...cmd, value } };
  }

  if (cmd.kind === "run") {
    if (leak)
      return { ok: false, reason: "Leck erkannt – Bewässerung gesperrt." };
    if (tankLow)
      return {
        ok: false,
        reason: "Tank fast leer – Pumpe gesperrt (Trockenlauf).",
      };
    const left = L.pumpMaxSecondsPerDay - g.pumpSecondsToday;
    if (left <= 0)
      return { ok: false, reason: "Tageslimit Bewässerung erreicht." };
    if (g.lastPumpAt && g.now - g.lastPumpAt < L.pumpMinIntervalMin * 60_000)
      return { ok: false, reason: "Letzte Bewässerung ist zu kurz her." };
    const seconds = Math.round(
      clamp(cmd.seconds, 1, Math.min(L.pumpMaxSeconds, left)),
    );
    return {
      ok: true,
      cmd: { ...cmd, seconds },
      note: seconds < cmd.seconds ? "auf Sicherheitsgrenze gekürzt" : undefined,
    };
  }

  // dose
  if (!cap.channels?.includes(cmd.channel))
    return { ok: false, reason: "Dieser Dosierkanal ist nicht angeschlossen." };
  if (leak) return { ok: false, reason: "Leck erkannt – Dosierung gesperrt." };
  if (tankLow)
    return { ok: false, reason: "Tank fast leer – keine Dosierung." };
  if (
    NUTRIENT_CHANNELS.includes(cmd.channel) &&
    (g.stage === "flush" || g.stage === "drying")
  )
    return { ok: false, reason: "In der Spülphase kein Dünger." };
  const used = g.dosedToday[cmd.channel] ?? 0;
  const left = L.doseMaxMlPerDay - used;
  if (left <= 0.05)
    return { ok: false, reason: "Tageslimit für diesen Kanal erreicht." };
  const ml =
    Math.round(clamp(cmd.ml, 0.1, Math.min(L.doseMaxMl, left)) * 10) / 10;
  return {
    ok: true,
    cmd: { ...cmd, ml },
    note: ml < cmd.ml ? "auf Sicherheitsgrenze gekürzt" : undefined,
  };
}

export type Alert = {
  level: "info" | "warn" | "alarm";
  kind: string;
  message: string;
};

/** Notfall: nur abschalten/lüften. Läuft immer, auch im Modus "Vorschläge". */
export function emergency(g: GuardContext): {
  commands: { cmd: Command; reason: string }[];
  alerts: Alert[];
  /** Aktoren, die der Notfall gerade bestimmt – der Regler darf sie in diesem Takt nicht ändern */
  owned: Actuator[];
} {
  const commands: { cmd: Command; reason: string }[] = [];
  const alerts: Alert[] = [];
  const owned = new Set<Actuator>();
  const missing = new Set(g.missing ?? []);
  const has = (a: Actuator) => g.caps.some((c) => c.type === a);
  const on = (a: Actuator) => (g.state[a] ?? 0) > 0;
  const v = g.values;
  const L = g.limits;
  const set = (
    actuator: Exclude<Actuator, "pump" | "doser">,
    value: number,
    reason: string,
  ) => {
    if (!has(actuator)) return;
    owned.add(actuator);
    if ((g.state[actuator] ?? -1) !== value)
      commands.push({ cmd: { actuator, kind: "set", value }, reason });
  };

  // Ausgefallene Sensoren: alles abschalten, was ohne Messung gefährlich wäre
  if (missing.has("airTemp")) {
    alerts.push({
      level: "alarm",
      kind: "sensor-airTemp",
      message:
        "Temperatursensor liefert keine Werte – Heizung aus, Grundlüftung an. Sensor/WLAN prüfen!",
    });
    set("heater", 0, "Temperatursensor ausgefallen");
    if (has("exhaust") && (g.state.exhaust ?? 0) < 30)
      set("exhaust", 30, "Temperatursensor ausgefallen: Grundlüftung");
    else if (has("exhaust")) owned.add("exhaust");
  }
  if (missing.has("airRh")) set("humidifier", 0, "Feuchtesensor ausgefallen");
  if (missing.has("co2")) set("co2", 0, "CO₂-Sensor ausgefallen");
  if (missing.has("leak") || missing.has("waterLevel")) {
    alerts.push({
      level: "warn",
      kind: "sensor-water",
      message: `${missing.has("leak") ? "Leck-Sensor" : "Füllstandsensor"} liefert keine Werte – Bewässerung und Dosierung sind gesperrt.`,
    });
  }

  if (v.co2 !== undefined && v.co2 >= L.co2Alarm) {
    alerts.push({
      level: "alarm",
      kind: "co2-alarm",
      message: `CO₂ bei ${Math.round(v.co2)} ppm – Notlüftung. Zelt erst nach dem Lüften öffnen/betreten, Raum lüften!`,
    });
    set("co2", 0, "CO₂-Alarm");
    set("exhaust", 100, "CO₂-Alarm: Notlüftung");
    set("intake", 100, "CO₂-Alarm: Notlüftung");
  } else if (v.co2 !== undefined && v.co2 >= L.co2Max && on("co2")) {
    set("co2", 0, `CO₂ an der Grenze (${L.co2Max} ppm)`);
  }
  if (!g.isDay && on("co2")) set("co2", 0, "Licht aus – kein CO₂");

  if (v.airTemp !== undefined && v.airTemp >= L.airTempMax) {
    alerts.push({
      level: "alarm",
      kind: "overheat",
      message: `Zelt ${v.airTemp.toFixed(1)} °C – über der Grenze von ${L.airTempMax} °C. Heizung aus, Licht gedimmt, Abluft voll.`,
    });
    set("heater", 0, "Überhitzung");
    set("exhaust", 100, "Überhitzung");
    set("intake", 100, "Überhitzung");
    if (has("cooler")) set("cooler", 100, "Überhitzung");
    const light = g.caps.find((c) => c.type === "light");
    if (light && on("light"))
      set(
        "light",
        light.dimmable
          ? Math.min(50, g.state.light ?? 100)
          : (g.state.light ?? 100),
        "Überhitzung: Licht gedimmt",
      );
  }
  if (v.airTemp !== undefined && v.airTemp <= L.airTempMin) {
    alerts.push({
      level: "warn",
      kind: "cold",
      message: `Zelt nur ${v.airTemp.toFixed(1)} °C – unter ${L.airTempMin} °C.`,
    });
    set("cooler", 0, "Zu kalt");
  }
  if (v.airRh !== undefined && v.airRh >= L.rhMax) {
    alerts.push({
      level: "warn",
      kind: "humid",
      message: `Luftfeuchte ${Math.round(v.airRh)} % – Schimmelgefahr.`,
    });
    set("humidifier", 0, "Luftfeuchte zu hoch");
  }
  if ((v.leak ?? 0) >= 1) {
    alerts.push({
      level: "alarm",
      kind: "leak",
      message:
        "Wasser am Boden erkannt! Bewässerung und Dosierung sind gesperrt – bitte nachsehen.",
    });
    // Stopp nur, wenn die Pumpe läuft oder gerade ein Gießbefehl unterwegs sein kann (nicht jede Minute neu)
    const maybeRunning =
      (g.state.pump ?? 0) > 0 ||
      (!!g.lastPumpAt &&
        g.now - g.lastPumpAt < L.pumpMaxSeconds * 1000 + 3 * 60_000);
    if (has("pump") && maybeRunning)
      commands.push({
        cmd: { actuator: "pump", kind: "run", seconds: 0 },
        reason: "Leck: Pumpe stoppen",
      });
  }
  if (v.waterLevel !== undefined && v.waterLevel < L.waterLevelMin) {
    alerts.push({
      level: "warn",
      kind: "tank-empty",
      message: `Tank fast leer (${Math.round(v.waterLevel)} %). Bitte auffüllen.`,
    });
  }
  if (v.waterTemp !== undefined && v.waterTemp > L.waterTempMax) {
    alerts.push({
      level: "warn",
      kind: "water-warm",
      message: `Wasser ${v.waterTemp.toFixed(1)} °C – zu warm, Sauerstoffmangel/Wurzelfäule möglich.`,
    });
  }
  if (v.leafTemp !== undefined && v.leafTemp > L.leafTempMax) {
    alerts.push({
      level: "warn",
      kind: "leaf-hot",
      message: `Blätter ${v.leafTemp.toFixed(1)} °C – Licht zu nah oder zu stark?`,
    });
  }
  // Rauch: alles abschalten, was Wärme/Luft liefert – Strom am besten ganz trennen
  if ((v.smoke ?? 0) >= 1) {
    alerts.push({
      level: "alarm",
      kind: "smoke",
      message:
        "RAUCHMELDER im Zelt ausgelöst! Licht, Heizung, Lüfter und CO₂ werden abgeschaltet. Sofort nachsehen, Strom trennen, im Notfall 112.",
    });
    for (const a of [
      "light",
      "heater",
      "co2",
      "humidifier",
      "dehumidifier",
      "cooler",
      "exhaust",
      "intake",
      "circulation",
      "chiller",
      "airPump",
    ] as const) {
      if (has(a) && (g.state[a] ?? 1) !== 0)
        commands.push({
          cmd: { actuator: a, kind: "set", value: 0 },
          reason: "Rauchmelder: Notabschaltung",
        });
    }
  }
  if ((v.leak ?? 0) >= 1 && has("waterValve") && on("waterValve")) {
    commands.push({
      cmd: { actuator: "waterValve", kind: "set", value: 0 },
      reason: "Leck: Wasserzulauf zu",
    });
  }
  if (
    v.waterLevel !== undefined &&
    v.waterLevel >= 95 &&
    has("waterValve") &&
    on("waterValve")
  ) {
    commands.push({
      cmd: { actuator: "waterValve", kind: "set", value: 0 },
      reason: "Tank voll: Zulauf zu",
    });
  }
  if ((v.door ?? 0) >= 1 && on("co2"))
    set("co2", 0, "Zelt-Tür offen – CO₂ aus");
  // bei Rauch zählen nur die Abschaltungen (z. B. keine Notlüftung wegen Hitze, die Feuer anfacht)
  if ((v.smoke ?? 0) >= 1) {
    const off = commands.filter(
      (c) => c.cmd.kind !== "set" || c.cmd.value === 0,
    );
    return { commands: off, alerts, owned: [...owned] };
  }
  return { commands, alerts, owned: [...owned] };
}
