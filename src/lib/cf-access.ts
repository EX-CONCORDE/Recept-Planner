import { importJWK, jwtVerify, decodeProtectedHeader, decodeJwt, type JWK } from "jose";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function isCfAccessEnabled(): boolean {
  return !!(process.env.CF_ACCESS_TEAM && process.env.CF_ACCESS_AUD);
}

let cachedKeys: { kid: string; alg: string; key: CryptoKey }[] | null = null;

async function getKeys(): Promise<{ kid: string; alg: string; key: CryptoKey }[]> {
  if (cachedKeys) return cachedKeys;

  const jwksPath = join(process.cwd(), "data", "cf-jwks.json");
  const raw = readFileSync(jwksPath, "utf-8");
  console.log("[CF Access] JWKS file size:", raw.length, "bytes");

  const jwksData = JSON.parse(raw);
  const keys: { kid: string; alg: string; key: CryptoKey }[] = [];

  for (const jwk of jwksData.keys as JWK[]) {
    const alg = jwk.alg ?? "RS256";
    console.log("[CF Access] JWKS key: kid=", jwk.kid, "alg=", alg, "kty=", jwk.kty);
    const imported = await importJWK(jwk, alg);
    keys.push({ kid: jwk.kid ?? "", alg, key: imported as CryptoKey });
  }

  cachedKeys = keys;
  return keys;
}

interface CfAccessPayload {
  email: string;
  name: string;
  exp: number;
}

export async function verifyCfAccessJwt(
  token: string,
): Promise<CfAccessPayload | null> {
  if (!isCfAccessEnabled()) return null;

  try {
    // JWTのヘッダーとペイロードをデコード（署名検証なし）して中身を確認
    const header = decodeProtectedHeader(token);
    const claims = decodeJwt(token);

    console.log("[CF Access] === JWT Debug Info ===");
    console.log("[CF Access] JWT header: kid=", header.kid, "alg=", header.alg);
    console.log("[CF Access] JWT claims: iss=", claims.iss, "aud=", claims.aud, "email=", claims.email);
    console.log("[CF Access] JWT exp:", claims.exp, "iat:", claims.iat);
    console.log("[CF Access] Expected issuer:", `https://${process.env.CF_ACCESS_TEAM}.cloudflareaccess.com`);
    console.log("[CF Access] Expected audience:", process.env.CF_ACCESS_AUD);
    console.log("[CF Access] Audience match:",
      Array.isArray(claims.aud)
        ? claims.aud.includes(process.env.CF_ACCESS_AUD!)
        : claims.aud === process.env.CF_ACCESS_AUD
    );

    const aud = process.env.CF_ACCESS_AUD!;
    const team = process.env.CF_ACCESS_TEAM!;
    const issuer = `https://${team}.cloudflareaccess.com`;

    const keys = await getKeys();

    console.log("[CF Access] JWT kid:", header.kid);
    console.log("[CF Access] JWKS kids:", keys.map(k => k.kid));
    console.log("[CF Access] Kid match:", keys.some(k => k.kid === header.kid));

    let lastError: unknown;
    for (const { kid, key } of keys) {
      try {
        console.log("[CF Access] Trying key kid=", kid);
        const { payload } = await jwtVerify(token, key, {
          issuer,
          audience: aud,
        });

        const email = payload.email as string | undefined;
        if (!email) return null;

        const name =
          (payload.name as string | undefined) ??
          (payload.custom as Record<string, string> | undefined)?.name ??
          email.split("@")[0];

        console.log("[CF Access] Verification SUCCESS for", email);
        return {
          email,
          name,
          exp: payload.exp ?? Math.floor(Date.now() / 1000) + 86400,
        };
      } catch (e) {
        console.error("[CF Access] Key kid=", kid, "failed:", (e as Error).message);
        lastError = e;
      }
    }

    console.error("[CF Access] All keys failed. Last error:", lastError);
    return null;
  } catch (e) {
    console.error("[CF Access] JWT decode/verification failed:", e);
    return null;
  }
}
