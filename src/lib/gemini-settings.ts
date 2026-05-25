import { prisma } from "@/lib/prisma";

const SETTING_KEYS = {
  apiKey: "gemini.apiKey",
  model: "gemini.model",
  apiBaseUrl: "gemini.apiBaseUrl",
  receiptImageMaxDimension: "receipt.imageMaxDimension",
  receiptImageJpegQuality: "receipt.imageJpegQuality",
} as const;

const DEFAULT_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_IMAGE_MAX_DIMENSION = 1024;
const DEFAULT_IMAGE_JPEG_QUALITY = 80;

export interface GeminiRuntimeSettings {
  apiKey: string | null;
  apiKeySource: "database" | "environment" | "none";
  model: string;
  apiBaseUrl: string;
  receiptImageMaxDimension: number;
  receiptImageJpegQuality: number;
}

function parseIntSetting(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function previewSecret(value: string | null): string | null {
  if (!value) return null;
  const tail = value.slice(-4);
  return `...${tail}`;
}

export function maskGeminiSettings(settings: GeminiRuntimeSettings) {
  return {
    apiKeyConfigured: Boolean(settings.apiKey),
    apiKeyPreview: previewSecret(settings.apiKey),
    apiKeySource: settings.apiKeySource,
    model: settings.model,
    apiBaseUrl: settings.apiBaseUrl,
    receiptImageMaxDimension: settings.receiptImageMaxDimension,
    receiptImageJpegQuality: settings.receiptImageJpegQuality,
  };
}

export async function getGeminiSettings(): Promise<GeminiRuntimeSettings> {
  const keys = Object.values(SETTING_KEYS);
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: keys } },
  });
  const settings = new Map(rows.map((row) => [row.key, row.value]));

  const dbApiKey = settings.get(SETTING_KEYS.apiKey) || null;
  const envApiKey = process.env.GEMINI_API_KEY || null;
  const apiKey = dbApiKey || envApiKey;
  const apiKeySource = dbApiKey ? "database" : envApiKey ? "environment" : "none";

  const model =
    settings.get(SETTING_KEYS.model) ||
    process.env.GEMINI_MODEL ||
    DEFAULT_MODEL;
  const apiBaseUrl =
    settings.get(SETTING_KEYS.apiBaseUrl) ||
    process.env.GEMINI_API_BASE_URL ||
    DEFAULT_API_BASE_URL;

  const receiptImageMaxDimension = clamp(
    parseIntSetting(
      settings.get(SETTING_KEYS.receiptImageMaxDimension) ||
        process.env.RECEIPT_IMAGE_MAX_DIMENSION,
      DEFAULT_IMAGE_MAX_DIMENSION,
    ),
    256,
    2048,
  );
  const receiptImageJpegQuality = clamp(
    parseIntSetting(
      settings.get(SETTING_KEYS.receiptImageJpegQuality) ||
        process.env.RECEIPT_IMAGE_JPEG_QUALITY,
      DEFAULT_IMAGE_JPEG_QUALITY,
    ),
    1,
    100,
  );

  return {
    apiKey,
    apiKeySource,
    model,
    apiBaseUrl,
    receiptImageMaxDimension,
    receiptImageJpegQuality,
  };
}

async function upsertSetting(key: string, value: string) {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function saveGeminiSettings(input: {
  apiKey?: string;
  clearApiKey: boolean;
  model: string;
  apiBaseUrl: string;
  receiptImageMaxDimension: number;
  receiptImageJpegQuality: number;
}) {
  await Promise.all([
    upsertSetting(SETTING_KEYS.model, input.model),
    upsertSetting(SETTING_KEYS.apiBaseUrl, input.apiBaseUrl.replace(/\/$/, "")),
    upsertSetting(
      SETTING_KEYS.receiptImageMaxDimension,
      String(input.receiptImageMaxDimension),
    ),
    upsertSetting(
      SETTING_KEYS.receiptImageJpegQuality,
      String(input.receiptImageJpegQuality),
    ),
  ]);

  if (input.clearApiKey) {
    await prisma.appSetting.deleteMany({
      where: { key: SETTING_KEYS.apiKey },
    });
  } else if (input.apiKey) {
    await upsertSetting(SETTING_KEYS.apiKey, input.apiKey);
  }

  return getGeminiSettings();
}
