import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { z } from "zod";
import { resolveVerifiedProfile } from "./aiApprovals";
import { healthcareAccessForRole, listHealthcareRecords, type HealthcareTable } from "./healthcareOperations";

type HealthcareRecord = Record<string, unknown>;

const FHIR_SOURCE_TABLES: HealthcareTable[] = [
  "hc_patients",
  "hc_doctors",
  "hc_appointments",
  "hc_visits",
  "hc_vitals",
  "hc_prescriptions",
  "hc_lab_orders",
  "hc_radiology",
  "hc_reports",
];

export const healthcareFhirExportInput = z.object({ patientId: z.string().uuid() });
export const healthcareAnalyticsInput = z.object({ rangeDays: z.number().int().min(1).max(90).default(30) });

function dataOf(record: HealthcareRecord) {
  return record.data && typeof record.data === "object" && !Array.isArray(record.data)
    ? record.data as Record<string, unknown>
    : {};
}

function valueOf(record: HealthcareRecord, key: string) {
  const value = record[key];
  return value === undefined || value === null || value === "" ? dataOf(record)[key] : value;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value);
}

function reference(resourceType: string, id: unknown) {
  const resourceId = text(id);
  return resourceId ? { reference: `${resourceType}/${resourceId}` } : undefined;
}

function fullUrl(resourceType: string, id: unknown) {
  return `urn:uuid:${resourceType.toLowerCase()}-${text(id)}`;
}

function fhirGender(value: unknown) {
  const lower = text(value).toLowerCase();
  if (lower === "male") return "male";
  if (lower === "female") return "female";
  if (lower === "other") return "other";
  return "unknown";
}

function encounterStatus(value: unknown) {
  const lower = text(value).toLowerCase();
  if (/cancel/.test(lower)) return "cancelled";
  if (/closed|complete|finish/.test(lower)) return "finished";
  if (/check|arriv/.test(lower)) return "arrived";
  if (/open|progress/.test(lower)) return "in-progress";
  return "planned";
}

function medicationStatus(value: unknown) {
  const lower = text(value).toLowerCase();
  if (/cancel/.test(lower)) return "cancelled";
  if (/dispens|complete/.test(lower)) return "completed";
  if (/draft/.test(lower)) return "draft";
  return "active";
}

function diagnosticStatus(record: HealthcareRecord) {
  const lower = text(record.status).toLowerCase();
  const hasResult = Boolean(text(valueOf(record, "results")) || text(valueOf(record, "findings")));
  if (/cancel/.test(lower)) return "cancelled";
  if (hasResult || /result|complete|final/.test(lower)) return "final";
  return "registered";
}

function fhirPatient(patient: HealthcareRecord) {
  const firstName = text(valueOf(patient, "firstName"));
  const lastName = text(valueOf(patient, "lastName"));
  const name = text(patient.name);
  const phone = text(valueOf(patient, "phone"));
  const email = text(valueOf(patient, "email"));
  const mrn = text(valueOf(patient, "mrn"));
  return {
    resourceType: "Patient",
    id: text(patient.id),
    active: !/archived/i.test(text(patient.status)),
    ...(mrn ? { identifier: [{ system: "urn:smartmanager:mrn", value: mrn }] } : {}),
    name: [{ use: "official", ...(lastName ? { family: lastName } : {}), ...(firstName ? { given: [firstName] } : {}), ...(firstName || lastName ? {} : { text: name }) }],
    ...(phone || email ? { telecom: [...(phone ? [{ system: "phone", value: phone, use: "mobile" }] : []), ...(email ? [{ system: "email", value: email, use: "home" }] : [])] } : {}),
    ...(text(valueOf(patient, "dateOfBirth")) ? { birthDate: text(valueOf(patient, "dateOfBirth")) } : {}),
    gender: fhirGender(valueOf(patient, "gender")),
  };
}

function fhirPractitioner(doctor: HealthcareRecord) {
  const firstName = text(valueOf(doctor, "firstName"));
  const lastName = text(valueOf(doctor, "lastName"));
  const specialty = text(valueOf(doctor, "specialty"));
  const license = text(valueOf(doctor, "license"));
  return {
    resourceType: "Practitioner",
    id: text(doctor.id),
    ...(license ? { identifier: [{ system: "urn:smartmanager:clinician-license", value: license }] } : {}),
    active: !/archived/i.test(text(doctor.status)),
    name: [{ use: "official", ...(lastName ? { family: lastName } : {}), ...(firstName ? { given: [firstName] } : {}), ...(firstName || lastName ? {} : { text: text(doctor.name) }) }],
    ...(specialty ? { qualification: [{ code: { text: specialty } }] } : {}),
  };
}

