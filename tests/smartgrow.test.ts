import { describe, expect, it } from "vitest";
import {
  decide,
  DEFAULT_AUTOMATION,
  lightPlan,
  localMinutes,
  type ControllerInput,
} from "../shared/smartgrow/controller";
import {
  targetsFor,
  vpd,
  type TentSettings,
} from "../shared/smartgrow/profiles";
import {
  clampAdjustments,
  DEFAULT_LIMITS,
  guard,
  sanitizeLimits,
  type GuardContext,
} from "../shared/smartgrow/safety";
import { SIM_START, simApply, simStep } from "../shared/smartgrow/simulator";
import type { DeviceCaps, Metric, Reading } from "../shared/smartgrow/types";

const NOW = Date.parse("2026-11-12T10:00:00Z"); // 11:00 in Berlin
const tent = (over: Partial<TentSettings> = {}): TentSettings => ({
  stage: "veg",
  medium: "soil",
  lightsOn: "06:00",
  rampMinutes: 30,
  reservoirLiters: 20,
  purpleFinish: false,
  harvestDate: null,
  timeZone: "Europe/Berlin",
  ...over,
});
const ALL: DeviceCaps["actuators"] = [
  { type: "light", dimmable: true },
  { type: "exhaust" },
  { type: "intake" },
  { type: "heater" },
  { type: "humidifier" },
  { type: "dehumidifier" },
  { type: "co2" },
  { type: "pump" },
  { type: "doser", channels: ["nutrientA", "nutrientB", "phDown", "phUp"] },
];
const rd = (
  v: Partial<Record<Metric, number>>,
  ts = NOW,
): Partial<Record<Metric, Reading>> =>
  Object.fromEntries(
    Object.entries(v).map(([m, value]) => [
      m,
      { metric: m as Metric, value: value as number, ts },
    ]),
  );
const input = (over: Partial<ControllerInput> = {}): ControllerInput => ({
  settings: tent(),
  limits: DEFAULT_LIMITS,
  automation: DEFAULT_AUTOMATION,
  caps: ALL,
  readings: rd({
    airTemp: 25,
    airRh: 62,
    co2: 900,
    soilMoisture: 50,
    waterEc: 1.3,
    waterPh: 6.5,
  }),
  state: {
    light: 65,
    exhaust: 30,
    intake: 24,
    heater: 0,
    humidifier: 0,
    dehumidifier: 0,
    co2: 0,
  },
  pumpSecondsToday: 0,
  dosedToday: {},
  now: NOW,
  ...over,
});
const find = (out: ReturnType<typeof decide>, actuator: string) =>
  out.decisions.filter((d) => d.cmd.actuator === actuator);

describe("Smart Grow – Zielwerte und Licht", () => {
  it("rechnet Ortszeit und Lichtplan mit Sonnenaufgang", () => {
    expect(localMinutes(NOW, "Europe/Berlin")).toBe(11 * 60);
    const t = targetsFor(tent());
    expect(lightPlan(tent(), t, NOW)).toMatchObject({
      isDay: true,
      phase: "day",
      level: 65,
    });
    const sunrise = lightPlan(tent({ lightsOn: "10:45" }), t, NOW); // 15 Minuten nach Licht an
    expect(sunrise.phase).toBe("sunrise");
    expect(sunrise.level).toBeGreaterThan(0);
    expect(sunrise.level).toBeLessThan(65);
    expect(
      lightPlan(
        tent({ stage: "earlyFlower", lightsOn: "20:00" }),
        targetsFor(tent({ stage: "earlyFlower" })),
        NOW,
      ).isDay,
    ).toBe(false);
  });

  it("Lila-Finish: in den letzten 2 Wochen nachts unter 15 °C", () => {
    const harvest = new Date(NOW + 7 * 86_400_000).toISOString();
    expect(
      targetsFor(
        tent({ stage: "flush", purpleFinish: true, harvestDate: harvest }),
        {},
        NOW,
      ).tempNight.max,
    ).toBeLessThan(15);
    expect(
      targetsFor(
        tent({ stage: "flush", purpleFinish: false, harvestDate: harvest }),
        {},
        NOW,
      ).tempNight.max,
    ).toBeGreaterThanOrEqual(16);
    const far = new Date(NOW + 40 * 86_400_000).toISOString();
    expect(
      targetsFor(
        tent({ stage: "lateFlower", purpleFinish: true, harvestDate: far }),
        {},
        NOW,
      ).tempNight.min,
    ).toBe(17);
  });

  it("VPD steigt mit Wärme und sinkt mit Feuchte", () => {
    expect(vpd(25, 60)).toBeGreaterThan(vpd(25, 70));
    expect(vpd(28, 60)).toBeGreaterThan(vpd(24, 60));
  });
});

