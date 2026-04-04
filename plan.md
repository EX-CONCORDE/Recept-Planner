# Recept-Planner 実装計画（全面改訂 v2.0）

最終更新: 2026-04-04

## 1. 目的

レシート・請求情報の登録を簡単にし、月次の家計状況を可視化する。  
さらに、定額サブスクリプションを管理し、請求日に自動で支出トランザクションを生成して記録漏れを防ぐ。

## 2. 前提・方針

- 対象: 個人利用（認証なし）
- UI言語: 日本語のみ
- 技術: Next.js App Router + TypeScript + Prisma + PostgreSQL + Zod
- OCR/抽出: LMStudio連携（既存機能）
- 追加方針: 既存データモデルとUIを壊さず、段階的にサブスク機能を拡張

## 3. スコープ

### 3.1 Must

1. サブスクの登録・編集・停止/再開
2. 月額/年額の請求サイクル管理
3. 請求日到来時の自動トランザクション生成
4. 二重引き落とし防止（冪等）
5. ダッシュボードへのサブスク集計統合
6. プリセットからのクイック追加

### 3.2 Should

1. プリセット検索（サービス名・カテゴリ）
2. サブスク一覧のアクティブ/停止タブ
3. 次回請求日の近い順表示

### 3.3 Out（今回やらない）

- 外部決済サービス連携
- 銀行明細との自動照合
- 通知配信（メール/Push）

## 4. サブスク仕様

### 4.1 管理対象

- 名称
- 金額（円、整数）
- 請求周期（monthly / yearly）
- カテゴリ
- 次回請求日
- 有効/停止フラグ
- プリセットキー（任意）
- アイコン/色（任意）
- メモ（任意）

### 4.2 プリセット（日本円・税込目安）

- 動画: Netflix, Amazon Prime, Disney+, Hulu, U-NEXT, DAZN, ABEMAプレミアム, dアニメストア
- 音楽: Spotify, Apple Music, YouTube Premium, LINE MUSIC
- クラウド: iCloud+, Google One, Microsoft 365, Dropbox Plus
- ゲーム: Nintendo Switch Online, PS Plus, Xbox Game Pass
- AI・開発: ChatGPT Plus, Claude Pro, GitHub Copilot, Adobe CC, Notion, 1Password
- 生活: NHK受信料（地上/衛星）

注記: プリセット金額は初期入力値。保存時はユーザーの最終入力を優先する。

## 5. データモデル計画

### 5.1 subscriptions（新規）

- id
- name
- amount
- billingCycle
- categoryId
- nextBillingDate
- isActive
- presetKey（nullable）
- icon（nullable）
- color（nullable）
- memo（nullable）
- createdAt
- updatedAt

### 5.2 transactions（拡張）

- subscriptionId（nullable FK）
- billingKey（nullable, 自動生成キー）
- source の許容値へ `subscription` を追加

### 5.3 制約・インデックス

- `billingKey` をユニーク制約
- `subscriptionId` にインデックス
- `nextBillingDate` にインデックス（subscriptions）

## 6. 自動引き落としアルゴリズム

1. 対象抽出: `isActive = true AND nextBillingDate <= today`
2. 各サブスクごとに `billingKey = subscriptionId:YYYY-MM-DD` を計算
3. トランザクションを作成（`source=subscription`）
4. ユニーク制約違反時は「既処理」としてスキップ
5. 作成成功時のみ `nextBillingDate` を更新
   - monthly: +1 month
   - yearly: +1 year

補足:

- 全件を1トランザクションにせず、1サブスク1トランザクションで処理して失敗影響を局所化する。
- APIは冪等を前提に、同日複数回実行されても結果が増えないようにする。

## 7. API計画

### 7.1 追加エンドポイント

- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `GET /api/subscriptions/[id]`
- `PATCH /api/subscriptions/[id]`
- `DELETE /api/subscriptions/[id]`（論理停止を優先）
- `GET /api/subscriptions/presets`
- `POST /api/subscriptions/process`

