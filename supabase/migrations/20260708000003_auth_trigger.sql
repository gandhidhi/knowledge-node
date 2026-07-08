-- ゼミ発表アーカイブ: 認証トリガー
-- サインアップ時に allowed_emails を照合し、許可されていれば profiles を自動作成する

-- サインアップ前チェック: 許可リストにないメールは拒否
create or replace function public.check_email_allowed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.allowed_emails
    where lower(email) = lower(new.email)
  ) then
    raise exception 'signup_not_allowed: このメールアドレスは許可されていません';
  end if;
  return new;
end;
$$;

create trigger before_auth_user_created
  before insert on auth.users
  for each row execute function public.check_email_allowed();

-- サインアップ後: profiles レコードを自動作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      split_part(new.email, '@', 1)
    ),
    'viewer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
