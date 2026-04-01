"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PieLabelRenderProps } from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatYen } from "@/lib/format";

interface CategoryData {
  categoryId: number;
  categoryName: string;
  total: number;
  count: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#FFB347",
  "#87CEEB",
  "#98D8C8",
  "#C0C0C0",
  "#F0E68C",
  "#E6E6FA",
  "#FFA07A",
];

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">カテゴリ別支出</CardTitle>
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">カテゴリ別支出</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(props: PieLabelRenderProps) => {
                const name = String(props.name ?? "");
                const percent = Number(props.percent ?? 0);
                return `${name} ${(percent * 100).toFixed(0)}%`;
              }}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatYen(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-1">
          {data.map((item, index) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span>{item.categoryName}</span>
              </div>
              <span className="font-medium">{formatYen(item.total)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
