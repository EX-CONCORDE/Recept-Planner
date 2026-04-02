import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { success, error } from "@/lib/api-response";
import { requireAdmin } from "@/lib/session";
import { createUserSchema } from "@/lib/validations/user";
import bcrypt from "bcryptjs";

// デフォルトカテゴリのテンプレート
const defaultCategories = [
  { name: "食費", type: "expense", isDefault: true },
  { name: "交通費", type: "expense", isDefault: true },
  { name: "日用品", type: "expense", isDefault: true },
  { name: "娯楽", type: "expense", isDefault: true },
  { name: "医療費", type: "expense", isDefault: true },
  { name: "通信費", type: "expense", isDefault: true },
  { name: "光熱費", type: "expense", isDefault: true },
  { name: "衣服", type: "expense", isDefault: true },
  { name: "教育", type: "expense", isDefault: true },
  { name: "住居費", type: "expense", isDefault: true },
  { name: "保険", type: "expense", isDefault: true },
  { name: "サブスク", type: "expense", isDefault: true },
  { name: "その他", type: "expense", isDefault: true },
  { name: "給与", type: "income", isDefault: true },
  { name: "副収入", type: "income", isDefault: true },
  { name: "その他収入", type: "income", isDefault: true },
];

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

  // メール重複チェック
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return error("このメールアドレスは既に登録されています", 409);
  }

  // パスワードハッシュ化
  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : null;

  // ユーザー作成 + デフォルトカテゴリコピーをトランザクションで実行
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
    });

    // デフォルトカテゴリをコピー
    await tx.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: newUser.id,
      })),
    });

    return newUser;
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
