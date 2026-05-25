import { z } from "zod/v4";
import { yearMonthSchema } from "@/lib/validations/monthly-plan";

export const assistantChatSchema = z.object({
  message: z.string().trim().min(1, "メッセージを入力してください").max(2000),
});

export const adviceRequestSchema = z.object({
  yearMonth: yearMonthSchema.optional(),
});
