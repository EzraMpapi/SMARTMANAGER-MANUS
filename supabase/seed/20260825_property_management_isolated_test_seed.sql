-- SMART MANAGER Property Management isolated test-data fixture
--
-- This file is intentionally stored under supabase/seed, NOT supabase/migrations.
-- It is never part of the normal production migration chain. Run only against an
-- isolated, disposable non-production database and an existing dedicated test company.
--
-- Required session settings before executing this file:
--   SET app.property_test_seed_environment = 'non_production';
--   SET app.allow_property_test_seed = 'true';
--   SET app.property_test_seed_confirmation = 'I_UNDERSTAND_THIS_WRITES_TEST_DATA';
--   SET app.property_test_seed_company_id = '<existing dedicated test company UUID>';
--
-- The fixture uses synthetic labels, reserved .invalid email addresses, deterministic
-- UUIDs, and ON CONFLICT DO NOTHING. It creates no auth users, profiles, companies,
-- payment-provider calls, SMS/WhatsApp calls, storage objects, or customer reviews.
-- Ledger, receipt, and audit rows are immutable by design; do not run this fixture in
-- a production project simply because a "test" company exists there.

BEGIN;

DO $$
DECLARE
  v_company uuid := nullif(current_setting('app.property_test_seed_company_id', true), '')::uuid;
  v_portfolio uuid := '10000000-0000-4000-8000-000000000001';
  v_owner uuid := '10000000-0000-4000-8000-000000000002';
  v_building uuid := '10000000-0000-4000-8000-000000000003';
  v_plot uuid := '10000000-0000-4000-8000-000000000004';
  v_agent uuid := '10000000-0000-4000-8000-000000000005';
  v_unit uuid := '10000000-0000-4000-8000-000000000006';
  v_listing uuid := '10000000-0000-4000-8000-000000000007';
  v_tenant uuid := '10000000-0000-4000-8000-000000000008';
  v_tenant_document uuid := '10000000-0000-4000-8000-000000000009';
  v_application uuid := '10000000-0000-4000-8000-000000000010';
  v_lease uuid := '10000000-0000-4000-8000-000000000011';
  v_inspection uuid := '10000000-0000-4000-8000-000000000012';
  v_inspection_item uuid := '10000000-0000-4000-8000-000000000013';
  v_handover uuid := '10000000-0000-4000-8000-000000000014';
  v_rent_schedule uuid := '10000000-0000-4000-8000-000000000015';
  v_tax_rule uuid := '10000000-0000-4000-8000-000000000016';
  v_service_charge uuid := '10000000-0000-4000-8000-000000000017';
  v_meter uuid := '10000000-0000-4000-8000-000000000018';
  v_meter_reading uuid := '10000000-0000-4000-8000-000000000019';
  v_invoice uuid := '10000000-0000-4000-8000-000000000020';
  v_invoice_line uuid := '10000000-0000-4000-8000-000000000021';
  v_payment uuid := '10000000-0000-4000-8000-000000000022';
  v_receipt uuid := '10000000-0000-4000-8000-000000000023';
  v_contractor uuid := '10000000-0000-4000-8000-000000000024';
  v_maintenance uuid := '10000000-0000-4000-8000-000000000025';
  v_work_order uuid := '10000000-0000-4000-8000-000000000026';
  v_expense uuid := '10000000-0000-4000-8000-000000000027';
  v_budget uuid := '10000000-0000-4000-8000-000000000028';
  v_insurance uuid := '10000000-0000-4000-8000-000000000029';
  v_document uuid := '10000000-0000-4000-8000-000000000030';
  v_notice uuid := '10000000-0000-4000-8000-000000000031';
  v_approval uuid := '10000000-0000-4000-8000-000000000032';
  v_ledger_debit uuid := '10000000-0000-4000-8000-000000000033';
  v_ledger_credit uuid := '10000000-0000-4000-8000-000000000034';
  v_reconciliation uuid := '10000000-0000-4000-8000-000000000035';
  v_notification uuid := '10000000-0000-4000-8000-000000000036';
  v_integration_event uuid := '10000000-0000-4000-8000-000000000037';
  v_audit uuid := '10000000-0000-4000-8000-000000000038';
  v_meta jsonb := jsonb_build_object('seed', true, 'scenario', 'isolated_property_test', 'fixture_version', 'v1');
