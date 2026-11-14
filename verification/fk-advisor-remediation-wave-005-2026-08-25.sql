-- FK advisor remediation wave 005 verification SQL.
-- Review-only: verify each index exists and is valid after application; do not execute CREATE INDEX CONCURRENTLY in a transaction.
SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND indexname IN (
  "ix_fleet_audit_events_actor_profile_id_fk",
  "ix_fleet_audit_events_company_id_fk",
  "ix_fleet_vehicles_category_id_fk",
  "ix_fleet_vehicles_created_by_fk",
  "ix_hospitality_folio_lines_company_id_fk",
  "ix_hospitality_folio_lines_folio_id_fk",
  "ix_hospitality_folios_guest_id_fk",
  "ix_hospitality_folios_property_id_fk",
  "ix_hospitality_guests_profile_id_fk",
  "ix_hospitality_housekeeping_tasks_assigned_employee_id_fk",
  "ix_hospitality_housekeeping_tasks_company_id_fk",
  "ix_hospitality_housekeeping_tasks_property_id_fk",
  "ix_hospitality_housekeeping_tasks_room_id_fk",
  "ix_hospitality_payments_company_id_fk",
  "ix_hospitality_payments_folio_id_fk",
  "ix_hospitality_properties_branch_id_fk",
  "ix_hospitality_reservations_guest_id_fk",
  "ix_hospitality_reservations_property_id_fk",
  "ix_hospitality_reservations_room_id_fk",
  "ix_hospitality_reservations_room_type_id_fk",
  "ix_hospitality_room_types_company_id_fk",
  "ix_hospitality_rooms_company_id_fk",
  "ix_hospitality_rooms_room_type_id_fk",
  "ix_hr_payroll_items_employee_id_fk",
  "ix_hr_payslips_document_id_fk"
);

-- Corresponding idempotent concurrent statements for an approved external maintenance workflow:
-- fleet_audit_events.actor_profile_id <- profiles.id | rows=1 | constraint=fleet_audit_events_actor_profile_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_fleet_audit_events_actor_profile_id_fk" ON public."fleet_audit_events" ("actor_profile_id");

-- fleet_audit_events.company_id <- companies.id | rows=1 | constraint=fleet_audit_events_company_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_fleet_audit_events_company_id_fk" ON public."fleet_audit_events" ("company_id");

-- fleet_vehicles.category_id <- fleet_categories.id | rows=1 | constraint=fleet_vehicles_category_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_fleet_vehicles_category_id_fk" ON public."fleet_vehicles" ("category_id");

-- fleet_vehicles.created_by <- profiles.id | rows=1 | constraint=fleet_vehicles_created_by_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_fleet_vehicles_created_by_fk" ON public."fleet_vehicles" ("created_by");

-- hospitality_folio_lines.company_id <- companies.id | rows=1 | constraint=hospitality_folio_lines_company_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_folio_lines_company_id_fk" ON public."hospitality_folio_lines" ("company_id");

-- hospitality_folio_lines.folio_id <- hospitality_folios.id | rows=1 | constraint=hospitality_folio_lines_folio_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_folio_lines_folio_id_fk" ON public."hospitality_folio_lines" ("folio_id");

-- hospitality_folios.guest_id <- hospitality_guests.id | rows=1 | constraint=hospitality_folios_guest_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_folios_guest_id_fk" ON public."hospitality_folios" ("guest_id");

-- hospitality_folios.property_id <- hospitality_properties.id | rows=1 | constraint=hospitality_folios_property_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_folios_property_id_fk" ON public."hospitality_folios" ("property_id");

-- hospitality_guests.profile_id <- profiles.id | rows=1 | constraint=hospitality_guests_profile_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_guests_profile_id_fk" ON public."hospitality_guests" ("profile_id");

-- hospitality_housekeeping_tasks.assigned_employee_id <- hr_employees.id | rows=1 | constraint=hospitality_housekeeping_tasks_assigned_employee_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_housekeeping_tasks_assigned_employee_id_fk" ON public."hospitality_housekeeping_tasks" ("assigned_employee_id");

-- hospitality_housekeeping_tasks.company_id <- companies.id | rows=1 | constraint=hospitality_housekeeping_tasks_company_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_housekeeping_tasks_company_id_fk" ON public."hospitality_housekeeping_tasks" ("company_id");

-- hospitality_housekeeping_tasks.property_id <- hospitality_properties.id | rows=1 | constraint=hospitality_housekeeping_tasks_property_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_housekeeping_tasks_property_id_fk" ON public."hospitality_housekeeping_tasks" ("property_id");

-- hospitality_housekeeping_tasks.room_id <- hospitality_rooms.id | rows=1 | constraint=hospitality_housekeeping_tasks_room_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_housekeeping_tasks_room_id_fk" ON public."hospitality_housekeeping_tasks" ("room_id");

-- hospitality_payments.company_id <- companies.id | rows=1 | constraint=hospitality_payments_company_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_payments_company_id_fk" ON public."hospitality_payments" ("company_id");

-- hospitality_payments.folio_id <- hospitality_folios.id | rows=1 | constraint=hospitality_payments_folio_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_payments_folio_id_fk" ON public."hospitality_payments" ("folio_id");

-- hospitality_properties.branch_id <- branches.id | rows=1 | constraint=hospitality_properties_branch_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_properties_branch_id_fk" ON public."hospitality_properties" ("branch_id");

-- hospitality_reservations.guest_id <- hospitality_guests.id | rows=1 | constraint=hospitality_reservations_guest_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_reservations_guest_id_fk" ON public."hospitality_reservations" ("guest_id");

-- hospitality_reservations.property_id <- hospitality_properties.id | rows=1 | constraint=hospitality_reservations_property_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_reservations_property_id_fk" ON public."hospitality_reservations" ("property_id");

-- hospitality_reservations.room_id <- hospitality_rooms.id | rows=1 | constraint=hospitality_reservations_room_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_reservations_room_id_fk" ON public."hospitality_reservations" ("room_id");

-- hospitality_reservations.room_type_id <- hospitality_room_types.id | rows=1 | constraint=hospitality_reservations_room_type_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_reservations_room_type_id_fk" ON public."hospitality_reservations" ("room_type_id");

-- hospitality_room_types.company_id <- companies.id | rows=1 | constraint=hospitality_room_types_company_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_room_types_company_id_fk" ON public."hospitality_room_types" ("company_id");

-- hospitality_rooms.company_id <- companies.id | rows=1 | constraint=hospitality_rooms_company_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_rooms_company_id_fk" ON public."hospitality_rooms" ("company_id");

-- hospitality_rooms.room_type_id <- hospitality_room_types.id | rows=1 | constraint=hospitality_rooms_room_type_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hospitality_rooms_room_type_id_fk" ON public."hospitality_rooms" ("room_type_id");

-- hr_payroll_items.employee_id <- hr_employees.id | rows=1 | constraint=hr_payroll_items_employee_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hr_payroll_items_employee_id_fk" ON public."hr_payroll_items" ("employee_id");

-- hr_payslips.document_id <- documents.id | rows=1 | constraint=hr_payslips_document_id_fkey
CREATE INDEX CONCURRENTLY IF NOT EXISTS "ix_hr_payslips_document_id_fk" ON public."hr_payslips" ("document_id");

