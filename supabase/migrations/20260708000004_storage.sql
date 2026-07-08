-- ゼミ発表アーカイブ: Storage バケットと RLS

-- 資料用プライベートバケット（上限 50MB）
insert into storage.buckets (id, name, public, file_size_limit)
values ('materials', 'materials', false, 52428800)
on conflict (id) do nothing;

-- 認証済みユーザーは読み取り可（Signed URL 発行にも必要）
create policy "materials_authenticated_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'materials');

-- 管理者のみアップロード・更新・削除可
create policy "materials_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materials' and public.is_admin());

create policy "materials_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'materials' and public.is_admin())
  with check (bucket_id = 'materials' and public.is_admin());

create policy "materials_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materials' and public.is_admin());
