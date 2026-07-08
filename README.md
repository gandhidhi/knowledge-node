# ゼミ発表アーカイブ (knowledge-node)

大学のゼミにおいて、学生が発表した研究進捗と先生からの指摘（コメント/議事録）を蓄積・検索・閲覧できるアーカイブ Web アプリケーション。

仕様は [.kiro/specs/seminar-archive/](.kiro/specs/seminar-archive/) を参照。

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド / API | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| DB / 認証 / ストレージ | Supabase (PostgreSQL, Auth, Storage) |
| デプロイ | Vercel + Supabase |

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Supabase プロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) で新規プロジェクトを作成
2. マイグレーションを適用:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`supabase/migrations/` には以下が含まれる:

| ファイル | 内容 |
|----------|------|
| `..._initial_schema.sql` | 全テーブル・インデックス・updated_at トリガー |
| `..._rls_policies.sql` | RLS ポリシー（閲覧: 認証済み全員 / 書き込み: admin のみ） |
| `..._auth_trigger.sql` | サインアップ時の許可メール照合 + profiles 自動作成 |
| `..._storage.sql` | `materials` バケット（private, 50MB 上限）と Storage RLS |

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、Supabase Dashboard > Project Settings > API Keys の値を設定する:

```bash
cp .env.example .env.local
```

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`)。クライアント公開可 |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`)。RLS をバイパスするサーバー専用キー・公開厳禁 |

> 旧仕様の anon / service_role キー（JWT 形式）ではなく、新 API キー（`sb_publishable_` / `sb_secret_` プレフィックス）を使用する。

### 4. 初期データの投入

サインアップは許可メールアドレスのホワイトリスト方式のため、最初のユーザーを登録する前に SQL Editor で自分のメールアドレスを許可する:

```sql
insert into allowed_emails (email) values ('you@example.ac.jp');
```

アプリからサインアップした後、管理者権限を付与する:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.ac.jp');
```

以降の許可メール追加・管理は管理画面（/admin/emails）から行える。

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 で起動する。

## デプロイ (Vercel)

1. リポジトリを Vercel にインポート
2. 環境変数（上記 3 つ）を Vercel プロジェクトに設定
3. デプロイ後、Supabase Dashboard > Authentication > URL Configuration で
   Site URL を本番 URL に設定する（確認メールのリダイレクト先に使われる）

## アーキテクチャ上の補足

- **資料アップロード**: Vercel Serverless Functions のリクエストボディ上限（4.5MB）を回避するため、
  ファイル本体はブラウザから Supabase Storage へ直接アップロードする（Storage RLS で admin のみ許可）。
  その後 `/api/admin/presentations/[id]/materials` にメタデータのみを登録する。
- **サインアップ制限**: DB トリガー（`auth.users` の BEFORE INSERT）で許可メールを強制する。
  ログイン画面では事前に `is_email_allowed()` RPC を呼び、わかりやすいエラーを表示する。
- **認可**: すべてのテーブルで RLS を有効化。管理系 API Route は `requireAdmin()` でロールを検証した上で
  Service Role クライアントを使用する。

## ディレクトリ構成

```
src/
├── app/
│   ├── (main)/            # 認証必須エリア（ヘッダー付きレイアウト）
│   │   ├── projects/      # プロジェクト一覧・発表一覧（フィルター）
│   │   ├── presentations/ # 発表詳細（コメント/議事録 + 資料）
│   │   └── admin/         # 管理画面（role=admin のみ）
│   ├── api/               # API Routes（閲覧系 + /api/admin 管理系）
│   ├── auth/              # メール確認・OAuth コールバック
│   └── login/             # ログイン / 新規登録
├── components/
│   ├── ui/                # shadcn/ui
│   ├── layout/            # ヘッダー・フィルター/資料サイドバー
│   ├── presentations/     # 発表カード・一覧・コメントビューア
│   └── admin/             # 管理画面用コンポーネント
├── lib/
│   ├── supabase/          # client / server / admin / middleware
│   ├── api/               # 認証ヘルパー・マッパー・Storage ユーティリティ
│   ├── types/             # DB 型定義・API レスポンス型
│   └── utils/             # フィルター・CSV パース・フォーマット
└── proxy.ts               # 認証プロキシ（旧 middleware）
supabase/
└── migrations/            # DB マイグレーション
```
