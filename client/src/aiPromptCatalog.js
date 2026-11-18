import {
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gauge,
  MessageSquare,
  Package,
  ReceiptText,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

// One-click analysis tools. They never mutate records directly; mutation
// proposals continue through the server-side approval workflow.
export const AI_QUICK_ACTIONS = [
  { id: "executive-brief", label: "Executive brief", description: "A fast health check with priorities", icon: Gauge, color: "#16A34A", scopes: ["finance", "sales", "inventory", "hr"], prompt: "Give me a concise executive briefing: current business health, three evidence-backed risks, three opportunities, and the most important actions for the next 7 days. Use the live snapshot only." },
  { id: "cash-collections", label: "Cash & collections", description: "Find receivables that need attention", icon: WalletCards, color: "#2563EB", scopes: ["finance"], prompt: "Review cash position and receivables. Rank the invoices or collection issues that need attention first, explain the evidence and amounts, and suggest a practical follow-up plan. Do not invent payment dates." },
  { id: "expense-watch", label: "Expense watch", description: "Spot unusual or avoidable spend", icon: ReceiptText, color: "#F59E0B", scopes: ["finance"], prompt: "Review the supplied expenses for unusual, concentrated, duplicate-looking, or avoidable spending patterns. Separate confirmed observations from questions to investigate and recommend three controls." },
  { id: "reorder-plan", label: "Reorder plan", description: "Prioritize low stock and cost", icon: Package, color: "#7C3AED", scopes: ["inventory", "suppliers"], prompt: "Build a prioritized reorder plan from the live inventory snapshot. List items below reorder level, estimated replenishment cost using supplied unit costs, urgency, and supplier lead-time considerations. Never invent stock or supplier data." },
  { id: "pipeline-coach", label: "Pipeline coach", description: "Choose the next best sales moves", icon: TrendingUp, color: "#EA580C", scopes: ["sales"], prompt: "Analyze the current sales pipeline by stage and value. Identify the highest-leverage opportunities, missing follow-up evidence, and draft three specific next-step messages for the most important open deals." },
  { id: "workforce-pulse", label: "Workforce pulse", description: "Summarize people and leave signals", icon: Users, color: "#0891B2", scopes: ["hr"], prompt: "Summarize workforce health from the supplied employee and leave data: payroll context, pending leave patterns, staffing risks, and three manager actions. Keep employee-sensitive conclusions grounded and respectful." },
  { id: "supplier-review", label: "Supplier review", description: "Compare lead times and risk", icon: ClipboardCheck, color: "#475569", scopes: ["suppliers", "inventory"], prompt: "Review suppliers for lead-time, availability, and purchasing risk using only the supplied data. Recommend which supplier relationships need follow-up and what evidence should be collected next." },
  { id: "90-day-outlook", label: "90-day outlook", description: "Turn current signals into a plan", icon: CalendarCheck, color: "#DB2777", scopes: ["finance", "sales", "inventory"], prompt: "Create a grounded 90-day outlook using the current finance, sales, and inventory snapshot. Include base-case signals, downside risks, leading indicators to monitor weekly, and a short action plan." },
];

// Reusable drafting templates. Clicking one fills the composer so the user
// can edit the request before sending it to the scoped assistant.
export const AI_PROMPT_TEMPLATES = [
  { id: "board-update", label: "Board update", description: "Turn live signals into a leadership memo", icon: FileText, color: "#0F766E", scopes: ["finance", "sales", "inventory", "hr"], prompt: "Draft a board-ready business update from the live snapshot. Use these headings: Executive summary, performance signals, material risks, decisions needed, and next 30 days. Include exact supplied figures where available and label missing evidence clearly." },
  { id: "customer-follow-up", label: "Customer follow-up", description: "Draft a warm, evidence-based message", icon: MessageSquare, color: "#2563EB", scopes: ["sales"], prompt: "Choose the highest-priority open sales opportunity from the live pipeline and draft a concise customer follow-up message. Reference only supplied deal facts, include one clear next step, and do not invent a meeting date, discount, or promise." },
  { id: "month-end-close", label: "Month-end close", description: "Build an accountant's close checklist", icon: ClipboardList, color: "#7C3AED", scopes: ["finance"], prompt: "Create a month-end close checklist grounded in the live finance snapshot. Prioritize unreconciled items, overdue receivables, missing documentation, expense anomalies, and approvals. Separate confirmed data from checks the team still needs to perform." },
  { id: "risk-register", label: "Risk register", description: "Create owners and mitigations for risks", icon: ShieldCheck, color: "#B45309", scopes: ["finance", "sales", "inventory", "hr"], prompt: "Create a practical risk register from the live snapshot with columns: risk, evidence, likelihood, impact, early warning signal, mitigation, and suggested owner. Do not assign a person unless the supplied data supports it." },
  { id: "weekly-kpi-review", label: "Weekly KPI review", description: "Prepare a focused team review", icon: Target, color: "#DB2777", scopes: ["finance", "sales", "inventory", "hr"], prompt: "Prepare a weekly KPI review using only the current business snapshot. Highlight what improved, what deteriorated, the three metrics that need attention next week, and three specific questions for the team." },
  { id: "sop-draft", label: "SOP draft", description: "Turn a process into a usable checklist", icon: ClipboardList, color: "#475569", scopes: ["finance", "sales", "inventory", "hr", "suppliers"], prompt: "Draft a concise standard operating procedure for the most important process suggested by the current role and data. Use: purpose, scope, prerequisites, numbered steps, control points, evidence to retain, and escalation path. Mark assumptions for review." },
];

export function actionsForScopes(actions, scopes, limit = actions.length) {
  const allowed = new Set(scopes);
  return actions.filter((action) => action.scopes.some((scope) => allowed.has(scope))).slice(0, limit);
}
