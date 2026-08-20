import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEmailTemplateWorkflowEvent } from "./emailTemplateWorkflow";
import { cleanProfileData, profileDataForClient, signatureLogoStorageKey, validateSignatureLogoPayload } from "./workspaceSettings";
import { buildEmailTemplateHtml, findEmailTemplateLinkIssues, validateEmailHyperlink } from "../client/src/lib/emailTemplateSafety";

const TINY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("Collaboration Hub email workflow contracts", () => {
  it("keeps workflow events tenant-scoped and strips unsafe subject control characters", () => {
    const event = buildEmailTemplateWorkflowEvent(
      { company_id: "tenant-alpha", full_name: "Asha Admin" },
      { action: "EMAIL_TEMPLATE_EXPORTED", subject: "Quarterly\nReport", recipientCount: 2, attachmentCount: 1 },
    );
    expect(event).toMatchObject({ action: "EMAIL_TEMPLATE_EXPORTED", module: "Collaboration Hub", companyId: "tenant-alpha", actor: "Asha Admin" });
    expect(event.details).toContain('"subject":"Quarterly Report"');
    expect(event.details).toContain('"recipientCount":2');
    expect(event.details).toContain('"attachmentCount":1');
    expect(event.details).not.toContain("tenant-beta");
  });

  it("masks the tenant webhook secret before workspace settings reach the browser", () => {
    const safe = profileDataForClient({ collaborationWorkflowWebhookEnabled: true, collaborationWorkflowWebhookUrl: "https://alerts.example.test", collaborationWorkflowWebhookSecret: "server-only-secret" });
    expect(safe).toMatchObject({ collaborationWorkflowWebhookEnabled: true, collaborationWorkflowWebhookUrl: "https://alerts.example.test", collaborationWorkflowWebhookSecretConfigured: true });
    expect(JSON.stringify(safe)).not.toContain("server-only-secret");
  });
});

describe("Workspace signature logo boundary", () => {
  it("validates a supported logo payload and produces a company-scoped storage key", () => {
    const payload = validateSignatureLogoPayload({ mimeType: "image/png", base64: TINY_PNG_BASE64 });
    expect(payload?.ext).toBe("png");
    expect(payload?.bytes.length).toBeGreaterThan(0);
    expect(signatureLogoStorageKey("tenant/alpha", "png")).toBe("workspace-branding/tenant%2Falpha/signature-logo.png");
  });

  it("rejects malformed signature uploads and removes cleared logo values during normalization", () => {
    expect(() => validateSignatureLogoPayload({ mimeType: "image/png", base64: "not-base64" })).toThrow();
    const cleaned = cleanProfileData({ signatureLogo: null, collaborationWorkflowWebhookSecret: "secret" });
    expect(cleaned.signatureLogo).toBeUndefined();
    expect(profileDataForClient(cleaned).collaborationWorkflowWebhookSecretConfigured).toBe(true);
  });
});

describe("Collaboration Hub email hyperlink safety", () => {
  it("allows approved protocols and blocks executable or malformed destinations", () => {
    expect(validateEmailHyperlink("https://example.com").valid).toBe(true);
    expect(validateEmailHyperlink("mailto:finance@example.com").valid).toBe(true);
    expect(validateEmailHyperlink("javascript:alert(1)").valid).toBe(false);
    expect(validateEmailHyperlink("https://").valid).toBe(false);
  });

  it("finds unsafe markdown links and preserves safe links in exported HTML", () => {
    const body = "Review [the portal](https://example.com) and [this script](javascript:alert(1)).";
    expect(findEmailTemplateLinkIssues(body)).toHaveLength(1);
    const safeHtml = buildEmailTemplateHtml(body);
    expect(safeHtml).toContain('href="https://example.com"');
    expect(safeHtml).not.toContain("javascript:");
  });

  it("keeps the contact picker render identifier aligned with its state declaration", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
    expect(source).toContain("const [showContacts, setShowContacts] = useState(false);");
    expect(source).toContain("{showContacts && filteredContacts.length>0 && (");
    expect(source).not.toContain("showCont && filteredContacts");
  });
});
