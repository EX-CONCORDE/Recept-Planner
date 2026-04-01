import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { createTransactionSchema } from "@/lib/validations/transaction";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const receiptId = parseInt(id, 10);
  if (isNaN(receiptId)) return error("無効なIDです");

  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });
  if (!receipt) return error("レシートが見つかりません", 404);

  const body = await request.json();
  const parsed = createTransactionSchema.safeParse({
    ...body,
    receiptId,
    source: "ai",
  });

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      txDate: new Date(parsed.data.txDate),
    },
    include: { category: true },
  });

  await prisma.receipt.update({
    where: { id: receiptId },
    data: { status: "confirmed" },
  });

  return success(transaction, 201);
}
