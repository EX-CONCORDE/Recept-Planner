import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { updateTransactionSchema } from "@/lib/validations/transaction";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const txId = parseInt(id, 10);
  if (isNaN(txId)) return error("無効なIDです");

  const body = await request.json();
  const parsed = updateTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.txDate) {
    data.txDate = new Date(parsed.data.txDate);
  }

  const transaction = await prisma.transaction.update({
    where: { id: txId },
    data,
    include: { category: true },
  });
  return success(transaction);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const txId = parseInt(id, 10);
  if (isNaN(txId)) return error("無効なIDです");

  await prisma.transaction.delete({ where: { id: txId } });
  return success({ deleted: true });
}
