const LMSTUDIO_BASE_URL = process.env.LMSTUDIO_BASE_URL || "http://localhost:1234";
const LMSTUDIO_MODEL = process.env.LMSTUDIO_MODEL || "gemma-3-12b";
const TIMEOUT_MS = 60_000;

interface LMStudioMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface LMStudioResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function chatCompletion(messages: LMStudioMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${LMSTUDIO_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LMSTUDIO_MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`LMStudio API error: ${res.status} ${res.statusText}`);
    }

    const data: LMStudioResponse = await res.json();
    return data.choices[0]?.message?.content ?? "";
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractReceiptData(base64Image: string): Promise<string> {
  return chatCompletion([
    {
      role: "system",
      content:
        "あなたはレシート・請求書の読み取りアシスタントです。画像から情報を抽出し、必ずJSON形式のみで回答してください。JSONの外にテキストを含めないでください。",
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64Image}` },
        },
        {
          type: "text",
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
食費, 交通費, 日用品, 娯楽, 医療費, 通信費, 光熱費, 衣服, 教育, 住居費, 保険, サブスク, その他, 給与, 副収入, その他収入`,
        },
      ],
    },
  ]);
}
