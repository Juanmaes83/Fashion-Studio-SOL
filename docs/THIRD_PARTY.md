# THIRD_PARTY — mapa de activos, upstream, licencias y decisión

Tabla definitiva de la Fase 0. Ningún activo entra en producción sin fila aquí.
Última revisión: 2026-07-13.

## Nivel A — núcleo

| Repo | Upstream | Licencia | Uso comercial | Decisión |
|---|---|---|---|---|
| `Juanmaes83/Fashion-Studio-SOL` | propio | — | — | Repositorio canónico e integrador |
| `Juanmaes83/wardrobe` | `tandpfun/wardrobe` | **MIT** (LICENSE presente) | ✅ con atribución | Wardrobe Core: ingesta/extracción/revisión. Mantener header MIT al modularizar |
| `Juanmaes83/MIRRORA-Style-Studio` | propio (esta línea de trabajo) | propia | ✅ | Consumer Experience Core + Brand Console. Dep vendorizada: `qrcode-generator` 1.4.4 (MIT, Kazuhiko Arase) |

## Nivel B — auxiliares utilizables (pendientes de auditoría de código; no clonados aún)

| Repo | Licencia declarada | Decisión provisional |
|---|---|---|
| `ai-closet` | MIT (upstream `zebangeth/ai-closet`) | Adaptar como `packages/ai-closet-engine`: contratos, mapeo, jobs y gateway. No copiar la app Expo completa ni exponer claves cliente |
| `aiclothswap-showcase` | por auditar | Solo prompts/QA/rúbrica → futuro `packages/prompt-qa`. No es el motor privado |
| `fashionAI` | MIT (código) | Extraer patrones puntuales (upload, before/after). No usar como base: prototipo derivado de RoomGPT |
| `gestalt` (Pinterest) | Apache 2.0 | Solo componentes selectivos; lenguaje visual propio |
| `llmd-flow-visualizer` | Apache 2.0 | Solo patrón visual para Operations Console |
| `clarity-upscaler` | **por auditar (riesgo)** | No integrar hasta auditar upstream; interfaz de proveedor aislado |

## Nivel C — investigación, NO producción

| Repo | Licencia | Decisión firme |
|---|---|---|
| `Magic-TryOn` | CC BY-NC-SA 4.0 | Solo I+D/benchmark. Ni código ni pesos en producto comercial |
| `IMAGDressing` | código permisivo, checkpoints no comerciales | Referencia de arquitectura/métricas. Checkpoints prohibidos en producción |
| `AI_Fashion_Cloth_Changer` | pendiente | Referencia histórica. No integrar |
| `deepchange` | dataset no comercial restringido | **No integrar.** |

## Referencias externas del ecosistema MIRRORA (heredadas y ya decididas)

| Activo | Licencia | Decisión |
|---|---|---|
| CatVTON | CC BY-NC-SA 4.0 | Solo prototipo no comercial; try-on comercial vía gateway con proveedor licenciado |
| OOTDiffusion | CC BY-NC-SA 4.0 | Ídem |
| MediaPipe Tasks | Apache 2.0 | Interacción/encuadre en dispositivo. Nunca presentarlo como biometría ni prueba de talla |
| OpenAI API (gpt-5.4-mini / gpt-image-2) | términos comerciales OpenAI | Motor actual de wardrobe. Coste por job: registrar en Operations Console (Fase 2) |
