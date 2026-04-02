"use client";

import { useEffect, useState, useCallback } from "react";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CategoryBarChart } from "@/components/dashboard/category-bar-chart";
import { DailyTrendChart } from "@/components/dashboard/daily-trend-chart";
import { TaxBreakdownCard } from "@/components/dashboard/tax-breakdown";
import { IncomeExpenseSummary } from "@/components/dashboard/income-expense-summary";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { MonthSelector } from "@/components/layout/month-selector";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentYearMonth } from "@/lib/format";
import Link from "next/link";
import { Settings, Receipt } from "lucide-react";

interface DashboardData {
  yearMonth: string;
  monthlyIncome: number;
  savingTargetAmount: number;
  spendableAmount: number;
  totalExpenses: number;
  totalIncome: number;
  buffer: number;
  remaining: number;
  usageRate: number;
  isOverBudget: boolean;
  byCategory: {
    categoryId: number;
    categoryName: string;
    total: number;
    count: number;
  }[];
  incomeByCategory: {
    categoryId: number;
    categoryName: string;
    total: number;
    count: number;
  }[];
  dailyTrend: {
    day: number;
    date: string;
    daily: number;
    cumulative: number;
  }[];
  idealDailyBudget: number;
  daysInMonth: number;
  grossIncome: number | null;
  taxBreakdown: {
    grossMonthly: number;
    standardMonthly: number;
    prefecture: string;
    residentTaxSurcharge: number;
    healthInsurance: number;
    pension: number;
    employmentInsurance: number;
    nursingCare: number;
    childcareSupport: number;
    socialInsuranceTotal: number;
    incomeTax: number;
    residentTax: number;
    taxTotal: number;
    totalDeductions: number;
    netMonthly: number;
    netRate: number;
  } | null;
  nextYearResidentTaxPrediction: {
    annual: number;
    monthly: number;
  } | null;
  recentTransactions: {
    id: number;
    txType: string;
    amount: number;
    txDate: string;
    merchantName: string | null;
    memo: string | null;
    category: { name: string } | null;
  }[];
}

export default function DashboardPage() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/dashboard/${yearMonth}`);
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    }
    setLoading(false);
  }, [yearMonth]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-4">
      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {data.monthlyIncome === 0 && data.totalExpenses === 0 && (
            <Card className="border-dashed mb-4">
              <CardContent className="py-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  はじめに月収と貯金目標を設定しましょう
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Settings className="h-4 w-4" />
                    設定する
                  </Link>
                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    <Receipt className="h-4 w-4" />
                    レシート撮影
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PC: 2カラムグリッド / スマホ: 1カラム */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 左カラム: 予算概要 + トレンド */}
            <div className="space-y-4">
              <BudgetOverview
                monthlyIncome={data.monthlyIncome}
                savingTargetAmount={data.savingTargetAmount}
                spendableAmount={data.spendableAmount}
                totalExpenses={data.totalExpenses}
                buffer={data.buffer}
                remaining={data.remaining}
                usageRate={data.usageRate}
                isOverBudget={data.isOverBudget}
              />
              <DailyTrendChart
                data={data.dailyTrend}
                idealDailyBudget={data.idealDailyBudget}
                spendableAmount={data.spendableAmount}
                daysInMonth={data.daysInMonth}
              />
            </div>

            {/* 右カラム: 収支サマリー + 税金 + チャート + 取引 */}
            <div className="space-y-4">
              <IncomeExpenseSummary
                totalIncome={data.totalIncome}
                totalExpenses={data.totalExpenses}
                buffer={data.buffer}
                byCategory={data.byCategory}
                incomeByCategory={data.incomeByCategory}
              />
              {data.taxBreakdown && (
                <TaxBreakdownCard data={data.taxBreakdown} />
              )}
              {data.nextYearResidentTaxPrediction && (
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <CardContent className="py-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      来年度の住民税予測（今年の収入ベース）
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        月額 ¥{data.nextYearResidentTaxPrediction.monthly.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        (年額 ¥{data.nextYearResidentTaxPrediction.annual.toLocaleString()})
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ※ 来年6月〜再来年5月の天引き額の概算です
                    </p>
                  </CardContent>
                </Card>
              )}
              <CategoryChart data={data.byCategory} />
              <CategoryBarChart data={data.byCategory} />
              <RecentTransactions transactions={data.recentTransactions} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
