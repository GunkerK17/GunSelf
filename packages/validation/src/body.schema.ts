import { z } from "zod";

export const bodyLogSchema = z.object({
  weightKg: z.number().positive().optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  note: z.string().max(2000).optional(),
  loggedAt: z.string().datetime().optional()
});
