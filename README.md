# レシートプランナー

レシート・請求書のスクリーンショットをAIで読み取り、支出を自動管理するマルチユーザー対応Webアプリ。

## 機能

- **マルチユーザー**: 招待制ユーザー管理、Google OAuth + パスワード認証、管理者パネル
- **レシートAI読み取り**: カメラ撮影/画像アップロード → LMStudio Vision LLMで金額・店名・カテゴリを自動抽出
- **収支管理ダッシュボード**: 月次の予算バー、カテゴリ別円グラフ/棒グラフ、日別支出トレンド
- **税金自動計算**: 額面月収から社会保険料・所得税・住民税を2026年度税率で自動控除
  - 47都道府県別の健康保険料率・住民税超過課税に対応
  - 子ども・子育て支援金（2026年4月新設）対応
- **貯金管理**: 目標設定、達成予測、プログレスバー、貯金切り崩し警告
- **住民税予測**: 今年の収入から来年の住民税を概算
- **レスポンシブ**: スマホ（ボトムナビ）/ PC（サイドバー + 2カラム）

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui + Recharts |
| バックエンド | Next.js API Routes + Prisma v7 |
| データベース | PostgreSQL 16 |
| 認証 | Auth.js v5 (NextAuth) — Google OAuth + Credentials |
| AI | LMStudio (Vision対応LLM、別サーバー) |

## アーキテクチャ

```
[スマホ/PC ブラウザ]
        │
        │ HTTP (port 3000)
        ▼
┌─── サーバー (Ubuntu 24.04) ─────────┐
│                                      │
│   [Next.js App]  ←→  [PostgreSQL]    │
│     ├─ Auth.js (認証)                │
│     ├─ API Routes (全ルートuserIdスコープ)│
│     └─ proxy.ts (ルート保護)         │
│        │                             │
│        │ HTTP (内部ネットワーク)       │
│        ▼                             │
│   [LMStudio VM] (Vision LLM)        │
└──────────────────────────────────────┘
```

---

## 初回セットアップ

### 必要なもの

- Ubuntu 24.04 Server（または同等のLinux）
- Node.js 22+
- PostgreSQL 16
- （AI機能を使う場合）LMStudioが稼働しているサーバー

### 1. サーバー準備

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Node.js 22 インストール
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# PostgreSQL 16 インストール
sudo apt install -y postgresql-16 postgresql-client-16
```

### 2. PostgreSQL セットアップ

```bash
# DBユーザーとデータベースを作成
sudo -u postgres psql << 'SQL'
CREATE USER recept WITH PASSWORD 'ここに安全なパスワード';
CREATE DATABASE recept_planner OWNER recept;
GRANT ALL PRIVILEGES ON DATABASE recept_planner TO recept;
SQL
```

### 3. アプリのクローンとインストール

```bash
cd /opt
sudo git clone https://github.com/EX-CONCORDE/Recept-Planner.git
sudo chown -R $USER:$USER Recept-Planner
cd Recept-Planner

# 依存関係インストール
npm install
```

### 4. 環境変数を設定

```bash
cp .env.example .env
nano .env
```

`.env` を以下のように編集:

```env
# PostgreSQL（手順2で設定したパスワードに合わせる）
DATABASE_URL="postgresql://recept:ここに安全なパスワード@localhost:5432/recept_planner"

# Auth.js（必須）
AUTH_SECRET="ランダムな32文字以上の文字列"
# ↑ 以下のコマンドで生成: openssl rand -base64 32

# Google OAuth（任意。未設定ならパスワード認証のみ）
# AUTH_GOOGLE_ID=""
# AUTH_GOOGLE_SECRET=""
# ↑ 設定方法: docs/google-oauth-setup.md を参照

# 初期管理者（seedで使用）
ADMIN_EMAIL="admin@local"
ADMIN_NAME="管理者"
ADMIN_PASSWORD="ここに管理者パスワード"

# LMStudio（AI機能を使う場合）
LMSTUDIO_BASE_URL="http://192.168.1.x:1234"
LMSTUDIO_MODEL="gemma-3-12b"

# レシート画像保存先
RECEIPT_STORAGE_PATH="./data/receipts"
```

### 5. データベース初期化

```bash
# Prismaクライアント生成
npx prisma generate

# マイグレーション実行
npx prisma migrate deploy

# 初期管理者 + デフォルトカテゴリ作成
npx prisma db seed
```

### 6. ビルドと起動

```bash
# 本番ビルド
npm run build

# 起動
npm run start
```

`http://<サーバーIP>:3000` にアクセスしてログイン画面が表示されればOK。

### 7. 初回ログイン

- メール: `.env` の `ADMIN_EMAIL`（デフォルト: `admin@local`）
- パスワード: `.env` の `ADMIN_PASSWORD` で設定した値

ログイン後、サイドバーの「ユーザー管理」から他のユーザーを招待できます。

---

## systemd で自動起動

```bash
sudo tee /etc/systemd/system/recept-planner.service << EOF
[Unit]
Description=Recept Planner
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/Recept-Planner
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable recept-planner
sudo systemctl start recept-planner
sudo systemctl status recept-planner
```

## ファイアウォール設定

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow from 192.168.0.0/16 to any port 3000
sudo ufw deny 3000
```

---

## ユーザー管理

### 認証方式

| 方式 | 用途 |
|------|------|
| **パスワード認証** | LAN内運用（デフォルト）。管理者がメール+パスワードでユーザーを作成 |
| **Google OAuth** | インターネット接続がある環境。`AUTH_GOOGLE_ID` 設定時に自動有効化 |

両方を同時に使えます。Google OAuth の設定手順は [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md) を参照。

### 招待制

- ユーザー登録ページはありません
- 管理者が `/admin` からユーザーを作成します
- 新規ユーザーにはデフォルトカテゴリが自動コピーされます
- Google OAuth の場合もDBに登録済みのメールでのみログイン可能

### ロール

| ロール | 権限 |
|--------|------|
| `admin` | 全機能 + ユーザー管理（`/admin`） |
| `member` | 自分のデータの閲覧・編集のみ |

---

## アップデート方法

```bash
cd /opt/Recept-Planner
git pull

npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# systemd使用時
sudo systemctl restart recept-planner
```

## バックアップ

```bash
# DBバックアップ
pg_dump -U recept recept_planner > backup_$(date +%Y%m%d).sql

# 復元
psql -U recept recept_planner < backup_20260401.sql

# レシート画像のバックアップ
tar czf receipts_$(date +%Y%m%d).tar.gz data/receipts/
```

## 推奨LLMモデル（LMStudio用）

| モデル | VRAM目安 | 日本語OCR | 推奨度 |
|--------|---------|----------|--------|
| Gemma 3 12B | ~8GB (Q4) | 優秀 | **最推奨** |
| Qwen2.5-VL 7B | ~6GB (Q4) | 優秀 | 推奨 |
| Qwen2.5-VL 32B | ~20GB (Q4) | 非常に優秀 | VRAM十分なら |

## npm scripts

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:migrate` | マイグレーション実行 |
