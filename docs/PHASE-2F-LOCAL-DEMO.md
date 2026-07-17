# Fase 2F — Demostración visual local

## URLs

- Plataforma: `http://localhost:8787/studio`
- Operaciones: `http://localhost:8787/ops`
- Wardrobe: `http://localhost:5173/?platform=1`
- MIRRORA: `http://localhost:4180/platform.html?api=http://127.0.0.1:8787&project=sol-store`

## API compartida

Desde el repositorio Fashion Studio SOL, definir `DATABASE_URL`, `STORAGE_ROOT`, `ADMIN_API_TOKEN`, `STORAGE_SIGNING_SECRET`, `ALLOWED_ORIGINS` y ejecutar `npm run api:start`.

`ALLOWED_ORIGINS` debe incluir `http://localhost:5173,http://localhost:4180`.

## Wardrobe

Cambiar a `phase-2f/platform-integration`, instalar dependencias, definir `PLATFORM_API_URL=http://127.0.0.1:8787` y ejecutar `npm run dev`.

Abrir la URL Wardrobe indicada arriba e introducir el token administrativo definido para la API.

## Publicación

En `/studio`, pulsar **Aprobar y publicar**. La acción aprueba outfits, promociona assets y crea una publicación `catalog/v2` disponible en `/public/projects/sol-store/catalog`.

## MIRRORA

Cambiar a `phase-2f/platform-integration`, instalar dependencias y ejecutar `npm run dev`.

MIRRORA consume el catálogo activo directamente. No usa exportación manual.

## SavedLooks y QR

Seleccionar prendas, abrir **Mi look** y pulsar **Guardar y generar QR**. El servidor guarda un token no reversible y la URL recupera la composición desde PostgreSQL.

En otro navegador del mismo ordenador funciona directamente. Para un móvil en la misma red, sustituir `127.0.0.1` por la IPv4 local del ordenador. La validación mediante URL externa pertenece a la Fase 2G.

## Criterio de éxito

- Wardrobe muestra 6 prendas y 5 outfits desde PostgreSQL.
- Las imágenes proceden del storage compartido.
- Los cambios persisten tras recarga.
- Los jobs muestran estado y progreso.
- MIRRORA recibe el catálogo sin copiar JSON.
- SavedLook se abre desde otro navegador mediante el QR.
