"use client";

import { useEffect, useState, useCallback } from "react";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { getCurrentYearMonth } from "@/lib/format";

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

  const handleMonthChange = (direction: -1 | 1) => {
    const [y, m] = yearMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, "0");
    setYearMonth(`${newYear}-${newMonth}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleMonthChange(-1)}
          className="rounded-lg px-3 py-1.5 text-sm hover:bg-secondary"
        >
          &lt; 前月
        </button>
        <h1 className="text-xl font-bold">
          {yearMonth.replace("-", "年")}月
        </h1>
        <button
          onClick={() => handleMonthChange(1)}
          className="rounded-lg px-3 py-1.5 text-sm hover:bg-secondary"
        >
          翌月 &gt;
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : data ? (
        <div className="space-y-4">
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
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
      ) : null}
    </div>
  );
}
