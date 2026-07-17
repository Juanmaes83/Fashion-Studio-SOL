# Consolidación Fases 3-4 — matriz de aceptación (2026-07-17)

Cadena verificable: **ontología canónica → migración → edición → validación →
creación/revisión de outfits → publicación controlada → exportación → MIRRORA →
tests → CI externo**. Reproducible desde un clon limpio.

| # | Criterio | Estado | Evidencia |
|---|---|:---:|---|
| 1 | Fuente canónica inequívoca | PASS | `packages/fashion-schema/ontology.json` v1.1.0 + `validate.mjs` únicos; importados por exportador, migrador, tests; replicados en Studio API |
| 2 | Contratos activos compatibles con ella | PASS | `garment/outfit.schema.json` **generados** por `build-schemas.mjs`; `--check` en CI impide divergencia |
| 3 | Compatibilidad histórica demostrada | PASS | test "registro legado valida"; `part`↔`bodyArea` espejados; `unknown`/`ai_inferred`/`human_confirmed` |
| 4 | 6 prendas migran sin perder id/assets/relaciones/clasificación/procedencia | PASS | `migrate-library-v1.mjs`; backup `library.pre-v1.json`; test de fixture migrado |
| 5 | Editor usa vocabularios canónicos | PASS | `wardrobe/studio.html` carga `/api/studio/ontology` (copia generada) |
| 6 | Modificación humana ≠ inferencia ≠ desconocido | PASS | `fieldProvenance`; PATCH marca `human_confirmed`; puntos de color en el editor |
| 7 | Outfits: crear/importar/editar/revisar/publicar según contrato | PASS | Studio API + `studio.html`; probado approve/reject/publish/manifest |
| 8 | Ningún outfit inválido llega a MIRRORA por vía alternativa | PASS | exportador ejecuta `validateOutfit` íntegro; test **fail-closed** (approved+conflicto → exit 1) |
| 9 | Solo estados publicables en catálogo | PASS | `isPublishable` gate; `skippedUnpublishable`; test "rechazado ausente" |
| 10 | Exportación conserva relaciones válidas | PASS | test "refs resueltas + imágenes presentes"; MIRRORA 0 refs rotas |
| 11 | MIRRORA no reinterpreta los datos | PASS | consume `catalog.json` (mismo `part`/`category`); CI de coherencia en MIRRORA |
| 12 | Clon limpio ejecuta el flujo | PASS | `prepare-test-data.mjs` genera fixture determinista; sin rutas personales (grep limpio) |
| 13 | Tests sin rutas/datos privados | PASS | `tests/unit/ontology.test.mjs` repo-relativo; `data/` privado no requerido |
| 14 | Comprobación externa satisfactoria | PASS | GitHub Actions **success** en los 3 repos |
| 15 | Docs/PRs reflejan el estado real | PASS | `fashion-schema/README.md`, este doc, `MVP-ACCEPTANCE.md`, PRs |
| 16 | Persistencia compartida = Fase 2 pendiente | PASS (honesto) | declarado en README y este doc |
| 17 | Generación/QA visual automático pendientes | PASS (honesto) | declarado; la QA de imágenes es humana |

## Limitaciones reales que permanecen

- **Fase 2 (persistencia compartida)**: JSON local + localStorage siguen siendo la
  persistencia; no es la solución definitiva.
- **QA visual automático de imágenes/outfits**: no existe; la revisión es humana.
- **Generación/regeneración automática**: fuera de alcance de esta consolidación.
- `studio.html` opera sobre el dev server de wardrobe (Fase 2 lo hará servicio).
- La Ontología V1.1 es un subconjunto **extensible** (p. ej. `smart-casual` se añadió
  a `occasion` al detectarlo en datos reales), no la taxonomía mundial de moda.
