-- コメント/議事録を「文字起こし」と「要約」の2フィールドに分割
-- 既存の content は文字起こし(transcript)として引き継ぐ

alter table public.comments rename column content to transcript;
alter table public.comments alter column transcript drop not null;
alter table public.comments add column summary text;

-- 両方空のレコードは作らない（アプリ側では両方空なら行を削除する）
alter table public.comments
  add constraint comments_content_present
  check (transcript is not null or summary is not null);
