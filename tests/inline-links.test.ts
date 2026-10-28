import { describe, expect, it } from "vitest";
import {
  linkedRemedyIndexes,
  splitAnswerWithLinks,
} from "../shared/inline-links";

const remedies = [
  { name: "pH-Messgerät", purpose: "", searchTerm: "ph messgeraet" },
  { name: "Neemöl", purpose: "", searchTerm: "neemoel" },
];

describe("splitAnswerWithLinks", () => {
  it("links the first plain mention inline", () => {
    const seg = splitAnswerWithLinks(
      "Miss mit einem pH-Messgerät. Das pH-Messgerät sollte kalibriert sein.",
      remedies,
    );
    expect(seg.filter((s) => s.remedyIndex === 0)).toHaveLength(1);
    expect(seg.map((s) => s.text).join("")).toBe(
      "Miss mit einem pH-Messgerät. Das pH-Messgerät sollte kalibriert sein.",
    );
  });

  it("turns [[markers]] into links and removes the brackets", () => {
    const seg = splitAnswerWithLinks("Nimm [[Neemöl]] gegen Läuse.", remedies);
    expect(seg.map((s) => s.text).join("")).toBe("Nimm Neemöl gegen Läuse.");
    expect(linkedRemedyIndexes(seg).has(1)).toBe(true);
  });

  it("keeps unknown markers as plain text and links nothing", () => {
    const seg = splitAnswerWithLinks("Nutze [[Zauberdünger]].", remedies);
    expect(seg.map((s) => s.text).join("")).toBe("Nutze Zauberdünger.");
    expect(linkedRemedyIndexes(seg).size).toBe(0);
  });
});
