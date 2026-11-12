import { describe, expect, it } from "vitest";
import {
  decryptToken,
  encryptToken,
  isPrivateAddress,
  parseHaActuator,
  parseHaValue,
  serviceFor,
  validateBaseUrl,
  readAll,
  execute,
  listEntities,
} from "../server/smartgrow/homeassistant";

const pub = async () => ["93.184.216.34"];

describe("Home-Assistant-Brücke", () => {
  it("lässt nur öffentliche https-Adressen zu (SSRF-Schutz)", async () => {
    await expect(
      validateBaseUrl("https://myha.ui.nabu.casa/", pub),
    ).resolves.toBe("https://myha.ui.nabu.casa");
    await expect(
      validateBaseUrl("http://myha.ui.nabu.casa", pub),
    ).rejects.toThrow(/https/);
    await expect(
      validateBaseUrl("https://localhost:8123", pub),
    ).rejects.toThrow(/Interne/);
    await expect(
      validateBaseUrl("https://192.168.1.10:8123", pub),
    ).rejects.toThrow(/Interne/);
    await expect(validateBaseUrl("https://[::1]/", pub)).rejects.toThrow(
      /Interne/,
    );
    await expect(
      validateBaseUrl("https://evil.example", async () => ["10.0.0.5"]),
    ).rejects.toThrow(/Interne/);
    await expect(
      validateBaseUrl("https://evil.example", async () => [
        "93.184.216.34",
        "169.254.169.254",
      ]),
    ).rejects.toThrow(/Interne/);
    await expect(
      validateBaseUrl("https://user:pw@myha.example", pub),
    ).rejects.toThrow(/Zugangsdaten/);
    expect(isPrivateAddress("100.64.1.1")).toBe(true);
    expect(isPrivateAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });

  it("verschlüsselt den Token (AES-GCM, manipulationssicher)", () => {
    const enc = encryptToken("eyJ-geheim-token-1234567890");
    expect(enc).not.toContain("geheim");
    expect(decryptToken(enc)).toBe("eyJ-geheim-token-1234567890");
    const parts = enc.split(":");
    parts[3] = Buffer.from("anders").toString("base64");
    expect(() => decryptToken(parts.join(":"))).toThrow();
  });

  it("liest Werte und Stellungen, rechnet °F um", () => {
    expect(
      parseHaValue("airTemp", {
        entity_id: "sensor.t",
        state: "77",
        attributes: { unit_of_measurement: "°F" },
      }),
    ).toBe(25);
    expect(
      parseHaValue("airRh", { entity_id: "sensor.h", state: "unavailable" }),
    ).toBeNull();
    expect(
      parseHaValue("leak", { entity_id: "binary_sensor.l", state: "on" }),
    ).toBe(1);
    expect(
      parseHaActuator({
        entity_id: "light.lamp",
        state: "on",
        attributes: { brightness: 128 },
      }),
    ).toBe(50);
    expect(
      parseHaActuator({
        entity_id: "fan.abluft",
        state: "on",
        attributes: { percentage: 40 },
      }),
    ).toBe(40);
    expect(parseHaActuator({ entity_id: "switch.heizung", state: "off" })).toBe(
      0,
    );
  });

  it("baut die richtigen Dienstaufrufe", () => {
    expect(
      serviceFor("light.lamp", { actuator: "light", kind: "set", value: 60 }),
    ).toEqual({
      path: "/api/services/light/turn_on",
      body: { entity_id: "light.lamp", brightness_pct: 60 },
    });
    expect(
      serviceFor("fan.abluft", { actuator: "exhaust", kind: "set", value: 0 })
        .path,
    ).toBe("/api/services/fan/turn_off");
    expect(
      serviceFor("switch.pumpe", { actuator: "pump", kind: "run", seconds: 30 })
        .path,
    ).toBe("/api/services/switch/turn_on");
    expect(
      serviceFor("switch.pumpe", { actuator: "pump", kind: "run", seconds: 0 })
        .path,
    ).toBe("/api/services/switch/turn_off");
  });

  it("spricht HA über die REST-API an (gemockt), keine Weiterleitungen", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const f = async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/api/states"))
        return new Response(
          JSON.stringify([
            {
              entity_id: "sensor.zelt_temp",
              state: "24.5",
              attributes: {
                unit_of_measurement: "°C",
                friendly_name: "Zelt Temperatur",
              },
            },
            {
              entity_id: "fan.abluft",
              state: "on",
              attributes: { percentage: 30 },
            },
            { entity_id: "automation.x", state: "on" },
          ]),
          { status: 200 },
        );
      return new Response("[]", { status: 200 });
    };
    const cfg = {
      baseUrl: "https://ha.example",
      tokenEnc: encryptToken("tok-1234567890-abcdefghij"),
      sensors: { airTemp: "sensor.zelt_temp" },
      actuators: { exhaust: "fan.abluft" },
    };
    const r = await readAll(cfg, f);
    expect(r.readings).toEqual([{ metric: "airTemp", value: 24.5 }]);
    expect(r.state).toEqual({ exhaust: 30 });
    await execute(cfg, { actuator: "exhaust", kind: "set", value: 70 }, f);
    const last = calls[calls.length - 1];
    expect(last.url).toBe("https://ha.example/api/services/fan/set_percentage");
    expect(last.init.redirect).toBe("manual");
    expect((last.init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok-1234567890-abcdefghij",
    );
    expect(
      (await listEntities("https://ha.example", "t", f)).map(
        (e) => e.entity_id,
      ),
    ).toEqual(["sensor.zelt_temp", "fan.abluft"]);
    await expect(
      execute(
        cfg,
        { actuator: "doser", kind: "dose", channel: "phDown", ml: 1 },
        f,
      ),
    ).rejects.toThrow(/Dosierpumpen/);
    await expect(
      listEntities(
        "https://ha.example",
        "t",
        async () =>
          new Response("", {
            status: 302,
            headers: { location: "http://10.0.0.1" },
          }),
      ),
    ).rejects.toThrow(/Weiterleitung/);
  });
});
