import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { getGeminiSettings } from "@/lib/gemini-settings";

export async function resizeAndEncode(filePath: string): Promise<string> {
  const settings = await getGeminiSettings();
  const buffer = await readFile(filePath);
  const resized = await sharp(buffer)
    .resize(settings.receiptImageMaxDimension, settings.receiptImageMaxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: settings.receiptImageJpegQuality })
    .toBuffer();
  return resized.toString("base64");
}

export function isAllowedImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(mimeType);
}
