BEGIN;

DO $$
DECLARE
  v_company_id uuid := '0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6';
  v_user_id uuid := 'cfa31225-6481-4cc3-9af3-6f009a9259cb';
  v_plan_id uuid;
BEGIN
  INSERT INTO public.branches (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111122', v_company_id, 'DEMO - Dar es Salaam CBD Branch', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','city','Dar es Salaam'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.inventory_warehouses (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111124', v_company_id, 'DEMO - Central Warehouse', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','location','Dar es Salaam'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.inventory_suppliers (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111125', v_company_id, 'Kariakoo Wholesale Supplies Ltd', 'Active', 'DEMO DATA · Dar es Salaam', jsonb_build_object('demo_seed','smartmanager_demo_20260824','phone','+255 713 100 200'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.inventory_items (id, company_id, name, status, amount, notes, data)
  VALUES
    ('11111111-1111-4111-8111-111111111126', v_company_id, 'Premium Coffee Beans 1kg', 'Active', 18000, 'DEMO DATA · Stock 120 units', jsonb_build_object('demo_seed','smartmanager_demo_20260824','sku','COF-001','unit','pack','onHand',120,'reorderLevel',20,'currency','TZS')),
    ('11111111-1111-4111-8111-111111111127', v_company_id, 'Executive Office Chair', 'Active', 420000, 'DEMO DATA · Stock 18 units', jsonb_build_object('demo_seed','smartmanager_demo_20260824','sku','FUR-001','unit','piece','onHand',18,'currency','TZS'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.inventory_stock_movements (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111128', v_company_id, 'Opening stock · Premium Coffee Beans', 'Posted', 2160000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','itemId','11111111-1111-4111-8111-111111111126','quantity',120,'warehouseId','11111111-1111-4111-8111-111111111124'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.crm_contacts (id, company_id, name, status, notes, data)
  VALUES
    ('11111111-1111-4111-8111-111111111129', v_company_id, 'Mlimani Business Solutions', 'Active', 'DEMO DATA · Corporate customer', jsonb_build_object('demo_seed','smartmanager_demo_20260824','phone','+255 754 200 300','email','procurement@mlimani.example.tz','type','Customer')),
    ('11111111-1111-4111-8111-111111111130', v_company_id, 'Kariakoo Wholesale Supplies Ltd', 'Active', 'DEMO DATA · Supplier contact', jsonb_build_object('demo_seed','smartmanager_demo_20260824','phone','+255 713 100 200','type','Supplier'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sales_orders (id, company_id, customer, doc_number, order_date, owner_id, status, quotation_reference, owner_name)
  VALUES ('11111111-1111-4111-8111-111111111131', v_company_id, 'Mlimani Business Solutions', 'DEMO-SO-0001', now() - interval '12 days', v_user_id, 'Confirmed', 'DEMO-QUOTE-0001', 'Ezra Demo Owner')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sales_order_items (id, company_id, name, status, amount, notes, data, order_id, item_name, item_sku, qty, rate, sort_order)
  VALUES ('11111111-1111-4111-8111-111111111132', v_company_id, 'Coffee Beans · DEMO-SO-0001', 'Confirmed', 180000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','orderId','11111111-1111-4111-8111-111111111131'), '11111111-1111-4111-8111-111111111131', 'Premium Coffee Beans 1kg', 'COF-001', 10, 18000, 1)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sales_invoices (id, company_id, name, status, amount, notes, data, doc_number, customer, issue_date, due_date, order_id, amount_paid)
  VALUES ('11111111-1111-4111-8111-111111111133', v_company_id, 'Invoice · Mlimani Business Solutions', 'Issued', 212400, 'DEMO DATA · VAT inclusive', jsonb_build_object('demo_seed','smartmanager_demo_20260824','taxRate',18,'currency','TZS'), 'DEMO-INV-0001', 'Mlimani Business Solutions', now() - interval '11 days', now() + interval '19 days', '11111111-1111-4111-8111-111111111131', 100000)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sales_invoice_items (id, company_id, name, status, amount, notes, data, invoice_id, item_name, item_sku, qty, rate, sort_order)
  VALUES ('11111111-1111-4111-8111-111111111134', v_company_id, 'Coffee Beans · DEMO-INV-0001', 'Issued', 180000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824'), '11111111-1111-4111-8111-111111111133', 'Premium Coffee Beans 1kg', 'COF-001', 10, 18000, 1)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sales_payments (id, company_id, name, status, amount, notes, data, invoice_id, method, payment_date, reference)
  VALUES ('11111111-1111-4111-8111-111111111135', v_company_id, 'Deposit · DEMO-INV-0001', 'Captured', 100000, 'DEMO DATA · M-Pesa', jsonb_build_object('demo_seed','smartmanager_demo_20260824','provider','M-Pesa'), '11111111-1111-4111-8111-111111111133', 'M-Pesa', now() - interval '10 days', 'DEMO-MPESA-0001')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.procurement_purchase_orders (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111136', v_company_id, 'Purchase Order · Kariakoo Supplies', 'Approved', 2160000, 'DEMO DATA · Opening stock replenishment', jsonb_build_object('demo_seed','smartmanager_demo_20260824','supplierId','11111111-1111-4111-8111-111111111125','currency','TZS'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.purchase_order_items (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111137', v_company_id, 'Premium Coffee Beans 1kg · PO', 'Approved', 2160000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','purchaseOrderId','11111111-1111-4111-8111-111111111136','qty',120,'unitRate',18000))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.finance_expenses (id, company_id, amount, category, due_date, expense_date, method, status, vendor)
  VALUES ('11111111-1111-4111-8111-111111111138', v_company_id, '850000', 'Utilities', now() + interval '20 days', now() - interval '8 days', 'Bank Transfer', 'Approved', 'TANESCO · DEMO DATA')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.pos_shifts (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111139', v_company_id, 'Morning Shift · 24 Aug 2026', 'Closed', 1250000, 'DEMO DATA · TZS', jsonb_build_object('demo_seed','smartmanager_demo_20260824','openedBy',v_user_id))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.pos_transactions (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111140', v_company_id, 'POS Sale · DEMO-POS-0001', 'Completed', 118000, 'DEMO DATA · Cash and M-Pesa', jsonb_build_object('demo_seed','smartmanager_demo_20260824','shiftId','11111111-1111-4111-8111-111111111139','payments',jsonb_build_array(jsonb_build_object('method','Cash','amount',68000),jsonb_build_object('method','M-Pesa','amount',50000))))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.pos_transaction_items (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111141', v_company_id, 'Coffee Beans · DEMO-POS-0001', 'Completed', 118000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','transactionId','11111111-1111-4111-8111-111111111140','sku','COF-001','qty',6))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.departments (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111142', v_company_id, 'Hospitality Operations', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_positions (id, company_id, department_id, title, code, grade, status, description)
  VALUES ('11111111-1111-4111-8111-111111111143', v_company_id, '11111111-1111-4111-8111-111111111142', 'Operations Manager', 'OPS-MGR', 'G7', 'Active', 'DEMO DATA')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_employees (id, company_id, name, status, notes, data, profile_id, department_id, position_id, employee_number, employment_start_date)
  VALUES ('11111111-1111-4111-8111-111111111144', v_company_id, 'Asha Mwakalinga', 'Active', 'DEMO DATA · Tanzania employee', jsonb_build_object('demo_seed','smartmanager_demo_20260824','phone','+255 754 300 400','salary',2500000,'currency','TZS'), NULL, '11111111-1111-4111-8111-111111111142', '11111111-1111-4111-8111-111111111143', 'DEMO-EMP-001', current_date - 180)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_shifts (id, company_id, name, start_time, end_time, unpaid_break_minutes, timezone, status, data)
  VALUES ('11111111-1111-4111-8111-111111111145', v_company_id, 'Standard Day Shift', '08:00', '17:00', 60, 'Africa/Dar_es_Salaam', 'Active', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_attendance (id, company_id, name, status, notes, data, employee_id, attendance_date, shift_id, clock_in_at, clock_out_at, worked_minutes, source)
  VALUES ('11111111-1111-4111-8111-111111111146', v_company_id, 'Asha Mwakalinga · 23 Aug 2026', 'Present', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824'), '11111111-1111-4111-8111-111111111144', current_date - 1, '11111111-1111-4111-8111-111111111145', date_trunc('day', now() - interval '1 day') + interval '8 hours', date_trunc('day', now() - interval '1 day') + interval '17 hours', 480, 'portal')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_payroll_runs (id, company_id, name, status, amount, notes, data, period_start, period_end, currency, timezone, finance_reference)
  VALUES ('11111111-1111-4111-8111-111111111147', v_company_id, 'Payroll · August 2026', 'Approved', 2500000, 'DEMO DATA · Tanzania payroll', jsonb_build_object('demo_seed','smartmanager_demo_20260824','statutoryRules',jsonb_build_array('TZ_PAYE','NSSF','WCF','SDL')), date '2026-08-01', date '2026-08-31', 'TZS', 'Africa/Dar_es_Salaam', 'DEMO-PAYROLL-2026-08')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_payroll_items (id, company_id, payroll_run_id, employee_id, gross_pay, taxable_pay, deductions, net_pay, currency, status, data, employer_contributions, employer_cost)
  VALUES ('11111111-1111-4111-8111-111111111148', v_company_id, '11111111-1111-4111-8111-111111111147', '11111111-1111-4111-8111-111111111144', 2500000, 2500000, 340000, 2160000, 'TZS', 'Approved', jsonb_build_object('demo_seed','smartmanager_demo_20260824','paye',320000,'nssf',25000,'wcf',15000,'sdl',25000), 40000, 2540000)
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_payslips (id, company_id, payroll_item_id, employee_id, pay_period, status, issued_at, data)
  VALUES ('11111111-1111-4111-8111-111111111149', v_company_id, '11111111-1111-4111-8111-111111111148', '11111111-1111-4111-8111-111111111144', 'August 2026', 'Issued', now() - interval '2 days', jsonb_build_object('demo_seed','smartmanager_demo_20260824','currency','TZS'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hr_leave_requests (id, company_id, name, status, notes, data, employee_id, start_date, end_date, requested_days, decision_by, decided_at, decision_note)
  VALUES ('11111111-1111-4111-8111-111111111150', v_company_id, 'Annual leave · Asha Mwakalinga', 'Approved', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824'), '11111111-1111-4111-8111-111111111144', current_date + 7, current_date + 9, 3, v_user_id, now(), 'Approved for demonstration')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hospitality_properties (id, company_id, branch_id, name, code, address, timezone, currency, status, data)
  VALUES ('11111111-1111-4111-8111-111111111151', v_company_id, '11111111-1111-4111-8111-111111111122', 'DEMO - Ocean View Hotel', 'DEMO-OVH', 'Msasani Peninsula, Dar es Salaam', 'Africa/Dar_es_Salaam', 'TZS', 'Active', jsonb_build_object('demo_seed','smartmanager_demo_20260824','roomCount',24))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_room_types (id, company_id, property_id, name, code, capacity_adults, capacity_children, base_rate, currency, amenities, status, data)
  VALUES ('11111111-1111-4111-8111-111111111152', v_company_id, '11111111-1111-4111-8111-111111111151', 'Executive Sea View Room', 'ESV', 2, 1, 280000, 'TZS', jsonb_build_array('Wi-Fi','Breakfast','Sea view'), 'Active', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_rooms (id, company_id, property_id, room_type_id, room_number, floor, status, housekeeping_status, maintenance_status, data)
  VALUES ('11111111-1111-4111-8111-111111111153', v_company_id, '11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111152', '204', '2', 'Occupied', 'Clean', 'Operational', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_guests (id, company_id, profile_id, first_name, last_name, email, phone, nationality, loyalty_number, status, data)
  VALUES ('11111111-1111-4111-8111-111111111154', v_company_id, NULL, 'Neema', 'Kassim', 'neema.kassim@example.tz', '+255 754 500 600', 'Tanzanian', 'DEMO-LOYAL-001', 'Active', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_reservations (id, company_id, property_id, guest_id, room_type_id, room_id, confirmation_code, arrival_date, departure_date, adults, children, status, nightly_rate, currency, source, special_requests, checked_in_at, data)
  VALUES ('11111111-1111-4111-8111-111111111155', v_company_id, '11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111154', '11111111-1111-4111-8111-111111111152', '11111111-1111-4111-8111-111111111153', 'DEMO-RES-0001', current_date - 1, current_date + 2, 2, 0, 'Checked In', 280000, 'TZS', 'Direct', 'Late checkout requested', now() - interval '1 day', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_folios (id, company_id, property_id, reservation_id, guest_id, folio_number, status, currency, data)
  VALUES ('11111111-1111-4111-8111-111111111156', v_company_id, '11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111155', '11111111-1111-4111-8111-111111111154', 'DEMO-FOLIO-0001', 'Open', 'TZS', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_folio_lines (id, company_id, folio_id, line_type, description, quantity, unit_amount, amount, tax_amount, currency, source_table, source_record_id, data)
  VALUES ('11111111-1111-4111-8111-111111111157', v_company_id, '11111111-1111-4111-8111-111111111156', 'Room', 'Executive Sea View Room · 3 nights', 3, 280000, 840000, 151200, 'TZS', 'hospitality_reservations', '11111111-1111-4111-8111-111111111155', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_payments (id, company_id, folio_id, payment_method, amount, currency, status, reference, data)
  VALUES ('11111111-1111-4111-8111-111111111158', v_company_id, '11111111-1111-4111-8111-111111111156', 'M-Pesa', 300000, 'TZS', 'Captured', 'DEMO-MPESA-HOTEL-0001', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hospitality_housekeeping_tasks (id, company_id, property_id, room_id, task_type, status, due_at, completed_at, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111159', v_company_id, '11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111153', 'Daily Service', 'Completed', now() - interval '1 day', now() - interval '1 day', 'DEMO DATA · Ocean View Hotel', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.restaurant_outlets (id, company_id, property_id, branch_id, name, code, timezone, currency, tax_rate, service_charge_rate, status, data)
  VALUES ('11111111-1111-4111-8111-111111111160', v_company_id, '11111111-1111-4111-8111-111111111151', '11111111-1111-4111-8111-111111111122', 'DEMO - Baobab Bistro', 'DEMO-BB', 'Africa/Dar_es_Salaam', 'TZS', 18, 5, 'Active', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.restaurant_tables (id, company_id, outlet_id, code, capacity, status, position, data)
  VALUES ('11111111-1111-4111-8111-111111111161', v_company_id, '11111111-1111-4111-8111-111111111160', 'T-04', 4, 'Occupied', jsonb_build_object('x',120,'y',80), jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.restaurant_menu_items (id, company_id, outlet_id, inventory_item_id, sku, name, description, price, cost_price, preparation_minutes, station, tax_rate, status, data)
  VALUES ('11111111-1111-4111-8111-111111111162', v_company_id, '11111111-1111-4111-8111-111111111160', '11111111-1111-4111-8111-111111111126', 'MENU-COF-001', 'Tanzanian Spiced Coffee', 'DEMO DATA · Freshly brewed', 12000, 3000, 8, 'Bar', 18, 'Active', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.restaurant_orders (id, company_id, outlet_id, table_id, hotel_folio_id, order_number, order_type, status, subtotal, discount_amount, tax_amount, service_charge_amount, tip_amount, total_amount, currency, data)
  VALUES ('11111111-1111-4111-8111-111111111163', v_company_id, '11111111-1111-4111-8111-111111111160', '11111111-1111-4111-8111-111111111161', '11111111-1111-4111-8111-111111111156', 'DEMO-RO-0001', 'Dine In', 'Served', 24000, 0, 4320, 1200, 0, 29520, 'TZS', jsonb_build_object('demo_seed','smartmanager_demo_20260824','menuItemId','11111111-1111-4111-8111-111111111162'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.flt_vehicles (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111164', v_company_id, 'Toyota Hiace · T 123 ABC', 'Available', 85000000, 'DEMO DATA · Tanzania fleet', jsonb_build_object('demo_seed','smartmanager_demo_20260824','registration','T 123 ABC','make','Toyota','model','Hiace','odometerKm',68420))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.flt_trips (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111165', v_company_id, 'Airport transfer · Julius Nyerere Airport', 'Completed', 75000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','vehicleId','11111111-1111-4111-8111-111111111164','distanceKm',42,'fuelCost',28000,'currency','TZS'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.flt_maintenance (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111166', v_company_id, 'Preventive service · Toyota Hiace', 'Scheduled', 420000, 'DEMO DATA · Next service at 70,000 km', jsonb_build_object('demo_seed','smartmanager_demo_20260824','vehicleId','11111111-1111-4111-8111-111111111164','serviceDueKm',70000))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.hc_patients (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111167', v_company_id, 'Baraka Mushi', 'Active', 'DEMO DATA · Tanzanian patient', jsonb_build_object('demo_seed','smartmanager_demo_20260824','phone','+255 754 600 700','region','Dar es Salaam'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.hc_appointments (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111168', v_company_id, 'General consultation · Baraka Mushi', 'Scheduled', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','patientId','11111111-1111-4111-8111-111111111167','appointmentDate',to_char(now() + interval '2 days','YYYY-MM-DD')))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.phm_drugs (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111169', v_company_id, 'Paracetamol 500mg', 'Active', 500, 'DEMO DATA · Pharmacy stock item', jsonb_build_object('demo_seed','smartmanager_demo_20260824','sku','PHM-PARA-500','unit','tablet','onHand',800))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.phm_stock (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111170', v_company_id, 'Paracetamol 500mg · Main shelf', 'Available', 400000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','drugId','11111111-1111-4111-8111-111111111169','quantity',800))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.sch_academic_years (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111171', v_company_id, 'Academic Year 2026', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','startDate','2026-01-01','endDate','2026-12-31'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sch_classes (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111172', v_company_id, 'Form 2 · Blue Stream', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','academicYearId','11111111-1111-4111-8111-111111111171'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sch_teachers (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111173', v_company_id, 'Rehema Joseph', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','subject','Mathematics'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.sch_students (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111174', v_company_id, 'Hamisi Salum', 'Active', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','classId','11111111-1111-4111-8111-111111111172','guardianPhone','+255 754 700 800'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.mfi_clients (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111175', v_company_id, 'Zawadi Mhando', 'Active', 0, 'DEMO DATA · VICOBA client', jsonb_build_object('demo_seed','smartmanager_demo_20260824','phone','+255 754 800 900','group','Umoja Women Entrepreneurs'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.mfi_loans (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111176', v_company_id, 'Working capital loan · Zawadi Mhando', 'Disbursed', 1500000, 'DEMO DATA · TZS', jsonb_build_object('demo_seed','smartmanager_demo_20260824','clientId','11111111-1111-4111-8111-111111111175','interestRate',12,'termMonths',12))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.bank_customers (id, company_id, customer_number, full_name, phone, email, address, risk_rating, pep_status, kyc_status, status, data)
  VALUES ('11111111-1111-4111-8111-111111111179', v_company_id, 'DEMO-BANK-CUST-001', 'Mlimani Business Solutions', '+255 754 200 300', 'accounts@mlimani.example.tz', 'Dar es Salaam', 'STANDARD', 'NOT_REPORTED', 'VERIFIED', 'ACTIVE', jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.bank_transactions (id, company_id, name, status, amount, notes, data, transaction_number, transaction_type, channel, customer_id, fee_amount, currency, idempotency_key, provider, provider_reference, narration, initiated_by, posted_at)
  VALUES ('11111111-1111-4111-8111-111111111180', v_company_id, 'Customer payment · Mlimani Business Solutions', 'POSTED', 100000, 'DEMO DATA · Reconciled receivable', jsonb_build_object('demo_seed','smartmanager_demo_20260824'), 'DEMO-BANK-TXN-001', 'CREDIT', 'M-PESA', '11111111-1111-4111-8111-111111111179', 0, 'TZS', 'DEMO-IDEMPOTENCY-001', 'M-Pesa', 'DEMO-MPESA-0001', 'Sales invoice deposit', v_user_id, now() - interval '10 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.fin_accounts (id, company_id, account_code, account_name, account_type, normal_side, is_postable, is_cash, currency, status, created_by, metadata)
  VALUES
    ('11111111-1111-4111-8111-111111111181', v_company_id, '1100', 'Demo Cash & Mobile Money', 'Asset', 'Debit', true, true, 'TZS', 'Active', v_user_id, jsonb_build_object('demo_seed','smartmanager_demo_20260824')),
    ('11111111-1111-4111-8111-111111111182', v_company_id, '4100', 'Demo Sales Revenue', 'Income', 'Credit', true, false, 'TZS', 'Active', v_user_id, jsonb_build_object('demo_seed','smartmanager_demo_20260824')),
    ('11111111-1111-4111-8111-111111111183', v_company_id, '5100', 'Demo Operating Expenses', 'Expense', 'Debit', true, false, 'TZS', 'Active', v_user_id, jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.fin_journal_batches (id, company_id, batch_number, source_module, source_type, source_id, business_date, currency, status, debit_total, credit_total, posted_at, posted_by, narration, created_by, metadata)
  VALUES ('11111111-1111-4111-8111-111111111184', v_company_id, 'DEMO-JB-0001', 'SALES', 'Invoice', '11111111-1111-4111-8111-111111111133', current_date - 11, 'TZS', 'Posted', 212400, 212400, now() - interval '11 days', v_user_id, 'DEMO DATA · Sales invoice posting', v_user_id, jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.fin_journal_lines (id, company_id, journal_batch_id, line_no, business_date, account_id, debit, credit, currency, description, created_by, metadata)
  VALUES
    ('11111111-1111-4111-8111-111111111185', v_company_id, '11111111-1111-4111-8111-111111111184', 1, current_date - 11, '11111111-1111-4111-8111-111111111181', 212400, 0, 'TZS', 'DEMO DATA · Accounts receivable/cash', v_user_id, jsonb_build_object('demo_seed','smartmanager_demo_20260824')),
    ('11111111-1111-4111-8111-111111111186', v_company_id, '11111111-1111-4111-8111-111111111184', 2, current_date - 11, '11111111-1111-4111-8111-111111111182', 0, 212400, 'TZS', 'DEMO DATA · Sales revenue', v_user_id, jsonb_build_object('demo_seed','smartmanager_demo_20260824'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.documents (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111187', v_company_id, 'DEMO - Business Registration Certificate', 'Active', 'DEMO DATA · Reference document', jsonb_build_object('demo_seed','smartmanager_demo_20260824','documentType','Business Registration','fileName','demo-business-registration.pdf'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.notification_rules (id, company_id, alert_type, channels)
  VALUES ('11111111-1111-4111-8111-111111111188', v_company_id, 'Low stock and payment due', 'email,push')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.notification_log (id, company_id, name, status, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111189', v_company_id, 'DEMO - Welcome to SMART MANAGER', 'Delivered', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','recipient','ezraincome@gmail.com'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.workflows (id, company_id, name, condition, enabled, trigger_type, steps)
  VALUES ('11111111-1111-4111-8111-111111111190', v_company_id, 'DEMO DATA - Invoice follow-up', 'Invoice overdue by 7 days', 'true', 'Scheduled', 'Send email; create task')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.marketing_campaigns (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111191', v_company_id, 'DEMO - Dar es Salaam SME Launch', 'Active', 1200000, 'DEMO DATA · Customer acquisition campaign', jsonb_build_object('demo_seed','smartmanager_demo_20260824','channel','WhatsApp and Instagram'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.ecommerce_products (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111192', v_company_id, 'DEMO - Office Starter Bundle', 'Published', 850000, 'DEMO DATA · Online catalogue product', jsonb_build_object('demo_seed','smartmanager_demo_20260824','sku','WEB-BUNDLE-001'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.ecommerce_orders (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111193', v_company_id, 'DEMO - Online order #1001', 'Paid', 850000, 'DEMO DATA · Delivery to Masaki', jsonb_build_object('demo_seed','smartmanager_demo_20260824','productId','11111111-1111-4111-8111-111111111192','paymentMethod','M-Pesa'))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.network_rfqs (id, company_id, name, status, amount, notes, data)
  VALUES ('11111111-1111-4111-8111-111111111194', v_company_id, 'DEMO - RFQ for office equipment', 'Open', 3200000, 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824','suppliers',jsonb_build_array('Kariakoo Wholesale Supplies Ltd')))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.support_tickets (id, company_id, customer, subject, category, priority, status, created_date, source_channel, customer_reference)
  VALUES ('11111111-1111-4111-8111-111111111195', v_company_id, 'Mlimani Business Solutions', 'DEMO - Invoice copy request', 'Billing', 'Medium', 'Open', now() - interval '2 days', 'email', 'DEMO-CASE-0001')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.support_ticket_messages (id, company_id, name, status, notes, data, ticket_id, body, sender_kind, sender_profile_id, channel, is_internal, delivery_status)
  VALUES ('11111111-1111-4111-8111-111111111196', v_company_id, 'Customer request', 'Recorded', 'DEMO DATA', jsonb_build_object('demo_seed','smartmanager_demo_20260824'), '11111111-1111-4111-8111-111111111195', 'Please send the VAT invoice PDF for DEMO-INV-0001.', 'customer', NULL, 'email', false, 'recorded')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'SMART MANAGER demo seed applied for company % and user %', v_company_id, v_user_id;
END $$;

COMMIT;
