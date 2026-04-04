#!/bin/bash
# レシートプランナー 本番起動スクリプト
set -e

cd "$(dirname "$0")"

# .env を読み込む（standalone は dotenv を使わないため）
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# standalone に静的ファイルをコピー（初回 or ビルド後に必要）
if [ -d .next/standalone ]; then
  cp -r public .next/standalone/ 2>/dev/null || true
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
fi

# Cloudflare Access の JWKS を事前ダウンロード（curl はシステムCA証明書を使うので成功する）
if [ -n "$CF_ACCESS_TEAM" ]; then
  echo "Downloading Cloudflare Access JWKS..."
  JWKS_URL="https://${CF_ACCESS_TEAM}.cloudflareaccess.com/cdn-cgi/access/certs"
  # standalone の cwd は .next/standalone/ なのでそこに保存
  mkdir -p .next/standalone/data
  curl -sf "$JWKS_URL" > .next/standalone/data/cf-jwks.json \
    && echo "JWKS downloaded successfully from $JWKS_URL" \
    || echo "Warning: Failed to download JWKS from $JWKS_URL"
fi

# 起動
exec node .next/standalone/server.js
