\set ON_ERROR_STOP on

BEGIN;

INSERT INTO workspaces (id, slug, name)
VALUES ('ws-test', 'test', 'Test Workspace');

INSERT INTO brands (id, workspace_id, slug, name)
VALUES ('brand-test', 'ws-test', 'test-brand', 'Test Brand');

INSERT INTO projects (id, workspace_id, brand_id, slug, name)
VALUES ('project-test', 'ws-test', 'brand-test', 'test-project', 'Test Project');

INSERT INTO collections (id, project_id, slug, name)
VALUES ('collection-test', 'project-test', 'test-collection', 'Test Collection');

INSERT INTO garments (
  id, project_id, collection_id, name, part, body_area, category,
  color, season, occasion, tags, field_provenance
) VALUES (
  'garment-top', 'project-test', 'collection-test', 'Top', 'upperbody', 'upperbody', 'tops',
  '#ffffff', '["all-season"]', '["casual"]', '["essential"]', '{"name":"human_confirmed"}'
), (
  'garment-bottom', 'project-test', 'collection-test', 'Bottom', 'lowerbody', 'lowerbody', 'bottoms',
  '#111111', '["all-season"]', '["casual"]', '[]', '{}'
);

INSERT INTO outfits (id, project_id, name, status)
VALUES ('outfit-test', 'project-test', 'Test Outfit', 'draft');

INSERT INTO outfit_items (project_id, outfit_id, garment_id, position)
VALUES
  ('project-test', 'outfit-test', 'garment-top', 0),
  ('project-test', 'outfit-test', 'garment-bottom', 1);

INSERT INTO assets (
  id, project_id, garment_id, kind, visibility, status,
  storage_key, mime_type, byte_size, checksum_sha256, width, height
) VALUES (
  '00000000-0000-0000-0000-000000000001', 'project-test', 'garment-top', 'reconstruction',
  'private', 'ready', 'projects/project-test/garments/garment-top/private.png',
  'image/png', 1024, repeat('a', 64), 512, 512
);

INSERT INTO generation_jobs (
  id, project_id, job_type, target_type, target_id, idempotency_key
) VALUES (
  '00000000-0000-0000-0000-000000000010', 'project-test', 'reconstruct_garment',
  'garment', 'garment-top', 'job-key-1'
);

INSERT INTO job_attempts (job_id, attempt_number, status, worker_id)
VALUES ('00000000-0000-0000-0000-000000000010', 1, 'processing', 'worker-test');

INSERT INTO publications (
  id, project_id, version, status, snapshot, checksum_sha256, published_by
) VALUES (
  '00000000-0000-0000-0000-000000000020', 'project-test', 1, 'active',
  '{"products":["garment-top"],"outfits":["outfit-test"]}', repeat('b', 64), 'test-suite'
);

INSERT INTO saved_looks (
  id, project_id, public_token_hash, outfit_id, garment_ids
) VALUES (
  '00000000-0000-0000-0000-000000000030', 'project-test', repeat('c', 64),
  'outfit-test', '["garment-top","garment-bottom"]'
);

DO $$
BEGIN
  IF (SELECT count(*) FROM garments WHERE project_id = 'project-test') <> 2 THEN
    RAISE EXCEPTION 'garment seed count mismatch';
  END IF;
  IF (SELECT count(*) FROM outfit_items WHERE outfit_id = 'outfit-test') <> 2 THEN
    RAISE EXCEPTION 'outfit relation count mismatch';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM publications WHERE project_id = 'project-test' AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'active publication missing';
  END IF;
END $$;

-- Idempotencia: una clave no puede crear dos jobs en el mismo proyecto.
DO $$
BEGIN
  BEGIN
    INSERT INTO generation_jobs (project_id, job_type, target_type, target_id, idempotency_key)
    VALUES ('project-test', 'reconstruct_garment', 'garment', 'garment-top', 'job-key-1');
    RAISE EXCEPTION 'duplicate idempotency key was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

-- Solo una publicación activa por proyecto.
DO $$
BEGIN
  BEGIN
    INSERT INTO publications (project_id, version, status, snapshot, checksum_sha256, published_by)
    VALUES ('project-test', 2, 'active', '{}', repeat('d', 64), 'test-suite');
    RAISE EXCEPTION 'second active publication was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

-- Tokens de SavedLook no repetibles.
DO $$
BEGIN
  BEGIN
    INSERT INTO saved_looks (project_id, public_token_hash, garment_ids)
    VALUES ('project-test', repeat('c', 64), '[]');
    RAISE EXCEPTION 'duplicate saved-look token was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;
END $$;

-- Integridad referencial: no se puede borrar una prenda usada por un outfit.
DO $$
BEGIN
  BEGIN
    DELETE FROM garments WHERE id = 'garment-top';
    RAISE EXCEPTION 'referenced garment deletion was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

-- Integridad de proyecto: un outfit no puede enlazar prendas de otro proyecto.
INSERT INTO projects (id, workspace_id, brand_id, slug, name)
VALUES ('project-other', 'ws-test', 'brand-test', 'other-project', 'Other Project');

INSERT INTO garments (id, project_id, name, part, body_area)
VALUES ('garment-other', 'project-other', 'Other Garment', 'upperbody', 'upperbody');

DO $$
BEGIN
  BEGIN
    INSERT INTO outfit_items (project_id, outfit_id, garment_id, position)
    VALUES ('project-test', 'outfit-test', 'garment-other', 2);
    RAISE EXCEPTION 'cross-project outfit relation was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

-- Restricciones básicas de assets y checksums.
DO $$
BEGIN
  BEGIN
    INSERT INTO assets (
      project_id, kind, visibility, status, storage_key,
      mime_type, byte_size, checksum_sha256
    ) VALUES (
      'project-test', 'broken', 'public', 'ready', 'broken',
      'image/png', -1, 'bad'
    );
    RAISE EXCEPTION 'invalid asset was accepted';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
END $$;

ROLLBACK;

SELECT 'phase2 foundation smoke tests: PASS' AS result;
