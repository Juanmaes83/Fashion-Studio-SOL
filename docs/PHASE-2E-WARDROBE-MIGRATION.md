# Fase 2E — Migración local verificable de Wardrobe

Los datos reales de Wardrobe viven en `wardrobe/data/` y están excluidos por `.gitignore`. No deben subirse a GitHub.

## Garantías

- inventario y checksums antes de escribir;
- validación mediante la ontología canónica;
- conservación de IDs de prendas y outfits;
- assets con IDs deterministas y checksum SHA-256;
- dry-run sin mutaciones de dominio;
- aplicación fail-closed: un conflicto detiene toda la transacción;
- segunda aplicación idempotente;
- comparación de conteos antes/después;
- rollback limitado a entidades creadas por esa ejecución;
- informes JSON sin claves ni contenido binario.

## Requisitos locales

- checkout de la rama `phase-2/persistence-foundation`;
- PostgreSQL con migraciones `0001` a `0004`;
- `DATABASE_URL`;
- `STORAGE_ROOT`;
- ruta real de `wardrobe/data/`;
- proyecto destino existente, por defecto `project-sol`.

## Ejecución

```powershell
$env:DATABASE_URL='postgresql://...'
$env:STORAGE_ROOT='C:\ruta\fashion-storage'
$env:WARDROBE_DATA_DIR='C:\Users\temp123\repos\wardrobe\data'
$env:MIGRATION_PROJECT_ID='project-sol'

npm install
npm run migration:inventory
npm run migration:dry-run
npm run migration:apply
```

Revisar los informes en `tmp/wardrobe-migration-*.json` antes de continuar con la integración de frontend.

## Rollback

Tomar `result.runId` del informe de aplicación:

```powershell
npm run migration:rollback -- --run-id UUID-DE-LA-EJECUCION
```

El rollback no elimina registros que ya existían antes de la migración ni entidades marcadas como `verified`.

## Worker OpenAI

Los handlers reales se activan solo cuando existe `OPENAI_API_KEY`. Tipos conectados:

- `wardrobe_detect`;
- `reconstruct_garment`;
- `model_garment`;
- `generate_outfit_editorial`.

Sin clave, el worker conserva únicamente los handlers deterministas de prueba. GitHub Actions no consume créditos ni llama a OpenAI.
