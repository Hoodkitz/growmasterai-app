import { describe, it, expect } from "vitest";
import {
  KNOWLEDGE,
  isValidEntry,
  knowledgeForPhase,
  searchKnowledge,
} from "../server/knowledge";
import { normalize, tokenize } from "../server/knowledge/search";

describe("knowledge base", () => {
  it("contains only valid entries with unique ids", () => {
    expect(KNOWLEDGE.length).toBeGreaterThanOrEqual(40);
    expect(new Set(KNOWLEDGE.map((e) => e.id)).size).toBe(KNOWLEDGE.length);
    expect(KNOWLEDGE.every(isValidEntry)).toBe(true);
  });

  it("rejects malformed entries", () => {
    expect(isValidEntry({})).toBe(false);
    expect(isValidEntry({ ...KNOWLEDGE[0], videoId: "zu kurz" })).toBe(false);
    expect(isValidEntry({ ...KNOWLEDGE[0], start: -1 })).toBe(false);
    expect(isValidEntry({ ...KNOWLEDGE[0], phases: ["nonsense"] })).toBe(false);
  });

  it("normalizes umlauts and tokenizes without stopwords", () => {
    expect(normalize("Gießen Überwässerung")).toBe("giessen uberwasserung");
    expect(tokenize("Wann soll ich die Pflanze gießen?")).toEqual([
      "pflanze",
      "giessen",
    ]);
  });

  it("finds the right entry for typical coach questions", () => {
    const top = (q: string) =>
      searchKnowledge(q, { limit: 3 }).map((h) => h.entry.id);
    expect(
      top("Wann ist der richtige Erntezeitpunkt, wie erkenne ich Trichome?")[0],
    ).toContain("harvest");
    expect(
      top("Meine Blätter werden gelb von unten, Dünger?").join(" "),
    ).toContain("feed");
    expect(top("Wie keime ich Samen am besten?")[0]).toContain("germ");
    expect(
      top("Wie erkenne ich ein Männchen oder einen Zwitter?").join(" "),
    ).toContain("sex");
  });

  it("returns nothing for unrelated questions and filters by phase", () => {
    expect(searchKnowledge("Wie wird das Wetter morgen in Berlin?")).toEqual(
      [],
    );
    expect(
      knowledgeForPhase("harvest").every((e) => e.phases.includes("harvest")),
    ).toBe(true);
  });
});
