# Contrato de API — Fase 2A

Estado: diseño ejecutable, pendiente de implementación y despliegue.

## Principios

- `/admin/*`: escritura protegida; nunca accesible sin autenticación de piloto.
- `/public/*`: solo lectura; nunca devuelve borradores, rechazados, datos internos ni assets privados.
- Validación de prendas y outfits mediante `packages/fashion-schema/validate.mjs`.
- Escrituras con `If-Match` o versión esperada para evitar sobrescrituras silenciosas.
- Operaciones reintentables con `Idempotency-Key`.
- Cada respuesta incluye `x-request-id`.

## Salud

- `GET /health` — proceso vivo.
- `GET /ready` — base de datos y storage disponibles.
- `GET /version` — commit, schema y versión del contrato.

## Administración

### Proyectos y colecciones

- `GET /admin/projects`
- `GET /admin/projects/{projectId}`
- `GET /admin/projects/{projectId}/collections`

### Prendas

- `GET /admin/projects/{projectId}/garments`
- `GET /admin/projects/{projectId}/garments/{garmentId}`
- `POST /admin/projects/{projectId}/garments`
- `PATCH /admin/projects/{projectId}/garments/{garmentId}`

Las mutaciones deben preservar IDs existentes y rechazar datos fuera del contrato canónico.

### Outfits

- `GET /admin/projects/{projectId}/outfits`
- `POST /admin/projects/{projectId}/outfits` — siempre crea `draft`, aunque llegue otro estado.
- `PATCH /admin/projects/{projectId}/outfits/{outfitId}`
- `POST /admin/projects/{projectId}/outfits/{outfitId}/transitions`

Payload de transición:

```json
{ "action": "submit|approve|reject|draft|publish", "note": "opcional" }
```

La transición usa exclusivamente `reviewTransition` del contrato canónico.

### Assets

- `POST /admin/projects/{projectId}/assets/upload-intent`
- `POST /admin/projects/{projectId}/assets/{assetId}/complete`
- `GET /admin/projects/{projectId}/assets/{assetId}`
- `DELETE /admin/projects/{projectId}/assets/{assetId}`

La API decide visibilidad y storage key; el cliente no puede convertir un asset privado en público directamente.

### Jobs

- `POST /admin/projects/{projectId}/jobs`
- `GET /admin/projects/{projectId}/jobs`
- `GET /admin/projects/{projectId}/jobs/{jobId}`
- `POST /admin/projects/{projectId}/jobs/{jobId}/retry`
- `POST /admin/projects/{projectId}/jobs/{jobId}/cancel`

Crear y reintentar requiere `Idempotency-Key`. Las respuestas de proveedores se normalizan y nunca se exponen completas.

### Publicación

- `POST /admin/projects/{projectId}/publications`
- `GET /admin/projects/{projectId}/publications`
- `POST /admin/projects/{projectId}/publications/{publicationId}/withdraw`
- `POST /admin/projects/{projectId}/publications/{publicationId}/restore`

Publicar crea un snapshot atómico e inmutable. Solo contiene prendas y outfits válidos y publicables.

## API pública

- `GET /public/projects/{projectSlug}/catalog`
- `GET /public/projects/{projectSlug}/catalog/products/{garmentId}`
- `GET /public/projects/{projectSlug}/catalog/outfits/{outfitId}`

Debe servir la publicación activa, no tablas internas directamente.

## SavedLook compartible

- `POST /public/projects/{projectSlug}/saved-looks`
- `GET /public/saved-looks/{opaqueToken}`
- `DELETE /admin/projects/{projectId}/saved-looks/{savedLookId}`

Reglas:

- Token aleatorio no predecible; en base de datos solo se guarda su hash.
- El look conserva referencias exactas a prendas válidas.
- Puede expirar o revocarse.
- Una referencia retirada se devuelve con estado seguro y sin datos privados.
- No depende de localStorage; este puede actuar únicamente como caché.

## Errores

Formato común:

```json
{
  "error": {
    "code": "OUTFIT_INVALID",
    "message": "Descripción segura",
    "requestId": "...",
    "details": []
  }
}
```

Nunca incluir stack traces, secretos, rutas del servidor o respuestas sin filtrar de proveedores.
