import { z } from "zod/v4";

export const billingCycleSchema = z.enum(["monthly", "yearly"]);

export const createSubscriptionSchema = z.object({
  name: z.string().min(1, "サービス名は必須です").max(200),
  amount: z
    .number()
    .int()
    .positive("金額は1以上です")
    .max(10_000_000, "金額は1,000万以下です"),
  billingCycle: billingCycleSchema,
  categoryId: z.number().int().positive().nullable().default(null),
  nextBillingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式です"),
  presetKey: z.string().max(100).nullable().default(null),
  icon: z.string().max(50).nullable().default(null),
  color: z.string().max(20).nullable().default(null),
  memo: z.string().max(500).nullable().default(null),
});

export const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().max(10_000_000).optional(),
  billingCycle: billingCycleSchema.optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  nextBillingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  isActive: z.boolean().optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  memo: z.string().max(500).nullable().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
