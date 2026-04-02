import { NextRequest, NextResponse } from "next/server";

// 認証不要なパス
const publicPaths = ["/login", "/api/auth"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはスキップ
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // JWT セッションクッキーの存在チェック（楽観的チェック）
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 静的ファイル・画像最適化・favicon を除外
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
