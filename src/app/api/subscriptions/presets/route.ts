import { prisma } from "@/lib/prisma";
import { success } from "@/lib/api-response";
import {
  subscriptionPresets,
  groupPresetsByCategory,
} from "@/lib/subscription-presets";

export async function GET() {
  // カテゴリヒント名からカテゴリIDを解決
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  const presetsWithCategoryId = subscriptionPresets.map((p) => ({
    ...p,
    categoryId: categoryMap.get(p.categoryHint) ?? null,
  }));

  const grouped = groupPresetsByCategory(subscriptionPresets);
  const groupNames = Object.keys(grouped);

  return success({
    presets: presetsWithCategoryId,
    groups: groupNames,
  });
}
