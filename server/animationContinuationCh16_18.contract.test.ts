import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "docs/swahili-training-production");
const note = readFileSync(resolve(root, "animation-continuation-ch16-18.md"), "utf8");

const externalRoot = "/home/ubuntu/smartmanager-training-assets/ch16-18";
const videoPath = resolve(externalRoot, "finance-accounting-payroll-continuation.mp4");
const referencePath = resolve(externalRoot, "finance-accounting-payroll-continuation-reference.png");

function hasForbiddenClaim(text: string) {
  return /master video|si chapter sequence kamili|workflow evidence|product demo/i.test(text);
}

describe("Chapters 16–18 animation continuation contract", () => {
  it("records deterministic provenance and keeps the continuation external-only", () => {
    expect(note).toContain("deterministic motion graphics");
    expect(note).toContain("nje ya Git");
    expect(note).toContain("Si chapter sequence kamili");
    expect(note).toContain("AI video generation ilijaribiwa lakini haikuanza");
    expect(note).toContain("Narration, subtitles, and music remain separate");
    expect(note).not.toContain("production credentials");
    expect(note).not.toContain("customer data");
  });

  it("keeps the editorial note explicit about non-evidentiary use", () => {
    expect(hasForbiddenClaim(note)).toBe(true);
    expect(note).toContain("Approved for external editorial review only");
    expect(note).toContain("Hakuna text, logo, UI");
    expect(note).toContain("Audio: absent by design");
  });

  it("checks the external render and reference are present and bounded", () => {
    expect(existsSync(videoPath)).toBe(true);
    expect(existsSync(referencePath)).toBe(true);
    expect(statSync(videoPath).size).toBeGreaterThan(10_000);
    expect(statSync(videoPath).size).toBeLessThan(5_000_000);
    expect(statSync(referencePath).size).toBeGreaterThan(1_000);
    expect(statSync(referencePath).size).toBeLessThan(1_000_000);
  });
});
