import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { updateSavingsGoalSchema } from "@/lib/validations/savings-goal";
import { requireAuth } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const goalId = parseInt(id, 10);
  if (isNaN(goalId)) return error("無効なIDです");

  const body = await request.json();
  const parsed = updateSavingsGoalSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const goal = await prisma.savingsGoal.update({
    where: { id: goalId, userId },
    data: parsed.data,
  });
  return success(goal);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { userId } = await requireAuth();
  const { id } = await params;
  const goalId = parseInt(id, 10);
  if (isNaN(goalId)) return error("無効なIDです");

  await prisma.savingsGoal.delete({ where: { id: goalId, userId } });
  return success({ deleted: true });
}
