import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { createCategorySchema } from "@/lib/validations/category";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });
  return success(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createCategorySchema.safeParse(body);

  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const existing = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return error("同じ名前のカテゴリが既に存在します", 409);
  }

  const category = await prisma.category.create({ data: parsed.data });
  return success(category, 201);
}
