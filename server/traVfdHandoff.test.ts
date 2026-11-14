import { describe, expect, it } from "vitest";
import { buildTraVfdEvidence, normalizeTraReceiptUrl, resolveTraVfdStatus } from "../client/src/lib/traVfdHandoff";

describe("TRA VFD handoff evidence", () => {
  it("accepts only the official HTTPS receipt verification host", () => {
    expect(normalizeTraReceiptUrl("https://verify.tra.go.tz/receipt/ABC123")).toBe("https://verify.tra.go.tz/receipt/ABC123");
    expect(normalizeTraReceiptUrl("https://evil.example/receipt/ABC123")).toBe("");
    expect(normalizeTraReceiptUrl("http://verify.tra.go.tz/receipt/ABC123")).toBe("");
  });

  it("moves from external handoff to ready-to-print only after verified evidence is captured", () => {
    expect(resolveTraVfdStatus({})).toBe("AWAITING_HANDOFF");
    expect(resolveTraVfdStatus({ submittedExternallyAt: "2026-11-14T00:00:00.000Z" })).toBe("SUBMITTED_EXTERNALLY");
    expect(resolveTraVfdStatus({ verificationCode: "ABC-123" })).toBe("VERIFICATION_CAPTURED");
    expect(resolveTraVfdStatus({ receiptUrl: "https://verify.tra.go.tz/receipt/ABC123" })).toBe("READY_TO_PRINT");
  });

  it("does not store arbitrary URLs as printable TRA evidence", () => {
    const evidence = buildTraVfdEvidence({ receiptUrl: "https://example.com/fake-receipt", verificationCode: "ABC 123" });
    expect(evidence.receiptUrl).toBeNull();
    expect(evidence.verificationCode).toBe("ABC123");
    expect(evidence.status).toBe("VERIFICATION_CAPTURED");
    expect(evidence.source).toBe("operator_confirmed_external_tra_portal");
  });
});
