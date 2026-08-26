-- SMART MANAGER full synthetic demo commissioning seed, v1.
--
-- This is NOT a migration and must never be placed under supabase/migrations.
-- It is additive only: no UPDATE, DELETE, TRUNCATE, auth-user creation, provider
-- calls, storage writes, or RLS/grant changes are performed.
--
-- It is intentionally blocked unless the operator supplies all of these session
-- settings in the same transaction:
--   SET LOCAL app.demo_seed_environment = 'controlled_existing_tenant';
--   SET LOCAL app.allow_demo_seed = 'true';
--   SET LOCAL app.demo_seed_confirmation = 'I_UNDERSTAND_THIS_ADDS_SYNTHETIC_DATA';
--   SET LOCAL app.demo_seed_company_id = '<approved existing company UUID>';
--   SET LOCAL app.demo_seed_owner_profile_id = '<approved existing profile UUID>';
--   SET LOCAL app.demo_seed_commit = 'true';
--
-- Current approved commissioning boundary (verified 2026-08-26):
--   company: KMKM / 0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6
--   owner profile: cfa31225-6481-4cc3-9af3-6f009a9259cb
--
-- Synthetic data uses the marker smartmanager_demo_full_20260826_v1 and reserved
-- .invalid emails in JSON metadata. Reruns are idempotent by deterministic IDs.
-- Existing rows in the mixed KMKM tenant are never updated or overwritten.
-- Direct Community Groups/VICOBA protected tables are not written here; use their
-- supported module workflow because the live relationship trigger rejects raw rows.

DO $$
DECLARE
  v_company uuid := nullif(current_setting('app.demo_seed_company_id', true), '')::uuid;
  v_owner uuid := nullif(current_setting('app.demo_seed_owner_profile_id', true), '')::uuid;
  v_branch uuid := '22222222-2222-4001-8000-222222222222';
  v_warehouse uuid := '22222222-2222-4002-8000-222222222222';
  v_demo_branch uuid := '11111111-1111-4111-8111-111111111122';
  v_demo_warehouse uuid := '11111111-1111-4111-8111-111111111124';
  v_marker text := 'smartmanager_demo_full_20260826_v1';
  v_meta jsonb;
  v_bank_branch uuid;
  v_account_cash uuid := '22222222-2222-4101-8000-222222222222';
  v_account_revenue uuid := '22222222-2222-4102-8000-222222222222';
  v_account_expense uuid := '22222222-2222-4103-8000-222222222222';
  v_account_payable uuid := '22222222-2222-4104-8000-222222222222';
