import { z } from "zod";

export const mealSchema = z.object({
  title: z.string().min(1),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  calories: z.number().nonnegative().optional(),
  proteinG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  fatG: z.number().nonnegative().optional(),
  loggedAt: z.string().datetime().optional()
});
