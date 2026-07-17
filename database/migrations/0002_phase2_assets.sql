-- Fashion Studio SOL — Phase 2C asset lifecycle.
BEGIN;

ALTER TABLE assets
  ADD COLUMN original_filename text,
  ADD COLUMN idempotency_key text,
  ADD COLUMN upload_expires_at timestamptz,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE assets ADD CONSTRAINT assets_original_filename_safe CHECK (
  original_filename IS NULL OR (
    length(original_filename) BETWEEN 1 AND 255
    AND original_filename !~ '[\\/]'
    AND original_filename !~ '[[:cntrl:]]'
  )
);
ALTER TABLE assets ADD CONSTRAINT assets_upload_expiry_required CHECK (
  status <> 'pending' OR upload_expires_at IS NOT NULL
);
ALTER TABLE assets ADD CONSTRAINT assets_ready_completed CHECK (
  status <> 'ready' OR completed_at IS NOT NULL
);
ALTER TABLE assets ADD CONSTRAINT assets_deleted_timestamp CHECK (
  status <> 'deleted' OR deleted_at IS NOT NULL
);
ALTER TABLE assets ADD CONSTRAINT assets_storage_key_safe CHECK (
  storage_key !~ '(^|/)\.\.(/|$)' AND storage_key !~ '^/' AND storage_key !~ '\\'
);

CREATE UNIQUE INDEX assets_project_idempotency_idx
  ON assets(project_id,idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status <> 'deleted';
CREATE INDEX assets_pending_expiry_idx
  ON assets(upload_expires_at)
  WHERE status='pending';

COMMIT;
