"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYen } from "@/lib/format";
import { AlertTriangle, Clock, PiggyBank, TrendingDown, Wallet, ArrowDownToLine } from "lucide-react";

interface BudgetOverviewProps {
  monthlyIncome: number;
  savingTargetAmount: number;
  spendableAmount: number;
  totalExpenses: number;
  buffer: number;
  directIncome: number;
  remaining: number;
  usageRate: number;
  isOverBudget: boolean;
  daysInMonth: number;
  yearMonth: string;
}

export function BudgetOverview({
  monthlyIncome,
  savingTargetAmount,
  spendableAmount,
  totalExpenses,
  buffer,
  directIncome,
  remaining,
  usageRate,
  isOverBudget,
  daysInMonth,
  yearMonth,
}: BudgetOverviewProps) {
  // 貯金切り崩し額（remaining < 0 の場合、貯金から食い込んでいる額）
  const savingsEaten = isOverBudget ? Math.abs(remaining) : 0;
  const savingsRemaining = savingTargetAmount - savingsEaten;
  const isSavingsCompromised = isOverBudget;

  // 枯渇予測の計算
  const [ymYear, ymMonth] = yearMonth.split("-").map(Number);
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === ymYear && now.getMonth() + 1 === ymMonth;
  const elapsedDays = isCurrentMonth ? now.getDate() : daysInMonth;
  const dailyAverage = elapsedDays > 0 ? totalExpenses / elapsedDays : 0;
  const totalBudget = spendableAmount + buffer + directIncome;

  let depletionDay: number | null = null;
  if (dailyAverage > 0 && !isOverBudget && isCurrentMonth && totalBudget > 0) {
    const daysUntilDepletion = Math.floor(remaining / dailyAverage);
    const depletionDate = new Date(now);
    depletionDate.setDate(depletionDate.getDate() + daysUntilDepletion);
    // 月内に枯渇する場合のみ表示
    if (depletionDate.getMonth() + 1 === ymMonth && depletionDate.getFullYear() === ymYear) {
      depletionDay = depletionDate.getDate();
    }
  }

  const progressColor = isOverBudget
    ? "bg-red-500"
    : usageRate > 80
      ? "bg-yellow-500"
      : "bg-green-500";

  const cappedRate = Math.min(usageRate, 100);

  return (
    <div className="space-y-3">
      {/* 収支フロー */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">今月の予算</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 差し引き過程を明示 */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">月収</span>
              <span className="font-semibold">{formatYen(monthlyIncome)}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span className="flex items-center gap-1">
                <PiggyBank className="h-3.5 w-3.5" />
                貯金目標
              </span>
              <span className="font-semibold">
                -{formatYen(savingTargetAmount)}
              </span>
            </div>
            <div className="border-t pt-1.5 flex justify-between">
              <span className="font-medium">使用可能額</span>
              <span className="font-bold text-base">
                {formatYen(spendableAmount)}
              </span>
            </div>
            {buffer > 0 && (
              <div className="flex justify-between text-blue-600">
                <span className="flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5" />
                  バッファー（日当等）
                </span>
                <span className="font-semibold">
                  +{formatYen(buffer)}
                </span>
              </div>
            )}
            {directIncome > 0 && (
              <div className="flex justify-between text-teal-600">
                <span className="flex items-center gap-1">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  残高への直接収入
                </span>
                <span className="font-semibold">
                  +{formatYen(directIncome)}
                </span>
              </div>
            )}
          </div>

          {/* 使用率バー */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>
                支出: {formatYen(totalExpenses)}
              </span>
              <span
                className={`font-bold ${isOverBudget ? "text-red-500" : ""}`}
              >
                {usageRate}%
              </span>
            </div>
            <div className="relative h-5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${cappedRate}%` }}
              />
              {/* 100%ライン */}
              {usageRate > 10 && (
                <div className="absolute right-0 top-0 h-full w-0.5 bg-foreground/20" />
              )}
            </div>
          </div>

          {/* 枯渇予測 */}
          {depletionDay && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                このペースだと <span className="font-bold">{ymMonth}月{depletionDay}日</span> に予算が枯渇します
                （日平均 {formatYen(Math.round(dailyAverage))}）
              </span>
            </div>
          )}

          {/* 残額表示 */}
          <div
            className={`rounded-lg p-3 text-center ${
              isOverBudget
                ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                : remaining < spendableAmount * 0.2
                  ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                  : "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            }`}
          >
            <p className="text-sm font-medium">
              {isOverBudget ? "予算超過！" : "残り使える金額"}
              {buffer > 0 && !isOverBudget && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  (バッファー込み)
                </span>
              )}
            </p>
            <p className="text-2xl font-bold">
              {isOverBudget ? "-" : ""}
              {formatYen(Math.abs(remaining))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 貯金切り崩し警告 */}
      {isSavingsCompromised && (
        <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold text-red-700 dark:text-red-300">
                  貯金を切り崩しています！
                </p>
                <div className="text-sm space-y-1 text-red-600 dark:text-red-400">
                  <div className="flex justify-between">
                    <span>貯金目標</span>
                    <span>{formatYen(savingTargetAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3.5 w-3.5" />
                      切り崩し額
                    </span>
                    <span>-{formatYen(savingsEaten)}</span>
                  </div>
                  <div className="border-t border-red-200 dark:border-red-800 pt-1 flex justify-between font-bold">
                    <span>実際の貯金見込み</span>
                    <span>
                      {savingsRemaining >= 0
                        ? formatYen(savingsRemaining)
                        : `-${formatYen(Math.abs(savingsRemaining))}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 残り20%以下警告（まだ貯金は切り崩していないが注意） */}
      {!isSavingsCompromised &&
        remaining > 0 &&
        remaining < spendableAmount * 0.2 &&
        spendableAmount > 0 && (
          <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  残り{formatYen(remaining)}
                  です。使いすぎに注意してください。
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
