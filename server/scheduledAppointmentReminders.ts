import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { processAppointmentReminders } from "./healthcareReminders";

export async function scheduledAppointmentRemindersHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "Unauthorized scheduled callback." });
    return res.json(await processAppointmentReminders(user.taskUid));
  } catch {
    return res.status(500).json({ error: "Appointment reminder processing could not be completed." });
  }
}
