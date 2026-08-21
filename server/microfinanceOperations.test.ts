import { describe, expect, it } from "vitest";
import { calculateMicrofinanceCreditScore, calculateMicrofinanceOverdueDays, calculateMicrofinanceRepaymentTerms, microfinanceApplicationInput, microfinanceCreditScoringSettingsInput, microfinanceEscalationSettingsInput, microfinanceProductInput } from "./microfinanceOperations";

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

  it("requires explicit valid local schedule time and bounded PAR thresholds", () => {
    const valid = microfinanceEscalationSettingsInput.safeParse({ recipientMode: "roles", roleRecipients: ["Company Administrator", "Collections Officer"], managedRecipients: [], scheduleLocalTime: "08:30", timezone: "Africa/Dar_es_Salaam", deliveryEnabled: false, par30AlertThreshold: 10, overdueAmountAlertThreshold: 0 });
    expect(valid.success).toBe(true);
    expect(microfinanceEscalationSettingsInput.safeParse({ ...valid.data, scheduleLocalTime: "25:99" }).success).toBe(false);
    expect(microfinanceEscalationSettingsInput.safeParse({ ...valid.data, roleRecipients: ["Unapproved recipient"] }).success).toBe(false);
  });
});

describe("configurable credit scoring", () => {
  const rules = microfinanceCreditScoringSettingsInput.parse({ kycWeight: 20, affordabilityWeight: 30, repaymentHistoryWeight: 20, guarantorWeight: 15, collateralWeight: 15, maxDebtServiceRatio: 40, approvalThreshold: 70, reviewThreshold: 50 });

  it("returns an eligible recommendation only when the configured score thresholds are met", () => {
    const score = calculateMicrofinanceCreditScore({ rules, kycStatus: "Verified", monthlyIncome: 1_000_000, projectedInstallment: 200_000, hasRepaymentHistory: true, hasOverdueHistory: false, requiresGuarantor: true, guarantorVerified: true, requiresCollateral: true, collateralVerified: true });
    expect(score.score).toBe(100);
    expect(score.recommendation).toBe("Eligible for approval");
    expect(score.debtServiceRatio).toBe(20);
  });

  it("recommends decline when KYC, affordability, repayment history, and security evidence fail", () => {
    const score = calculateMicrofinanceCreditScore({ rules, kycStatus: "Pending", monthlyIncome: 0, projectedInstallment: 300_000, hasRepaymentHistory: true, hasOverdueHistory: true, requiresGuarantor: true, guarantorVerified: false, requiresCollateral: true, collateralVerified: false });
    expect(score.score).toBe(0);
    expect(score.recommendation).toBe("Decline recommended");
    expect(score.debtServiceRatio).toBeNull();
  });
});
