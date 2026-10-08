from __future__ import annotations
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
raw_path = Path('/home/ubuntu/.mcp/tool-results/2026-08-23_13-03-15.364747636_supabase_list_tables_ada23261.json')
raw = json.loads(raw_path.read_text())
tables = raw.get('tables', [])
live = {t['name'].removeprefix('public.'): t for t in tables}

dashboard = (root / 'client/src/BusinessSphereDashboard.jsx').read_text()
services = []
for path in [root / 'server/profileIdentity.ts', root / 'server/microfinanceOperations.ts', root / 'server/pharmacyOperations.ts', root / 'server/schoolOperations.ts']:
    if path.exists():
        services.append(path.read_text())
ref_text = dashboard + '\n' + '\n'.join(services)
referenced = set(re.findall(r'(?:sb|useCompanyTable|runCompanyTableQuery|runCompanyTableMutation)\("([^\"]+)"', dashboard))
for prefix in ['mfi_', 'phm_', 'sch_']:
    referenced.update(re.findall(r'"(' + re.escape(prefix) + r'[a-z_]+)"', ref_text))
missing = sorted(referenced - set(live))
rls_off = sorted(name for name, table in live.items() if table.get('rls_enabled') is not True)
profile = live.get('profiles', {})
profile_columns = {col['name'] for col in profile.get('columns', [])}
required_profile = {'id','company_id','email','full_name','role','is_active','created_at','updated_at'}
identity_columns = {'preferred_name','first_name','middle_name','last_name','date_of_birth','gender','phone','address','country','preferred_language','currency_display','profile_timezone','date_format','theme_preference','notification_preferences','avatar_url','avatar_storage_key','profile_completed_at'}
print(json.dumps({
    'table_count': len(live),
    'referenced_table_count': len(referenced),
    'missing_referenced_tables': missing,
    'rls_disabled_tables': rls_off,
    'profiles_present': bool(profile),
    'profiles_columns': sorted(profile_columns),
    'profiles_missing_baseline_columns': sorted(required_profile - profile_columns),
    'profiles_present_identity_columns': sorted(identity_columns & profile_columns),
    'profiles_missing_identity_columns': sorted(identity_columns - profile_columns),
    'property_tables': sorted(name for name in live if name.startswith('property_')),
    'hr_employee_present': 'hr_employees' in live,
    'branches_present': 'branches' in live,
    'departments_present': 'departments' in live,
}, indent=2))
