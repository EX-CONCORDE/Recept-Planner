import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { error } from "@/lib/api-response";
import { verifyCfAccessJwt, isCfAccessEnabled } from "@/lib/cf-access";
import { prisma } from "@/lib/prisma";
import { createUserWithDefaults } from "@/lib/default-categories";

/**
 * 認証済みユーザーのIDを取得。未認証なら401レスポンスをthrow。
 *
 * 1. CF Access JWT ヘッダーがあれば直接検証（Auth.jsをバイパス）
 * 2. なければ Auth.js セッションで確認（LAN Credentials用）
 */
export async function requireAuth(): Promise<{ userId: number; role: string }> {
  // CF Access: 全リクエストにJWTヘッダーが付くので直接検証
  if (isCfAccessEnabled()) {
    const headerStore = await headers();
    const cfToken = headerStore.get("Cf-Access-Jwt-Assertion");
    if (cfToken) {
      const payload = await verifyCfAccessJwt(cfToken);
      if (payload) {
        // ユーザー検索 or 自動作成
        let user = await prisma.user.findUnique({
          where: { email: payload.email },
        });
        if (!user) {
          user = await createUserWithDefaults({
            name: payload.name,
            email: payload.email,
          });
        }
        if (!user.isActive) {
          throw error("アカウントが無効です", 403);
        }
        return { userId: user.id, role: user.role };
      }
    }
  }

  // LAN fallback: Auth.js セッション
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
