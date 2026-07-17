-- Fashion Studio SOL — Fase 2A
-- Migración canónica inicial de persistencia compartida.
-- No se ejecuta todavía en producción.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE asset_visibility AS ENUM ('private','internal','public');
CREATE TYPE asset_status AS ENUM ('pending','ready','failed','deleted');
CREATE TYPE outfit_status AS ENUM ('draft','review','approved','rejected','published');
CREATE TYPE job_status AS ENUM ('queued','processing','review','completed','failed','retrying','cancelled');
CREATE TYPE publication_status AS ENUM ('active','withdrawn');

CREATE TABLE workspaces (
  id