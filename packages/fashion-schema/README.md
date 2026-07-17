# fashion-schema v0.1

Contrato común de datos (ADR 0001). Derivado de los contratos **reales** verificados:
`wardrobe/data/library.json` (prenda) y `wardrobe/data/outfits.json` (outfit).
La ontología V1 del README maestro entra como campos opcionales.

- `garment.schema.json` — prenda (`Garment`)
- `outfit.schema.json` — outfit (`Outfit`)

Validación en esta fase: ligera, integrada en `tools/export-to-mirrora.mjs`
(campos obligatorios, enums, hex, resolución de `garmentIds` y assets).
Zod/ajv + tests entran en Fase 3 según roadmap.

## Uso del slice (sin coste de API)

```bash
node tools/make-demo-fixtures.mjs
node tools/export-to-mirrora.mjs --wardrobe examples/demo-wardrobe \
  --out dist/mirrora-catalog --brand maison-demo --campaign ss26-real --price 120
```

Con un checkout real de wardrobe (tras importar con `OPENAI_API_KEY`):

```bash
node tools/export-to-mirrora.mjs --wardrobe ../wardrobe --out dist/mirrora-catalog
```

El paquete resultante (`catalog.json` + `images/`) se copia a `MIRRORA-Style-Studio/catalog/`
y la PWA lo carga automáticamente (fallback: catálogo SVG demo).
