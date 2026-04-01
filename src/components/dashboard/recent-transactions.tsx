"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYen, formatDate } from "@/lib/format";

interface Transaction {
  id: number;
  txType: string;
  amount: number;
  txDate: string;
  merchantName: string | null;
  memo: string | null;
  category: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">最近の取引</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            まだ取引データがありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">最近の取引</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {tx.merchantName ?? tx.memo ?? "不明"}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(tx.txDate)}</span>
                {tx.category && (
                  <span className="rounded bg-secondary px-1.5 py-0.5">
                    {tx.category.name}
                  </span>
                )}
              </div>
            </div>
            <span
              className={`text-sm font-semibold ${
                tx.txType === "income" ? "text-green-600" : "text-red-600"
              }`}
            >
              {tx.txType === "income" ? "+" : "-"}
              {formatYen(tx.amount)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
