# SMART MANAGER — UX Architecture

## Navigation model

The application uses a persistent application shell with a role-filtered module rail, company/branch context, global search, notifications, account menu, and a responsive collapse. Each module follows a consistent local pattern: module header → context/filter bar → primary workspace → related activity/evidence. Specialized workspaces may add domain tabs, but they should not change the global interaction grammar.

## Information hierarchy

1. **Global context:** tenant, branch, role, date, notification state, connectivity/freshness.
2. **Module context:** active module, submodule/tab, record scope, date/filter selection.
3. **Operational work:** KPIs, queues, tables, charts, forms, and action panels.
4. **Trust layer:** validation, approval status, audit evidence, source/freshness, and permission explanations.
5. **Recovery layer:** errors, retry, draft preservation, export, and support path.

## Experience modes

| Mode | Primary question | Layout priority |
|---|---|---|
| Executive | What needs attention now? | KPIs, exceptions, trend, decision shortcuts |
| Operator | What do I do next? | Queue, search, form, status, confirmation |
| Reviewer | Is this correct and authorized? | Evidence, diffs, approvals, audit trail |
| Frontline | Can I finish this quickly and safely? | Large actions, barcode/search, receipt, offline/retry |
| Portal | What belongs to me? | Narrow scope, plain language, mobile-first actions |
| Specialist | Which domain state needs expertise? | Domain tabs, minimum-necessary data, related context |

## Screen sequence pattern

Every important workflow uses the same mental model: **Entry → Form → Validation → Confirmation → Processing → Success → Result**. A failed server mutation exits through **Error → Retry or Save draft**, never through an unverified success state.

## Cross-module relationships

Sales, CRM, inventory, procurement, finance, reports, notifications, and audit form the core commercial loop. Healthcare, pharmacy, school, hotel, restaurant, fleet, property, and financial-service workspaces use the same shell but expose domain-specific records. Community Groups and VICOBA/SACCOS share member-led savings, meetings, contributions, loans, approvals, and reporting patterns. TRA Portal and Finance share tax/evidence handoffs. Integration Hub and Workflow Studio provide the control plane for outbound events and automation.

## Permission architecture

The source role model has 36 roles and two practical axes: module visibility and write access. The design adds action-level communication: a read-only role sees the record and a precise explanation; a maker sees the action and pending state; a checker sees approval controls; an auditor sees immutable evidence and export; an external portal user sees only scoped data.
