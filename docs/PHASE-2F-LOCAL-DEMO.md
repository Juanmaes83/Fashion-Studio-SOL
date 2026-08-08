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

En `/studio`, pulsar **Aprobar y publicar**. La acción aprueba outfits, promociona assets y crea una nueva publicación disponible en `/public/projects/sol-store/catalog`.

Cada publicación exitosa incrementa la versión activa; las anteriores pasan a `withdrawn` y dejan de servirse. El catálogo público solo expone la versión `active` más reciente.

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

## Estado validado localmente (2026-07-20)

Esta demostración se ejecutó de extremo a extremo con datos y proveedor reales, no solo con fixtures:

- 6 prendas, 5 outfits y **16 assets** persistidos en PostgreSQL + storage compartido.
- 1 job real contra OpenAI completado: `generate_outfit_editorial` para el outfit **Office Crisp**, que ahora muestra su imagen editorial generada.
- **Denim Shirt Day** permanece en estado `REJECTED` (rechazo esperado, no un fallo de la plataforma).
- Publicación segura del catálogo: **v4 quedó `active`**; v1, v2 y v3 quedaron `withdrawn`. El catálogo público en `/public/projects/sol-store/catalog` sirve v4 correctamente.
- MIRRORA fue validado **visualmente** contra el catálogo real (no un mock): navegación, Looks y datos reales visibles en la experiencia pública.
- Wardrobe en modo plataforma (API MODE) funcionando contra la API compartida, sin JSON local.

Nota: las URLs de esta demo son las de un entorno local (`localhost`/IP LAN). Si una URL documentada aquí no coincide con la que se usó para validar, no se debe tratar como criterio de fallo — la validación de URL pública externa es responsabilidad de la Fase 2G, no de esta fase.

## Pendiente para Fase 2G

Esta fase (2F) valida el flujo completo **en local**. Queda pendiente para 2G, sin bloquear este PR:

- Despliegue externo de la API, worker y MIRRORA (fuera de `localhost`).
- Base de datos y storage en un proveedor cloud (no disco local).
- Gestión segura de variables (`OPENAI_API_KEY`, `ADMIN_API_TOKEN`, `STORAGE_SIGNING_SECRET`) fuera de `.env` local.
- Configuración de CORS/`ALLOWED_ORIGINS` para dominios reales.
- Dominio o URL de preview pública para MIRRORA y el catálogo.
- Worker ejecutándose en el entorno cloud (no como proceso local).
- Confirmación de que las llamadas a OpenAI funcionan igual en el entorno externo.
- QA multidispositivo real (no solo LAN) para MIRRORA, SavedLook y QR.
- Auditoría final (checks, diff, secretos, smoke test) antes de cualquier merge.
