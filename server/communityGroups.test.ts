import { describe, expect, it } from "vitest";
import { calculateCommunityLoan, calculateCommunityMemberBalance, splitCommunityRepayment } from "../client/src/lib/communityGroups";

describe("Community Groups calculations", () => {
  it("calculates flat-rate TZS loan repayment deterministically", () => {
    expect(calculateCommunityLoan(1_000_000, 12, 12, "Flat")).toEqual({ interest: 120_000, repayable: 1_120_000 });
  });

  it("calculates reducing-balance repayment without rounding away interest", () => {
    const result = calculateCommunityLoan(1_000_000, 12, 12, "Reducing Balance");
    expect(result.repayable).toBeGreaterThan(1_000_000);
    expect(result.repayable).toBeLessThan(1_120_000);
    expect(result.interest).toBeCloseTo(result.repayable - 1_000_000, 8);
  });

  it("allocates repayments to interest, then principal, then excess penalty", () => {
    expect(splitCommunityRepayment(800_000, 100_000, 950_000)).toEqual({ interestAmount: 100_000, principalAmount: 800_000, penaltyAmount: 50_000 });
  });

  it("returns member contribution, savings, and loan balances in TZS", () => {
    expect(calculateCommunityMemberBalance([10_000, 15_000], [{ amount: 50_000, transactionType: "Deposit" }, { amount: 5_000, transactionType: "Withdrawal" }], 80_000)).toEqual({ paidContributions: 25_000, savingsBalance: 45_000, loanDue: 80_000 });
  });
});
