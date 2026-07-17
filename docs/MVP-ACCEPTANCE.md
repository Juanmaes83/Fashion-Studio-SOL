# Criterios de aceptación — primer vertical slice

Referencia: README maestro §15 y §21. Actualizado 2026-07-17 tras la ejecución real
del Wardrobe Core (ver EXECUTION-WARDROBE-CORE-2026-07-17.md).

**Distinción de estados:** pipeline técnico real = VALIDADO con activos sintéticos;
integración MIRRORA = hecha en preview (rama feat/wardrobe-catalog, draft PR #1);
catálogo comercial real (fotos de marca) = pendiente; validación con cliente = pendiente.

| # | Paso del slice | Criterio verificable | Estado |
|---|---|---|---|
| 1 | Crear proyecto | Existe paquete de catálogo con `brandId`/`projectId` | ✅ vía `tools/export-to-mirrora.mjs` |
| 2 | Subir foto con varias prendas | Job de import creado en wardrobe (`data/jobs/`) | ✅ ejecutado (7 jobs desde 6 fotos) |
| 3 | Detectar prendas | Bounding boxes + crops propuestos | ✅ ejecutado (gpt-5.4-mini) |
| 4 | Aprobar PNG transparente | PNG con alpha validado | ✅ 6/6 reconstruidas y aprobadas (gpt-image-2) |
| 5 | Editar metadatos | Drawer de wardrobe permite nombre/categoría/colores/tags | ✅ existente en wardrobe |
| 6 | Crear o importar outfit | `data/outfits.json` conforme a schema | ✅ 3 outfits reales generados y aceptados |
| 7 | Relacionar outfit-productos | `garmentIds` resuelven contra `library.json` (validado por el export) | ✅ implementado |
| 8 | Seleccionar plantilla / marca | Consola MIRRORA: tema, identidad, catálogo activo | ✅ existente |
| 9 | Mostrar prenda y outfit en una web | Storefront MIRRORA renderiza catálogo externo con imágenes | ✅ implementado en esta fase |
| 10 | Publicar preview | URL pública (GitHub Pages) responsive desktop/tablet/móvil | ✅ https://juanmaes83.github.io/MIRRORA-Style-Studio/ |
| 11 | Medir interacción | Funnel local: `seleccion`, `look_guardado`, `carrito_click`… | ✅ existente (endpoint remoto = Fase 2) |

**Slice técnico completo demostrado** (2026-07-17) con activos sintéticos procesados
por el pipeline real. Defectos conocidos no bloqueantes: el blazer se clasificó
`upperbody` (debería ser `wholebody_up`); las imágenes exportadas van a tamaño
completo (1-2 MB) y conviene redimensionarlas en el exportador antes de producción.

**Fuera del MVP (no criterios):** SaaS, facturación, clima, telas, vídeo try-on,
simulación de fit.
