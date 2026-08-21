import { describe, expect, it } from "vitest";
import { calculateMicrofinanceOverdueDays, calculateMicrofinanceRepaymentTerms, microfinanceApplicationInput, microfinanceProductInput } from "./microfinanceOperations";

describe("microfinance lending calculations", () => {
  const product = {
    annualInterestRate: 24,
    setupFeeRate: 2,
    insuranceFeeRate: 1,
  };

  it("calculates a complete TZS repayment plan without dropping rounding value", () => {
    const terms = calculateMicrofinanceRepaymentTerms(1_000_000, product, 12, "monthly");

    expect(terms.interest).toBe(240_000);
    expect(terms.fees).toBe(30_000);
    expect(terms.totalDue).toBe(1_270_000);
    expect(terms.periods).toBe(12);
    expect(terms.installment * terms.periods + terms.remainder).toBe(terms.totalDue);
  });

  it("creates weekly period counts consistently with the selected repayment frequency", () => {
    const terms = calculateMicrofinanceRepaymentTerms(200_000, product, 3, "weekly");
    expect(terms.periods).toBe(12);
    expect(terms.totalDue).toBeGreaterThan(200_000);
  });

  it("does not mark settled scheduled balances as overdue", () => {
    const now = Date.parse("2026-08-21T12:00:00.000Z");
    expect(calculateMicrofinanceOverdueDays("2026-07-01", 0, now)).toBe(0);
    expect(calculateMicrofinanceOverdueDays("2026-07-01", 10_000, now)).toBeGreaterThanOrEqual(50);
    expect(calculateMicrofinanceOverdueDays("2026-08-30", 10_000, now)).toBe(0);
  });
});

describe("microfinance input contracts", () => {
  it("rejects product pricing outside the protected configured bounds", () => {
    const result = microfinanceProductInput.safeParse({
      name: "Working capital", code: "WC-01", minimumPrincipal: 10_000, maximumPrincipal: 500_000,
      annualInterestRate: 12, setupFeeRate: 0, insuranceFeeRate: 0, penaltyRateMonthly: 0,
      collectorCommissionRate: 0, termMinMonths: 1, termMaxMonths: 12, repaymentFrequency: "monthly",
      requiresGuarantor: false, requiresCollateral: false,
    });
    expect(result.success).toBe(true);

    const invalid = microfinanceProductInput.safeParse({ ...result.data, annualInterestRate: 201 });
    expect(invalid.success).toBe(false);
  });

  it("requires tenant-safe UUID references for every loan application relationship", () => {
    const valid = microfinanceApplicationInput.safeParse({
      borrowerId: "08e4aa40-9f52-4e39-8d25-3c61653530a2", productId: "6486cc39-bd02-41af-9b81-765d242507c5",
      principal: 100_000, termMonths: 3, repaymentFrequency: "monthly", intendedUse: "Purchase seasonal stock",
      guarantorIds: [], collateralIds: [],
    });
    expect(valid.success).toBe(true);
    expect(microfinanceApplicationInput.safeParse({ ...valid.data, borrowerId: "foreign-tenant-id" }).success).toBe(false);
  });
});
