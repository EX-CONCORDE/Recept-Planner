import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { yearMonthSchema } from "@/lib/validations/monthly-plan";
import { calculateTax, predictResidentTax } from "@/lib/tax-calculator";

type Params = { params: Promise<{ yearMonth: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { yearMonth } = await params;
  const parsed = yearMonthSchema.safeParse(yearMonth);
  if (!parsed.success) return error("YYYY-MM形式で指定してください");

  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

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
  const buffer = totalIncome; // 日当・副収入などのバッファー
  const remaining = spendableAmount + buffer - totalExpenses;
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

  // 収入カテゴリ別集計
  const incomeByCategory = Object.values(
    transactions
      .filter((t) => t.txType === "income")
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

  // 日別支出集計（折れ線グラフ用）
  const dailyExpenseMap: Record<number, number> = {};
  for (const t of transactions.filter((t) => t.txType === "expense")) {
    const day = new Date(t.txDate).getDate();
    dailyExpenseMap[day] = (dailyExpenseMap[day] ?? 0) + t.amount;
  }

  // 日別データ（累積も計算）
  const dailyTrend: Array<{
    day: number;
    date: string;
    daily: number;
    cumulative: number;
  }> = [];
  let cumulative = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const daily = dailyExpenseMap[d] ?? 0;
    cumulative += daily;
    const dateStr = `${month}/${d}`;
    dailyTrend.push({ day: d, date: dateStr, daily, cumulative });
  }

  // 理想ペースライン（使用可能額を日割り）
  const idealDailyBudget =
    spendableAmount > 0 ? spendableAmount / daysInMonth : 0;

  // 税金内訳（額面設定がある場合）
  let taxBreakdown = null;
  if (plan?.autoCalcTax && plan?.grossIncome) {
    taxBreakdown = calculateTax({
      grossMonthly: plan.grossIncome,
      prefecture: plan.prefecture ?? undefined,
      age: plan.age ?? undefined,
      bonusMonths: plan.bonusMonths ?? undefined,
    });
  }

  // 住民税予測（今年の累計データから来年を概算）
  let nextYearResidentTaxPrediction = null;
  if (plan?.grossIncome) {
    const annualGross = plan.grossIncome * 12;
    const breakdown = calculateTax({
      grossMonthly: plan.grossIncome,
      prefecture: plan.prefecture ?? undefined,
      age: plan.age ?? undefined,
    });
    nextYearResidentTaxPrediction = predictResidentTax({
      estimatedAnnualIncome: annualGross,
      estimatedAnnualSocialInsurance: breakdown.socialInsuranceAnnual,
      prefecture: plan.prefecture ?? undefined,
    });
  }

  return success({
    yearMonth,
    monthlyIncome,
    grossIncome: plan?.grossIncome ?? null,
    savingTargetAmount,
    spendableAmount,
    totalExpenses,
    totalIncome,
    buffer,
    remaining,
    usageRate,
    isOverBudget: remaining < 0,
    byCategory,
    incomeByCategory,
    dailyTrend,
    idealDailyBudget,
    daysInMonth,
    recentTransactions: transactions.slice(0, 10),
    taxBreakdown,
    nextYearResidentTaxPrediction,
  });
}
