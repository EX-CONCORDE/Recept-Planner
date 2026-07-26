import { prisma } from "@/lib/prisma";

const SETTING_KEYS = {
  provider: "ai.provider",
  geminiApiKey: "gemini.apiKey",
  geminiModel: "gemini.model",
  geminiApiBaseUrl: "gemini.apiBaseUrl",
  lmstudioBaseUrl: "lmstudio.baseUrl",
  lmstudioModel: "lmstudio.model",
  receiptImageMaxDimension: "receipt.imageMaxDimension",
  receiptImageJpegQuality: "receipt.imageJpegQuality",
} as const;

const DEFAULT_GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_LMSTUDIO_BASE_URL = "http://localhost:1234/v1";
const DEFAULT_LMSTUDIO_MODEL = "google/gemma-4-e4b";
const DEFAULT_IMAGE_MAX_DIMENSION = 1024;
const DEFAULT_IMAGE_JPEG_QUALITY = 80;
const DEFAULT_PROVIDER: AiProviderName = "gemini";

export type AiProviderName = "gemini" | "lmstudio";

export interface AiRuntimeSettings {
  provider: AiProviderName;
  gemini: {
    apiKey: string | null;
    apiKeySource: "database" | "environment" | "none";
    model: string;
    apiBaseUrl: string;
  };
  lmstudio: {
    baseUrl: string;
    model: string;
  };
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

function parseProvider(value: string | undefined): AiProviderName {
  return value === "lmstudio" ? "lmstudio" : DEFAULT_PROVIDER;
}

export function maskAiSettings(settings: AiRuntimeSettings) {
  return {
    provider: settings.provider,
    gemini: {
      apiKeyConfigured: Boolean(settings.gemini.apiKey),
      apiKeyPreview: previewSecret(settings.gemini.apiKey),
      apiKeySource: settings.gemini.apiKeySource,
      model: settings.gemini.model,
      apiBaseUrl: settings.gemini.apiBaseUrl,
    },
    lmstudio: {
      baseUrl: settings.lmstudio.baseUrl,
      model: settings.lmstudio.model,
    },
    receiptImageMaxDimension: settings.receiptImageMaxDimension,
    receiptImageJpegQuality: settings.receiptImageJpegQuality,
  };
}

export async function getAiSettings(): Promise<AiRuntimeSettings> {
  const keys = Object.values(SETTING_KEYS);
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: keys } },
  });
  const settings = new Map(rows.map((row) => [row.key, row.value]));

  const dbApiKey = settings.get(SETTING_KEYS.geminiApiKey) || null;
  const envApiKey = process.env.GEMINI_API_KEY || null;
  const apiKey = dbApiKey || envApiKey;
  const apiKeySource = dbApiKey ? "database" : envApiKey ? "environment" : "none";

  const geminiModel =
    settings.get(SETTING_KEYS.geminiModel) ||
    process.env.GEMINI_MODEL ||
    DEFAULT_GEMINI_MODEL;
  const geminiApiBaseUrl =
    settings.get(SETTING_KEYS.geminiApiBaseUrl) ||
    process.env.GEMINI_API_BASE_URL ||
    DEFAULT_GEMINI_API_BASE_URL;

  const provider = parseProvider(
    settings.get(SETTING_KEYS.provider) || process.env.AI_PROVIDER,
  );

  const lmstudioBaseUrl =
    settings.get(SETTING_KEYS.lmstudioBaseUrl) ||
    process.env.LMSTUDIO_BASE_URL ||
    DEFAULT_LMSTUDIO_BASE_URL;
  const lmstudioModel =
    settings.get(SETTING_KEYS.lmstudioModel) ||
    process.env.LMSTUDIO_MODEL ||
    DEFAULT_LMSTUDIO_MODEL;

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
    provider,
    gemini: {
      apiKey,
      apiKeySource,
      model: geminiModel,
      apiBaseUrl: geminiApiBaseUrl,
    },
    lmstudio: {
      baseUrl: lmstudioBaseUrl.replace(/\/$/, ""),
      model: lmstudioModel,
    },
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

export async function saveAiSettings(input: {
  provider: AiProviderName;
  geminiApiKey?: string;
  clearGeminiApiKey: boolean;
  geminiModel: string;
  geminiApiBaseUrl: string;
  lmstudioBaseUrl: string;
  lmstudioModel: string;
  receiptImageMaxDimension: number;
  receiptImageJpegQuality: number;
}) {
  await Promise.all([
    upsertSetting(SETTING_KEYS.provider, input.provider),
    upsertSetting(SETTING_KEYS.geminiModel, input.geminiModel),
    upsertSetting(
      SETTING_KEYS.geminiApiBaseUrl,
      input.geminiApiBaseUrl.replace(/\/$/, ""),
    ),
    upsertSetting(
      SETTING_KEYS.lmstudioBaseUrl,
      input.lmstudioBaseUrl.replace(/\/$/, ""),
    ),
    upsertSetting(SETTING_KEYS.lmstudioModel, input.lmstudioModel),
    upsertSetting(
      SETTING_KEYS.receiptImageMaxDimension,
      String(input.receiptImageMaxDimension),
    ),
    upsertSetting(
      SETTING_KEYS.receiptImageJpegQuality,
      String(input.receiptImageJpegQuality),
    ),
  ]);

  if (input.clearGeminiApiKey) {
    await prisma.appSetting.deleteMany({
      where: { key: SETTING_KEYS.geminiApiKey },
    });
  } else if (input.geminiApiKey) {
    await upsertSetting(SETTING_KEYS.geminiApiKey, input.geminiApiKey);
  }

  return getAiSettings();
}
