import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("WhatsApp Center security boundary", () => {
  it("does not persist provider credentials or send directly from the browser", () => {
    expect(dashboard).not.toContain("wa_api_token");
    expect(dashboard).not.toContain("graph.facebook.com");
    expect(dashboard).not.toContain("WhatsApp Business Cloud API");
  });

  it("renders rich-text previews as React nodes rather than unsafe HTML", () => {
    expect(dashboard).toContain("function renderWhatsAppPreview(text)");
    expect(dashboard).not.toContain("dangerouslySetInnerHTML={{__html:formatPreview(msg.body)}}");
    expect(dashboard).not.toContain("dangerouslySetInnerHTML={{__html:formatPreview(compose)}}");
  });

  it("records only an external-client handoff after a confirmed activity insert", () => {
    expect(dashboard).toContain('status:"via-link"');
    expect(dashboard).toContain("External WhatsApp handoff opened");
    expect(dashboard).toContain("Message handoff opened, but the activity record was not saved to the server.");
  });
});
