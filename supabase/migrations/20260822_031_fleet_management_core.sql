-- Smart Manager Fleet Management Core
-- Typed tenant-scoped operations; legacy flt_* JSON tables remain read-only history.

BEGIN;

CREATE TABLE IF NOT EXISTS public.fleet_vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, description text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  registration_number text NOT NULL, ownership_type text NOT NULL DEFAULT 'Owned' CHECK (ownership_type IN ('Owned','Leased','Hired')),
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Assigned','In Transit','Maintenance','Out of Service','Retired')),
  category_id uuid REFERENCES public.fleet_vehicle_categories(id) ON DELETE SET NULL,
  make text NOT NULL, model text NOT NULL, model_year integer CHECK (model_year BETWEEN 1950 AND 2100), vin text,
  engine_number text, fuel_type text NOT NULL DEFAULT 'Diesel' CHECK (fuel_type IN ('Petrol','Diesel','Electric','Hybrid','Gas','Other')),
  odometer_km numeric(14,2) NOT NULL DEFAULT 0 CHECK (odometer_km >= 0), seats integer CHECK (seats > 0),
  acquisition_type text, acquisition_date date, acquisition_cost numeric(16,2) CHECK (acquisition_cost >= 0),
  lease_end_date date, home_branch text, cost_center text, notes text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, registration_number), UNIQUE(company_id, vin)
);
CREATE TABLE IF NOT EXISTS public.fleet_vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('Registration','Insurance','Road Licence','Lease','Inspection','Other')),
  document_number text, issuer text, issued_on date, expires_on date, document_url text, status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Expired','Cancelled')), notes text,
  created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fleet_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL, profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL, mobile_number text, licence_number text NOT NULL, licence_class text, licence_expires_on date NOT NULL,
  status text NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Assigned','Suspended','Inactive')), safety_score numeric(5,2), notes text,
  created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, licence_number)
);
CREATE TABLE IF NOT EXISTS public.fleet_driver_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE, driver_id uuid NOT NULL REFERENCES public.fleet_drivers(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL DEFAULT now(), ends_at timestamptz, status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Ended','Cancelled')), notes text,
  assigned_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS fleet_active_vehicle_assignment_uniq ON public.fleet_driver_assignments(vehicle_id) WHERE status = 'Active';
CREATE UNIQUE INDEX IF NOT EXISTS fleet_active_driver_assignment_uniq ON public.fleet_driver_assignments(driver_id) WHERE status = 'Active';
CREATE TABLE IF NOT EXISTS public.fleet_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, origin text NOT NULL, destination text NOT NULL, planned_distance_km numeric(14,2) CHECK (planned_distance_km >= 0),
  expected_duration_minutes integer CHECK (expected_duration_minutes >= 0), toll_budget numeric(16,2) NOT NULL DEFAULT 0 CHECK (toll_budget >= 0), active boolean NOT NULL DEFAULT true,
  notes text, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, name)
);
CREATE TABLE IF NOT EXISTS public.fleet_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  trip_number text NOT NULL, vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.fleet_drivers(id) ON DELETE RESTRICT, route_id uuid REFERENCES public.fleet_routes(id) ON DELETE SET NULL,
  purpose text NOT NULL, customer_reference text, dispatch_status text NOT NULL DEFAULT 'Draft' CHECK (dispatch_status IN ('Draft','Awaiting Approval','Approved','Dispatched','In Progress','Completed','Cancelled')),
  planned_departure_at timestamptz, dispatched_at timestamptz, completed_at timestamptz, origin text, destination text,
  start_odometer_km numeric(14,2), end_odometer_km numeric(14,2), distance_km numeric(14,2) GENERATED ALWAYS AS (CASE WHEN end_odometer_km IS NOT NULL AND start_odometer_km IS NOT NULL THEN end_odometer_km - start_odometer_km ELSE NULL END) STORED,
  toll_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (toll_cost >= 0), parking_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (parking_cost >= 0), other_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (other_cost >= 0),
  approved_by uuid REFERENCES public.profiles(id), created_by uuid REFERENCES public.profiles(id), notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, trip_number), CHECK (end_odometer_km IS NULL OR start_odometer_km IS NULL OR end_odometer_km >= start_odometer_km)
);
CREATE TABLE IF NOT EXISTS public.fleet_fuel_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  card_number_masked text NOT NULL, issuer text, vehicle_id uuid REFERENCES public.fleet_vehicles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Blocked','Expired')), daily_limit numeric(16,2), monthly_limit numeric(16,2), expires_on date, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, card_number_masked)
);
CREATE TABLE IF NOT EXISTS public.fleet_fuel_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT, trip_id uuid REFERENCES public.fleet_trips(id) ON DELETE SET NULL,
  fuel_card_id uuid REFERENCES public.fleet_fuel_cards(id) ON DELETE SET NULL, transaction_at timestamptz NOT NULL DEFAULT now(),
  station_name text, litres numeric(14,3) NOT NULL CHECK (litres > 0), unit_price numeric(16,2) NOT NULL CHECK (unit_price >= 0), total_cost numeric(16,2) GENERATED ALWAYS AS (round(litres * unit_price, 2)) STORED,
  odometer_km numeric(14,2) NOT NULL CHECK (odometer_km >= 0), receipt_url text, payment_reference text, notes text, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fleet_workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL, contact_name text, phone text, email text, address text, supplier_id uuid, status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, name)
);
CREATE TABLE IF NOT EXISTS public.fleet_maintenance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE, name text NOT NULL, maintenance_type text NOT NULL CHECK (maintenance_type IN ('Preventive','Corrective','Inspection','Tyres','Other')),
  interval_km numeric(14,2) CHECK (interval_km > 0), interval_days integer CHECK (interval_days > 0), last_completed_odometer_km numeric(14,2), last_completed_on date,
  next_due_odometer_km numeric(14,2), next_due_on date, active boolean NOT NULL DEFAULT true, notes text, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fleet_maintenance_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_number text NOT NULL, vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT, plan_id uuid REFERENCES public.fleet_maintenance_plans(id) ON DELETE SET NULL,
  workshop_id uuid REFERENCES public.fleet_workshops(id) ON DELETE SET NULL, maintenance_type text NOT NULL CHECK (maintenance_type IN ('Preventive','Corrective','Inspection','Tyres','Other')),
  status text NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested','Awaiting Approval','Approved','In Service','Completed','Rejected','Cancelled')),
  priority text NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low','Normal','High','Critical')), requested_on date NOT NULL DEFAULT current_date, due_on date, odometer_km numeric(14,2), estimated_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  approved_by uuid REFERENCES public.profiles(id), completed_on date, notes text, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, job_number)
);
CREATE TABLE IF NOT EXISTS public.fleet_service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  maintenance_job_id uuid NOT NULL REFERENCES public.fleet_maintenance_jobs(id) ON DELETE CASCADE, vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT,
  service_date date NOT NULL DEFAULT current_date, odometer_km numeric(14,2) NOT NULL CHECK (odometer_km >= 0), labour_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (labour_cost >= 0), parts_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (parts_cost >= 0),
  total_cost numeric(16,2) GENERATED ALWAYS AS (labour_cost + parts_cost) STORED, invoice_reference text, notes text, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fleet_spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL, part_number text, name text NOT NULL, quantity_on_hand numeric(14,3) NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0), reorder_level numeric(14,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0), average_cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (average_cost >= 0), location text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, part_number)
);
CREATE TABLE IF NOT EXISTS public.fleet_tyres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE, position text NOT NULL, brand text, size text, serial_number text, installed_on date, installed_odometer_km numeric(14,2), expected_life_km numeric(14,2), status text NOT NULL DEFAULT 'In Service' CHECK (status IN ('In Service','Stored','Retired')), notes text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(vehicle_id, position, status)
);
CREATE TABLE IF NOT EXISTS public.fleet_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT, driver_id uuid REFERENCES public.fleet_drivers(id) ON DELETE SET NULL, trip_id uuid REFERENCES public.fleet_trips(id) ON DELETE SET NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('Accident','Fine','Toll','Parking','Breakdown','Other')), occurred_at timestamptz NOT NULL DEFAULT now(), location text, description text NOT NULL,
  cost numeric(16,2) NOT NULL DEFAULT 0 CHECK (cost >= 0), status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Under Review','Closed')), evidence_url text, created_by uuid REFERENCES public.profiles(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fleet_telematics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE CASCADE, provider text NOT NULL, external_event_id text NOT NULL,
  captured_at timestamptz NOT NULL, latitude numeric(10,7), longitude numeric(10,7), speed_kph numeric(10,2), odometer_km numeric(14,2), ignition_on boolean, payload jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, provider, external_event_id)
);
CREATE TABLE IF NOT EXISTS public.fleet_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_key text NOT NULL, severity text NOT NULL CHECK (severity IN ('Info','Warning','Critical')), alert_type text NOT NULL, entity_type text NOT NULL, entity_id uuid, title text NOT NULL, body text NOT NULL,
  due_on date, status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Acknowledged','Resolved')), acknowledged_by uuid REFERENCES public.profiles(id), acknowledged_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, alert_key)
);
CREATE TABLE IF NOT EXISTS public.fleet_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id), action text NOT NULL, entity_type text NOT NULL, entity_id uuid, before_data jsonb, after_data jsonb, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fleet_vehicles_company_status_idx ON public.fleet_vehicles(company_id, status);
CREATE INDEX IF NOT EXISTS fleet_trips_company_status_idx ON public.fleet_trips(company_id, dispatch_status, created_at DESC);
CREATE INDEX IF NOT EXISTS fleet_fuel_company_vehicle_idx ON public.fleet_fuel_transactions(company_id, vehicle_id, transaction_at DESC);
CREATE INDEX IF NOT EXISTS fleet_jobs_company_status_idx ON public.fleet_maintenance_jobs(company_id, status, due_on);
CREATE INDEX IF NOT EXISTS fleet_alerts_company_status_idx ON public.fleet_alerts(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS fleet_docs_company_expiry_idx ON public.fleet_vehicle_documents(company_id, expires_on);
CREATE INDEX IF NOT EXISTS fleet_drivers_company_expiry_idx ON public.fleet_drivers(company_id, licence_expires_on);

CREATE OR REPLACE FUNCTION public.fleet_is_manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND coalesce(p.is_active, true) AND lower(coalesce(p.role,'')) IN ('super administrator','platform administrator','organization owner','owner','ceo','cfo','finance manager','operations manager','fleet manager','admin'))
  OR EXISTS(SELECT 1 FROM public.company_memberships m JOIN public.profiles p ON p.id=m.user_id AND coalesce(p.is_active,true) WHERE m.user_id=auth.uid() AND m.company_id=public.current_company_id() AND lower(coalesce(m.role,'')) IN ('super administrator','platform administrator','organization owner','owner','ceo','cfo','finance manager','operations manager','fleet manager','admin'));
