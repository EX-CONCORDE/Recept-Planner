import type { AiProvider, GenerateTextParams } from "./types";

const TIMEOUT_MS = 60_000;

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

export interface GeminiProviderSettings {
  apiKey: string | null;
  model: string;
  apiBaseUrl: string;
}

function modelPath(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`;
}

function trimBaseUrl(url: string): string {
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

export function createGeminiProvider(settings: GeminiProviderSettings): AiProvider {
  return {
    async generateText({
      contents,
      systemInstruction,
      temperature = 0.2,
      maxOutputTokens = 2048,
      responseMimeType,
    }: GenerateTextParams): Promise<string> {
      if (!settings.apiKey) {
        throw new Error("GEMINI_API_KEY が設定されていません");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(
          `${trimBaseUrl(settings.apiBaseUrl)}/${modelPath(
            settings.model,
          )}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": settings.apiKey,
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstruction }],
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
    },
  };
}
