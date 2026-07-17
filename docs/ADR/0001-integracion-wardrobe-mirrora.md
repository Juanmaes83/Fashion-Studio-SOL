# ADR 0001 — Integración Wardrobe ↔ MIRRORA (Fase 1)

**Estado:** aprobado en esta rama · 2026-07-13

## Contexto

Wardrobe (ingesta de prendas, `data/library.json` + PNGs) y MIRRORA (storefront PWA +
consola de marca, catálogo SVG hardcodeado, localStorage) no comparten datos. El
criterio de salida de Fase 1 del README maestro: *"una prenda aprobada en Wardrobe
puede aparecer en el catálogo MIRRORA sin duplicar datos manualmente"*.

No existe aún backend común (Fase 2). Cualquier integración de Fase 1 debe funcionar
con archivos.

## Decisión

1. **`fashion-schema` v0.1 nace como JSON Schema puro** (`packages/fashion-schema/`),
   derivado de los contratos REALES verificados de wardrobe (library/outfits), no de la
   ontología ideal. La ontología V1 completa del README (material, silhouette, season…)
   entra como campos opcionales para no bloquear datos existentes.
2. **La integración Fase 1 es un export unidireccional por archivos**:
   `tools/export-to-mirrora.mjs` lee `data/library.json` + `data/outfits.json` de un
   checkout de wardrobe, valida contra el schema, y emite un **paquete de catálogo
   MIRRORA** (`catalog.json` + copias de PNGs) que la PWA carga por `fetch`.
   Sin base de datos, sin servidor nuevo, reversible y auditable.
3. **MIRRORA gana soporte de catálogo externo con imágenes** manteniendo el catálogo
   SVG demo como fallback si no hay `catalog/catalog.json`. Ambas experiencias siguen
   ejecutables (regla 11 del README maestro).
4. Los IDs de wardrobe (`import-<uuid>`) **se conservan tal cual** en MIRRORA como
   `productId` — normalización de IDs sin traducción intermedia.
5. La dirección inversa (looks guardados en MIRRORA → outfits en wardrobe) queda para
   Fase 4 (Outfit Layer) sobre persistencia común de Fase 2.

## Alternativas descartadas

- **Backend compartido ya**: es Fase 2; hacerlo ahora viola "cambios pequeños y
  verificables" y bloquea la demo del slice.
- **Copiar el código de wardrobe dentro de MIRRORA**: riesgo 17.9 (deuda por fusionar
  prototipos); los límites módulo/contrato aún no están definidos.
- **Monorepo ya**: la estructura objetivo (§6) se materializará cuando haya ≥2 módulos
  reales que compartir; hoy solo hay schema + tool.

## Consecuencias

- El catálogo MIRRORA pasa a ser dato, no código → la consola de marca podrá
  importarlo/activarlo (ya activa/desactiva productos por id).
- El slice es demostrable sin coste de API usando fixtures del schema; los pasos IA
  (detección/reconstrucción) se demuestran cuando haya `OPENAI_API_KEY` y presupuesto.
- `fashion-schema` es el primer paquete del monorepo objetivo y el punto de anclaje
  de la Fase 2 (misma forma en DB).
