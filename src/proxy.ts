import { NextRequest, NextResponse } from "next/server";

// 認証不要なパス
const publicPaths = ["/login", "/api/auth"];

// Cloudflare Access が有効か（環境変数チェックのみ、軽量）
const cfAccessEnabled = !!(
  process.env.CF_ACCESS_TEAM && process.env.CF_ACCESS_AUD
);

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

  if (sessionToken) {
    return NextResponse.next();
  }

  // セッションなし: Cloudflare Access 経由か判定
  if (cfAccessEnabled) {
    const cfJwt = request.headers.get("Cf-Access-Jwt-Assertion");
    if (cfJwt) {
      // CF JWT あり → cf-callback で自動ログイン
      const callbackUrl = new URL("/api/auth/cf-callback", request.url);
      callbackUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(callbackUrl);
    }
  }

  // CF JWT なし → 通常のログインページ（LAN fallback）
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // 静的ファイル・画像最適化・favicon を除外
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
