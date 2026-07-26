import { z } from "zod/v4";

export const updateAiSettingsSchema = z.object({
  provider: z.enum(["gemini", "lmstudio"]).default("gemini"),
  geminiApiKey: z.string().trim().min(1).max(500).optional(),
  clearGeminiApiKey: z.boolean().default(false),
  geminiModel: z.string().trim().min(1, "モデル名は必須です").max(100),
  geminiApiBaseUrl: z
    .string()
    .url("API URLの形式が正しくありません")
    .max(300),
  lmstudioBaseUrl: z
    .string()
    .url("LM Studio URLの形式が正しくありません")
    .max(300),
  lmstudioModel: z.string().trim().min(1, "モデル名は必須です").max(100),
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

export type UpdateAiSettingsInput = z.infer<typeof updateAiSettingsSchema>;
