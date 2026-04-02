import { z } from "zod/v4";

export const createUserSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(100),
  email: z.email("有効なメールアドレスを入力してください"),
  role: z.enum(["admin", "member"]).default("member"),
  password: z.string().min(8, "パスワードは8文字以上にしてください").optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  role: z.enum(["admin", "member"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});
