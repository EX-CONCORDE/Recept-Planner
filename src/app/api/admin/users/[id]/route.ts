import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { requireAdmin } from "@/lib/session";
import { updateUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId: adminId } = await requireAdmin();
  const { id } = await params;
  const targetId = parseInt(id, 10);
  if (isNaN(targetId)) return error("無効なIDです");

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  // 最後のadmin保護
  if (parsed.data.role === "member" || parsed.data.isActive === false) {
    const adminCount = await prisma.user.count({
      where: { role: "admin", isActive: true },
    });
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (target?.role === "admin" && adminCount <= 1) {
      return error("最後の管理者を降格または無効化できません", 400);
    }
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: targetId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return success(user);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await requireAdmin();
  const { id } = await params;
  const targetId = parseInt(id, 10);
  if (isNaN(targetId)) return error("無効なIDです");

  // 最後のadmin保護
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (target?.role === "admin") {
    const adminCount = await prisma.user.count({
      where: { role: "admin", isActive: true },
    });
    if (adminCount <= 1) {
      return error("最後の管理者を削除できません", 400);
    }
  }

  // 論理削除
  await prisma.user.update({
    where: { id: targetId },
    data: { isActive: false },
  });

  return success({ deleted: true });
}
