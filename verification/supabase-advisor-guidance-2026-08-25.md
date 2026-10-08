# Supabase advisor remediation guidance

Research performed on 25 August 2026 using official Supabase documentation.

## Applicable guidance

- Supabase Database Advisors identify unindexed foreign keys, RLS policy issues, multiple permissive policies, unused indexes, and security-definer exposure. Unindexed foreign-key findings are INFO-level recommendations and should be evaluated against workload and table size.
- Multiple permissive RLS policies combine with OR semantics for the same operation/role. They must not be merged or dropped unless the resulting predicate is proven equivalent and tenant/role semantics are preserved.
- Unused indexes should not be removed solely from advisor output. Supabase recommends reviewing future usage and testing the impact in development or staging before dropping them.
- `SECURITY DEFINER` functions should be the exception, not the default. When used, they must pin `search_path`; function execution should be granted only to intended roles.
- RLS enabled without policies blocks ordinary API reads/writes. However, a table with revoked direct privileges and only tightly scoped security-definer/service-role procedures may intentionally have no direct policies; adding a generic policy can create an access regression or data exposure.

## Official references

[1]: https://supabase.com/docs/guides/database/database-advisors "Supabase Performance and Security Advisors"
[2]: https://supabase.com/docs/guides/database/functions "Supabase Database Functions"
[3]: https://supabase.com/docs/guides/database/row-level-security "Supabase Row Level Security"
[4]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase PostgreSQL Row Level Security guide"