function fhirEncounter(visit: HealthcareRecord, patientId: string) {
  const encounter = {
    resourceType: "Encounter",
    id: text(visit.id),
    status: encounterStatus(visit.status),
    class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB", display: "ambulatory" },
    subject: reference("Patient", patientId),
    ...(reference("Practitioner", valueOf(visit, "doctorId")) ? { participant: [{ individual: reference("Practitioner", valueOf(visit, "doctorId")) }] } : {}),
    period: {
      ...(text(valueOf(visit, "openedAt")) ? { start: text(valueOf(visit, "openedAt")) } : {}),
      ...(text(valueOf(visit, "closedAt")) ? { end: text(valueOf(visit, "closedAt")) } : {}),
    },
    ...(text(valueOf(visit, "chiefComplaint")) ? { reasonCode: [{ text: text(valueOf(visit, "chiefComplaint")) }] } : {}),
  };
  const diagnosis = text(valueOf(visit, "diagnosis"));
  const condition = diagnosis ? {
    resourceType: "Condition",
    id: `condition-${text(visit.id)}`,
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: encounter.status === "finished" ? "resolved" : "active" }] },
    verificationStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed" }] },
    code: { text: diagnosis },
    subject: reference("Patient", patientId),
    encounter: reference("Encounter", visit.id),
    recordedDate: text(valueOf(visit, "openedAt")) || undefined,
  } : null;
  return { encounter, condition };
}

function fhirVitalObservation(vital: HealthcareRecord, patientId: string) {
  const componentMap: Array<[string, string, string]> = [
    ["bloodPressure", "Blood pressure", "mmHg"],
    ["pulse", "Heart rate", "beats/minute"],
    ["temperature", "Body temperature", "°C"],
    ["weightKg", "Body weight", "kg"],
    ["spo2", "Oxygen saturation", "%"],
    ["respiratoryRate", "Respiratory rate", "breaths/minute"],
    ["painScore", "Pain score", "score"],
  ];
  const components: Array<Record<string, unknown>> = [];
  componentMap.forEach(([key, label, unit]) => {
    const raw = valueOf(vital, key);
    if (raw === "" || raw === null || raw === undefined) return;
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) components.push({ code: { text: label }, valueQuantity: { value: numeric, unit } });
    else components.push({ code: { text: label }, valueString: text(raw) });
  });
  return {
    resourceType: "Observation",
    id: text(vital.id),
    status: "final",
    category: [{ text: "vital-signs" }],
    code: { text: "Vital signs" },
    subject: reference("Patient", patientId),
    ...(reference("Encounter", valueOf(vital, "visitId")) ? { encounter: reference("Encounter", valueOf(vital, "visitId")) } : {}),
    effectiveDateTime: text(valueOf(vital, "recordedAt")) || undefined,
    component: components,
  };
}

function fhirMedicationRequests(prescription: HealthcareRecord, patientId: string) {
  const medications = Array.isArray(valueOf(prescription, "medications")) ? valueOf(prescription, "medications") as Array<Record<string, unknown>> : [];
  return medications.filter((medication) => text(medication.name)).map((medication, index) => ({
    resourceType: "MedicationRequest",
    id: `${text(prescription.id)}-${index + 1}`,
    status: medicationStatus(prescription.status),
    intent: "order",
    medicationCodeableConcept: { text: text(medication.name) },
    subject: reference("Patient", patientId),
    ...(reference("Encounter", valueOf(prescription, "visitId")) ? { encounter: reference("Encounter", valueOf(prescription, "visitId")) } : {}),
    authoredOn: text(valueOf(prescription, "issuedAt")) || undefined,
    ...(reference("Practitioner", valueOf(prescription, "doctorId")) ? { requester: reference("Practitioner", valueOf(prescription, "doctorId")) } : {}),
    dosageInstruction: [{ text: [text(medication.dose), text(medication.frequency), text(medication.days) ? `${text(medication.days)} days` : ""].filter(Boolean).join(" · ") || text(valueOf(prescription, "instructions")) }],
  }));
}

function fhirDiagnosticReport(record: HealthcareRecord, patientId: string, kind: "laboratory" | "radiology") {
  const reportText = kind === "laboratory" ? text(valueOf(record, "results")) : text(valueOf(record, "findings"));
  const descriptor = kind === "laboratory"
    ? (Array.isArray(valueOf(record, "tests")) ? (valueOf(record, "tests") as unknown[]).map(text).filter(Boolean).join(", ") : "Laboratory investigation")
    : text(valueOf(record, "scanType")) || "Diagnostic imaging";
  return {
    resourceType: "DiagnosticReport",
    id: text(record.id),
    status: diagnosticStatus(record),
    category: [{ text: kind }],
    code: { text: descriptor },
    subject: reference("Patient", patientId),
    ...(reference("Encounter", valueOf(record, "visitId")) ? { encounter: reference("Encounter", valueOf(record, "visitId")) } : {}),
    effectiveDateTime: text(valueOf(record, "orderedAt")) || undefined,
    issued: text(valueOf(record, "reportedAt")) || undefined,
    ...(reference("Practitioner", valueOf(record, "doctorId")) ? { basedOn: [{ requester: reference("Practitioner", valueOf(record, "doctorId")) }] } : {}),
    ...(reportText ? { conclusion: reportText } : {}),
  };
}

