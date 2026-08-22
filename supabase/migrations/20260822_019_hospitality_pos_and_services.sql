-- Hospitality POS and ancillary services: typed dining orders, kitchen states, room charges, minibar, and laundry postings.
BEGIN;

CREATE OR REPLACE FUNCTION public.hospitality_pos_snapshot()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated hospitality session is required.' USING ERRCODE='28000'; END IF;
  RETURN jsonb_build_object(
    'tables',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.table_number) FROM public.hospitality_restaurant_tables t WHERE t.company_id=public.current_company_id()),'[]'::jsonb),
    'menus',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.name) FROM public.hospitality_menus m WHERE m.company_id=public.current_company_id()),'[]'::jsonb),
    'menuItems',coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.name) FROM public.hospitality_menu_items i WHERE i.company_id=public.current_company_id()),'[]'::jsonb),
    'orders',coalesce((SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC) FROM public.hospitality_orders o WHERE o.company_id=public.current_company_id()),'[]'::jsonb),
    'orderLines',coalesce((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.id) FROM public.hospitality_order_lines l WHERE l.company_id=public.current_company_id()),'[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.hospitality_pos_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_order uuid; v_folio uuid; v_amount numeric; v_line record; v_status text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated hospitality session is required.' USING ERRCODE='28000'; END IF;
 IF NOT public.hospitality_is_privileged() THEN RAISE EXCEPTION 'You are not authorised for this hospitality operation.' USING ERRCODE='42501'; END IF;
 IF p_action='menu.save' THEN
   INSERT INTO public.hospitality_menus(company_id,property_id,name,meal_period,status,data) VALUES(public.current_company_id(),(p_payload->>'propertyId')::uuid,coalesce(p_payload->>'name','Menu'),p_payload->>'mealPeriod','Active',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='menu_item.save' THEN
   INSERT INTO public.hospitality_menu_items(company_id,menu_id,inventory_item_id,name,price,currency,status,data) VALUES(public.current_company_id(),(p_payload->>'menuId')::uuid,nullif(p_payload->>'inventoryItemId','')::uuid,coalesce(p_payload->>'name','Menu item'),coalesce((p_payload->>'price')::numeric,0),coalesce(p_payload->>'currency','TZS'),'Active',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='table.save' THEN
   INSERT INTO public.hospitality_restaurant_tables(company_id,property_id,table_number,capacity,zone,status,data) VALUES(public.current_company_id(),(p_payload->>'propertyId')::uuid,coalesce(p_payload->>'tableNumber','Table'),coalesce((p_payload->>'capacity')::integer,2),p_payload->>'zone','Available',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='order.create' THEN
   INSERT INTO public.hospitality_orders(company_id,property_id,table_id,reservation_id,folio_id,order_number,status,currency,data) VALUES(public.current_company_id(),(p_payload->>'propertyId')::uuid,nullif(p_payload->>'tableId','')::uuid,nullif(p_payload->>'reservationId','')::uuid,nullif(p_payload->>'folioId','')::uuid,coalesce(p_payload->>'orderNumber','ORD-'||substr(gen_random_uuid()::text,1,8)),'Open',coalesce(p_payload->>'currency','TZS'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSIF p_action='order.add_line' THEN
   v_order:=(p_payload->>'orderId')::uuid; SELECT status INTO v_status FROM public.hospitality_orders WHERE id=v_order AND company_id=public.current_company_id(); IF v_status NOT IN ('Open','Sent','Preparing') THEN RAISE EXCEPTION 'Only open kitchen orders can be edited.' USING ERRCODE='55000'; END IF;
   INSERT INTO public.hospitality_order_lines(company_id,order_id,menu_item_id,name,quantity,unit_price,status,data) SELECT public.current_company_id(),v_order,i.id,i.name,coalesce((p_payload->>'quantity')::numeric,1),i.price,'New',coalesce(p_payload->'data','{}'::jsonb) FROM public.hospitality_menu_items i WHERE i.id=(p_payload->>'menuItemId')::uuid AND i.company_id=public.current_company_id() RETURNING id INTO v_id;
   IF v_id IS NULL THEN RAISE EXCEPTION 'Menu item was not found.' USING ERRCODE='P0002'; END IF;
 ELSIF p_action='order.transition' THEN
   v_order:=(p_payload->>'orderId')::uuid; v_status:=CASE lower(coalesce(p_payload->>'status','')) WHEN 'sent' THEN 'Sent' WHEN 'preparing' THEN 'Preparing' WHEN 'ready' THEN 'Ready' WHEN 'served' THEN 'Served' WHEN 'cancelled' THEN 'Cancelled' ELSE NULL END; IF v_status IS NULL THEN RAISE EXCEPTION 'Invalid restaurant order status.' USING ERRCODE='22023'; END IF; UPDATE public.hospitality_orders SET status=v_status,updated_at=now() WHERE id=v_order AND company_id=public.current_company_id() RETURNING id INTO v_id;
 ELSIF p_action='order.post_room_charge' THEN
   v_order:=(p_payload->>'orderId')::uuid; SELECT folio_id,status INTO v_folio,v_status FROM public.hospitality_orders WHERE id=v_order AND company_id=public.current_company_id(); IF v_folio IS NULL THEN RAISE EXCEPTION 'A room folio is required to post this order as a room charge.' USING ERRCODE='P0002'; END IF; IF v_status NOT IN ('Ready','Served') THEN RAISE EXCEPTION 'Only ready or served orders can be posted to a folio.' USING ERRCODE='55000'; END IF; v_amount:=coalesce((SELECT sum(quantity*unit_price) FROM public.hospitality_order_lines WHERE order_id=v_order),0); INSERT INTO public.hospitality_folio_lines(company_id,folio_id,line_type,description,quantity,unit_amount,amount,currency,source_table,source_record_id,data) VALUES(public.current_company_id(),v_folio,'Dining','Restaurant order room charge',1,v_amount,v_amount,'TZS','hospitality_orders',v_order,jsonb_build_object('posOrderId',v_order)) RETURNING id INTO v_id; UPDATE public.hospitality_orders SET status='Paid',updated_at=now() WHERE id=v_order;
 ELSIF p_action='minibar.post' THEN
   INSERT INTO public.hospitality_minibar_postings(company_id,reservation_id,inventory_item_id,quantity,amount,status,data) VALUES(public.current_company_id(),(p_payload->>'reservationId')::uuid,nullif(p_payload->>'inventoryItemId','')::uuid,coalesce((p_payload->>'quantity')::numeric,1),coalesce((p_payload->>'amount')::numeric,0),'Posted',coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id; SELECT f.id INTO v_folio FROM public.hospitality_folios f WHERE f.reservation_id=(p_payload->>'reservationId')::uuid AND f.status='Open'; IF v_folio IS NOT NULL THEN INSERT INTO public.hospitality_folio_lines(company_id,folio_id,line_type,description,quantity,unit_amount,amount,currency,source_table,source_record_id) VALUES(public.current_company_id(),v_folio,'Minibar',coalesce(p_payload->>'description','Minibar charge'),coalesce((p_payload->>'quantity')::numeric,1),coalesce((p_payload->>'amount')::numeric,0),coalesce((p_payload->>'quantity')::numeric,1)*coalesce((p_payload->>'amount')::numeric,0),'TZS','hospitality_minibar_postings',v_id); END IF;
 ELSIF p_action='laundry.create' THEN
   INSERT INTO public.hospitality_laundry_orders(company_id,reservation_id,guest_id,status,amount,currency,data) VALUES(public.current_company_id(),nullif(p_payload->>'reservationId','')::uuid,nullif(p_payload->>'guestId','')::uuid,'Received',coalesce((p_payload->>'amount')::numeric,0),coalesce(p_payload->>'currency','TZS'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
 ELSE RAISE EXCEPTION 'Unsupported hospitality POS action: %',p_action USING ERRCODE='22023'; END IF;
 PERFORM public.hospitality_audit(upper(replace(p_action,'.','_')),coalesce(v_id::text,p_action),p_payload);
 RETURN jsonb_build_object('ok',true,'action',p_action,'recordId',v_id,'snapshotRequired',true);
END $$;
REVOKE EXECUTE ON FUNCTION public.hospitality_pos_snapshot() FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.hospitality_pos_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.hospitality_pos_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.hospitality_pos_action(text,jsonb) TO authenticated;
COMMIT;
