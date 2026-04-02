"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
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

  // 円グラフ用データ（収入と支出）
  const pieData = [
    { name: "収入", value: totalIncome },
    { name: "支出", value: totalExpenses },
  ].filter((d) => d.value > 0);

  const hasData = totalIncome > 0 || totalExpenses > 0;

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

        {/* 円グラフ */}
        {hasData && (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                label={(props: PieLabelRenderProps) => {
                  const name = String(props.name ?? "");
                  const percent = Number(props.percent ?? 0);
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }}
                labelLine={false}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={(value) => formatYen(Number(value))} />
            </PieChart>
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
