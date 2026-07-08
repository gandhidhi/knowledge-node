# 実装タスク一覧: ゼミ発表アーカイブWebアプリ

#[[file:requirements.md]]
#[[file:design.md]]

## フェーズ1: プロジェクト初期セットアップ

### Task 1.1: Next.js プロジェクト作成
- [x] `create-next-app` で App Router ベースのプロジェクトを作成
- [x] TypeScript, ESLint, Tailwind CSS を有効化
- [x] shadcn/ui を初期化し、基本コンポーネントをインストール
- [x] プロジェクトのディレクトリ構成を設計通りに作成

### Task 1.2: Supabase セットアップ
- [ ] Supabase プロジェクトを作成（手動）
- [x] `@supabase/supabase-js` と `@supabase/ssr` をインストール
- [x] 環境変数ファイル（`.env.local`）のテンプレートを作成
- [x] Supabase Client ユーティリティを作成（client.ts, server.ts, admin.ts）

### Task 1.3: データベースマイグレーション
- [x] Supabase CLI をセットアップ
- [x] マイグレーションファイルを作成:
  - `allowed_emails` テーブル
  - `profiles` テーブル
  - `projects` テーブル
  - `presentations` テーブル
  - `materials` テーブル
  - `comments` テーブル
  - `tag_categories` テーブル
  - `tags` テーブル
  - `presentation_tags` テーブル
- [x] インデックスを作成
- [x] RLS ポリシーを設定

### Task 1.4: 認証トリガー設定
- [x] `auth.users` への INSERT トリガーを作成（allowed_emails照合 + profiles自動作成）
- [x] 許可リストにないメールの拒否ロジックを実装

---

## フェーズ2: 認証・認可

### Task 2.1: 認証ミドルウェア
- [x] `middleware.ts` を作成し、未認証ユーザーを `/login` にリダイレクト
- [x] Supabase Auth のセッション管理を実装

### Task 2.2: ログインページ
- [x] `/login` ページを作成
- [x] メールアドレス + パスワードによるサインアップ/ログインフォーム
- [x] 未許可メールアドレスのエラーハンドリング
- [x] ログイン成功後のリダイレクト処理

### Task 2.3: 認証ガード・レイアウト
- [x] 共通レイアウト（ヘッダー）を作成
- [x] ヘッダーにアカウント情報・ログアウトボタンを配置
- [x] 管理者レイアウト (`/admin/layout.tsx`) に role チェックを実装

---

## フェーズ3: 閲覧機能（コア）

### Task 3.1: プロジェクト一覧ページ
- [x] `GET /api/projects` API Route を実装
- [x] `/projects` ページを作成
- [x] プロジェクトカードコンポーネントを作成
- [x] プロジェクト選択でプロジェクト詳細へ遷移

### Task 3.2: 発表一覧ページ
- [x] `GET /api/projects/[id]/presentations` API Route を実装（フィルター対応）
- [x] `/projects/[id]` ページを作成
- [x] 左サイドバー（フィルター）コンポーネントを作成
  - 自由文字検索フィールド
  - カテゴリ別タグチェックボックス
- [x] 発表カード一覧コンポーネントを作成
- [x] ページネーション実装
- [x] `GET /api/tags` API Route を実装（フィルター用タグ一覧取得）

### Task 3.3: 発表詳細ページ
- [x] `GET /api/presentations/[id]` API Route を実装（コメント・資料含む）
- [x] `/presentations/[id]` ページを作成
- [x] 中央エリア: コメント/議事録ビューア（スクロール表示）
- [x] 右サイドバー: 資料一覧コンポーネント
- [x] `GET /api/presentations/[id]/materials/[materialId]/url` Signed URL 取得 API
- [x] PDF プレビュー表示（iframe or ライブラリ）
- [x] ファイルダウンロード機能

---

## フェーズ4: 管理機能

### Task 4.1: 管理ダッシュボード
- [x] `/admin` ページを作成
- [x] 管理メニュー（各管理画面へのリンク）

### Task 4.2: 許可メールアドレス管理
- [x] `GET /api/admin/emails` API Route
- [x] `POST /api/admin/emails` API Route（個別追加）
- [x] `DELETE /api/admin/emails/[id]` API Route
- [x] `POST /api/admin/emails/import` API Route（CSVアップロード）
- [x] `/admin/emails` ページを作成
- [x] メールアドレス一覧テーブル
- [x] 追加フォーム
- [x] CSV一括アップロードコンポーネント（バリデーション付き）
- [x] 削除確認ダイアログ

### Task 4.3: プロジェクト管理
- [x] `POST /api/admin/projects` API Route
- [x] `PUT /api/admin/projects/[id]` API Route
- [x] `DELETE /api/admin/projects/[id]` API Route
- [x] `/admin/projects` ページを作成
- [x] プロジェクト作成・編集フォーム
- [x] 削除確認ダイアログ

### Task 4.4: 発表管理
- [x] `POST /api/admin/presentations` API Route
- [x] `PUT /api/admin/presentations/[id]` API Route
- [x] `DELETE /api/admin/presentations/[id]` API Route
- [x] `/admin/projects/[id]/presentations` ページを作成
- [x] 発表作成・編集フォーム（タイトル、説明文、発表日）
- [x] 発表一覧テーブル

### Task 4.5: 資料アップロード
- [x] Supabase Storage バケット `materials` を作成
- [x] Storage RLS ポリシーを設定
- [x] `POST /api/admin/presentations/[id]/materials` API Route（ファイルアップロード）
- [x] `DELETE /api/admin/materials/[id]` API Route
- [x] 資料アップロードコンポーネント（ドラッグ&ドロップ対応）
- [x] ファイルタイプ・サイズバリデーション（50MB上限）

### Task 4.6: コメント/議事録管理
- [x] `PUT /api/admin/presentations/[id]/comment` API Route（登録・更新）
- [x] コメント/議事録入力フォーム（テキストエリア）
- [x] プレビュー機能

### Task 4.7: タグ管理
- [x] `POST /api/admin/tags/categories` API Route
- [x] `PUT /api/admin/tags/categories/[id]` API Route
- [x] `DELETE /api/admin/tags/categories/[id]` API Route
- [x] `POST /api/admin/tags` API Route
- [x] `DELETE /api/admin/tags/[id]` API Route
- [x] `POST /api/admin/presentations/[id]/tags` API Route
- [x] `DELETE /api/admin/presentations/[id]/tags/[tagId]` API Route
- [x] `/admin/tags` ページを作成
- [x] カテゴリ・タグの作成・削除UI
- [x] 発表編集画面にタグ付けUI追加

---

## フェーズ5: 仕上げ・デプロイ

### Task 5.1: UI/UX 調整
- [x] レスポンシブ対応（PC優先、タブレット最低限）
- [x] ローディング状態の表示（Skeleton UI）
- [x] エラー表示の統一（Toast通知）
- [x] 空状態の表示（データがない場合のメッセージ）

### Task 5.2: Vercel デプロイ
- [ ] Vercel プロジェクトを作成（手動）
- [ ] 環境変数を Vercel に設定
- [ ] デプロイ確認
- [ ] 本番環境での動作テスト

---

## 実装順序の方針

1. **フェーズ1** → 2 → 3 → 4 → 5 の順で進行
2. 各タスク内ではバックエンド（API）→ フロントエンド（UI）の順
3. フェーズ3と4は一部並行可能だが、3を先に完成させることで閲覧側の動作確認が早期にできる
