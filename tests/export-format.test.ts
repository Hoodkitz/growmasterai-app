import { describe, expect, it } from "vitest";
import { buildExpensesCsv, csvCell, escapeHtml, generateExpensesHTML } from "../lib/export-format";

const expenses = [
  { id: "1", category: "nutrients" as const, description: 'Bio, "Grow" <b>', amount: 12.5, currency: "EUR", date: new Date("2026-01-02T10:00:00Z") },
  { id: "2", category: "lights" as const, description: "LED", amount: 100, currency: "EUR", date: new Date("2026-01-05T10:00:00Z"), recurring: true },
];

describe("export-format", () => {
  it("escapes csv cells", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell(null)).toBe("");
  });
  it("builds expenses csv", () => {
    const lines = buildExpensesCsv(expenses).split("\n");
    expect(lines[0]).toBe("Date,Category,Description,Amount,Currency,Recurring");
    expect(lines[1]).toBe('2026-01-02,nutrients,"Bio, ""Grow"" <b>",12.50,EUR,no');
    expect(lines[2]).toBe("2026-01-05,lights,LED,100.00,EUR,yes");
  });
  it("escapes html and renders totals", () => {
    expect(escapeHtml("<a>&")).toBe("&lt;a&gt;&amp;");
    const html = generateExpensesHTML(expenses, "T", new Date("2026-02-01T00:00:00Z"));
    expect(html).toContain("Total: 112.50 EUR");
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>");
    expect(html.indexOf("2026-01-05")).toBeLessThan(html.indexOf("2026-01-02")); // newest first
  });
});
