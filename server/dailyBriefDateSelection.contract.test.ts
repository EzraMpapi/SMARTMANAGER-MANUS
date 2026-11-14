import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("Daily Brief date selection", () => {
  it("renders an accessible native date input with a stable test hook", () => {
    expect(source).toContain('data-testid="daily-brief-date"');
    expect(source).toContain('aria-label="Select Daily Brief date"');
    expect(source).toContain('type="date"');
    expect(source).toContain("setSelectedBriefDate(event.target.value || TODAY_STR)");
  });

  it("uses the selected date for daily metrics and date-relative windows", () => {
    expect(source).toContain("const today  = selectedBriefDate;");
    expect(source).toContain("const nextSevenDays = dailyBriefDateOffset(today, 7);");
    expect(source).toContain("const nextThirtyDays = dailyBriefDateOffset(today, 30);");
    expect(source).toContain("[selectedBriefDate, invoices?.rows");
  });

  it("provides a safe reset to the current local date", () => {
    expect(source).toContain('selectedBriefDate !== TODAY_STR');
    expect(source).toContain('onClick={() => setSelectedBriefDate(TODAY_STR)}');
    expect(source).toContain(">Today</button>");
  });
});
