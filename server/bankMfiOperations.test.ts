import { describe, expect, it } from "vitest";
import { allocateRepaymentCents, buildReducingBalanceSchedule } from "./bankMfiOperations";

describe("Bank & MFI financial calculations", () => {
  it("builds a reducing-balance schedule that fully amortizes principal", () => {
    const schedule = buildReducingBalanceSchedule(100_000_00, 1_800, 12);
    expect(schedule).toHaveLength(12);
    expect(schedule.every((line) => line.principalCents >= 0 && line.interestCents >= 0)).toBe(true);
    expect(schedule.reduce((sum, line) => sum + line.principalCents, 0)).toBe(100_000_00);
    expect(schedule.reduce((sum, line) => sum + line.totalCents, 0)).toBeGreaterThan(100_000_00);
  });

  it("handles zero-interest schedules without creating interest", () => {
    const schedule = buildReducingBalanceSchedule(12_000, 0, 3);
    expect(schedule.map((line) => line.interestCents)).toEqual([0, 0, 0]);
    expect(schedule.reduce((sum, line) => sum + line.principalCents, 0)).toBe(12_000);
  });

  it("allocates repayment from penalties to fees to interest to principal", () => {
    expect(allocateRepaymentCents(2_500, { penaltyCents: 500, feeCents: 600, interestCents: 700, principalCents: 2_000 })).toEqual({ penaltyCents: 500, feeCents: 600, interestCents: 700, principalCents: 700, unappliedCents: 0 });
  });

  it("rejects unsafe or non-positive money inputs", () => {
    expect(() => buildReducingBalanceSchedule(0, 1_800, 12)).toThrow();
    expect(() => allocateRepaymentCents(0, { penaltyCents: 0, feeCents: 0, interestCents: 0, principalCents: 1 })).toThrow();
  });
});
