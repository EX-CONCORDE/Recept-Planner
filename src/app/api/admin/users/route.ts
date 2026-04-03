import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { requireAdmin } from "@/lib/session";
import { createUserSchema } from "@/lib/validations/user";
import { createUserWithDefaults } from "@/lib/default-categories";
import bcrypt from "bcryptjs";

export async function GET() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return success(users);
}

export async function POST(request: NextRequest) {
  await requireAdmin();

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return error(parsed.error.issues[0].message);
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return error("このメールアドレスは既に登録されています", 409);
  }

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : null;

  const user = await createUserWithDefaults({
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    passwordHash,
  });

  return success(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    201,
  );
}
