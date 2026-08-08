# ADR 0002 — Persistencia compartida y pipeline profesional

- Estado: Propuesta para Fase 2A
- Fecha: 2026-07-17
- Propietario: Fashion Studio SOL

## Contexto

Wardrobe usa JSON y filesystem local; MIRRORA usa catálogo exportado y localStorage; la Studio API vive en Vite. Esto impide una única fuente de verdad, recuperación de jobs, publicación sin copia manual y handoff real entre dispositivos.

## Decisión propuesta

Usar una arquitectura modular monolítica con:

1. PostgreSQL como fuente de verdad relacional.
2. Storage S3-compatible para assets privados, internos y públicos.
3. Un servicio `platform-api` desplegable, propietario de escritura, validación, publicación y SavedLook.
4. Un worker persistente para jobs asíncronos con leasing, reintentos e idempotencia.
5. Fashion Studio SOL mantiene el contrato canónico (`fashion-schema`).
6. Wardrobe y MIRRORA pasan a ser clientes del mismo dominio, no propietarios de copias.

La implementación concreta puede usar Supabase o PostgreSQL+Railway+storage compatible. La decisión del proveedor queda bloqueada hasta comparar coste real, credenciales disponibles y despliegue, pero el contrato técnico no dependerá de extensiones propietarias.

## Alternativas evaluadas

### Supabase

Ventajas: PostgreSQL gestionado, storage, auth, migraciones y rapidez de piloto.
Riesgos: acoplamiento a políticas/RLS y límites del plan; jobs largos requieren worker externo.

### Railway PostgreSQL + storage S3-compatible

Ventajas: control claro del backend y worker; despliegue sencillo del servicio Node.
Riesgos: más componentes y configuración; storage separado.

### Solo filesystem/JSON mejorado

Rechazado: no resuelve concurrencia, acceso multidispositivo, recuperación, publicación consistente ni despliegue horizontal.

### Microservicios independientes

Rechazado para el MVP: coste operativo y complejidad innecesarios.

## Principios

- Una fuente de verdad.
- IDs existentes preservados.
- Validación canónica y fail-closed.
- Escrituras administrativas protegidas.
- Assets privados nunca públicos por defecto.
- Publicación atómica y reversible.
- Jobs idempotentes, recuperables y observables.
- PostgreSQL estándar y storage intercambiable.

## Consecuencias

- JSON/localStorage quedan como importación, fixtures, caché o fallback, no como fuente principal.
- Wardrobe deja de escribir directamente en archivos.
- MIRRORA consume API pública o snapshot publicado.
- La Fase 5 podrá consumir marcas, productos, outfits y publicaciones sin conocer internals de Wardrobe.

## Decisiones pendientes que requieren confirmación externa

- Proveedor definitivo de PostgreSQL y storage.
- Región y presupuesto.
- Credenciales y dominios de preview.
- Política de expiración de SavedLook y assets privados.

No se crearán recursos de pago ni se desplegará sin autorización.