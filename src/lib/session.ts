import { auth } from "@/lib/auth";
import { error } from "@/lib/api-response";

/**
 * 認証済みユーザーのIDを取得。未認証なら401レスポンスをthrow。
 */
export async function requireAuth(): Promise<{ userId: number; role: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw error("認証が必要です", 401);
  }
  return {
    userId: Number(session.user.id),
    role: session.user.role,
  };
}

/**
 * 管理者権限を要求。権限不足なら403レスポンスをthrow。
 */
export async function requireAdmin(): Promise<{ userId: number; role: string }> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw error("管理者権限が必要です", 403);
  }
  return user;
}
