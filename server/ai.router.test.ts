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
});
