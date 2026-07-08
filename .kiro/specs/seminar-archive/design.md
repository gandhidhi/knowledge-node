# 設計: ゼミ発表アーカイブWebアプリ

#[[file:requirements.md]]

## アーキテクチャ概要

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   Vercel    │       │  Next.js App     │       │    Supabase     │
│  (Hosting)  │──────▶│  (App Router)    │──────▶│  - PostgreSQL   │
│             │       │  - Pages         │       │  - Auth         │
│             │       │  - API Routes    │       │  - Storage      │
└─────────────┘       └──────────────────┘       └─────────────────┘
```

- フロントエンドとAPI Routesは同一Next.jsアプリ内に同居
- Supabase JS Clientを通じてDB/Auth/Storageにアクセス
- API RoutesはSupabase Service Role Keyを使って管理者操作を処理

## データベース設計

### ER図

```
profiles ─────────────────────────────────────────┐
                                                   │
allowed_emails                                     │
                                                   │
projects ──< presentations ──< materials           │
                    │                              │
                    ├──< comments                  │
                    │                              │
                    └──< presentation_tags >── tags │
                                              │    │
                                     tag_categories│
```

### テーブル定義

#### `profiles`
ユーザー情報。Supabase Authの`auth.users`と1:1で紐づく。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, FK → auth.users.id | ユーザーID |
| display_name | text | NOT NULL | 表示名 |
| role | text | NOT NULL, DEFAULT 'viewer' | 'admin' \| 'viewer' |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

#### `allowed_emails`
許可メールアドレスのホワイトリスト。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| email | text | NOT NULL, UNIQUE | 許可メールアドレス |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 登録日時 |

#### `projects`
ゼミ・授業などのプロジェクト。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| name | text | NOT NULL | プロジェクト名 |
| description | text | | 説明 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

#### `presentations`
個別の発表。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| project_id | uuid | NOT NULL, FK → projects.id ON DELETE CASCADE | 所属プロジェクト |
| title | text | NOT NULL | 発表タイトル |
| description | text | | 発表説明文 |
| presented_at | date | NOT NULL | 発表日 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

#### `materials`
発表に紐づく資料ファイル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| presentation_id | uuid | NOT NULL, FK → presentations.id ON DELETE CASCADE | 所属発表 |
| file_name | text | NOT NULL | 元ファイル名 |
| storage_path | text | NOT NULL | Supabase Storage内のパス |
| file_type | text | NOT NULL | MIMEタイプ or 拡張子 ('pdf', 'docx' 等) |
| file_size | bigint | | ファイルサイズ(bytes) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | アップロード日時 |

#### `comments`
発表に対するコメント/議事録。1発表に対して1レコード（初期仕様）。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| presentation_id | uuid | NOT NULL, FK → presentations.id ON DELETE CASCADE | 所属発表 |
| content | text | NOT NULL | コメント/議事録テキスト |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | 更新日時 |

#### `tag_categories`
タグのカテゴリ（学生名、回生、分野、研究対象 等）。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| name | text | NOT NULL, UNIQUE | カテゴリ名 |
| sort_order | int | NOT NULL, DEFAULT 0 | 表示順 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |

#### `tags`
個別のタグ値。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | ID |
| category_id | uuid | NOT NULL, FK → tag_categories.id ON DELETE CASCADE | 所属カテゴリ |
| value | text | NOT NULL | タグ値（「田中太郎」「NLP」等） |
| created_at | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |

UNIQUE制約: (category_id, value)

#### `presentation_tags`
発表とタグの中間テーブル。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| presentation_id | uuid | FK → presentations.id ON DELETE CASCADE | 発表ID |
| tag_id | uuid | FK → tags.id ON DELETE CASCADE | タグID |

PK: (presentation_id, tag_id)

### インデックス

- `presentations.project_id` — プロジェクト内発表一覧の取得高速化
- `presentations.presented_at` — 日付順ソート
- `materials.presentation_id` — 発表の資料取得
- `comments.presentation_id` — 発表のコメント取得
- `tags.category_id` — カテゴリ内タグ一覧
- `presentation_tags.tag_id` — タグによる発表検索

## Supabase Storage設計

### バケット構成

| バケット名 | 公開設定 | 用途 |
|------------|----------|------|
| `materials` | private | 発表資料ファイル (PDF, Word等) |

### ストレージパス規則

```
materials/{project_id}/{presentation_id}/{file_name}
```

### アクセス制御（RLS）

- 認証済みユーザー: 読み取り可能（Signed URL経由）
- 管理者のみ: アップロード・削除可能

## 認証・認可設計

### 認証フロー

```
1. ユーザーがメールアドレスを入力してサインアップ/ログイン
2. Supabase Auth が処理
3. サインアップ時: Database Function (トリガー) で allowed_emails を照合
   - 許可リストに存在 → profiles レコード作成、サインアップ成功
   - 許可リストに不在 → サインアップ拒否（エラー返却）
