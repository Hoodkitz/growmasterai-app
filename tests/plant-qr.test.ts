import { describe, it, expect } from "vitest";
import {
  parsePlantId,
  plantPath,
  qrMatrix,
  qrSvgMarkup,
  daysSince,
  plantLabelHtml,
} from "../lib/plant-qr";

describe("plant-qr", () => {
  it("round-trips plant ids through the link path", () => {
    const id = "abc 123/äö";
    expect(parsePlantId(`growmasterai://${plantPath(id)}`)).toBe(id);
    expect(parsePlantId("https://example.org/foo")).toBeNull();
  });

  it("creates a square QR matrix with finder patterns", () => {
    const m = qrMatrix("growmasterai://plant/xyz");
    expect(m.length).toBeGreaterThanOrEqual(21);
    expect(m.every((row) => row.length === m.length)).toBe(true);
    expect(m[0][0]).toBe(true); // top-left finder corner
    expect(qrSvgMarkup("x")).toContain("<svg");
  });

  it("counts days and escapes html in labels", () => {
    expect(daysSince("2026-10-01", new Date("2026-10-11T12:00:00Z"))).toBe(10);
    expect(daysSince("nope")).toBe(0);
    const html = plantLabelHtml({
      name: "<b>Bad</b>",
      link: "growmasterai://plant/1",
      startDate: "2026-10-01",
    });
    expect(html).not.toContain("<b>Bad</b>");
    expect(html).toContain("&lt;b&gt;");
  });
});
