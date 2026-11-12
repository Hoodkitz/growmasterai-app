/**
 * Smart Grow gegen eine echte MySQL-Datenbank (Router + Engine + Geräte-Protokoll).
 * Läuft nur mit SMARTGROW_TEST_DB, z. B. mysql://root@127.0.0.1:3307/growmaster_sg_test
 */
import { beforeAll, describe, expect, it } from "vitest";

const URL = process.env.SMARTGROW_TEST_DB;
const d = URL ? describe : describe.skip;

d("Smart Grow (Datenbank)", () => {
  let mod: {
    appRouter: typeof import("../server/routers").appRouter;
    engine: typeof import("../server/smartgrow/engine");
    api: typeof import("../server/smartgrow/device-api");
    getDb: typeof import("../server/db").getDb;
    schema: typeof import("../drizzle/schema");
  };
  const user = (id: number) =>
    ({
      id,
      openId: `sg-${id}`,
      name: "T",
      email: null,
      role: "user",
      subscriptionTier: "pro",
    }) as never;
  const caller = (id: number) =>
    mod.appRouter.createCaller({
      req: { headers: {} } as never,
      res: {} as never,
      user: user(id),
    });
  const settings = {
    stage: "veg" as const,
    medium: "soil" as const,
    lightsOn: "00:00",
    rampMinutes: 0,
    reservoirLiters: 20,
    purpleFinish: false,
    harvestDate: null,
    timeZone: "Europe/Berlin",
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { ensureSmartGrowSchema } =
      await import("../server/schema-bootstrap");
    mod = {
      appRouter: (await import("../server/routers")).appRouter,
      engine: await import("../server/smartgrow/engine"),
      api: await import("../server/smartgrow/device-api"),
      getDb: (await import("../server/db")).getDb,
      schema: await import("../drizzle/schema"),
    };
    await ensureSmartGrowSchema();
  }, 30_000);

  it("Simulator-Zelt: Autopilot regelt, Werte und Protokoll entstehen", async () => {
    const c = caller(9001);
    const { id } = await c.smartGrow.create({
      name: "Sim",
      settings,
      simulator: true,
    });
    const db = (await mod.getDb())!;
    let now = Date.now();
    for (let i = 0; i < 20; i++) {
      const [t] = await db
        .select()
        .from(mod.schema.growTents)
        .where((await import("drizzle-orm")).eq(mod.schema.growTents.id, id));
      await mod.engine.tickTent(db, t, now);
      now += 60_000;
    }
    const g = await c.smartGrow.get({ id });
    expect(g.simulated).toBe(true);
    expect(g.readings.airTemp?.value).toBeGreaterThan(10);
    expect(g.devices[0].online).toBe(true);
    expect(g.state.light).toBeGreaterThan(0); // Licht an (24-h-Fenster beginnt 00:00, veg 18 h)
    const hist = await c.smartGrow.history({
      tentId: id,
      metric: "airTemp",
      hours: 1,
    });
    expect(hist.length).toBeGreaterThan(0);
    expect((await c.smartGrow.list()).some((t) => t.id === id)).toBe(true);
    // fremder Nutzer sieht nichts
    await expect(caller(9002).smartGrow.get({ id })).rejects.toThrow(
      /nicht gefunden/,
    );
    await c.smartGrow.delete({ id });
    await expect(c.smartGrow.get({ id })).rejects.toThrow();
  }, 60_000);

  it("eigene Hardware: melden, Befehl abholen, bestätigen; Vorschläge; Sicherheitsprüfung", async () => {
    const c = caller(9003);
    const { id } = await c.smartGrow.create({ name: "Echt", settings });
    const dev = await c.smartGrow.addDevice({
      tentId: id,
      name: "ESP32",
      caps: { sensors: ["airTemp", "airRh"], actuators: [{ type: "exhaust" }] },
    });
    expect(dev.token).toMatch(/^gmd_/);
    const auth = `Bearer ${dev.token}`;
    expect(
      (await mod.api.handleReport("Bearer gmd_falsch_falsch_falsch_falsch", {}))
        .status,
    ).toBe(401);
    const r1 = await mod.api.handleReport(auth, {
      readings: { airTemp: 31, airRh: 75, co2: 500, bogus: 1 },
      state: { exhaust: 30 },
    });
    expect(r1.status).toBe(200);
    expect((r1.json as { accepted: number; ignored: number }).accepted).toBe(2); // co2 nicht angemeldet, bogus unbekannt

    // Modus "Vorschläge": Abluft-Erhöhung wird nur vorgeschlagen
    const db = (await mod.getDb())!;
    const { eq } = await import("drizzle-orm");
    const tent = async () =>
      (
        await db
          .select()
          .from(mod.schema.growTents)
          .where(eq(mod.schema.growTents.id, id))
      )[0];
    await mod.engine.tickTent(db, await tent());
    let g = await c.smartGrow.get({ id });
    expect(g.proposals.length).toBe(1);
    expect(g.proposals[0].text).toMatch(/Abluft/);
    await c.smartGrow.decide({ commandId: g.proposals[0].id, approve: true });
    const r2 = await mod.api.handleReport(auth, {
      readings: { airTemp: 31, airRh: 75 },
    });
    const cmds = (
      r2.json as { commands: { id: number; actuator: string; value: number }[] }
    ).commands;
    expect(cmds).toHaveLength(1);
    expect(cmds[0].actuator).toBe("exhaust");
    expect(cmds[0].value).toBeGreaterThan(30);
    await mod.api.handleReport(auth, { acks: [{ id: cmds[0].id, ok: true }] });
    g = await c.smartGrow.get({ id });
    expect(g.state.exhaust).toBe(cmds[0].value);
    expect(g.events.some((e) => /bestätigt/.test(e.message))).toBe(true);

    // Autopilot: direkt ausführen
    await c.smartGrow.setMode({ id, mode: "auto" });
    await mod.api.handleReport(auth, { readings: { airTemp: 22, airRh: 50 } });
    await mod.engine.tickTent(db, await tent());
    const r3 = await mod.api.handleReport(auth, {});
    expect((r3.json as { commands: unknown[] }).commands.length).toBe(1);

    // Handsteuerung: kein Dosierer angeschlossen -> Sicherheitsprüfung lehnt ab
    await expect(
      c.smartGrow.command({
        tentId: id,
        cmd: { kind: "dose", actuator: "doser", channel: "phDown", ml: 2 },
      }),
    ).rejects.toThrow(/Sicherheitsprüfung/);
    const man = await c.smartGrow.command({
      tentId: id,
      cmd: { kind: "set", actuator: "exhaust", value: 70 },
    });
    expect(man.cmd).toMatchObject({ value: 70 });

    // Token erneuern: altes Token ist ungültig
    const rot = await c.smartGrow.rotateDeviceToken({ deviceId: dev.id });
    expect((await mod.api.handleReport(auth, {})).status).toBe(401);
    expect((await mod.api.handleReport(`Bearer ${rot.token}`, {})).status).toBe(
      200,
    );
    await expect(
      caller(9004).smartGrow.removeDevice({ deviceId: dev.id }),
    ).rejects.toThrow();
    await c.smartGrow.delete({ id });
  }, 60_000);
});

