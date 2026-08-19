# Smart Manager ERP — Module Map & Dependency Inventory

## Architecture Overview
- **Frontend Core**: React 19, Vite 7, single-file primary dashboard (`client/src/BusinessSphereDashboard.jsx`), modular public auth gateway (`client/src/components/PublicAuthGateway.jsx`), enterprise auth views (`client/src/components/EnterpriseAuthViews.jsx`), and shared brand logo assets (`client/src/components/BrandLogo.tsx`).
- **Backend & Database**: Express 4, tRPC 11 server routers (`server/routers.ts`), Supabase PostgreSQL backend, and Drizzle ORM schemas (`drizzle/schema.ts`).
- **Security & Multi-Tenancy**: Strict tenant isolation via `company_id`, role-based access control (`admin`, `manager`, `employee`), biometric WebAuthn passkeys, session idle timeout monitoring, and authenticated server-bound notifications.

---

## Module Inventory

| Module Name | Route / Path | Primary Components / Files | Data Tables & Services |
| :--- | :--- | :--- | :--- |
| **Authentication & Onboarding** | `/app`, `/api/oauth/*` | `PublicAuthGateway.jsx`, `EnterpriseAuthViews.jsx`, `SmartManagerAuth.jsx` | `auth.users`, `companies`, `company_modules`, `user_profiles` |
| **Executive Dashboard** | `/app` (Dashboard Tab) | `BusinessSphereDashboard.jsx`, WhatsApp Feed Widget, DSE / Bank Lending Widget | `companies`, `company_modules`, `financial_metrics` |
| **Collaboration Hub** | `/app` (Collaboration Tab) | `WhatsAppWebIntegration`, Team Chat channels, Calendar sync, Audit logs | `chat_messages`, `workspace_members`, `audit_logs` |
| **TRA Fiscal Portal** | `/app` (TRA Portal Tab) | `TraPortalModule.jsx`, VAT Returns table, Buyer grouping, Thermal receipt config | `fiscal_receipts`, `vat_returns`, `tax_audits` |
| **Human Resources (HR)** | `/app` (HR Tab) | Department Headcount Summary, Biometric passkey revocation logs, Employee rosters | `employees`, `departments`, `passkey_credentials` |
| **Finance & Analytics** | `/app` (Finance Tab) | Departmental budget thresholds, Multi-currency reconciliation, Statutory audit packets | `invoices`, `expenses`, `budgets`, `exchange_rates` |
| **Inventory & Procurement** | `/app` (Inventory / Procurement) | Warehouse stock levels, Inventory import/export, Low-stock webhooks | `inventory_items`, `warehouses`, `purchase_orders` |
| **Settings Control Center** | `/app` (Settings Tab) | Branding logo cropper, Auth background uploads, Inactivity timeout slider, Webhook keys | `companies`, `user_profiles`, `workspace_settings` |
