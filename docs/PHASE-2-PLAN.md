# Fase 2 — Persistencia compartida y pipeline profesional

## Objetivo

Sustituir JSON/localStorage como fuentes principales por PostgreSQL + object storage + API compartida, preservando la semántica consolidada de Fashion Studio SOL.

## Alcance de esta rama (2A)

- ADR de arquitectura.
- Modelo relacional inicial.
- Contrato de API.
- Plan de migración y rollback.
- Contratos de jobs, publicación, assets y SavedLook.
- Tests automáticos de coherencia estructural.

No crea recursos externos, no despliega y no migra datos privados.

## Microfases

### 2A — Foundation

Arquitectura, esquema, API, seguridad, migración, tests y draft PR.

### 2B — Persistencia ejecutable

Servicio Node desplegable, acceso PostgreSQL, repositorios, transacciones, optimistic locking y autenticación administrativa mínima.

### 2C — Storage

Adapter S3-compatible, assets privados/internos/públicos, URLs firmadas, checksum, validación MIME/tamaño y limpieza de huérfanos.

### 2D — Jobs

Worker persistente con leasing, timeouts, backoff, reintentos, idempotencia, recuperación tras reinicio y métricas.

### 2E — Integración

Wardrobe escribe en la API; MIRRORA consume catálogo y SavedLook persistentes; publicación y retirada sin copiar archivos.

### 2F — Migración y preview

Migración real de 6 prendas y 5 outfits, storage de assets, despliegue externo, QR entre dispositivos y prueba E2E.

## Migración

1. Inventario en modo lectura.
2. Backup de JSON y assets con checksums.
3. Dry-run: normalización y validación canónica.
4. Inserción transaccional de workspace, brand, project y collection.
5. Inserción de garments conservando IDs.
6. Subida de assets con checksum y clasificación de visibilidad.
7. Inserción de outfits y outfit_items conservando relaciones.
8. Reconstrucción de historial útil.
9. Creación de primera publicación mediante el flujo normal.
10. Informe de conteos y referencias.
11. Segundo dry-run debe ser idempotente.
12. Solo tras aceptación: cambiar clientes a la nueva fuente.

## Rollback

- No borrar datos locales durante Fase 2.
- Cada migración produce manifest con origen, destino y checksum.
- La publicación usa snapshots versionados.
- La integración tendrá feature flag para volver temporalmente al catálogo exportado.
- Las migraciones destructivas requieren script inverso o backup restaurable probado.

## Seguridad mínima

- Escrituras protegidas por credencial administrativa de servidor.
- API pública de solo lectura.
- CORS explícito.
- Rate limiting.
- Payload y upload limits.
- MIME, extensión y magic bytes validados.
- Tokens SavedLook aleatorios; solo se guarda hash.
- Assets privados mediante URLs firmadas.
- Logs sin secretos ni respuestas completas de proveedores.

## Decisiones que requieren al usuario

Antes de 2B/2C/2F:

- proveedor de PostgreSQL;
- proveedor de object storage;
- región;
- presupuesto;
- dominios de preview;
- credenciales;
- política de expiración de SavedLook.

## Criterios de salida 2A

- ADR presente.
- SQL contiene integridad, jobs, assets, publicaciones y SavedLook.
- OpenAPI separa administración y público.
- Tests comprueban invariantes críticas.
- CI verde.
- Draft PR abierto y sin merge.