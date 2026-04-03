import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Cloudflare Access が有効かどうか
 */
export function isCfAccessEnabled(): boolean {
  return !!(process.env.CF_ACCESS_TEAM && process.env.CF_ACCESS_AUD);
}

// JWKS は遅延初期化してキャッシュ
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    const team = process.env.CF_ACCESS_TEAM!;
    const url = new URL(
      `https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`,
    );
    jwks = createRemoteJWKSet(url);
  }
  return jwks;
}

interface CfAccessPayload {
  email: string;
  name: string;
  exp: number;
}

/**
 * Cloudflare Access JWT を検証し、ペイロードを返す。
 * 失敗時は null。
 */
export async function verifyCfAccessJwt(
  token: string,
): Promise<CfAccessPayload | null> {
  if (!isCfAccessEnabled()) return null;

  try {
    const aud = process.env.CF_ACCESS_AUD!;
    const team = process.env.CF_ACCESS_TEAM!;
    const issuer = `https://${team}.cloudflareaccess.com`;

    const { payload } = await jwtVerify(token, getJwks(), {
      issuer,
      audience: aud,
    });

    const email = payload.email as string | undefined;
    if (!email) return null;

    // 名前: custom claim or email local part
    const name =
      (payload.name as string | undefined) ??
      (payload.custom as Record<string, string> | undefined)?.name ??
      email.split("@")[0];

    return {
      email,
      name,
      exp: payload.exp ?? Math.floor(Date.now() / 1000) + 86400,
    };
  } catch (e) {
    console.error("[CF Access] JWT verification failed:", e);
    return null;
  }
}
