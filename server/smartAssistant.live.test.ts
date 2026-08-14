import { describe, expect, it } from "vitest";
import { runSmartAssistant } from "./smartAssistant";

const runLive = process.env.SMART_ASSISTANT_LIVE_TEST === "true";

describe.skipIf(!runLive)("Built-in AI Assistant live integration", () => {
  it("returns a structured response for a minimal non-sensitive prompt", async () => {
    const result = await runSmartAssistant({
      message: "Reply with a brief greeting for a business owner.",
      history: [],
      company: { name: "Smart Manager verification", currency: "TZS" },
      persona: { name: "Verification Assistant", scope: ["ai"] },
      context: { verification: true },
    });

    expect(result.source).toBe("builtin");
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.model).toBeTruthy();
  }, 20_000);
});
