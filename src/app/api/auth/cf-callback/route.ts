import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyCfAccessJwt } from "@/lib/cf-access";
import { createUserWithDefaults } from "@/lib/default-categories";

export async function GET(request: NextRequest) {
  const cfToken = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!cfToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // CF JWT 検証
  const payload = await verifyCfAccessJwt(cfToken);
  if (!payload) {
    return NextResponse.redirect(
      new URL("/login?error=CfAccessFailed", request.url),
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
      new URL("/login?error=AccountDisabled", request.url),
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
    new URL(callbackUrl, request.url),
  );

  // Auth.js セッションクッキーをセット
  response.cookies.set("authjs.session-token", token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
