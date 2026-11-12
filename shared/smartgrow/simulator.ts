/**
 * Simulator-Zelt: einfache Physik, damit man den Autopiloten ohne Hardware ausprobieren kann.
 * Grob, aber mit den richtigen Richtungen: Licht heizt und lässt Pflanzen verdunsten, Abluft zieht
 * Richtung Raumklima, CO₂ wird bei Licht verbraucht, das Substrat trocknet ab.
 */
import type { Actuator, Command, Metric } from "./types";

export type SimState = Record<Exclude<Metric, "leak">, number> & {
  leak: number;
};

export const SIM_START: SimState = {
  airTemp: 22,
  airRh: 55,
  co2: 450,
  leafTemp: 21,
  waterTemp: 20,
  waterEc: 1.1,
  waterPh: 6.6,
  waterLevel: 80,
  soilMoisture: 45,
  soilEc: 1.4,
  soilPh: 6.4,
  soilTemp: 21,
  ppfd: 0,
  leak: 0,
};

const ROOM = { temp: 20, rh: 50, co2: 420 };
const approach = (v: number, target: number, rate: number) =>
  v + (target - v) * Math.min(1, rate);

export function simStep(
  s: SimState,
  act: Partial<Record<Actuator, number>>,
  minutes: number,
  rand: () => number = Math.random,
): SimState {
  const L = (act.light ?? 0) / 100;
  const ex = (act.exhaust ?? 0) / 100;
  const on = (a: Actuator) => ((act[a] ?? 0) > 0 ? 1 : 0);
  const noise = (amp: number) => (rand() - 0.5) * 2 * amp;
  const n: SimState = { ...s };
  const rate = (0.04 + 0.22 * ex) * minutes;

  const tEq = ROOM.temp + 7.5 * L + 6 * on("heater") - 7 * on("cooler");
  n.airTemp = approach(s.airTemp, tEq, rate) + noise(0.05);
  const rhEq =
    ROOM.rh + 22 * L + 22 * on("humidifier") - 20 * on("dehumidifier");
  n.airRh = Math.min(
    99,
    Math.max(15, approach(s.airRh, rhEq, rate) + noise(0.3)),
  );
  const co2Eq = on("co2") ? 1800 : ROOM.co2 - 60 * L;
  n.co2 = Math.max(
    250,
    approach(s.co2, co2Eq, (on("co2") ? 0.08 : 0) * minutes + rate) + noise(5),
  );
  n.leafTemp = n.airTemp - 1.5 + 1.2 * L + noise(0.05);
  n.ppfd = Math.max(0, Math.round(L * 950 + (L ? noise(10) : 0)));
  n.soilMoisture = Math.max(5, s.soilMoisture - (L ? 0.06 : 0.025) * minutes);
  n.soilTemp = approach(s.soilTemp, n.airTemp - 1, 0.01 * minutes);
  n.waterTemp = approach(s.waterTemp, ROOM.temp + 1, 0.005 * minutes);
  n.waterPh = Math.min(8.5, s.waterPh + 0.0015 * minutes); // Tankwasser driftet nach oben
  n.soilPh = approach(s.soilPh, n.waterPh - 0.1, 0.001 * minutes);
  return n;
}

/** Wirkung eines ausgeführten Befehls auf das Simulator-Zelt. */
export function simApply(
  s: SimState,
  cmd: Command,
  reservoirLiters: number,
  mlPerLiterPer01Ec = 0.1,
  phMlPerLiterPer01 = 0.01,
): SimState {
  const n = { ...s };
  const liters = Math.max(1, reservoirLiters);
  if (cmd.kind === "run" && cmd.seconds > 0) {
    n.soilMoisture = Math.min(80, s.soilMoisture + cmd.seconds * 0.5);
    n.waterLevel = Math.max(0, s.waterLevel - cmd.seconds * 0.08);
    n.soilEc = approach(s.soilEc, s.waterEc, 0.2);
  }
  if (cmd.kind === "dose") {
    const per = cmd.ml / liters;
    if (cmd.channel === "phDown")
      n.waterPh = s.waterPh - (per / phMlPerLiterPer01) * 0.1;
    else if (cmd.channel === "phUp")
      n.waterPh = s.waterPh + (per / phMlPerLiterPer01) * 0.1;
    else {
      // zweiteilige Dünger: jeder Teil trägt die Hälfte zur EC bei; Dünger senkt den pH leicht
      const share =
        cmd.channel === "nutrientA" || cmd.channel === "nutrientB" ? 0.5 : 1;
      n.waterEc = s.waterEc + (per / mlPerLiterPer01Ec) * 0.1 * share;
      n.waterPh = s.waterPh - per * 0.5;
    }
  }
  return n;
}
