import { describe, expect, it, vi } from "vitest";

import { filterKnowledge, type WissenEntry } from "../lib/knowledge-offline";
import { KNOWLEDGE } from "../server/knowledge";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: vi.fn(), setItem: vi.fn() },
}));

const entry = (over: Partial<WissenEntry>): WissenEntry => ({
  id: "x",
  topic: "Thripse erkennen",
  phases: ["vegetative"],
  tags: ["thripse"],
  text: "Silbrige Flecken auf den Blättern deuten auf Thripse hin.",
  videoId: "aaaaaaaaaaa",
  videoTitle: "t",
  channel: "c",
  start: 1,
  ...over,
});

describe("filterKnowledge", () => {
  const list = [
    entry({}),
    entry({
      id: "y",
      topic: "pH",
      tags: ["ph"],
      text: "Der pH-Wert im Gießwasser sollte stimmen.",
      phases: ["flowering"],
    }),
  ];

  it("requires all words, case-insensitive", () => {
    expect(filterKnowledge(list, "THRIPSE blätter").map((e) => e.id)).toEqual([
      "x",
    ]);
    expect(filterKnowledge(list, "thripse ph")).toEqual([]);
  });

  it("filters by phase and returns all for empty query", () => {
    expect(filterKnowledge(list, "", "flowering").map((e) => e.id)).toEqual([
      "y",
    ]);
    expect(filterKnowledge(list, "")).toHaveLength(2);
  });

  it("works on the real knowledge base", () => {
    expect(
      filterKnowledge(KNOWLEDGE as WissenEntry[], "trauermücken").length,
    ).toBeGreaterThan(5);
  });
});
