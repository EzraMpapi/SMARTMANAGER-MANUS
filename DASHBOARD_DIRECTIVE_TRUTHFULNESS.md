# Dashboard Directive Truthfulness Record

This record explains how the directives in `pasted_content_2.txt` were applied to the Smart Manager executive dashboard without representing simulated, local-only, or unsupported information as business data.

| Directive | Implemented behavior | Explicit boundary |
| --- | --- | --- |
| Recent Activity | The dashboard groups confirmed invoice, expense, and leave records by their stored date and offers a reporting destination. | It does not generate sample events, accept local quick notes as an audit trail, or present minute-level recency when only date-level records exist. |
| Smart Tips & Actions | Inventory shortages and overdue work orders are surfaced from confirmed rows. When the workspace is new, actions to add inventory, create an invoice, or open leads appear only because the corresponding confirmed row collections are empty. | Tips are navigation suggestions, not AI insights, automated actions, or saved alerts. |
| Command Actions | Existing supported module actions are grouped by Finance, Sales, Operations, and People & Tools. The panel identifies the existing global `⌘K` command search. | Buttons only route to existing modules or established intent handlers; they do not assert that an unsupported form was opened. |
| Top Customers, Inventory, and Pipeline | Empty states identify the actual missing confirmed source and route to CRM, Inventory, or Leads. A populated pipeline visualizes lead counts when values have not yet been recorded. | No customer, stock, lead, value, or chart segment is manufactured to fill an empty chart. |
| AI assistant directive | The existing server-governed AI entry remains available through its established route. | The dashboard does not claim an online assistant, construct fake responses, or generate an AI recommendation without the existing approved service boundary. |
| Real-time data simulation | Not implemented. | Simulated users, revenue, tasks, projects, or automatic counter growth would misrepresent the tenant’s live business state and conflict with the confirmed-server-data requirement. |

The dashboard remains a navigation and interpretation layer over confirmed workspace data. Creating or changing business records continues to require the existing server-confirmed module workflows.
