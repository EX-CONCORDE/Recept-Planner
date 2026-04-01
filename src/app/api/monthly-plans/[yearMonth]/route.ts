import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import {
  yearMonthSchema,
  upsertMonthlyPlanSchema,
} from "@/lib/validations/monthly-plan";
import { calculateTax } from "@/lib/tax-calculator";

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
      grossIncome: null,
      age: null,
      prefecture: null,
      bonusMonths: null,
      autoCalcTax: false,
      savingTargetAmount: 0,
      savingTargetRate: null,
      taxBreakdown: null,
    });
  }

  // 税計算内訳を付与
  let taxBreakdown = null;
  if (plan.autoCalcTax && plan.grossIncome) {
    taxBreakdown = calculateTax({
      grossMonthly: plan.grossIncome,
      prefecture: plan.prefecture ?? undefined,
      age: plan.age ?? undefined,
      bonusMonths: plan.bonusMonths ?? undefined,
    });
  }

  return success({ ...plan, taxBreakdown });
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

  // 税金自動計算の場合、手取りを自動設定
  let { monthlyIncome } = parsed.data;
  let taxBreakdown = null;

  if (parsed.data.autoCalcTax && parsed.data.grossIncome) {
    taxBreakdown = calculateTax({
      grossMonthly: parsed.data.grossIncome,
      prefecture: parsed.data.prefecture ?? undefined,
      age: parsed.data.age ?? undefined,
      bonusMonths: parsed.data.bonusMonths ?? undefined,
    });
    monthlyIncome = taxBreakdown.netMonthly;
  }

  const plan = await prisma.monthlyPlan.upsert({
    where: { yearMonth },
    update: {
      monthlyIncome,
      grossIncome: parsed.data.grossIncome,
      age: parsed.data.age,
      prefecture: parsed.data.prefecture,
      bonusMonths: parsed.data.bonusMonths,
      autoCalcTax: parsed.data.autoCalcTax,
      savingTargetAmount: parsed.data.savingTargetAmount,
      savingTargetRate: parsed.data.savingTargetRate,
    },
    create: {
      yearMonth,
      monthlyIncome,
      grossIncome: parsed.data.grossIncome,
      age: parsed.data.age,
      prefecture: parsed.data.prefecture,
      bonusMonths: parsed.data.bonusMonths,
      autoCalcTax: parsed.data.autoCalcTax,
      savingTargetAmount: parsed.data.savingTargetAmount,
      savingTargetRate: parsed.data.savingTargetRate,
    },
  });

  return success({ ...plan, taxBreakdown });
}
