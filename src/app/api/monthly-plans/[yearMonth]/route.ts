import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import {
  yearMonthSchema,
  upsertMonthlyPlanSchema,
} from "@/lib/validations/monthly-plan";

type Params = { params: Promise<{ yearMonth: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { yearMonth } = await params;
  const parsed = yearMonthSchema.safeParse(yearMonth);
  if (!parsed.success) return error("YYYY-MM形式で指定してください");

  const plan = await prisma.monthlyPlan.findUnique({
    where: { yearMonth },
  });

  if (!plan) {
    return success({
      yearMonth,
      monthlyIncome: 0,
      savingTargetAmount: 0,
      savingTargetRate: null,
    });
  }

  return success(plan);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { yearMonth } = await params;
  const body = await request.json();
  const parsed = upsertMonthlyPlanSchema.safeParse({
    ...body,
    yearMonth,
  });

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const plan = await prisma.monthlyPlan.upsert({
    where: { yearMonth },
    update: {
      monthlyIncome: parsed.data.monthlyIncome,
      savingTargetAmount: parsed.data.savingTargetAmount,
      savingTargetRate: parsed.data.savingTargetRate,
    },
    create: parsed.data,
  });

  return success(plan);
}
