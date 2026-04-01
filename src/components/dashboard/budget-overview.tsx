"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatYen } from "@/lib/format";

interface BudgetOverviewProps {
  monthlyIncome: number;
  savingTargetAmount: number;
  spendableAmount: number;
  totalExpenses: number;
  remaining: number;
  usageRate: number;
  isOverBudget: boolean;
}

export function BudgetOverview({
  monthlyIncome,
  savingTargetAmount,
  spendableAmount,
  totalExpenses,
  remaining,
  usageRate,
  isOverBudget,
}: BudgetOverviewProps) {
  const progressColor = isOverBudget
    ? "bg-red-500"
    : usageRate > 80
      ? "bg-yellow-500"
      : "bg-green-500";

  const cappedRate = Math.min(usageRate, 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">今月の予算</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">月収</p>
            <p className="text-lg font-semibold">{formatYen(monthlyIncome)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">貯金目標</p>
            <p className="text-lg font-semibold">
              {formatYen(savingTargetAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">使用可能額</p>
            <p className="text-lg font-semibold">
              {formatYen(spendableAmount)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">今月の支出</p>
            <p className="text-lg font-semibold">{formatYen(totalExpenses)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">使用率</span>
            <span
              className={`font-bold ${isOverBudget ? "text-red-500" : ""}`}
            >
              {usageRate}%
            </span>
          </div>
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all ${progressColor}`}
              style={{ width: `${cappedRate}%` }}
            />
          </div>
        </div>

        <div
          className={`rounded-lg p-3 text-center ${
            isOverBudget
              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          }`}
        >
          <p className="text-sm font-medium">
            {isOverBudget ? "予算超過" : "残り使える金額"}
          </p>
          <p className="text-2xl font-bold">{formatYen(Math.abs(remaining))}</p>
        </div>
      </CardContent>
    </Card>
  );
}
