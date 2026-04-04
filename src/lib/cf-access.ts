import { importJWK, jwtVerify, type JWK } from "jose";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Cloudflare Access が有効かどうか
 */
export function isCfAccessEnabled(): boolean {
  return !!(process.env.CF_ACCESS_TEAM && process.env.CF_ACCESS_AUD);
}

// JWKS キャッシュ
let cachedKeys: CryptoKey[] | null = null;

/**
 * start.sh で事前ダウンロードした JWKS ファイルから鍵を読み込む。
 * Node.js の fetch が証明書エラーで失敗する問題を回避。
 */
async function getKeys(): Promise<CryptoKey[]> {
  if (cachedKeys) return cachedKeys;

  const jwksPath = join(process.cwd(), "data", "cf-jwks.json");
  const jwksData = JSON.parse(readFileSync(jwksPath, "utf-8"));
  const keys: CryptoKey[] = [];

  for (const key of jwksData.keys as JWK[]) {
    const imported = await importJWK(key, key.alg ?? "RS256");
    keys.push(imported as CryptoKey);
  }

  cachedKeys = keys;
  return keys;
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

    const keys = await getKeys();

    // 各鍵で検証を試行（複数の鍵がローテーションされている場合）
    let lastError: unknown;
    for (const key of keys) {
      try {
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

        return {
          email,
          name,
          exp: payload.exp ?? Math.floor(Date.now() / 1000) + 86400,
        };
      } catch (e) {
        lastError = e;
      }
    }

    console.error("[CF Access] JWT verification failed with all keys:", lastError);
    return null;
  } catch (e) {
    console.error("[CF Access] JWT verification failed:", e);
    return null;
  }
}
