import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { resolveVerifiedProfile } from "./aiApprovals";
import { dispatchTenantWebhookEvent } from "./webhooks";
import { getTenantCollaborationWorkflowWebhook } from "./workspaceSettings";

export const EMAIL_TEMPLATE_WORKFLOW_ACTIONS = [
  "EMAIL_TEMPLATE_SAVED",
  "EMAIL_TEMPLATE_EXPORTED",
] as const;

const WORKFLOW_ADMIN_ROLES = new Set(["owner", "Owner", "Organization Owner", "CEO", "Super Administrator", "System Administrator"]);

export type EmailTemplateWorkflowAction = (typeof EMAIL_TEMPLATE_WORKFLOW_ACTIONS)[number];

type WorkflowInput = {
  action: EmailTemplateWorkflowAction;
  subject: string;
  recipientCount: number;
  attachmentCount: number;
};

function cleanSummary(value: string, maxLength = 120) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength) || "(No subject)";
}

export async function getEmailTemplateWorkflowStatus(req: CreateExpressContextOptions["req"]) {
  const config = await getTenantCollaborationWorkflowWebhook(req);
  return {
    enabled: Boolean(config.enabled && config.url),
    endpointConfigured: Boolean(config.url),
    secretConfigured: Boolean(config.secret),
    actions: [...EMAIL_TEMPLATE_WORKFLOW_ACTIONS],
  };
}

export function buildEmailTemplateWorkflowEvent(profile: { company_id: string; full_name: string | null }, input: WorkflowInput) {
  if (!EMAIL_TEMPLATE_WORKFLOW_ACTIONS.includes(input.action)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Unsupported email template workflow event." });
  }
  return {
    action: input.action,
    module: "Collaboration Hub",
    actor: profile.full_name || "Workspace user",
    companyId: profile.company_id,
    severity: "INFO" as const,
    details: JSON.stringify({
      subject: cleanSummary(input.subject),
      recipientCount: Math.max(0, Math.min(1000, Math.round(input.recipientCount))),
      attachmentCount: Math.max(0, Math.min(100, Math.round(input.attachmentCount))),
    }),
  };
}

export async function testEmailTemplateWorkflowWebhook(req: CreateExpressContextOptions["req"]) {
  const { profile } = await resolveVerifiedProfile(req);
  if (!WORKFLOW_ADMIN_ROLES.has(profile.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization administrator can test the Collaboration Hub webhook." });
  const config = await getTenantCollaborationWorkflowWebhook(req);
  if (!config.enabled || !config.url) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enable the tenant Collaboration Hub webhook and save an approved URL before testing it." });
  const result = await dispatchTenantWebhookEvent(config, { action: "EMAIL_TEMPLATE_WEBHOOK_TEST", module: "Collaboration Hub", actor: profile.full_name || "Workspace administrator", companyId: profile.company_id, severity: "INFO", details: "Administrator requested a Collaboration Hub webhook connectivity test." });
  return { ok: "success" in result && result.success, status: "responseCode" in result ? result.responseCode || 0 : 0 };
}

export async function dispatchEmailTemplateWorkflowEvent(req: CreateExpressContextOptions["req"], input: WorkflowInput) {
  const { profile } = await resolveVerifiedProfile(req);
  const config = await getTenantCollaborationWorkflowWebhook(req);
  const result = await dispatchTenantWebhookEvent(config, buildEmailTemplateWorkflowEvent(profile, input));
  const status = "skipped" in result && result.skipped
    ? "skipped"
    : "success" in result && result.success
      ? "delivered"
      : "failed";
  return {
    companyId: profile.company_id,
    action: input.action,
    status,
    responseCode: "responseCode" in result ? result.responseCode : undefined,
  } as const;
}
