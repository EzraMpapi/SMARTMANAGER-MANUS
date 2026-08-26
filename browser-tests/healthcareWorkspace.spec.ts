import { expect, test } from "@playwright/test";
import { installManagedAuth } from "./support/authHarness";

// This suite verifies isolated browser interaction and responsive UX. Tenant-scoped
// server enforcement is exercised separately against appRouter in healthcareRouter.integration.test.ts.

const access = {
  role: "Organization Owner",
  canRead: Object.fromEntries([
    "hc_patients", "hc_doctors", "hc_appointments", "hc_visits", "hc_vitals",
    "hc_prescriptions", "hc_lab_orders", "hc_radiology", "hc_invoices", "hc_insurance_claims", "hc_notifications", "hc_reports", "hc_reminder_settings", "hc_reminder_deliveries",
  ].map((table) => [table, true])),
  canCreate: Object.fromEntries([
    "hc_patients", "hc_doctors", "hc_appointments", "hc_visits", "hc_vitals",
    "hc_prescriptions", "hc_lab_orders", "hc_radiology", "hc_invoices", "hc_insurance_claims", "hc_notifications", "hc_reports", "hc_reminder_settings", "hc_reminder_deliveries",
  ].map((table) => [table, true])),
  canUpdate: Object.fromEntries([
    "hc_patients", "hc_doctors", "hc_appointments", "hc_visits", "hc_vitals",
    "hc_prescriptions", "hc_lab_orders", "hc_radiology", "hc_invoices", "hc_insurance_claims", "hc_notifications", "hc_reports", "hc_reminder_settings", "hc_reminder_deliveries",
  ].map((table) => [table, true])),
  canArchive: Object.fromEntries([
    "hc_patients", "hc_doctors", "hc_appointments", "hc_visits", "hc_vitals",
    "hc_prescriptions", "hc_lab_orders", "hc_radiology", "hc_invoices", "hc_insurance_claims", "hc_notifications", "hc_reports", "hc_reminder_settings", "hc_reminder_deliveries",
  ].map((table) => [table, true])),
};

