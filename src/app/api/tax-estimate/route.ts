import { NextRequest } from "next/server";
import { success, error } from "@/lib/api-response";
import { calculateTax, predictResidentTax, PREFECTURES } from "@/lib/tax-calculator";
import { z } from "zod/v4";

const taxEstimateSchema = z.object({
  grossMonthly: z.number().int().min(0),
  prefecture: z.string().optional(),
  age: z.number().int().min(15).max(75).optional(),
  bonusMonths: z.number().min(0).max(12).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = taxEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const breakdown = calculateTax(parsed.data);
  return success(breakdown);
}

export async function GET() {
  return success({ prefectures: PREFECTURES });
}