describe("Smart Grow – Regler", () => {
  it("zu warm und zu feucht: mehr Abluft, Entfeuchter an, kein CO₂", () => {
    const out = decide(
      input({ readings: rd({ airTemp: 30, airRh: 78, co2: 600 }) }),
    );
    const ex = find(out, "exhaust")[0];
    expect(ex.cmd.kind === "set" && ex.cmd.value).toBeGreaterThan(60);
    expect(find(out, "dehumidifier")[0]?.cmd).toMatchObject({ value: 100 });
    expect(find(out, "co2")).toHaveLength(0);
  });

  it("zu kalt: Heizung an, Abluft runter", () => {
    const out = decide(input({ readings: rd({ airTemp: 19, airRh: 60 }) }));
    expect(find(out, "heater")[0]?.cmd).toMatchObject({ value: 100 });
    expect(find(out, "exhaust")[0]?.cmd).toMatchObject({ value: 15 });
  });

  it("CO₂ nur bei Licht, gedrosselter Abluft und unter Ziel", () => {
    const day = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, co2: 500 }),
        state: { light: 65, exhaust: 15, co2: 0 },
      }),
    );
    expect(find(day, "co2")[0]?.cmd).toMatchObject({ value: 100 });
    const night = decide(
      input({
        settings: tent({ stage: "earlyFlower", lightsOn: "20:00" }),
        readings: rd({ airTemp: 22, airRh: 60, co2: 500 }),
        state: { co2: 100, exhaust: 15 },
      }),
    );
    expect(find(night, "co2")[0]?.cmd).toMatchObject({ value: 0 });
    expect(find(night, "co2")[0]?.safety).toBe(true);
  });

  it("CO₂-Alarm: Ventil zu, Notlüftung, Alarm", () => {
    const out = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 60, co2: 3000 }),
        state: { co2: 100, exhaust: 15, intake: 12 },
      }),
    );
    expect(
      out.alerts.some((a) => a.kind === "co2-alarm" && a.level === "alarm"),
    ).toBe(true);
    expect(find(out, "co2")[0]).toMatchObject({
      cmd: { value: 0 },
      safety: true,
    });
    expect(find(out, "exhaust")[0]).toMatchObject({
      cmd: { value: 100 },
      safety: true,
    });
  });

  it("gießt bei trockenem Substrat, aber nicht bei Leck oder zu kurzem Abstand", () => {
    const dry = decide(
      input({ readings: rd({ airTemp: 25, airRh: 62, soilMoisture: 25 }) }),
    );
    expect(find(dry, "pump")[0]?.cmd).toMatchObject({
      kind: "run",
      seconds: 30,
    });
    const leak = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, soilMoisture: 25, leak: 1 }),
      }),
    );
    expect(
      find(leak, "pump").every(
        (d) => d.cmd.kind === "run" && d.cmd.seconds === 0,
      ),
    ).toBe(true);
    expect(leak.alerts.some((a) => a.kind === "leak")).toBe(true);
    const recent = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, soilMoisture: 25 }),
        lastPumpAt: NOW - 10 * 60_000,
      }),
    );
    expect(find(recent, "pump")).toHaveLength(0);
    expect(recent.blocked.some((b) => b.cmd.actuator === "pump")).toBe(true);
  });

  it("dosiert Dünger bei zu niedriger EC, danach erst nach Mischzeit pH", () => {
    const low = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, waterEc: 0.6, waterPh: 7.2 }),
      }),
    );
    const doses = find(low, "doser");
    expect(doses.map((d) => d.cmd.kind === "dose" && d.cmd.channel)).toEqual([
      "nutrientA",
      "nutrientB",
    ]);
    expect(
      doses.some((d) => d.cmd.kind === "dose" && d.cmd.channel === "phDown"),
    ).toBe(false);
    const waiting = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, waterEc: 1.3, waterPh: 7.2 }),
        lastDoseAt: NOW - 5 * 60_000,
      }),
    );
    expect(find(waiting, "doser")).toHaveLength(0);
    const ph = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, waterEc: 1.3, waterPh: 7.2 }),
        lastDoseAt: NOW - 30 * 60_000,
      }),
    );
    expect(find(ph, "doser")[0]?.cmd).toMatchObject({ channel: "phDown" });
  });

  it("in der Spülphase kein Dünger", () => {
    const out = decide(
      input({
        settings: tent({ stage: "flush" }),
        readings: rd({ airTemp: 24, airRh: 45, waterEc: 0.1 }),
      }),
    );
    expect(find(out, "doser")).toHaveLength(0);
  });

  it("ignoriert veraltete und unplausible Messwerte mit Warnung", () => {
    const out = decide(
      input({
        readings: {
          ...rd({ airRh: 60 }),
          ...rd({ airTemp: 30 }, NOW - 60 * 60_000),
          co2: { metric: "co2", value: 99999, ts: NOW },
        },
      }),
    );
    expect(out.values.airTemp).toBeUndefined();
    expect(out.values.co2).toBeUndefined();
    expect(out.alerts.map((a) => a.kind)).toEqual(
      expect.arrayContaining(["stale-airTemp", "implausible-co2"]),
    );
    expect(find(out, "heater")).toHaveLength(0);
  });
});