4. ログイン時: 既にprofilesが存在するため通常通り認証
```

### 認可（Row Level Security）

すべてのテーブルにRLSを有効化。

| テーブル | SELECT | INSERT/UPDATE/DELETE |
|----------|--------|---------------------|
| projects | 認証済み全員 | role = 'admin' のみ |
| presentations | 認証済み全員 | role = 'admin' のみ |
| materials | 認証済み全員 | role = 'admin' のみ |
| comments | 認証済み全員 | role = 'admin' のみ |
| tag_categories | 認証済み全員 | role = 'admin' のみ |
| tags | 認証済み全員 | role = 'admin' のみ |
| presentation_tags | 認証済み全員 | role = 'admin' のみ |
| allowed_emails | role = 'admin' のみ | role = 'admin' のみ |
| profiles | 自分のレコードのみ | 自分のレコードのみ (role変更不可) |

## API設計

### 閲覧系（全ユーザー）

| メソッド | エンドポイント | 説明 |
|----------|----------------|------|
| GET | `/api/projects` | プロジェクト一覧 |
| GET | `/api/projects/[id]` | プロジェクト詳細 |
| GET | `/api/projects/[id]/presentations` | プロジェクト内発表一覧（フィルター対応） |
| GET | `/api/presentations/[id]` | 発表詳細（コメント・資料含む） |
| GET | `/api/presentations/[id]/materials/[materialId]/url` | 資料のSigned URL取得 |
| GET | `/api/tags` | タグ一覧（カテゴリ別） |

### クエリパラメータ（発表一覧フィルター）

```
?q=検索キーワード        # 自由文字検索（タイトル、説明文）
&tags=tagId1,tagId2     # タグによる絞り込み（AND条件）
&sort=presented_at      # ソート項目
&order=desc             # ソート順
&page=1                 # ページネーション
&limit=20
```

### 管理系（管理者のみ）

| メソッド | エンドポイント | 説明 |
|----------|----------------|------|
| POST | `/api/admin/projects` | プロジェクト作成 |
| PUT | `/api/admin/projects/[id]` | プロジェクト更新 |
| DELETE | `/api/admin/projects/[id]` | プロジェクト削除 |
| POST | `/api/admin/presentations` | 発表作成 |
| PUT | `/api/admin/presentations/[id]` | 発表更新 |
| DELETE | `/api/admin/presentations/[id]` | 発表削除 |
| POST | `/api/admin/presentations/[id]/materials` | 資料アップロード |
| DELETE | `/api/admin/materials/[id]` | 資料削除 |
| PUT | `/api/admin/presentations/[id]/comment` | コメント/議事録 登録・更新 |
| POST | `/api/admin/tags/categories` | タグカテゴリ作成 |
| PUT | `/api/admin/tags/categories/[id]` | タグカテゴリ更新 |
| DELETE | `/api/admin/tags/categories/[id]` | タグカテゴリ削除 |
| POST | `/api/admin/tags` | タグ作成 |
| DELETE | `/api/admin/tags/[id]` | タグ削除 |
| POST | `/api/admin/presentations/[id]/tags` | 発表にタグ付け |
| DELETE | `/api/admin/presentations/[id]/tags/[tagId]` | タグ解除 |
| GET | `/api/admin/emails` | 許可メールアドレス一覧 |
| POST | `/api/admin/emails` | メールアドレス追加 |
| DELETE | `/api/admin/emails/[id]` | メールアドレス削除 |
| POST | `/api/admin/emails/import` | CSV一括アップロード |

## フロントエンド設計

### ディレクトリ構成（案）

```
src/
├── app/
│   ├── layout.tsx                    # ルートレイアウト
│   ├── page.tsx                      # リダイレクト → /projects
│   ├── login/
│   │   └── page.tsx                  # ログイン画面
│   ├── projects/
│   │   ├── page.tsx                  # プロジェクト一覧
│   │   └── [id]/
│   │       └── page.tsx              # 発表一覧 + フィルター
│   ├── presentations/
│   │   └── [id]/
│   │       └── page.tsx              # 発表詳細
│   └── admin/
│       ├── layout.tsx                # 管理者レイアウト（権限チェック）
│       ├── page.tsx                  # 管理ダッシュボード
│       ├── emails/
│       │   └── page.tsx              # 許可メール管理
│       ├── projects/
│       │   ├── page.tsx              # プロジェクト管理
│       │   └── [id]/
│       │       └── presentations/
│       │           └── page.tsx      # 発表管理
│       └── tags/
│           └── page.tsx              # タグ管理
├── components/
│   ├── ui/                           # shadcn/ui コンポーネント
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar-filter.tsx        # 左サイドバー（フィルター）
│   │   └── sidebar-materials.tsx     # 右サイドバー（資料）
│   ├── presentations/
│   │   ├── presentation-card.tsx
│   │   ├── presentation-list.tsx
│   │   └── comment-viewer.tsx        # コメント/議事録表示
│   ├── admin/
│   │   ├── email-manager.tsx
│   │   ├── csv-upload.tsx
│   │   ├── project-form.tsx
│   │   ├── presentation-form.tsx
│   │   └── tag-manager.tsx
│   └── auth/
│       └── auth-guard.tsx            # 認証ガード
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # ブラウザ用 Supabase Client
│   │   ├── server.ts                 # サーバー用 Supabase Client
│   │   └── admin.ts                  # Service Role Client（API Routes用）
│   ├── types/
│   │   └── database.ts               # DB型定義（Supabase CLI生成）
│   └── utils/
│       ├── filters.ts                # フィルターロジック
│       └── csv-parser.ts             # CSVパース
└── middleware.ts                      # 認証ミドルウェア
```

### 主要コンポーネント構成

#### 発表一覧ページ (`/projects/[id]`)

```
┌─────────────────────────────────────────────────────┐
│ Header (ナビゲーション + アカウント)                   │
├──────────┬──────────────────────────────────────────┤
│ Filter   │ Presentation Cards                       │
│ Sidebar  │                                          │
│          │ ┌────────────────────────────────┐       │
│ [検索]    │ │ 発表タイトル                     │       │
│          │ │ 2025-06-01 | 田中太郎 | NLP     │       │
│ 学生名    │ └────────────────────────────────┘       │
│ □ 田中    │                                          │
│ □ 佐藤    │ ┌────────────────────────────────┐       │
│          │ │ ...                              │       │
│ 分野      │ └────────────────────────────────┘       │
│ □ NLP    │                                          │
│ □ CV     │                                          │
├──────────┴──────────────────────────────────────────┤
```

#### 発表詳細ページ (`/presentations/[id]`)

```
┌─────────────────────────────────────────────────────┐
│ Header                                              │
├───────────────────────────────┬─────────────────────┤
│ Comment / Transcript          │ Materials           │
│                               │                     │
│ (スクロール可能なテキスト表示)    │ ┌─────────────┐    │
│                               │ │ 資料1.pdf    │    │
│ 先生からのコメント:              │ │ [プレビュー]  │    │
│ ・研究の方向性について...       │ │ [ダウンロード]│    │
│ ・手法の改善点として...         │ └─────────────┘    │
│ ・次回までに...                │                     │
│                               │ ┌─────────────┐    │
│                               │ │ 補足資料.docx│    │
│                               │ │ [ダウンロード]│    │
│                               │ └─────────────┘    │
├───────────────────────────────┴─────────────────────┤
```

## セキュリティ設計

- Supabase RLSにより、DBレベルでアクセス制御を強制
- API RoutesではSupabase Clientの認証トークンを検証
- 管理系エンドポイントではprofiles.roleの確認を必須化
- Storage Signed URLは有効期限付き（1時間）
- CSVアップロード時のバリデーション（メールアドレス形式チェック）
- ファイルアップロード時のMIMEタイプ・サイズ検証