const rowsByTable: Record<string, unknown[]> = {
  hc_patients: [{ id: "e2e11111-1111-4111-8111-111111111111", name: "Asha Mtemi", status: "Active", amount: null, notes: null, data: { mrn: "SMC-000184", firstName: "Asha", lastName: "Mtemi", dateOfBirth: "1989-11-17", gender: "Female", bloodType: "O+", allergies: "Penicillin", insuranceProvider: "NHIF" } }],
  hc_doctors: [{ id: "e2e44444-4444-4444-8444-444444444444", name: "Dr. Rehema Mhando", status: "Active", amount: 50000, notes: null, data: { firstName: "Rehema", lastName: "Mhando", specialty: "General practice", department: "Outpatient", license: "MD-DSM-02041", consultationFee: 50000 } }],
  hc_appointments: [{ id: "e2e66666-6666-4666-8666-666666666666", name: "Asha Mtemi · General consultation", status: "Confirmed", amount: 50000, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", doctorId: "e2e44444-4444-4444-8444-444444444444", doctorName: "Dr. Rehema Mhando", appointmentType: "General consultation", startsAt: "2026-08-20T09:30" } }],
  hc_visits: [{ id: "e2e88888-8888-4888-8888-888888888888", name: "Asha Mtemi · Clinical visit", status: "Open", amount: null, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", doctorId: "e2e44444-4444-4444-8444-444444444444", doctorName: "Dr. Rehema Mhando", openedAt: "2026-08-20T10:20", chiefComplaint: "Persistent cough", diagnosis: "" } }],
  hc_vitals: [{ id: "e2e99999-9999-4999-8999-999999999999", name: "Asha Mtemi · Triage", status: "Recorded", amount: null, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", recordedAt: "2026-08-20T10:20", recordedBy: "Nurse Mushi", bloodPressure: "118/76", pulse: 72, temperature: 36.8, weightKg: 62, heightCm: 164, spo2: 99, respiratoryRate: 16, painScore: 1 } }],
  hc_prescriptions: [{ id: "e2ea1111-1111-4111-8111-111111111111", name: "Asha Mtemi · Prescription", status: "Pending dispense", amount: null, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", doctorId: "e2e44444-4444-4444-8444-444444444444", doctorName: "Dr. Rehema Mhando", issuedAt: "2026-08-20T09:45", medications: [{ name: "Salbutamol inhaler", dose: "2 puffs", frequency: "When required", days: 30 }], instructions: "Review inhaler technique." } }],
  hc_lab_orders: [{ id: "e2eb1111-1111-4111-8111-111111111111", name: "Asha Mtemi · Laboratory order", status: "Ordered", amount: null, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", doctorId: "e2e44444-4444-4444-8444-444444444444", doctorName: "Dr. Rehema Mhando", orderedAt: "2026-08-20T10:30", tests: ["Full blood count"], priority: "Routine", results: "" } }],
  hc_radiology: [],
  hc_invoices: [{ id: "e2ed1111-1111-4111-8111-111111111111", name: "Asha Mtemi · Invoice", status: "Awaiting insurer", amount: 50000, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", issuedAt: "2026-08-20T10:00", services: [{ name: "Consultation", amount: 50000 }], subtotal: 50000, discountPercent: 0, discountAmount: 0, balance: 50000, paymentMethod: "Insurance", insuranceProvider: "NHIF", insuranceClaimStatus: "Not applicable" } }],
  hc_insurance_claims: [{ id: "e2ef1111-1111-4111-8111-111111111111", name: "Asha Mtemi · NHIF claim", status: "Submitted", amount: 50000, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", invoiceId: "e2e99999-9999-4999-8999-999999999999", provider: "NHIF", claimNumber: "NHIF-SMC-000184", submittedAt: "2026-08-20T10:05", requestedAmount: 50000, decisionNotes: "Awaiting insurer review" } }],
  hc_notifications: [{ id: "e2f01111-1111-4111-8111-111111111111", name: "Urgent radiology review pending", status: "Unread", amount: null, notes: null, data: { eventType: "Diagnostic", severity: "Urgent", patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", relatedTable: "hc_radiology", relatedRecordId: "e2ec1111-1111-4111-8111-111111111111", actionLabel: "Review diagnostic order" } }],
  hc_reports: [{ id: "e2ee1111-1111-4111-8111-111111111111", name: "Asha Mtemi · Consultation summary", status: "Draft", amount: null, notes: null, data: { patientId: "e2e11111-1111-4111-8111-111111111111", patientName: "Asha Mtemi", doctorId: "e2e44444-4444-4444-8444-444444444444", doctorName: "Dr. Rehema Mhando", visitId: "e2e88888-8888-8888-8888-888888888888", reportType: "Consultation summary", createdAt: "2026-08-20T10:05", signedAt: "", signedBy: "", content: "Clinical summary documented." } }],
  hc_reminder_deliveries: [{ id: "e2ef1111-1111-4111-8111-111111111111", name: "Appointment reminder awaiting provider configuration", status: "Provider unconfigured", amount: null, notes: null, data: { scheduledFor: "2026-08-20T09:30", leadMinutes: 1440, channel: "SMS", attemptCount: 0 } }],
};

function trpcResult(data: unknown) {
  return { result: { data: { json: data } } };
}

test("opens the Healthcare Command Center and completes guarded patient registration", async ({ page }, testInfo) => {
  let reconciliationScheduleActive = false;
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-user", email: "healthcare@e2e.invalid", user_metadata: { full_name: "Asha Mrema" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-user", company_id: "e2e-company", full_name: "Asha Mrema", role: "Organization Owner", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-company", name: "Kilimanjaro Clinic", category: "healthcare", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const responses = procedures.map((procedure, index) => {
      if (procedure === "healthcare.access") return trpcResult(access);
      if (procedure === "healthcare.reminderSettings") return trpcResult({ settings: { id: "e2es1111-1111-4111-8111-111111111111", enabled: false, leadMinutes: 1440, consentRequired: true, timezone: "Africa/Dar_es_Salaam", senderId: "", providerStatus: "unconfigured", providerMessage: "Provider credentials required", scheduleEnabled: false, updatedAt: null }, access });
      if (procedure === "healthcare.reminderDeliveries") return trpcResult({ deliveries: rowsByTable.hc_reminder_deliveries, access });
      if (procedure === "healthcare.saveReminderSettings") return trpcResult({ settings: { id: "e2es1111-1111-4111-8111-111111111111", enabled: true, leadMinutes: 120, consentRequired: true, timezone: "Africa/Dar_es_Salaam", senderId: "CLINIC", providerStatus: "unconfigured", providerMessage: "Provider credentials required", scheduleEnabled: false, updatedAt: null }, activation: "provider_unconfigured", message: "Settings saved. SMS delivery remains inactive until an approved provider connection is configured." });
      if (procedure === "healthcare.testReminder") return trpcResult({ status: "blocked", reason: "provider_unconfigured", message: "A test SMS cannot be sent until an approved provider connection is configured." });
      if (procedure === "healthcare.portalReferenceReconciliation") return trpcResult({ patients: [{ id: "e2e11111-1111-4111-8111-111111111111", name: "Asha Mtemi", status: "Active", mrn: "SMC-000184", portalReference: null, linkState: "unlinked" }], candidates: [{ reference: "ASHA-PORTAL", displayName: "Asha Portal", availability: "available" }], summary: { unlinkedPatients: 1, availableReferences: 1 } });
      if (procedure === "healthcare.linkPatientPortalReference") return trpcResult({ id: "e2e11111-1111-4111-8111-111111111111", name: "Asha Mtemi", status: "Active", mrn: "SMC-000184", portalReference: "ASHA-PORTAL", linkState: "linked" });
      if (procedure === "healthcare.clearPatientPortalReference") return trpcResult({ id: "e2e11111-1111-4111-8111-111111111111", name: "Asha Mtemi", status: "Active", mrn: "SMC-000184", portalReference: null, linkState: "unlinked" });
      if (procedure === "healthcare.portalReferenceWorkflow") return trpcResult({ imports: [], approvals: [], canApprove: true });
      if (procedure === "healthcare.portalReferenceDailySummary") return trpcResult({ delivery: "In-app only — scheduled outbound delivery is inactive.", totals: { unlinkedPatients: 1, pendingApprovals: 0, readyToApply: 0, appliedToday: 0, rejectedToday: 0, invalidToday: 0 } });
      if (procedure === "healthcare.portalReferenceErrorExport") return trpcResult({ generatedAt: "2026-08-21T06:00:00.000Z", rows: [{ rowNumber: 4, mrn: "SMC-000189", status: "Invalid", validationReason: "Portal reference format is invalid." }] });
      if (procedure === "healthcare.portalReferenceAuditSearch") return trpcResult({ rows: [{ id: "audit-1", name: "Portal-reference replacement approval", status: "Rejected", createdAt: "2026-08-21T06:00:00.000Z", mrn: "SMC-000189", reason: "Replacement review", decisionNote: "Identity could not be confirmed.", decidedAt: "2026-08-21T07:00:00.000Z" }] });
      if (procedure === "healthcare.portalReferenceSummarySettings") return trpcResult({ settings: { id: "summary-1", recipientMode: "both", roleRecipients: ["Clinic Administrator", "Organization Owner", "CEO"], managedRecipients: ["admin@clinic.example"], timezone: "Africa/Dar_es_Salaam", deliveryEnabled: reconciliationScheduleActive, scheduleState: reconciliationScheduleActive ? "Active — daily at 10:38 Africa/Dar_es_Salaam" : "Inactive pending explicit time and activation confirmation", nextRunAt: reconciliationScheduleActive ? "2026-08-22T07:38:00.000Z" : null } });
      if (procedure === "healthcare.portalReferenceDeliveryHistory") return trpcResult({ rows: reconciliationScheduleActive ? [{ createdAt: "2026-08-21T07:38:00.000Z", status: "success", severity: "INFO", responseCode: 200, date: "2026-08-21", recipientCount: 1, successCount: 1, failedCount: 0 }] : [] });
      if (procedure === "healthcare.savePortalReferenceSummarySettings") return trpcResult({ message: "Recipient configuration saved. Daily email delivery remains inactive until its local time and activation are explicitly approved.", settings: { id: "summary-1", recipientMode: "both", roleRecipients: ["Clinic Administrator", "Organization Owner", "CEO"], managedRecipients: ["admin@clinic.example"], timezone: "Africa/Dar_es_Salaam", deliveryEnabled: false, scheduleState: "Inactive pending explicit time and activation confirmation" } });
      if (procedure === "healthcare.activatePortalReferenceDailySchedule") { reconciliationScheduleActive = true; return trpcResult({ message: "Daily reconciliation email delivery is active at 10:38 Africa/Dar_es_Salaam.", settings: { id: "summary-1", recipientMode: "both", roleRecipients: ["Clinic Administrator", "Organization Owner", "CEO"], managedRecipients: ["admin@clinic.example"], timezone: "Africa/Dar_es_Salaam", deliveryEnabled: true, scheduleState: "Active — daily at 10:38 Africa/Dar_es_Salaam", nextRunAt: "2026-08-22T07:38:00.000Z" } }); }
      if (procedure === "healthcare.stagePortalReferenceCsvImport") return trpcResult({ batchId: "batch-1", staged: 1, ready: 1, approvalRequired: 0, invalid: 0 });
      if (procedure === "healthcare.list") {
        const requestUrl = new URL(route.request().url());
        const rawInput = requestUrl.searchParams.get("input") || "{}";
        const parsed = JSON.parse(rawInput);
        const table = parsed?.[String(index)]?.json?.table || "hc_patients";
        return trpcResult({ records: rowsByTable[table] || [], access });
      }
      if (procedure === "healthcare.create") return trpcResult({ record: rowsByTable.hc_patients[0], access, audit: { action: "created", table: "hc_patients" } });
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, {
    id: "e2e-user",
    email: "healthcare@e2e.invalid",
    fullName: "Asha Mrema",
    profile: { id: "e2e-user", company_id: "e2e-company", full_name: "Asha Mrema", role: "Organization Owner", customer_ref: null },
    company: { id: "e2e-company", name: "Kilimanjaro Clinic", category: "healthcare", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" },
  });

  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible();
  const dismissBriefing = page.getByRole("button", { name: "Dismiss", exact: true });
  if (await dismissBriefing.count() && await dismissBriefing.last().isVisible().catch(() => false)) await dismissBriefing.last().click();
  const closeMenu = page.getByRole("button", { name: "Close menu" });
  if (await closeMenu.isVisible().catch(() => false)) await closeMenu.click();
  const skipTour = page.getByRole("button", { name: "Skip tour" });
  if (await skipTour.count()) await skipTour.click();
  const clinicNav = page.locator("aside nav button").filter({ hasText: "Healthcare / Clinic" });
  const isMobileViewport = await page.evaluate(() => window.innerWidth < 1024);
  if (isMobileViewport) await page.getByRole("button", { name: "Open menu" }).click();
  await clinicNav.click();
  await expect(page.getByRole("heading", { name: "Healthcare Command Center" })).toBeVisible();
  await expect(page.getByText("Asha Mtemi", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("healthcare-command-center-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Healthcare Command Center" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Register patient" }).first()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("healthcare-command-center-mobile.png"), fullPage: true });

  await page.getByRole("button", { name: "Register patient" }).first().click();
  await expect(page.getByRole("dialog", { name: "Create Patient" })).toBeVisible();
  await page.getByLabel("First name").fill("Mariam");
  await page.getByLabel("Last name").fill("Kweka");
  await page.getByLabel("Date of birth").fill("1998-02-14");
  await page.getByLabel("SMS reminder consent").selectOption("Granted");
  await page.getByLabel("Consent capture method").selectOption("Signed form");
  await page.getByRole("button", { name: "Create Patient" }).click();
  await expect(page.getByRole("dialog", { name: "Create Patient" })).toHaveCount(0);

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Appointments" }).click();
  await page.getByRole("button", { name: "Book appointment" }).last().click();
  await expect(page.getByRole("dialog", { name: "Create Appointment" })).toBeVisible();
  await page.getByLabel("Reason for visit").fill("Preventive consultation");
  await page.getByRole("button", { name: "Create Appointment" }).click();
  await expect(page.getByRole("dialog", { name: "Create Appointment" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit appointment" }).first().click();
  await expect(page.getByRole("dialog", { name: "Edit Appointment" })).toBeVisible();
  await page.getByRole("dialog", { name: "Edit Appointment" }).getByLabel("Reason for visit").fill("Updated preventive consultation");
  await page.getByRole("dialog", { name: "Edit Appointment" }).getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Edit appointment" }).first().click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("dialog", { name: "Edit Appointment" }).getByRole("button", { name: "Archive record" }).click();

  await page.getByRole("button", { name: "Clinical care" }).click();
  await page.getByRole("button", { name: "New visit" }).click();
  await expect(page.getByRole("dialog", { name: "Create Clinical visit" })).toBeVisible();
  await page.getByLabel("Chief complaint").fill("Routine clinical assessment");
  await page.getByRole("button", { name: "Create Clinical visit" }).click();
  await expect(page.getByRole("dialog", { name: "Create Clinical visit" })).toHaveCount(0);

  await page.getByRole("button", { name: "Update note" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Clinical visit" })).toBeVisible();
  await page.getByLabel("Diagnosis").fill("Acute upper respiratory tract infection");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Clinical visit" })).toHaveCount(0);
  await page.getByRole("button", { name: "Update note" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archive record" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Clinical visit" })).toHaveCount(0);

  await page.getByRole("button", { name: "Record vitals" }).click();
  await expect(page.getByRole("dialog", { name: "Create Vitals" })).toBeVisible();
  await page.getByLabel("Blood pressure").fill("118/76");
  await page.getByRole("button", { name: "Create Vitals" }).click();
  await expect(page.getByRole("dialog", { name: "Create Vitals" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit triage" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Vitals" })).toBeVisible();
  await page.getByRole("dialog", { name: "Edit Vitals" }).getByLabel("Blood pressure").fill("120/78");
  await page.getByRole("dialog", { name: "Edit Vitals" }).getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Edit triage" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("dialog", { name: "Edit Vitals" }).getByRole("button", { name: "Archive record" }).click();

  await page.getByRole("button", { name: "Issue prescription" }).click();
  await expect(page.getByRole("dialog", { name: "Create Prescription" })).toBeVisible();
  await page.getByLabel("Medications").fill("Paracetamol | 500 mg | Three times daily | 3");
  await page.getByRole("button", { name: "Create Prescription" }).click();
  await expect(page.getByRole("dialog", { name: "Create Prescription" })).toHaveCount(0);
  await page.getByRole("button", { name: "Review prescription" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Prescription" })).toBeVisible();
  await page.getByRole("dialog", { name: "Edit Prescription" }).getByLabel("Patient instructions").fill("Updated medication guidance");
  await page.getByRole("dialog", { name: "Edit Prescription" }).getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Review prescription" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("dialog", { name: "Edit Prescription" }).getByRole("button", { name: "Archive record" }).click();

  await page.getByRole("button", { name: "Diagnostics", exact: true }).click();
  await page.getByRole("button", { name: "New" }).first().click();
  await expect(page.getByRole("dialog", { name: "Create Laboratory order" })).toBeVisible();
  await page.getByLabel("Tests").fill("Full blood count\nMalaria rapid test");
  await page.getByRole("button", { name: "Create Laboratory order" }).click();
  await expect(page.getByRole("dialog", { name: "Create Laboratory order" })).toHaveCount(0);

  await page.getByRole("button", { name: "Pharmacy", exact: true }).click();
  await page.getByRole("button", { name: "Mark dispensed" }).click();
  await expect(page.getByText("Healthcare record updated", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Billing & insurance", exact: true }).click();
  await page.getByRole("button", { name: "Create invoice" }).click();
  await expect(page.getByRole("dialog", { name: "Create Invoice" })).toBeVisible();
  await page.getByLabel("Services").fill("Consultation | 50000");
  await page.getByRole("dialog", { name: "Create Invoice" }).getByRole("button", { name: "Create Invoice" }).click();
  await expect(page.getByRole("dialog", { name: "Create Invoice" })).toHaveCount(0);

  await page.getByRole("main").getByRole("button", { name: "Reports", exact: true }).click();
  await page.getByRole("button", { name: "New report" }).click();
  await expect(page.getByRole("dialog", { name: "Create Medical report" })).toBeVisible();
  await page.getByLabel("Clinical report content").fill("Follow-up care has been discussed and documented.");
  await page.getByRole("dialog", { name: "Create Medical report" }).getByRole("button", { name: "Create Medical report" }).click();
  await expect(page.getByRole("dialog", { name: "Create Medical report" })).toHaveCount(0);

  await page.getByRole("main").getByRole("button", { name: "Reminders", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Appointment SMS reminders" })).toBeVisible();
  await expect(page.getByText("Provider unconfigured", { exact: true }).first()).toBeVisible();
  await page.getByRole("combobox").first().selectOption("120");
  await page.getByRole("button", { name: "Save reminder policy" }).click();
  await expect(page.getByText("Settings saved. SMS delivery remains inactive until an approved provider connection is configured.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Test reminder" }).click();
  await expect(page.getByText("A test SMS cannot be sent until an approved provider connection is configured.", { exact: true })).toBeVisible();

  await page.getByRole("main").getByRole("button", { name: "Portal links", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Patient portal reference reconciliation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Daily reconciliation summary" })).toBeVisible();
  await page.getByLabel("Portal reference CSV content").fill("MRN,Portal Reference\nSMC-000184,ASHA-PORTAL");
  await page.getByRole("button", { name: "Stage rows for review" }).click();
  await expect(page.getByText("1 rows staged: 1 ready, 0 need approval.", { exact: true })).toBeVisible();
  await page.getByText("Asha Mtemi", { exact: true }).last().click();
  await page.getByLabel("Verified portal-reference candidate").selectOption("ASHA-PORTAL");
  await page.getByRole("button", { name: "Link verified portal reference" }).click();
  await expect(page.getByText("Patient portal reference linked", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rejected-row correction export" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export correction CSV" }).click();
  expect((await download).suggestedFilename()).toBe("portal-reference-correction-rows.csv");
  await expect(page.getByRole("heading", { name: "Supervisor decision notes and audit search" })).toBeVisible();
  await page.getByLabel("Search portal reconciliation audit").fill("identity");
  await expect(page.getByText("Identity could not be confirmed.", { exact: false })).toBeVisible();
  await page.getByLabel("Approved managed recipients").fill("admin@clinic.example\nowner@clinic.example");
  await page.getByRole("button", { name: "Save recipients" }).click();
  await expect(page.getByText("Recipient configuration saved.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Daily reconciliation email schedule" })).toBeVisible();
  await expect(page.getByText("No scheduled delivery records yet. History will appear after the first daily run.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Activate 10:38 daily" }).click();
  await expect(page.getByText("Daily reconciliation email delivery is active at 10:38 Africa/Dar_es_Salaam.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Active — daily at 10:38 Africa\/Dar_es_Salaam/)).toBeVisible();
  await expect(page.getByText("1 accepted · 0 not accepted · 1 recipients", { exact: true })).toBeVisible();

  await page.getByRole("main").getByRole("button", { name: "Insurance claims", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Insurance claims" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("healthcare-insurance-claims.png"), fullPage: true });
  await page.getByRole("button", { name: "Start review" }).click();
  await expect(page.getByText("Healthcare record updated", { exact: true })).toBeVisible();

  await page.getByRole("main").getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Clinical notifications" })).toBeVisible();
  await page.getByText("Urgent radiology review pending", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Laboratory", exact: true })).toBeVisible();

  await page.getByRole("main").getByRole("button", { name: "Clinicians", exact: true }).click();
  await page.getByRole("button", { name: "Add clinician" }).click();
  await expect(page.getByRole("dialog", { name: "Create Clinician" })).toBeVisible();
  await page.getByRole("dialog", { name: "Create Clinician" }).getByLabel("First name").fill("Janet");
  await page.getByRole("dialog", { name: "Create Clinician" }).getByLabel("Last name").fill("Kileo");
  await page.getByRole("dialog", { name: "Create Clinician" }).getByLabel("Specialty").fill("Paediatrics");
  await page.getByRole("dialog", { name: "Create Clinician" }).getByLabel("Licence number").fill("MD-DSM-02042");
  await page.getByRole("dialog", { name: "Create Clinician" }).getByRole("button", { name: "Create Clinician" }).click();
  await expect(page.getByRole("dialog", { name: "Create Clinician" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Edit Clinician" })).toBeVisible();
  await page.getByLabel("Specialty").fill("Family medicine");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Clinician" })).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archive clinician" }).click();
  await expect(page.getByText("Healthcare record archived", { exact: true }).last()).toBeVisible();

  await page.getByRole("button", { name: "Patients" }).click();
  await page.getByRole("button", { name: "Edit Asha Mtemi" }).click();
  await expect(page.getByRole("dialog", { name: "Edit Patient" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archive record" }).click();
  await expect(page.getByText("Healthcare record archived", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Edit Patient" })).toHaveCount(0);
});

test("keeps a receptionist out of restricted clinical and report records without loading them", async ({ page }) => {
  const allTables = ["hc_patients", "hc_doctors", "hc_appointments", "hc_visits", "hc_vitals", "hc_prescriptions", "hc_lab_orders", "hc_radiology", "hc_invoices", "hc_insurance_claims", "hc_notifications", "hc_reports"];
  const readable = new Set(["hc_patients", "hc_appointments", "hc_invoices", "hc_insurance_claims", "hc_notifications"]);
  const receptionistAccess = {
    role: "Receptionist",
    canRead: Object.fromEntries(allTables.map((table) => [table, readable.has(table)])),
    canCreate: Object.fromEntries(allTables.map((table) => [table, ["hc_patients", "hc_appointments", "hc_notifications"].includes(table)])),
    canUpdate: Object.fromEntries(allTables.map((table) => [table, ["hc_patients", "hc_appointments", "hc_notifications"].includes(table)])),
    canArchive: Object.fromEntries(allTables.map((table) => [table, ["hc_patients", "hc_appointments"].includes(table)])),
  };
  const requestedTables = new Set<string>();
  await page.route("**/auth/v1/user", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-receptionist", email: "reception@e2e.invalid", user_metadata: { full_name: "Rukia Said" } }) }));
  await page.route("**/rest/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/profiles")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-receptionist", company_id: "e2e-company", full_name: "Rukia Said", role: "Receptionist", customer_ref: null }]) });
    if (url.includes("/companies")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "e2e-company", name: "Kilimanjaro Clinic", category: "healthcare", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" }]) });
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/trpc/**", async (route) => {
    const procedures = route.request().url().split("/api/trpc/")[1]?.split("?")[0].split(",") || [];
    const rawInput = new URL(route.request().url()).searchParams.get("input") || "{}";
    const parsed = JSON.parse(rawInput);
    const responses = procedures.map((procedure, index) => {
      if (procedure === "healthcare.access") return trpcResult(receptionistAccess);
      if (procedure === "healthcare.list") {
        const table = parsed?.[String(index)]?.json?.table || "hc_patients";
        requestedTables.add(table);
        return trpcResult({ records: rowsByTable[table] || [], access: receptionistAccess });
      }
      return trpcResult(null);
    });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(responses) });
  });
  await installManagedAuth(page, {
    id: "e2e-receptionist",
    email: "reception@e2e.invalid",
    fullName: "Rukia Said",
    profile: { id: "e2e-receptionist", company_id: "e2e-company", full_name: "Rukia Said", role: "Receptionist", customer_ref: null },
    company: { id: "e2e-company", name: "Kilimanjaro Clinic", category: "healthcare", tax_rate: 18, timezone: "Africa/Dar_es_Salaam" },
  });
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Workspace overview", { exact: true })).toBeVisible();
  const dismissBriefing = page.getByRole("button", { name: "Dismiss", exact: true });
  if (await dismissBriefing.count() && await dismissBriefing.last().isVisible().catch(() => false)) await dismissBriefing.last().click();
  const closeMenu = page.getByRole("button", { name: "Close menu" });
  if (await closeMenu.isVisible().catch(() => false)) await closeMenu.click();
  const skipTour = page.getByRole("button", { name: "Skip tour" });
  if (await skipTour.count()) await skipTour.click();
  const clinicNav = page.locator("aside nav button").filter({ hasText: "Healthcare / Clinic" });
  const isMobileViewport = await page.evaluate(() => window.innerWidth < 1024);
  if (isMobileViewport) await page.getByRole("button", { name: "Open menu" }).click();
  await clinicNav.click();
  await page.getByRole("main").getByRole("button", { name: "Clinical care", exact: true }).click();
  await expect(page.getByText("Clinical care is restricted", { exact: true })).toBeVisible();
  await page.getByRole("main").getByRole("button", { name: "Insurance claims", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Insurance claims" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start review" })).toHaveCount(0);
  await page.getByRole("main").getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByText("Reports is restricted", { exact: true })).toBeVisible();
  expect(requestedTables.has("hc_visits")).toBe(false);
  expect(requestedTables.has("hc_prescriptions")).toBe(false);
  expect(requestedTables.has("hc_reports")).toBe(false);
});
