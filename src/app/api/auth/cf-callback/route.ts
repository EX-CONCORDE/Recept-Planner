import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyCfAccessJwt } from "@/lib/cf-access";
import { createUserWithDefaults } from "@/lib/default-categories";

/**
 * CF Tunnel 経由の場合 request.url が http://localhost:3000 になるため、
 * x-forwarded-host / x-forwarded-proto から実際のURLを復元する。
 */
function getExternalUrl(request: NextRequest, path: string): URL {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return new URL(path, `${forwardedProto}://${forwardedHost}`);
  }
  return new URL(path, request.url);
}

export async function GET(request: NextRequest) {
  const cfToken = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!cfToken) {
    return NextResponse.redirect(getExternalUrl(request, "/login"));
  }

  // CF JWT 検証
  const payload = await verifyCfAccessJwt(cfToken);
  if (!payload) {
    return NextResponse.redirect(
      getExternalUrl(request, "/login?error=CfAccessFailed"),
    );
  }

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
    return NextResponse.redirect(
      getExternalUrl(request, "/login?error=AccountDisabled"),
    );
  }

  // Auth.js 互換の JWT トークンを生成
  const secret = process.env.AUTH_SECRET!;
  const maxAge = payload.exp - Math.floor(Date.now() / 1000);
  const token = await encode({
    token: {
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      sub: String(user.id),
    },
    secret,
    salt: "authjs.session-token",
    maxAge,
  });

  // リダイレクト先
  const callbackUrl =
    request.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const response = NextResponse.redirect(
    getExternalUrl(request, callbackUrl),
  );

  // Auth.js セッションクッキーをセット
  const isSecure = request.headers.get("x-forwarded-proto") === "https";
  response.cookies.set("authjs.session-token", token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
