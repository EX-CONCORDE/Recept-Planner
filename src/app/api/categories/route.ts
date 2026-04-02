import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { createCategorySchema } from "@/lib/validations/category";
import { requireAuth } from "@/lib/session";

export async function GET() {
  const { userId } = await requireAuth();
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { id: "asc" },
  });
  return success(categories);
}

export async function POST(request: NextRequest) {
  const { userId } = await requireAuth();
  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const existing = await prisma.category.findUnique({
    where: { name_userId: { name: parsed.data.name, userId } },
  });
  if (existing) {
    return error("同じ名前のカテゴリが既に存在します", 409);
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, userId },
  });
  return success(category, 201);
}
