import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const trainingDirectory = resolve(process.cwd(), "docs/swahili-training-production");

function readTrainingFile(filename: string) {
  return readFileSync(resolve(trainingDirectory, filename), "utf8");
}

describe("Swahili terminology audit contract", () => {
  const audit = readTrainingFile("chapter-01-12-terminology-audit.md");
  const extendedAudit = readTrainingFile("chapter-01-15-terminology-audit.md");

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

  it("records a Kiswahili-first outcome for every completed chapter through Chapter 15", () => {
    for (let chapter = 1; chapter <= 15; chapter += 1) {
      expect(extendedAudit).toContain(`| ${String(chapter).padStart(2, "0")} |`);
    }
    expect(extendedAudit).toContain("Kiswahili hutangulia");
  });

  it("keeps Chapters 13–15 terminology Kiswahili-first without weakening their evidence boundaries", () => {
    expect(readTrainingFile("chapter-13-procurement-na-wasambazaji.md")).toContain("Ununuzi wa biashara—Procurement—");
    expect(readTrainingFile("chapter-14-supply-chain.md")).toContain("Mnyororo wa ugavi—Supply Chain—");
    expect(readTrainingFile("chapter-15-manufacturing-na-work-orders.md")).toContain("Uzalishaji—Manufacturing—");
    expect(extendedAudit).toContain("imejengwa kwa sehemu");
  });
});
