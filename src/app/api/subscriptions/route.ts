import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { createSubscriptionSchema } from "@/lib/validations/subscription";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isActive = searchParams.get("isActive");

  const where: Record<string, unknown> = {};
  if (isActive !== null) {
    where.isActive = isActive === "true";
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: { category: true },
    orderBy: { nextBillingDate: "asc" },
  });
  return success(subscriptions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createSubscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const subscription = await prisma.subscription.create({
    data: {
      ...parsed.data,
      nextBillingDate: new Date(parsed.data.nextBillingDate),
    },
    include: { category: true },
  });
  return success(subscription, 201);
}
