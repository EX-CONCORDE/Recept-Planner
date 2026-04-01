import { z } from "zod/v4";

export const yearMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で指定してください");

export const upsertMonthlyPlanSchema = z.object({
  yearMonth: yearMonthSchema,
  monthlyIncome: z.number().int().min(0, "収入は0以上です"),
  grossIncome: z.number().int().min(0).nullable().default(null),
  age: z.number().int().min(15).max(75).nullable().default(null),
  prefecture: z.string().max(10).nullable().default(null),
  bonusMonths: z.number().min(0).max(12).nullable().default(null),
  autoCalcTax: z.boolean().default(false),
  savingTargetAmount: z.number().int().min(0, "貯金目標は0以上です"),
  savingTargetRate: z.number().min(0).max(100).nullable().default(null),
});

export type UpsertMonthlyPlanInput = z.infer<typeof upsertMonthlyPlanSchema>;
