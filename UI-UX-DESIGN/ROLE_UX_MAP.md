# Role and User Experience Map

The source role model is canonicalized server-side and reflected in the client module registry. The visual system must never imply access merely because a module exists in the catalog.

| Role family | Representative roles | Primary workspace behavior |
|---|---|---|
| Executive | Organization Owner, CEO, CFO, Auditor | Cross-module command center, risk and evidence drill-down, controlled exports. |
| Department head | Finance Manager, HR Manager, Sales Manager, Project Manager | Broad visibility with focused primary modules and full workflow actions where authorized. |
| Financial services | Institution Administrator, Branch Manager, Money Agent Manager, Money Agent, Supervisor | Scoped cash, agent, lending, settlement, and approval surfaces with explicit limits. |
| Industry operator | Clinic Administrator, Doctor, Nurse, Pharmacist, School Administrator, Hotel Manager, Restaurant Manager, Fleet Manager | Domain-specific workspace with least-privilege data exposure. |
| Front line | Cashier, Receptionist, Support Agent, Warehouse Manager, Driver | Fast task execution, minimal navigation, clear confirmation and exception states. |
| Self-service / external | Employee, Customer, Tenant, Supplier, External Client | Own-record portal or restricted read-only experience; no implied cross-tenant visibility. |

## Shared role patterns

1. **Owner / administrator:** sees configuration and evidence controls, but destructive or financial actions still require confirmation and audit.
2. **Auditor:** can inspect every module but cannot create, edit, or delete. Every design should show a read-only badge where relevant.
3. **Employee / self-service:** sees only personal and assigned workflows, never an organization-wide operational table.
4. **Restricted / unavailable:** show a transparent permission state with the required role or escalation path; do not render empty data as if the system were broken.
