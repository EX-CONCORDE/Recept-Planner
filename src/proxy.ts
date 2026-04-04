import { NextRequest, NextResponse } from "next/server";

// 認証不要なパス
const publicPaths = ["/login", "/api/auth"];

function getExternalUrl(request: NextRequest, path: string): URL {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return new URL(path, `${forwardedProto}://${forwardedHost}`);
  }
  return new URL(path, request.url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開パスはスキップ
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // セッションクッキーがあればOK
  const sessionToken =
    request.cookies.get("authjs.session-token") ??
    request.cookies.get("__Secure-authjs.session-token");

  if (sessionToken) {
    return NextResponse.next();
  }

  // CF Access JWT ヘッダーがあればOK（API側でrequireAuth()が検証する）
  const cfJwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (cfJwt) {
    return NextResponse.next();
  }

  // どちらもなし → ログインページ（LAN fallback）
  const loginUrl = getExternalUrl(request, "/login");
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
