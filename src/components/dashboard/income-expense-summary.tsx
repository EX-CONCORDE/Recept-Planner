"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { formatYen } from "@/lib/format";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

interface IncomeExpenseSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  buffer: number;
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
}

export function IncomeExpenseSummary({
  totalIncome,
  totalExpenses,
  buffer,
  byCategory,
  incomeByCategory,
}: IncomeExpenseSummaryProps) {
  const netBalance = totalIncome - totalExpenses;

  const chartData = [
    { name: "収入", amount: totalIncome },
    { name: "支出", amount: totalExpenses },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">収支サマリー</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 収入・支出・差額 */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-2.5">
            <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-[10px] text-muted-foreground">収入</p>
            <p className="text-sm font-bold text-green-600">
              {formatYen(totalIncome)}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-2.5">
            <TrendingDown className="h-4 w-4 mx-auto text-red-600 mb-1" />
            <p className="text-[10px] text-muted-foreground">支出</p>
            <p className="text-sm font-bold text-red-600">
              {formatYen(totalExpenses)}
            </p>
          </div>
          <div
            className={`rounded-lg p-2.5 ${
              netBalance >= 0
                ? "bg-blue-50 dark:bg-blue-950"
                : "bg-orange-50 dark:bg-orange-950"
            }`}
          >
            <Scale className="h-4 w-4 mx-auto text-blue-600 mb-1" />
            <p className="text-[10px] text-muted-foreground">収支差額</p>
            <p
              className={`text-sm font-bold ${
                netBalance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              {netBalance >= 0 ? "+" : ""}
              {formatYen(netBalance)}
            </p>
          </div>
        </div>

        {/* 棒グラフ */}
        {(totalIncome > 0 || totalExpenses > 0) && (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis
                type="number"
                tickFormatter={(v) =>
                  v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${(v / 1000).toFixed(0)}k`
                }
                fontSize={10}
              />
              <YAxis type="category" dataKey="name" width={40} fontSize={12} />
              <Tooltip formatter={(value) => formatYen(Number(value))} />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 収入の内訳 */}
        {incomeByCategory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              収入の内訳
            </p>
            <div className="space-y-1">
              {incomeByCategory.map((item) => (
                <div
                  key={item.categoryId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.categoryName}</span>
                  <span className="font-medium text-green-600">
                    +{formatYen(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 支出の内訳（上位5件） */}
        {byCategory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">
              支出の内訳（上位）
            </p>
            <div className="space-y-1">
              {byCategory.slice(0, 5).map((item) => (
                <div
                  key={item.categoryId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.categoryName}</span>
                  <span className="font-medium text-red-600">
                    -{formatYen(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
