-- MVP v1 schema slice (ADR-022). Apply in Supabase SQL editor or via CLI.
-- Tenancy: user_id + RLS. organization_id deferred.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_fy_end_year int,
  migration_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fy_end_year int not null,
  label text not null,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, fy_end_year)
);

create table if not exists public.tax_year_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  financial_year uuid not null references public.financial_years (id) on delete cascade,
  superannuation_aud numeric not null default 0,
  overseas_daily_override_aud numeric,
  include_medicare_levy boolean not null default true,
  overseas_ato_salary_table text not null default '7',
  notes text not null default '',
  unique (user_id, financial_year)
);

create table if not exists public.tax_position_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fy_end_year int not null,
  planner_json jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, fy_end_year)
);

create table if not exists public.tax_year_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fy_end_year int not null,
  engine_version text not null,
  summary_json jsonb not null,
  computed_at timestamptz not null default now(),
  unique (user_id, fy_end_year, engine_version)
);

create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fy_end_year int,
  title text not null,
  category text,
  tags text[] not null default '{}',
  processing_status text not null default 'ready',
  notes text,
  soft_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  evidence_item_id uuid not null references public.evidence_items (id) on delete cascade,
  file_name text not null,
  mime_type text,
  byte_size bigint,
  storage_path text,
  checksum text,
  created_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  adapter_id text not null,
  status text not null default 'completed',
  summary jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.legacy_id_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  import_batch_id uuid not null references public.import_batches (id) on delete cascade,
  entity_type text not null,
  legacy_id text not null,
  new_id uuid not null,
  unique (user_id, entity_type, legacy_id)
);

create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fy_end_year int not null,
  status text not null default 'queued',
  artefact_path text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.financial_years enable row level security;
alter table public.tax_year_settings enable row level security;
alter table public.tax_position_state enable row level security;
alter table public.tax_year_summaries enable row level security;
alter table public.evidence_items enable row level security;
alter table public.evidence_files enable row level security;
alter table public.import_batches enable row level security;
alter table public.legacy_id_map enable row level security;
alter table public.export_jobs enable row level security;

create policy profiles_own on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy fy_own on public.financial_years for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tys_own on public.tax_year_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tps_own on public.tax_position_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tysum_own on public.tax_year_summaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy evidence_own on public.evidence_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy efiles_own on public.evidence_files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy import_own on public.import_batches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy legacy_own on public.legacy_id_map for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy export_own on public.export_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
