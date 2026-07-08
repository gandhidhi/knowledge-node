# 実装タスク一覧: ゼミ発表アーカイブWebアプリ

#[[file:requirements.md]]
#[[file:design.md]]

## フェーズ1: プロジェクト初期セットアップ

### Task 1.1: Next.js プロジェクト作成
- [ ] `create-next-app` で App Router ベースのプロジェクトを作成
- [ ] TypeScript, ESLint, Tailwind CSS を有効化
- [ ] shadcn/ui を初期化し、基本コンポーネントをインストール
- [ ] プロジェクトのディレクトリ構成を設計通りに作成

### Task 1.2: Supabase セットアップ
- [ ] Supabase プロジェクトを作成（手動）
- [ ] `@supabase/supabase-js` と `@supabase/ssr` をインストール
- [ ] 環境変数ファイル（`.env.local`）のテンプレートを作成
- [ ] Supabase Client ユーティリティを作成（client.ts, server.ts, admin.ts）

### Task 1.3: データベースマイグレーション
- [ ] Supabase CLI をセットアップ
- [ ] マイグレーションファイルを作成:
  - `allowed_emails` テーブル
  - `profiles` テーブル
  - `projects` テーブル
  - `presentations` テーブル
  - `materials` テーブル
  - `comments` テーブル
  - `tag_categories` テーブル
  - `tags` テーブル
  - `presentation_tags` テーブル
- [ ] インデックスを作成
- [ ] RLS ポリシーを設定

### Task 1.4: 認証トリガー設定
- [ ] `auth.users` への INSERT トリガーを作成（allowed_emails照合 + profiles自動作成）
- [ ] 許可リストにないメールの拒否ロジックを実装

---

## フェーズ2: 認証・認可

### Task 2.1: 認証ミドルウェア
- [ ] `middleware.ts` を作成し、未認証ユーザーを `/login` にリダイレクト
- [ ] Supabase Auth のセッション管理を実装

### Task 2.2: ログインページ
- [ ] `/login` ページを作成
- [ ] メールアドレス + パスワードによるサインアップ/ログインフォーム
- [ ] 未許可メールアドレスのエラーハンドリング
- [ ] ログイン成功後のリダイレクト処理

### Task 2.3: 認証ガード・レイアウト
- [ ] 共通レイアウト（ヘッダー）を作成
- [ ] ヘッダーにアカウント情報・ログアウトボタンを配置
- [ ] 管理者レイアウト (`/admin/layout.tsx`) に role チェックを実装

---

## フェーズ3: 閲覧機能（コア）

### Task 3.1: プロジェクト一覧ページ
- [ ] `GET /api/projects` API Route を実装
- [ ] `/projects` ページを作成
- [ ] プロジェクトカードコンポーネントを作成
- [ ] プロジェクト選択でプロジェクト詳細へ遷移

### Task 3.2: 発表一覧ページ
- [ ] `GET /api/projects/[id]/presentations` API Route を実装（フィルター対応）
- [ ] `/projects/[id]` ページを作成
- [ ] 左サイドバー（フィルター）コンポーネントを作成
  - 自由文字検索フィールド
  - カテゴリ別タグチェックボックス
- [ ] 発表カード一覧コンポーネントを作成
- [ ] ページネーション実装
- [ ] `GET /api/tags` API Route を実装（フィルター用タグ一覧取得）

### Task 3.3: 発表詳細ページ
- [ ] `GET /api/presentations/[id]` API Route を実装（コメント・資料含む）
- [ ] `/presentations/[id]` ページを作成
- [ ] 中央エリア: コメント/議事録ビューア（スクロール表示）
- [ ] 右サイドバー: 資料一覧コンポーネント
- [ ] `GET /api/presentations/[id]/materials/[materialId]/url` Signed URL 取得 API
- [ ] PDF プレビュー表示（iframe or ライブラリ）
- [ ] ファイルダウンロード機能

---

## フェーズ4: 管理機能

### Task 4.1: 管理ダッシュボード
- [ ] `/admin` ページを作成
- [ ] 管理メニュー（各管理画面へのリンク）

### Task 4.2: 許可メールアドレス管理
- [ ] `GET /api/admin/emails` API Route
- [ ] `POST /api/admin/emails` API Route（個別追加）
- [ ] `DELETE /api/admin/emails/[id]` API Route
- [ ] `POST /api/admin/emails/import` API Route（CSVアップロード）
- [ ] `/admin/emails` ページを作成
- [ ] メールアドレス一覧テーブル
- [ ] 追加フォーム
- [ ] CSV一括アップロードコンポーネント（バリデーション付き）
- [ ] 削除確認ダイアログ

### Task 4.3: プロジェクト管理
- [ ] `POST /api/admin/projects` API Route
- [ ] `PUT /api/admin/projects/[id]` API Route
- [ ] `DELETE /api/admin/projects/[id]` API Route
- [ ] `/admin/projects` ページを作成
- [ ] プロジェクト作成・編集フォーム
- [ ] 削除確認ダイアログ

### Task 4.4: 発表管理
- [ ] `POST /api/admin/presentations` API Route
- [ ] `PUT /api/admin/presentations/[id]` API Route
- [ ] `DELETE /api/admin/presentations/[id]` API Route
- [ ] `/admin/projects/[id]/presentations` ページを作成
- [ ] 発表作成・編集フォーム（タイトル、説明文、発表日）
- [ ] 発表一覧テーブル

### Task 4.5: 資料アップロード
- [ ] Supabase Storage バケット `materials` を作成
- [ ] Storage RLS ポリシーを設定
- [ ] `POST /api/admin/presentations/[id]/materials` API Route（ファイルアップロード）
- [ ] `DELETE /api/admin/materials/[id]` API Route
- [ ] 資料アップロードコンポーネント（ドラッグ&ドロップ対応）
- [ ] ファイルタイプ・サイズバリデーション（50MB上限）

### Task 4.6: コメント/議事録管理
- [ ] `PUT /api/admin/presentations/[id]/comment` API Route（登録・更新）
- [ ] コメント/議事録入力フォーム（テキストエリア）
- [ ] プレビュー機能

### Task 4.7: タグ管理
- [ ] `POST /api/admin/tags/categories` API Route
- [ ] `PUT /api/admin/tags/categories/[id]` API Route
- [ ] `DELETE /api/admin/tags/categories/[id]` API Route
- [ ] `POST /api/admin/tags` API Route
- [ ] `DELETE /api/admin/tags/[id]` API Route
- [ ] `POST /api/admin/presentations/[id]/tags` API Route
- [ ] `DELETE /api/admin/presentations/[id]/tags/[tagId]` API Route
- [ ] `/admin/tags` ページを作成
- [ ] カテゴリ・タグの作成・削除UI
- [ ] 発表編集画面にタグ付けUI追加

---

## フェーズ5: 仕上げ・デプロイ

### Task 5.1: UI/UX 調整
- [ ] レスポンシブ対応（PC優先、タブレット最低限）
- [ ] ローディング状態の表示（Skeleton UI）
- [ ] エラー表示の統一（Toast通知）
- [ ] 空状態の表示（データがない場合のメッセージ）

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
