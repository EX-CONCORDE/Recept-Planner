# レシートプランナー

レシート・請求書のスクリーンショットをAIで読み取り、支出を自動管理する個人用Webアプリ。

## 機能

- **レシートAI読み取り**: カメラ撮影/画像アップロード → LMStudio Vision LLMで金額・店名・カテゴリを自動抽出
- **収支管理ダッシュボード**: 月次の予算バー、カテゴリ別円グラフ/棒グラフ、日別支出トレンド
- **税金自動計算**: 額面月収から社会保険料・所得税・住民税を2026年度税率で自動控除
  - 47都道府県別の健康保険料率・住民税超過課税に対応
  - 子ども・子育て支援金（2026年4月新設）対応
- **貯金管理**: 目標設定、残額バー表示、貯金切り崩し警告
- **住民税予測**: 今年の収入から来年の住民税を概算
- **レスポンシブ**: スマホ（ボトムナビ）/ PC（サイドバー + 2カラム）

## 技術スタック

- **フロント**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **DB**: PostgreSQL 16 (Docker)
- **ORM**: Prisma v7
- **AI**: LMStudio (Vision対応LLM、別サーバー)

## セットアップ

### 必要なもの

- Node.js 22+
- Docker & Docker Compose
- （AI機能を使う場合）LMStudioが稼働しているサーバー

### 1. リポジトリをクローン

```bash
git clone https://github.com/EX-CONCORDE/Recept-Planner.git
cd Recept-Planner
```

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env` を編集:

```env
# PostgreSQLのパスワードを安全な値に変更
DATABASE_URL="postgresql://recept:YOUR_SECURE_PASSWORD@localhost:5432/recept_planner"

# LMStudioサーバーのアドレス（AI機能を使う場合）
LMSTUDIO_BASE_URL="http://192.168.1.x:1234"
LMSTUDIO_MODEL="gemma-3-12b"

# レシート画像の保存先
RECEIPT_STORAGE_PATH="./data/receipts"
```

### 3A. Docker Compose で本番デプロイ（推奨）

```bash
# .envにPOSTGRES_PASSWORDとLMSTUDIO_BASE_URLを設定
export POSTGRES_PASSWORD=your_secure_password
export LMSTUDIO_BASE_URL=http://192.168.1.x:1234

docker compose -f docker-compose.prod.yml up -d
```

初回はマイグレーションとシードが必要:

```bash
# コンテナに入ってマイグレーション
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# シードデータ（デフォルトカテゴリ）
docker compose -f docker-compose.prod.yml exec app npx jiti prisma/seed.ts
```

http://localhost:3000 でアクセス。

### 3B. 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# PostgreSQL起動
docker compose up -d

# Prismaクライアント生成 + マイグレーション
npx prisma generate
npx prisma migrate dev

# シードデータ投入
npx jiti prisma/seed.ts

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス。

## 推奨LLMモデル（LMStudio用）

| モデル | VRAM目安 | 日本語OCR | 推奨度 |
|--------|---------|----------|--------|
| Gemma 3 12B | ~8GB (Q4) | 優秀 | **最推奨** |
| Qwen2.5-VL 7B | ~6GB (Q4) | 優秀 | 推奨 |
| Qwen2.5-VL 32B | ~20GB (Q4) | 非常に優秀 | VRAM十分なら |

## セキュリティ

- **認証なし**の個人用アプリです。LAN内限定で使用してください
- UFWでLAN外からのポート3000をブロック推奨: `sudo ufw allow from 192.168.0.0/16 to any port 3000`
- 画像はpublic外に保存され、API経由でのみアクセス可能
- DBパスワードは必ず変更してください

## バックアップ

```bash
# DBバックアップ
docker compose exec db pg_dump -U recept recept_planner > backup_$(date +%Y%m%d).sql

# 復元
docker compose exec -T db psql -U recept recept_planner < backup_20260401.sql
```

## npm scripts

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:migrate` | マイグレーション実行 |
