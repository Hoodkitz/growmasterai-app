/**
 * Regler: entscheidet aus Messwerten, Zielwerten und Gerätezustand, was zu tun ist.
 *
 * Reine Funktion (kein I/O): Der Server ruft sie jede Minute je Zelt auf; Tests rechnen dieselben
 * Fälle nach. Jede Aktion trägt eine Begründung, die die App im Protokoll zeigt.
 */
import {
  targetsFor,
  vpd as calcVpd,
  type Adjustments,
  type Targets,
  type TentSettings,
} from "./profiles";
import {
  emergency,
  guard,
  type Alert,
  type GuardContext,
  type SafetyLimits,
} from "./safety";
import {
  METRIC_INFO,
  type Actuator,
  type Command,
  type DeviceCaps,
  type DoserChannel,
  type Metric,
  type Reading,
} from "./types";

export type AutomationConfig = {
  /** Sekunden je Bewässerung */
  shotSeconds: number;
  /** ohne Feuchtesensor: alle N Stunden gießen (0 = nie automatisch) */
  scheduleEveryHours: number;
  /** ml je Liter von jedem Dünger-Teil (A und B je diese Menge), die zusammen die EC um 0,1 heben (Kalibrierung) */
  nutrientMlPerLiterPer01Ec: number;
  /** ml je Liter pH-Mittel, die den pH um 0,1 verschieben */
  phMlPerLiterPer01: number;
  /** Wartezeit nach einer Dosierung, bis neu gemessen wird (Mischen) */
  mixMinutes: number;
};

export const DEFAULT_AUTOMATION: AutomationConfig = {
  shotSeconds: 30,
  scheduleEveryHours: 0,
  nutrientMlPerLiterPer01Ec: 0.1,
  phMlPerLiterPer01: 0.01,
  mixMinutes: 20,
};

export type ControllerInput = {
  settings: TentSettings;
  adjustments?: Adjustments;
  limits: SafetyLimits;
  automation: AutomationConfig;
  /** jeweils letzter Messwert je Größe */
  readings: Partial<Record<Metric, Reading>>;
  caps: DeviceCaps["actuators"];
  /** aktueller Stand der Aktoren (0–100) */
  state: Partial<Record<Actuator, number>>;
  pumpSecondsToday: number;
  lastPumpAt?: number | null;
  dosedToday: Partial<Record<DoserChannel, number>>;
  lastDoseAt?: number | null;
  now: number;
};

export type Decision = { cmd: Command; reason: string; safety?: boolean };
export type ControllerOutput = {
  decisions: Decision[];
  blocked: { cmd: Command; reason: string }[];
  alerts: Alert[];
  targets: Targets;
  isDay: boolean;
  /** Fortschritt im Lichttag 0–1 (für die Anzeige) */
  dayProgress: number;
  vpd: number | null;
  values: Partial<Record<Metric, number>>;
};

/** Messwerte älter als das gelten als veraltet. */
export const STALE_MS = 15 * 60_000;

