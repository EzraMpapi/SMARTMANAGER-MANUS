import { describe, expect, it } from "vitest";
import { HEALTHCARE_TABLES, healthcareAccessForRole } from "./healthcareOperations";

describe("healthcare role boundaries", () => {
  it("exposes the complete supported healthcare table set", () => {
    expect(HEALTHCARE_TABLES).toContain("hc_patients");
    expect(HEALTHCARE_TABLES).toContain("hc_invoices");
    expect(HEALTHCARE_TABLES).toContain("hc_insurance_claims");
    expect(HEALTHCARE_TABLES).toContain("hc_notifications");
    expect(HEALTHCARE_TABLES).toContain("hc_reports");
    expect(HEALTHCARE_TABLES).toContain("hc_reminder_settings");
    expect(HEALTHCARE_TABLES).toContain("hc_reminder_deliveries");
  });

  it("keeps front-desk access away from clinical visit edits", () => {
    const access = healthcareAccessForRole("Receptionist");
    expect(access.canCreate.hc_patients).toBe(true);
    expect(access.canCreate.hc_appointments).toBe(true);
    expect(access.canUpdate.hc_visits).toBe(false);
    expect(access.canRead.hc_prescriptions).toBe(false);
  });

  it("allows doctors to manage clinical records without billing authority", () => {
    const access = healthcareAccessForRole("Doctor");
    expect(access.canCreate.hc_visits).toBe(true);
    expect(access.canCreate.hc_prescriptions).toBe(true);
    expect(access.canUpdate.hc_lab_orders).toBe(true);
    expect(access.canCreate.hc_invoices).toBe(false);
    expect(access.canUpdate.hc_insurance_claims).toBe(false);
  });

  it("limits insurance claim transitions to billing authority while keeping claim notifications tenant-role aware", () => {
    const billing = healthcareAccessForRole("Billing Officer");
    const receptionist = healthcareAccessForRole("Receptionist");
    expect(billing.canCreate.hc_insurance_claims).toBe(true);
    expect(billing.canUpdate.hc_insurance_claims).toBe(true);
    expect(billing.canRead.hc_notifications).toBe(true);
    expect(receptionist.canRead.hc_insurance_claims).toBe(true);
    expect(receptionist.canCreate.hc_insurance_claims).toBe(false);
    expect(receptionist.canCreate.hc_notifications).toBe(true);
  });

  it("keeps laboratory and pharmacy roles within their clinical work queues", () => {
    const laboratory = healthcareAccessForRole("Laboratory Technician");
    const pharmacy = healthcareAccessForRole("Pharmacist");
    expect(laboratory.canUpdate.hc_lab_orders).toBe(true);
    expect(laboratory.canRead.hc_prescriptions).toBe(false);
    expect(pharmacy.canUpdate.hc_prescriptions).toBe(true);
    expect(pharmacy.canRead.hc_insurance_claims).toBe(false);
  });

  it("defaults unknown roles to no healthcare permissions", () => {
    const access = healthcareAccessForRole("Unknown Role");
    expect(access.canRead.hc_patients).toBe(false);
    expect(access.canCreate.hc_patients).toBe(false);
  });

  it("limits reminder configuration to healthcare administration while preserving front-desk delivery visibility", () => {
    const administrator = healthcareAccessForRole("Clinic Administrator");
    const receptionist = healthcareAccessForRole("Receptionist");
    expect(administrator.canUpdate.hc_reminder_settings).toBe(true);
    expect(administrator.canCreate.hc_reminder_deliveries).toBe(true);
    expect(receptionist.canRead.hc_reminder_deliveries).toBe(true);
    expect(receptionist.canRead.hc_reminder_settings).toBe(false);
  });
});
