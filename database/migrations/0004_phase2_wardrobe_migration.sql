-- Fashion Studio SOL — Phase 2E auditable Wardrobe migrations.
BEGIN;

CREATE TABLE migration_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 source_type text NOT NULL DEFAULT 'wardrobe-local' CHECK(source_type IN('wardrobe-local')),
 source_fingerprint text NOT NULL CHECK(source_fingerprint ~ '^[0-9A-Fa-f]{64}$'),