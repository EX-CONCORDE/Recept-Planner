# Google OAuth セットアップ手順

Google OAuth を設定すると、Google アカウントでログインできるようになります。  
**設定しない場合は Credentials 認証（メール+パスワード）のみで動作します。**

## 前提条件

- Google アカウント
- サーバーからインターネットへのアクセス（OAuth トークン交換に必要）

## 手順

### 1. Google Cloud Console でプロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部の「プロジェクトを選択」→「新しいプロジェクト」
3. プロジェクト名: `recept-planner`（任意）
4. 「作成」

### 2. OAuth 同意画面の設定

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. User Type: **外部** を選択して「作成」
3. 以下を入力:
   - アプリ名: `レシートプランナー`
   - ユーザーサポートメール: 自分のメール
   - デベロッパーの連絡先: 自分のメール
4. 「保存して次へ」
5. スコープ: 「スコープを追加または削除」→ `email`, `profile`, `openid` を選択 → 「更新」→「保存して次へ」
6. テストユーザー: 利用予定の Google アカウントを追加 → 「保存して次へ」

### 3. OAuth クライアント ID の作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 名前: `レシートプランナー`
5. **承認済みのリダイレクト URI** に以下を追加:
   - 開発環境: `http://localhost:3000/api/auth/callback/google`
   - 本番環境: `http://<サーバーIP>:3000/api/auth/callback/google`
   - ドメイン使用時: `https://<ドメイン>/api/auth/callback/google`
6. 「作成」

### 4. 環境変数の設定

作成後に表示される「クライアントID」と「クライアントシークレット」を `.env` に設定:

```bash
AUTH_GOOGLE_ID="xxxxxxxxxxxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxxxxxxxxxxxxx"
```

### 5. アプリを再起動

```bash
# 開発環境
npm run dev

# 本番環境 (Docker)
docker compose restart app
```

## LAN 環境での注意点

- サーバーからインターネットへの HTTP/HTTPS 接続が必要（Google の OAuth エンドポイントと通信するため）
- クライアント（ブラウザ）側はLAN内のIPアドレスでアクセス可能
- リダイレクト URI に LAN の IP アドレス（例: `http://192.168.1.100:3000/...`）を登録すること
- Google は HTTP のリダイレクト URI を localhost と RFC 1918 プライベートアドレスで許可する

## テストモードと本番公開

- 初期状態は「テストモード」: テストユーザーに追加した Google アカウントのみログイン可能
- 家族など少人数で使う場合はテストモードのままで十分
- 多人数に公開する場合は Google の審査を受けて「本番公開」にする必要がある

## トラブルシューティング

### 「redirect_uri_mismatch」エラー
→ Google Cloud Console の「承認済みのリダイレクト URI」が実際のコールバックURLと完全一致しているか確認

### 「access_denied」エラー
→ テストモードの場合、ログインしようとしている Google アカウントが「テストユーザー」に追加されているか確認

### OAuth ボタンが表示されない
→ `AUTH_GOOGLE_ID` 環境変数が設定されているか確認。未設定の場合は Credentials のみ表示される