$$;
CREATE OR REPLACE FUNCTION public.fleet_require_manager()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN IF auth.uid() IS NULL OR NOT public.fleet_is_manager() THEN RAISE EXCEPTION 'A current workspace Fleet Manager session is required.' USING ERRCODE='42501'; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.fleet_audit(p_action text,p_entity_type text,p_entity_id uuid,p_before jsonb DEFAULT NULL,p_after jsonb DEFAULT NULL,p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN INSERT INTO public.fleet_audit_events(company_id,actor_profile_id,action,entity_type,entity_id,before_data,after_data,metadata) VALUES(public.current_company_id(),auth.uid(),p_action,p_entity_type,p_entity_id,p_before,p_after,coalesce(p_metadata,'{}'::jsonb)); END; $$;

CREATE OR REPLACE FUNCTION public.fleet_snapshot()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_company uuid:=public.current_company_id();
BEGIN
 PERFORM public.fleet_require_manager();
 RETURN jsonb_build_object('companyId',v_company,
  'vehicles',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.fleet_vehicles WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'categories',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM (SELECT * FROM public.fleet_vehicle_categories WHERE company_id=v_company)x),'[]'::jsonb),
  'drivers',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.full_name) FROM (SELECT * FROM public.fleet_drivers WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'assignments',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.starts_at DESC) FROM (SELECT * FROM public.fleet_driver_assignments WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'routes',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM (SELECT * FROM public.fleet_routes WHERE company_id=v_company)x),'[]'::jsonb),
  'trips',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.fleet_trips WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'fuelTransactions',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.transaction_at DESC) FROM (SELECT * FROM public.fleet_fuel_transactions WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'maintenanceJobs',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.fleet_maintenance_jobs WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'serviceRecords',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.service_date DESC) FROM (SELECT * FROM public.fleet_service_records WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'documents',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.expires_on NULLS LAST) FROM (SELECT * FROM public.fleet_vehicle_documents WHERE company_id=v_company LIMIT 500)x),'[]'::jsonb),
  'alerts',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM (SELECT * FROM public.fleet_alerts WHERE company_id=v_company LIMIT 200)x),'[]'::jsonb),
  'incidents',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.occurred_at DESC) FROM (SELECT * FROM public.fleet_incidents WHERE company_id=v_company LIMIT 200)x),'[]'::jsonb));
