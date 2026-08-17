# Pasted Content 4: Extended Dashboard Plan Traceability

This document maps the directives in `pasted_content_4.txt` to Smart Manager’s current confirmed-data architecture. The attached examples are treated as interface inspiration, not as authority to create sample business records, unverified system states, browser-only audit trails, or new external service paths.

| Attached plan area | Result | Implementation or boundary |
| --- | --- | --- |
| Smart Activity Feed | **Enhanced safely.** The existing tenant-scoped `ActivityStream` is backed by `audit_log` and in-session audit-bus updates. It now exposes accessible module filtering, a clear-filter action, a confirmed-entry count, a tenant-audit source label, and a truthful empty state. | Sample names, sample invoices, random updates, a browser-local read state, local quick notes, and a guessed `/api/activities` WebSocket are not implemented. They would make activity records non-durable or misrepresent audit history. |
| Attention Center | **Already represented safely.** The executive Smart Tips & Actions panel derives low-stock, overdue-work-order, and empty-dataset guidance from confirmed rows. | Arbitrary current timestamps, browser-local dismissed-alert history, generic “perfect shape” claims, and static AI ROI advice are excluded. |
| Quick Action Hub | **Already represented safely.** Command Actions are grouped by operational area and the established global `⌘K` command palette remains the search entry point. | The attached hard-coded keyboard shortcuts, fake badges, unsupported direct paths, and browser-only view preferences are not added. |
| KPI Cards | **Already represented safely.** Workspace Overview cards use confirmed invoice, expense, stock, CRM, and subscription data. | Targets, changes, trend percentages, progress, last-updated times, and AI insights are excluded unless the underlying workspace has a verified contract for them. |
| Module Health | **Already represented safely.** Module cards derive current statuses and drill-downs from tenant-visible records and role permissions. | Active-user figures, availability claims, static health progress, and guessed recency are not added. |
| Pipeline visualization | **Already represented safely.** The dashboard visualizes confirmed lead-stage values and falls back to confirmed lead counts where values are not recorded. | Hard-coded stages with a fake `hasData` switch, conversion rates, average deal size, time-to-close, placeholder imports, and unimplemented export controls are excluded. |
| AI Assistant Widget | **Existing governed assistant retained.** The existing server-side Smart Assistant and its review/approval boundaries remain the supported AI path. | Simulated responses, random answer selection, an unverified “Online” indicator, unsupported microphone/upload controls, and conflicting `⌘K` interception are not added. |

## Durable prerequisites for deferred work

A complete real-time activity product would require a tenant-scoped event model with verified writer identities, retention and read-state rules, authorization for every event type, and a configured real-time transport. Activity notes require a persisted, tenant-isolated write contract rather than browser state. KPI targets and performance trends require organization-approved goals and an explicit period-comparison model. AI UI extensions must continue to call the existing governed server assistant rather than synthesize responses in the browser.

The completed enhancement therefore improves exploration of confirmed audit history while preserving the ERP’s server-confirmed persistence and multi-tenant safety requirements.
