# Smart Manager Enterprise Dashboard Design

## Design Direction

The redesigned workspace uses a **calm operational command center** approach: a deep forest-green context band identifies the business workspace and its highest-value actions, while a warm neutral canvas and white information panels make operational data easy to scan. The visual system deliberately privileges established records, visible states, and concise actions over decorative density.

| Element | Decision | Purpose |
|---|---|---|
| Workspace shell | Persistent 264 px desktop sidebar; overlay navigation below `lg`; fixed mobile navigation retained. | Keeps a large module system discoverable without taking mobile content width. |
| Top navigation | Quiet white utility bar with search, connection state, alerts, theme, notifications, and profile. | Preserves existing global controls while reducing visual competition with the overview. |
| Overview hero | Forest-green briefing panel with company, role, data-status language, reports, and invoice action. | Makes the current workspace and next action legible before metrics. |
| KPI layer | Four compact action-oriented cards: collected, open receivables, pipeline, and stock attention. | Uses confirmed business rows and each card leads to the existing relevant workspace. |
| Intelligence layer | Financial movement chart, attention queue, confirmed activity, and approvals. | Separates trends, exceptions, history, and next work into predictable visual regions. |
| Responsive behavior | One column on small screens, two-column metric grid at `sm`, persistent sidebar at `lg`, mobile bottom navigation retained. | Supports field, tablet, and desktop use without a separate data model. |

## State Standards

The new overview handles live data state directly. Its loading skeleton appears while existing company-table hooks refresh, its error panel preserves any confirmed content and offers a non-mutating secure refresh, and its empty panels state the absence of confirmed records rather than inserting mock production metrics. Offline protection remains owned by the existing application shell, which pauses permanent writes and continues to communicate that server confirmation is required.

## Information Architecture

The overview is the executive default only. Financial, HR, sales, operations, focused-role, and minimal-role home views remain role-specific and retain their existing permission boundaries. The shared shell now carries the visual system across those connected management pages, while the new overview reuses existing `invoices`, `expenses`, `inventory`, `crm`, `leaveRequests`, `workOrders`, and `subscriptions` hooks; it introduces no new server API, schema, or duplicate fetch.

> The dashboard presents confirmed workspace information and navigation affordances. It does not manufacture targets, trends, task completion, payment success, integration status, or business activity where the underlying records do not provide it.
