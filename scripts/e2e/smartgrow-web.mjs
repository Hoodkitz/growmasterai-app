const pw = await import(process.env.PLAYWRIGHT_CORE); const chromium = pw.chromium ?? pw.default.chromium;
const D = process.argv[2]; const WEB = "http://localhost:8099"; const API = "http://localhost:3100";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
let ok = 0, fail = 0;
const step = async (name, fn) => { try { await fn(); ok++; console.log("OK  ", name); } catch (e) { fail++; console.log("FAIL", name, "-", e.message.split("\n")[0]); await p.screenshot({ path: `${D}/fail-${ok + fail}.png` }); } };
const see = (t, timeout = 15000) => p.getByText(t).locator("visible=true").first().waitFor({ timeout });
const vis = (id) => p.getByTestId(id).locator("visible=true").first();

await step("Anmelden + Altersabfrage + Onboarding", async () => {
  await p.goto(WEB + "/"); await p.waitForTimeout(3000);
  const r = await p.evaluate(async (API) => (await fetch(API + "/api/auth/register", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: `sg${Date.now()}@test.de`, password: "Sicher!Passwort123", name: "SG" }) })).status, API);
  if (r !== 200) throw new Error("register " + r);
  await p.goto(WEB + "/"); await p.waitForTimeout(3000);
  const age = p.getByText("Ja, ich bin 18 oder älter"); if (await age.count()) await age.click();
  await p.waitForTimeout(1000);
  const skip = p.getByText("Überspringen"); if (await skip.count()) await skip.first().click();
  await p.waitForTimeout(1500);
});
await step("Startseite zeigt Smart Grow", async () => { await see("Smart Grow"); });
await step("Smart Grow öffnen, Simulator anlegen", async () => {
  await vis("home-smartgrow").click();
  await see("Simulator ausprobieren");
  await vis("sg-sim").click();
  await vis("sg-create").click();
  await see("KI-Autopilot");
});
await step("Dashboard: Live-Werte mit Ziel und Autopilot aktiv", async () => {
  await vis("tile-airTemp").waitFor({ timeout: 15000 });
  await p.waitForFunction(() => /\d+\.\d °C/.test(document.body.innerText), null, { timeout: 30000 });
  await see("Ziel ");
  await see("Die KI regelt selbst");
});
await step("Regler-Begründungen sichtbar (Protokoll)", async () => {
  await p.getByText(/Protokoll \(/).locator("visible=true").first().click();
  await see("Simulator-Zelt angelegt");
});
await step("Modus Vorschläge", async () => {
  await vis("mode-assist").click();
  await see("Die KI schlägt vor, du bestätigst");
});
await step("Handsteuerung: Abluft 60 %", async () => {
  await p.getByText("Von Hand schalten").locator("visible=true").first().scrollIntoViewIfNeeded();
  await vis("man-exhaust-60").click();
  await p.waitForTimeout(2500);
  await see(/Abluft 60 % – von Hand/);
});
await step("KI-Einschätzung und Blattkontrolle sichtbar", async () => {
  await see("🤖 KI-Einschätzung");
  await see("📷 Kamera-Beobachtung");
  await see("Foto prüfen");
});
await step("Verlauf-Diagramm", async () => { await see(/letzte 24 h/); });
await step("Einstellungen: Lila-Finish sichtbar", async () => {
  await p.getByText("Phase & Einstellungen").locator("visible=true").first().click();
  await see("💜 Lila-Finish");
  await see("Sicherheitsgrenzen");
});
let token = "";
await step("Gerät verbinden → Token", async () => {
  await vis("add-device").scrollIntoViewIfNeeded();
  await vis("add-device").click();
  await see("Gerät verbinden");
  await vis("device-create").click();
  await vis("device-token").waitFor({ timeout: 15000 });
  token = (await vis("device-token").innerText()).trim();
  if (!token.startsWith("gmd_")) throw new Error("token " + token);
});
await step("Gerät meldet Werte über das Protokoll, holt Befehle", async () => {
  const res = await fetch(API + "/api/device/v1/report", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ readings: { airTemp: 24.2, airRh: 58 }, state: { exhaust: 30 }, firmware: "e2e 1.0" }) });
  const j = await res.json();
  if (res.status !== 200 || j.accepted !== 2 || !Array.isArray(j.commands) || !j.failsafe) throw new Error(JSON.stringify(j));
});
await step("Dashboard zeigt neues Gerät online", async () => {
  await p.getByText("Fertig", { exact: true }).locator("visible=true").first().click();
  await see("ESP32 Zelt");
  await see(/e2e 1\.0/, 25000); // Dashboard aktualisiert sich alle 15 s
});
await step("Zelt-Liste", async () => {
  await p.getByText("‹ Zelte").locator("visible=true").first().click();
  await see(/Simulator-Zelt/);
  await see("Vorschläge"); // Modus aus dem Dashboard übernommen
  await see(/Wachstum · \d+\.\d °C/);
});
await step("Hardware-Ratgeber mit Einkaufsliste und Anleitung", async () => {
  await vis("sg-hardware").click();
  await see("Hardware für Smart Grow");
  await see("Shelly Plus Plug S");
  await see("Installation Schritt für Schritt");
  await vis("hw-diy").click();
  await see("ESP32-DevKit");
  await vis("hw-shop").click();
  await see(/BioBizz/);
  await p.getByText("‹ Zurück").locator("visible=true").first().click();
});
await step("Keine JS-Laufzeitfehler", async () => { if (errs.length) throw new Error(errs.slice(0, 3).join(" | ")); });
await p.screenshot({ path: `${D}/end.png`, fullPage: true });
console.log(`\n${ok}/${ok + fail} Schritte ok`);
await b.close();
process.exit(fail ? 1 : 0);