END; $$;

CREATE OR REPLACE FUNCTION public.fleet_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE c uuid:=public.current_company_id(); v_id uuid; v_vehicle public.fleet_vehicles%ROWTYPE; v_driver public.fleet_drivers%ROWTYPE; v_trip public.fleet_trips%ROWTYPE; v_job public.fleet_maintenance_jobs%ROWTYPE; v_now timestamptz:=now();
BEGIN
 PERFORM public.fleet_require_manager();
 IF p_action='REGISTER_VEHICLE' THEN
  INSERT INTO public.fleet_vehicles(company_id,registration_number,ownership_type,category_id,make,model,model_year,vin,engine_number,fuel_type,odometer_km,seats,acquisition_type,acquisition_date,acquisition_cost,lease_end_date,home_branch,cost_center,notes,created_by)
  VALUES(c,upper(trim(p_payload->>'registrationNumber')),coalesce(p_payload->>'ownershipType','Owned'),nullif(p_payload->>'categoryId','')::uuid,trim(p_payload->>'make'),trim(p_payload->>'model'),nullif(p_payload->>'modelYear','')::integer,nullif(trim(p_payload->>'vin'),''),nullif(trim(p_payload->>'engineNumber'),''),coalesce(p_payload->>'fuelType','Diesel'),coalesce(nullif(p_payload->>'odometerKm','')::numeric,0),nullif(p_payload->>'seats','')::integer,nullif(p_payload->>'acquisitionType',''),nullif(p_payload->>'acquisitionDate','')::date,nullif(p_payload->>'acquisitionCost','')::numeric,nullif(p_payload->>'leaseEndDate','')::date,nullif(p_payload->>'homeBranch',''),nullif(p_payload->>'costCenter',''),nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id;
  PERFORM public.fleet_audit('VEHICLE_REGISTERED','Vehicle',v_id,NULL,to_jsonb((SELECT x FROM public.fleet_vehicles x WHERE x.id=v_id))); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='REGISTER_DRIVER' THEN
  INSERT INTO public.fleet_drivers(company_id,employee_id,full_name,mobile_number,licence_number,licence_class,licence_expires_on,status,notes,created_by) VALUES(c,nullif(p_payload->>'employeeId','')::uuid,trim(p_payload->>'fullName'),nullif(p_payload->>'mobileNumber',''),upper(trim(p_payload->>'licenceNumber')),nullif(p_payload->>'licenceClass',''),(p_payload->>'licenceExpiresOn')::date,'Available',nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id;
  PERFORM public.fleet_audit('DRIVER_REGISTERED','Driver',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='ASSIGN_DRIVER' THEN
  SELECT * INTO v_vehicle FROM public.fleet_vehicles WHERE id=(p_payload->>'vehicleId')::uuid AND company_id=c FOR UPDATE; IF NOT FOUND OR v_vehicle.status IN ('Maintenance','Out of Service','Retired') THEN RAISE EXCEPTION 'Vehicle is unavailable for assignment.' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_driver FROM public.fleet_drivers WHERE id=(p_payload->>'driverId')::uuid AND company_id=c FOR UPDATE; IF NOT FOUND OR v_driver.status IN ('Suspended','Inactive') OR v_driver.licence_expires_on < current_date THEN RAISE EXCEPTION 'Driver does not have a valid active licence.' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.fleet_driver_assignments WHERE company_id=c AND (vehicle_id=v_vehicle.id OR driver_id=v_driver.id) AND status='Active') THEN RAISE EXCEPTION 'Vehicle or driver already has an active assignment.' USING ERRCODE='23505'; END IF;
  INSERT INTO public.fleet_driver_assignments(company_id,vehicle_id,driver_id,notes,assigned_by) VALUES(c,v_vehicle.id,v_driver.id,nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id;
  UPDATE public.fleet_vehicles SET status='Assigned',updated_at=v_now WHERE id=v_vehicle.id; UPDATE public.fleet_drivers SET status='Assigned',updated_at=v_now WHERE id=v_driver.id; PERFORM public.fleet_audit('DRIVER_ASSIGNED','DriverAssignment',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='CREATE_ROUTE' THEN
  INSERT INTO public.fleet_routes(company_id,name,origin,destination,planned_distance_km,expected_duration_minutes,toll_budget,notes,created_by) VALUES(c,trim(p_payload->>'name'),trim(p_payload->>'origin'),trim(p_payload->>'destination'),nullif(p_payload->>'plannedDistanceKm','')::numeric,nullif(p_payload->>'expectedDurationMinutes','')::integer,coalesce(nullif(p_payload->>'tollBudget','')::numeric,0),nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id; PERFORM public.fleet_audit('ROUTE_CREATED','Route',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='DISPATCH_TRIP' THEN
  SELECT * INTO v_vehicle FROM public.fleet_vehicles WHERE id=(p_payload->>'vehicleId')::uuid AND company_id=c FOR UPDATE; SELECT * INTO v_driver FROM public.fleet_drivers WHERE id=(p_payload->>'driverId')::uuid AND company_id=c FOR UPDATE;
  IF NOT FOUND OR v_vehicle.status NOT IN ('Available','Assigned') THEN RAISE EXCEPTION 'Vehicle is not available to dispatch.' USING ERRCODE='22023'; END IF; IF v_driver.licence_expires_on < current_date OR v_driver.status IN ('Suspended','Inactive') THEN RAISE EXCEPTION 'Driver licence is invalid for dispatch.' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.fleet_driver_assignments WHERE company_id=c AND vehicle_id=v_vehicle.id AND driver_id=v_driver.id AND status='Active') THEN RAISE EXCEPTION 'Driver must be actively assigned to this vehicle before dispatch.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.fleet_trips(company_id,trip_number,vehicle_id,driver_id,route_id,purpose,customer_reference,dispatch_status,planned_departure_at,dispatched_at,origin,destination,start_odometer_km,toll_cost,parking_cost,other_cost,approved_by,created_by,notes) VALUES(c,'FLT-'||to_char(v_now,'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),v_vehicle.id,v_driver.id,nullif(p_payload->>'routeId','')::uuid,trim(p_payload->>'purpose'),nullif(p_payload->>'customerReference',''),'Dispatched',nullif(p_payload->>'plannedDepartureAt','')::timestamptz,v_now,nullif(p_payload->>'origin',''),nullif(p_payload->>'destination',''),v_vehicle.odometer_km,0,0,0,auth.uid(),auth.uid(),nullif(p_payload->>'notes','')) RETURNING * INTO v_trip;
  UPDATE public.fleet_vehicles SET status='In Transit',updated_at=v_now WHERE id=v_vehicle.id; PERFORM public.fleet_audit('TRIP_DISPATCHED','Trip',v_trip.id,NULL,to_jsonb(v_trip)); RETURN jsonb_build_object('id',v_trip.id,'tripNumber',v_trip.trip_number);
 ELSIF p_action='COMPLETE_TRIP' THEN
  SELECT * INTO v_trip FROM public.fleet_trips WHERE id=(p_payload->>'tripId')::uuid AND company_id=c FOR UPDATE; IF NOT FOUND OR v_trip.dispatch_status NOT IN ('Dispatched','In Progress') THEN RAISE EXCEPTION 'Only a dispatched trip can be completed.' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_vehicle FROM public.fleet_vehicles WHERE id=v_trip.vehicle_id FOR UPDATE; IF coalesce(nullif(p_payload->>'endOdometerKm','')::numeric,-1) < v_trip.start_odometer_km THEN RAISE EXCEPTION 'End odometer cannot be lower than trip start odometer.' USING ERRCODE='22023'; END IF;
  UPDATE public.fleet_trips SET dispatch_status='Completed',completed_at=v_now,end_odometer_km=(p_payload->>'endOdometerKm')::numeric,toll_cost=coalesce(nullif(p_payload->>'tollCost','')::numeric,0),parking_cost=coalesce(nullif(p_payload->>'parkingCost','')::numeric,0),other_cost=coalesce(nullif(p_payload->>'otherCost','')::numeric,0),notes=coalesce(nullif(p_payload->>'notes',''),notes),updated_at=v_now WHERE id=v_trip.id RETURNING * INTO v_trip;
  UPDATE public.fleet_vehicles SET odometer_km=v_trip.end_odometer_km,status='Assigned',updated_at=v_now WHERE id=v_vehicle.id;
  INSERT INTO public.journal_entries(company_id,name,status,amount,notes,data) VALUES(c,'Fleet trip cost: '||v_trip.trip_number,'Posted',v_trip.toll_cost+v_trip.parking_cost+v_trip.other_cost,'Fleet trip completion',jsonb_build_object('source','fleet_trip','trip_id',v_trip.id,'distance_km',v_trip.distance_km));
  PERFORM public.fleet_audit('TRIP_COMPLETED','Trip',v_trip.id); RETURN jsonb_build_object('id',v_trip.id,'distanceKm',v_trip.distance_km);
 ELSIF p_action='LOG_FUEL' THEN
  SELECT * INTO v_vehicle FROM public.fleet_vehicles WHERE id=(p_payload->>'vehicleId')::uuid AND company_id=c FOR UPDATE; IF NOT FOUND OR nullif(p_payload->>'odometerKm','')::numeric < v_vehicle.odometer_km THEN RAISE EXCEPTION 'Fuel odometer cannot be lower than the current vehicle odometer.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.fleet_fuel_transactions(company_id,vehicle_id,trip_id,fuel_card_id,transaction_at,station_name,litres,unit_price,odometer_km,receipt_url,payment_reference,notes,created_by) VALUES(c,v_vehicle.id,nullif(p_payload->>'tripId','')::uuid,nullif(p_payload->>'fuelCardId','')::uuid,coalesce(nullif(p_payload->>'transactionAt','')::timestamptz,v_now),nullif(p_payload->>'stationName',''),(p_payload->>'litres')::numeric,(p_payload->>'unitPrice')::numeric,(p_payload->>'odometerKm')::numeric,nullif(p_payload->>'receiptUrl',''),nullif(p_payload->>'paymentReference',''),nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id;
  UPDATE public.fleet_vehicles SET odometer_km=greatest(odometer_km,(p_payload->>'odometerKm')::numeric),updated_at=v_now WHERE id=v_vehicle.id; INSERT INTO public.journal_entries(company_id,name,status,amount,notes,data) SELECT c,'Fleet fuel: '||v_vehicle.registration_number,'Posted',total_cost,'Fleet fuel transaction',jsonb_build_object('source','fleet_fuel','fuel_transaction_id',id,'vehicle_id',vehicle_id) FROM public.fleet_fuel_transactions WHERE id=v_id; PERFORM public.fleet_audit('FUEL_LOGGED','FuelTransaction',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='REQUEST_MAINTENANCE' THEN
  INSERT INTO public.fleet_maintenance_jobs(company_id,job_number,vehicle_id,plan_id,workshop_id,maintenance_type,status,priority,due_on,odometer_km,estimated_cost,notes,created_by) VALUES(c,'MNT-'||to_char(v_now,'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),(p_payload->>'vehicleId')::uuid,nullif(p_payload->>'planId','')::uuid,nullif(p_payload->>'workshopId','')::uuid,coalesce(p_payload->>'maintenanceType','Preventive'),'Awaiting Approval',coalesce(p_payload->>'priority','Normal'),nullif(p_payload->>'dueOn','')::date,nullif(p_payload->>'odometerKm','')::numeric,coalesce(nullif(p_payload->>'estimatedCost','')::numeric,0),nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id; PERFORM public.fleet_audit('MAINTENANCE_REQUESTED','MaintenanceJob',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='APPROVE_MAINTENANCE' THEN
  UPDATE public.fleet_maintenance_jobs SET status='Approved',approved_by=auth.uid(),updated_at=v_now WHERE id=(p_payload->>'jobId')::uuid AND company_id=c AND status='Awaiting Approval' RETURNING * INTO v_job; IF NOT FOUND THEN RAISE EXCEPTION 'Maintenance job cannot be approved in its current state.' USING ERRCODE='22023'; END IF; UPDATE public.fleet_vehicles SET status='Maintenance',updated_at=v_now WHERE id=v_job.vehicle_id; PERFORM public.fleet_audit('MAINTENANCE_APPROVED','MaintenanceJob',v_job.id); RETURN jsonb_build_object('id',v_job.id);
 ELSIF p_action='COMPLETE_MAINTENANCE' THEN
  SELECT * INTO v_job FROM public.fleet_maintenance_jobs WHERE id=(p_payload->>'jobId')::uuid AND company_id=c FOR UPDATE; IF NOT FOUND OR v_job.status NOT IN ('Approved','In Service') THEN RAISE EXCEPTION 'Maintenance job cannot be completed in its current state.' USING ERRCODE='22023'; END IF; INSERT INTO public.fleet_service_records(company_id,maintenance_job_id,vehicle_id,service_date,odometer_km,labour_cost,parts_cost,invoice_reference,notes,created_by) VALUES(c,v_job.id,v_job.vehicle_id,coalesce(nullif(p_payload->>'serviceDate','')::date,current_date),(p_payload->>'odometerKm')::numeric,coalesce(nullif(p_payload->>'labourCost','')::numeric,0),coalesce(nullif(p_payload->>'partsCost','')::numeric,0),nullif(p_payload->>'invoiceReference',''),nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id; UPDATE public.fleet_maintenance_jobs SET status='Completed',completed_on=current_date,updated_at=v_now WHERE id=v_job.id; UPDATE public.fleet_vehicles SET odometer_km=greatest(odometer_km,(p_payload->>'odometerKm')::numeric),status='Available',updated_at=v_now WHERE id=v_job.vehicle_id; INSERT INTO public.journal_entries(company_id,name,status,amount,notes,data) SELECT c,'Fleet maintenance: '||v_job.job_number,'Posted',total_cost,'Fleet service completion',jsonb_build_object('source','fleet_service','service_record_id',id,'maintenance_job_id',v_job.id) FROM public.fleet_service_records WHERE id=v_id; PERFORM public.fleet_audit('MAINTENANCE_COMPLETED','ServiceRecord',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='LOG_INSPECTION_OR_DOCUMENT' THEN
  INSERT INTO public.fleet_vehicle_documents(company_id,vehicle_id,document_type,document_number,issuer,issued_on,expires_on,document_url,notes,created_by) VALUES(c,(p_payload->>'vehicleId')::uuid,p_payload->>'documentType',nullif(p_payload->>'documentNumber',''),nullif(p_payload->>'issuer',''),nullif(p_payload->>'issuedOn','')::date,nullif(p_payload->>'expiresOn','')::date,nullif(p_payload->>'documentUrl',''),nullif(p_payload->>'notes',''),auth.uid()) RETURNING id INTO v_id; PERFORM public.fleet_audit('VEHICLE_DOCUMENT_LOGGED','VehicleDocument',v_id); RETURN jsonb_build_object('id',v_id);
 ELSIF p_action='LOG_INCIDENT' THEN
  INSERT INTO public.fleet_incidents(company_id,vehicle_id,driver_id,trip_id,incident_type,occurred_at,location,description,cost,status,evidence_url,created_by) VALUES(c,(p_payload->>'vehicleId')::uuid,nullif(p_payload->>'driverId','')::uuid,nullif(p_payload->>'tripId','')::uuid,p_payload->>'incidentType',coalesce(nullif(p_payload->>'occurredAt','')::timestamptz,v_now),nullif(p_payload->>'location',''),p_payload->>'description',coalesce(nullif(p_payload->>'cost','')::numeric,0),'Open',nullif(p_payload->>'evidenceUrl',''),auth.uid()) RETURNING id INTO v_id; PERFORM public.fleet_audit('INCIDENT_LOGGED','Incident',v_id); RETURN jsonb_build_object('id',v_id);
 ELSE RAISE EXCEPTION 'Unsupported Fleet action.' USING ERRCODE='22023'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.fleet_reconcile_alerts(p_company_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE c uuid:=coalesce(p_company_id,public.current_company_id()); created_count integer:=0;
BEGIN
 IF p_company_id IS NULL THEN PERFORM public.fleet_require_manager(); ELSE IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Fleet alert reconciliation is service-only.' USING ERRCODE='42501'; END IF; END IF;
 INSERT INTO public.fleet_alerts(company_id,alert_key,severity,alert_type,entity_type,entity_id,title,body,due_on)
 SELECT c,'VEHICLE_DOC_'||d.id||'_'||coalesce(d.expires_on::text,'NA'),CASE WHEN d.expires_on<current_date THEN 'Critical' ELSE 'Warning' END,'DocumentExpiry','VehicleDocument',d.id,d.document_type||' expiry','Vehicle document expires on '||coalesce(d.expires_on::text,'unknown'),d.expires_on FROM public.fleet_vehicle_documents d WHERE d.company_id=c AND d.status='Active' AND d.expires_on IS NOT NULL AND d.expires_on<=current_date+interval '90 days' ON CONFLICT(company_id,alert_key) DO NOTHING;
 GET DIAGNOSTICS created_count=ROW_COUNT;
 INSERT INTO public.fleet_alerts(company_id,alert_key,severity,alert_type,entity_type,entity_id,title,body,due_on)
 SELECT c,'DRIVER_LICENCE_'||d.id||'_'||d.licence_expires_on::text,CASE WHEN d.licence_expires_on<current_date THEN 'Critical' ELSE 'Warning' END,'LicenceExpiry','Driver',d.id,'Driver licence expiry','Driver licence expires on '||d.licence_expires_on::text,d.licence_expires_on FROM public.fleet_drivers d WHERE d.company_id=c AND d.licence_expires_on<=current_date+interval '90 days' ON CONFLICT(company_id,alert_key) DO NOTHING;
 INSERT INTO public.fleet_alerts(company_id,alert_key,severity,alert_type,entity_type,entity_id,title,body,due_on)
 SELECT c,'MAINT_DUE_'||m.id||'_'||coalesce(m.next_due_on::text,'KM'),CASE WHEN m.next_due_on<current_date THEN 'Critical' ELSE 'Warning' END,'MaintenanceDue','MaintenancePlan',m.id,'Maintenance due',m.name||' is due for maintenance',m.next_due_on FROM public.fleet_maintenance_plans m WHERE m.company_id=c AND m.active AND ((m.next_due_on IS NOT NULL AND m.next_due_on<=current_date+interval '30 days') OR (m.next_due_odometer_km IS NOT NULL AND EXISTS(SELECT 1 FROM public.fleet_vehicles v WHERE v.id=m.vehicle_id AND v.odometer_km>=m.next_due_odometer_km-500))) ON CONFLICT(company_id,alert_key) DO NOTHING;
 RETURN jsonb_build_object('companyId',c,'alertsCreated',created_count);
END; $$;

ALTER TABLE public.fleet_vehicle_categories ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_vehicle_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_drivers ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_driver_assignments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_routes ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_trips ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_fuel_cards ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_fuel_transactions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_workshops ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_maintenance_plans ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_maintenance_jobs ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_service_records ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_spare_parts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_tyres ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_incidents ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_telematics_events ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_alerts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.fleet_audit_events ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t text; BEGIN FOR t IN SELECT unnest(ARRAY['fleet_vehicle_categories','fleet_vehicles','fleet_vehicle_documents','fleet_drivers','fleet_driver_assignments','fleet_routes','fleet_trips','fleet_fuel_cards','fleet_fuel_transactions','fleet_workshops','fleet_maintenance_plans','fleet_maintenance_jobs','fleet_service_records','fleet_spare_parts','fleet_tyres','fleet_incidents','fleet_telematics_events','fleet_alerts','fleet_audit_events']) LOOP EXECUTE format('DROP POLICY IF EXISTS fleet_read_%1$s ON public.%1$I',t); EXECUTE format('CREATE POLICY fleet_read_%1$s ON public.%1$I FOR SELECT TO authenticated USING (company_id=public.current_company_id() AND public.fleet_is_manager())',t); END LOOP; END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON FUNCTION public.fleet_is_manager() FROM PUBLIC, anon, authenticated; REVOKE ALL ON FUNCTION public.fleet_require_manager() FROM PUBLIC, anon, authenticated; REVOKE ALL ON FUNCTION public.fleet_audit(text,text,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated; REVOKE ALL ON FUNCTION public.fleet_snapshot() FROM PUBLIC, anon; REVOKE ALL ON FUNCTION public.fleet_action(text,jsonb) FROM PUBLIC, anon; REVOKE ALL ON FUNCTION public.fleet_reconcile_alerts(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fleet_snapshot() TO authenticated; GRANT EXECUTE ON FUNCTION public.fleet_action(text,jsonb) TO authenticated; GRANT EXECUTE ON FUNCTION public.fleet_reconcile_alerts(uuid) TO service_role;
COMMIT;
