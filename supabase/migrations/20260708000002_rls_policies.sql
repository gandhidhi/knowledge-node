-- ゼミ発表アーカイブ: RLS ポリシー

-- 管理者判定関数（security definer で profiles の RLS を回避し再帰を防ぐ）
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- サインアップ前にメールアドレスが許可されているか確認するための関数
-- （ログイン画面から匿名ユーザーが呼び出す）
create or replace function public.is_email_allowed(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.allowed_emails
    where lower(email) = lower(check_email)
  );
$$;

grant execute on function public.is_email_allowed(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- RLS 有効化
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.presentations enable row level security;
alter table public.materials enable row level security;
alter table public.comments enable row level security;
alter table public.tag_categories enable row level security;
alter table public.tags enable row level security;
alter table public.presentation_tags enable row level security;

-- allowed_emails: 管理者のみ全操作可
create policy "allowed_emails_admin_select" on public.allowed_emails
  for select to authenticated using (public.is_admin());
create policy "allowed_emails_admin_insert" on public.allowed_emails
  for insert to authenticated with check (public.is_admin());
create policy "allowed_emails_admin_update" on public.allowed_emails
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "allowed_emails_admin_delete" on public.allowed_emails
  for delete to authenticated using (public.is_admin());

-- profiles: 自分のレコードのみ参照・更新可（role の変更はトリガーで禁止）
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 一般ユーザーによる role 変更を禁止するトリガー
-- （service_role や SQL エディタからの変更は auth.uid() が null のため許可される）
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'role cannot be changed';
  end if;
  return new;
end;
$$;

create trigger prevent_profiles_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- コンテンツ系テーブル: 認証済み全員が SELECT 可、書き込みは管理者のみ
-- projects
create policy "projects_select" on public.projects
  for select to authenticated using (true);
create policy "projects_admin_insert" on public.projects
  for insert to authenticated with check (public.is_admin());
create policy "projects_admin_update" on public.projects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "projects_admin_delete" on public.projects
  for delete to authenticated using (public.is_admin());

-- presentations
create policy "presentations_select" on public.presentations
  for select to authenticated using (true);
create policy "presentations_admin_insert" on public.presentations
  for insert to authenticated with check (public.is_admin());
create policy "presentations_admin_update" on public.presentations
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "presentations_admin_delete" on public.presentations
  for delete to authenticated using (public.is_admin());

-- materials
create policy "materials_select" on public.materials
  for select to authenticated using (true);
create policy "materials_admin_insert" on public.materials
  for insert to authenticated with check (public.is_admin());
create policy "materials_admin_update" on public.materials
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "materials_admin_delete" on public.materials
  for delete to authenticated using (public.is_admin());

-- comments
create policy "comments_select" on public.comments
  for select to authenticated using (true);
create policy "comments_admin_insert" on public.comments
  for insert to authenticated with check (public.is_admin());
create policy "comments_admin_update" on public.comments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "comments_admin_delete" on public.comments
  for delete to authenticated using (public.is_admin());

-- tag_categories
create policy "tag_categories_select" on public.tag_categories
  for select to authenticated using (true);
create policy "tag_categories_admin_insert" on public.tag_categories
  for insert to authenticated with check (public.is_admin());
create policy "tag_categories_admin_update" on public.tag_categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tag_categories_admin_delete" on public.tag_categories
  for delete to authenticated using (public.is_admin());

-- tags
create policy "tags_select" on public.tags
  for select to authenticated using (true);
create policy "tags_admin_insert" on public.tags
  for insert to authenticated with check (public.is_admin());
create policy "tags_admin_update" on public.tags
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tags_admin_delete" on public.tags
  for delete to authenticated using (public.is_admin());

-- presentation_tags
create policy "presentation_tags_select" on public.presentation_tags
  for select to authenticated using (true);
create policy "presentation_tags_admin_insert" on public.presentation_tags
  for insert to authenticated with check (public.is_admin());
create policy "presentation_tags_admin_delete" on public.presentation_tags
  for delete to authenticated using (public.is_admin());