describe("Smart Grow – Sicherheit", () => {
  const g = (over: Partial<GuardContext> = {}): GuardContext => ({
    limits: DEFAULT_LIMITS,
    stage: "veg",
    isDay: true,
    values: { airTemp: 25, co2: 800 },
    state: {},
    caps: ALL,
    pumpSecondsToday: 0,
    dosedToday: {},
    now: NOW,
    ...over,
  });
  it("begrenzt Dosis und Tagesmenge, sperrt fehlende Kanäle", () => {
    const r = guard(
      { actuator: "doser", kind: "dose", channel: "nutrientA", ml: 500 },
      g(),
    );
    expect(r.ok && r.cmd.kind === "dose" && r.cmd.ml).toBe(
      DEFAULT_LIMITS.doseMaxMl,
    );
    expect(
      guard(
        { actuator: "doser", kind: "dose", channel: "nutrientA", ml: 5 },
        g({ dosedToday: { nutrientA: 60 } }),
      ).ok,
    ).toBe(false);
    expect(
      guard({ actuator: "doser", kind: "dose", channel: "calmag", ml: 5 }, g())
        .ok,
    ).toBe(false);
  });
  it("Nutzer-Grenzen können harte Grenzen nicht aushebeln", () => {
    const l = sanitizeLimits({ co2Max: 5000, doseMaxMl: 999, airTempMax: 80 });
    expect(l.co2Max).toBe(1500);
    expect(l.doseMaxMl).toBe(50);
    expect(l.airTempMax).toBe(38);
    expect(l.co2Alarm).toBeGreaterThan(l.co2Max);
  });
  it("KI-Anpassungen bleiben in kleinen Schritten", () => {
    const a = clampAdjustments(
      {
        tempOffset: 9,
        rhOffset: -30,
        ecTarget: { min: 3, max: 9 },
        co2Target: 4000,
      },
      "veg",
      DEFAULT_LIMITS,
    );
    expect(a.tempOffset).toBe(2);
    expect(a.rhOffset).toBe(-8);
    expect(a.ecTarget!.max).toBeLessThanOrEqual(2.0);
    expect(a.co2Target).toBe(DEFAULT_LIMITS.co2Max);
    expect(
      clampAdjustments(
        { ecTarget: { min: 1, max: 2 } },
        "drying",
        DEFAULT_LIMITS,
      ).ecTarget,
    ).toEqual({ min: 0, max: 0 });
    expect(
      clampAdjustments(
        { ecTarget: { min: 1, max: 2 } },
        "flush",
        DEFAULT_LIMITS,
      ).ecTarget!.max,
    ).toBeLessThanOrEqual(0.8);
  });
  it("Heizung nie ohne Temperatursensor, CO₂ nie ohne CO₂-Sensor", () => {
    expect(
      guard({ actuator: "heater", kind: "set", value: 100 }, g({ values: {} }))
        .ok,
    ).toBe(false);
    expect(
      guard(
        { actuator: "co2", kind: "set", value: 100 },
        g({ values: { airTemp: 25 } }),
      ).ok,
    ).toBe(false);
  });
});

