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
