import { describe, expect, it } from "vitest";
import { buildClinicianOperationsAnalytics, buildFhirPatientBundle } from "./healthcareInteroperability";

const patient = { id: "11111111-1111-4111-8111-111111111111", name: "Patient Demo", status: "Active", data: { mrn: "MRN-100", firstName: "Patient", lastName: "Demo", dateOfBirth: "1988-01-02", gender: "Female", phone: "+255700000000" } };
const doctor = { id: "22222222-2222-4222-8222-222222222222", name: "Dr. Test Clinician", status: "Active", data: { firstName: "Test", lastName: "Clinician", specialty: "General practice", license: "LIC-001" } };

describe("Healthcare interoperability", () => {
  it("creates a FHIR R4 collection bundle with clinical records linked to the selected patient", () => {
    const bundle = buildFhirPatientBundle({
      patient,
      doctors: [doctor],
      visits: [{ id: "33333333-3333-4333-8333-333333333333", status: "Closed", data: { patientId: patient.id, doctorId: doctor.id, openedAt: "2026-08-20T09:20:00Z", closedAt: "2026-08-20T09:45:00Z", chiefComplaint: "Review", diagnosis: "Hypertension" } }],
      vitals: [{ id: "44444444-4444-4444-8444-444444444444", status: "Recorded", data: { patientId: patient.id, recordedAt: "2026-08-20T09:21:00Z", bloodPressure: "148/96", pulse: 88, temperature: 37.1 } }],
      prescriptions: [{ id: "55555555-5555-4555-8555-555555555555", status: "Pending dispense", data: { patientId: patient.id, doctorId: doctor.id, issuedAt: "2026-08-20T09:30:00Z", medications: [{ name: "Amlodipine", dose: "5 mg", frequency: "Daily", days: 30 }] } }],
      labs: [{ id: "66666666-6666-4666-8666-666666666666", status: "Resulted", data: { patientId: patient.id, doctorId: doctor.id, orderedAt: "2026-08-20T09:25:00Z", reportedAt: "2026-08-20T10:00:00Z", tests: ["Glucose"], results: "Within range" } }],
      radiology: [],
      reports: [{ id: "77777777-7777-4777-8777-777777777777", status: "Signed", data: { patientId: patient.id, doctorId: doctor.id, reportType: "Consultation summary", createdAt: "2026-08-20T10:10:00Z", content: "Clinical summary" } }],
      exportedAt: "2026-08-20T12:00:00Z",
    });
    const types = bundle.entry.map((entry) => entry.resource.resourceType);
    expect(bundle).toMatchObject({ resourceType: "Bundle", type: "collection", timestamp: "2026-08-20T12:00:00Z" });
    expect(new Set(bundle.entry.map((entry) => entry.fullUrl)).size).toBe(bundle.entry.length);
    expect(types).toEqual(expect.arrayContaining(["Patient", "Practitioner", "Encounter", "Condition", "Observation", "MedicationRequest", "DiagnosticReport", "DocumentReference"]));
    expect(bundle.entry.find((entry) => entry.resource.resourceType === "MedicationRequest")?.resource).toMatchObject({ intent: "order", subject: { reference: `Patient/${patient.id}` } });
  });

  it("calculates workload and wait time only from recorded check-in and visit-opening timestamps", () => {
    const analytics = buildClinicianOperationsAnalytics({
      doctors: [doctor],
      appointments: [
        { id: "appointment-1", status: "Checked In", data: { doctorId: doctor.id, startsAt: "2026-08-20T09:00:00Z", checkedInAt: "2026-08-20T09:02:00Z" } },
        { id: "appointment-2", status: "Scheduled", data: { doctorId: doctor.id, startsAt: "2026-08-20T10:00:00Z" } },
      ],
      visits: [
        { id: "visit-1", status: "Open", data: { doctorId: doctor.id, appointmentId: "appointment-1", openedAt: "2026-08-20T09:17:00Z" } },
      ],
      rangeDays: 30,
      now: new Date("2026-08-20T12:00:00Z"),
    });
    expect(analytics.clinicians[0]).toMatchObject({ appointments: 2, checkedInAppointments: 1, scheduledAppointments: 1, openVisits: 1, averageWaitMinutes: 15, waitSampleCount: 1 });
    expect(analytics.totals.averageWaitMinutes).toBe(15);
  });
});