function fhirDocumentReference(report: HealthcareRecord, patientId: string) {
  const content = text(valueOf(report, "content"));
  return {
    resourceType: "DocumentReference",
    id: text(report.id),
    status: /archived/i.test(text(report.status)) ? "superseded" : "current",
    type: { text: text(valueOf(report, "reportType")) || "Clinical report" },
    subject: reference("Patient", patientId),
    date: text(valueOf(report, "createdAt")) || undefined,
    ...(reference("Practitioner", valueOf(report, "doctorId")) ? { author: [reference("Practitioner", valueOf(report, "doctorId"))] } : {}),
    content: [{ attachment: { contentType: "text/plain", title: text(valueOf(report, "reportType")) || "Clinical report", data: Buffer.from(content, "utf8").toString("base64") } }],
  };
}

export function buildFhirPatientBundle(input: { patient: HealthcareRecord; doctors: HealthcareRecord[]; visits: HealthcareRecord[]; vitals: HealthcareRecord[]; prescriptions: HealthcareRecord[]; labs: HealthcareRecord[]; radiology: HealthcareRecord[]; reports: HealthcareRecord[]; exportedAt?: string }) {
  const patientId = text(input.patient.id);
  const entries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [];
  const add = (resource: Record<string, unknown>) => entries.push({ fullUrl: fullUrl(String(resource.resourceType), resource.id), resource });
  add(fhirPatient(input.patient));
  const clinicianIds = new Set([...input.visits, ...input.prescriptions, ...input.labs, ...input.radiology, ...input.reports].map((record) => text(valueOf(record, "doctorId"))).filter(Boolean));
  input.doctors.filter((doctor) => clinicianIds.has(text(doctor.id))).forEach((doctor) => add(fhirPractitioner(doctor)));
  input.visits.forEach((visit) => {
    const { encounter, condition } = fhirEncounter(visit, patientId);
    add(encounter);
    if (condition) add(condition);
  });
  input.vitals.forEach((vital) => add(fhirVitalObservation(vital, patientId)));
  input.prescriptions.forEach((prescription) => fhirMedicationRequests(prescription, patientId).forEach(add));
  input.labs.forEach((lab) => add(fhirDiagnosticReport(lab, patientId, "laboratory")));
  input.radiology.forEach((study) => add(fhirDiagnosticReport(study, patientId, "radiology")));
  input.reports.forEach((report) => add(fhirDocumentReference(report, patientId)));
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: input.exportedAt || new Date().toISOString(),
    identifier: { system: "urn:smartmanager:fhir-export", value: `patient-${patientId}` },
    entry: entries,
  };
}

function withinRange(record: HealthcareRecord, keys: string[], rangeStart: number) {
  const candidate = keys.map((key) => text(valueOf(record, key))).find(Boolean);
  const time = candidate ? Date.parse(candidate) : Number.NaN;
  return Number.isFinite(time) && time >= rangeStart;
}

function minutesBetween(start: unknown, end: unknown) {
  const startTime = Date.parse(text(start));
  const endTime = Date.parse(text(end));
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return null;
  const minutes = Math.round((endTime - startTime) / 60_000);
  return minutes >= 0 && minutes <= 720 ? minutes : null;
}

