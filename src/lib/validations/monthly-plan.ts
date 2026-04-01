import { z } from "zod/v4";

export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で指定してください");

export const upsertMonthlyPlanSchema = z.object({
  yearMonth: yearMonthSchema,
  monthlyIncome: z.number().int().min(0, "収入は0以上です"),
  savingTargetAmount: z.number().int().min(0, "貯金目標は0以上です"),
  savingTargetRate: z.number().min(0).max(100).nullable().default(null),
});

export type UpsertMonthlyPlanInput = z.infer<typeof upsertMonthlyPlanSchema>;
