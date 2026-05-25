import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { formatYen } from "@/lib/format";
import { generateGeminiText } from "@/lib/gemini";

const actionExtractionSchema = z.object({
  intent: z.enum(["none", "create_transaction", "needs_clarification"]),
  reply: z.string().default(""),
  transaction: z
    .object({
      txType: z.enum(["expense", "income"]).nullable().default(null),
      amount: z.number().int().positive().nullable().default(null),
      txDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .default(null),
      categoryName: z.string().nullable().default(null),
      merchantName: z.string().nullable().default(null),
      memo: z.string().nullable().default(null),
    })
    .nullable()
    .default(null),
});

type ActionExtraction = z.infer<typeof actionExtractionSchema>;

function todayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseJson(raw: string): unknown {
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return JSON.parse(codeBlockMatch[1].trim());

  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) return JSON.parse(braceMatch[0]);

  return JSON.parse(raw);
}

function buildActionSystemInstruction({
  today,
  categories,
}: {
  today: string;
  categories: Array<{ name: string; type: string }>;
}) {
  return `あなたは家計アプリの操作意図をJSONに変換する分類器です。説明文は出さず、JSONだけを返してください。

許可された操作:
- create_transaction: 明示的に「支出/収入/入金/買ったもの/使ったお金を追加・登録・記録して」と依頼された場合だけ。
- none: 質問、相談、集計、確認、雑談の場合。
- needs_clarification: 登録依頼だが金額または支出/収入の種別が不明な場合。

厳守:
- DB操作は create_transaction 以外にしない。
- 金額は日本円の整数。税込/税抜の推測はしない。
- 日付が明示されない場合 txDate は null。アプリ側で今日(${today})を使う。
- 「今日」「昨日」などは今日=${today}を基準にYYYY-MM-DDへ変換する。
- カテゴリは候補に一致またはかなり近い場合だけ categoryName に入れる。分からなければ null。
- 店名/請求元が分かる場合だけ merchantName に入れる。
- メモは短く。登録依頼文全体を長くコピーしない。
- ユーザーが質問しているだけなら絶対にcreate_transactionにしない。

カテゴリ候補(JSON):
${JSON.stringify(categories)}

出力JSON形式:
{
  "intent": "none | create_transaction | needs_clarification",
  "reply": "ユーザーへ返す短い文。noneの場合は空文字でよい",
  "transaction": {
    "txType": "expense | income | null",
    "amount": 100,
    "txDate": "YYYY-MM-DD または null",
    "categoryName": "カテゴリ名 または null",
    "merchantName": "店名 または null",
    "memo": "メモ または null"
  }
}`;
}

export async function extractAssistantAction(
  message: string,
): Promise<ActionExtraction> {
  const categories = await prisma.category.findMany({
    select: { name: true, type: true },
    orderBy: { id: "asc" },
  });

  const raw = await generateGeminiText({
    systemInstruction: buildActionSystemInstruction({
      today: todayDateKey(),
      categories,
    }),
    contents: [
      {
        role: "user",
        parts: [{ text: message }],
      },
    ],
    temperature: 0,
    maxOutputTokens: 900,
    responseMimeType: "application/json",
  });

  return actionExtractionSchema.parse(parseJson(raw));
}

export function mayRequestAssistantAction(message: string): boolean {
  return /追加|登録|記録|つけて|付けて|入れて|支出に|収入に|使った|買った|払った|入金|もらった|受け取った/.test(
    message,
  );
}

export async function executeAssistantAction(action: ActionExtraction) {
  if (action.intent === "none") {
    return { handled: false as const };
  }

  if (action.intent === "needs_clarification") {
    return {
      handled: true as const,
      reply:
        action.reply ||
        "登録するには、金額と「支出」か「収入」かを教えてください。",
    };
  }

  const tx = action.transaction;
  if (!tx?.amount || !tx.txType) {
    return {
      handled: true as const,
      reply: "登録するには、金額と「支出」か「収入」かを教えてください。",
    };
  }

  const category = tx.categoryName
    ? await prisma.category.findFirst({
        where: {
          name: tx.categoryName,
          type: tx.txType,
        },
      })
    : null;

  const txDate = tx.txDate || todayDateKey();
  const transaction = await prisma.transaction.create({
    data: {
      txType: tx.txType,
      amount: tx.amount,
      txDate: new Date(txDate),
      categoryId: category?.id ?? null,
      merchantName: tx.merchantName,
      memo: tx.memo || "AIチャットから登録",
      source: "manual",
    },
    include: { category: true },
  });

  const typeLabel = transaction.txType === "income" ? "収入" : "支出";
  const categoryText = transaction.category
    ? ` / ${transaction.category.name}`
    : "";
  const merchantText = transaction.merchantName
    ? ` / ${transaction.merchantName}`
    : "";

  return {
    handled: true as const,
    reply: `${typeLabel}として${formatYen(transaction.amount)}を登録しました。日付: ${txDate}${categoryText}${merchantText}`,
  };
}
