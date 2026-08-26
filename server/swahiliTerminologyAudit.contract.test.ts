import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const trainingDirectory = resolve(process.cwd(), "docs/swahili-training-production");

function readTrainingFile(filename: string) {
  return readFileSync(resolve(trainingDirectory, filename), "utf8");
}

describe("Swahili terminology audit contract", () => {
  const audit = readTrainingFile("chapter-01-12-terminology-audit.md");

  it("records a terminology outcome for each completed course chapter", () => {
    for (let chapter = 1; chapter <= 12; chapter += 1) {
      expect(audit).toContain(`| ${String(chapter).padStart(2, "0")} |`);
    }
  });

  it("preserves the Kiswahili-first corrected terms in Chapters 06 and 10–12", () => {
    expect(readTrainingFile("chapter-06-dashboard-ya-uongozi.md")).toContain("ishara—*signal*—");
    expect(readTrainingFile("chapter-10-inventory-na-ghala.md")).toContain("Kiwango cha kuagiza upya—*reorder*");
    expect(readTrainingFile("chapter-11-stock-control.md")).toContain("Idadi—*count*—");
    expect(readTrainingFile("chapter-12-reports.md")).toContain("Ripoti—*report*—");
  });

  it("preserves the course truthfulness vocabulary in the audit", () => {
    expect(audit).toContain("Kiswahili hutangulia");
    expect(audit).toContain("bado haijapitishwa");
    expect(audit).toContain("imejengwa kwa sehemu");
  });
});
