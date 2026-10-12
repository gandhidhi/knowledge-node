-- 発表の手動並び替え用カラム
-- 管理画面のドラッグ&ドロップで決めた順序を保持する

alter table public.presentations
  add column sort_order int not null default 0;

-- 既存データの初期値: プロジェクトごとに発表日の降順で 0,1,2... を振る
-- （これまでの既定の並び順＝発表日降順を踏襲）
with ordered as (
  select
    id,
    row_number() over (
      partition by project_id
      order by presented_at desc, created_at desc
    ) - 1 as rn
  from public.presentations
)
update public.presentations p
set sort_order = ordered.rn
from ordered
where p.id = ordered.id;

-- プロジェクト内の並び替え参照を高速化
create index idx_presentations_project_sort
  on public.presentations (project_id, sort_order);
