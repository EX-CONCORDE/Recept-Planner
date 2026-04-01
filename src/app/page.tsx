"use client";

import { useEffect, useState, useCallback } from "react";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CategoryBarChart } from "@/components/dashboard/category-bar-chart";
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
  remaining: number;
  usageRate: number;
  isOverBudget: boolean;
  byCategory: {
    categoryId: number;
    categoryName: string;
    total: number;
    count: number;
  }[];
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
        <div className="space-y-4">
          {data.monthlyIncome === 0 && data.totalExpenses === 0 && (
            <Card className="border-dashed">
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
          <BudgetOverview
            monthlyIncome={data.monthlyIncome}
            savingTargetAmount={data.savingTargetAmount}
            spendableAmount={data.spendableAmount}
            totalExpenses={data.totalExpenses}
            remaining={data.remaining}
            usageRate={data.usageRate}
            isOverBudget={data.isOverBudget}
          />
          <CategoryChart data={data.byCategory} />
          <CategoryBarChart data={data.byCategory} />
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
      ) : null}
    </div>
  );
}
