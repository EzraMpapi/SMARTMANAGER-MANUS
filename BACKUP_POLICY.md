# BusinessSphere ERP — Automated Backup & Point-in-Time Recovery Policy

**Project:** BusinessSphere ERP (`businesssphere-erp`)  
**Target Platform:** Supabase Managed PostgreSQL + Manus Managed Hosting  

---

## 1. Overview

To ensure zero data loss and compliance with enterprise audit standards, BusinessSphere ERP implements a dual-layer backup and recovery strategy combining automated cloud database snapshots with application-level audit logging.

---

## 2. Supabase Point-in-Time Recovery (PITR) & Automated Backups

Supabase provides automated daily backups and point-in-time recovery capabilities for managed projects:
- **Daily Automated Snapshots**: Full backups of all relational tables (`companies`, `invoices`, `expenses`, `inventory`, `leads`, `loans`, and `audit_logs`) are captured automatically by the Supabase platform.
- **Point-in-Time Recovery (PITR)**: Enabled on production database instances, allowing restoration to any exact second within the retention window (typically 7 to 30 days depending on the Supabase plan).
- **Manual Snapshots**: Project administrators can trigger on-demand database dumps at any time via the Supabase Dashboard (`Database` → `Backups` → `Create Backup`).

---

## 3. Application-Level Audit Logs

In addition to database-level snapshots, BusinessSphere ERP records all sensitive administrative and departmental mutations into an immutable `audit_logs` table. This ensures full traceability of who performed what action, on which module, and when.
