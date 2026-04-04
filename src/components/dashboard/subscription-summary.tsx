"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYen, formatDate } from "@/lib/format";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface UpcomingSubscription {
  id: number;
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
  categoryName: string | null;
}

interface SubscriptionSummaryProps {
  monthlyTotal: number;
  upcoming: UpcomingSubscription[];
}

export function SubscriptionSummary({
  monthlyTotal,
  upcoming,
}: SubscriptionSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            サブスク
          </CardTitle>
          <Link
            href="/subscriptions"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            管理 &rarr;
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">月額換算合計</p>
          <p className="text-2xl font-bold">{formatYen(monthlyTotal)}</p>
        </div>

        {upcoming.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">
              次回請求予定
            </p>
            <div className="space-y-1.5">
              {upcoming.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{sub.name}</span>
                    <span className="text-[10px] rounded bg-secondary px-1 py-0.5 shrink-0">
                      {sub.billingCycle === "yearly" ? "年額" : "月額"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(sub.nextBillingDate)}
                    </span>
                    <span className="font-medium">
                      {formatYen(sub.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && monthlyTotal === 0 && (
          <p className="text-sm text-muted-foreground">
            サブスクが未登録です。
            <Link href="/subscriptions" className="text-primary hover:underline ml-1">
              追加する
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
