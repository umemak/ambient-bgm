# Cloudflare Workers デプロイガイド

## 前提条件

1. Cloudflareアカウント
2. Wrangler CLIがインストール済み（このプロジェクトに含まれています）

## デプロイ手順

### 1. Cloudflareにログイン

```bash
npx wrangler login
```

ブラウザが開いてCloudflareアカウントで認証します。

### 2. D1データベースの作成

```bash
npx wrangler d1 create ambient-bgm-db
```

出力されるデータベースIDをコピーして、`wrangler.toml`の`database_id`を更新：

```toml
[[d1_databases]]
binding = "DB"
database_name = "ambient-bgm-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 3. データベーススキーマの適用

```bash
npx wrangler d1 execute ambient-bgm-db --file=./worker/schema.sql
```

### 4. シークレットの設定

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ELEVENLABS_API_KEY  # オプション
```

### 5. フロントエンドのビルド

```bash
npm run build
```

### 6. デプロイ

```bash
npx wrangler deploy worker/index.ts --assets dist/public
```

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー | はい |
| `SESSION_SECRET` | セッション暗号化用シークレット | はい |
| `ELEVENLABS_API_KEY` | ElevenLabs APIキー（音声生成用） | いいえ |

## ローカル開発

ローカルでCloudflare Workersをテストするには：

```bash
npx wrangler dev worker/index.ts --local
```

## 注意事項

- Cloudflare Workers Free Tierには制限があります（1日10万リクエスト）
- D1はベータ版で、本番環境での使用には注意が必要です
- ElevenLabs音声生成はオプションで、APIキーがない場合はスキップされます

## Replit版との違い

### 認証
- **Replit版**: Replit Auth（Google/GitHub/Appleログイン）
- **Cloudflare版**: デモログインのみ（本番運用には別途OAuth設定が必要）

本番環境で認証が必要な場合は以下を検討してください：
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [Auth0](https://auth0.com/) + Cloudflare Workers統合
- カスタムOAuth実装

### 音声ファイル保存
- **Replit版**: サーバーのファイルシステムに保存
- **Cloudflare版**: Base64データURLとしてデータベースに保存

大きな音声ファイルを保存する場合は、[Cloudflare R2](https://developers.cloudflare.com/r2/)の使用を推奨します。

### データベース
- **Replit版**: PostgreSQL + Drizzle ORM
- **Cloudflare版**: D1 (SQLite)

## トラブルシューティング

### データベース接続エラー

D1データベースが作成されていることを確認：
```bash
npx wrangler d1 list
```

### 認証エラー

Wranglerにログインしていることを確認：
```bash
npx wrangler whoami
```

### ビルドエラー

node_modulesを再インストール：
```bash
rm -rf node_modules
npm install
```
