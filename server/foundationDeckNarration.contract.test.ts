import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const scriptPath = resolve(
  process.cwd(),
  "docs/swahili-training-production/foundation-deck-presentation-script.md",
);
const notesPath = resolve(
  process.cwd(),
  "docs/swahili-training-production/foundation-deck/slide_notes.md",
);

const narrationScript = readFileSync(scriptPath, "utf8");
const notesIndex = readFileSync(notesPath, "utf8");

describe("foundation deck narration contract", () => {
  it("keeps a slide-aligned narration segment for every visible deck page", () => {
    for (let index = 1; index <= 10; index += 1) {
      expect(narrationScript).toContain(`## Slide ${index}`);
    }
  });

  it("preserves the production and evidence boundaries in the narration", () => {
    expect(narrationScript).toMatch(/master(?: video)?[\s\S]{0,100}haija(?:kusanywa|renderiwa)/);
    expect(narrationScript).toContain("Taswira za 3D hutumiwa kufafanua dhana");
    expect(narrationScript).toContain("Frame za UI zilizofunikwa");
    expect(narrationScript).toContain("POS na CRM zina packs za script");
  });

  it("keeps the canonical script and notes index tenant-neutral", () => {
    for (const source of [narrationScript, notesIndex]) {
      expect(source).not.toContain("KMKM");
      expect(source).not.toContain("customer record");
      expect(source).not.toMatch(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
      expect(source).not.toMatch(/\bsb_(secret|publishable)_/i);
      expect(source).not.toMatch(/\b\d{9,}\b/);
    }
    expect(notesIndex).toContain("foundation-deck-presentation-script.md");
  });
});