/** Minuten seit Mitternacht in der Zeitzone des Zelts. */
export function localMinutes(now: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Lichtplan: an/aus und Dimmstufe inkl. Sonnenauf-/untergang. */
export function lightPlan(
  settings: TentSettings,
  targets: Targets,
  now: number,
): {
  isDay: boolean;
  level: number;
  progress: number;
  phase: "sunrise" | "day" | "sunset" | "night";
} {
  const dur = Math.round(targets.lightHours * 60);
  if (dur <= 0) return { isDay: false, level: 0, progress: 0, phase: "night" };
  const [hh, mm] = settings.lightsOn.split(":").map(Number);
  const start = (hh || 0) * 60 + (mm || 0);
  const elapsed = (localMinutes(now, settings.timeZone) - start + 1440) % 1440;
  if (dur >= 1440)
    return {
      isDay: true,
      level: targets.lightLevel,
      progress: 0.5,
      phase: "day",
    };
  if (elapsed >= dur)
    return { isDay: false, level: 0, progress: 0, phase: "night" };
  const ramp = Math.min(settings.rampMinutes, Math.floor(dur / 2));
  let f = 1;
  let phase: "sunrise" | "day" | "sunset" = "day";
  if (ramp > 0 && elapsed < ramp) {
    f = (elapsed + 1) / ramp;
    phase = "sunrise";
  } else if (ramp > 0 && dur - elapsed <= ramp) {
    f = (dur - elapsed) / ramp;
    phase = "sunset";
  }
  return {
    isDay: true,
    level: Math.max(1, Math.round(targets.lightLevel * Math.min(1, f))),
    progress: elapsed / dur,
    phase,
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function decide(input: ControllerInput): ControllerOutput {
  const { settings, limits, automation: A, caps, state, now } = input;
  const targets = targetsFor(settings, input.adjustments, now);
  const alerts: Alert[] = [];

  // --- Messwerte: veraltete und unplausible verwerfen
  const values: Partial<Record<Metric, number>> = {};
  for (const [m, r] of Object.entries(input.readings) as [Metric, Reading][]) {
    if (!r) continue;
    const info = METRIC_INFO[m];
    if (now - r.ts > STALE_MS) {
      alerts.push({
        level: "warn",
        kind: `stale-${m}`,
        message: `${info.label}: seit über 15 Minuten kein Messwert – Sensor/WLAN prüfen.`,
      });
      continue;
    }
    if (!Number.isFinite(r.value) || r.value < info.min || r.value > info.max) {
      alerts.push({
        level: "warn",
        kind: `implausible-${m}`,
        message: `${info.label}: unplausibler Wert ${r.value} – Sensor prüfen.`,
      });
      continue;
    }
    values[m] = r.value;
  }

  const light = lightPlan(settings, targets, now);
  const isDay = light.isDay;
  const g: GuardContext = {
    limits,
    stage: settings.stage,
    isDay,
    values,
    state,
    caps,
    pumpSecondsToday: input.pumpSecondsToday,
    lastPumpAt: input.lastPumpAt,
    dosedToday: input.dosedToday,
    now,
  };
  const has = (a: Actuator) => caps.some((c) => c.type === a);
  const decisions: Decision[] = [];
  const blocked: { cmd: Command; reason: string }[] = [];
  const planned: Partial<Record<Actuator, number>> = {};

  // --- 1. Notfall (immer zuerst; überschreibt alles Folgende)
  const em = emergency(g);
  alerts.push(...em.alerts);
  for (const e of em.commands) {
    decisions.push({ ...e, safety: true });
    if (e.cmd.kind === "set") planned[e.cmd.actuator] = e.cmd.value;
  }
  const locked = new Set(Object.keys(planned));

  const propose = (cmd: Command, reason: string) => {
    if (cmd.kind === "set" && locked.has(cmd.actuator)) return;
    const res = guard(cmd, { ...g, state: { ...state, ...planned } });
    if (!res.ok) {
      blocked.push({ cmd, reason: res.reason });
      return;
    }
    const c = res.cmd;
    if (c.kind === "set") {
      const cur = state[c.actuator];
      planned[c.actuator] = c.value;
      // nur senden, wenn sich etwas ändert (kleine Dimm-Schritte zusammenfassen)
      if (
        cur !== undefined &&
        Math.abs(cur - c.value) < (c.actuator === "light" ? 2 : 5) &&
        (cur === 0) === (c.value === 0)
      )
        return;
    }
    decisions.push({
      cmd: c,
      reason: res.note ? `${reason} (${res.note})` : reason,
    });
  };

  // --- 2. Licht
  if (has("light")) {
    const cap = caps.find((c) => c.type === "light")!;
    let level = cap.dimmable ? light.level : isDay ? 100 : 0;
    let why = !isDay
      ? "Nachtphase – Licht aus"
      : light.phase === "sunrise"
        ? "Sonnenaufgang"
        : light.phase === "sunset"
          ? "Sonnenuntergang"
          : `Lichtphase (${targets.lightHours} h)`;
    if (
      cap.dimmable &&
      isDay &&
      light.phase === "day" &&
      values.ppfd !== undefined
    ) {
      const cur = state.light ?? level;
      if (values.ppfd > targets.ppfd.max) {
        level = Math.max(10, cur - 3);
        why = `PPFD ${Math.round(values.ppfd)} über Ziel – etwas dunkler`;
      } else if (values.ppfd < targets.ppfd.min) {
        level = Math.min(100, cur + 3);
        why = `PPFD ${Math.round(values.ppfd)} unter Ziel – etwas heller`;
      } else level = cur;
    }
    if (
      cap.dimmable &&
      isDay &&
      values.leafTemp !== undefined &&
      values.leafTemp > limits.leafTempMax
    ) {
      level = Math.max(10, Math.min(level, (state.light ?? level) - 10));
      why = `Blätter ${r1(values.leafTemp)} °C – Licht gedimmt`;
    }
    propose({ actuator: "light", kind: "set", value: level }, why);
  }

  // --- 3. Klima
  const tr = isDay ? targets.tempDay : targets.tempNight;
  const t = values.airTemp;
  const rh = values.airRh;
  const co2Wanted =
    isDay && targets.co2Target > 0 && has("co2") && values.co2 !== undefined;
  if (t !== undefined) {
    if (has("heater")) {
      if (t < tr.min)
        propose(
          { actuator: "heater", kind: "set", value: 100 },
          `${r1(t)} °C unter ${tr.min} °C – heizen`,
        );
      else if (t > tr.min + 1 && (state.heater ?? 0) > 0)
        propose(
          { actuator: "heater", kind: "set", value: 0 },
          `${r1(t)} °C erreicht – Heizung aus`,
        );
    }
    if (has("cooler")) {
      if (t > tr.max)
        propose(
          { actuator: "cooler", kind: "set", value: 100 },
          `${r1(t)} °C über ${tr.max} °C – kühlen`,
        );
      else if (t < tr.max - 1 && (state.cooler ?? 0) > 0)
        propose(
          { actuator: "cooler", kind: "set", value: 0 },
          `${r1(t)} °C – Kühlung aus`,
        );
    }
  }
  if (rh !== undefined) {
    if (has("dehumidifier")) {
      if (rh > targets.rh.max)
        propose(
          { actuator: "dehumidifier", kind: "set", value: 100 },
          `Luftfeuchte ${Math.round(rh)} % über ${targets.rh.max} % – entfeuchten`,
        );
      else if (rh < targets.rh.max - 3 && (state.dehumidifier ?? 0) > 0)
        propose(
          { actuator: "dehumidifier", kind: "set", value: 0 },
          `Luftfeuchte ${Math.round(rh)} % – Entfeuchter aus`,
        );
    }
    if (has("humidifier")) {
      if (rh < targets.rh.min)
        propose(
          { actuator: "humidifier", kind: "set", value: 100 },
          `Luftfeuchte ${Math.round(rh)} % unter ${targets.rh.min} % – befeuchten`,
        );
      else if (rh > targets.rh.min + 3 && (state.humidifier ?? 0) > 0)
        propose(
          { actuator: "humidifier", kind: "set", value: 0 },
          `Luftfeuchte ${Math.round(rh)} % – Befeuchter aus`,
        );
    }
  }
  if (has("exhaust") && (t !== undefined || rh !== undefined)) {
    const hot = t !== undefined ? Math.max(0, t - (tr.max - 0.5)) : 0;
    const wet = rh !== undefined ? Math.max(0, rh - targets.rh.max) : 0;
    const cold = t !== undefined && t < tr.min;
    let level = isDay ? 30 : 20;
    const why: string[] = [];
    if (hot > 0) {
      level += hot * 18;
      why.push(`zu warm (${r1(t!)} °C)`);
    }
    if (wet > 0) {
      level += wet * 4;
      why.push(`zu feucht (${Math.round(rh!)} %)`);
    }
    if (!hot && !wet && cold) {
      level = 15;
      why.push(`zu kalt (${r1(t!)} °C) – nur Frischluft`);
    }
    if (!hot && !wet && co2Wanted && values.co2! < targets.co2Target) {
      level = Math.min(level, 15);
      why.push("gedrosselt für CO₂");
    }
    level = Math.round(Math.min(100, Math.max(10, level)));
    propose(
      { actuator: "exhaust", kind: "set", value: level },
      why.length
        ? `Abluft ${level} %: ${why.join(", ")}`
        : `Abluft ${level} %: Grundlüftung`,
    );
    if (has("intake"))
      propose(
        { actuator: "intake", kind: "set", value: Math.round(level * 0.8) },
        `Zuluft folgt Abluft (${Math.round(level * 0.8)} %)`,
      );
  }
  if (has("circulation"))
    propose(
      { actuator: "circulation", kind: "set", value: isDay ? 60 : 35 },
      isDay ? "Umluft Tag" : "Umluft Nacht",
    );
  if (has("co2")) {
    const exhaustNow = planned.exhaust ?? state.exhaust ?? 0;
    if (
      co2Wanted &&
      values.co2! < targets.co2Target - 100 &&
      exhaustNow <= 40 &&
      (t === undefined || t <= tr.max)
    ) {
      propose(
        { actuator: "co2", kind: "set", value: 100 },
        `CO₂ ${Math.round(values.co2!)} ppm unter Ziel ${targets.co2Target} – anreichern`,
      );
    } else if (
      (state.co2 ?? 0) > 0 &&
      (!co2Wanted || values.co2! >= targets.co2Target || exhaustNow > 40)
    ) {
      propose(
        { actuator: "co2", kind: "set", value: 0 },
        !co2Wanted
          ? "CO₂ aus (Nacht/kein Ziel)"
          : exhaustNow > 40
            ? "CO₂ aus – Abluft läuft stark"
            : `CO₂ ${Math.round(values.co2!)} ppm erreicht`,
      );
    }
  }

  // --- 4. Bewässerung
  if (has("pump") && targets.soilMoisture.max > 0) {
    const sm = values.soilMoisture;
    if (sm !== undefined) {
      const veryDry = sm < targets.soilMoisture.min - 10;
      if (sm < targets.soilMoisture.min && (isDay || veryDry)) {
        propose(
          { actuator: "pump", kind: "run", seconds: A.shotSeconds },
          `Substrat ${Math.round(sm)} % unter ${targets.soilMoisture.min} % – gießen (${A.shotSeconds} s)`,
        );
      }
    } else if (A.scheduleEveryHours > 0 && isDay) {
      const due =
        !input.lastPumpAt ||
        now - input.lastPumpAt >= A.scheduleEveryHours * 3_600_000;
      if (due)
        propose(
          { actuator: "pump", kind: "run", seconds: A.shotSeconds },
          `Gießplan: alle ${A.scheduleEveryHours} h (${A.shotSeconds} s)`,
        );
    }
  }

  // --- 5. Dosierung (Tank): erst EC, dann pH; nach jeder Dosis Mischzeit abwarten
  const doser = caps.find((c) => c.type === "doser");
  const mixed =
    !input.lastDoseAt || now - input.lastDoseAt >= A.mixMinutes * 60_000;
  const liters = Math.max(1, settings.reservoirLiters);
  let dosedNutrients = false;
  if (doser && mixed && values.waterEc !== undefined) {
    const ec = values.waterEc;
    const mid = (targets.ec.min + targets.ec.max) / 2;
    if (targets.ec.max > 0 && ec < targets.ec.min) {
      // halbe Lücke schließen – vorsichtig, nachmessen, wiederholen
      const steps = ((mid - ec) / 0.1) * 0.5;
      const ml =
        Math.round(steps * A.nutrientMlPerLiterPer01Ec * liters * 10) / 10;
      const ch = doser.channels ?? [];
      const parts: DoserChannel[] =
        ch.includes("nutrientA") && ch.includes("nutrientB")
          ? ["nutrientA", "nutrientB"]
          : (settings.stage === "earlyFlower" ||
                settings.stage === "lateFlower") &&
              ch.includes("bloom")
            ? ["bloom"]
            : ch.includes("nutrientA")
              ? ["nutrientA"]
              : [];
      for (const p of parts) {
        if (ml >= 0.1) {
          propose(
            { actuator: "doser", kind: "dose", channel: p, ml },
            `EC ${ec.toFixed(2)} unter ${targets.ec.min} – ${ml} ml in ${liters} L`,
          );
          dosedNutrients = true;
        }
      }
    } else if (ec > targets.ec.max + 0.3) {
      alerts.push({
        level: "warn",
        kind: "ec-high",
        message: `EC im Tank ${ec.toFixed(2)} – deutlich über ${targets.ec.max}. Mit pH-angepasstem Wasser verdünnen.`,
      });
    }
  }
  if (doser && mixed && !dosedNutrients && values.waterPh !== undefined) {
    const ph = values.waterPh;
    const mid = (targets.ph.min + targets.ph.max) / 2;
    const ch = doser.channels ?? [];
    const amount = (diff: number) =>
      Math.round(
        (Math.abs(diff) / 0.1) * 0.5 * A.phMlPerLiterPer01 * liters * 10,
      ) / 10;
    if (ph > targets.ph.max && ch.includes("phDown")) {
      const ml = Math.max(0.1, amount(ph - mid));
      propose(
        { actuator: "doser", kind: "dose", channel: "phDown", ml },
        `pH ${ph.toFixed(2)} über ${targets.ph.max} – ${ml} ml pH minus`,
      );
    } else if (ph < targets.ph.min && ch.includes("phUp")) {
      const ml = Math.max(0.1, amount(mid - ph));
      propose(
        { actuator: "doser", kind: "dose", channel: "phUp", ml },
        `pH ${ph.toFixed(2)} unter ${targets.ph.min} – ${ml} ml pH plus`,
      );
    } else if (
      (ph > targets.ph.max + 0.5 || ph < targets.ph.min - 0.5) &&
      !ch.includes(ph > targets.ph.max ? "phDown" : "phUp")
    ) {
      alerts.push({
        level: "warn",
        kind: "ph-off",
        message: `pH im Tank ${ph.toFixed(2)} – Ziel ${targets.ph.min}–${targets.ph.max}. Bitte von Hand korrigieren.`,
      });
    }
  }
  if (
    values.soilPh !== undefined &&
    (values.soilPh < targets.ph.min - 0.6 ||
      values.soilPh > targets.ph.max + 0.6)
  ) {
    alerts.push({
      level: "warn",
      kind: "soil-ph",
      message: `pH im Substrat ${values.soilPh.toFixed(1)} – Gießwasser-pH prüfen.`,
    });
  }

  const v =
    values.airTemp !== undefined && values.airRh !== undefined
      ? Math.round(
          calcVpd(values.airTemp, values.airRh, values.leafTemp) * 100,
        ) / 100
      : null;
  return {
    decisions,
    blocked,
    alerts,
    targets,
    isDay,
    dayProgress: light.progress,
    vpd: v,
    values,
  };
}
