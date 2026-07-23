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

  const [plan, transactions, activeSubscriptions] = await Promise.all([
    prisma.monthlyPlan.findUnique({ where: { yearMonth } }),
    prisma.transaction.findMany({
      where: { txDate: { gte: start, lt: end } },
      include: { category: true },
    }),
    prisma.subscription.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { nextBillingDate: "asc" },
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

  // 直接残高に加算される収入（割り勘の返金等）はバッファーに含めない
  const directIncome = transactions
    .filter((t) => t.txType === "income" && t.directToBalance)
    .reduce((sum, t) => sum + t.amount, 0);

  const spendableAmount = monthlyIncome - savingTargetAmount;
  const buffer = totalIncome - directIncome; // 日当・副収入などのバッファー
  // バッファー・直接収入を含めた実質使える予算（進捗バー・ペースラインの基準）
  const totalBudget = spendableAmount + totalIncome;
  const remaining = totalBudget - totalExpenses;
  const usageRate =
    totalBudget > 0
      ? Math.round((totalExpenses / totalBudget) * 1000) / 10
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
    totalBudget > 0 ? totalBudget / daysInMonth : 0;

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

  // --- サブスクリプション集計 ---
  // 月額換算合計（yearly は /12 で丸め）
  const monthlySubscriptionTotal = activeSubscriptions.reduce((sum, sub) => {
    return sum + (sub.billingCycle === "yearly" ? Math.round(sub.amount / 12) : sub.amount);
  }, 0);

  // 近日請求予定（次回請求日が近い順、最大5件）
  const upcomingSubscriptions = activeSubscriptions.slice(0, 5).map((sub) => ({
    id: sub.id,
    name: sub.name,
    amount: sub.amount,
    billingCycle: sub.billingCycle,
    nextBillingDate: sub.nextBillingDate,
    categoryName: sub.category?.name ?? null,
  }));

  // --- ダッシュボード表示時にサブスク自動処理（軽量） ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueSubscriptions = activeSubscriptions.filter(
    (sub) => sub.nextBillingDate <= today,
  );
  for (const sub of dueSubscriptions) {
    const billingDateStr = sub.nextBillingDate.toISOString().slice(0, 10);
    const billingKey = `${sub.id}:${billingDateStr}`;
    try {
      await prisma.transaction.create({
        data: {
          txType: "expense",
          amount: sub.amount,
          txDate: sub.nextBillingDate,
          categoryId: sub.categoryId,
          merchantName: sub.name,
          memo: "サブスク自動引き落とし",
          source: "subscription",
          subscriptionId: sub.id,
          billingKey,
        },
      });
      const nextDate = new Date(sub.nextBillingDate);
      if (sub.billingCycle === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextBillingDate: nextDate },
      });
    } catch {
      // ユニーク制約違反 = 既処理、その他エラーも集計に影響させない
    }
  }

  return success({
    yearMonth,
    monthlyIncome,
    grossIncome: plan?.grossIncome ?? null,
    savingTargetAmount,
    spendableAmount,
    totalBudget,
    totalExpenses,
    totalIncome,
    buffer,
    directIncome,
    remaining,
    usageRate,
    isOverBudget: remaining < 0,
    byCategory,
    incomeByCategory,
    dailyTrend,
    idealDailyBudget,
    daysInMonth,
    recentTransactions: [...transactions].sort((a, b) => new Date(b.txDate).getTime() - new Date(a.txDate).getTime()).slice(0, 10),
    taxBreakdown,
    nextYearResidentTaxPrediction,
    monthlySubscriptionTotal,
    upcomingSubscriptions,
  });
}
