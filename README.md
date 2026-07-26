# レシートプランナー

レシート・請求書のスクリーンショットをAIで読み取り、支出・収入・貯金・サブスクをまとめて管理する個人用の家計簿Webアプリ。

Next.js + PostgreSQL + Gemini API（またはLM Studio経由のローカルLLM）で構築。LAN内で自分専用サーバーとして動かすことを想定しており、認証機能はありません。

## 目次

- [機能](#機能)
- [画面構成](#画面構成)
- [技術スタック](#技術スタック)
- [セットアップ（開発環境）](#セットアップ開発環境)
- [本番デプロイ（Docker Compose）](#本番デプロイdocker-compose)
- [Ubuntu Server（Proxmox VM）への新規デプロイ](#ubuntu-serverproxmox-vmへの新規デプロイ)
- [サーバーの更新（コード変更を反映する）](#サーバーの更新コード変更を反映する)
- [環境変数](#環境変数)
- [AIモデル設定](#aiモデル設定)
- [データモデル](#データモデル)
- [セキュリティ](#セキュリティ)
- [バックアップ](#バックアップ)
- [npm scripts](#npm-scripts)

## 機能

### 収支管理
- **収支管理ダッシュボード**: 月収から貯金目標を差し引いた「使用可能額」を基準に、支出の進捗バー・日別支出トレンド（累計/日別切替）・カテゴリ別円グラフ/棒グラフを表示
- **予算枯渇予測**: 現在の支出ペースが続いた場合に予算が尽きる日を予測して警告
- **貯金切り崩し警告**: 支出が使用可能額を超えて貯金目標を食いつぶしている場合に警告表示
- **収入の3分類**:
  - 通常収入（給与など、月次設定の「手取り月収」として管理）
  - バッファー収入（日当・副収入など。使用可能額に上乗せしてその月だけ使える）
  - **残高への直接収入**: バッファーを介さず直接残高に加算する収入。割り勘の返金など「実質支払っていないお金」に使用し、進捗バー・日別ペース・予算上限ラインの計算にもすべて反映される
- **収支サマリー**: 月収（給与）＋バッファー＋直接収入をまとめた収入合計と支出・収支差額を表示。カテゴリ別の内訳付き

### レシート・支出登録
- **レシートAI読み取り**: カメラ撮影/画像アップロード → Gemini API（またはLM Studio経由のローカルLLM）で金額・店名・カテゴリを自動抽出し、確認画面で編集して登録
- **画像縮小**: アップロード画像をサーバー側で指定サイズ・品質にリサイズしてからAIへ送信し、トークンコストを削減
- **手動登録・編集**: 支出/収入を金額・日付・カテゴリ・店名・メモ付きで手動登録、一覧から編集・削除

### サブスクリプション管理
- **定期課金の一元管理**: サービス名・金額・請求サイクル（月次/年次）・次回請求日を登録
- **プリセット選択**: よく使うサブスクサービスをプリセットから選んで簡単登録
- **自動引き落とし**: ダッシュボード表示時に次回請求日を過ぎたサブスクを自動で支出として計上し、次回請求日を繰り越し
- **月額換算合計**: 年次契約は月割りして月額換算した合計をダッシュボードに表示

### 貯金管理
- **貯金目標**: 目標名・目標額・達成期限（任意）を設定し、進捗をサイドバー/ダッシュボードに表示
- **月別貯金実績**: 各月の「貯金目標額 + 使用可能額の余り」から実績を自動計算し、累計貯金額を追跡

### 税金自動計算
- **額面月収から手取りを自動計算**: 社会保険料・所得税・住民税を2026年度税率で控除
  - 47都道府県別の協会けんぽ健康保険料率に対応
  - 介護保険料（40歳以上）、雇用保険料に対応
  - 子ども・子育て支援金（2026年4月新設）を反映
  - 賞与月数を考慮した年収ベースの計算
- **来年度住民税予測**: 今年の額面収入から来年6月〜再来年5月の住民税天引き額を概算表示

### AI家計アシスタント
- **チャットで家計相談**: 選択中のAI（Gemini/LM Studio）と会話しながら、記録済みの購入履歴・カテゴリ別集計・サブスク・貯金状況を参照した回答を取得
- **チャットから支出/収入を登録**: 「今日コンビニで500円使った」のような発言から取引を自動作成（許可されたDB操作のみに限定）
- **AIアドバイス**: 現在の支出傾向から改善案を月ごとに生成し、次回更新まで保存表示

### その他
- **カテゴリ管理**: 支出/収入カテゴリの追加・編集・削除（デフォルトカテゴリはシードで投入）
- **AIプロバイダ設定GUI**: Gemini APIとLM Studio（ローカルLLM）をブラウザの `/settings` から切り替え・保存（DB保存、環境変数はフォールバックとしてのみ使用）
- **レスポンシブ**: スマホはボトムナビ、PCはサイドバー＋2カラムレイアウト

## 画面構成

| パス | 内容 |
|------|------|
| `/` | ダッシュボード（予算・収支サマリー・グラフ・税金・サブスク・直近の取引） |
| `/expenses` | 支出・収入の一覧・新規登録・編集 |
| `/upload` | レシート撮影/アップロード → AI抽出 → 確認登録 |
| `/subscriptions` | サブスクリプションの一覧・登録・編集 |
| `/categories` | カテゴリ管理 |
| `/settings` | AIプロバイダ設定（Gemini/LM Studio）、対象月選択、額面月収・税金設定、手取り月収、貯金目標 |

## 技術スタック

- **フロント**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **DB**: PostgreSQL 16 (Docker)
- **ORM**: Prisma v7（`@prisma/adapter-pg` によるドライバーアダプタ構成）
- **AI**: Gemini API（Vision対応モデル） / LM Studio経由のローカルLLM（Gemma 4 E4Bなど）を切り替え可能
- **画像処理**: sharp（レシート画像のリサイズ）
- **バリデーション**: Zod v4

## セットアップ（開発環境）

### 必要なもの

- Node.js 22+
- Docker & Docker Compose
- （AI機能を使う場合）Gemini APIキー、またはLM Studioをローカルで起動しておく

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/EX-CONCORDE/Recept-Planner.git
cd Recept-Planner

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して DATABASE_URL のパスワードなどを設定（下記「環境変数」参照）

# 3. 依存関係インストール
npm install

# 4. PostgreSQL起動
docker compose up -d

# 5. Prismaクライアント生成 + マイグレーション
npx prisma generate
npx prisma migrate dev

# 6. シードデータ投入（デフォルトカテゴリ）
npx jiti prisma/seed.ts

# 7. 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス。

## 本番デプロイ（Docker Compose）

```bash
git clone https://github.com/EX-CONCORDE/Recept-Planner.git
cd Recept-Planner
cp .env.example .env
# .env を編集（DATABASE_URLのパスワード等）

export POSTGRES_PASSWORD=your_secure_password
docker compose -f docker-compose.prod.yml up -d --build
```

初回はマイグレーションとシードが必要:

```bash
# コンテナ内でマイグレーション実行
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# シードデータ（デフォルトカテゴリ）
docker compose -f docker-compose.prod.yml exec app npx jiti prisma/seed.ts
```

http://localhost:3000 でアクセス。

## Ubuntu Server（Proxmox VM）への新規デプロイ

新しいサーバーに一からデプロイする手順です。

### 1. サーバー準備（Ubuntu 24.04 Server）

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Docker インストール
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# ログアウト→ログインして反映

# （Dockerを使わない場合）Node.js 22 インストール
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Git
sudo apt install -y git
```

### 2. アプリのデプロイ

```bash
# クローン
cd /opt
sudo git clone https://github.com/EX-CONCORDE/Recept-Planner.git
sudo chown -R $USER:$USER Recept-Planner
cd Recept-Planner

# 環境変数
cp .env.example .env
nano .env
# → DATABASE_URL のパスワードを変更
# → AIプロバイダ（Gemini / LM Studio）・APIキー・モデルは起動後に /settings から設定可能
```

### 3A. Docker で起動（推奨）

```bash
export POSTGRES_PASSWORD=your_secure_password

# ビルド＆起動
docker compose -f docker-compose.prod.yml up -d --build

# 初回: DBマイグレーション＆シード
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npx jiti prisma/seed.ts
```

### 3B. Node.js で直接起動

```bash
npm install
npx prisma generate

# PostgreSQLだけDockerで起動
docker compose up -d

# マイグレーション＆シード
npx prisma migrate deploy
npx jiti prisma/seed.ts

# ビルド＆起動
npm run build
npm run start
```

### 4. ファイアウォール設定

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow from 192.168.0.0/16 to any port 3000
sudo ufw deny 3000
sudo ufw status
```

### 5. systemd で自動起動（Docker不使用の場合）

```bash
sudo tee /etc/systemd/system/recept-planner.service << 'EOF'
[Unit]
Description=Recept Planner
After=network.target docker.service

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

sudo systemctl enable recept-planner
sudo systemctl start recept-planner
sudo systemctl status recept-planner
```

### 6. 動作確認

ブラウザで `http://<サーバーIP>:3000` にアクセス。

### アーキテクチャ図

```
[スマホ/PC ブラウザ]
        │
        │ HTTP (port 3000)
        ▼
┌─── Proxmox VM (Ubuntu 24.04) ───┐
│                                   │
│   [Next.js App]  ←→  [PostgreSQL] │
│        │                          │
│        │ HTTPS                    │
│        ▼                          │
│   [Gemini API]                    │
│   (Vision model)                  │
└───────────────────────────────────┘
```

## サーバーの更新（コード変更を反映する）

`git pull` だけではDBスキーマもビルド済みJSも更新されません。以下のセットで行ってください。

### Docker Compose を使っている場合

```bash
cd /opt/Recept-Planner

# 1. 最新コードを取得
git pull

# 2. 新しいマイグレーションがあれば適用（既存データは保持されます）
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 3. コード変更を反映するためイメージを再ビルド＆再起動
docker compose -f docker-compose.prod.yml up -d --build
```

### Node.js 直接起動の場合

```bash
cd /opt/Recept-Planner
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
sudo systemctl restart recept-planner
```

`prisma/schema.prisma` に変更が無いプルであれば `migrate deploy` はスキップ可能ですが、実行しても既存マイグレーションが無ければ何もしないので基本的に毎回実行して問題ありません。

## 環境変数

`.env.example` をコピーして使用します。

```env
# PostgreSQL
DATABASE_URL="postgresql://recept:YOUR_SECURE_PASSWORD@localhost:5432/recept_planner"

# Gemini API（初回起動後、設定画面からも保存できます）
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash-lite"
# 通常は変更不要。プロキシや互換ゲートウェイを使う場合のみ設定
# GEMINI_API_BASE_URL="https://generativelanguage.googleapis.com/v1beta"

# レシート画像保存先（public外のディレクトリ）
RECEIPT_STORAGE_PATH="./data/receipts"

# Geminiへ送る前の画像縮小設定（コストを抑えたい場合は 768 などに下げる）
RECEIPT_IMAGE_MAX_DIMENSION="1024"
RECEIPT_IMAGE_JPEG_QUALITY="80"
```

Docker Compose本番構成では `POSTGRES_PASSWORD` を環境変数としてエクスポートして使用します（`docker-compose.prod.yml` 参照）。

## AIモデル設定

`/settings` 画面でAIプロバイダを Gemini API / LM Studio（ローカルLLM）から選択できます。レシート読み取り・家計アシスタント・AIアドバイスは、選択中のプロバイダをすべて共通で使用します。

### Gemini API

| モデル | 用途 | コスト感 |
|--------|------|----------|
| `gemini-2.5-flash-lite` | レシート読み取りの初期値 | 低コスト |
| `gemini-2.5-flash` | 精度と速度のバランス重視 | 中 |
| `gemini-2.5-pro` | 読み取り精度を優先する場合 | 高 |

写真取り込みはアップロード画像をサーバー側で最大1024pxに縮小してからAIへ送るため、元画像をそのまま投げるより入力トークンを抑えます。コストをさらに抑える場合は `GEMINI_MODEL=gemini-2.5-flash-lite` のまま使い、`RECEIPT_IMAGE_MAX_DIMENSION=768` などに下げてください。

### LM Studio（ローカルLLM）

[LM Studio](https://lmstudio.ai/) でモデル（例: Gemma 4 E4B）をダウンロードし、「Developer」タブでローカルサーバーを起動してから使用します。LM Studioはローカル開発マシン上でのみ動作するため、本番（Docker）デプロイからの利用は想定していません。

- `LMSTUDIO_BASE_URL`: LM Studioのローカルサーバー URL（既定値 `http://localhost:1234/v1`）
- `LMSTUDIO_MODEL`: LM Studioに読み込んだモデルの識別子（LM Studio画面に表示される名前。例: `google/gemma-4-e4b`）

LM Studioが起動していない状態でAIリクエストを送ると、接続エラーである旨のメッセージを返します。

### 共通設定

AIプロバイダ、Gemini APIキー・モデル・API URL、LM StudioのURL・モデル、画像縮小設定はアプリの `/settings` 画面から保存できます。保存先はPostgreSQLの `app_settings` テーブルです。環境変数は初期値・フォールバックとしてのみ使います。

会話履歴は `assistant_messages`、保存済みアドバイスは `financial_advice` に月別で保存されます。チャットからDBを変更できる操作はアプリ側で許可したものだけに制限しており、現在は支出/収入の追加に対応しています。

## データモデル

主なテーブル（`prisma/schema.prisma`）:

| テーブル | 役割 |
|---------|------|
| `categories` | 支出/収入カテゴリ |
| `transactions` | 支出・収入の取引。`direct_to_balance` フラグでバッファーを介さない収入を区別 |
| `receipts` | アップロードされたレシート画像とAI読み取り結果 |
| `monthly_plans` | 月ごとの手取り月収・額面月収・貯金目標などの設定（YYYY-MM単位） |
| `savings_goals` | 貯金目標（複数管理可） |
| `subscriptions` | サブスクリプション定義と次回請求日 |
| `app_settings` | AIプロバイダ設定（Gemini/LM Studio）などのアプリ内設定（key-value） |
| `assistant_messages` | AIアシスタントの会話履歴 |
| `financial_advice` | 月別に保存されたAIアドバイス |

スキーマ変更時は `prisma/migrations/` にマイグレーションが追加されるので、デプロイ時は必ず `prisma migrate deploy` を実行してください。

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

レシート画像は `RECEIPT_STORAGE_PATH`（Docker利用時はボリューム `receipt_data`）に保存されるため、DBバックアップとあわせて画像ディレクトリ/ボリュームもバックアップしてください。

## npm scripts

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint実行 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:migrate` | マイグレーション実行（開発用: `prisma migrate dev`） |
| `npm run db:reset` | DBリセット（`prisma migrate reset`、全データ削除に注意） |
