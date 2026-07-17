-- Fashion Studio SOL — Phase 2D persistent jobs and recoverable workers.
BEGIN;
ALTER TABLE generation_jobs
 ADD COLUMN priority smallint NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 1000),
 ADD COLUMN lease_expires_at timestamptz,
 ADD COLUMN cancel_requested_at timestamptz,
 ADD COLUMN last_heartbeat_at timestamptz,
 ADD COLUMN progress smallint NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
 ADD COLUMN result_summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(result_summary)='object');
CREATE TABLE worker_heartbeats(
 worker_id text PRIMARY KEY,
 started_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 current_job_id uuid REFERENCES generation_jobs(id) ON DELETE SET NULL,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object')
);
CREATE TABLE job_events(
 id bigserial PRIMARY KEY,
 job_id uuid NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
 event_type text NOT NULL,
 from_status job_status,
 to_status job_status,
 actor text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(details)='object'),
 created_at timestamptz NOT NULL DEFAULT now()
);
DROP INDEX IF EXISTS jobs_claim_idx;
CREATE INDEX jobs_claim_idx ON generation_jobs(priority,available_at,created_at) WHERE status IN('queued','retrying');
CREATE INDEX jobs_stale_lease_idx ON generation_jobs(lease_expires_at) WHERE status='processing';
CREATE INDEX job_events_job_idx ON job_events(job_id,created_at DESC);
CREATE INDEX worker_heartbeats_seen_idx ON worker_heartbeats(last_seen_at DESC);
COMMIT;
