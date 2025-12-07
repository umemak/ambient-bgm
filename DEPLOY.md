# Cloudflare Workers デプロイガイド

このガイドでは、Ambient BGMアプリをCloudflare Workersにデプロイする方法を説明します。

## 📋 前提条件

- Cloudflareアカウント（無料プランでOK）
- Node.js 20.x以上がインストールされていること
- 音楽生成APIキー（ElevenLabsまたはReplicate、または両方）

## 🚀 デプロイ方法

### 方法1: Cloudflare Dashboard（推奨・最も簡単）

#### ステップ1: プロジェクトのビルド

```bash
# リポジトリをクローン（まだの場合）
git clone https://github.com/umemak/ambient-bgm.git
cd ambient-bgm

# 依存関係のインストール
npm install

# プロジェクトのビルド
npm run build
```

#### ステップ2: Cloudflare Dashboardでの設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. **Workers & Pages** を選択
3. **Create Application** > **Create Worker** をクリック
4. Worker名を入力（例: `ambient-bgm`）
5. **Deploy** をクリック

#### ステップ3: 環境変数とシークレットの設定

1. デプロイしたWorkerを選択
2. **Settings** > **Variables and Secrets** に移動
3. 以下の環境変数を追加：

##### 必須の環境変数

| 変数名 | 値 | タイプ |
|--------|-----|--------|
| `SESSION_SECRET` | ランダムな文字列（32文字以上推奨） | Secret |
| `ENVIRONMENT` | `production` | Variable |

##### 音楽生成API（少なくとも1つ必要）

| 変数名 | 値 | タイプ | 説明 |
|--------|-----|--------|------|
| `ELEVENLABS_API_KEY` | ElevenLabs APIキー | Secret | 最大5分（300秒）の音楽生成 |
| `REPLICATE_API_TOKEN` | Replicate APIトークン | Secret | Meta MusicGenで最大190秒の音楽生成 |

**設定例:**

```
ELEVENLABS_API_KEY = sk_xxxxxxxxxxxxxxxxxxxxx (Secret)
REPLICATE_API_TOKEN = r8_xxxxxxxxxxxxxxxxxxxxx (Secret)
SESSION_SECRET = your-random-secret-string-here (Secret)
ENVIRONMENT = production (Variable)
```

#### ステップ4: D1データベースの作成

```bash
# Cloudflareにログイン
npx wrangler login

# D1データベースを作成
npx wrangler d1 create ambient-bgm-db

# 表示されたdatabase_idをコピーして、wrangler.tomlに設定
```

`wrangler.toml`の該当箇所を更新：

```toml
[[d1_databases]]
binding = "DB"
database_name = "ambient-bgm-db"
database_id = "YOUR_DATABASE_ID"  # ここに実際のIDを入力
```

#### ステップ5: データベーススキーマの適用

```bash
# スキーマをD1データベースに適用
npx wrangler d1 execute ambient-bgm-db --remote --file=./worker/schema.sql
```

#### ステップ6: R2バケットの作成

```bash
# R2バケットを作成
npx wrangler r2 bucket create ambient-bgm-music
```

#### ステップ7: Workers AI バインディング

Workers AIは自動的に有効化されます。追加の設定は不要です。

#### ステップ8: デプロイ

```bash
# ビルドとデプロイを実行
npm run build
npx wrangler deploy
```

---

### 方法2: GitHub Actionsによる自動デプロイ

#### ステップ1: GitHub Secretsの設定

GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** で以下のシークレットを追加：

| シークレット名 | 説明 |
|--------------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン（[作成方法](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)） |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareアカウントID（DashboardのURLから取得） |
| `SESSION_SECRET` | セッション用のランダムな文字列 |
| `ELEVENLABS_API_KEY` | ElevenLabs APIキー（使用する場合） |
| `REPLICATE_API_TOKEN` | Replicate APIトークン（使用する場合） |

