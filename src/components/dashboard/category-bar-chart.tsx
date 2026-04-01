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
} from "recharts";
import { formatYen } from "@/lib/format";

interface CategoryData {
  categoryId: number;
  categoryName: string;
  total: number;
  count: number;
}

interface CategoryBarChartProps {
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

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">カテゴリ別支出（棒グラフ）</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={data.length * 40 + 20}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="categoryName"
              width={70}
              fontSize={12}
            />
            <Tooltip formatter={(value) => formatYen(Number(value))} />
            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
