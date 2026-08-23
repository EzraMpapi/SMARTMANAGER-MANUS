export function calculateCommunityLoan(principal: number, annualRate: number, termMonths: number, method: "Flat" | "Reducing Balance" = "Flat") {
  const p = Math.max(0, Math.round(Number(principal) || 0));
  const n = Math.max(1, Number(termMonths) || 1);
  const annual = Number(annualRate) || 0;
  const monthlyRate = annual / 100 / 12;
  if (method === "Reducing Balance" && monthlyRate > 0) {
    const payment = p * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
    const repayable = Math.max(p, Math.round(payment * n));
    return { interest: repayable - p, repayable };
  }
  const interest = Math.max(0, Math.round(p * (annual / 100) * n / 12));
  return { interest, repayable: p + interest };
}

export function splitCommunityRepayment(outstandingPrincipal: number, outstandingInterest: number, amount: number) {
  const total = Math.max(0, Number(amount) || 0);
  const interestAmount = Math.min(Math.max(0, Number(outstandingInterest) || 0), total);
  const principalAmount = Math.min(Math.max(0, Number(outstandingPrincipal) || 0), Math.max(0, total - interestAmount));
  return { interestAmount, principalAmount, penaltyAmount: Math.max(0, total - interestAmount - principalAmount) };
}

export function calculateCommunityMemberBalance(contributions: number[], savings: Array<{ amount: number; transactionType: string }>, loanDue: number) {
  const paidContributions = contributions.reduce((sum, amount) => sum + (Number(amount) || 0), 0);
  const savingsBalance = savings.reduce((sum, row) => sum + (row.transactionType === "Withdrawal" ? -1 : 1) * (Number(row.amount) || 0), 0);
  return { paidContributions, savingsBalance, loanDue: Math.max(0, Number(loanDue) || 0) };
}

export function unwrapCommunityMutationResult<T>(result: { data?: T | null; error?: unknown } | null | undefined): T {
  if (result?.error) throw result.error;
  if (result?.data == null) throw new Error("The server did not return a confirmed record.");
  return result.data;
}
