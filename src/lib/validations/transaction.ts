import { z } from "zod/v4";

export const txTypeSchema = z.enum(["expense", "income"]);

export const createTransactionSchema = z.object({
  txType: txTypeSchema,
  amount: z.number().int().positive("金額は1以上の整数です"),
  txDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式です"),
  categoryId: z.number().int().positive().nullable().default(null),
  merchantName: z.string().max(300).nullable().default(null),
  memo: z.string().max(500).nullable().default(null),
  receiptId: z.number().int().positive().nullable().default(null),
  source: z.enum(["manual", "ai"]).default("manual"),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  yearMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "YYYY-MM形式で指定してください")
    .optional(),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
