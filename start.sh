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

# Node.js の CA証明書をシステムのものに設定
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# standalone に静的ファイルをコピー（初回 or ビルド後に必要）
if [ -d .next/standalone ]; then
  cp -r public .next/standalone/ 2>/dev/null || true
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
fi

# 起動（--use-openssl-ca でシステムのCA証明書を使用）
exec node --use-openssl-ca .next/standalone/server.js
