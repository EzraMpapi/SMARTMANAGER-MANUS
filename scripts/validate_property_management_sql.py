from pathlib import Path
from pglast import parse_sql

path = Path(__file__).resolve().parents[1] / "supabase/migrations/20260823_040_property_management_core.sql"
text = path.read_text()
statements = parse_sql(text)
required = [
    "BEGIN;", "COMMIT;", "current_company_id()", "ENABLE ROW LEVEL SECURITY",
    "property_ledger_post", "debit_total<>credit_total", "property_immutable_guard",
    "UNIQUE(company_id,idempotency_key)", "property_tenant_snapshot", "property_action",
    "property_run_controls_for_company", "TO service_role", "Pending Provider",
    "The application maker cannot approve their own application.",
    "The lease maker cannot approve their own lease.",
    "The expense maker cannot approve their own expense.",
    "property_notifications", "property_audit_log", "'Finance'", "'Accounting'",
]
missing = [marker for marker in required if marker not in text]
if missing:
    raise SystemExit("missing markers: " + ", ".join(missing))
if "REVOKE ALL ON ALL TABLES IN SCHEMA public" in text:
    raise SystemExit("migration must not revoke unrelated public tables")
if "GRANT EXECUTE ON FUNCTION public.property_action(text,jsonb) TO anon" in text:
    raise SystemExit("property action must not be callable by anon")
print(f"property_migration_statements={len(statements)}")
print("property_migration_structure=ok")
