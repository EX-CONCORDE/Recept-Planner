import { z } from "zod/v4";

export const updateGeminiSettingsSchema = z.object({
  apiKey: z.string().trim().min(1).max(500).optional(),
  clearApiKey: z.boolean().default(false),
  model: z.string().trim().min(1, "モデル名は必須です").max(100),
  apiBaseUrl: z
    .string()
    .url("API URLの形式が正しくありません")
    .max(300),
  receiptImageMaxDimension: z
    .number()
    .int()
    .min(256, "画像サイズは256以上です")
    .max(2048, "画像サイズは2048以下です"),
  receiptImageJpegQuality: z
    .number()
    .int()
    .min(1, "JPEG品質は1以上です")
    .max(100, "JPEG品質は100以下です"),
});

export type UpdateGeminiSettingsInput = z.infer<
  typeof updateGeminiSettingsSchema
>;