describe("Smart Grow – Simulator mit Regler", () => {
  it("hält ein Simulator-Zelt über 24 h im Zielbereich", () => {
    let s = { ...SIM_START, airTemp: 30, airRh: 75 };
    let state: Record<string, number> = {
      light: 0,
      exhaust: 30,
      intake: 24,
      heater: 0,
      humidifier: 0,
      dehumidifier: 0,
      co2: 0,
    };
    let lastPumpAt: number | null = null;
    let lastDoseAt: number | null = null;
    let pumpSeconds = 0;
    const dosed: Record<string, number> = {};
    let rand = 1;
    const rng = () => {
      rand = (rand * 16807) % 2147483647;
      return rand / 2147483647;
    };
    const inRange: boolean[] = [];
    for (let min = 0; min < 24 * 60; min++) {
      const now = NOW + min * 60_000;
      const readings = rd(
        {
          airTemp: s.airTemp,
          airRh: s.airRh,
          co2: s.co2,
          soilMoisture: s.soilMoisture,
          waterEc: s.waterEc,
          waterPh: s.waterPh,
          waterLevel: s.waterLevel,
        },
        now,
      );
      const out = decide(
        input({
          readings,
          state,
          now,
          lastPumpAt,
          lastDoseAt,
          pumpSecondsToday: pumpSeconds,
          dosedToday: dosed,
        }),
      );
      for (const d of out.decisions) {
        if (d.cmd.kind === "set")
          state = { ...state, [d.cmd.actuator]: d.cmd.value };
        if (d.cmd.kind === "run" && d.cmd.seconds > 0) {
          lastPumpAt = now;
          pumpSeconds += d.cmd.seconds;
        }
        if (d.cmd.kind === "dose") {
          lastDoseAt = now;
          dosed[d.cmd.channel] = (dosed[d.cmd.channel] ?? 0) + d.cmd.ml;
        }
        s = simApply(s, d.cmd, 20);
      }
      s = simStep(s, state, 1, rng);
      if (min > 120) {
        const tr = out.isDay ? out.targets.tempDay : out.targets.tempNight;
        inRange.push(
          s.airTemp >= tr.min - 1.5 &&
            s.airTemp <= tr.max + 1.5 &&
            s.airRh <= out.targets.rh.max + 8,
        );
      }
    }
    const share = inRange.filter(Boolean).length / inRange.length;
    expect(share).toBeGreaterThan(0.85);
    expect(s.soilMoisture).toBeGreaterThan(25);
    expect(s.waterPh).toBeLessThan(6.9);
  });
});

describe("Smart Grow – Licht-Feinregelung", () => {
  it("startet nach Licht aus auf der Phasen-Stufe statt bei 3 %", () => {
    const out = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, ppfd: 0 }),
        state: { light: 0, exhaust: 30 },
      }),
    );
    expect(find(out, "light")[0]?.cmd).toMatchObject({ value: 65 });
    const tooBright = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, ppfd: 900 }),
        state: { light: 65, exhaust: 30 },
      }),
    );
    expect(find(tooBright, "light")[0]?.cmd).toMatchObject({ value: 62 });
    const floor = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 62, ppfd: 900 }),
        state: { light: 35, exhaust: 30 },
      }),
    );
    expect(
      find(floor, "light").every(
        (d) => d.cmd.kind === "set" && d.cmd.value >= 35,
      ),
    ).toBe(true);
  });
});

