import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { yearMonthSchema } from "@/lib/validations/monthly-plan";

type Params = { params: Promise<{ yearMonth: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { yearMonth } = await params;
  const parsed = yearMonthSchema.safeParse(yearMonth);
  if (!parsed.success) return error("YYYY-MM形式で指定してください");

  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [plan, transactions] = await Promise.all([
    prisma.monthlyPlan.findUnique({ where: { yearMonth } }),
    prisma.transaction.findMany({
      where: { txDate: { gte: start, lt: end } },
      include: { category: true },
    }),
  ]);

  const monthlyIncome = plan?.monthlyIncome ?? 0;
  const savingTargetAmount = plan?.savingTargetAmount ?? 0;

  const totalExpenses = transactions
    .filter((t) => t.txType === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.txType === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const spendableAmount = monthlyIncome - savingTargetAmount;
  const remaining = spendableAmount - totalExpenses;
  const usageRate =
    spendableAmount > 0
      ? Math.round((totalExpenses / spendableAmount) * 1000) / 10
      : 0;

  // カテゴリ別集計
  const byCategory = Object.values(
    transactions
      .filter((t) => t.txType === "expense")
      .reduce(
        (acc, t) => {
          const key = t.categoryId ?? 0;
          const name = t.category?.name ?? "未分類";
          if (!acc[key]) {
            acc[key] = { categoryId: key, categoryName: name, total: 0, count: 0 };
          }
          acc[key].total += t.amount;
          acc[key].count += 1;
          return acc;
        },
        {} as Record<number, { categoryId: number; categoryName: string; total: number; count: number }>,
      ),
  ).sort((a, b) => b.total - a.total);

  return success({
    yearMonth,
    monthlyIncome,
    savingTargetAmount,
    spendableAmount,
    totalExpenses,
    totalIncome,
    remaining,
    usageRate,
    isOverBudget: remaining < 0,
    byCategory,
    recentTransactions: transactions.slice(0, 10),
  });
}
