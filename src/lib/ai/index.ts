import { getAiSettings } from "@/lib/ai-settings";
import { createGeminiProvider } from "./gemini-provider";
import { createLmStudioProvider } from "./lmstudio-provider";
import type { GenerateTextParams } from "./types";

export type { AiContent, AiPart, AiProvider, GenerateTextParams } from "./types";

export async function generateAiText(params: GenerateTextParams): Promise<string> {
  const settings = await getAiSettings();

  const provider =
    settings.provider === "lmstudio"
      ? createLmStudioProvider(settings.lmstudio)
      : createGeminiProvider(settings.gemini);

  return provider.generateText(params);
}

export async function extractReceiptData(base64Image: string): Promise<string> {
  return generateAiText({
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
