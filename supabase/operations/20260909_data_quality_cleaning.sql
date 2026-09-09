-- Smart Manager Data Quality cleaning
-- Date: 2026-09-09
-- Scope: finance_expenses vendor labels and crm_leads phone values
-- Safety: read-only dry run by default. The APPLY section is transactional and
-- only copies values from an exact, same-company trusted source or from an
-- explicitly supplied manual mapping. It never invents phone numbers/vendors.
--
-- Run the audit queries first. Review every candidate before running APPLY.

/* --------------------------------------------------------------------------
   1) DRY RUN: current unresolved records
   -------------------------------------------------------------------------- */
SELECT
  id,
  company_id,
  category,
  amount,
  expense_date,
  method,
  vendor
FROM public.finance_expenses
WHERE NULLIF(btrim(vendor), '') IS NULL
ORDER BY created_at DESC
LIMIT 200;

SELECT
  id,
  company_id,
  name,
  data->>'phone' AS phone,
  data->>'leadCode' AS lead_code,
  data->>'source' AS source
FROM public.crm_leads
WHERE NULLIF(btrim(data->>'phone'), '') IS NULL
ORDER BY created_at DESC
LIMIT 200;

/* --------------------------------------------------------------------------
   2) DRY RUN: trusted recovery candidates

   Vendor recovery uses an exact expense signature inside the same company.
   Phone recovery uses an exact lead/contact name inside the same company and
   only a non-empty phone from crm_contacts.data->>'phone'.
   -------------------------------------------------------------------------- */
WITH vendor_candidates AS (
  SELECT
    e.id,
    e.company_id,
    min(NULLIF(btrim(source.vendor), '')) AS candidate_vendor,
    count(DISTINCT NULLIF(btrim(source.vendor), '')) AS candidate_count
  FROM public.finance_expenses e
  LEFT JOIN public.finance_expenses source
    ON source.company_id = e.company_id
   AND source.category = e.category
   AND source.amount = e.amount
   AND source.expense_date = e.expense_date
   AND source.method = e.method
   AND NULLIF(btrim(source.vendor), '') IS NOT NULL
  WHERE NULLIF(btrim(e.vendor), '') IS NULL
  GROUP BY e.id, e.company_id
)
SELECT * FROM vendor_candidates
WHERE candidate_count = 1
ORDER BY id
LIMIT 200;

SELECT
  l.id,
  l.company_id,
  l.name,
  c.name AS matched_contact,
  NULLIF(btrim(c.data->>'phone'), '') AS candidate_phone
FROM public.crm_leads l
JOIN public.crm_contacts c
  ON c.company_id = l.company_id
 AND lower(btrim(c.name)) = lower(btrim(l.name))
WHERE NULLIF(btrim(l.data->>'phone'), '') IS NULL
  AND NULLIF(btrim(c.data->>'phone'), '') IS NOT NULL
ORDER BY l.id
LIMIT 200;

/* --------------------------------------------------------------------------
   3) APPLY: source-backed cleaning only

   This section is intentionally commented out. Uncomment after reviewing the
   dry-run results. It updates only unambiguous candidates and remains safe to
   re-run. If a candidate is ambiguous or absent, it is left unchanged.
   -------------------------------------------------------------------------- */
-- BEGIN;
--
-- WITH vendor_candidates AS (
--   SELECT
--     e.id,
--     min(NULLIF(btrim(source.vendor), '')) AS candidate_vendor,
--     count(DISTINCT NULLIF(btrim(source.vendor), '')) AS candidate_count
--   FROM public.finance_expenses e
--   LEFT JOIN public.finance_expenses source
--     ON source.company_id = e.company_id
--    AND source.category = e.category
--    AND source.amount = e.amount
--    AND source.expense_date = e.expense_date
--    AND source.method = e.method
--    AND NULLIF(btrim(source.vendor), '') IS NOT NULL
--   WHERE NULLIF(btrim(e.vendor), '') IS NULL
--   GROUP BY e.id
-- )
-- UPDATE public.finance_expenses e
-- SET vendor = vc.candidate_vendor
-- FROM vendor_candidates vc
-- WHERE e.id = vc.id
--   AND vc.candidate_count = 1
--   AND NULLIF(btrim(vc.candidate_vendor), '') IS NOT NULL;
--
-- UPDATE public.crm_leads l
-- SET data = jsonb_set(l.data, '{phone}', to_jsonb(NULLIF(btrim(c.data->>'phone'), '')), true),
--     updated_at = now()
-- FROM public.crm_contacts c
-- WHERE c.company_id = l.company_id
--   AND lower(btrim(c.name)) = lower(btrim(l.name))
--   AND NULLIF(btrim(l.data->>'phone'), '') IS NULL
--   AND NULLIF(btrim(c.data->>'phone'), '') IS NOT NULL;
--
-- -- Post-apply verification. Both counts should be lower only when real values
-- -- were available; unresolved records remain visible for manual remediation.
-- SELECT 'remaining_missing_vendors' AS check_name, count(*) AS value
-- FROM public.finance_expenses
-- WHERE NULLIF(btrim(vendor), '') IS NULL;
--
-- SELECT 'remaining_missing_lead_phones' AS check_name, count(*) AS value
-- FROM public.crm_leads
-- WHERE NULLIF(btrim(data->>'phone'), '') IS NULL;
--
-- COMMIT;

/* --------------------------------------------------------------------------
   4) MANUAL MAPPING TEMPLATE

   Current audit found no trusted exact matches for the two missing vendors or
   the 100 demo lead phone numbers. Use this section only after an authorized
   operator provides the real values. Replace the example rows, review them,
   then run inside a transaction. Do not use placeholders as real contact data.
   -------------------------------------------------------------------------- */
-- BEGIN;
-- WITH manual_vendor_map(id, vendor) AS (
--   VALUES
--     -- ('expense-uuid', 'Actual supplier name')
-- ), updated_vendors AS (
--   UPDATE public.finance_expenses e
--   SET vendor = m.vendor
--   FROM manual_vendor_map m
--   WHERE e.id = m.id
--     AND NULLIF(btrim(m.vendor), '') IS NOT NULL
--     AND NULLIF(btrim(e.vendor), '') IS NULL
--   RETURNING e.id
-- )
-- SELECT count(*) AS vendors_updated FROM updated_vendors;
--
-- WITH manual_phone_map(id, phone) AS (
--   VALUES
--     -- ('lead-uuid', '+2557XXXXXXXX')
-- ), updated_phones AS (
--   UPDATE public.crm_leads l
--   SET data = jsonb_set(l.data, '{phone}', to_jsonb(btrim(m.phone)), true),
--       updated_at = now()
--   FROM manual_phone_map m
--   WHERE l.id = m.id
--     AND btrim(m.phone) ~ '^\\+[0-9][0-9 -]{7,18}$'
--     AND NULLIF(btrim(l.data->>'phone'), '') IS NULL
--   RETURNING l.id
-- )
-- SELECT count(*) AS phones_updated FROM updated_phones;
-- COMMIT;

/* --------------------------------------------------------------------------
   5) FINAL QUALITY COUNTS
   -------------------------------------------------------------------------- */
SELECT
  'finance_expenses.missing_vendor' AS finding,
  count(*) AS remaining
FROM public.finance_expenses
WHERE NULLIF(btrim(vendor), '') IS NULL
UNION ALL
SELECT
  'crm_leads.missing_phone' AS finding,
  count(*) AS remaining
FROM public.crm_leads
WHERE NULLIF(btrim(data->>'phone'), '') IS NULL;
