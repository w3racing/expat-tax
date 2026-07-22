-- Evidence Vault MVP — Supabase storage first; Drive columns nullable for later.

-- Enrich evidence_items for MVP metadata
alter table public.evidence_items
  add column if not exists file_name text,
  add column if not exists description text,
  add column if not exists document_date date,
  add column if not exists linked_claim_id text,
  add column if not exists linked_claim_label text;

comment on column public.evidence_items.category is
  'receipt | payslip | roster | flight | travel | investment | other';

-- Enrich evidence_files: canonical binary + future Drive mirror hooks
alter table public.evidence_files
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists storage_bucket text default 'evidence',
  add column if not exists storage_state text not null default 'available',
  add column if not exists drive_file_id text,
  add column if not exists drive_parent_folder_id text,
  add column if not exists drive_revision_id text,
  add column if not exists drive_mirror_status text not null default 'not_mirrored',
  add column if not exists drive_last_seen_at timestamptz,
  add column if not exists drive_deleted_at timestamptz;

comment on column public.evidence_files.storage_provider is
  'supabase | local_dev | drive (future). MVP uses supabase (or local_dev fallback).';
comment on column public.evidence_files.drive_mirror_status is
  'not_mirrored | pending | mirrored | missing | trashed | conflict — Drive sync later';

create unique index if not exists evidence_files_drive_file_id_user_uidx
  on public.evidence_files (user_id, drive_file_id)
  where drive_file_id is not null and drive_deleted_at is null;

create index if not exists evidence_items_user_fy_idx
  on public.evidence_items (user_id, fy_end_year)
  where soft_deleted_at is null;

create index if not exists evidence_items_user_category_idx
  on public.evidence_items (user_id, category)
  where soft_deleted_at is null;

-- Private evidence bucket (run once; ignore if exists)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

-- Storage RLS: users may only access their own prefix {user_id}/...
drop policy if exists evidence_storage_select on storage.objects;
create policy evidence_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidence_storage_insert on storage.objects;
create policy evidence_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidence_storage_update on storage.objects;
create policy evidence_storage_update on storage.objects
  for update to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists evidence_storage_delete on storage.objects;
create policy evidence_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
