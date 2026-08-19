import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { parseEmailRecipients } from "./transactionalEmail";
import { calculateVatVariance, validateVatAnomalySettings } from "./traVatAnomaly";
import { canReadTenantPushDeliveryHistory } from "./notificationHistory";

describe("TRA governance controls", () => {
  it("normalizes and deduplicates scheduled report CC recipients", () => {
    expect(parseEmailRecipients("Regional@One.co.tz, regional@one.co.tz; Finance@two.co.tz", "CC")).toEqual([
      "regional@one.co.tz",
      "finance@two.co.tz",
    ]);
  });

  it("rejects invalid or oversized CC recipient lists", () => {
    expect(() => parseEmailRecipients("not-an-email", "CC")).toThrow(TRPCError);
    expect(() => parseEmailRecipients(Array.from({ length: 21 }, (_, index) => `user${index}@example.com`).join(","), "CC")).toThrow(TRPCError);
  });

  it("calculates VAT variance against the historical average", () => {
    expect(calculateVatVariance(150, 100)).toBe(50);
    expect(calculateVatVariance(90, 100)).toBe(-10);
    expect(calculateVatVariance(100, 0)).toBe(0);
  });

  it("enforces safe VAT anomaly threshold and cooldown bounds", () => {
    expect(() => validateVatAnomalySettings({ thresholdPercent: 4, cooldownMinutes: 60 })).toThrow(TRPCError);
    expect(() => validateVatAnomalySettings({ thresholdPercent: 50, cooldownMinutes: 14 })).toThrow(TRPCError);
    expect(() => validateVatAnomalySettings({ thresholdPercent: 50, cooldownMinutes: 1440 })).not.toThrow();
  });

  it("allows only tenant security administrator roles to read delivery history", () => {
    expect(canReadTenantPushDeliveryHistory("Organization Owner")).toBe(true);
    expect(canReadTenantPushDeliveryHistory("System Administrator")).toBe(true);
    expect(canReadTenantPushDeliveryHistory("Employee")).toBe(false);
    expect(canReadTenantPushDeliveryHistory("Sales Representative")).toBe(false);
  });
});
