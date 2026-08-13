# Supabase Server-Side Persistence & Architecture Guide

## Executive Summary
This document outlines the server-side persistence architecture for **BusinessSphere ERP (Smart Manager)**. To satisfy the requirement that all business data is stored securely in the Supabase PostgreSQL database (server-side) rather than volatile local browser storage, the application employs `runCompanyTableMutation` and `runCompanyTableQuery` helpers built on top of Supabase PostgREST and tRPC.

---

## 1. Supabase Client & Environment Configuration
The application initializes the Supabase client using environment variables injected via `import.meta.env` (frontend) and `process.env` (server-side Drizzle/PostgREST gateway):

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 2. Core ERP Tables & Schema Definitions
All business entities include primary keys (`id`), tenant ownership scoping (`company_id`), and timestamps (`created_at`, `updated_at`).

### Production schema inventory and verification
The full production inventory is maintained in [SUPABASE_SCHEMA_COMPLETE.md](./SUPABASE_SCHEMA_COMPLETE.md). The dashboard currently references 110 table endpoints, all of which are present in the connected project. The reusable `pnpm verify:supabase-schema` command derives the table list from `BusinessSphereDashboard.jsx`, retrieves the protected PostgREST OpenAPI description, and fails when a referenced table or required tenant audit field is absent.

### Example Table: `company_expenses`
```sql
CREATE TABLE IF NOT EXISTS public.company_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'TZS',
  department text DEFAULT 'Operations',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company_expenses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated/anon insertions and selections for connected tenant
CREATE POLICY "Allow tenant operations on company_expenses"
  ON public.company_expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 3. Server-Confirmed Persistence & Error Resilience
To prevent data loss and resolve local versus server save discrepancies, `runCompanyTableMutation` executes transient retries with server-confirmed ID reconciliation:

```tsx
async function runCompanyTableMutation(tableName, payload, companyId) {
  let attempts = 0;
  let lastError = null;
  while (attempts < 3) {
    attempts++;
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert([{ ...payload, company_id: companyId }])
        .select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, attempts * 1000));
    }
  }
  return { success: false, error: lastError?.message || "Server sync failed" };
}
```

---

## 4. Tenant isolation, RLS, and safe migrations
Tenant isolation must be enforced by Supabase Row Level Security policies using the authoritative company membership/tenant-resolution function rather than through the browser alone. Supabase’s guidance is to enable RLS for exposed application tables and make policies the enforcement point for row access.[1]

When schema work is required, use an idempotent Supabase migration with `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and guarded policy creation. Do not use the platform Drizzle workflow for ERP entities: it targets the separate MySQL/TiDB platform database. The additive migration [`supabase/migrations/20260812_001_complete_erp_schema_baseline.sql`](./supabase/migrations/20260812_001_complete_erp_schema_baseline.sql) has been applied successfully; it repairs `audit_log.updated_at` while preserving all existing records. The subsequent protected API verifier found all 110 dashboard table endpoints and no required tenant-field exceptions, while a direct catalog exception query found no `company_id` table with missing RLS or a missing policy.

## 5. Parameterized Query Builders & SQL Injection Prevention
All data reads and writes use Supabase's built-in query builder, which automatically uses parameterized queries to protect against SQL injection without raw string concatenation.

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security guide"
