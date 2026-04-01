# Recept-Planner 実装計画（改訂版）

## 1. 目的

レシート・請求メールのスクリーンショットをアップロードし、AIで金額/日付/内容を抽出して支出（または入出金）を整理する。  
さらに、毎月の収入と貯金目標を入力し、**今月あといくら使えるか**をバーとパーセンテージで可視化する個人用Webアプリを構築する。

## 2. 確定要件（現時点）

- 個人用（認証なし）
- UI言語は日本語のみ
- Web画面からカメラ起動・画像アップロード対応
- OCR/抽出はLMStudio（別VMで稼働中）へ連携
- DBはアプリサーバー内でセルフホスト
- カテゴリ分類は「AI自動分類 + ユーザーのカスタム分類」

## 3. スコープ

### 3.1 Must（MVP）

1. 画像アップロード（カメラ/ファイル）
2. LMStudio Vision連携による抽出（候補）
3. 抽出結果の確認・修正・保存
4. 支出/収入データの手動登録・編集・削除
5. 月次設定（収入、貯金目標）
6. 使える金額、使用率、残額の可視化（バー・%）
7. カテゴリ別の集計表示

### 3.2 Should（初期リリースで推奨）

1. AI分類失敗時の手動再分類UI
2. 月別履歴の参照
3. OCR失敗時のリトライ・エラー案内
4. CSVエクスポート

### 3.3 Out（今回は除外）

- 複数ユーザー対応
- クラウド認証基盤（Supabase Auth等）
- 銀行API自動連携

## 4. 技術方針（精査結果）

### 4.1 採用

- フロント/サーバー: Next.js 15（App Router, TypeScript）
- UI: Tailwind CSS + shadcn/ui
- DB: PostgreSQL（Docker Composeでセルフホスト）
- ORM: Prisma
- バリデーション: Zod
- グラフ: Recharts
- テスト: Vitest（単体）+ Playwright（E2E）

### 4.2 方針修正（重要）

- **Supabaseは不採用**（今回「認証なし・セルフホストDB」が前提のため）
- LMStudioは別VMのため、Next.js API Routeを中継して接続情報を秘匿する

## 5. 機能仕様

### 5.1 レシート/請求画像取り込み

- 入力: JPEG/PNG/HEIC（上限サイズ設定あり）
- 取得手段: スマホカメラ起動またはファイル選択
- 保存: サーバー上の非公開ディレクトリ
- 処理フロー:
  1) 画像アップロード
  2) サーバー側でLMStudioに送信
  3) JSON形式で抽出結果を受け取り
  4) UIで確認・修正
  5) 確定保存

### 5.2 抽出項目

- 取引日
- 店名/請求元
- 合計金額
- 税額（取得できる場合）
- 明細メモ（任意）
- 推定カテゴリ（AI）
- 収支種別（支出/収入/不明）

### 5.3 予算可視化

- 入力:
  - 月収
  - 貯金目標額（または目標率）
- 計算:
  - 使用可能額 = 月収 - 貯金目標
  - 残額 = 使用可能額 - 当月支出合計
  - 使用率 = 当月支出合計 / 使用可能額 × 100
- 表示:
  - 使用率バー
  - 残額表示
  - カテゴリ別比率（円グラフ）

## 6. データモデル（MVP）

### categories

- id
- name
- type（expense / income）
- is_default
- created_at

### transactions

- id
- tx_type（expense / income）
- amount
- tx_date
- category_id
- merchant_name
- memo
- receipt_id（nullable）
- source（manual / ai）
- created_at
- updated_at

### receipts

- id
- file_path
- ocr_raw_text
- ai_result_json
- status（uploaded / processed / confirmed / failed）
- created_at

### monthly_plans

- id
- year_month（YYYY-MM）
- monthly_income
- saving_target_amount
- saving_target_rate（nullable）
- created_at
- updated_at

## 7. API設計（MVP）

- POST /api/receipts/upload
- POST /api/receipts/:id/extract
- POST /api/receipts/:id/confirm
- GET /api/transactions
- POST /api/transactions
- PATCH /api/transactions/:id
- DELETE /api/transactions/:id
- GET /api/monthly-plans/:yearMonth
- PUT /api/monthly-plans/:yearMonth
- GET /api/dashboard/:yearMonth

※ すべてZodで入力検証し、異常系は統一エラーフォーマットで返却する。

## 8. セキュリティ設計（優先度高）

1. LAN内限定公開（UFW + リバースプロキシ制限）
2. LMStudio接続は内部ネットワーク優先、必要ならTLSトンネル
3. 画像はpublic配下に置かず、API経由でのみアクセス
4. 環境変数で機密情報管理（鍵・接続先）
5. DBは最小権限ユーザーで接続
6. Proxmoxホスト/VMディスク暗号化（LUKS）を推奨
7. 監査ログ（アップロード/削除/AI抽出失敗）を記録

## 9. LMStudioモデル選定指針

候補（Vision対応）:

- Gemma 3 12B（日本語バランス良）
- Qwen2.5-VL 7B（軽量）
- Qwen2.5-VL 32B（高精度・高VRAM）

選定基準:

1. 日本語OCR精度
2. 明細の構造化JSON出力安定性
3. 推論速度（体感待ち時間）
4. VRAM消費

## 10. 実装フェーズ

### Phase 1: 基盤構築（1週間）

- Next.js雛形作成
- DB/Prisma設定、初期マイグレーション
- transactions/categories/monthly_plans CRUD API
- ダッシュボード基本計算

**完了条件:** 手入力のみで月次管理が成立

### Phase 2: 画像アップロード + AI連携（1週間）

- 画像アップロードAPI
- LMStudio連携API（抽出・再試行）
- 抽出結果確認/編集UI
- receiptsとtransactionsの紐付け保存

**完了条件:** 画像から登録まで一連フローが動作

### Phase 3: 可視化/UX改善（3〜5日）

- バー/円グラフ最適化
- エラーメッセージ改善
- カスタムカテゴリUI
- 月切替と履歴表示

**完了条件:** 日常運用できるUI品質

### Phase 4: テスト/運用準備（3〜5日）

- 単体テスト（計算ロジック・バリデーション）
- E2E（登録→集計→表示）
- バックアップ手順・復旧手順の文書化
- Readme.mdの作成、おすすめLLMや設定などを明記

**完了条件:** 安定運用可能な最小テストを通過

## 11. 受け入れ基準（MVP）

1. 画像アップロード後、1分以内に抽出結果が表示される
2. 抽出結果を修正して保存できる
3. 月収/貯金目標設定で使用可能額・残額・使用率が即時更新される
4. 当月残額がマイナスの場合に警告表示される
5. 主要導線（登録・編集・削除・月次表示）がE2Eで成功する

## 12. リスクと対策

- OCR精度不足:
  - 対策: 抽出結果は必ず編集可能にする、モデル比較を実施
- LMStudio停止/遅延:
  - 対策: タイムアウト・再試行・手動入力へのフォールバック
- 認証なし運用の誤公開:
  - 対策: LAN制限とリバースプロキシで外部公開を遮断

## 13. 次の着手順（実装開始時）

1. Next.js + Tailwind + shadcnの初期化
2. Docker ComposeでPostgreSQL起動
3. Prismaスキーマ作成・マイグレーション
4. transactions / monthly_plans API実装
5. ダッシュボードUI（バー/％）の先行実装

---

この計画書は、実装開始前の基準版（v1）とする。  
実測したOCR精度・運用負荷に応じて、Phase 2完了時にv2へ改訂する。