#### ステップ2: ワークフローファイルの確認

`.github/workflows/deploy.yml`が既に設定されています。

#### ステップ3: デプロイ

`main`ブランチにプッシュすると、自動的にデプロイされます：

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

---

## 🔧 トラブルシューティング

### エラー: "Missing entry-point to Worker script"

**解決方法:**
`wrangler.toml`に以下を追加：

```toml
main = "dist/index.cjs"
```

### エラー: "CLOUDFLARE_API_TOKEN environment variable not found"

**解決方法:**
Cloudflare APIトークンを作成して設定：

```bash
# オプション1: 環境変数として設定
export CLOUDFLARE_API_TOKEN=your_token_here

# オプション2: wranglerにログイン
npx wrangler login
```

### 音楽が生成されない

**原因:**
- APIキーが未設定、または無効
- APIクレジットが不足

**確認方法:**
1. Cloudflare Dashboard > Workers > ambient-bgm > Settings > Variables
2. `ELEVENLABS_API_KEY`または`REPLICATE_API_TOKEN`が正しく設定されているか確認
3. ElevenLabs/Replicateのダッシュボードでクレジット残高を確認

### データベースエラー

**解決方法:**
データベーススキーマを再適用：

```bash
npx wrangler d1 execute ambient-bgm-db --remote --file=./worker/schema.sql
```

---

## 📊 リソース制限（無料プラン）

| リソース | 制限 | 備考 |
|---------|-----|------|
| Workers リクエスト | 100,000/日 | 超過分は有料 |
| D1 ストレージ | 5GB | 十分な容量 |
| D1 読み取り | 500万行/日 | |
| D1 書き込み | 10万行/日 | |
| R2 ストレージ | 10GB | 音楽ファイル保存用 |
| R2 クラスA操作 | 100万/月 | アップロード操作 |
| R2 クラスB操作 | 1000万/月 | ダウンロード操作 |
| Workers AI | 10,000リクエスト/日 | BGM説明文生成用 |

---

## 🔐 セキュリティのベストプラクティス

1. **SESSION_SECRETは必ずランダムな文字列を使用**
   ```bash
   # ランダムな文字列を生成（Mac/Linux）
   openssl rand -base64 32
   ```

2. **本番環境ではデフォルトのテストアカウントを変更**
   - デフォルト: `testuser` / `testpassword0`
   - D1データベースで直接変更するか、新規ユーザー作成機能を実装

3. **APIキーは必ずSecretとして保存**
   - Variableではなく**Secret**タイプで保存
   - コミットやログに含まれないようにする

4. **定期的なAPIキーのローテーション**
   - 3ヶ月ごとにAPIキーを更新することを推奨

---

## 🌐 カスタムドメインの設定（オプション）

1. Cloudflare Dashboard > Workers > ambient-bgm > Triggers
2. **Add Custom Domain** をクリック
3. 所有しているドメインを入力（例: `music.yourdomain.com`）
4. DNSレコードが自動的に設定されます

---

## 📈 デプロイ後の確認

1. **動作確認**
   ```
   https://ambient-bgm.YOUR_SUBDOMAIN.workers.dev
   ```

2. **ログの確認**
   ```bash
   npx wrangler tail
   ```

3. **メトリクスの確認**
   - Cloudflare Dashboard > Workers > ambient-bgm > Metrics

---

## 🔄 更新とデプロイ

コードを更新してデプロイ：

```bash
# 最新のコードを取得
git pull origin main

# ビルド
npm run build

# デプロイ
npx wrangler deploy
```

---

## 📞 サポート

問題が発生した場合：

1. [GitHub Issues](https://github.com/umemak/ambient-bgm/issues)で既存の問題を検索
2. 新しいIssueを作成（エラーログを含める）
3. [Cloudflareコミュニティ](https://community.cloudflare.com/)で質問

---

**Happy Deploying! 🚀**
