# Incident Analysis: Finance Payable Save Schema-Cache Mismatch (`finance_expenses.data`)

## Root Cause Analysis
When recording a payable or expense from the mobile/desktop Finance Payables form, the application posts a payload through `runCompanyTableMutation("finance_expenses", "insert", ...)`. 
- Because `finance_expenses` was listed in `GENERIC_COMPANY_TABLES`, the frontend normalization helper attempted to extract a generic JSON `data` column alongside standard envelope fields.
- However, the deployed Supabase schema for `finance_expenses` is a fully typed relational table (holding `vendor`, `category`, `expense_date`, `due_date`, `amount`, `status`, `method`, `department`, `cost_center`) and does not feature a `data` JSONB column.
- Consequently, PostgREST returned a schema-cache error: `Could not find the 'data' column of 'finance_expenses' in the schema cache`.

## Resolution Strategy
1. **Exclude typed financial tables from the generic envelope**: Remove `finance_expenses` (and related typed ledgers/documents where appropriate) from `GENERIC_COMPANY_TABLES` so payloads are sent as direct relational rows without the synthetic `data` object.
2. **Preserve Tenant Isolation & Backward Compatibility**: Maintain exact table normalization for genuinely generic tables while ensuring typed tables (`finance_expenses`, `sales_invoices`, `sales_quotations`) send only their explicit relational columns.
3. **Regression Testing**: Add dedicated test coverage verifying that expense inserts omit the `data` column and correctly serialize relational expense payloads.