describe("Smart Grow – Hardware-Ratgeber", () => {
  it("nur gültige Messgrößen/Aktoren, jede Position mit Suchbegriff, Preis und Anleitung", async () => {
    const { HARDWARE_PATHS } = await import("../shared/smartgrow/hardware");
    const { isActuator, isMetric } = await import("../shared/smartgrow/types");
    expect(HARDWARE_PATHS.map((p) => p.id)).toEqual(["ha", "diy", "camera"]);
    for (const p of HARDWARE_PATHS) {
      expect(p.steps.length).toBeGreaterThanOrEqual(3);
      expect(p.safety.length).toBeGreaterThanOrEqual(1);
      for (const it of p.items) {
        expect(it.searchTerm.length).toBeGreaterThan(3);
        expect(it.price).toMatch(/€/);
        expect((it.metrics ?? []).every(isMetric)).toBe(true);
        expect((it.actuators ?? []).every(isActuator)).toBe(true);
        expect(`${it.name} ${it.searchTerm}`).not.toMatch(/samen|seed/i);
      }
    }
    // jede Messgröße und jeder Aktor ist über mindestens einen Weg abgedeckt (außer Exoten)
    const metrics = new Set(
      HARDWARE_PATHS.flatMap((p) => p.items.flatMap((i) => i.metrics ?? [])),
    );
    for (const m of [
      "airTemp",
      "airRh",
      "co2",
      "waterPh",
      "waterEc",
      "soilMoisture",
      "leak",
      "waterLevel",
    ])
      expect(metrics.has(m as never)).toBe(true);
  });
});

describe("Smart Grow – Produktempfehlungen", () => {
  it("Kategorien mit Marke, Preis, Suchbegriff; keine Samen/Konsumartikel", async () => {
    const { GROW_PRODUCTS, PRODUCT_CATEGORIES } =
      await import("../shared/smartgrow/products");
    expect(GROW_PRODUCTS.length).toBeGreaterThan(40);
    expect(PRODUCT_CATEGORIES.length).toBeGreaterThan(10);
    for (const p of GROW_PRODUCTS) {
      expect(p.searchTerm.length).toBeGreaterThan(3);
      expect(p.priceRange).toMatch(/€/);
      expect(`${p.name} ${p.searchTerm}`).not.toMatch(
        /samen|seed|bong|grinder|papers/i,
      );
    }
  });
});

