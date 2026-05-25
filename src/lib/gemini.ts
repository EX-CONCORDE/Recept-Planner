import { getGeminiSettings } from "@/lib/gemini-settings";

const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const TIMEOUT_MS = 60_000;

interface GeminiPart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
}

export interface GeminiContent {
  role?: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
}

function modelPath(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`;
}

function apiBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function extractText(data: GeminiResponse): string {
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (text) return text;

  const blockReason = data.promptFeedback?.blockReason;
  if (blockReason) {
    throw new Error(`Gemini response blocked: ${blockReason}`);
  }

  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason) {
    throw new Error(`Gemini returned no text: ${finishReason}`);
  }

  throw new Error("Gemini returned no text");
}

export async function generateGeminiText({
  contents,
  systemInstruction,
  temperature = 0.2,
  maxOutputTokens = 2048,
  responseMimeType,
}: {
  contents: GeminiContent[];
  systemInstruction: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
}): Promise<string> {
  const settings = await getGeminiSettings();

  if (!settings.apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${apiBaseUrl(settings.apiBaseUrl || GEMINI_API_BASE_URL)}/${modelPath(
        settings.model || GEMINI_MODEL,
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": settings.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: systemInstruction,
              },
            ],
          },
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens,
            ...(responseMimeType ? { responseMimeType } : {}),
          },
        }),
        signal: controller.signal,
      },
    );

    const data = (await res.json()) as GeminiResponse;

    if (!res.ok) {
      throw new Error(
        data.error?.message || `Gemini API error: ${res.status} ${res.statusText}`,
      );
    }

    return extractText(data);
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractReceiptData(base64Image: string): Promise<string> {
  return generateGeminiText({
    systemInstruction:
      "あなたはレシート・請求書の読み取りアシスタントです。画像から情報を抽出し、必ずJSON形式のみで回答してください。JSONの外にテキストを含めないでください。",
    temperature: 0.1,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
    contents: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `この画像から以下の情報をJSON形式で抽出してください。

{
  "store": "店名または請求元",
  "date": "YYYY-MM-DD（不明なら null）",
  "total": 合計金額（数値、不明なら 0）,
  "tax": 税額（数値、不明なら null）,
  "category": "推定カテゴリ",
  "txType": "expense または income",
  "items": [{"name": "品名", "price": 金額}],
  "memo": "その他の情報"
}

カテゴリは次から最も近いものを選んでください:
食費, 交通費, 日用品, 娯楽, 医療費, 通信費, 光熱費, 衣服, 教育, 住居費, 保険, サブスク, その他, 給与, 副収入, その他収入

明細が多い場合、items は重要なものを最大20件までにしてください。`,
          },
        ],
      },
    ],
  });
}
