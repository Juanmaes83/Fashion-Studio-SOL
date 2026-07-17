-- Fashion Studio SOL — Phase 2 foundation. Not for production yet.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE asset_visibility AS ENUM ('private','internal','public');
CREATE TYPE asset_status AS ENUM ('pending','ready','failed','deleted');
CREATE TYPE outfit_status AS ENUM ('draft','review','approved','rejected','published');
CREATE TYPE job_status AS ENUM ('queued','processing','review','completed','failed','retrying','cancelled');
CREATE TYPE publication_status AS ENUM ('active','withdrawn');

CREATE TABLE workspaces (
 id text PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE brands (
 id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
 slug text NOT NULL, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(workspace_id,slug), UNIQUE(workspace_id,id)
);
CREATE TABLE projects (
 id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
 brand_id text NOT NULL, slug text NOT NULL, name text NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(brand_id,slug), UNIQUE(workspace_id,id),
 FOREIGN KEY(workspace_id,brand_id) REFERENCES brands(workspace_id,id) ON DELETE RESTRICT
);
CREATE TABLE collections (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 slug text NOT NULL, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,slug), UNIQUE(project_id,id)
);
CREATE TABLE garments (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 collection_id text, schema_version text NOT NULL DEFAULT 'garment/v0.2', name text NOT NULL,
 description text NOT NULL DEFAULT '', part text NOT NULL, body_area text NOT NULL,
 category text, subcategory text, garment_type text, material text, pattern text,
 silhouette text, fit text, style text, season jsonb NOT NULL DEFAULT '[]',
 occasion jsonb NOT NULL DEFAULT '[]', thermal_weight smallint CHECK(thermal_weight BETWEEN 1 AND 5),
 color text CHECK(color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
 secondary_color text CHECK(secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
 tags jsonb NOT NULL DEFAULT '[]', field_provenance jsonb NOT NULL DEFAULT '{}',
 source jsonb NOT NULL DEFAULT '{}', review jsonb NOT NULL DEFAULT '{}',
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,id),
 FOREIGN KEY(project_id,collection_id) REFERENCES collections(project_id,id) ON DELETE SET NULL,
 CHECK(jsonb_typeof(season)='array'), CHECK(jsonb_typeof(occasion)='array'),
 CHECK(jsonb_typeof(tags)='array'), CHECK(jsonb_typeof(field_provenance)='object')
);
CREATE TABLE outfits (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 name text NOT NULL, description text NOT NULL DEFAULT '', style text,
 occasion jsonb NOT NULL DEFAULT '[]', season jsonb NOT NULL DEFAULT '[]', tags jsonb NOT NULL DEFAULT '[]',
 status outfit_status NOT NULL DEFAULT 'draft', source text NOT NULL DEFAULT 'manual',
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,id),
 CHECK(jsonb_typeof(occasion)='array'), CHECK(jsonb_typeof(season)='array'), CHECK(jsonb_typeof(tags)='array')
);
CREATE TABLE outfit_items (
 project_id text NOT NULL, outfit_id text NOT NULL, garment_id text NOT NULL,
 position integer NOT NULL DEFAULT 0 CHECK(position>=0), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(outfit_id,garment_id), UNIQUE(outfit_id,position),
 FOREIGN KEY(project_id,outfit_id) REFERENCES outfits(project_id,id) ON DELETE CASCADE,
 FOREIGN KEY(project_id,garment_id) REFERENCES garments(project_id,id) ON DELETE RESTRICT
);
CREATE TABLE assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 garment_id text, outfit_id text, kind text NOT NULL, visibility asset_visibility NOT NULL,
 status asset_status NOT NULL DEFAULT 'pending', storage_key text NOT NULL UNIQUE,
 mime_type text NOT NULL, byte_size bigint NOT NULL CHECK(byte_size>=0),
 checksum_sha256 text NOT NULL CHECK(checksum_sha256 ~ '^[0-9A-Fa-f]{64}$'),
 width integer CHECK(width IS NULL OR width>0), height integer CHECK(height IS NULL OR height>0),
 metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(project_id,garment_id) REFERENCES garments(project_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(project_id,outfit_id) REFERENCES outfits(project_id,id) ON DELETE RESTRICT,
 CHECK(((garment_id IS NOT NULL)::int+(outfit_id IS NOT NULL)::int)<=1), CHECK(jsonb_typeof(metadata)='object')
);
CREATE TABLE reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 entity_type text NOT NULL CHECK(entity_type IN('garment','outfit','asset','job')),
 entity_id text NOT NULL, decision text NOT NULL CHECK(decision IN('pending','approved','rejected')),
 note text, actor text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE state_transitions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 entity_type text NOT NULL, entity_id text NOT NULL, from_state text, to_state text NOT NULL,
 action text NOT NULL, actor text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(jsonb_typeof(metadata)='object')
);
CREATE TABLE generation_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 job_type text NOT NULL, target_type text, target_id text, status job_status NOT NULL DEFAULT 'queued',
 provider text, model text, idempotency_key text NOT NULL, attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
 max_attempts integer NOT NULL DEFAULT 3 CHECK(max_attempts>0), available_at timestamptz NOT NULL DEFAULT now(),
 locked_at timestamptz, locked_by text, started_at timestamptz, finished_at timestamptz,
 error_code text, error_message text, cost_amount numeric(12,6), cost_currency text,
 input jsonb NOT NULL DEFAULT '{}', output jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(project_id,idempotency_key), CHECK(jsonb_typeof(input)='object'), CHECK(jsonb_typeof(output)='object')
);
CREATE TABLE job_attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
 attempt_number integer NOT NULL CHECK(attempt_number>0), status job_status NOT NULL,
 worker_id text, started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 error_code text, error_message text, metadata jsonb NOT NULL DEFAULT '{}',
 UNIQUE(job_id,attempt_number), CHECK(jsonb_typeof(metadata)='object')
);
CREATE TABLE publications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 version integer NOT NULL CHECK(version>0), status publication_status NOT NULL DEFAULT 'active',
 snapshot jsonb NOT NULL, checksum_sha256 text NOT NULL CHECK(checksum_sha256 ~ '^[0-9A-Fa-f]{64}$'),
 published_by text NOT NULL, published_at timestamptz NOT NULL DEFAULT now(), withdrawn_at timestamptz,
 UNIQUE(project_id,version), CHECK(jsonb_typeof(snapshot)='object')
);
CREATE UNIQUE INDEX publications_one_active_per_project ON publications(project_id) WHERE status='active';
CREATE TABLE saved_looks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 public_token_hash text NOT NULL UNIQUE CHECK(public_token_hash ~ '^[0-9A-Fa-f]{64}$'),
 outfit_id text, garment_ids jsonb NOT NULL, expires_at timestamptz, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), last_accessed_at timestamptz,
 FOREIGN KEY(project_id,outfit_id) REFERENCES outfits(project_id,id) ON DELETE SET NULL,
 CHECK(jsonb_typeof(garment_ids)='array')
);
CREATE INDEX garments_project_idx ON garments(project_id);
CREATE INDEX outfits_project_status_idx ON outfits(project_id,status);
CREATE INDEX jobs_claim_idx ON generation_jobs(status,available_at) WHERE status IN('queued','retrying');
CREATE INDEX assets_project_visibility_idx ON assets(project_id,visibility,status);
COMMIT;
