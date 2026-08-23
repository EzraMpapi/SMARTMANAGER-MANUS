-- Hospitality guest engagement, events, loyalty, maintenance, and service operational commands.
BEGIN;

CREATE OR REPLACE FUNCTION public.hospitality_service_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_guest uuid; v_points numeric; v_employee uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated hospitality session is required.' USING ERRCODE='28000'; END IF;
 IF NOT public.hospitality_is_privileged() THEN RAISE EXCEPTION 'You are not authorised for this hospitality operation.' USING ERRCODE='42501'; END IF;
 IF p_action='venue.save' THEN
   INSERT INTO public.hospitality_event_venues(company_id,property_id,name,capacity,base_rate,currency,status,data) VALUES(public.current_company_id(),(p_payload->>'propertyId')::uuid,coalesce(p_payload->>'name','Venue'),coalesce((p_payload->>'capacity')::integer,0),coalesce((p_payload->>'baseRate')::numeric,0),coalesce(p_payload->>'currency','TZS'),'Active',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='event.save' THEN
   INSERT INTO public.hospitality_events(company_id,property_id,venue_id,guest_id,name,start_at,end_at,status,amount,currency,data) VALUES(public.current_company_id(),(p_payload->>'propertyId')::uuid,nullif(p_payload->>'venueId','')::uuid,nullif(p_payload->>'guestId','')::uuid,coalesce(p_payload->>'name','Event'),(p_payload->>'startAt')::timestamptz,(p_payload->>'endAt')::timestamptz,coalesce(p_payload->>'status','Enquiry'),coalesce((p_payload->>'amount')::numeric,0),coalesce(p_payload->>'currency','TZS'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='loyalty.enrol' THEN
   v_guest:=(p_payload->>'guestId')::uuid; INSERT INTO public.hospitality_loyalty_accounts(company_id,guest_id,tier,points,status,data) VALUES(public.current_company_id(),v_guest,coalesce(p_payload->>'tier','Member'),0,'Active',coalesce(p_payload->'data','{}'::jsonb)) ON CONFLICT(company_id,guest_id) DO UPDATE SET tier=EXCLUDED.tier,status='Active',data=public.hospitality_loyalty_accounts.data||EXCLUDED.data RETURNING id INTO v_id;
 ELSIF p_action='loyalty.adjust' THEN
   v_guest:=(p_payload->>'guestId')::uuid; v_points:=coalesce((p_payload->>'points')::numeric,0); UPDATE public.hospitality_loyalty_accounts SET points=greatest(0,points+v_points),data=data||jsonb_build_object('lastAdjustment',v_points,'adjustedAt',now()::text) WHERE company_id=public.current_company_id() AND guest_id=v_guest RETURNING id INTO v_id; IF v_id IS NULL THEN RAISE EXCEPTION 'Active loyalty account was not found.' USING ERRCODE='P0002'; END IF;
 ELSIF p_action='complaint.create' THEN
   INSERT INTO public.hospitality_complaints(company_id,reservation_id,guest_id,category,description,status,data) VALUES(public.current_company_id(),nullif(p_payload->>'reservationId','')::uuid,nullif(p_payload->>'guestId','')::uuid,p_payload->>'category',coalesce(p_payload->>'description',''),'Open',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='maintenance.create' THEN
   INSERT INTO public.hospitality_maintenance_requests(company_id,property_id,room_id,category,priority,status,assigned_employee_id,notes,data) VALUES(public.current_company_id(),(p_payload->>'propertyId')::uuid,nullif(p_payload->>'roomId','')::uuid,coalesce(p_payload->>'category','General'),coalesce(p_payload->>'priority','Normal'),'Open',nullif(p_payload->>'employeeId','')::uuid,p_payload->>'notes',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='service.assign' THEN
   v_id:=(p_payload->>'requestId')::uuid; v_employee:=nullif(p_payload->>'employeeId','')::uuid; UPDATE public.hospitality_guest_requests SET assigned_employee_id=v_employee,status='Assigned',updated_at=now() WHERE id=v_id AND company_id=public.current_company_id(); PERFORM public.hospitality_notify(v_employee,'Hospitality guest request assigned',coalesce(p_payload->>'message','A guest service request requires attention.'),v_id);
 ELSE RAISE EXCEPTION 'Unsupported hospitality service action: %',p_action USING ERRCODE='22023'; END IF;
 PERFORM public.hospitality_audit(upper(replace(p_action,'.','_')),coalesce(v_id::text,p_action),p_payload);
 RETURN jsonb_build_object('ok',true,'action',p_action,'recordId',v_id,'snapshotRequired',true);
END $$;
REVOKE EXECUTE ON FUNCTION public.hospitality_service_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.hospitality_service_action(text,jsonb) TO authenticated;
COMMIT;
