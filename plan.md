# Recept-Planner マルチユーザー化 最終計画（2026-04-02）

## 1. 目的と前提

本計画は、既存の単一ユーザー前提アプリを**招待制マルチユーザー運用**へ移行するための確定版である。  
実装対象は認証・認可・データ分離・管理UI・運用手順までを含む。

---

## 2. 確定要件

| 項目 | 決定 |
|---|---|
| 登録方式 | 招待制（管理者のみユーザー作成） |
| ロール | `admin` / `member` + 管理パネル |
| 認証 | Google OAuth + Credentials（LAN fallback） |
| セッション | JWT |
| カテゴリ | ユーザー個別。新規ユーザーにデフォルトカテゴリをコピー |
| データ移行 | 既存データを初期 `admin` に紐付け |

---

## 3. 実装スコープ

### 3.1 対象

- Prisma スキーマ拡張（`User` 系 + 全業務データの `userId`）
- Auth.js（NextAuth v5）導入、Google/Credentials 併用
- 既存 API 全体のユーザースコープ化
- 管理パネル（ユーザー CRUD + 論理削除）
- ログイン UI とナビゲーション更新
- Google OAuth セットアップ手順と運用ドキュメント更新

### 3.2 非対象（この計画では実施しない）

- 自己登録（オープンサインアップ）
- 外部 IdP の追加（Microsoft, GitHub 等）
- マルチテナント（組織/ワークスペース階層）

---

## 4. 影響規模（見積）

- 新規: 14ファイル
- 変更: 18ファイル
- 実装フェーズ: 5フェーズ（Phase 1〜5）

---

## 5. フェーズ計画（確定）

## Phase 1: DB + Auth基盤（Steps 1.1-1.9）

### Step 1.1 依存関係追加

- `next-auth@5`（Auth.js）
- `bcryptjs`（Credentials 検証用）

### Step 1.2 Prisma スキーマ拡張

- `User` / `Account` / `Session` / `VerificationToken` を追加
- 既存ドメインモデル（`Category`, `Transaction`, `Receipt`, `MonthlyPlan`, `SavingsGoal`）へ `userId` を追加
- `Category` の一意制約を `@@unique([name, userId])` に変更

### Step 1.3 初期管理者向け移行設計

- 初期 `admin` ユーザー作成（環境変数でメール指定）
- 既存データを初期 `admin` に一括紐付け

### Step 1.4 マイグレーション作成

- スキーマ変更 SQL
- データ移行 SQL（既存データ更新）
- ロールバック方針（失敗時は DB バックアップから復元）

### Step 1.5 Auth.js 設定（`src/auth.ts` 系）

- Providers: Google + Credentials
- Session strategy: JWT
- JWT/Session コールバックに `user.id`, `user.role`, `user.isActive` を載せる

### Step 1.6 招待制制御（`signIn` コールバック）

- DB に存在しないユーザーはサインイン拒否
- `isActive = false` ユーザーは拒否
- Google 初回ログインでも自己登録を許可しない

### Step 1.7 ルート保護

- Next.js 16 仕様に合わせた `proxy.ts` 実装
- 除外ルート: `/login`, `/api/auth/*`, 静的アセット

### Step 1.8 認可ヘルパー

- `requireAuth()`（未認証時は 401/redirect）
- `requireAdmin()`（権限不足時 403）

### Step 1.9 Phase 1 完了条件

- 認証が動作し、未認証アクセスが保護される
- 既存データが初期 `admin` に割り当て済み

---

## Phase 2: 全API移行（Steps 2.1-2.8）

### Step 2.1 対象 API の棚卸し

- 既存 12 ルートを全件対象化
- 参照・更新・削除すべてで `userId` 条件を強制

### Step 2.2 トランザクション API

- 一覧: ログインユーザーのデータのみ
- 更新/削除: 所有者一致必須（`id + userId` 条件）

### Step 2.3 カテゴリ API

- 全 CRUD をユーザースコープ化
- 同名カテゴリ衝突は同一ユーザー内のみ禁止（`@@unique([name, userId])`）

### Step 2.4 レシート関連 API

- アップロード/抽出/確定を所有者限定
- 他ユーザーの `receiptId` 指定を拒否

### Step 2.5 月次計画 API

- `yearMonth + userId` で取得/更新
- Upsert 時も `userId` を強制セット

### Step 2.6 ダッシュボード API