d("Smart Grow – KI und Kamera (Datenbank, KI gemockt)", () => {
  it("KI-Einschätzung: begrenzt, im Vorschlags-Modus nur Vorschlag, im Autopilot übernommen", async () => {
    process.env.DATABASE_URL = URL;
    const { appRouter } = await import("../server/routers");
    const { reviewTent } = await import("../server/smartgrow/ai");
    const { tickTent } = await import("../server/smartgrow/engine");
    const { getDb } = await import("../server/db");
    const schema = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const c = appRouter.createCaller({
      req: { headers: {} } as never,
      res: {} as never,
      user: { id: 9101, role: "user" } as never,
    });
    const { id } = await c.smartGrow.create({
      name: "KI",
      settings: {
        stage: "veg",
        medium: "soil",
        lightsOn: "00:00",
        rampMinutes: 0,
        reservoirLiters: 20,
        purpleFinish: false,
        harvestDate: null,
        timeZone: "Europe/Berlin",
      },
      simulator: true,
    });
    const db = (await getDb())!;
    const tent = async () =>
      (
        await db
          .select()
          .from(schema.growTents)
          .where(eq(schema.growTents.id, id))
      )[0];
    await tickTent(db, await tent());
    await c.smartGrow.setMode({ id, mode: "assist" });
    let prompt = "";
    const llm = async (_s: string, u: string) => {
      prompt = u;
      return JSON.stringify({
        summary: "Etwas zu feucht.",
        tips: ["Abluft prüfen"],
        adjustments: { rhOffset: -30, tempOffset: 0.5 },
        adjustmentReason: "Schimmelgefahr senken",
        stageSuggestion: {
          stage: "earlyFlower",
          reason: "Pflanzen sind groß genug",
        },
      });
    };
    const r1 = await reviewTent(db, await tent(), Date.now(), { llm });
    expect(prompt).toMatch(/Messwerte letzte 24 h/);
    expect(r1?.pending?.adjustments).toEqual({ rhOffset: -8, tempOffset: 0.5 }); // auf −8 begrenzt
    expect((await tent()).adjustments).toEqual({});
    let g = await c.smartGrow.get({ id });
    expect(g.aiSummary?.stageSuggestion?.stage).toBe("earlyFlower");
    await c.smartGrow.aiDecide({ id, apply: true });
    expect((await tent()).adjustments).toEqual({
      rhOffset: -8,
      tempOffset: 0.5,
    });
    g = await c.smartGrow.get({ id });
    expect(g.targets.rh.max).toBe(62); // 70 − 8
    await c.smartGrow.resetAdjustments({ id });
    expect((await tent()).adjustments).toEqual({});
    // Autopilot: direkt übernehmen; kaputte KI-Antwort ändert nichts
    await c.smartGrow.setMode({ id, mode: "auto" });
    await reviewTent(db, await tent(), Date.now(), {
      llm: async () =>
        JSON.stringify({
          summary: "Licht etwas runter.",
          adjustments: { lightLevelOffset: -10 },
          adjustmentReason: "Blätter warm",
        }),
    });
    expect((await tent()).adjustments).toEqual({ lightLevelOffset: -10 });
    await reviewTent(db, await tent(), Date.now(), {
      llm: async () => "kein json",
    });
    expect((await tent()).adjustments).toEqual({ lightLevelOffset: -10 });
    await c.smartGrow.delete({ id });
  }, 60_000);

  it("Kamera: Gerät schickt JPEG, KI prüft, ernster Befund wird Alarm; nur JPEG, alte Bilder werden aufgeräumt", async () => {
    process.env.DATABASE_URL = URL;
    const { appRouter } = await import("../server/routers");
    const api = await import("../server/smartgrow/device-api");
    const c = appRouter.createCaller({
      req: { headers: {} } as never,
      res: {} as never,
      user: { id: 9102, role: "user" } as never,
    });
    const { id } = await c.smartGrow.create({
      name: "Cam",
      settings: {
        stage: "lateFlower",
        medium: "coco",
        lightsOn: "06:00",
        rampMinutes: 30,
        reservoirLiters: 20,
        purpleFinish: false,
        harvestDate: null,
        timeZone: "Europe/Berlin",
      },
    });
    const dev = await c.smartGrow.addDevice({
      tentId: id,
      name: "Cam",
      caps: { sensors: [], actuators: [] },
    });
    const jpeg = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      Buffer.alloc(500, 1),
    ]);
    const vision = async () =>
      JSON.stringify({
        healthy: false,
        severity: "high",
        summary: "Grauschimmel an einer Blüte.",
        issues: ["Botrytis"],
        actions: ["Befallene Blüte sofort entfernen"],
        observation: {
          stage: "flush",
          stageConfidence: 0.8,
          flowerWeek: 9,
          heightCm: 85,
          canopy: "dense",
          colors: ["dunkelgrün", "lila"],
          purple: true,
          buds: "Stempel zu 70 % braun",
          trainingTip: "Untere Blätter entfernen",
        },
      });
    expect(
      (
        await api.handleSnapshot(
          `Bearer ${dev.token}`,
          Buffer.from("nicht jpeg"),
          Date.now(),
          { vision },
        )
      ).status,
    ).toBe(415);
    const r = await api.handleSnapshot(
      `Bearer ${dev.token}`,
      jpeg,
      Date.now(),
      { vision },
    );
    expect(r.status).toBe(200);
    expect((r.json as { analyzed: boolean }).analyzed).toBe(true);
    // zweites Bild kurz danach: gespeichert, aber nicht erneut geprüft
    const r2 = await api.handleSnapshot(
      `Bearer ${dev.token}`,
      jpeg,
      Date.now() + 1000,
      { vision },
    );
    expect((r2.json as { analyzed: boolean }).analyzed).toBe(false);
    const g = await c.smartGrow.get({ id });
    expect(
      g.events.some(
        (e) => e.level === "alarm" && /Grauschimmel/.test(e.message),
      ),
    ).toBe(true);
    expect(
      g.events.some((e) =>
        /Kamera: Die Pflanzen sehen nach „Spülen/.test(e.message),
      ),
    ).toBe(true);
    expect(
      g.events.some((e) => /Kamera-Tipp: Untere Blätter/.test(e.message)),
    ).toBe(true);
    const obs = await c.smartGrow.observations({ tentId: id });
    expect(
      (obs[obs.length - 1].analysis as { observation: { heightCm: number } })
        .observation.heightCm,
    ).toBe(85);
    const img = await c.smartGrow.snapshotImage({
      id: (r.json as { id: number }).id,
    });
    expect(img.dataUri).toMatch(/^data:image\/jpeg;base64,/);
    await expect(
      appRouter
        .createCaller({
          req: { headers: {} } as never,
          res: {} as never,
          user: { id: 9103, role: "user" } as never,
        })
        .smartGrow.snapshotImage({ id: img.id }),
    ).rejects.toThrow();
    await c.smartGrow.delete({ id });
  }, 60_000);
});

