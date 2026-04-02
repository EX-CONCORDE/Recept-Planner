import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { createSavingsGoalSchema } from "@/lib/validations/savings-goal";

export async function GET() {
  const goals = await prisma.savingsGoal.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 月別の貯金実績を計算（各月の monthlyIncome - totalExpenses の累計）
  const plans = await prisma.monthlyPlan.findMany({
    orderBy: { yearMonth: "asc" },
  });

  const transactions = await prisma.transaction.findMany({
    select: { txType: true, amount: true, txDate: true },
  });

  // 月ごとの貯金実績
  // 貯金 = 貯金目標額 + 残り使える金額
  //       = savingTargetAmount + (spendableAmount + buffer - expenses)
  //       = savingTargetAmount + ((monthlyIncome - savingTargetAmount) + buffer - expenses)
  const monthlyHistory: Array<{
    yearMonth: string;
    savingTarget: number;
    remaining: number;
    saved: number;
    cumulativeSaved: number;
  }> = [];

  let cumulativeSaved = 0;
  for (const plan of plans) {
    const [year, month] = plan.yearMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const monthTx = transactions.filter((t) => {
      const d = new Date(t.txDate);
      return d >= start && d < end;
    });

    const expenses = monthTx
      .filter((t) => t.txType === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const buffer = monthTx
      .filter((t) => t.txType === "income")
      .reduce((s, t) => s + t.amount, 0);

    const savingTarget = plan.savingTargetAmount;
    const spendable = plan.monthlyIncome - savingTarget;
    const remaining = spendable + buffer - expenses;
    const saved = savingTarget + remaining; // 貯金目標 + 残額

    cumulativeSaved += saved;

    monthlyHistory.push({
      yearMonth: plan.yearMonth,
      savingTarget,
      remaining,
      saved,
      cumulativeSaved,
    });
  }

  return success({ goals, monthlyHistory, totalSaved: cumulativeSaved });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSavingsGoalSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const goal = await prisma.savingsGoal.create({ data: parsed.data });
  return success(goal, 201);
}
