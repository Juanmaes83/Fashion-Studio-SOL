-- Fashion Studio SOL — Fase 2A
-- Esquema inicial PostgreSQL. No se ejecuta en producción todavía.

create extension if not exists pgcrypto;

create type asset_visibility as enum ('private','internal','public');
create type asset_status as enum ('pending','ready','failed','deleted');
create type outfit_status as enum ('draft','review','approved','rejected','published');
create type job_status as enum ('queued','processing','review','completed','failed','retrying','cancelled');
create type publication_status as enum ('active','withdrawn');

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete restrict,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete restrict,
  brand_id uuid not null references brands(id) on delete restrict,
  slug text not null,
  name text not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, slug)
);

create table collections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  slug text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create table garments (
  id text primary key,
  project_id uuid not null references projects(id) on delete restrict,
  collection_id uuid references collections(id) on delete set null,
  schema_version text not null default 'garment/v0.2',
  name text not null,
  description text not null default '',
  part text not null,
  body_area text not null,
  category text,
  subcategory text,
  garment_type text,
  material text,
  pattern text,
  silhouette text,
  fit text,
  style text,
  season jsonb not null default '[]'::jsonb,
  occasion jsonb not null default '[]'::jsonb,
  thermal_weight smallint check (thermal_weight between 1 and 5),
  color text,
  secondary_color text,
  tags jsonb not null default '[]'::jsonb,
  field_provenance jsonb not null default '{}'::jsonb,
  source jsonb not null default '{}'::jsonb,
  review jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id)
);

create table outfits (
  id text primary key,
  project_id uuid not null references projects(id) on delete restrict,
  name text not null,
  description text not null default '',
  style text,
  occasion jsonb not null default '[]'::jsonb,
  season jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  status outfit_status not null default 'draft',
  source text,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id)
);

create table outfit_items (
  outfit_id text not null references outfits(id) on delete cascade,
  garment_id text not null references garments(id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (outfit_id, garment_id)
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  garment_id text references garments(id) on delete restrict,
  outfit_id text references outfits(id) on delete restrict,
  kind text not null,
  visibility asset_visibility not null,
  status asset_status not null default 'pending',
  storage_key text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  checksum_sha256 text not null,
  width integer,
  height integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((garment_id is not null)::int + (outfit_id is not null)::int <= 1)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  entity_type text not null check (entity_type in ('garment','outfit','asset')),
  entity_id text not null,
  decision text not null check (decision in ('pending','approved','rejected')),
  note text,
  actor text not null,
  created_at timestamptz not null default now()
);

create table state_transitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  entity_type text not null,
  entity_id text not null,
  from_state text,
  to_state text not null,
  action text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  job_type text not null,
  target_type text,
  target_id text,
  status job_status not null default 'queued',
  provider text,
  model text,
  idempotency_key text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_message text,
  cost_amount numeric(12,6),
  cost_currency text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, idempotency_key)
);

create table job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status job_status not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  unique (job_id, attempt_number)
);

create table publications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  version integer not null check (version > 0),
  status publication_status not null default 'active',
  snapshot jsonb not null,
  checksum_sha256 text not null,
  published_by text not null,
  published_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  unique (project_id, version)
);

create unique index publications_one_active_per_project
  on publications(project_id) where status = 'active';

create table saved_looks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete restrict,
  public_token_hash text not null unique,
  outfit_id text references outfits(id) on delete set null,
  garment_ids jsonb not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create index garments_project_idx on garments(project_id);
create index outfits_project_status_idx on outfits(project_id, status);
create index jobs_claim_idx on generation_jobs(status, available_at) where status in ('queued','retrying');
create index assets_project_visibility_idx on assets(project_id, visibility, status);