BEGIN
  IF current_setting('app.demo_seed_environment', true) IS DISTINCT FROM 'controlled_existing_tenant'
    OR current_setting('app.allow_demo_seed', true) IS DISTINCT FROM 'true'
    OR current_setting('app.demo_seed_confirmation', true) IS DISTINCT FROM 'I_UNDERSTAND_THIS_ADDS_SYNTHETIC_DATA'
    OR current_setting('app.demo_seed_commit', true) IS DISTINCT FROM 'true'
  THEN
    RAISE EXCEPTION 'Demo commissioning seed blocked: explicit controlled-tenant confirmation and commit gate are required.' USING ERRCODE = '42501';
  END IF;

  IF v_company IS NULL OR v_owner IS NULL
    OR v_company <> '0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6'::uuid
    OR v_owner <> 'cfa31225-6481-4cc3-9af3-6f009a9259cb'::uuid
  THEN
    RAISE EXCEPTION 'Demo commissioning seed blocked: only the reviewed KMKM tenant and owner profile are approved.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company AND name = 'KMKM')
    OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_owner AND company_id = v_company AND is_active = true)
  THEN
    RAISE EXCEPTION 'Demo commissioning seed blocked: approved company/profile linkage was not found.' USING ERRCODE = '23503';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.branches WHERE id = v_demo_branch AND company_id = v_company)
    OR NOT EXISTS (SELECT 1 FROM public.inventory_warehouses WHERE id = v_demo_warehouse AND company_id = v_company)
  THEN
    RAISE EXCEPTION 'Demo commissioning seed blocked: the original reviewed demo branch/warehouse is missing.' USING ERRCODE = '23503';
  END IF;

  v_meta := jsonb_build_object('demo_seed', v_marker, 'synthetic', true, 'currency', 'TZS', 'timezone', 'Africa/Dar_es_Salaam', 'do_not_contact', true);
  SELECT id INTO v_bank_branch FROM public.bank_branches WHERE company_id = v_company ORDER BY created_at LIMIT 1;

  -- Tenant-visible reference setup.
  INSERT INTO public.branches (id, company_id, name, status, notes, data)
  VALUES (v_branch, v_company, 'DEMO FULL - Dar es Salaam Operations', 'Active', 'DEMO DATA ONLY - synthetic commissioning fixture', v_meta || jsonb_build_object('city', 'Dar es Salaam'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.inventory_warehouses (id, company_id, name, status, notes, data)
  VALUES (v_warehouse, v_company, 'DEMO FULL - Kariakoo Distribution Warehouse', 'Active', 'DEMO DATA ONLY - synthetic commissioning fixture', v_meta || jsonb_build_object('location', 'Kariakoo'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.inventory_suppliers (id, company_id, name, status, amount, notes, data)
  SELECT format('22222222-2222-4%s-8000-222222222222', lpad(to_hex(g), 3, '0'))::uuid,
         v_company, format('DEMO Supplier %s - Dar es Salaam', lpad(g::text, 3, '0')), 'Active',
         250000 + (g * 17500), 'DEMO DATA ONLY', v_meta || jsonb_build_object('supplier_code', format('DEMO-SUP-%s', lpad(g::text, 3, '0')), 'phone', format('+255700%06s', g::text))
  FROM generate_series(1, 20) AS s(g)
  ON CONFLICT DO NOTHING;

  -- Inventory: 320 synthetic products plus opening stock movements.
  INSERT INTO public.inventory_items (id, company_id, name, status, amount, notes, data)
  SELECT format('33333333-3333-4%s-8000-3333%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company,
         format('%s - DEMO SKU-%s',
           (ARRAY['Tanzanian Arabica Coffee', 'Kilimanjaro Tea', 'Office Chair', 'Receipt Paper Roll', 'Solar Lantern', 'Maize Flour', 'Hand Sanitizer', 'USB-C Charger'])[1 + ((g - 1) % 8)],
           lpad(g::text, 4, '0')),
         CASE WHEN g % 29 = 0 THEN 'Low Stock' ELSE 'Active' END,
         (5000 + ((g * 1375) % 495000))::numeric,
         'DEMO DATA ONLY - synthetic inventory item',
         v_meta || jsonb_build_object('sku', format('DEMO-SKU-%s', lpad(g::text, 4, '0')), 'unit', (ARRAY['piece','pack','kg','box'])[1 + ((g - 1) % 4)], 'onHand', 20 + (g % 180), 'reorderLevel', 10 + (g % 25), 'supplierId', format('22222222-2222-4%s-8000-222222222222', lpad(to_hex(1 + ((g - 1) % 20)), 3, '0')))
  FROM generate_series(1, 320) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.inventory_stock_movements (id, company_id, name, status, amount, notes, data)
  SELECT format('34444444-4444-4%s-8000-4444%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('Opening receipt - DEMO SKU-%s', lpad(g::text, 4, '0')), 'Posted',
         ((20 + (g % 180)) * (5000 + ((g * 1375) % 495000)))::numeric,
         'DEMO DATA ONLY', v_meta || jsonb_build_object('itemId', format('33333333-3333-4%s-8000-3333%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0')), 'warehouseId', v_warehouse, 'quantity', 20 + (g % 180), 'direction', 'IN')
  FROM generate_series(1, 320) AS s(g)
  ON CONFLICT DO NOTHING;

  -- CRM: 150 contacts, 100 leads, and 150 interaction records.
  INSERT INTO public.crm_contacts (id, company_id, name, status, amount, notes, data)
  SELECT format('35555555-5555-4%s-8000-5555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Client %s - SME', lpad(g::text, 3, '0')), 'Active', 0,
         'DEMO DATA ONLY - no real contact', v_meta || jsonb_build_object('clientCode', format('DEMO-CLI-%s', lpad(g::text, 3, '0')), 'email', format('demo-client-%s@example.invalid', g), 'phone', format('+255710%06s', g::text), 'segment', (ARRAY['Retail','Hospitality','Education','Agriculture','Services'])[1 + ((g - 1) % 5)])
  FROM generate_series(1, 150) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.crm_leads (id, company_id, name, status, amount, notes, data)
  SELECT format('36666666-6666-4%s-8000-6666%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Lead %s - %s', lpad(g::text, 3, '0'), (ARRAY['New enquiry','Referral','Website request','Partner referral'])[1 + ((g - 1) % 4)]),
         (ARRAY['New','Qualified','Contacted','Converted'])[1 + ((g - 1) % 4)], 50000 + ((g * 7000) % 900000), 'DEMO DATA ONLY',
         v_meta || jsonb_build_object('leadCode', format('DEMO-LEAD-%s', lpad(g::text, 3, '0')), 'source', (ARRAY['Website','WhatsApp','Referral','Event'])[1 + ((g - 1) % 4)])
  FROM generate_series(1, 100) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.crm_interactions (id, company_id, name, status, amount, notes, data)
  SELECT format('37777777-7777-4%s-8000-7777%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Client follow-up %s', lpad(g::text, 3, '0')), 'Completed', 0, 'DEMO DATA ONLY',
         v_meta || jsonb_build_object('contactId', format('35555555-5555-4%s-8000-5555%08s', lpad(to_hex(1 + ((g - 1) % 150)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 150)), 8, '0')), 'channel', (ARRAY['Phone','Email','WhatsApp','In Person'])[1 + ((g - 1) % 4)], 'outcome', (ARRAY['Follow-up scheduled','Quotation requested','Resolved','No answer'])[1 + ((g - 1) % 4)])
  FROM generate_series(1, 150) AS s(g)
  ON CONFLICT DO NOTHING;

  -- Sales: 500 orders with two normalized lines each, 450 invoices and payments.
  INSERT INTO public.sales_orders (id, company_id, customer, doc_number, order_date, owner_id, status, quotation_reference, owner_name)
  SELECT format('40000000-0000-4%s-8000-4000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Client %s - SME', lpad((1 + ((g - 1) % 150))::text, 3, '0')), format('DEMO-SO-FULL-%04s', g),
         (timestamp with time zone '2026-01-01 09:00:00+03' + ((g % 240) || ' days')::interval), v_owner,
         (ARRAY['Confirmed','Processing','Completed','Cancelled'])[1 + ((g - 1) % 4)], format('DEMO-QUOTE-FULL-%04s', g), 'DEMO Sales Desk'
  FROM generate_series(1, 500) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sales_order_items (id, company_id, name, status, amount, notes, data, order_id, item_name, item_sku, qty, rate, sort_order)
  SELECT format('41111111-1111-4%s-8000-4111%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g * 10 + l), 8, '0'))::uuid,
         v_company, format('DEMO-SO-FULL-%04s line %s', g, l), 'Confirmed',
         ((1 + ((g + l) % 5)) * (12000 + (((g + l) * 3500) % 160000)))::numeric, 'DEMO DATA ONLY',
         v_meta || jsonb_build_object('orderId', format('40000000-0000-4%s-8000-4000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))),
         format('40000000-0000-4%s-8000-4000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         format('DEMO Product %s', 1 + ((g + l - 2) % 320)), format('DEMO-SKU-%s', lpad((1 + ((g + l - 2) % 320))::text, 4, '0')),
         1 + ((g + l) % 5), 12000 + (((g + l) * 3500) % 160000), l
  FROM generate_series(1, 500) AS s(g) CROSS JOIN generate_series(1, 2) AS lines(l)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sales_invoices (id, company_id, name, status, amount, notes, data, doc_number, customer, issue_date, due_date, order_id, amount_paid)
  SELECT format('42222222-2222-4%s-8000-4222%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Invoice %04s', g),
         CASE WHEN g % 11 = 0 THEN 'Overdue' WHEN g % 5 = 0 THEN 'Paid' ELSE 'Issued' END,
         round((((1 + ((g + 1) % 5)) * (12000 + (((g + 1) * 3500) % 160000)) + (1 + ((g + 2) % 5)) * (12000 + (((g + 2) * 3500) % 160000))) * 1.18)::numeric, 2),
         'DEMO DATA ONLY - TZS invoice', v_meta || jsonb_build_object('taxRate', 18, 'currency', 'TZS'), format('DEMO-INV-FULL-%04s', g), format('DEMO Client %s - SME', lpad((1 + ((g - 1) % 150))::text, 3, '0')),
         (timestamp with time zone '2026-01-02 09:00:00+03' + ((g % 240) || ' days')::interval), (timestamp with time zone '2026-01-31 09:00:00+03' + ((g % 240) || ' days')::interval),
         format('40000000-0000-4%s-8000-4000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         CASE WHEN g % 5 = 0 THEN round((((1 + ((g + 1) % 5)) * (12000 + (((g + 1) * 3500) % 160000)) + (1 + ((g + 2) % 5)) * (12000 + (((g + 2) * 3500) % 160000))) * 1.18)::numeric, 2) ELSE 0 END
  FROM generate_series(1, 450) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sales_invoice_items (id, company_id, name, status, amount, notes, data, invoice_id, item_name, item_sku, qty, rate, sort_order)
  SELECT format('43333333-3333-4%s-8000-4333%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g * 10 + l), 8, '0'))::uuid,
         v_company, format('DEMO-INV-FULL-%04s line %s', g, l), 'Issued',
         ((1 + ((g + l) % 5)) * (12000 + (((g + l) * 3500) % 160000)))::numeric, 'DEMO DATA ONLY', v_meta,
         format('42222222-2222-4%s-8000-4222%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         format('DEMO Product %s', 1 + ((g + l - 2) % 320)), format('DEMO-SKU-%s', lpad((1 + ((g + l - 2) % 320))::text, 4, '0')),
         1 + ((g + l) % 5), 12000 + (((g + l) * 3500) % 160000), l
  FROM generate_series(1, 450) AS s(g) CROSS JOIN generate_series(1, 2) AS lines(l)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sales_payments (id, company_id, name, status, amount, notes, data, invoice_id, method, payment_date, reference)
  SELECT format('44444444-4444-4%s-8000-4444%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Payment %04s', g), 'Captured',
         round((((1 + ((g + 1) % 5)) * (12000 + (((g + 1) * 3500) % 160000)) + (1 + ((g + 2) % 5)) * (12000 + (((g + 2) * 3500) % 160000))) * 1.18)::numeric, 2),
         'DEMO DATA ONLY - simulated mobile money receipt', v_meta || jsonb_build_object('provider', 'SIMULATED_MOBILE_MONEY'),
         format('42222222-2222-4%s-8000-4222%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         (ARRAY['M-Pesa','Tigo Pesa','Cash','Bank Transfer'])[1 + ((g - 1) % 4)],
         timestamp with time zone '2026-02-01 10:00:00+03' + ((g % 210) || ' days')::interval,
         format('DEMO-PAY-FULL-%04s', g)
  FROM generate_series(1, 300) AS s(g)
  ON CONFLICT DO NOTHING;

  -- Procurement and operating expenses.
  INSERT INTO public.procurement_purchase_orders (id, company_id, name, status, amount, notes, data)
  SELECT format('45555555-5555-4%s-8000-4555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Purchase Order %04s', g), (ARRAY['Draft','Approved','Received','Closed'])[1 + ((g - 1) % 4)],
         100000 + ((g * 27500) % 4500000), 'DEMO DATA ONLY', v_meta || jsonb_build_object('supplierId', format('22222222-2222-4%s-8000-222222222222', lpad(to_hex(1 + ((g - 1) % 20)), 3, '0')), 'warehouseId', v_warehouse)
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.purchase_order_items (id, company_id, name, status, amount, notes, data)
  SELECT format('46666666-6666-4%s-8000-4666%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g * 10 + l), 8, '0'))::uuid,
         v_company, format('DEMO PO %04s line %s', g, l), 'Approved', (1 + ((g + l) % 10)) * (5000 + ((g * 1375) % 95000)),
         'DEMO DATA ONLY', v_meta || jsonb_build_object('purchaseOrderId', format('45555555-5555-4%s-8000-4555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0')), 'itemId', format('33333333-3333-4%s-8000-3333%08s', lpad(to_hex(1 + ((g + l - 2) % 320)), 3, '0'), lpad(to_hex(1 + ((g + l - 2) % 320)), 8, '0')))
  FROM generate_series(1, 120) AS s(g) CROSS JOIN generate_series(1, 2) AS lines(l)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.finance_expenses (id, company_id, amount, category, due_date, expense_date, method, status, vendor)
  SELECT format('47777777-7777-4%s-8000-4777%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, ((35000 + ((g * 4100) % 900000))::numeric)::text,
         (ARRAY['Utilities','Transport','Rent','Office supplies','Maintenance','Marketing'])[1 + ((g - 1) % 6)],
         timestamp with time zone '2026-01-01 09:00:00+03' + ((g % 250) || ' days')::interval,
         timestamp with time zone '2026-01-01 09:00:00+03' + ((g % 230) || ' days')::interval,
         (ARRAY['Cash','M-Pesa','Bank Transfer'])[1 + ((g - 1) % 3)],
         (ARRAY['Draft','Approved','Paid'])[1 + ((g - 1) % 3)], format('DEMO Vendor %s - No Contact', 1 + ((g - 1) % 25))
  FROM generate_series(1, 250) AS s(g)
  ON CONFLICT DO NOTHING;

  -- POS legacy dashboard data.
  INSERT INTO public.pos_shifts (id, company_id, name, status, amount, notes, data)
  SELECT format('48888888-8888-4%s-8000-4888%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO POS Shift %02s - %s', g, to_char(date '2026-01-01' + (g * 20), 'DD Mon YYYY')), (ARRAY['Open','Closed'])[1 + (g % 2)], 250000 + (g * 43000), 'DEMO DATA ONLY', v_meta || jsonb_build_object('branchId', v_branch, 'cashier', 'DEMO Cashier')
  FROM generate_series(1, 12) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pos_transactions (id, company_id, name, status, amount, notes, data)
  SELECT format('49999999-9999-4%s-8000-4999%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO POS Sale %04s', g), 'Completed', 25000 + ((g * 7250) % 750000), 'DEMO DATA ONLY',
         v_meta || jsonb_build_object('shiftId', format('48888888-8888-4%s-8000-4888%08s', lpad(to_hex(1 + ((g - 1) % 12)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 12)), 8, '0')), 'paymentMethod', (ARRAY['Cash','M-Pesa','Card'])[1 + ((g - 1) % 3)])
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pos_transaction_items (id, company_id, name, status, amount, notes, data)
  SELECT format('4aaaaaaa-aaaa-4%s-8000-4aaa%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g * 10 + l), 8, '0'))::uuid,
         v_company, format('DEMO POS Sale %04s line %s', g, l), 'Completed', (1 + ((g + l) % 4)) * (12000 + ((g * 3500) % 160000)), 'DEMO DATA ONLY',
         v_meta || jsonb_build_object('transactionId', format('49999999-9999-4%s-8000-4999%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0')), 'sku', format('DEMO-SKU-%s', lpad((1 + ((g + l - 2) % 320))::text, 4, '0')), 'qty', 1 + ((g + l) % 4))
  FROM generate_series(1, 120) AS s(g) CROSS JOIN generate_series(1, 2) AS lines(l)
  ON CONFLICT DO NOTHING;

  -- HR: 40 employees, six monthly payroll runs, 240 payroll items/payslips, attendance and leave.
  INSERT INTO public.hr_employees (id, company_id, name, status, amount, notes, data, profile_id, employee_number, employment_start_date, timezone)
  SELECT format('4bbbbbbb-bbbb-4%s-8000-4bbb%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('%s %s - DEMO Employee', (ARRAY['Asha','Baraka','Neema','Juma','Rehema','Hamisi','Zawadi','Mariam'])[1 + ((g - 1) % 8)], lpad(g::text, 3, '0')), 'Active',
         1200000 + ((g * 37500) % 3200000), 'DEMO DATA ONLY - no linked auth identity', v_meta || jsonb_build_object('department', (ARRAY['Operations','Finance','Sales','HR','Inventory'])[1 + ((g - 1) % 5)], 'phone', format('+255720%06s', g::text)), NULL, format('DEMO-EMP-FULL-%03s', g), date '2025-01-01' + (g % 120), 'Africa/Dar_es_Salaam'
  FROM generate_series(1, 40) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hr_payroll_runs (id, company_id, name, status, amount, notes, data, period_start, period_end, currency, timezone, approved_at, posted_at, finance_reference)
  SELECT format('4ccccccc-cccc-4%s-8000-4ccc%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Payroll - %s', to_char(date '2026-03-01' + ((g - 1) * 31), 'Month YYYY')), 'Posted', 80000000 + (g * 1500000), 'DEMO DATA ONLY - synthetic payroll aggregate', v_meta || jsonb_build_object('statutoryRules', jsonb_build_array('TZ_PAYE','NSSF','WCF','SDL')), date '2026-03-01' + ((g - 1) * 31), date '2026-03-31' + ((g - 1) * 31), 'TZS', 'Africa/Dar_es_Salaam', timestamp with time zone '2026-03-28 10:00:00+03', timestamp with time zone '2026-03-29 10:00:00+03', format('DEMO-PAYROLL-FULL-%02s', g)
  FROM generate_series(1, 6) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hr_payroll_items (id, company_id, payroll_run_id, employee_id, gross_pay, taxable_pay, deductions, net_pay, currency, status, data, employer_contributions, employer_cost)
  SELECT format('4ddddddd-dddd-4%s-8000-4ddd%08s', lpad(to_hex((g - 1) % 6 + 1), 3, '0'), lpad(to_hex((g - 1) * 40 + e), 8, '0'))::uuid,
         v_company,
         format('4ccccccc-cccc-4%s-8000-4ccc%08s', lpad(to_hex((g - 1) % 6 + 1), 3, '0'), lpad(to_hex((g - 1) % 6 + 1), 8, '0'))::uuid,
         format('4bbbbbbb-bbbb-4%s-8000-4bbb%08s', lpad(to_hex(e), 3, '0'), lpad(to_hex(e), 8, '0'))::uuid,
         1200000 + ((e * 37500) % 3200000), 1200000 + ((e * 37500) % 3200000), round((1200000 + ((e * 37500) % 3200000)) * 0.14, 2), round((1200000 + ((e * 37500) % 3200000)) * 0.86, 2), 'TZS', 'Posted', v_meta || jsonb_build_object('paye', round((1200000 + ((e * 37500) % 3200000)) * 0.08, 2), 'nssf', round((1200000 + ((e * 37500) % 3200000)) * 0.05, 2)), round((1200000 + ((e * 37500) % 3200000)) * 0.04, 2), round((1200000 + ((e * 37500) % 3200000)) * 1.04, 2)
  FROM generate_series(1, 6) AS s(g) CROSS JOIN generate_series(1, 40) AS employees(e)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hr_payslips (id, company_id, payroll_item_id, employee_id, pay_period, status, issued_at, data)
  SELECT format('4eeeeeee-eeee-4%s-8000-4eee%08s', lpad(to_hex((g - 1) % 6 + 1), 3, '0'), lpad(to_hex((g - 1) * 40 + e), 8, '0'))::uuid,
         v_company,
         format('4ddddddd-dddd-4%s-8000-4ddd%08s', lpad(to_hex((g - 1) % 6 + 1), 3, '0'), lpad(to_hex((g - 1) * 40 + e), 8, '0'))::uuid,
         format('4bbbbbbb-bbbb-4%s-8000-4bbb%08s', lpad(to_hex(e), 3, '0'), lpad(to_hex(e), 8, '0'))::uuid,
         to_char(date '2026-03-01' + ((g - 1) * 31), 'Month YYYY'), 'Issued', timestamp with time zone '2026-03-29 12:00:00+03' + ((g - 1) * interval '31 days'), v_meta || jsonb_build_object('currency', 'TZS')
  FROM generate_series(1, 6) AS s(g) CROSS JOIN generate_series(1, 40) AS employees(e)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hr_attendance (id, company_id, name, status, notes, data, employee_id, attendance_date, clock_in_at, clock_out_at, worked_minutes, source)
  SELECT format('4fffffff-ffff-4%s-8000-4fff%08s', lpad(to_hex(e), 3, '0'), lpad(to_hex(e * 10 + d), 8, '0'))::uuid,
         v_company, format('DEMO Attendance Employee %03s - Day %s', e, d), CASE WHEN (e + d) % 17 = 0 THEN 'Absent' ELSE 'Present' END, 'DEMO DATA ONLY', v_meta,
         format('4bbbbbbb-bbbb-4%s-8000-4bbb%08s', lpad(to_hex(e), 3, '0'), lpad(to_hex(e), 8, '0'))::uuid, date '2026-08-01' + d,
         timestamp with time zone '2026-08-01 08:00:00+03' + ((d + (e % 20)) || ' days')::interval,
         timestamp with time zone '2026-08-01 17:00:00+03' + ((d + (e % 20)) || ' days')::interval, 480, 'portal'
  FROM generate_series(1, 40) AS employees(e) CROSS JOIN generate_series(1, 5) AS days(d)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hr_leave_requests (id, company_id, name, status, notes, data, employee_id, start_date, end_date, requested_days, decision_by, decided_at, decision_note)
  SELECT format('50000000-0000-4%s-8000-5000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Leave Request %03s', g), (ARRAY['Approved','Pending','Rejected'])[1 + ((g - 1) % 3)], 'DEMO DATA ONLY', v_meta,
         format('4bbbbbbb-bbbb-4%s-8000-4bbb%08s', lpad(to_hex(1 + ((g - 1) % 40)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 40)), 8, '0'))::uuid,
         date '2026-09-01' + g, date '2026-09-03' + g, 3, v_owner, timestamp with time zone '2026-08-20 10:00:00+03', 'DEMO decision for workflow visualization'
  FROM generate_series(1, 30) AS s(g)
  ON CONFLICT DO NOTHING;

  -- Finance: four new accounts and 120 balanced posted journal batches with two lines each.
  INSERT INTO public.fin_accounts (id, company_id, account_code, account_name, account_type, normal_side, is_postable, is_cash, currency, status, created_by, updated_by, version, metadata)
  VALUES
    (v_account_cash, v_company, '8101', 'DEMO Full - Cash and Mobile Money', 'Asset', 'Debit', true, true, 'TZS', 'Active', v_owner, v_owner, 0, v_meta),
    (v_account_revenue, v_company, '8102', 'DEMO Full - Sales Revenue', 'Income', 'Credit', true, false, 'TZS', 'Active', v_owner, v_owner, 0, v_meta),
    (v_account_expense, v_company, '8103', 'DEMO Full - Operating Expense', 'Expense', 'Debit', true, false, 'TZS', 'Active', v_owner, v_owner, 0, v_meta),
    (v_account_payable, v_company, '8104', 'DEMO Full - Supplier Payable', 'Liability', 'Credit', true, false, 'TZS', 'Active', v_owner, v_owner, 0, v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.fin_journal_batches (id, company_id, batch_number, source_module, source_type, source_id, business_date, currency, status, debit_total, credit_total, posted_at, posted_by, narration, created_by, version, metadata)
  SELECT format('51111111-1111-4%s-8000-5111%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO-FULL-JB-%04s', g), 'SALES', 'Demo sale posting',
         format('40000000-0000-4%s-8000-4000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         date '2026-01-01' + g, 'TZS', 'Posted', (100000 + g * 1000), (100000 + g * 1000), timestamp with time zone '2026-01-01 12:00:00+03' + (g || ' days')::interval, v_owner,
         format('DEMO balanced posting %04s', g), v_owner, 0, v_meta
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.fin_journal_lines (id, company_id, journal_batch_id, line_no, business_date, account_id, debit, credit, currency, branch_id, description, created_by, updated_by, version, metadata)
  SELECT format('52222222-2222-4%s-8000-5222%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g * 10 + l), 8, '0'))::uuid,
         v_company, format('51111111-1111-4%s-8000-5111%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, l,
         date '2026-01-01' + g,
         CASE WHEN l = 1 THEN v_account_cash ELSE v_account_revenue END,
         CASE WHEN l = 1 THEN (100000 + g * 1000) ELSE 0 END,
         CASE WHEN l = 2 THEN (100000 + g * 1000) ELSE 0 END,
         'TZS', v_branch, format('DEMO journal line %04s/%s', g, l), v_owner, v_owner, 0, v_meta
  FROM generate_series(1, 120) AS s(g) CROSS JOIN generate_series(1, 2) AS lines(l)
  ON CONFLICT DO NOTHING;

  -- Bank/MFI/VICOBA and payments: synthetic records only, no provider calls.
  INSERT INTO public.bank_customers (id, company_id, customer_number, customer_kind, full_name, phone, email, occupation, address, national_id, risk_rating, pep_status, relationship_purpose, kyc_status, kyc_verified_at, kyc_verified_by, status, branch_id, data, created_by)
  SELECT format('53333333-3333-4%s-8000-5333%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO-BANK-CUST-%04s', g), 'INDIVIDUAL', format('DEMO Bank Customer %03s', g), format('+255730%06s', g::text), format('demo-bank-%s@example.invalid', g),
         (ARRAY['Trader','Teacher','Farmer','Engineer','Nurse'])[1 + ((g - 1) % 5)], 'Dar es Salaam', format('DEMO-NIDA-%08s', g), 'STANDARD', 'NOT_REPORTED', 'DEMO account workflow', 'VERIFIED', timestamp with time zone '2026-01-10 10:00:00+03', v_owner, 'ACTIVE', v_bank_branch,
         v_meta || jsonb_build_object('customerCode', format('DEMO-BANK-CUST-%04s', g)), v_owner
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.bank_transactions (id, company_id, name, status, amount, notes, data, transaction_number, transaction_type, channel, customer_id, fee_amount, currency, idempotency_key, provider, provider_reference, narration, initiated_by, posted_at)
  SELECT format('54444444-4444-4%s-8000-5444%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Bank Transaction %04s', g), 'POSTED', 50000 + ((g * 12500) % 900000), 'DEMO DATA ONLY - simulated ledger transaction', v_meta,
         format('DEMO-BANK-TXN-%04s', g), CASE WHEN g % 2 = 0 THEN 'CREDIT' ELSE 'DEBIT' END, (ARRAY['M-PESA','CASH','BANK_TRANSFER'])[1 + ((g - 1) % 3)],
         format('53333333-3333-4%s-8000-5333%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, 0, 'TZS', format('DEMO-BANK-IDEMP-%04s', g), 'SIMULATED_PROVIDER', format('DEMO-PROVIDER-%04s', g), 'Synthetic demo transaction', v_owner, timestamp with time zone '2026-01-15 10:00:00+03' + (g || ' days')::interval
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.mfi_clients (id, company_id, name, status, amount, notes, data)
  SELECT format('55555555-5555-4%s-8000-5555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO MFI Client %03s', g), 'Active', 0, 'DEMO DATA ONLY - no real borrower', v_meta || jsonb_build_object('clientCode', format('DEMO-MFI-%04s', g), 'phone', format('+255740%06s', g::text), 'group', (ARRAY['Umoja Women Entrepreneurs','Kijiji Farmers','Mshikamano Traders'])[1 + ((g - 1) % 3)])
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.mfi_loans (id, company_id, name, status, amount, notes, data)
  SELECT format('56666666-6666-4%s-8000-5666%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO MFI Loan %04s', g), (ARRAY['Active','Repaid','Overdue','Pending'])[1 + ((g - 1) % 4)], 250000 + ((g * 27500) % 4500000), 'DEMO DATA ONLY - simulated credit lifecycle',
         v_meta || jsonb_build_object('clientId', format('55555555-5555-4%s-8000-5555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0')), 'loanNumber', format('DEMO-MFI-LOAN-%04s', g), 'interestRate', 12, 'termMonths', 12, 'repaymentFrequency', 'MONTHLY')
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.mfi_savings (id, company_id, name, status, amount, notes, data)
  SELECT format('57777777-7777-4%s-8000-5777%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Savings Account %04s', g), 'Active', 50000 + (g * 2500), 'DEMO DATA ONLY', v_meta || jsonb_build_object('clientId', format('55555555-5555-4%s-8000-5555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0')), 'accountType', 'VOLUNTARY_SAVINGS', 'balance', 50000 + (g * 2500))
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.mfi_repayment_schedules (id, company_id, name, status, amount, notes, data)
  SELECT format('58888888-8888-4%s-8000-5888%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO MFI Schedule %04s', g), CASE WHEN g % 4 = 0 THEN 'Paid' ELSE 'Due' END, 25000 + ((g * 1350) % 180000), 'DEMO DATA ONLY', v_meta || jsonb_build_object('loanId', format('56666666-6666-4%s-8000-5666%08s', lpad(to_hex(1 + ((g - 1) % 120)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 120)), 8, '0')), 'installmentNumber', g, 'dueDate', to_char(date '2026-01-31' + ((g - 1) * 30), 'YYYY-MM-DD'))
  FROM generate_series(1, 240) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.mfi_repayments (id, company_id, name, status, amount, notes, data)
  SELECT format('59999999-9999-4%s-8000-5999%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO MFI Repayment %04s', g), CASE WHEN g % 4 = 0 THEN 'Posted' ELSE 'Pending' END, 25000 + ((g * 1350) % 180000), 'DEMO DATA ONLY', v_meta || jsonb_build_object('loanId', format('56666666-6666-4%s-8000-5666%08s', lpad(to_hex(1 + ((g - 1) % 120)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 120)), 8, '0')), 'paymentMethod', (ARRAY['Cash','M-Pesa','Bank Transfer'])[1 + ((g - 1) % 3)])
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.vicoba_members (id, company_id, name, status, amount, notes, data)
  SELECT format('5aaaaaaa-aaaa-4%s-8000-5aaa%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO VICOBA Member %03s', g), 'Active', 10000 + (g * 500), 'DEMO DATA ONLY', v_meta || jsonb_build_object('membershipNumber', format('DEMO-VICOBA-%04s', g), 'group', (ARRAY['Umoja Women Entrepreneurs','Kijiji Farmers'])[1 + ((g - 1) % 2)], 'shares', 5 + (g % 20))
  FROM generate_series(1, 80) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.vicoba_meetings (id, company_id, name, status, amount, notes, data)
  SELECT format('5bbbbbbb-bbbb-4%s-8000-5bbb%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO VICOBA Meeting %02s', g), 'Completed', 0, 'DEMO DATA ONLY', v_meta || jsonb_build_object('meetingDate', to_char(date '2026-01-05' + ((g - 1) * 7), 'YYYY-MM-DD'), 'attendanceCount', 20 + (g % 35), 'agenda', jsonb_build_array('Savings','Loan review','Welfare'))
  FROM generate_series(1, 24) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.vicoba_loans (id, company_id, name, status, amount, notes, data)
  SELECT format('5ccccccc-cccc-4%s-8000-5ccc%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO VICOBA Group Loan %03s', g), (ARRAY['Approved','Disbursed','Repaid','Overdue'])[1 + ((g - 1) % 4)], 500000 + (g * 25000), 'DEMO DATA ONLY', v_meta || jsonb_build_object('group', (ARRAY['Umoja Women Entrepreneurs','Kijiji Farmers'])[1 + ((g - 1) % 2)], 'interestRate', 10, 'termMonths', 6)
  FROM generate_series(1, 40) AS s(g)
  ON CONFLICT DO NOTHING;

  -- Projects, healthcare, school, documents, notifications and workflow demonstrations.
  INSERT INTO public.projects (id, company_id, budget, client, end_date, manager, name, start_date, status)
  SELECT format('5ddddddd-dddd-4%s-8000-5ddd%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, (1500000 + (g * 125000))::text, format('DEMO Client %03s', 1 + ((g - 1) % 150)), date '2026-12-31', 'DEMO Project Office', format('DEMO Implementation Project %02s', g), date '2026-01-01' + (g * 5), (ARRAY['Planned','Active','Completed','On Hold'])[1 + ((g - 1) % 4)]
  FROM generate_series(1, 12) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.project_tasks (id, company_id, name, status, amount, notes, data)
  SELECT format('5eeeeeee-eeee-4%s-8000-5eee%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Project Task %03s', g), (ARRAY['Todo','In Progress','Done','Blocked'])[1 + ((g - 1) % 4)], 25000 + (g * 2000), 'DEMO DATA ONLY', v_meta || jsonb_build_object('projectId', format('5ddddddd-dddd-4%s-8000-5ddd%08s', lpad(to_hex(1 + ((g - 1) % 12)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 12)), 8, '0')), 'assignee', 'DEMO Project Team')
  FROM generate_series(1, 60) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hc_patients (id, company_id, name, status, notes, data)
  SELECT format('5fffffff-ffff-4%s-8000-5fff%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Patient %03s', g), 'Active', 'DEMO DATA ONLY - no real patient', v_meta || jsonb_build_object('phone', format('+255750%06s', g::text), 'region', 'Dar es Salaam', 'consent', 'synthetic')
  FROM generate_series(1, 60) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hc_appointments (id, company_id, name, status, notes, data)
  SELECT format('60000000-0000-4%s-8000-6000%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid,
         v_company, format('DEMO Appointment %03s', g), (ARRAY['Scheduled','Completed','Cancelled'])[1 + ((g - 1) % 3)], 'DEMO DATA ONLY', v_meta || jsonb_build_object('patientId', format('5fffffff-ffff-4%s-8000-5fff%08s', lpad(to_hex(1 + ((g - 1) % 60)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 60)), 8, '0')), 'appointmentDate', to_char(date '2026-09-01' + g, 'YYYY-MM-DD'))
  FROM generate_series(1, 120) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sch_academic_years (id, company_id, name, status, notes, data)
  VALUES ('61111111-1111-4111-8111-611111111111'::uuid, v_company, 'DEMO Academic Year 2026', 'Active', 'DEMO DATA ONLY', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sch_classes (id, company_id, name, status, notes, data)
  SELECT format('62222222-2222-4%s-8000-6222%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, v_company, format('DEMO Form %s Stream', g), 'Active', 'DEMO DATA ONLY', v_meta || jsonb_build_object('academicYearId', '61111111-1111-4111-8111-611111111111')
  FROM generate_series(1, 10) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sch_teachers (id, company_id, name, status, notes, data)
  SELECT format('63333333-3333-4%s-8000-6333%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, v_company, format('DEMO Teacher %03s', g), 'Active', 'DEMO DATA ONLY', v_meta || jsonb_build_object('subject', (ARRAY['Mathematics','English','Commerce','Biology'])[1 + ((g - 1) % 4)])
  FROM generate_series(1, 10) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sch_students (id, company_id, name, status, notes, data)
  SELECT format('64444444-4444-4%s-8000-6444%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, v_company, format('DEMO Student %03s', g), 'Active', 'DEMO DATA ONLY - no real student', v_meta || jsonb_build_object('classId', format('62222222-2222-4%s-8000-6222%08s', lpad(to_hex(1 + ((g - 1) % 10)), 3, '0'), lpad(to_hex(1 + ((g - 1) % 10)), 8, '0')), 'guardianPhone', format('+255760%06s', g::text))
  FROM generate_series(1, 80) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.documents (id, company_id, name, status, notes, data)
  SELECT format('65555555-5555-4%s-8000-6555%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, v_company, format('DEMO Reference Document %03s', g), 'Active', 'DEMO DATA ONLY - no storage object', v_meta || jsonb_build_object('documentType', (ARRAY['Invoice copy','KYC checklist','Policy reference','Training certificate'])[1 + ((g - 1) % 4)], 'fileName', format('demo-reference-%03s.pdf', g))
  FROM generate_series(1, 20) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notification_log (id, company_id, name, status, notes, data)
  SELECT format('66666666-6666-4%s-8000-6666%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, v_company, format('DEMO Notification %03s', g), (ARRAY['Delivered','Read','Queued'])[1 + ((g - 1) % 3)], 'DEMO DATA ONLY - in-app record, no external delivery', v_meta || jsonb_build_object('channel', 'in_app', 'recipient', 'synthetic_user')
  FROM generate_series(1, 60) AS s(g)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.workflows (id, company_id, condition, enabled, last_run, name, steps, trigger_type)
  SELECT format('67777777-7777-4%s-8000-6777%08s', lpad(to_hex(g), 3, '0'), lpad(to_hex(g), 8, '0'))::uuid, v_company, (ARRAY['Invoice overdue by 7 days','Inventory below reorder point','Loan repayment due'])[1 + ((g - 1) % 3)], CASE WHEN g % 2 = 0 THEN 'true' ELSE 'false' END, 'DEMO NOT RUN', format('DEMO Workflow %02s', g), 'Record event; validate; create in-app task', 'Scheduled'
  FROM generate_series(1, 6) AS s(g)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'SMART MANAGER full synthetic demo commissioning seed applied to KMKM; marker=%', v_marker;
END $$;