### 7.2 process レスポンス

- processedCount
- skippedCount
- updatedSubscriptionCount
- errors

### 7.3 ダッシュボード拡張

- `GET /api/dashboard/[yearMonth]` の返却へ以下を追加
  - monthlySubscriptionTotal
  - upcomingSubscriptions

## 8. バリデーション・共通定数

- `src/lib/validations/subscription.ts` を追加
- `src/lib/subscription-presets.ts` を追加
- 金額は `0 < amount <= 10,000,000` の範囲で検証
- 請求日・周期・カテゴリIDの整合性を検証

## 9. UI/画面計画

### 9.1 新規ページ

- `/subscriptions` ページ
  - アクティブ/停止タブ
  - 一覧表示（名称、金額、周期、次回請求日）
  - 停止/再開アクション

### 9.2 登録導線

- プリセット選択（カテゴリ別グリッド + 検索）
- 追加/編集フォーム（名称、金額、周期、カテゴリ、次回請求日、メモ）

### 9.3 既存画面への統合

- ダッシュボードにサブスク合計カード
- サイドバー/ボトムナビに `subscriptions` リンク

## 10. 実装フェーズ

### Phase 1: DB・スキーマ・バリデーション

- Prisma: `Subscription` モデル追加
- Prisma: `Transaction` に `subscriptionId` / `billingKey` 追加
- マイグレーション作成・適用
- Zodとプリセット定義追加

完了条件:

- DBマイグレーションが適用でき、基本CRUD入力をバリデーションできる

### Phase 2: API実装

- `/api/subscriptions` 系CRUD
- `/api/subscriptions/presets`
- `/api/subscriptions/process`（冪等）

完了条件:

- 手動実行で到来分のみ生成、重複が発生しない

### Phase 3: ダッシュボード統合

- ダッシュボード取得時に未処理分を軽量処理
- サブスク合計・近日請求を返却
- サマリーカード表示

完了条件:

- ダッシュボードでサブスク金額が月次集計に反映される

### Phase 4: 管理UI

- `/subscriptions` 一覧
- プリセット選択UI
- 追加/編集ダイアログ
- 停止/再開操作

完了条件:

- 非エンジニア操作で登録〜停止まで完結できる

### Phase 5: テスト・仕上げ

- ユニット: 請求日更新ロジック、billingKey生成、バリデーション
- API: process冪等性、停止中除外、年額更新
- E2E: プリセット追加 → process → ダッシュボード反映

完了条件:

- 主要導線の回帰テストを通過

## 11. 受け入れ基準

1. サブスク作成後、`nextBillingDate` 到来日に1回だけ自動生成される
2. 同日に `process` を複数回呼んでも重複しない
3. 年額サブスクは次回請求日が1年進む
4. 停止中サブスクは処理対象外
5. ダッシュボードで月次サブスク合計を確認できる
6. プリセットから3操作以内で新規登録できる

## 12. リスクと対策

- 高: 二重引き落とし
  - 対策: `billingKey` ユニーク制約 + API冪等実装
- 中: ダッシュボード表示遅延
  - 対策: process処理件数上限、短タイムアウト、失敗時は集計を継続
- 中: プリセット価格の陳腐化
  - 対策: 「目安」表示を明示し、編集可能前提で運用

## 13. マイルストーン（目安）

- W1: Phase 1 完了
- W2: Phase 2 完了
- W3: Phase 3〜4 完了
- W4: Phase 5 完了・リリース判定

## 14. リリース判定

- 受け入れ基準を満たす
- 重大バグ（重複生成・請求日不整合）が0件
- ダッシュボード応答性能が既存比で許容範囲内

---

本計画は v2.0 の基準版とする。実装進捗と運用実測に応じて、Phase 3 完了時に v2.1 へ更新する。