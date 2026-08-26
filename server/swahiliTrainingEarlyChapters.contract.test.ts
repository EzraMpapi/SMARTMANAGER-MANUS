import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const chapterSpecs = [
  ["chapter-02-maono-tatizo-na-suluhisho.md", "06:00"],
  ["chapter-03-mfumo-unavyofanya-kazi.md", "08:00"],
  ["chapter-04-architecture-na-multi-tenant.md", "12:00"],
  ["chapter-05-authentication-na-user-management.md", "10:00"],
  ["chapter-06-dashboard-ya-uongozi.md", "12:00"],
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
});
