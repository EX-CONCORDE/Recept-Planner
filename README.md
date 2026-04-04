# レシートプランナー

レシート・請求書のスクリーンショットをAIで読み取り、支出を自動管理するマルチユーザー対応Webアプリ。  
Cloudflare Tunnel で外部公開し、Cloudflare Access (Zero Trust) でユーザー認証を一元管理できます。

## 機能

- **マルチユーザー**: Cloudflare Access 自動ログイン（Google等のIdPはCF側で設定）/ パスワード認証（LAN用）
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
| 認証 | Auth.js v5 — Cloudflare Access (自動ログイン) / Credentials (LAN fallback) |
| 外部公開 | Cloudflare Tunnel (`cloudflared`) + Cloudflare Access (Zero Trust) |
| AI | LMStudio (Vision対応LLM、別サーバー) |

## アーキテクチャ

```
[外部ユーザー]
      │
      │ HTTPS
      ▼
┌─ Cloudflare ────────────────────┐
│  Access (Zero Trust 認証ゲート)  │
│  Tunnel (cloudflared)           │
└────────────┬────────────────────┘
             │ HTTP (localhost:3000)
             ▼
┌─── サーバー (Ubuntu 24.04) ─────────┐
│                                      │
│   [Next.js App]  ←→  [PostgreSQL]    │
│     ├─ proxy.ts (CF JWT検出→自動ログイン)│
│     ├─ Auth.js (セッション管理)      │
│     └─ API Routes (userIdスコープ)   │
│        │                             │
│        │ HTTP (内部ネットワーク)       │
│        ▼                             │
│   [LMStudio] (Vision LLM)           │
└──────────────────────────────────────┘

[LANユーザー] → http://<サーバーIP>:3000 → ログインページ（フォールバック）
```

---

## 初回セットアップ

### 必要なもの

- Ubuntu 24.04 Server（または同等のLinux）
- Node.js 22+
- PostgreSQL 16
- （外部公開する場合）Cloudflare アカウント + ドメイン
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
npm install
```

### 4. 環境変数を設定

```bash
cp .env.example .env
nano .env
```

```env
# PostgreSQL（手順2で設定したパスワードに合わせる）
DATABASE_URL="postgresql://recept:ここに安全なパスワード@localhost:5432/recept_planner"

# Auth.js（必須）
AUTH_SECRET="ランダムな32文字以上の文字列"
# ↑ 生成: openssl rand -base64 32

# Cloudflare Access（外部公開する場合。後述の手順で取得）
# CF_ACCESS_TEAM="your-team"
# CF_ACCESS_AUD="your-audience-tag"

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
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 6. ビルドと起動

```bash
npm run build
./start.sh
```

`http://<サーバーIP>:3000` にアクセスしてログイン画面が表示されればOK。

> **注意**: `npm run start` ではなく `./start.sh` を使ってください。standalone ビルドの `.env` 読み込み・静的ファイルコピー・CA証明書設定を自動で行います。

### 7. 初回ログイン

- メール: `.env` の `ADMIN_EMAIL`（デフォルト: `admin@local`）
- パスワード: `.env` の `ADMIN_PASSWORD` で設定した値

---

## Cloudflare Tunnel + Access で外部公開

### 1. cloudflared のインストール

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared
```

### 2. Tunnel の作成と認証

```bash
# Cloudflare にログイン（ブラウザが開く）
cloudflared tunnel login

# Tunnel を作成
cloudflared tunnel create recept-planner

# 設定ファイルを作成
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: <tunnel-id>
credentials-file: /home/$USER/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: recept.example.com
    service: http://localhost:3000
  - service: http_status:404
EOF
```

`recept.example.com` は自分のドメインのサブドメインに置き換えてください。

### 3. DNS レコードの設定

```bash
cloudflared tunnel route dns recept-planner recept.example.com
```

### 4. Cloudflare Access の設定

1. [Cloudflare Zero Trust ダッシュボード](https://one.dash.cloudflare.com/) にアクセス
2. **Access** → **Applications** → **Add an Application**
3. **Self-hosted** を選択
4. 設定:
   - Application name: `レシートプランナー`
   - Application domain: `recept.example.com`
5. **Policy** を追加（例: 特定メールアドレスのみ許可）:
   - Policy name: `Allowed Users`
   - Action: **Allow**
   - Include: **Emails** → 許可するメールアドレスを入力
6. 作成後、**Application Audience (AUD) Tag** をコピー
7. **Settings** の **Team domain** を確認（例: `your-team.cloudflareaccess.com` の `your-team` 部分）

### 5. 環境変数に追加

```bash
nano /opt/Recept-Planner/.env
```

```env
CF_ACCESS_TEAM="your-team"
CF_ACCESS_AUD="コピーしたAUD Tag"
```

### 6. Tunnel をサービス化して起動

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

アプリも再起動:

```bash
sudo systemctl restart recept-planner
```

### 7. 動作確認

`https://recept.example.com` にアクセス → Cloudflare Access のログイン画面 → 認証後、自動的にアプリにログインされる。

**初回アクセスしたユーザーは自動的にアプリに登録されます**（デフォルトカテゴリ付き）。Cloudflare Access のポリシーでアクセスを許可されたユーザーのみ登録されるため、アプリ側での招待は不要です。

---

## 認証方式

2つの認証方式があり、環境変数で有効/無効を切り替えます。

| 方式 | 環境変数 | 用途 |
|------|----------|------|
| **Cloudflare Access** | `CF_ACCESS_TEAM` + `CF_ACCESS_AUD` | 外部公開時。Google等のIdPはCF Zero Trust側で設定。ユーザーは自動登録 |
| **パスワード認証** | 常に有効 | LAN内フォールバック。管理者が `/admin` でユーザーを作成 |

### 認証フロー

```
CF Tunnel経由（外部）:
  ブラウザ → CF Access (Google等で認証) → アプリ → CF JWT検出 → 自動ログイン → ダッシュボード

LAN直接アクセス:
  ブラウザ → アプリ → ログインページ → メール+パスワード → ダッシュボード
```

### ユーザー管理

| 運用形態 | ユーザーの管理場所 |
|----------|-------------------|
| CF Access 利用時 | **Cloudflare Zero Trust** のポリシーで管理。アプリ側は自動登録 |
| LAN内のみ | アプリの **管理パネル** (`/admin`) で管理者がユーザーを作成 |

### ロール

| ロール | 権限 |
|--------|------|
| `admin` | 全機能 + ユーザー管理（`/admin`） |
| `member` | 自分のデータの閲覧・編集のみ |

CF Access 経由で自動作成されたユーザーは `member` ロールです。管理者にするにはアプリの `/admin` で昇格してください。

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
ExecStart=/opt/Recept-Planner/start.sh
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable recept-planner
sudo systemctl start recept-planner
```

## ファイアウォール設定

```bash
sudo ufw enable
sudo ufw allow ssh

# CF Tunnel経由のみで公開する場合、3000番ポートはlocalhostのみに制限
# （cloudflaredがlocalhost:3000に接続するため外部公開不要）
sudo ufw deny 3000

# LAN内からもアクセスする場合
sudo ufw allow from 192.168.0.0/16 to any port 3000
```

---

## アップデート方法

```bash
cd /opt/Recept-Planner
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
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
