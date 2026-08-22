import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const core = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_018_hospitality_core.sql"), "utf8");
const pos = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_019_hospitality_pos_and_services.sql"), "utf8");
const services = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_020_hospitality_guest_engagement.sql"), "utf8");
const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/HospitalityWorkspace.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");

describe("Hospitality production workflow contracts", () => {
  it("replaces the legacy hotel component with a secured snapshot-driven workspace", () => {
    expect(dashboard).toContain('import { HospitalityWorkspace }');
    expect(dashboard).toContain('<HospitalityWorkspace rpc={rpc}');
    expect(workspace).toContain('rpc("hospitality_snapshot",{})');
    expect(workspace).toContain('rpc("hospitality_pos_snapshot",{})');
    expect(workspace).toContain('hospitality_action');
    expect(workspace).toContain('hospitality_pos_action');
  });

  it("defines typed tenant-scoped hospitality operations and guards reservation conflicts", () => {
    for (const table of ['hospitality_properties','hospitality_rooms','hospitality_guests','hospitality_reservations','hospitality_folios','hospitality_folio_lines','hospitality_payments','hospitality_housekeeping_tasks']) expect(core).toContain(`public.${table}`);
    expect(core).toContain('hospitality_check_room_available');
    expect(core).toContain("r.arrival_date < p_departure AND r.departure_date > p_arrival");
    expect(core).toContain("'The selected room is not available for this stay.'");
    expect(core).toContain("'Folio has an outstanding balance.");
    expect(core).toContain("'Checkout Clean'");
  });

  it("provides real POS, room-charge, minibar, laundry, guest engagement, and audit command paths", () => {
    for (const action of ['order.create','order.add_line','order.transition','order.post_room_charge','minibar.post','laundry.create']) expect(pos).toContain(`p_action='${action}'`);
    expect(pos).toContain("'Dining','Restaurant order room charge'");
    expect(pos).toContain('hospitality_pos_snapshot');
    for (const action of ['event.save','loyalty.enrol','loyalty.adjust','complaint.create','maintenance.create','service.assign']) expect(services).toContain(`p_action='${action}'`);
    expect(core).toContain('hospitality_audit');
    expect(core).toContain('hospitality_notify');
  });

  it("uses authenticated tenant policies and disallows anonymous access to hospitality commands", () => {
    expect(core).toContain("ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY");
    expect(core).toContain("company_id=public.current_company_id()");
    expect(core).toContain('REVOKE EXECUTE ON FUNCTION public.hospitality_action(text,jsonb) FROM PUBLIC,anon');
    expect(pos).toContain('REVOKE EXECUTE ON FUNCTION public.hospitality_pos_action(text,jsonb) FROM PUBLIC,anon');
    expect(services).toContain('REVOKE EXECUTE ON FUNCTION public.hospitality_service_action(text,jsonb) FROM PUBLIC,anon');
  });
});
