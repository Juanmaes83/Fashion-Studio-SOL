-- Fashion Studio SOL — Phase 2C asset lifecycle.
BEGIN;

ALTER TABLE assets
  ADD COLUMN original_filename text,
  ADD COLUMN idempotency_key text,
  ADD COLUMN upload_expires_at timestamptz,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN deleted_at timestamptz;

ALTER TABLE assets
  ADD CONSTRAINT assets_original_filename_safe CHECK (
    original_filename IS NULL OR (
      length(original_filename) BETWEEN 1 AND 255
      AND