# Ambient BGM - Weather-Based Work Music App

天気と時間帯に合わせた、あなただけの作業用BGMを自動生成するWebアプリケーション。

🌐 **Live Demo**: [https://ambient-bgm.umemak.workers.dev](https://ambient-bgm.umemak.workers.dev)

![Ambient BGM](https://img.shields.io/badge/Status-Live-success)
![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange)
![React](https://img.shields.io/badge/Frontend-React-blue)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

## ✨ Features

### 🎵 AI音楽生成
- **Cloudflare AI**を使用したBGM説明文の自動生成
- **ElevenLabs Music API**による30秒の高品質音楽生成
- 天気や時間帯に応じた最適なムードの音楽

### 🌦️ 天気連動
- **wttr.in API**を使用した無制限の天気データ取得
- IPベースの自動位置検出（Cloudflare Headers利用）
- 手動での都市名入力にも対応
- 天気条件: 晴れ、曇り、雨、雪、嵐、霧、風、クリア

### 🎼 豊富なジャンル選択
#### Chill & Focus系
- Lo-Fi, Jazz, Classical, Ambient, Acoustic, Piano

#### Upbeat & Energetic系
- House, Techno, Drum & Bass, EDM, Funk, Disco, Rock, Indie

### 🔐 認証機能
- ユーザー名/パスワードによるログイン
- セッションベースの認証（Cookie使用）
- D1データベースでのセッション管理

### 💾 音楽管理
- **お気に入り機能**: 気に入ったBGMを保存
- **プレイリスト作成**: 独自のプレイリスト管理
- **履歴表示**: 生成したBGMの履歴を閲覧
- **Cloudflare R2**: 音楽ファイルの永続ストレージ

## 🛠️ Technology Stack

### Frontend
- **React** + **TypeScript** - UIフレームワーク
- **Tailwind CSS** - スタイリング
- **Vite** - ビルドツール
- **Wouter** - ルーティング
- **TanStack Query** - データフェッチング

### Backend
- **Cloudflare Workers** - サーバーレス実行環境
- **Hono** - 軽量Webフレームワーク
- **Cloudflare D1** - SQLiteベースのデータベース
- **Cloudflare R2** - オブジェクトストレージ
- **Cloudflare AI** - AI推論（Llama 3.1 8B）

### External APIs
- **wttr.in** - 天気情報API（無料、APIキー不要）
- **ElevenLabs Music API** - 音楽生成API

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x以上
- npm または yarn
- Cloudflareアカウント
- ElevenLabs APIキー（音楽生成用）

### Installation

1. **リポジトリのクローン**
```bash
git clone https://github.com/umemak/ambient-bgm.git
cd ambient-bgm
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
# Cloudflareにログイン
npx wrangler login

# D1データベースの作成
npx wrangler d1 create ambient-bgm-db

# R2バケットの作成
npx wrangler r2 bucket create ambient-bgm-music

# シークレットの設定
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ELEVENLABS_API_KEY
```

4. **wrangler.tomlの設定**

`wrangler.toml`ファイルを編集し、D1データベースIDとR2バケット名を設定します。

```toml
[[d1_databases]]
binding = "DB"
database_name = "ambient-bgm-db"
database_id = "YOUR_DATABASE_ID"

[[r2_buckets]]
binding = "MUSIC_BUCKET"
bucket_name = "ambient-bgm-music"

[ai]
binding = "AI"
```

5. **データベーススキーマの適用**
```bash
npx wrangler d1 execute ambient-bgm-db --remote --file=./worker/schema.sql
```

6. **ビルドとデプロイ**
```bash
npm run build
npx wrangler deploy worker/index.ts --assets dist/public
```

## 🧪 Development

### ローカル開発サーバーの起動
```bash
# フロントエンド開発サーバー
npm run dev

# Cloudflare Workers開発サーバー
npx wrangler dev worker/index.ts --assets dist/public
```

### テスト
```bash
# ユニットテスト
npm test

# E2Eテスト
npm run test:e2e
```

## 📁 Project Structure

```
ambient-bgm/
├── client/              # フロントエンドコード
│   └── src/
│       ├── components/  # Reactコンポーネント
│       ├── hooks/       # カスタムフック
│       ├── lib/         # ユーティリティ
│       └── pages/       # ページコンポーネント
├── worker/              # Cloudflare Workerコード
│   ├── index.ts         # メインWorkerエントリーポイント
│   └── schema.sql       # D1データベーススキーマ
├── shared/              # 共有型定義
│   └── schema.ts        # Zodスキーマとタイプ
└── dist/                # ビルド成果物
    └── public/          # 静的アセット
```

## 🔑 Authentication

デフォルトの認証情報（開発用）:
- ユーザー名: `testuser`
- パスワード: `testpassword0`

**本番環境では必ず変更してください。**

## 📊 Database Schema

### `users` テーブル
- ユーザー情報の管理

### `sessions` テーブル
- セッション情報の管理

### `bgms` テーブル
- 生成したBGMのメタデータ

### `playlists` & `playlist_items` テーブル
- プレイリストとその項目の管理

詳細は `worker/schema.sql` を参照してください。

## 🌍 Deployment

詳細なデプロイ手順については [DEPLOY-CLOUDFLARE.md](./DEPLOY-CLOUDFLARE.md) を参照してください。

### Cloudflare Workers
- **無料プラン**: 1日あたり10万リクエスト
- **D1データベース**: 無料プランで5GBまで
- **R2ストレージ**: 月10GBまで無料
- **Workers AI**: 無料プランで1日1万リクエスト

## 🎨 Design Guidelines

UIデザインの詳細については [design_guidelines.md](./design_guidelines.md) を参照してください。

主な特徴:
- **ガラスモーフィズム**: 透明感のあるUI
- **天気ベースの背景**: 動的な背景グラデーション
- **レスポンシブデザイン**: モバイル対応
- **アクセシビリティ**: キーボードナビゲーション、ARIA対応

## 📝 API Endpoints

### Authentication
- `GET /api/auth/user` - 現在のユーザー情報取得
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### Weather
- `GET /api/weather?city=Tokyo` - 都市名で天気取得
- `GET /api/weather?lat=35.6762&lon=139.6503` - 座標で天気取得

### BGM
- `POST /api/bgm/generate` - BGM説明文を生成
- `POST /api/bgm/:id/audio` - BGM音楽ファイルを生成
- `GET /api/bgm` - BGM履歴を取得
- `POST /api/bgm/:id/favorite` - お気に入りに追加
- `DELETE /api/bgm/:id` - BGMを削除

### Music Files
- `GET /api/music/:filename` - R2から音楽ファイルを取得

### Playlists
- `GET /api/playlists` - プレイリスト一覧取得
- `POST /api/playlists` - プレイリスト作成
- `POST /api/playlists/:id/items` - プレイリストにBGM追加
- `DELETE /api/playlists/:id/items/:bgmId` - プレイリストからBGM削除

## 🤝 Contributing

コントリビューションを歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Cloudflare](https://cloudflare.com) - ホスティングとインフラ
- [ElevenLabs](https://elevenlabs.io) - 音楽生成API
- [wttr.in](https://wttr.in) - 天気情報API
- [Lucide Icons](https://lucide.dev) - アイコン
- [shadcn/ui](https://ui.shadcn.com) - UIコンポーネント

## 📧 Contact

Project Link: [https://github.com/umemak/ambient-bgm](https://github.com/umemak/ambient-bgm)

---

Made with ❤️ for better work music experience