export function buildClinicianOperationsAnalytics(input: { doctors: HealthcareRecord[]; appointments: HealthcareRecord[]; visits: HealthcareRecord[]; rangeDays: number; now?: Date }) {
  const now = input.now || new Date();
  const rangeStart = new Date(now.getTime() - input.rangeDays * 86_400_000).getTime();
  const appointments = input.appointments.filter((record) => withinRange(record, ["startsAt"], rangeStart));
  const visits = input.visits.filter((record) => withinRange(record, ["openedAt", "created_at"], rangeStart));
  const visitByAppointment = new Map(visits.map((visit) => [text(valueOf(visit, "appointmentId")), visit]));
  const clinicians = input.doctors.map((doctor) => {
    const doctorId = text(doctor.id);
    const doctorAppointments = appointments.filter((appointment) => text(valueOf(appointment, "doctorId")) === doctorId);
    const doctorVisits = visits.filter((visit) => text(valueOf(visit, "doctorId")) === doctorId);
    const waits = doctorAppointments.flatMap((appointment) => {
      const visit = visitByAppointment.get(text(appointment.id));
      const minutes = visit ? minutesBetween(valueOf(appointment, "checkedInAt"), valueOf(visit, "openedAt")) : null;
      return minutes === null ? [] : [minutes];
    });
    const closedVisits = doctorVisits.filter((visit) => /closed|complete|finish/i.test(text(visit.status))).length;
    const scheduled = doctorAppointments.filter((appointment) => /scheduled|confirmed/i.test(text(appointment.status))).length;
    return {
      clinicianId: doctorId,
      clinicianName: text(doctor.name),
      specialty: text(valueOf(doctor, "specialty")) || "Clinical care",
      appointments: doctorAppointments.length,
      scheduledAppointments: scheduled,
      checkedInAppointments: doctorAppointments.filter((appointment) => /checked|arrived/i.test(text(appointment.status))).length,
      openVisits: doctorVisits.filter((visit) => /open|progress/i.test(text(visit.status))).length,
      closedVisits,
      averageWaitMinutes: waits.length ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length) : null,
      waitSampleCount: waits.length,
    };
  }).sort((left, right) => right.appointments - left.appointments || left.clinicianName.localeCompare(right.clinicianName));
  const waitSamples = clinicians.flatMap((clinician) => clinician.averageWaitMinutes === null ? [] : Array.from({ length: clinician.waitSampleCount }, () => clinician.averageWaitMinutes as number));
  return {
    rangeDays: input.rangeDays,
    generatedAt: now.toISOString(),
    clinicians,
    totals: {
      appointments: appointments.length,
      openVisits: visits.filter((visit) => /open|progress/i.test(text(visit.status))).length,
      closedVisits: visits.filter((visit) => /closed|complete|finish/i.test(text(visit.status))).length,
      averageWaitMinutes: waitSamples.length ? Math.round(waitSamples.reduce((sum, value) => sum + value, 0) / waitSamples.length) : null,
      waitSampleCount: waitSamples.length,
    },
  };
}

function patientIdOf(record: HealthcareRecord) {
  return text(valueOf(record, "patientId"));
}

export async function exportHealthcareFhirBundle(req: CreateExpressContextOptions["req"], input: z.infer<typeof healthcareFhirExportInput>) {
  const { profile } = await resolveVerifiedProfile(req);
  const access = healthcareAccessForRole(profile.role);
  if (!FHIR_SOURCE_TABLES.every((table) => access.canRead[table])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "FHIR clinical exports require a clinician or healthcare-administrator role." });
  }
  const lists = await Promise.all(FHIR_SOURCE_TABLES.map((table) => listHealthcareRecords(req, { table, includeArchived: false, limit: 250 })));
  const records = Object.fromEntries(FHIR_SOURCE_TABLES.map((table, index) => [table, lists[index].records])) as Record<string, HealthcareRecord[]>;
  const fromTable = (table: HealthcareTable) => records[table] || [];
  const patient = fromTable("hc_patients").find((record) => text(record.id) === input.patientId);
  if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "The requested patient record is no longer available for export." });
  const matches = (table: HealthcareTable) => fromTable(table).filter((record) => patientIdOf(record) === input.patientId);
  const bundle = buildFhirPatientBundle({
    patient,
    doctors: fromTable("hc_doctors"),
    visits: matches("hc_visits"),
    vitals: matches("hc_vitals"),
    prescriptions: matches("hc_prescriptions"),
    labs: matches("hc_lab_orders"),
    radiology: matches("hc_radiology"),
    reports: matches("hc_reports"),
  });
  return { bundle, patientId: input.patientId, resourceCount: bundle.entry.length, profile: "FHIR R4 collection" };
}

export async function getHealthcareClinicianAnalytics(req: CreateExpressContextOptions["req"], input: z.infer<typeof healthcareAnalyticsInput>) {
  const { profile } = await resolveVerifiedProfile(req);
  const access = healthcareAccessForRole(profile.role);
  const sourceTables: HealthcareTable[] = ["hc_doctors", "hc_appointments", "hc_visits"];
  if (!sourceTables.every((table) => access.canRead[table])) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Clinician operations analytics require clinical scheduling access." });
  }
  const [doctors, appointments, visits] = await Promise.all(sourceTables.map((table) => listHealthcareRecords(req, { table, includeArchived: false, limit: 250 })));
  return buildClinicianOperationsAnalytics({ doctors: doctors.records, appointments: appointments.records, visits: visits.records, rangeDays: input.rangeDays });
}
