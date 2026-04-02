import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import {
  createTransactionSchema,
  transactionQuerySchema,
} from "@/lib/validations/transaction";
import { requireAuth } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { userId } = await requireAuth();
  const searchParams = request.nextUrl.searchParams;
  const query = transactionQuerySchema.safeParse({
    yearMonth: searchParams.get("yearMonth") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
  });

  if (!query.success) {
    return error(query.error.issues[0].message);
  }

  const where: Record<string, unknown> = { userId };

  if (query.data.yearMonth) {
    const [year, month] = query.data.yearMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.txDate = { gte: start, lt: end };
  }

  if (query.data.categoryId) {
    where.categoryId = query.data.categoryId;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { txDate: "desc" },
  });
  return success(transactions);
}

export async function POST(request: NextRequest) {
  const { userId } = await requireAuth();
  const body = await request.json();
  const parsed = createTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      txDate: new Date(parsed.data.txDate),
      userId,
    },
    include: { category: true },
  });
  return success(transaction, 201);
}
