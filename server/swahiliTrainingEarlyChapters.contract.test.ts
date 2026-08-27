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
  ["chapter-10-inventory-na-ghala.md", "16:00"],
  ["chapter-11-stock-control.md", "12:00"],
  ["chapter-12-reports.md", "08:00"],
  ["chapter-13-procurement-na-wasambazaji.md", "14:00"],
  ["chapter-14-supply-chain.md", "12:00"],
  ["chapter-15-manufacturing-na-work-orders.md", "12:00"],
  ["chapter-16-financial-management.md", "16:00"],
  ["chapter-17-accounting-na-ledger.md", "14:00"],
  ["chapter-18-payroll-na-people-operations.md", "14:00"],
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

  it("retains the privacy gates for Inventory, Stock Control, and Reports", () => {
    const inventory = readChapter("chapter-10-inventory-na-ghala.md");
    const stockControl = readChapter("chapter-11-stock-control.md");
    const reports = readChapter("chapter-12-reports.md");

    expect(inventory).toContain("Redacted Inventory orientation frame");
    expect(inventory).toContain("Inventory detail UI");
    expect(inventory).toContain("Bado haijapitishwa");
    expect(stockControl).toContain("Stock-control UI detail capture");
    expect(stockControl).toContain("Bado haijapitishwa");
    expect(reports).toContain("Reports UI capture");
    expect(reports).toContain("BADO HAIJAPITISHWA");
  });

  it("retains the procurement, supply-chain, and manufacturing evidence gates", () => {
    const procurement = readChapter("chapter-13-procurement-na-wasambazaji.md");
    const supplyChain = readChapter("chapter-14-supply-chain.md");
    const manufacturing = readChapter("chapter-15-manufacturing-na-work-orders.md");

    expect(procurement).toContain("Procurement UI capture");
    expect(procurement).toContain("Bado haijapitishwa");
    expect(supplyChain).toContain("Supply Chain/Fleet UI");
    expect(supplyChain).toContain("BADO HAIJAPITISHWA");
    expect(manufacturing).toContain("Manufacturing UI capture");
    expect(manufacturing).toContain("IMEJENGWA KWA SEHEMU");
    expect(manufacturing).toContain("imejengwa kwa sehemu");
  });

  it("retains the finance, accounting, and payroll evidence gates", () => {
    const finance = readChapter("chapter-16-financial-management.md");
    const accounting = readChapter("chapter-17-accounting-na-ledger.md");
    const payroll = readChapter("chapter-18-payroll-na-people-operations.md");

    expect(finance).toContain("Finance detail UI");
    expect(finance).toContain("Bado haijapitishwa");
    expect(finance).toContain("frame ya Finance iliyosafishwa");
    expect(accounting).toContain("Accounting UI");
    expect(accounting).toContain("Bado haijapitishwa");
    expect(accounting).toContain("haionyeshi Accounting UI");
    expect(payroll).toContain("HR/Payroll UI capture");
    expect(payroll).toContain("Bado haijapitishwa");
    expect(payroll).toContain("Hakuna HR/Payroll UI capture iliyoidhinishwa");
  });

  it("preserves Kiswahili-first terminology across Sales, POS, and CRM", () => {
    const sales = readChapter("chapter-07-sales-kutoka-mteja-hadi-ankara.md");
    const pos = readChapter("chapter-08-point-of-sale.md");
    const crm = readChapter("chapter-09-crm-na-mahusiano-ya-wateja.md");

    expect(sales).toContain("uthibitishaji wa taarifa—*validation*");
    expect(sales).toContain("Rasimu—*draft*");
    expect(sales).toContain("Mapitio—*review*");
    expect(pos).toContain("rejista ya mauzo—*register*");
    expect(pos).toContain("Ulinganifu wa rekodi—*reconciliation*");
    expect(crm).toContain("opportunity (fursa ya biashara)");
    expect(crm).toContain("follow-up (ufuatiliaji)");
    expect(crm).toContain("pipeline (mfuatano)");
  });
});
