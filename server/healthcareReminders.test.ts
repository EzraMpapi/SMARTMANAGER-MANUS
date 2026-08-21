import { describe, expect, it } from "vitest";
import { buildReminderDeliveryRecord, createReminderIdempotencyKey, processAppointmentReminders } from "./healthcareReminders";

describe("healthcare appointment reminder safety boundary", () => {
  const appointment = {
    appointmentId: "22222222-2222-4222-8222-222222222222",
    patientId: "33333333-3333-4333-8333-333333333333",
    scheduledFor: "2026-09-01T08:00:00.000Z",
    leadMinutes: 1_440,
  };

  it("uses a deterministic appointment and schedule-window idempotency key", () => {
    expect(createReminderIdempotencyKey(appointment)).toBe(createReminderIdempotencyKey({ ...appointment }));
    expect(createReminderIdempotencyKey({ ...appointment, leadMinutes: 120 })).not.toBe(createReminderIdempotencyKey(appointment));
  });

  it("prepares an explicit provider-unconfigured record without a phone number or provider secret", () => {
    const record = buildReminderDeliveryRecord(appointment);
    expect(record.status).toBe("Provider unconfigured");
    expect(record.data).toMatchObject({ appointmentId: appointment.appointmentId, patientId: appointment.patientId, errorCategory: "provider_unconfigured", attemptCount: 0 });
    expect(JSON.stringify(record)).not.toContain("phone");
    expect(JSON.stringify(record)).not.toContain("apiKey");
  });

  it("fails closed when the scheduled callback is reached before provider activation", async () => {
    await expect(processAppointmentReminders("task-safe-boundary")).resolves.toEqual({ ok: true, skipped: "provider_unconfigured", attempted: 0, delivered: 0, failed: 0 });
  });
});
