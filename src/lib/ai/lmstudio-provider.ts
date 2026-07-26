import type { AiContent, AiProvider, GenerateTextParams } from "./types";

// ローカル推論はGemini APIより応答が遅いため、タイムアウトを長めに取る
const TIMEOUT_MS = 120_000;

const CONNECTION_ERROR_MESSAGE =
  "LM Studioに接続できません。LM Studioが起動していて、ローカルサーバー（ポート1234）が有効か確認してください。";

interface LmStudioResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  error?: { message?: string } | string;
}

export interface LmStudioProviderSettings {
  baseUrl: string;
  model: string;
}

type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenAiMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAiContentPart[];
}

// LM Studioの画面には "http://localhost:1234" とだけ表示されることが多く、
// OpenAI互換エンドポイントに必要な /v1 が抜けやすいため自動で補う
function normalizeBaseUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  return /\/v1$/.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

function toOpenAiMessage(content: AiContent): OpenAiMessage {
  const role = content.role === "model" ? "assistant" : "user";
  const hasImage = content.parts.some((part) => part.inline_data);

  if (!hasImage) {
    return {
      role,
      content: content.parts.map((part) => part.text ?? "").join(""),
    };
  }

  const parts: OpenAiContentPart[] = content.parts.map((part) =>
    part.inline_data
      ? {
          type: "image_url",
          image_url: {
            url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`,
          },
        }
      : { type: "text", text: part.text ?? "" },
  );

  return { role, content: parts };
}

function extractText(data: LmStudioResponse): string {
  const text = data.choices?.[0]?.message?.content?.trim();
  if (text) return text;

  const finishReason = data.choices?.[0]?.finish_reason;
  if (finishReason) {
    throw new Error(`LM Studioが応答を返しませんでした: ${finishReason}`);
  }

  throw new Error("LM Studioが応答を返しませんでした");
}

export function createLmStudioProvider(
  settings: LmStudioProviderSettings,
): AiProvider {
  return {
    async generateText({
      contents,
      systemInstruction,
      temperature = 0.2,
      maxOutputTokens = 2048,
      responseMimeType,
    }: GenerateTextParams): Promise<string> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch(`${normalizeBaseUrl(settings.baseUrl)}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              { role: "system", content: systemInstruction },
              ...contents.map(toOpenAiMessage),
            ],
            temperature,
            max_tokens: maxOutputTokens,
            ...(responseMimeType === "application/json"
              ? { response_format: { type: "json_object" } }
              : {}),
          }),
          signal: controller.signal,
        });

        let data: LmStudioResponse;
        try {
          data = (await res.json()) as LmStudioResponse;
        } catch {
          throw new Error(CONNECTION_ERROR_MESSAGE);
        }

        if (!res.ok) {
          const message =
            typeof data.error === "string" ? data.error : data.error?.message;
          throw new Error(
            message || `LM Studio API error: ${res.status} ${res.statusText}`,
          );
        }

        return extractText(data);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error(
            "LM Studioの応答がタイムアウトしました。モデルの読み込み状況を確認してください。",
          );
        }
        if (e instanceof TypeError) {
          throw new Error(CONNECTION_ERROR_MESSAGE);
        }
        throw e;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
