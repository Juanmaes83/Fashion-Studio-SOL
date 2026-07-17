# fashion-schema

Contrato de dominio de Fashion Studio SOL. **Una sola fuente canónica**, consumida
igual por Wardrobe, migrador, editor, exportador, tests y MIRRORA.

## Fuente canónica única

- **`ontology.json`** (v1.1.0) — vocabularios canónicos: `bodyArea` (slots),
  `category`, `garmentType`, `subcategoryByCategory`, `material`, `pattern`,
  `silhouette`, `fit`, `season`, `style`, `occasion`, `thermalWeight` (enteros 1–5),
  `outfitStatus`, `provenance`. Progresiva y **extensible**: los vocabularios pueden
  crecer (bump de versión), nunca reinterpretarse.
- **`validate.mjs`** — el ÚNICO validador (`validateGarment`, `validateOutfit`,
  `isPublishable`). Lo importan exportador, migrador y tests, y su lógica está
  replicada en la Studio API de wardrobe. Sin dependencias externas.

## Artefactos derivados (NO editar a mano)

- **`garment.schema.json`**, **`outfit.schema.json`** — JSON Schema generados desde
  `ontology.json` por `tools/build-schemas.mjs`. Existen para consumo externo; **no
  pueden contradecir** la ontología. CI lo garantiza con `build-schemas.mjs --check`.
- **`wardrobe/public/ontology.json`** — copia generada por `tools/sync-ontology.mjs`,
  servida por la Studio API. Marcada `_generatedFrom`.

Regenerar los derivados tras tocar la ontología:

```bash
node tools/build-schemas.mjs          # garment/outfit.schema.json
node tools/sync-ontology.mjs --wardrobe ../wardrobe   # copia de wardrobe
```

## Compatibilidad con datos históricos

Explícita, no accidental:
- `validateGarment` acepta registros legado (solo `part`, sin campos V1) — los campos
  V1 son opcionales.
- `part` (histórico de wardrobe) y `bodyArea` (V1) se espejan; ambos válidos.
- Valores desconocidos = campo **omitido** + `fieldProvenance[campo] = "unknown"`.
  Se distingue `unknown` / `not_applicable` / `ai_inferred` / `human_confirmed`.
- `tools/migrate-library-v1.mjs` migra a `garment/v0.2` sin tocar ids, imágenes ni
  relaciones; deja backup `library.pre-v1.json`; es idempotente.

## Cadena reproducible desde un clon limpio

Sin rutas personales ni datos privados. `npm test` ejecuta antes
`tools/prepare-test-data.mjs`, que genera un fixture sintético determinista
(`tmp/fixture-wardrobe`), lo migra y lo exporta (`tmp/fixture-catalog`), y luego
corre los tests contra esos artefactos repo-relativos.

```bash
npm test              # prepara fixtures + node --test (18 pruebas)
npm run check:schemas # falla si los JSON Schema divergen de la ontología
```

Los tests cubren: prenda válida/ inválida, subcategoría condicionada, valores
desconocidos, provenance, thermalWeight entero, compatibilidad legado, outfits
(refs inexistentes, conflictos de slot, estados), gate de publicación, sincronía de
schemas derivados, migración del fixture, catálogo exportado (solo publicables, refs
resueltas, imágenes presentes, sin el rechazado) y **fail-closed** del exportador
ante un outfit `approved` inválido.

## Pendiente honesto

- **Persistencia compartida = Fase 2** (hoy JSON local + localStorage; no definitivo).
- Generación/regeneración automática de imágenes y **QA visual automático** de
  outfits: pendientes (la QA de imágenes es humana).
