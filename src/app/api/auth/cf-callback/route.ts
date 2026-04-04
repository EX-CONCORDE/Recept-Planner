import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { verifyCfAccessJwt } from "@/lib/cf-access";
import { createUserWithDefaults } from "@/lib/default-categories";

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

  const payload = await verifyCfAccessJwt(cfToken);
  if (!payload) {
    return NextResponse.redirect(
      getExternalUrl(request, "/login?error=CfAccessFailed"),
    );
  }

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

  // HTTPS経由かどうかでCookie名を切り替え（Auth.jsの仕様に合わせる）
  const isSecure = request.headers.get("x-forwarded-proto") === "https";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  // Auth.js の salt はプレフィックスなしの名前（__Secure- を含まない）
  const salt = "authjs.session-token";

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
    salt,
    maxAge,
  });

  const callbackUrl =
    request.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const response = NextResponse.redirect(
    getExternalUrl(request, callbackUrl),
  );

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}
