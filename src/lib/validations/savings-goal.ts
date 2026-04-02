import { z } from "zod/v4";

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, "目標名は必須です").max(200),
  targetAmount: z.number().int().positive("目標額は1以上です"),
  currentAmount: z.number().int().min(0).default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}$/).nullable().default(null),
});

export const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  targetAmount: z.number().int().positive().optional(),
  currentAmount: z.number().int().min(0).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}$/).nullable().optional(),
  isActive: z.boolean().optional(),
});
