# Criterios de aceptación — primer vertical slice

Referencia: README maestro §15 y §21. Estado marcado a 2026-07-13.

| # | Paso del slice | Criterio verificable | Estado |
|---|---|---|---|
| 1 | Crear proyecto | Existe paquete de catálogo con `brandId`/`projectId` | ✅ vía `tools/export-to-mirrora.mjs` |
| 2 | Subir foto con varias prendas | Job de import creado en wardrobe (`data/import-jobs/`) | ⛔ requiere `OPENAI_API_KEY` + presupuesto |
| 3 | Detectar prendas | Bounding boxes + crops propuestos | ⛔ ídem |
| 4 | Aprobar PNG transparente | PNG con alpha validado (validación ya implementada en skill) | ⛔ ídem (validador ✅ existe) |
| 5 | Editar metadatos | Drawer de wardrobe permite nombre/categoría/colores/tags | ✅ existente en wardrobe |
| 6 | Crear o importar outfit | `data/outfits.json` conforme a schema (skill o manual) | ✅ manual/fixtures; skill ⛔ sin key |
| 7 | Relacionar outfit-productos | `garmentIds` resuelven contra `library.json` (validado por el export) | ✅ implementado |
| 8 | Seleccionar plantilla / marca | Consola MIRRORA: tema, identidad, catálogo activo | ✅ existente |
| 9 | Mostrar prenda y outfit en una web | Storefront MIRRORA renderiza catálogo externo con imágenes | ✅ implementado en esta fase |
| 10 | Publicar preview | URL pública (GitHub Pages) responsive desktop/tablet/móvil | ✅ https://juanmaes83.github.io/MIRRORA-Style-Studio/ |
| 11 | Medir interacción | Funnel local: `seleccion`, `look_guardado`, `carrito_click`… | ✅ existente (endpoint remoto = Fase 2) |

**Definición de hecho del slice completo:** los pasos 2–4 se demuestran con una foto
real en cuanto haya API key; el resto del recorrido ya es demostrable de extremo a
extremo sin explicación técnica externa.

**Fuera del MVP (no criterios):** SaaS, facturación, clima, telas, vídeo try-on,
simulación de fit.
