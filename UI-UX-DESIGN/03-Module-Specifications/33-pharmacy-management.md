# 33. Pharmacy Management — Module Design Specification

**Source ID:** `pharmacy`  
**Experience family:** Pharmacy operations  
**Primary roles:** Pharmacist / Clinic Administrator  
**Source evidence:** `client/src/BusinessSphereDashboard.jsx` module catalog and the relevant workspace/component or server contract.

## Purpose

Design Pharmacy Management as a role-aware workspace for pharmacy operations. The module should open with a clear operational question, expose the minimum data required for the current role, and make status, permission, freshness, and next action obvious.

## Screen reference

| Screen | Main components | Primary action | Secondary action | Data displayed |
|---|---|---|---|---|
| Overview / command center | KPI cards, trend/chart, alert rail, recent activity, quick actions | Open the highest-priority queue | Change scope, export snapshot | patient, prescription, medicine, batch, quantity, dispenser, stock, expiry |
| List / queue | Search, filters, saved views, sortable table, pagination, bulk bar | Create or open a record | Bulk update, export, clear filters | patient, prescription, medicine, batch, quantity, dispenser, stock, expiry; owner; status; updated time |
| Record detail | Header, status, summary cards, related records, timeline, permission panel | Edit or advance workflow | Attach evidence, share/export | Full record, history, dependencies, audit evidence |
| Create / edit form | Sectioned form, required markers, inline help, validation summary | Save draft or submit | Cancel, duplicate, reset | patient, prescription, medicine, batch, quantity, dispenser, stock, expiry |
| Workflow / approval | Stepper, maker-checker state, approval drawer, confirmation dialog, audit event | Approve, reject, dispatch, dispense, reconcile, or complete as applicable | Escalate, request changes, retry | Decision evidence, actor, limits, timestamps |
| Report / evidence | Filters, table/chart, source freshness, export menu, schedule action | Export or schedule | Drill down, compare periods | Aggregated module metrics and evidence |

## Validation and trust

Validate required fields, tenant/company context, duplicate records, domain constraints, role authority, financial totals, and related-record integrity before confirmation. During processing show a pending state and preserve the draft. On success show the confirmed record/result; on failure show the server message, affected fields, retry path, and no false success. Record actor, time, action, and related resource in the audit trail.

## Responsive behavior

Desktop uses the standard sidebar and two-column workspace. Tablet collapses the sidebar and keeps the primary table plus detail panel only when both remain readable. Mobile stacks KPIs and form sections, keeps filters in a horizontally scrollable strip, turns actions into a full-width wrapping group, and preserves dense tables inside an explicit horizontal scroll region.

## Related screens

Global Dashboard, Reports, Notifications, Activity Stream, Documents, Settings, and any linked source modules such as Finance, CRM, Inventory, or Approvals should use consistent record links and terminology.
