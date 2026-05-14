import { z } from "zod";

export const workoutSchema = z.object({
  name: z.string().min(1),
  durationMinutes: z.number().int().nonnegative().optional(),
  caloriesBurned: z.number().nonnegative().optional(),
  note: z.string().max(2000).optional(),
  loggedAt: z.string().datetime().optional()
});
