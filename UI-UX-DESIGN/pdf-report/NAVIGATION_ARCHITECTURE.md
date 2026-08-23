# Navigation Architecture

SMART MANAGER uses a role-aware persistent shell. The global hierarchy is: public entry → authentication/onboarding → company and branch context → module navigation → local workspace tabs → record detail → confirmation/result. On phones, the sidebar becomes a bottom navigation plus a slide-over module drawer; dense tables become scrollable or card-based rather than shrinking typography.

## Primary navigation

Dashboard → CRM → Sales → Inventory → Procurement → Finance → Reports → HR → Analytics → Notifications → Integrations → Workflows → Collaboration → TRA Portal → AI Assistant → Microfinance → Money Agent → Property Management → VICOBA / SACCOS → Community Groups → Healthcare / Clinic → School Management → Pharmacy Management → Hotel & Hospitality → Fleet Management → Banking & MFI → Restaurant & F&B → Employee Portal → Settings

## Context hierarchy

| Level | Responsibility | Design rule |
|---|---|---|
| Global shell | Tenant, branch, role, search, notifications, profile | Never hide the current company/branch context. |
| Module | Domain command center | Every module has one clear primary action and one visible status summary. |
| Local view | List, board, timeline, or report | Preserve filters and return paths. |
| Record | Detail, form, approval, evidence | Show identity, status, ownership, audit, and related entities together. |
| Result | Success, error, pending, restricted | State what happened, what was not changed, and what the user can do next. |
