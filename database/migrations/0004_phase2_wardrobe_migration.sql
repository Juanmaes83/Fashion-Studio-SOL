-- Fashion Studio SOL — Phase 2E auditable Wardrobe migrations.
BEGIN;
CREATE TABLE migration_runs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id text NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 source_type text NOT NULL DEFAULT 'wardrobe-local' CHECK(source_type='wardrobe-local'),
 source_fingerprint text NOT NULL CHECK(source_fingerprint ~ '^[0-9A-Fa-f]{64}$'),
 status text NOT NULL CHECK(status IN('planned','running','completed','rolled_back','failed')),
 dry_run boolean NOT NULL DEFAULT false,
 inventory jsonb NOT NULL DEFAULT '{}',before_counts jsonb NOT NULL DEFAULT '{}',after_counts jsonb NOT NULL DEFAULT '{}',comparison jsonb NOT NULL DEFAULT '{}',
 error_message text,started_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,rolled_back_at timestamptz,
 CHECK(jsonb_typeof(inventory)='object'),CHECK(jsonb_typeof(before_counts)='object'),CHECK(jsonb_typeof(after_counts)='object'),CHECK(jsonb_typeof(comparison)='object')
);
CREATE UNIQUE INDEX migration_runs_active_fingerprint_idx ON migration_runs(project_id,source_fingerprint,dry_run) WHERE status IN('planned','running','completed');
CREATE TABLE migration_entities(
 run_id uuid NOT NULL REFERENCES migration_runs(id) ON DELETE CASCADE,
 entity_type text NOT NULL CHECK(entity_type IN('garment','outfit','asset')),entity_id text NOT NULL,
 action text NOT NULL CHECK(action IN('created','verified','skipped')),
 source_checksum text CHECK(source_checksum IS NULL OR source_checksum ~ '^[0-9A-Fa-f]{64}$'),target_checksum text CHECK(target_checksum IS NULL OR target_checksum ~ '^[0-9A-Fa-f]{64}$'),
 details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(run_id,entity_type,entity_id),CHECK(jsonb_typeof(details)='object')
);
CREATE INDEX migration_runs_project_idx ON migration_runs(project_id,started_at DESC);
CREATE INDEX migration_entities_action_idx ON migration_entities(run_id,action);
COMMIT;
