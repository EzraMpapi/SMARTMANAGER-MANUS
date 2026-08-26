import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const chapterSpecs = [
  ["chapter-02-maono-tatizo-na-suluhisho.md", "06:00"],
  ["chapter-03-mfumo-unavyofanya-kazi.md", "08:00"],
  ["chapter-04-architecture-na-multi-tenant.md", "12:00"],
  ["chapter-05-authentication-na-user-management.md", "10:00"],
  ["chapter-06-dashboard-ya-uongozi.md", "12:00"],
  ["chapter-07-sales-kutoka-mteja-hadi-ankara.md", "14:00"],
  ["chapter-08-point-of-sale.md", "14:00"],
  ["chapter-09-crm-na-mahusiano-ya-wateja.md", "10:00"],
] as const;

function readChapter(filename: string) {
  return readFileSync(
    resolve(
      process.cwd(),
      "docs/swahili-training-production",
      filename,
    ),
    "utf8",
  );
}

describe("Swahili early-chapter production pack contract", () => {
  it.each(chapterSpecs)(
    "%s retains its course timing and required instructional sections",
    (filename, plannedDuration) => {
      const chapter = readChapter(filename);

      expect(chapter).toContain(`**Muda wa mpango:** ${plannedDuration}`);
      expect(chapter).toContain("## Storyboard ya muda");
      expect(chapter).toContain("## Simulizi na mazungumzo ya Kiswahili");
      expect(chapter).toContain("**Ulichojifunza:**");
      expect(chapter).toContain("**Kinachofuata:**");
      expect(chapter).toContain("## Mpango wa VTT na callout");
      expect(chapter).toContain("## Asset na QA");
      expect(chapter).toContain("Mpaka wa");
    },
  );

  it("does not describe the controlled redacted UI frames as role or workflow proof", () => {
    for (const [filename] of chapterSpecs) {
      const chapter = readChapter(filename);
      expect(chapter).not.toContain("KMKM");
      expect(chapter).not.toContain("nenosiri halisi");
      expect(chapter).not.toContain("tokeni halisi");
    }
  });

  it("retains the deliberate evidence gates for Sales, POS, and CRM", () => {
    const sales = readChapter("chapter-07-sales-kutoka-mteja-hadi-ankara.md");
    const pos = readChapter("chapter-08-point-of-sale.md");
    const crm = readChapter("chapter-09-crm-na-mahusiano-ya-wateja.md");

    expect(sales).toContain("Redacted Sales orientation frame");
    expect(sales).toContain("Fresh Sales UI capture");
    expect(sales).toContain("Haijapitishwa kwa sura hii");
    expect(pos).toContain("POS UI capture");
    expect(pos).toContain("BADO HAIJAPITISHWA");
    expect(crm).toContain("CRM UI capture");
    expect(crm).toContain("BADO HAIJAPITISHWA");
  });
});
