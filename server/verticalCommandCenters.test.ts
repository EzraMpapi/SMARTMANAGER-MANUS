import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const workspace = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/VerticalCommandCenters.jsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx"), "utf8");

describe("vertical command-center contracts", () => {
  it("covers healthcare, school, and pharmacy operations", () => {
    for (const text of ["Healthcare control tower", "Patient flow, clinical workload, and care exceptions", "Scheduled appointments", "Urgent patients", "Pharmacy control tower", "Stock safety, expiry exposure, and dispensing", "Low stock", "School operations control tower", "Enrollment, academic delivery, and fee collection", "Outstanding fees", "Collection rate"]) expect(workspace).toContain(text);
    for (const source of ["hc_patients", "hc_appointments", "hc_visits", "phm_drugs", "phm_stock", "phm_dispense", "sch_students", "sch_teachers", "sch_fees"]) expect(workspace).toContain(source);
  });

  it("covers hotel, fleet, and restaurant operations", () => {
    for (const text of ["Hospitality control tower", "Occupancy, bookings, and room readiness", "Fleet control tower", "Vehicle utilization, fuel, and maintenance risk", "Restaurant control tower", "Table occupancy, kitchen throughput, and reservations"]) expect(workspace).toContain(text);
    for (const source of ["htl_rooms", "htl_bookings", "flt_vehicles", "flt_trips", "flt_maintenance", "rst_tables", "rst_menu", "rst_orders", "rst_reservations"]) expect(workspace).toContain(source);
  });

  it("keeps vertical centers routed through their existing module shells", () => {
    for (const route of [
      '{active === "healthcare" && (',
      "<LazyHealthcareClinicWorkspace",
      '{active === "school"      && <Suspense',
      "<LazySchoolWorkspace",
      '{active === "pharmacy"    && <Suspense',
      "<LazyPharmacyWorkspace",
      '{active === "hotel"       && <HotelManagementModule',
      '{active === "fleet"       && <FleetManagementModule',
      '{active === "restaurant"  && <RestaurantManagementModule',
    ]) expect(dashboard).toContain(route);
    expect(workspace).toContain("Insufficient confirmed data");
  });
});
