# Profile Identity Fix Evidence — 2026-08-26

## Live Supabase findings

- Active project: `rlhngsrihahhyxnjxrxm` (ACTIVE_HEALTHY).
- Live migration registry includes `profile_identity_center`.
- `public.profiles` exists with RLS enabled and includes all self-service profile columns: preferred/first/middle/last name, date of birth, gender, phone, address, country, language, currency, timezone, date format, theme, notification preferences, avatar references, and completion timestamp.
- Live profile RPCs exist and are executable by `authenticated`, not `anon`:
  - `get_current_profile_identity()`
  - `update_current_profile_identity(jsonb)`
  - `set_current_profile_avatar(text,text)`
- In the bounded 23-hour production log window ending 2026-08-26T04:50:05Z, the count of PostgreSQL ERROR/FATAL records referencing `profile_identity` was 0.

## Root cause

The profile UI enables editing only after `profileIdentity.get` returns a verified profile. The dashboard persists a Supabase access token under SMART MANAGER storage keys (`bs_access_token` / `bs_session_access_token`). The tRPC transport previously attempted the Supabase client session, then a legacy `manus-cookie`, but did not read the SMART MANAGER keys. Therefore, an authenticated dashboard session could call the profile query without forwarding its Supabase bearer token, leaving the UI in its intentionally disabled fallback state.

## Fix

- Added `readStoredAccessToken()` to the shared browser auth-session helper.
- Updated the tRPC request transport to use that token as both `Authorization` and `x-supabase-authorization` before the legacy cookie fallback.
- Added regression coverage for storage precedence and for the profile authenticated transport contract.

## Validation

- Focused profile/auth transport tests: 4 files, 14 tests passed.
- TypeScript check passed.
- Vite production client build passed.
- Full suite passed: 239 files / 986 tests; 7 files / 15 tests skipped only for existing credential-gated checks.

No duplicate profile table or new production database object is required; the correct live table and tenant-scoped RPCs already exist.
