# Supabase Settings Storage Contract

The authenticated Settings workspace uses the existing `companies` table for supported company columns and `company_profile_settings.profile_data` for extended profile content such as business hours, bank-display fields, social handles, contact presentation details, and a cover-image URL. The table is tenant-keyed by `company_id`, has row-level security enabled, and permits direct authenticated reads only when `company_id = current_company_id()`.

> Direct browser mutation is intentionally not granted for `company_profile_settings`. The backend verifies the authenticated profile and administrator role before writing through its server-only database credential. The browser never receives that credential.

The migration `add_company_profile_settings` created the table, its foreign key to `companies`, and its tenant-read RLS policy. The server writes only to the verified profile’s `company_id`; it does not accept a tenant identifier from the client as authority.
