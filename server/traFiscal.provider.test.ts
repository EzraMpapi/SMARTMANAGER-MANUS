import { describe, expect, it } from "vitest";
import { getFiscalProvider, getFiscalProviderReadiness, officialTraLinks, UnavailableFiscalProvider } from "./traFiscal";

describe("TRA fiscal provider boundary", () => {
  it("fails closed when an approved adapter is not configured", async () => {
    const provider = getFiscalProvider("production");
    const readiness = provider.getReadiness();
    const connection = await provider.checkConnection();
    const result = await provider.submitReceipt({
      companyId: "tenant-1",
      branchId: "MAIN",
      sourceType: "invoice",
      sourceId: "invoice-1",
      idempotencyKey: "idempotency-1",
      items: [{ name: "Service", quantity: 1, unitPrice: 100, taxCode: "STANDARD" }],
      grossAmount: 100,
      vatAmount: 18,
      netAmount: 82,
      tin: "TIN-REDACTED",
    });

    expect(provider).toBeInstanceOf(UnavailableFiscalProvider);
    expect(readiness.status).toBe("AWAITING_CONFIGURATION");
    expect(readiness.canSubmit).toBe(false);
    expect(connection.status).toBe("unavailable");
    expect(connection.latencyMs).toBeNull();
    expect(result.success).toBe(false);
    expect(result.receiptNumber).toBe("");
    expect(result.responseCode).toBe("OFFICIAL_ADAPTER_NOT_CONFIGURED");
    expect(result.qrInformation).toBe("");
  });

  it("does not claim that sandbox is a live official simulator", () => {
    const readiness = getFiscalProviderReadiness("sandbox");
    expect(readiness.environment).toBe("sandbox");
    expect(readiness.canSubmit).toBe(false);
    expect(readiness.reason).toMatch(/approved TRA production adapter/i);
  });

  it("keeps public official links explicit and separate from the adapter", () => {
    expect(officialTraLinks.taxpayerPortalUrl).toBe("https://taxpayerportal.tra.go.tz/");
    expect(officialTraLinks.receiptVerificationUrl).toBe("https://verify.tra.go.tz/");
  });
});