BEGIN
  IF current_setting('app.property_test_seed_environment', true) IS DISTINCT FROM 'non_production'
    OR current_setting('app.allow_property_test_seed', true) IS DISTINCT FROM 'true'
    OR current_setting('app.property_test_seed_confirmation', true) IS DISTINCT FROM 'I_UNDERSTAND_THIS_WRITES_TEST_DATA' THEN
    RAISE EXCEPTION 'Property test seed is blocked. Explicit non-production seed session settings are required.' USING ERRCODE = '42501';
  END IF;

  IF v_company IS NULL OR NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company) THEN
    RAISE EXCEPTION 'Property test seed is blocked. app.property_test_seed_company_id must identify an existing dedicated test company.' USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.property_portfolios (id, company_id, portfolio_code, name, description, status, metadata)
  VALUES (v_portfolio, v_company, 'TEST-PM-PORT-001', 'Test Portfolio — Do Not Use Operationally', 'Synthetic fixture portfolio for isolated property workflow tests.', 'Active', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_owners (id, company_id, owner_type, legal_name, phone, email, national_id, kyc_status, status, notes, metadata)
  VALUES (v_owner, v_company, 'Company', 'Test Property Owner — No Contact', '+255000000001', 'test-owner@example.invalid', 'TEST-OWNER-0001', 'Verified', 'Active', 'Synthetic test owner only.', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_buildings (id, company_id, portfolio_id, property_code, name, property_type, address, country, region, district, floors, status, metadata)
  VALUES (v_building, v_company, v_portfolio, 'TEST-PM-BLD-001', 'Test Tower — Isolated Fixture', 'Apartment Block', '1 Test Avenue', 'Tanzania', 'Dar es Salaam', 'Test District', 4, 'Active', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_plots (id, company_id, portfolio_id, plot_code, title_number, land_use, area_sqm, address, region, district, owner_id, status, metadata)
  VALUES (v_plot, v_company, v_portfolio, 'TEST-PM-PLOT-001', 'TEST-TITLE-001', 'Residential', 800.00, '1 Test Avenue', 'Dar es Salaam', 'Test District', v_owner, 'Available', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_agents (id, company_id, agent_code, full_name, phone, email, licence_number, commission_rate, status, branch_label, metadata)
  VALUES (v_agent, v_company, 'TEST-PM-AGENT-001', 'Test Leasing Agent — No Contact', '+255000000002', 'test-agent@example.invalid', 'TEST-LIC-001', 0.0500, 'Active', 'Test Branch', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_units (id, company_id, building_id, plot_id, owner_id, unit_code, unit_type, floor_label, bedrooms, bathrooms, area_sqm, rent_amount, service_charge_amount, deposit_amount, status, furnishing, notes, metadata)
  VALUES (v_unit, v_company, v_building, v_plot, v_owner, 'TEST-PM-U-001', 'Apartment', 'Level 2', 2, 1, 68.00, 850000, 75000, 850000, 'Occupied', 'Unfurnished', 'Synthetic occupied unit for workflow tests.', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_listings (id, company_id, unit_id, agent_id, listing_type, asking_amount, commission_rate, status, available_from, published_at, expires_at, description, metadata)
  VALUES (v_listing, v_company, v_unit, v_agent, 'Rent', 850000, 0.0500, 'Published', DATE '2026-01-01', TIMESTAMPTZ '2026-01-01 08:00:00+03', DATE '2026-12-31', 'Synthetic listing used only in isolated test workflows.', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_tenants (id, company_id, tenant_code, full_name, phone, email, national_id, tin, kyc_status, status, address, emergency_contact, metadata)
  VALUES (v_tenant, v_company, 'TEST-PM-TEN-001', 'Test Tenant — No Contact', '+255000000003', 'test-tenant@example.invalid', 'TEST-TENANT-0001', 'TEST-TIN-0001', 'Verified', 'Active', 'Test Address Only', 'Test Emergency Contact', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_tenant_documents (id, company_id, tenant_id, document_type, document_number, storage_key, file_url, verification_status, expires_at, metadata)
  VALUES (v_tenant_document, v_company, v_tenant, 'National ID', 'TEST-DOC-001', 'test/property/tenant-document-001.pdf', 'https://example.invalid/test/property/tenant-document-001.pdf', 'Verified', DATE '2030-12-31', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_applications (id, company_id, application_number, unit_id, tenant_id, agent_id, requested_start_date, proposed_rent, status, decision_note, decided_at, idempotency_key, metadata)
  VALUES (v_application, v_company, 'TEST-PM-APP-001', v_unit, v_tenant, v_agent, DATE '2026-01-01', 850000, 'Approved', 'Approved for isolated workflow fixture.', TIMESTAMPTZ '2025-12-20 10:00:00+03', 'test-pm-application-001', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_leases (id, company_id, lease_number, unit_id, tenant_id, owner_id, application_id, start_date, end_date, rent_amount, service_charge_amount, deposit_amount, rent_frequency, notice_days, status, terms, approved_at)
  VALUES (v_lease, v_company, 'TEST-PM-LEASE-001', v_unit, v_tenant, v_owner, v_application, DATE '2026-01-01', DATE '2026-12-31', 850000, 75000, 850000, 'Monthly', 30, 'Active', jsonb_build_object('test_only', true, 'renewal_notice_days', 30), TIMESTAMPTZ '2025-12-21 10:00:00+03')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_inspections (id, company_id, lease_id, inspection_type, inspection_date, condition_summary, status, metadata)
  VALUES (v_inspection, v_company, v_lease, 'Move In', DATE '2026-01-01', 'Synthetic move-in inspection completed for the test fixture.', 'Completed', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_inspection_items (id, company_id, inspection_id, area_name, condition, notes, estimated_cost)
  VALUES (v_inspection_item, v_company, v_inspection, 'Living Room', 'Good', 'Synthetic inspection item.', 0)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_handover_records (id, company_id, lease_id, handover_type, handover_date, keys_count, meter_snapshot, signed_by_tenant, signed_by_manager, notes)
  VALUES (v_handover, v_company, v_lease, 'Move In', DATE '2026-01-01', 2, jsonb_build_object('electricity', 100.0000), true, true, 'Synthetic move-in handover.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_rent_schedules (id, company_id, lease_id, next_invoice_date, frequency, active)
  VALUES (v_rent_schedule, v_company, v_lease, DATE '2026-09-01', 'Monthly', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_tax_fee_rules (id, company_id, code, name, applies_to, rate, flat_amount, status)
  VALUES (v_tax_rule, v_company, 'TEST-PM-TAX-001', 'Test Rent Levy', 'Rent', 0.0000, 0, 'Active')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_service_charges (id, company_id, unit_id, name, amount, frequency, status)
  VALUES (v_service_charge, v_company, v_unit, 'Test Security and Cleaning', 75000, 'Monthly', 'Active')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_utility_meters (id, company_id, unit_id, utility_type, meter_number, unit_of_measure, rate, status)
  VALUES (v_meter, v_company, v_unit, 'Electricity', 'TEST-METER-001', 'kWh', 450.0000, 'Active')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_meter_readings (id, company_id, meter_id, reading_date, reading_value, previous_value, consumption, source, notes)
  VALUES (v_meter_reading, v_company, v_meter, DATE '2026-08-01', 125.0000, 100.0000, 25.0000, 'Manual', 'Synthetic reading.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_invoices (id, company_id, invoice_number, lease_id, tenant_id, unit_id, invoice_type, period_start, period_end, issue_date, due_date, subtotal, tax_amount, late_fee_amount, total_amount, amount_paid, status, idempotency_key, notes)
  VALUES (v_invoice, v_company, 'TEST-PM-INV-001', v_lease, v_tenant, v_unit, 'Rent', DATE '2026-08-01', DATE '2026-08-31', DATE '2026-08-01', DATE '2026-08-05', 850000, 0, 0, 850000, 850000, 'Paid', 'test-pm-invoice-001', 'Synthetic paid rent invoice.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_invoice_lines (id, company_id, invoice_id, line_type, description, quantity, unit_amount, line_total, account_code)
  VALUES (v_invoice_line, v_company, v_invoice, 'Rent', 'Synthetic August rent', 1, 850000, 850000, 'RENT-INCOME')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_payments (id, company_id, payment_number, invoice_id, tenant_id, amount, payment_method, provider_code, provider_reference, status, idempotency_key, paid_at, metadata)
  VALUES (v_payment, v_company, 'TEST-PM-PAY-001', v_invoice, v_tenant, 850000, 'Mobile Money', 'TEST_PROVIDER', 'TEST-REF-001', 'Posted', 'test-pm-payment-001', TIMESTAMPTZ '2026-08-03 09:00:00+03', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_receipts (id, company_id, payment_id, receipt_number, channel, recipient_phone, metadata)
  VALUES (v_receipt, v_company, v_payment, 'TEST-PM-RCT-001', 'In App', '+255000000003', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_contractors (id, company_id, contractor_code, name, phone, email, trade, tax_number, status)
  VALUES (v_contractor, v_company, 'TEST-PM-CON-001', 'Test Electrical Contractor — No Contact', '+255000000004', 'test-contractor@example.invalid', 'Electrical', 'TEST-TAX-001', 'Active')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_maintenance_requests (id, company_id, request_number, unit_id, lease_id, tenant_id, category, priority, title, description, status, requested_at)
  VALUES (v_maintenance, v_company, 'TEST-PM-MNT-001', v_unit, v_lease, v_tenant, 'Electrical', 'Medium', 'Synthetic lighting check', 'Synthetic maintenance request for an isolated test workflow.', 'Completed', TIMESTAMPTZ '2026-08-10 08:00:00+03')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_work_orders (id, company_id, work_order_number, request_id, contractor_id, estimated_cost, actual_cost, status, due_date, completion_note)
  VALUES (v_work_order, v_company, 'TEST-PM-WO-001', v_maintenance, v_contractor, 120000, 110000, 'Completed', DATE '2026-08-12', 'Synthetic work order completed.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_expenses (id, company_id, expense_number, property_id, unit_id, work_order_id, category, description, amount, expense_date, status, payment_method, payment_reference, approved_at)
  VALUES (v_expense, v_company, 'TEST-PM-EXP-001', v_building, v_unit, v_work_order, 'Maintenance', 'Synthetic electrical maintenance cost.', 110000, DATE '2026-08-12', 'Paid', 'Bank Transfer', 'TEST-EXP-REF-001', TIMESTAMPTZ '2026-08-13 10:00:00+03')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_budgets (id, company_id, portfolio_id, fiscal_year, category, budget_amount, status, approved_at)
  VALUES (v_budget, v_company, v_portfolio, 2026, 'Maintenance', 2500000, 'Approved', TIMESTAMPTZ '2026-01-01 08:00:00+03')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_insurances (id, company_id, property_id, unit_id, insurer, policy_number, cover_type, premium, start_date, end_date, status, notes)
  VALUES (v_insurance, v_company, v_building, v_unit, 'Test Insurer', 'TEST-PM-INS-001', 'Building and Contents', 300000, DATE '2026-01-01', DATE '2026-12-31', 'Active', 'Synthetic coverage record.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_documents (id, company_id, entity_type, entity_id, document_type, title, storage_key, file_url, document_date, verification_status, metadata)
  VALUES (v_document, v_company, 'Lease', v_lease, 'Lease Agreement', 'Synthetic Lease Agreement', 'test/property/lease-001.pdf', 'https://example.invalid/test/property/lease-001.pdf', DATE '2026-01-01', 'Verified', v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_notices (id, company_id, lease_id, tenant_id, notice_type, title, body, notice_date, effective_date, status)
  VALUES (v_notice, v_company, v_lease, v_tenant, 'Rent Due', 'Synthetic rent reminder', 'This is a synthetic isolated-test notification. Do not contact anyone.', DATE '2026-08-01', DATE '2026-08-05', 'Issued')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_approvals (id, company_id, entity_type, entity_id, action, status, note, requested_at, decided_at)
  VALUES (v_approval, v_company, 'Expense', v_expense, 'Approve expense', 'Approved', 'Synthetic approval record.', TIMESTAMPTZ '2026-08-12 08:00:00+03', TIMESTAMPTZ '2026-08-13 10:00:00+03')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_ledger_entries (id, company_id, source_type, source_id, account_code, entry_type, amount, metadata)
  VALUES
    (v_ledger_debit, v_company, 'Payment', v_payment, 'CASH-ON-HAND', 'Debit', 850000, v_meta),
    (v_ledger_credit, v_company, 'Payment', v_payment, 'RENT-INCOME', 'Credit', 850000, v_meta)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_reconciliations (id, company_id, payment_id, invoice_id, expected_amount, actual_amount, variance, status, reviewed_at, notes)
  VALUES (v_reconciliation, v_company, v_payment, v_invoice, 850000, 850000, 0, 'Matched', TIMESTAMPTZ '2026-08-03 10:00:00+03', 'Synthetic matched reconciliation.')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_notifications (id, company_id, tenant_id, notice_id, notification_type, title, body, channel, status, scheduled_for, sent_at, dedupe_key)
  VALUES (v_notification, v_company, v_tenant, v_notice, 'Rent Reminder', 'Synthetic rent reminder', 'Synthetic in-app notification only.', 'In App', 'Sent', TIMESTAMPTZ '2026-08-01 08:00:00+03', TIMESTAMPTZ '2026-08-01 08:01:00+03', 'test-pm-notification-001')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_integration_events (id, company_id, target_module, entity_type, entity_id, event_type, status, payload)
  VALUES (v_integration_event, v_company, 'Finance', 'Invoice', v_invoice, 'test.invoice.paid', 'Acknowledged', jsonb_build_object('seed', true, 'invoice_id', v_invoice, 'amount', 850000))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.property_audit_log (id, company_id, action, entity_type, entity_id, details)
  VALUES (v_audit, v_company, 'seeded', 'PropertyFixture', v_portfolio, jsonb_build_object('seed', true, 'message', 'Synthetic isolated property fixture created.'))
  ON CONFLICT DO NOTHING;
END $$;

COMMIT;
