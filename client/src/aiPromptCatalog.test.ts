import { describe, expect, it } from "vitest";
import { AI_PROMPT_TEMPLATES, AI_QUICK_ACTIONS, actionsForScopes } from "./aiPromptCatalog.js";

const REQUIRED_FIELDS = ["id", "label", "description", "icon", "color", "scopes", "prompt"];
const VALID_SCOPES = new Set(["finance", "sales", "inventory", "hr", "suppliers"]);

function assertCatalogShape(items) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
  items.forEach((item) => {
    REQUIRED_FIELDS.forEach((field) => expect(item, `${item.id} missing ${field}`).toHaveProperty(field));
    expect(item.label.length).toBeGreaterThan(3);
    expect(item.description.length).toBeGreaterThan(8);
    expect(item.icon).toBeTruthy();
    expect(item.color).toMatch(/^#[0-9A-F]{6}$/i);
    expect(item.scopes.length).toBeGreaterThan(0);
    item.scopes.forEach((scope) => expect(VALID_SCOPES).toContain(scope));
    expect(item.prompt.length).toBeGreaterThan(100);
    expect(item.prompt).not.toMatch(/password|secret|api[_ -]?key/i);
  });
}

describe("Smart Manager AI shortcut catalog", () => {
  it("keeps every specialized tool complete, unique, and grounded", () => {
    expect(AI_QUICK_ACTIONS).toHaveLength(8);
    assertCatalogShape(AI_QUICK_ACTIONS);
    expect(AI_QUICK_ACTIONS.map((item) => item.label)).toEqual(expect.arrayContaining([
      "Executive brief",
      "Cash & collections",
      "Expense watch",
      "Reorder plan",
      "Pipeline coach",
      "Workforce pulse",
      "Supplier review",
      "90-day outlook",
    ]));
    AI_QUICK_ACTIONS.forEach((action) => expect(action.prompt).toMatch(/live|supplied|current|invent/i));
  });

  it("keeps every prompt template editable, scoped, and non-mutating", () => {
    expect(AI_PROMPT_TEMPLATES).toHaveLength(6);
    assertCatalogShape(AI_PROMPT_TEMPLATES);
    expect(AI_PROMPT_TEMPLATES.map((item) => item.label)).toEqual(expect.arrayContaining([
      "Board update",
      "Customer follow-up",
      "Month-end close",
      "Risk register",
      "Weekly KPI review",
      "SOP draft",
    ]));
    AI_PROMPT_TEMPLATES.forEach((template) => {
      expect(template.prompt).toMatch(/draft|create|prepare/i);
      expect(template.prompt).toMatch(/live|supplied|current/i);
    });
  });

  it("filters actions by persona scope and applies a stable display limit", () => {
    expect(actionsForScopes(AI_QUICK_ACTIONS, ["finance"], 20).map((item) => item.id)).toEqual([
      "executive-brief", "cash-collections", "expense-watch", "90-day-outlook",
    ]);
    expect(actionsForScopes(AI_QUICK_ACTIONS, ["sales"], 2)).toHaveLength(2);
    expect(actionsForScopes(AI_PROMPT_TEMPLATES, ["sales"], 20).map((item) => item.id)).toEqual([
      "board-update", "customer-follow-up", "risk-register", "weekly-kpi-review", "sop-draft",
    ]);
    expect(actionsForScopes(AI_QUICK_ACTIONS, ["unknown"], 10)).toEqual([]);
  });
});
