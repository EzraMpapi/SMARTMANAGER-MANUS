import { describe, expect, it, vi } from "vitest";
import { DatabaseUnavailableError, isTransientDatabaseError, withDatabaseRetry } from "./db";

describe("platform database resilience", () => {
  it("recognizes transient DNS and connection failures without treating application errors as retryable", () => {
    expect(isTransientDatabaseError(new Error("getaddrinfo ENOTFOUND gateway.tidbcloud.com"))).toBe(true);
    expect(isTransientDatabaseError(new Error("connect ETIMEDOUT"))).toBe(true);
    expect(isTransientDatabaseError(new Error("Validation failed"))).toBe(false);
  });

  it("retries a transient database operation once and returns its durable result", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("EAI_AGAIN database hostname"))
      .mockResolvedValueOnce({ persisted: true });

    await expect(withDatabaseRetry(operation, "Audit write")).resolves.toEqual({ persisted: true });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("returns an explicit persistence error after a non-retryable database failure", async () => {
    await expect(withDatabaseRetry(async () => { throw new Error("invalid SQL"); }, "Audit write"))
      .rejects.toBeInstanceOf(DatabaseUnavailableError);
  });
});
