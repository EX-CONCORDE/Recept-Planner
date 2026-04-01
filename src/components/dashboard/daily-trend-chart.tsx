"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { formatYen } from "@/lib/format";
import { useState } from "react";

interface DailyData {
  day: number;
  date: string;
  daily: number;
  cumulative: number;
}

interface DailyTrendChartProps {
  data: DailyData[];
  idealDailyBudget: number;
  spendableAmount: number;
  daysInMonth: number;
}

type ChartMode = "daily" | "cumulative";

export function DailyTrendChart({
  data,
  idealDailyBudget,
  spendableAmount,
  daysInMonth,
}: DailyTrendChartProps) {
  const [mode, setMode] = useState<ChartMode>("cumulative");

  // 今日が何日目か
  const today = new Date().getDate();

  // 理想ペースデータを追加
  const chartData = data.map((d) => ({
    ...d,
    idealCumulative: Math.round(idealDailyBudget * d.day),
  }));

  // データがある日のみフィルタ（折れ線が0の未来日を除外）
  const hasData = data.some((d) => d.daily > 0);
  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">支出推移</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            まだ支出データがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">支出推移</CardTitle>
          <div className="flex rounded-lg border text-xs">
            <button
              className={`px-3 py-1 rounded-l-lg transition-colors ${
                mode === "cumulative"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
              onClick={() => setMode("cumulative")}
            >
              累計
            </button>
            <button
              className={`px-3 py-1 rounded-r-lg transition-colors ${
                mode === "daily"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
              onClick={() => setMode("daily")}
            >
              日別
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          {mode === "cumulative" ? (
            <ComposedChart data={chartData} margin={{ left: -10, right: 5 }}>
              <XAxis
                dataKey="date"
                fontSize={10}
                interval={Math.floor(daysInMonth / 6)}
              />
              <YAxis
                fontSize={10}
                tickFormatter={(v) =>
                  v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value, name) => [
                  formatYen(Number(value)),
                  name === "cumulative" ? "累計支出" : "理想ペース",
                ]}
                labelFormatter={(label) => `${label}`}
              />
              {/* 使用可能額ライン */}
              {spendableAmount > 0 && (
                <ReferenceLine
                  y={spendableAmount}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "上限", position: "right", fontSize: 10 }}
                />
              )}
              {/* 理想ペース（薄い面） */}
              <Area
                type="monotone"
                dataKey="idealCumulative"
                fill="#e5e7eb"
                stroke="#9ca3af"
                strokeDasharray="4 4"
                fillOpacity={0.3}
              />
              {/* 実際の累計支出 */}
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {/* 今日のライン */}
              <ReferenceLine
                x={`${new Date().getMonth() + 1}/${today}`}
                stroke="#6b7280"
                strokeDasharray="2 2"
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={chartData} margin={{ left: -10, right: 5 }}>
              <XAxis
                dataKey="date"
                fontSize={10}
                interval={Math.floor(daysInMonth / 6)}
              />
              <YAxis
                fontSize={10}
                tickFormatter={(v) =>
                  v >= 10000 ? `${(v / 10000).toFixed(0)}万` : `${(v / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value) => [formatYen(Number(value)), "支出"]}
                labelFormatter={(label) => `${label}`}
              />
              {/* 日割り予算ライン */}
              {idealDailyBudget > 0 && (
                <ReferenceLine
                  y={idealDailyBudget}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `日割り${formatYen(Math.round(idealDailyBudget))}`,
                    position: "right",
                    fontSize: 9,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="daily"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 bg-blue-500 inline-block" />
            実績
          </span>
          {mode === "cumulative" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 bg-gray-400 inline-block border-dashed" />
                理想ペース
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 bg-red-500 inline-block" />
                上限
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-4 bg-amber-500 inline-block" />
              日割り予算
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
