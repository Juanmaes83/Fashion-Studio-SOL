BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE asset_visibility AS ENUM ('private','internal','public');
CREATE TYPE outfit_status AS ENUM ('draft','review','approved','rejected','published');
CREATE TYPE job_status AS ENUM ('queued','processing','review','completed','failed','retrying','cancelled');
CREATE TYPE publication_status AS ENUM ('active','withdrawn');

CREATE TABLE workspaces (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brands (
  id text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE projects (
  id text PRIMARY KEY,
  brand_id text NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collections (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, slug)
);

CREATE TABLE garments (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  collection_id text REFERENCES collections(id) ON DELETE SET NULL,
  schema_version text NOT NULL DEFAULT 'garment/v0.2',
  name text NOT NULL,
  body_area text NOT NULL,
  category text,
  subcategory text,
  garment_type text,
  color text,
  secondary_color text,
  material text,
  pattern text,
  silhouette text,
  fit text,
  style text,
  season jsonb NOT NULL DEFAULT '[]'::jsonb,
  occasion jsonb NOT NULL DEFAULT '[]'::jsonb,
  thermal_weight smallint CHECK (thermal_weight BETWEEN 1 AND 5),
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  field_provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  review jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outfits (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  style text,
  occasion jsonb NOT NULL DEFAULT '[]'::jsonb,
  season jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status outfit_status NOT NULL DEFAULT 'draft',
  source text NOT NULL DEFAULT 'manual',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outfit_items (
  outfit_id text NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  garment_id text NOT NULL REFERENCES garments(id) ON DELETE RESTRICT,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (outfit_id, garment_id)
);

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  owner_type text NOT NULL CHECK (owner_type IN ('garment','outfit','job','project','saved_look')),
  owner_id text NOT NULL,
  kind text NOT NULL,
  visibility asset_visibility NOT NULL DEFAULT 'private',
  storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  checksum_sha256 text NOT NULL,
  width integer,
  height integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (entity_type IN ('garment','outfit','asset','job')),
  entity_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','approved','rejected')),
  note text,
  actor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE state_transitions (
  id bigserial PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  from_state text,
  to_state text NOT NULL,
  action text NOT NULL,
  actor text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  job_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  status job_status NOT NULL DEFAULT 'queued',
  provider text,
  model text,
  idempotency_key text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts > 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  estimated_cost numeric(12,4),
  actual_cost numeric(12,4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, idempotency_key)
);

CREATE TABLE job_attempts (
  id bigserial PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
  attempt integer NOT NULL CHECK (attempt > 0),
  status text NOT NULL,
  worker_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_code text,
  error_message text,
  duration_ms bigint,
  UNIQUE (job_id, attempt)
);

CREATE TABLE publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  status publication_status NOT NULL DEFAULT 'active',
  snapshot jsonb NOT NULL,
  checksum_sha256 text NOT NULL,
  published_by text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  UNIQUE (project_id, version)
);

CREATE UNIQUE INDEX one_active_publication_per_project
  ON publications(project_id) WHERE status = 'active';

CREATE TABLE saved_looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  public_token_hash text NOT NULL UNIQUE,
  outfit_id text REFERENCES outfits(id) ON DELETE SET NULL,
  garment_ids jsonb NOT NULL,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jobs_claim_idx ON generation_jobs(status, available_at, lease_expires_at);
CREATE INDEX garments_project_idx ON garments(project_id);
CREATE INDEX outfits_project_status_idx ON outfits(project_id, status);
CREATE INDEX assets_owner_idx ON assets(owner_type, owner_id);

COMMIT;
