# Data Quality cleaning scripts

The companion SQL file, [`20260909_data_quality_cleaning.sql`](./20260909_data_quality_cleaning.sql), is intentionally **dry-run first**. It audits missing vendors and lead phone numbers, shows only trusted recovery candidates, and keeps all write statements commented until an operator reviews the results.

## What the script repairs

Vendor recovery is allowed only when another expense in the **same company** has exactly the same category, amount, expense date, and payment method, and provides one unambiguous non-empty vendor value. Phone recovery is allowed only when a CRM contact in the **same company** has an exact normalized name match and a non-empty phone stored in `crm_contacts.data.phone`.

The script does not invent phone numbers, replace missing values with fake placeholders, or overwrite existing values. It is idempotent: re-running the apply section does not change already populated records.

## Current audit result

The current Supabase audit found:

- Two `finance_expenses` rows without vendors. Neither had a trusted duplicate expense signature with a vendor, so both require an authorized manual vendor mapping.
- One hundred primary-company CRM leads without phone numbers. None had an exact matching CRM contact with a phone, so these require authorized manual phone mappings or direct collection from the lead.

The manual mapping template at the bottom of the SQL file accepts UUID-to-value mappings and validates phone values against a basic international format before updating them.

## Execution sequence

Run the SQL file in the Supabase SQL editor. First execute sections 1, 2, and 5 as a read-only review. If the candidate lists are correct, uncomment only the source-backed `APPLY` section and run it in a transaction. For records with no trusted candidate, populate the manual mapping template with verified business data, review the exact UUID/value pairs, then run that section in a transaction.

Afterward, re-run the final quality counts. Any remaining records are intentionally left unresolved rather than silently corrupted.
