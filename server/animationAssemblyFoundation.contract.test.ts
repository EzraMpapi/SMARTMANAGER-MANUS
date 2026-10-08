import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const productionRoot = resolve(
  process.cwd(),
  "docs/swahili-training-production",
);

function readProductionDoc(filename: string) {
  return readFileSync(resolve(productionRoot, filename), "utf8");
}

describe("Chapter 01–15 animation assembly foundation contract", () => {
  it("keeps the animation plan chapter-gated and explicitly non-master", () => {
    const plan = readProductionDoc("animation-assembly-foundation-ch01-15.md");

    expect(plan).toContain("Sura 01–15");
    expect(plan).toContain("si** video master");
    expect(plan).toContain("script locked");
    expect(plan).toContain("privacy and claim QA passed");
    expect(plan).toContain("editorial approval");
    expect(plan).toContain("imejengwa kwa sehemu");
    expect(plan).not.toContain("KMKM");
    expect(plan).not.toContain("nenosiri halisi");
    expect(plan).not.toContain("tokeni halisi");
  });

  it("keeps the pilot external-only, fictional, and non-evidentiary", () => {
    const ledger = readProductionDoc("animation-asset-ledger.md");
    const validation = readProductionDoc("animation-pilot-validation.md");

    expect(ledger).toContain("/home/ubuntu/smartmanager-training-assets/ch01-15-animation-assembly-pilot.mp4");
    expect(ledger).toContain("must not be committed to Git");
    expect(ledger).toContain("Master video claim");
    expect(validation).toContain("Fictional training cast");
    expect(validation).toContain("not the Chapter 01–15 final animation file");
    expect(validation).toContain("No readable text");
  });
});