d("Smart Grow – Home Assistant im Takt (Datenbank, HA gemockt)", () => {
  it("liest Sensoren, schaltet über HA, meldet Ausfall", async () => {
    process.env.DATABASE_URL = URL;
    const { appRouter } = await import("../server/routers");
    const { tickTent } = await import("../server/smartgrow/engine");
    const { encryptToken } = await import("../server/smartgrow/homeassistant");
    const { getDb } = await import("../server/db");
    const schema = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const c = appRouter.createCaller({
      req: { headers: {} } as never,
      res: {} as never,
      user: { id: 9201, role: "user" } as never,
    });
    const { id } = await c.smartGrow.create({
      name: "HA",
      settings: {
        stage: "veg",
        medium: "soil",
        lightsOn: "00:00",
        rampMinutes: 0,
        reservoirLiters: 20,
        purpleFinish: false,
        harvestDate: null,
        timeZone: "Europe/Berlin",
      },
    });
    await c.smartGrow.setMode({ id, mode: "auto" });
    const db = (await getDb())!;
    await db.insert(schema.growDevices).values({
      tentId: id,
      userId: 9201,
      name: "HA",
      kind: "homeassistant",
      state: {},
      caps: {
        sensors: ["airTemp", "airRh"],
        actuators: [{ type: "exhaust" }, { type: "dehumidifier" }],
      },
      config: {
        baseUrl: "https://ha.example",
        tokenEnc: encryptToken("tok-1234567890-abcdefghij"),
        sensors: { airTemp: "sensor.t", airRh: "sensor.h" },
        actuators: { exhaust: "fan.abluft", dehumidifier: "switch.entf" },
      },
    });
    const posts: string[] = [];
    let down = false;
    const { setHaFetchForTests } =
      await import("../server/smartgrow/homeassistant");
    setHaFetchForTests(async (url: string, init: RequestInit) => {
      if (down) return new Response("", { status: 502 });
      if (url.endsWith("/api/states"))
        return new Response(
          JSON.stringify([
            {
              entity_id: "sensor.t",
              state: "29.5",
              attributes: { unit_of_measurement: "°C" },
            },
            { entity_id: "sensor.h", state: "78", attributes: {} },
            {
              entity_id: "fan.abluft",
              state: "on",
              attributes: { percentage: 30 },
            },
            { entity_id: "switch.entf", state: "off" },
          ]),
        );
      posts.push(`${init.method} ${url}`);
      return new Response("[]");
    });
    try {
      const tent = async () =>
        (
          await db
            .select()
            .from(schema.growTents)
            .where(eq(schema.growTents.id, id))
        )[0];
      await tickTent(db, await tent());
      const g = await c.smartGrow.get({ id });
      expect(g.readings.airTemp?.value).toBe(29.5);
      expect(
        posts.some((p) => p.includes("/api/services/fan/set_percentage")),
      ).toBe(true);
      expect(
        posts.some((p) => p.includes("/api/services/switch/turn_on")),
      ).toBe(true);
      expect(g.devices[0].online).toBe(true); // HA hat geantwortet
      down = true;
      await tickTent(db, await tent(), Date.now() + 120_000);
      const g2 = await c.smartGrow.get({ id });
      expect(
        g2.events.some((e) =>
          /Home Assistant .* nicht erreichbar/.test(e.message),
        ),
      ).toBe(true);
    } finally {
      setHaFetchForTests(null);
      await c.smartGrow.delete({ id });
    }
  }, 60_000);
});
