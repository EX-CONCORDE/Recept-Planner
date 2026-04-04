import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function POST() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. 対象抽出: isActive=true AND nextBillingDate <= today
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      isActive: true,
      nextBillingDate: { lte: today },
    },
  });

  let processedCount = 0;
  let skippedCount = 0;
  let updatedSubscriptionCount = 0;
  const errors: string[] = [];

  // 2. 各サブスクごとに処理（1サブスク1トランザクション、失敗は局所化）
  for (const sub of dueSubscriptions) {
    const billingKey = `${sub.id}:${formatDateKey(sub.nextBillingDate)}`;

    try {
      // 3. トランザクション作成（billingKey ユニーク制約で冪等性保証）
      await prisma.transaction.create({
        data: {
          txType: "expense",
          amount: sub.amount,
          txDate: sub.nextBillingDate,
          categoryId: sub.categoryId,
          merchantName: sub.name,
          memo: `サブスク自動引き落とし`,
          source: "subscription",
          subscriptionId: sub.id,
          billingKey,
        },
      });
      processedCount++;

      // 5. 作成成功時のみ nextBillingDate を更新
      const nextDate =
        sub.billingCycle === "yearly"
          ? addYears(sub.nextBillingDate, 1)
          : addMonths(sub.nextBillingDate, 1);

      await prisma.subscription.update({
        where: { id: sub.id },
        data: { nextBillingDate: nextDate },
      });
      updatedSubscriptionCount++;
    } catch (err: unknown) {
      // 4. ユニーク制約違反 = 既処理 → スキップ
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        skippedCount++;
      } else {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        errors.push(`Subscription ${sub.id} (${sub.name}): ${message}`);
      }
    }
  }

  return success({
    processedCount,
    skippedCount,
    updatedSubscriptionCount,
    errors,
  });
}
