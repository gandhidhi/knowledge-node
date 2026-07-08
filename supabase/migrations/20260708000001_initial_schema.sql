-- ゼミ発表アーカイブ: 初期スキーマ
-- テーブル定義 + インデックス

-- 許可メールアドレスのホワイトリスト
create table public.allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ユーザープロフィール（auth.users と 1:1）
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- プロジェクト（ゼミ・授業など）
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 発表
create table public.presentations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  presented_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 発表資料ファイル
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null references public.presentations (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_type text not null,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- コメント/議事録（1発表につき1レコード）
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid not null unique references public.presentations (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- タグカテゴリ（学生名、回生、分野、研究対象 等）
create table public.tag_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- タグ
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.tag_categories (id) on delete cascade,
  value text not null,
  created_at timestamptz not null default now(),
  unique (category_id, value)
);

-- 発表とタグの中間テーブル
create table public.presentation_tags (
  presentation_id uuid not null references public.presentations (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (presentation_id, tag_id)
);

-- インデックス
create index idx_presentations_project_id on public.presentations (project_id);
create index idx_presentations_presented_at on public.presentations (presented_at);
create index idx_materials_presentation_id on public.materials (presentation_id);
create index idx_comments_presentation_id on public.comments (presentation_id);
create index idx_tags_category_id on public.tags (category_id);
create index idx_presentation_tags_tag_id on public.presentation_tags (tag_id);

-- updated_at 自動更新トリガー
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger set_presentations_updated_at
  before update on public.presentations
  for each row execute function public.set_updated_at();

create trigger set_comments_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();
