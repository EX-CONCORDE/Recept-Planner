import { prisma } from "@/lib/prisma";

export const defaultCategories = [
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

/**
 * ユーザーを作成し、デフォルトカテゴリをコピーする。
 */
export async function createUserWithDefaults(data: {
  name: string;
  email: string;
  role?: string;
  passwordHash?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role ?? "member",
        passwordHash: data.passwordHash ?? null,
      },
    });

    await tx.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: newUser.id,
      })),
    });

    return newUser;
  });
}
