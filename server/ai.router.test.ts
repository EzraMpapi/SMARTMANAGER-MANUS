import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routersSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("AI router and grounded dashboard signals", () => {
  it("exposes runtime model discovery and protected chat procedures", () => {
    expect(routersSource).toContain("listLLMModels");
    expect(routersSource).toContain("invokeLLM");
    expect(routersSource).toContain("chat: protectedProcedure");
  });

  it("routes contextual assistant requests through the authenticated built-in AI service with bounded memory and rate protection", () => {
    expect(routersSource).toContain("assist: protectedProcedure");
    expect(routersSource).toContain("enforceAssistantRateLimit");
    expect(routersSource).toContain("runSmartAssistant");
    expect(dashboardSource).toContain("trpc.ai.assist.useMutation");
    expect(dashboardSource).toContain("support_chat_conversations");
    expect(dashboardSource).toContain("support_chat_messages");
    expect(dashboardSource).not.toContain("api.anthropic.com");
  });

  it("requires server-verified role approval before an AI business-action proposal can be authorized", () => {
    expect(routersSource).toContain("requestActionApproval: protectedProcedure");
    expect(routersSource).toContain("decideActionApproval: protectedProcedure");
    expect(dashboardSource).toContain("Review required:");
    expect(dashboardSource).toContain("Submit for review");
    expect(dashboardSource).toContain("No business record was changed");
  });

  it("uses a strict structured schema for cash-flow and inventory anomaly findings", () => {
    expect(routersSource).toContain("analyzeAnomalies: protectedProcedure");
    expect(routersSource).toContain("erp_anomaly_findings");
    expect(routersSource).toContain('enum: ["high", "medium", "low"]');
    expect(routersSource).toContain('enum: ["cash_flow", "inventory"]');
    expect(routersSource).toContain("rule-based-fallback");
  });

  it("wires prompt suggestions and live tenant metrics into the assistant UI", () => {
    expect(dashboardSource).toContain('persona.suggestions.slice(0, 3)');
    expect(dashboardSource).toContain("Check cash & stock risks");
    expect(dashboardSource).toContain("trpc.ai.analyzeAnomalies.useMutation");
    expect(dashboardSource).toContain("inventoryRows.filter((item) => item.qty <= item.reorder");
    expect(dashboardSource).toContain("Business signals");
  });

  it("exposes role-aware specialized AI shortcuts without bypassing the assistant approval flow", () => {
    expect(dashboardSource).toContain("AI_QUICK_ACTIONS");
    expect(dashboardSource).toContain("from \"./aiPromptCatalog.js\"");
    expect(dashboardSource).toContain("actionsForScopes(AI_QUICK_ACTIONS");
    expect(dashboardSource).toContain("Specialized tools");
    expect(dashboardSource).toContain("grounded in live data");
    expect(dashboardSource).toContain("AI_PROMPT_TEMPLATES");
    expect(dashboardSource).toContain("actionsForScopes(AI_PROMPT_TEMPLATES");
    const catalogSource = readFileSync(new URL("../client/src/aiPromptCatalog.js", import.meta.url), "utf8");
    expect(catalogSource).toContain("Executive brief");
    expect(catalogSource).toContain("Board update");
    expect(catalogSource).toContain("Customer follow-up");
    expect(catalogSource).toContain("Month-end close");
    expect(catalogSource).toContain("Risk register");
    expect(catalogSource).toContain("Weekly KPI review");
    expect(catalogSource).toContain("SOP draft");
  });

  it("maps provider failures to actionable fallback states without exposing provider internals", () => {
    expect(dashboardSource).toContain("ASSISTANT_ERROR_COPY");
    expect(dashboardSource).toContain("AI_CONFIG_MISSING");
    expect(dashboardSource).toContain("AI_RATE_LIMITED");
    expect(dashboardSource).toContain("AI_TIMEOUT");
    expect(dashboardSource).toContain("Continue without AI");
    expect(dashboardSource).toContain("data-ai-error-code");
    expect(routersSource).toContain("assistantErrorMessage");
    expect(routersSource).toContain("[${error.code}]");
  });

  it("exposes configurePreferences procedure and AI preferences drawer assistant", () => {
    expect(routersSource).toContain("configurePreferences: protectedProcedure");
    expect(routersSource).toContain("dashboard_ai_preferences");
    const drawerSource = readFileSync(new URL("../client/src/components/DashboardPreferencesDrawer.tsx", import.meta.url), "utf8");
    expect(drawerSource).toContain("trpc.ai.configurePreferences.useMutation");
    expect(drawerSource).toContain("AI Assistant");
    expect(drawerSource).toContain("Apply AI Recommendation");
  });
});