describe("Smart Grow – Review-Fixes Sicherheit", () => {
  const g = (over: Partial<GuardContext> = {}): GuardContext => ({
    limits: DEFAULT_LIMITS,
    stage: "veg",
    isDay: true,
    values: { airTemp: 25 },
    state: {},
    caps: ALL,
    pumpSecondsToday: 0,
    dosedToday: {},
    now: NOW,
    ...over,
  });
  it("Pumpen-Stopp geht immer durch – auch bei Leck, Tageslimit, kurzem Abstand", () => {
    for (const over of [
      { values: { leak: 1 } },
      { pumpSecondsToday: 99999 },
      { lastPumpAt: NOW - 1000 },
      { values: { waterLevel: 1 } },
    ]) {
      const r = guard({ actuator: "pump", kind: "run", seconds: 0 }, g(over));
      expect(r).toEqual({
        ok: true,
        cmd: { actuator: "pump", kind: "run", seconds: 0 },
      });
    }
  });
  it("ausgefallener Leck-/Füllstandsensor sperrt Gießen und Dosieren", () => {
    expect(
      guard(
        { actuator: "pump", kind: "run", seconds: 30 },
        g({ missing: ["leak"] }),
      ).ok,
    ).toBe(false);
    expect(
      guard(
        { actuator: "doser", kind: "dose", channel: "phDown", ml: 1 },
        g({ missing: ["waterLevel"] }),
      ).ok,
    ).toBe(false);
  });
  it("Temperatursensor fällt aus: Heizung aus (Notfall), Regler kann sie nicht wieder einschalten", () => {
    const out = decide(
      input({
        readings: rd({ airRh: 60 }),
        state: { heater: 100, exhaust: 20 },
        sensors: ["airTemp", "airRh"],
      }),
    );
    expect(find(out, "heater")[0]).toMatchObject({
      cmd: { value: 0 },
      safety: true,
    });
    expect(find(out, "exhaust")[0]).toMatchObject({
      cmd: { value: 30 },
      safety: true,
    });
    expect(
      out.alerts.some(
        (a) => a.kind === "sensor-airTemp" && a.level === "alarm",
      ),
    ).toBe(true);
  });
  it("Notfall-Stellung bleibt gesperrt, auch wenn sie schon anliegt (kein Flattern)", () => {
    const out = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 60, co2: 3000 }),
        state: { co2: 0, exhaust: 100, intake: 100 },
      }),
    );
    expect(find(out, "exhaust")).toHaveLength(0); // keine Rücknahme auf ~30 %
    expect(find(out, "intake")).toHaveLength(0);
  });
  it("Leck: Pumpen-Stopp nur, wenn die Pumpe laufen könnte (nicht jede Minute)", () => {
    const idle = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 60, leak: 1 }),
        state: { pump: 0 },
        lastPumpAt: NOW - 5 * 3_600_000,
      }),
    );
    expect(find(idle, "pump")).toHaveLength(0);
    const busy = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 60, leak: 1 }),
        state: { pump: 0 },
        lastPumpAt: NOW - 30_000,
      }),
    );
    expect(find(busy, "pump")[0]?.cmd).toMatchObject({ seconds: 0 });
  });
  it("Rauchmelder: alles aus, keine Notlüftung, nichts darf wieder an", () => {
    const out = decide(
      input({
        readings: rd({ airTemp: 40, airRh: 50, smoke: 1 }),
        state: { light: 65, heater: 100, exhaust: 30 },
      }),
    );
    expect(out.alerts.some((a) => a.kind === "smoke")).toBe(true);
    expect(
      out.decisions
        .filter((d) => d.cmd.kind === "set")
        .every((d) => d.cmd.kind === "set" && d.cmd.value === 0),
    ).toBe(true);
    expect(
      guard(
        { actuator: "heater", kind: "set", value: 100 },
        g({ values: { airTemp: 15, smoke: 1 } }),
      ).ok,
    ).toBe(false);
  });
  it("Wasser: Zulauf bei leerem Tank, zu bei Leck; Drainwasser-EC warnt; Kalibrier-Erinnerung", () => {
    const caps = [
      ...ALL,
      { type: "waterValve" as const },
      { type: "chiller" as const },
    ];
    const low = decide(
      input({
        caps,
        readings: rd({ airTemp: 25, airRh: 60, waterLevel: 20, waterTemp: 24 }),
      }),
    );
    expect(find(low, "waterValve")[0]?.cmd).toMatchObject({ value: 100 });
    expect(find(low, "chiller")[0]?.cmd).toMatchObject({ value: 100 });
    const leak = decide(
      input({
        caps,
        readings: rd({ airTemp: 25, airRh: 60, waterLevel: 20, leak: 1 }),
        state: { waterValve: 100 },
      }),
    );
    expect(find(leak, "waterValve")[0]).toMatchObject({
      cmd: { value: 0 },
      safety: true,
    });
    const runoff = decide(
      input({
        readings: rd({ airTemp: 25, airRh: 60, waterEc: 1.2, runoffEc: 2.5 }),
        settings: tent({ probesCalibratedAt: "2026-09-01" }),
      }),
    );
    expect(runoff.alerts.map((a) => a.kind)).toEqual(
      expect.arrayContaining(["runoff-ec", "calibrate"]),
    );
  });
});

describe("Smart Grow – direkte Produktlinks", () => {
  it("ASINs haben das richtige Format und erzeugen Produktlinks mit Partner-ID", async () => {
    const { HARDWARE_PATHS } = await import("../shared/smartgrow/hardware");
    const { GROW_PRODUCTS } = await import("../shared/smartgrow/products");
    const { buildRemedyLink } = await import("../lib/affiliates");
    const asins = [
      ...HARDWARE_PATHS.flatMap((p) => p.items.map((i) => i.asin)),
      ...GROW_PRODUCTS.map((p) => p.asin),
    ].filter(Boolean) as string[];
    expect(asins.length).toBeGreaterThan(30);
    for (const a of asins) expect(a).toMatch(/^[A-Z0-9]{10}$/);
    const link = buildRemedyLink("x", "growmaster-21", asins[0]);
    expect(link.url).toBe(
      `https://www.amazon.de/dp/${asins[0]}?tag=growmaster-21`,
    );
  });
});
