import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { updateCategorySchema } from "@/lib/validations/category";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) return error("無効なIDです");

  const body = await request.json();
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: parsed.data,
  });
  return success(category);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const categoryId = parseInt(id, 10);
  if (isNaN(categoryId)) return error("無効なIDです");

  await prisma.category.delete({ where: { id: categoryId } });
  return success({ deleted: true });
}
