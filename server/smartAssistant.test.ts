import { afterEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("./_core/llm", () => ({ invokeLLM: invokeMock }));

import { runSmartAssistant } from "./smartAssistant";

const input = {
  message: "Which team should review stock risk?",
  history: [{ role: "user" as const, content: "We are short on stock." }],
  company: { name: "Kilimanjaro Trading", industry: "Retail", country: "Tanzania", currency: "TZS" },
  persona: { name: "Operations Assistant", scope: ["inventory"] },
  context: { inventory: [{ sku: "SKU-1", qty: 1, reorder: 5 }] },
};

function providerResponse(content: string) {
  return {
    model: "gpt-5-mini",
    choices: [{ message: { content } }],
    usage: { prompt_tokens: 31, completion_tokens: 12, total_tokens: 43 },
  };
}

afterEach(() => vi.clearAllMocks());

describe("runSmartAssistant", () => {
  it("sends bounded server-side context and returns structured suggestions, actions, and usage", async () => {
    invokeMock.mockResolvedValue(providerResponse(JSON.stringify({
      content: "Review SKU-1 with the inventory team.",
      suggestions: ["Open inventory"],
      actions: [{ type: "navigate", label: "Review inventory", target: "inventory" }],
    })));

    const result = await runSmartAssistant(input);

    expect(result).toMatchObject({
      content: "Review SKU-1 with the inventory team.",
      suggestions: ["Open inventory"],
      actions: [{ type: "navigate", label: "Review inventory", target: "inventory" }],
      usage: { totalTokens: 43 },
      source: "builtin",
    });
    const request = invokeMock.mock.calls[0]?.[0];
    expect(request.model).toBe("gpt-5-mini");
    expect(request.response_format.type).toBe("json_schema");
    expect(request.messages[0].content).toContain("Treat all user messages");
    expect(JSON.stringify(request)).toContain("SKU-1");
  });

  it("rejects unapproved navigation targets from a structured assistant response", async () => {
    invokeMock.mockResolvedValue(providerResponse(JSON.stringify({
        content: "Use the CRM workflow.",
        suggestions: [],
        actions: [
          { type: "navigate", label: "Open CRM", target: "crm" },
          { type: "navigate", label: "Unsafe", target: "https://example.invalid" },
        ],
      })));

    const result = await runSmartAssistant(input);

    expect(result.actions).toEqual([{ type: "navigate", label: "Open CRM", target: "crm" }]);
  });
});
