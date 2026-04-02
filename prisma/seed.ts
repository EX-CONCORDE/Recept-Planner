import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

async function main() {
  // 初期管理者ユーザーを upsert
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@local";
  const adminName = process.env.ADMIN_NAME ?? "管理者";
  const adminPassword = process.env.ADMIN_PASSWORD;

  const passwordHash = adminPassword
    ? await bcrypt.hash(adminPassword, 10)
    : await bcrypt.hash("admin", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: "admin",
    },
  });

  // デフォルトカテゴリを管理者に紐付け
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_userId: { name: cat.name, userId: admin.id },
      },
      update: {},
      create: { ...cat, userId: admin.id },
    });
  }

  console.log(`Seed complete: admin user (id=${admin.id}, email=${admin.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
