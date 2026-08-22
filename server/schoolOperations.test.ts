import { describe, expect, it } from "vitest";
import {
  schoolAccessForRole,
  schoolAdmissionInput,
  schoolAttendanceInput,
  schoolDocumentUploadInput,
  schoolGradingScaleInput,
  schoolInvoiceInput,
  schoolPaymentInput,
  schoolScoreInput,
  schoolTimetableInput,
} from "./schoolOperations";

const id = "00000000-0000-4000-8000-000000000000";

describe("School Management role boundaries", () => {
  it("separates academic, fee, and portal capabilities", () => {
    const teacher = schoolAccessForRole("Teacher");
    const bursar = schoolAccessForRole("Bursar");
    const guardian = schoolAccessForRole("Guardian");

    expect(teacher.canTeach).toBe(true);
    expect(teacher.canManageFinance).toBe(false);
    expect(bursar.canManageFinance).toBe(true);
    expect(bursar.canManageAcademic).toBe(false);
    expect(guardian.canUsePortal).toBe(true);
    expect(guardian.canRead).toBe(false);
  });

  it("allows school administrators to operate each school domain", () => {
    const admin = schoolAccessForRole("School Administrator");
    expect(admin.canConfigure).toBe(true);
    expect(admin.canManageAdmissions).toBe(true);
    expect(admin.canManageAcademic).toBe(true);
    expect(admin.canManageFinance).toBe(true);
    expect(admin.canManageServices).toBe(true);
    expect(admin.canGovern).toBe(true);
  });

  it("maps the live workspace owner designation to full School Management administration", () => {
    const owner = schoolAccessForRole("owner");
    expect(owner.canRead).toBe(true);
    expect(owner.canConfigure).toBe(true);
    expect(owner.canManageAdmissions).toBe(true);
    expect(owner.canManageAcademic).toBe(true);
    expect(owner.canManageFinance).toBe(true);
    expect(owner.canManageServices).toBe(true);
    expect(owner.canGovern).toBe(true);
  });
});

describe("School Management input contracts", () => {
  it("requires a safe complete admissions envelope", () => {
    expect(schoolAdmissionInput.safeParse({ studentName: "Asha", gender: "Female", dateOfBirth: "2015-01-01", guardianName: "Parent", guardianPhone: "", relationship: "Parent", academicYearId: id, classId: id }).success).toBe(false);
    expect(schoolAdmissionInput.safeParse({ studentName: "Asha", gender: "Female", dateOfBirth: "2015-01-01", guardianName: "Parent", guardianPhone: "0712345678", relationship: "Parent", academicYearId: id, classId: id }).success).toBe(true);
  });

  it("rejects overlapping or malformed grading ranges", () => {
    expect(schoolGradingScaleInput.safeParse({ name: "Scale", bands: [] }).success).toBe(false);
    expect(schoolGradingScaleInput.safeParse({ name: "Scale", bands: [{ grade: "A", min: 80, max: 100, points: 1 }] }).success).toBe(true);
  });

  it("bounds score, attendance, timetable, invoice, and payment contracts", () => {
    expect(schoolScoreInput.safeParse({ assessmentId: id, scores: [] }).success).toBe(false);
    expect(schoolAttendanceInput.safeParse({ sessionId: id, records: [{ studentId: "bad", status: "Present" }] }).success).toBe(false);
    expect(schoolTimetableInput.safeParse({ termId: id, classId: id, subjectId: id, teacherAssignmentId: id, weekday: "Monday", startsAt: "9:00", endsAt: "10:00" }).success).toBe(false);
    expect(schoolInvoiceInput.safeParse({ studentId: id, termId: id, feeStructureIds: [], dueDate: "2026-09-01" }).success).toBe(false);
    expect(schoolPaymentInput.safeParse({ invoiceId: id, amount: 0, method: "Cash" }).success).toBe(false);
    expect(schoolPaymentInput.safeParse({ invoiceId: id, amount: 1000, method: "Mobile money" }).success).toBe(true);
  });

  it("limits School Management uploads to permitted types and a validated owner", () => {
    expect(schoolDocumentUploadInput.safeParse({ ownerType: "Student", ownerId: "bad", fileName: "report.pdf", mimeType: "application/pdf", access: "Restricted", base64: "AAAA" }).success).toBe(false);
    expect(schoolDocumentUploadInput.safeParse({ ownerType: "Student", ownerId: id, fileName: "report.exe", mimeType: "application/octet-stream", access: "Restricted", base64: "AAAA" }).success).toBe(false);
    expect(schoolDocumentUploadInput.safeParse({ ownerType: "Student", ownerId: id, fileName: "report.pdf", mimeType: "application/pdf", access: "Restricted", base64: "AAAA" }).success).toBe(true);
  });
});
