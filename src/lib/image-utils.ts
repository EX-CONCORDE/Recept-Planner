import sharp from "sharp";
import { readFile } from "node:fs/promises";

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 80;

export async function resizeAndEncode(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const resized = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
  return resized.toString("base64");
}

export function isAllowedImageType(mimeType: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(mimeType);
}
