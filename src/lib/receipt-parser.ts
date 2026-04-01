import { z } from "zod/v4";

const receiptItemSchema = z.object({
  name: z.string().default("不明"),
  price: z.number().default(0),
});

export const receiptExtractionSchema = z.object({
  store: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  total: z.number().default(0),
  tax: z.number().nullable().default(null),
  category: z.string().default("その他"),
  txType: z.enum(["expense", "income"]).default("expense"),
  items: z.array(receiptItemSchema).default([]),
  memo: z.string().nullable().default(null),
});

export type ReceiptExtraction = z.infer<typeof receiptExtractionSchema>;

export function parseAiResponse(raw: string): ReceiptExtraction {
  // AIレスポンスからJSONブロックを抽出
  let jsonStr = raw;

  // ```json ... ``` のコードブロック内を取得
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // { ... } を最初から最後まで取得
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonStr = braceMatch[0];
    }
  }

  const parsed = JSON.parse(jsonStr);
  return receiptExtractionSchema.parse(parsed);
}
