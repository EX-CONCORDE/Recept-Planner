import { z } from "zod/v4";

export const categoryTypeSchema = z.enum(["expense", "income"]);

export const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です").max(100),
  type: categoryTypeSchema.default("expense"),
  isDefault: z.boolean().default(false),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
