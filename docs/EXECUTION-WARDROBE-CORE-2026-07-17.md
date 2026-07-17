# Ejecución real del Wardrobe Core — 2026-07-17

Prueba de extremo a extremo del pipeline real con activos sintéticos controlados
(Opción B aprobada por el usuario). Sin datos simulados: cada etapa ejecutó su
proveedor real.

## Proveedores por etapa

| Etapa | Proveedor real | Modelo |
|---|---|---|
| Activos fuente (modelo ficticio + 6 prendas) | Higgsfield | `soul_2` (2K) y `nano_banana_pro` (1K) |
| Detección de prendas + bounding boxes + metadatos | OpenAI (Responses API vía wardrobe) | `gpt-5.4-mini` |
| Crop | wardrobe (sharp, local) | — |
| Reconstrucción de prenda + chroma/limpieza | OpenAI vía wardrobe | `gpt-image-2` |
| Imagen editorial (modeled) con identidad | OpenAI vía wardrobe | `gpt-image-2` |
| Outfits (foto editorial por look) | OpenAI (images/edits directo, plantilla oficial de la skill) | `gpt-image-2` |

## Números

- Activos Higgsfield generados: **15** (1 modelo + 14 prendas en 3 tandas). Aprobados: 7. Rechazados y archivados: **8** (etiquetas de marca inventadas con texto corrupto; causa raíz: el meta-token de cámara "Phase One" se filtraba como etiqueta; `soul_2` reincidió pese a prohibición explícita; se resolvió cambiando a `nano_banana_pro`). Coste ≈ 2 créditos (~0,24 €; saldo 987 → plan Ultimate).
- Jobs de import reales: **7** creados desde 6 fotos (la detección separó el par de zapatillas y una zapatilla suelta → duplicado rechazado en revisión de crop). 
- Crops aprobados: 6/6 válidos.
- Reconstrucciones de prenda: 6/6 aprobadas a la primera (bordes limpios, sin texto inventado).
- Editoriales modeled: 5/6 a la primera; 1 fallo real **`Rate limit reached for gpt-image-2`** (cuenta API nueva, tier bajo) → regenerada con `regenerate` tras espera. Identidad consistente en todas.
- Outfits: 3 generados con IDs reales de prendas (ver `data/outfits.json`).

## Evidencia y rutas locales (no versionadas, en `wardrobe/data/`)

- `data/model-reference.png` — modelo ficticia de referencia.
- `data/seed-inputs/*.png` — fotos fuente aprobadas; `*.rechazada*-etiqueta.png` — evidencia de los 8 rechazos.
- `data/jobs/<id>/` — original, crop, garment-1.png (PNG alpha), modeled-1.png por job; `contact-garments.png` y `contact-modeled.png` — hojas de contacto de QA.
- `data/library.json` + `data/imported/` — biblioteca final (6 prendas).
- `data/outfits.json` + `data/outfit-images/` — outfits y sus editoriales.

## Deuda técnica registrada (no bloqueó la prueba)

1. **Extracción y generación modelada están acopladas**: `POST /api/import/jobs`
   exige `data/model-reference.png` aunque solo se quiera detectar y reconstruir
   prendas. En la modularización (`wardrobe-core` / `image-pipeline`), la referencia
   de identidad debe ser obligatoria únicamente para `modeled`/try-on.
2. La "API" del pipeline solo existe como middleware del dev server de Vite
   (no desplegable) — ya registrado en la auditoría, confirmado en ejecución.
3. Rate limits de `gpt-image-2` en tier bajo obligan a espaciar jobs; el futuro
   worker (Fase 2) necesita cola con reintentos y backoff (el `regenerate` manual
   funcionó como mitigación).
4. La detección puede emitir jobs duplicados por foto (par + unidad); la UI de
   revisión los absorbe, pero el schema debería deduplicar por solape de bounding box.

## Próximo bloqueo técnico real

Persistencia común (Fase 2): la biblioteca vive en JSON local del checkout de
wardrobe; MIRRORA consume el export por archivos (`tools/export-to-mirrora.mjs`).
Para que varias superficies editen el mismo catálogo hace falta la base de datos
y el storage de assets previstos (Supabase/Railway).