- 集計クエリ（総額・カテゴリ別・日次推移）をユーザー単位へ変更

### Step 2.7 Savings Goal / Tax Estimate API

- 複合集計・推定処理も `userId` 境界を貫徹

### Step 2.8 Phase 2 完了条件

- API 横断でデータ越境参照/更新が不可能
- 既存 UI からの主要操作が破綻しない

---

## Phase 3: 管理パネル（Steps 3.1-3.8）

### Step 3.1 管理 API 新設

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`（論理削除）

### Step 3.2 認可

- 管理 API は `requireAdmin()` 必須

### Step 3.3 ユーザー作成処理

- `password` は `bcryptjs` でハッシュ化
- 作成と同時にデフォルトカテゴリをコピー
- 一連の処理を Prisma `$transaction` で実行

### Step 3.4 ユーザー編集

- 表示名・ロール・有効/無効を更新可能

### Step 3.5 論理削除

- `isActive = false` で無効化
- データ物理削除は行わない

### Step 3.6 最後の管理者保護

- 最後の `admin` を `member` 化/無効化できない制約を実装

### Step 3.7 `/admin` 画面実装

- 一覧テーブル
- 作成/編集ダイアログ
- 有効/無効状態表示

### Step 3.8 Phase 3 完了条件

- 管理者のみユーザー管理可能
- 新規ユーザーがログイン後すぐカテゴリ利用可能

---

## Phase 4: ログインUI + ナビ更新（Steps 4.1-4.5）

### Step 4.1 ログインページ

- Google サインインボタン
- Credentials（メール/パスワード）フォーム
- 失敗理由（未招待・無効ユーザー）を日本語表示

### Step 4.2 Provider 統合

- ルートレイアウトを `SessionProvider` でラップ

### Step 4.3 サイドバー更新

- ログイン中ユーザー名表示
- ログアウト導線追加
- `admin` のみ管理ページリンク表示

### Step 4.4 ボトムナビ更新

- モバイル導線でも同等のログアウト/管理導線を担保

### Step 4.5 Phase 4 完了条件

- ログイン〜利用〜ログアウトの導線が UI 上で完結

---

## Phase 5: OAuthガイド + 最終調整（Steps 5.1-5.4）

### Step 5.1 Google Cloud Console 手順書

- OAuth 同意画面設定
- 認証情報（Client ID/Secret）作成
- リダイレクト URI 設定
- 日本語運用ドキュメント化

### Step 5.2 環境変数整理

- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- 初期管理者情報（メール等）

### Step 5.3 Docker Compose / README 更新

- 起動前チェックリスト
- 初回管理者作成フロー
- LAN fallback（Credentials）の運用指針

### Step 5.4 Phase 5 完了条件

- 新規環境でドキュメントのみで認証セットアップ可能

---

## 6. データ移行計画（必須）

1. 事前バックアップ: `pg_dump` を必須化  
2. マイグレーションを `--create-only` で生成し SQL を精査  
3. 初期 `admin` を作成  
4. 既存行に `userId` を一括付与  
5. `NOT NULL` 制約と FK 制約を有効化  
6. 検証クエリで orphan データがないことを確認

---

## 7. 主なリスクと対策

| リスク | 対策 |
|---|---|
| データ移行失敗 | `pg_dump` バックアップ必須。`--create-only` で SQL 精査後に適用 |
| `proxy.ts` 設定ミス | `/login`, `/api/auth/*` を明示除外。プライベートブラウザで遷移検証 |
| Auth.js + Next.js 16 互換性 | `node_modules/next/dist/docs/` の該当ドキュメントを実装前に確認 |

---

## 8. 受け入れ基準（Go/No-Go）

1. 未認証時に保護ルートへアクセスできない  
2. `member` は管理 API/管理画面へアクセスできない  
3. 全 API で他ユーザーのデータを参照/更新/削除できない  
4. 新規作成ユーザーにデフォルトカテゴリが複製される  
5. 最後の `admin` は降格/無効化できない  
6. 既存データが初期 `admin` に正しく移行される

---

## 9. 実装順序（推奨）

1. Phase 1（DB + Auth 基盤）
2. Phase 2（API 全移行）
3. Phase 3（管理パネル）
4. Phase 4（ログイン UI・ナビ）
5. Phase 5（ドキュメント・運用）

本計画を「マルチユーザー化の実装基準版（v1.0）」とし、実装中に仕様変更が発生した場合はフェーズ単位で改訂履歴を残す。