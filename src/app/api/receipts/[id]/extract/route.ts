import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { resizeAndEncode } from "@/lib/image-utils";
import { extractReceiptData } from "@/lib/lmstudio";
import { parseAiResponse } from "@/lib/receipt-parser";
import { requireAuth } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const receiptId = parseInt(id, 10);
  if (isNaN(receiptId)) return error("無効なIDです");

  const receipt = await prisma.receipt.findFirst({
    where: { id: receiptId, userId },
  });
  if (!receipt) return error("レシートが見つかりません", 404);

  try {
    const base64 = await resizeAndEncode(receipt.filePath);
    const rawResponse = await extractReceiptData(base64);
    const extracted = parseAiResponse(rawResponse);

    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        ocrRawText: rawResponse,
        aiResultJson: extracted,
        status: "processed",
      },
    });

    return success({ receipt: updated, extraction: extracted });
  } catch (e) {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status: "failed" },
    });

    const message = e instanceof Error ? e.message : "AI抽出に失敗しました";
    return error(message, 500);
  }
}
