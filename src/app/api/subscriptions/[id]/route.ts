import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { updateSubscriptionSchema } from "@/lib/validations/subscription";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const subId = parseInt(id, 10);
  if (isNaN(subId)) return error("無効なIDです");

  const subscription = await prisma.subscription.findUnique({
    where: { id: subId },
    include: { category: true },
  });
  if (!subscription) return error("サブスクリプションが見つかりません", 404);

  return success(subscription);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const subId = parseInt(id, 10);
  if (isNaN(subId)) return error("無効なIDです");

  const body = await request.json();
  const parsed = updateSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.nextBillingDate) {
    data.nextBillingDate = new Date(parsed.data.nextBillingDate);
  }

  const subscription = await prisma.subscription.update({
    where: { id: subId },
    data,
    include: { category: true },
  });
  return success(subscription);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const subId = parseInt(id, 10);
  if (isNaN(subId)) return error("無効なIDです");

  // 論理停止を優先（isActive=false）
  const subscription = await prisma.subscription.update({
    where: { id: subId },
    data: { isActive: false },
    include: { category: true },
  });
  return success(subscription);
}
