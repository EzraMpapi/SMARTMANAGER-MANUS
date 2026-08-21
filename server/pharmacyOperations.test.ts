import { describe, expect, it } from "vitest";
import { pharmacyAccessForRole, pharmacyArchiveInput, pharmacyClinicalQueueInput, pharmacyDispenseInput, pharmacyInsuranceClaimInput, pharmacyMedicineInput, pharmacyPaymentInput, pharmacyReturnInput, pharmacySaleInput, pharmacySupplierPaymentInput } from "./pharmacyOperations";

describe("pharmacy role boundaries", () => {
  it("allows pharmacists to dispense but limits controlled-medicine issue to pharmacists and administrators", () => {
    const pharmacist = pharmacyAccessForRole("Pharmacist");
    const technician = pharmacyAccessForRole("Pharmacy Technician");
    expect(pharmacist.canDispense).toBe(true);
    expect(pharmacist.canControlled).toBe(true);
    expect(technician.canDispense).toBe(true);
    expect(technician.canControlled).toBe(false);
  });

  it("keeps cash sale permissions separate from clinical-only roles", () => {
    expect(pharmacyAccessForRole("Cashier").canSale).toBe(true);
    expect(pharmacyAccessForRole("Doctor").canSale).toBe(false);
    expect(pharmacyAccessForRole("Doctor").canRead).toBe(true);
  });
});

describe("pharmacy input contracts", () => {
  it("requires safe medicine pricing and reorder information", () => {
    expect(pharmacyMedicineInput.safeParse({ name: "Example", form: "Tablet", sellingPrice: -1, unitCost: 10, reorderLevel: 1 }).success).toBe(false);
    expect(pharmacyMedicineInput.safeParse({ name: "Example", form: "Tablet", sellingPrice: 1000, unitCost: 500, reorderLevel: 5 }).success).toBe(true);
  });

  it("requires a patient, prescriber, and at least one line for prescription dispensing", () => {
    expect(pharmacyDispenseInput.safeParse({ patientId: "00000000-0000-4000-8000-000000000000", prescriberName: "Dr A", items: [] }).success).toBe(false);
  });

  it("does not accept discounts that are represented as unsafe negative input", () => {
    expect(pharmacySaleInput.safeParse({ paymentMethod: "Cash", discount: -10, items: [] }).success).toBe(false);
  });

  it("requires a positive settlement amount and a real Pharmacy sale reference", () => {
    expect(pharmacyPaymentInput.safeParse({ saleId: "00000000-0000-4000-8000-000000000000", amount: 0, method: "Cash" }).success).toBe(false);
    expect(pharmacyPaymentInput.safeParse({ saleId: "not-a-uuid", amount: 1000, method: "Cash" }).success).toBe(false);
    expect(pharmacySupplierPaymentInput.safeParse({ supplierId: "00000000-0000-4000-8000-000000000000", amount: 1000, method: "Bank transfer" }).success).toBe(true);
  });

  it("requires a valid original sale line and condition for returns", () => {
    expect(pharmacyReturnInput.safeParse({ saleId: "00000000-0000-4000-8000-000000000000", reason: "Customer return", condition: "Opened", items: [{ saleItemId: "11111111-1111-4111-8111-111111111111", quantity: 1 }] }).success).toBe(false);
    expect(pharmacyReturnInput.safeParse({ saleId: "00000000-0000-4000-8000-000000000000", reason: "Customer return", condition: "Sealed and resellable", items: [{ saleItemId: "11111111-1111-4111-8111-111111111111", quantity: 1 }] }).success).toBe(true);
  });

  it("limits archive targets and validates insurer claim values", () => {
    expect(pharmacyArchiveInput.safeParse({ table: "phm_sales", id: "00000000-0000-4000-8000-000000000000" }).success).toBe(false);
    expect(pharmacyArchiveInput.safeParse({ table: "phm_drugs", id: "00000000-0000-4000-8000-000000000000" }).success).toBe(true);
    expect(pharmacyInsuranceClaimInput.safeParse({ saleId: "00000000-0000-4000-8000-000000000000", provider: "NHIF", amount: 0 }).success).toBe(false);
  });

  it("keeps clinical queue query size bounded", () => {
    expect(pharmacyClinicalQueueInput.safeParse({ limit: 251 }).success).toBe(false);
    expect(pharmacyClinicalQueueInput.safeParse({ search: "Asha", limit: 100 }).success).toBe(true);
  });
});
