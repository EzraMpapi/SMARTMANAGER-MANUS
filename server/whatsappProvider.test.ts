import { describe, expect, it } from "vitest";
import { assertBirdWhatsAppStatusTransition, getBirdWhatsAppProviderReadiness, requireBirdWhatsAppOutboundProvider } from "./whatsappProvider";

describe("Bird WhatsApp provider boundary", () => {
  const completeConfiguration = {
    BIRD_API_KEY: "server-only-key",
    BIRD_WEBHOOK_SIGNING_SECRET: "whsec_example",
    BIRD_WORKSPACE_ID: "workspace-1",
    BIRD_WHATSAPP_CHANNEL_ID: "channel-1",
  };

  it("keeps provider delivery inactive and never returns secrets when configuration is incomplete", () => {
    const readiness = getBirdWhatsAppProviderReadiness({ BIRD_API_KEY: "server-only-key" });
    expect(readiness).toMatchObject({ configured: false, deliveryEnabled: false });
    expect(readiness.missingConfiguration).toEqual(expect.arrayContaining(["BIRD_WEBHOOK_SIGNING_SECRET", "BIRD_WORKSPACE_ID", "BIRD_WHATSAPP_CHANNEL_ID"]));
    expect(JSON.stringify(readiness)).not.toContain("server-only-key");
  });

  it("requires an explicit enablement flag even after credentials are configured", () => {
    expect(getBirdWhatsAppProviderReadiness(completeConfiguration)).toMatchObject({ configured: true, deliveryEnabled: false });
    expect(() => requireBirdWhatsAppOutboundProvider(completeConfiguration)).toThrow(/automated delivery remains disabled/i);
  });

  it("allows only provider-confirmed lifecycle progression and does not skip acceptance", () => {
    expect(assertBirdWhatsAppStatusTransition("sending", "accepted")).toBe("accepted");
    expect(assertBirdWhatsAppStatusTransition("accepted", "sent")).toBe("sent");
    expect(() => assertBirdWhatsAppStatusTransition("sending", "delivered")).toThrow(/without a confirmed provider event/i);
    expect(() => assertBirdWhatsAppStatusTransition("via-link", "sent")).toThrow(/without a confirmed provider event/i);
  });
});
