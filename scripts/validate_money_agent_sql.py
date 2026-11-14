from pathlib import Path
import re
from pglast import parse_sql

migration = Path('supabase/migrations/20260823_001_money_agent_core.sql').read_text()
statements = parse_sql(migration)
assert statements, 'migration produced no SQL statements'
assert migration.count('BEGIN;') == migration.count('COMMIT;') == 1
assert migration.count('$$') % 2 == 0, 'dollar quote delimiters are unbalanced'
required_tables = [
    'money_agent_branches', 'money_agent_agents', 'money_agent_customers', 'money_agent_wallets',
    'money_agent_services', 'money_agent_fee_rules', 'money_agent_commission_rules', 'money_agent_limits',
    'money_agent_transactions', 'money_agent_ledger_entries', 'money_agent_approvals', 'money_agent_settlements',
    'money_agent_reconciliations', 'money_agent_alerts', 'money_agent_audit_events', 'money_agent_pin_credentials',
    'money_agent_receipts', 'money_agent_notifications', 'money_agent_risk_events', 'money_agent_daily_summaries',
]
for table in required_tables:
    assert f'CREATE TABLE IF NOT EXISTS public.{table}' in migration, table
for marker in [
    'money_agent_snapshot', 'money_agent_customer_snapshot', 'money_agent_action',
    'money_agent_block_direct_mutation', 'money_agent_ledger_post', 'money_agent_can_customer_portal',
    "money_agent_require('manage')", "money_agent_require('operate')", "money_agent_require('approve')",
    "money_agent_require('audit')", 'UNIQUE(company_id, idempotency_key)', 'debit_total<>credit_total',
    'INSERT INTO public.money_agent_receipts', 'INSERT INTO public.money_agent_notifications',
    'INSERT INTO public.money_agent_daily_summaries', 'The transaction maker cannot reject their own transaction.',
    'The transaction maker cannot reverse or refund their own transaction.',
]:
    assert marker in migration, marker
# PIN credentials are not selected into either snapshot and the raw PIN is only passed to crypt().
assert 'pin_hash' not in migration[migration.index('CREATE OR REPLACE FUNCTION public.money_agent_snapshot'):migration.index('CREATE OR REPLACE FUNCTION public.money_agent_action')]
assert migration.count("crypt(p_payload->>'pin',gen_salt('bf'))") == 1
assert 'GRANT SELECT ON TABLE public.money_agent_pin_credentials' not in migration
print(f'validated {len(statements)} PostgreSQL statements; required Money Agent controls present')
