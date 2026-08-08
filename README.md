# Fashion Studio SOL

> Plataforma de inteligencia, creación, consistencia visual, personalización y publicación para moda.
>
> Este README es el **documento maestro de continuidad** del proyecto. Debe permitir que una nueva sesión, desarrollador o agente de IA entienda qué estamos construyendo, qué existe realmente, qué está fusionado, qué vive todavía en ramas Draft, qué papel tiene cada repositorio y cuál es la siguiente prioridad sin depender de conversaciones anteriores.

---

## Estado del proyecto — 2026-08-08

> **Regla de lectura:** `implementado en una rama/PR` no significa `cerrado en main`. Este documento distingue expresamente entre trabajo consolidado y trabajo todavía pendiente de validación o merge.

| Área / fase | Estado verificable a 2026-08-08 |
|---|---|
| **Fase 0 — Consolidación documental y auditoría** | ✅ Cerrada y fusionada en `main` (PR #2). Auditoría, terceros y ADR de integración disponibles. |
| **Fase 1 — Foundation Wardrobe → MIRRORA** | ✅ Cerrada y fusionada. Pipeline Wardrobe validado, `fashion-schema`, exportador y catálogo real en MIRRORA. |
| **Fase 2 — Persistencia y pipeline profesional** | 🟠 **2A–2F implementadas en PR #3 Draft** (`phase-2/persistence-foundation`). PostgreSQL, API, storage, jobs, worker, migración, `/ops`, `/studio`, publicación y catálogo v2 existen en esa rama. **2G, validación real y consolidación en `main` siguen pendientes.** |
| **Fase 3 — Ontología V1** | ✅ Cerrada y consolidada. Contrato canónico y validación fail-closed. |
| **Fase 4 — Outfit Layer** | ✅ Cerrada en su núcleo: creación, revisión, aprobación y publicación sobre contrato canónico. |
| **AI Closet** | 🟢 Contratos de Fashion Studio SOL fusionados (PR #4). MIRRORA tiene gateway y canvas real fusionados (PR #4 y #5). 🟠 AI Bridge / background removal real continúa en MIRRORA PR #6 Draft. |
| **Fase 4B — Pose Library & Model Consistency Engine** | 🟠 Documentación, datos, prompts, JSON Schema e integridad implementados y validados en Fashion Studio SOL PR #6 Draft. Runtime/UI/generación todavía pendientes. |
| **Wearly — Fit Intelligence + Fit-Aware Virtual Try-On** | 🟢 Repositorio propio funcional y **arquitectura oficialmente incorporada al ecosistema** mediante Fashion Studio SOL PR #7, ya fusionada. 🟠 Integración de runtime Wardrobe/Fashion Schema → Wearly → MIRRORA pendiente. |
| **Brand Acquisition & Spec Campaign Engine** | 🧭 Arquitectura documentada en PR #5 Draft. Depende de Fase 2 y no sustituye la prioridad técnica inmediata. Runtime no iniciado. |
| **Fase 5 — Website Builder MVP** | ⚪ No iniciada como implementación. Alcance y secciones definidos; falta elegir una base modular y construirla. |
| **Fase 6 — Publishing + validación comercial** | ⚪ No cerrada como fase integrada. Existen piezas de preview/deploy en repositorios, pero no el loop completo Fashion Studio → Publish → cliente real. |
| **Fase 7 — Try-On Gateway** | 🟡 Tecnología base muy adelantada gracias a Wearly y AI Closet, pero gateway canónico, jobs comunes, consentimiento/purge y conexión MIRRORA todavía no están cerrados. |
| **Fase 8 — SaaS** | ⚪ No iniciada. |
| **Fase 9 — Weather Intelligence** | ⚪ No iniciada. |
| **Fase 10 — Dynamic Fabric Engine** | ⚪ No iniciada como módulo de producto. |

### Pull requests abiertos que forman parte del estado actual

- **Fashion Studio SOL PR #3** — `phase-2/persistence-foundation` → `main`: Fase 2A–2F, todavía Draft.
- **Fashion Studio SOL PR #5** — Brand Acquisition & Spec Campaign Engine: Draft y dependiente de Fase 2.
- **Fashion Studio SOL PR #6** — Pose Library & Model Consistency Engine: Draft; contrato/datos validados, runtime pendiente.
- **Wardrobe PR #2** — modo persistente conectado a la plataforma de Fase 2: Draft.
- **MIRRORA PR #3** — catálogo publicado, SavedLooks y QR multidispositivo sobre la plataforma persistente: Draft.
- **MIRRORA PR #6** — AI Bridge / background removal / provider real: Draft; parte funcional implementada, validaciones reales pendientes.

### Deuda documental detectada

`docs/ADR/0003-wearly-fit-tryon-engine.md` ya ocupa oficialmente el número **ADR 0003** en `main`. El PR #5 fue creado antes y contiene también un archivo con prefijo `0003` para Brand Acquisition. **Antes de fusionar PR #5 debe renumerarse ese ADR** para conservar una secuencia inequívoca.

---

## 1. Visión

Fashion Studio SOL debe convertir fotografías, catálogos y activos de una marca en un sistema operativo visual y comercial para moda:

```text
crear marca / proyecto
→ importar fotografías o catálogo
→ detectar, reconstruir y revisar prendas
→ estructurar producto, variante y metadatos
→ crear outfits
→ generar contenido ecommerce/editorial
→ controlar modelo, identidad, pose y consistencia
→ ofrecer personalización y try-on cuando proceda
→ construir la experiencia web
→ previsualizar y publicar
→ medir interacción, coste y conversión
```

Objetivo final:

> **AI Fashion CMS + Wardrobe Intelligence + Outfit Engine + Pose & Model Consistency + Fit Intelligence + Virtual Try-On + Fashion Website Builder + Visual Content Generator + Ecommerce Personalization Platform.**

No buscamos acumular prototipos. El objetivo es cerrar recorridos completos y vendibles.

---

## 2. Arquitectura actual y responsabilidades

```text
                         FASHION STUDIO SOL
                 producto canónico / contratos / plataforma
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
          WARDROBE            WEARLY            MIRRORA
        Garment Core       Fit + Try-On       Consumer UX
              │                 │                 │
              └──────────── producto ─────────────┘
                                │
                                ▼
                      Wishlist / QR / Cart
                        CTA / Conversión
```

### `Juanmaes83/Fashion-Studio-SOL`

**Rol:** repositorio principal y fuente de verdad del producto integrado.

Responsabilidades progresivas:

- `fashion-schema` y contratos comunes;
- persistencia compartida;
- API;
- storage;
- jobs y workers;
- providers;
- costes y observabilidad;
- Outfit Layer;
- Website Builder;
- publicación;
- Operations Console;
- analytics;
- ecommerce connectors;
- gobierno de los módulos especializados.

No debe convertirse en una copia indiscriminada de todos los repositorios auxiliares.

### `Juanmaes83/wardrobe`

**Rol:** Garment Source / Wardrobe Core.

Responsabilidad:

```text
foto / catálogo
→ detección
→ crop
→ reconstrucción
→ background cleanup
→ QA humano
→ asset de prenda aprobado
→ metadatos canónicos
```

Wardrobe es la verdad de la **prenda**, no el motor de fitting del consumidor y no el storefront.

### `Juanmaes83/wearly`

**Rol aprobado:** **Fit Intelligence + Fit-Aware Virtual Try-On Engine**.

Responsabilidad:

```text
cuerpo + prenda + talla + color + fit + material
→ Fit Engine
→ Fit Report
→ brief/prompt técnico
→ try-on
→ resultado estructurado
```

Aporta actualmente:

- perfil frontal/lateral/trasero;
- Fit Engine determinista;
- `too-small / correct / too-large`;
- geometría y consecuencias de ajuste;
- razonamiento sobre hombro, manga, largo, pecho, cintura, cadera, stretch y corte;
- prompt de generación condicionado por Fit Report;
- generación real;
- jobs/cache;
- prewarm;
- progressive previews;
- validación y sanitización;
- tests.

**Regla:** no duplicar un Fit Engine en Wardrobe o MIRRORA antes de demostrar que Wearly no puede cumplir el contrato.

Documentación canónica:

- `docs/ADR/0003-wearly-fit-tryon-engine.md`
- `docs/WEARLY-FIT-TRYON-INTEGRATION-2026-08-08.md`

### `Juanmaes83/MIRRORA-Style-Studio`

**Rol:** Consumer Experience Core.

Responsabilidad:

- catálogo;
- looks;
- wishlist;
- Outfit/Closet canvas;
- QR y handoff;
- carrito y CTA;
- Brand Console / white-label;
- entrada al try-on;
- visualización del resultado;
- futura explicación `How this fits you`;
- conversión.

MIRRORA presenta y convierte; no debe reimplementar el catálogo canónico, el pipeline de Wardrobe ni el Fit Engine de Wearly.

---

## 3. Qué está cerrado en `main`

### Fase 0 — Auditoría

- mapa inicial de activos;
- auditoría de Wardrobe/MIRRORA;
- `THIRD_PARTY.md`;
- decisiones de integración.

### Fase 1 — Integración de núcleos

Recorrido demostrado:

```text
Wardrobe
→ prenda aprobada
→ fashion-schema
→ exportador
→ MIRRORA
```

El criterio de salida original —una prenda aprobada en Wardrobe puede aparecer en MIRRORA sin duplicación manual— está cumplido.

### Fase 3 — Ontología

Existe contrato común y extensible para prendas, outfits y atributos de moda. La publicación valida estados y no acepta datos inconsistentes silenciosamente.

### Fase 4 — Outfit Layer

Existe una entidad común de outfit y una máquina de estados para creación, revisión, aprobación y publicación.

### AI Closet — contratos y canvas base

Fashion Studio SOL tiene contratos AI Closet fusionados. MIRRORA tiene gateway alineado y canvas con activos reales, colocación, mover, escalar, rotar, capas y borrado.

### Wearly — incorporación arquitectónica

Wearly ya está registrado en `main` como repositorio propio y motor especializado. La responsabilidad de fit/try-on y sus límites frente a Wardrobe/MIRRORA están documentados.

---

## 4. Fase 2 — Plataforma compartida: estado real

La Fase 2 **no está simplemente “pendiente”**. Una parte sustancial ya existe en el PR #3 Draft.

### 2A–2F implementadas en la rama

- PostgreSQL e integridad de dominio;
- API administrativa y pública;
- storage de assets;
- checksums;
- URLs firmadas;
- jobs persistentes;
- worker recuperable;
- heartbeats/progreso/reintentos;
- panel `/ops`;
- migración real de Wardrobe;
- 6 prendas, 5 outfits y 15 assets migrados en la evidencia documentada;
- dry-run;
- idempotencia;
- rollback selectivo;
- handlers OpenAI conectados al worker;
- `/studio` sobre PostgreSQL/storage;
- aprobación de outfits y promoción de assets;
- publicaciones;
- catálogo público `catalog/v2`;
- SavedLooks validados e hidratados.

### Integraciones satélite de Fase 2

- **Wardrobe PR #2:** modo `?platform=1`, lectura y edición contra API persistente.
- **MIRRORA PR #3:** catálogo publicado, SavedLooks persistentes y QR multidispositivo.

### Qué falta para cerrar Fase 2G

No marcar Fase 2 como cerrada hasta demostrar de extremo a extremo:

```text
datos reales
→ PostgreSQL
→ Wardrobe
→ edición persistente
→ publicación
→ MIRRORA
→ SavedLook
→ reapertura en otro navegador/dispositivo
```

Y además:

```text
job IA real
→ cola
→ worker
→ progreso
→ resultado
→ persistencia
→ recuperación
```

Después de esa evidencia deben resolverse revisión, merge y consolidación de PR #3, Wardrobe PR #2 y MIRRORA PR #3.

---

## 5. Wearly: qué adelanta y qué falta

Wearly cambia de forma importante el roadmap de Virtual Try-On.

Antes:

```text
virtual try-on
≈ capacidad futura / proveedores / experimentos
```

Ahora:

```text
body profile
+
garment variant
+
fit reasoning
+
real generation
+
jobs/cache
+
progressive preview
```

### Avances reales aportados

1. **Virtual Try-On funcional** — ya existe un pipeline standalone real.
2. **Fit Intelligence** — capacidad nueva y determinista.
3. **Consumer Body Profile** — frontal/lateral/trasero y metadatos.
4. **Variant-aware generation** — talla/color/corte forman parte del job.
5. **Garment fidelity** — la prenda funciona como referencia canónica del render.
6. **Jobs/cache/prewarm** — patrones ya demostrados.
7. **Provider integration** — implementación real que puede informar el gateway común.

### No está cerrado todavía

```text
Wardrobe real
→ Fashion Schema / Garment Variant
→ Wearly real
→ Fit Report
→ Try-On
→ MIRRORA real
→ conversión
```

Pendientes principales:

- `GarmentVariantForTryOn` canónico;
- `ConsumerBodyProfile` canónico;
- `FitReport` compartido;
- size charts / tech packs reales;
- medidas corporales introducidas o estimadas con incertidumbre explícita;
- provider gateway común;
- jobs persistentes comunes;
- storage común;
- consentimiento, TTL y purge;
- MIRRORA lanzando job real de Wearly;
- MIRRORA mostrando resultado + `How this fits you`;
- wishlist/cart/CTA después del try-on;
- analytics compartida;
- QA contra prendas/tallas físicas reales.

---

## 6. AI Closet / MIRRORA AI Bridge

### Cerrado

- contratos versionados;
- cliente gateway;
- contract tests;
- canvas con activos reales;
- composición local;
- controles de mover/escalar/rotar/ordenar/borrar.

### En Draft / pendiente de validación final

MIRRORA PR #6 contiene trabajo avanzado de:

- Railway bridge;
- proxy same-origin desde Vercel;
- upload controlado;
- background removal;
- servicio `rembg` separado;
- contratos de respuesta;
- flujo antes/después.

No considerar background removal de producción cerrado hasta desplegar y validar el proveedor real con una prenda real.

---

## 7. Pose Library & Model Consistency Engine

Fashion Studio SOL PR #6 Draft incorpora como módulo formal:

- una referencia canónica femenina;
- 10 poses e-commerce;
- 10 poses editoriales;
- 21 prompts en total;
- JSON versionado;
- JSON Schema;
- hashes de integridad;
- validador;
- arquitectura de identidad, pose, generación, QA y provenance.

Validación documental/contractual realizada:

```text
schema
+ prompts
+ ids
+ hashes
= validados
```

Todavía no implementa:

- Pose Browser;
- runtime persistente;
- adapter de generación operativo;
- generación real desde este módulo;
- similitud facial automática;
- Human Review Console;
- integración runtime con Wardrobe/MIRRORA.

---

## 8. Brand Acquisition & Spec Campaign Engine

PR #5 Draft documenta el recorrido comercial:

```text
Brand Discovery
→ Qualification
→ Rights & Consent Gate
→ Product Ingestion
→ Spec Campaign
→ Human QA
→ Private Landing
→ Outreach
→ Engagement
→ CRM / Sales Handoff
→ Brand Onboarding
```

Valor aprobado: `deliver first`, demostración personalizada, microsite/QR, señal medible y handoff comercial.

No implementado todavía:

- discovery real;
- scraping;
- CRM;
- outreach;
- landing engine productiva;
- automatización;
- onboarding runtime.

**Dependencia:** no priorizar esta capa por encima de Fase 2G.

---

## 9. Website Builder MVP — Fase 5

El primer builder será estructurado, no un editor pixel-perfect genérico.

Secciones previstas:

```text
Hero
Featured Collection
Product Grid
Editorial Split
Lookbook
Shop the Look
Campaign Video
Brand Story
Newsletter
Social Gallery
CTA
Footer
```

Capacidades objetivo:

- elegir plantilla;
- branding/theme/design tokens;
- añadir/ocultar/reordenar secciones;
- seleccionar productos/outfits;
- editar textos y medios;
- preview desktop/tablet/mobile;
- publicar una URL.

**Estado:** implementación no iniciada. Antes de elegir base deben revisarse los builders existentes del propietario y seleccionar una sola base modular o los mejores patrones reutilizables.

---

## 10. Publishing y validación comercial — Fase 6

Criterio de salida futuro:

```text
Fashion Studio
→ Website Builder
→ Preview
→ Publish
→ dominio/piloto
→ usuario real
→ analytics
→ conversión
```

No marcar como cerrada por la mera existencia de despliegues aislados de otros prototipos.

---

## 11. Try-On Gateway — Fase 7

Objetivo canónico:

```text
submit(job) → job_id
status(job_id) → queued | running | done | failed
result(job_id) → asset firmado + FitReport cuando aplique
purge(job_id) → borrado verificable
```

Requisitos:

- provider intercambiable;
- consentimiento explícito;
- fotos personales separadas de catálogo;
- TTL;
- purge;
- auditoría;
- jobs recuperables;
- costes;
- no transportar datos faciales en QR;
- no presentar estimaciones como mediciones físicas;
- no prometer precisión de talla sin evidencia.

Wearly adelanta de forma sustancial la tecnología de esta fase, pero no sustituye todavía al gateway común.

---

## 12. Fases posteriores

### Fase 8 — SaaS

Después de validar producto:

- auth;
- organizaciones;
- roles;
- multitenancy;
- planes;
- cuotas;
- facturación;
- Stripe;
- administración.

### Fase 9 — Weather Intelligence

```text
ubicación + clima + contexto + armario
→ scoring
→ ranking
→ recomendación de prendas/outfits
```

### Fase 10 — Dynamic Fabric Engine

Evolución prevista desde investigación/prototipos hacia un módulo TypeScript/React/WebGL con presets textiles, siluetas/anclajes, rendimiento adaptativo y posible conexión con clima.

Estas fases no bloquean el MVP.

---

## 13. Dos loops prioritarios desde 2026-08-08

La prioridad del proyecto deja de ser descubrir o construir más piezas aisladas. Debemos **cerrar verticalmente lo que ya tenemos**.

### LOOP PRIORITARIO 1 — Producto → Fit → consumidor → conversión

```text
WARDROBE
    ↓
POSTGRES / plataforma persistente
    ↓
FASHION SCHEMA
    ↓
WEARLY
    ↓
MIRRORA
    ↓
CONVERSIÓN
```

Criterio de éxito:

1. una prenda real se ingiere y aprueba en Wardrobe;
2. queda persistida y representada por el contrato canónico;
3. una variante/talla llega a Wearly;
4. Wearly produce Fit Report + try-on;
5. MIRRORA muestra el resultado;
6. el usuario puede guardar, comparar, continuar por QR, wishlist o carrito;
7. la acción final queda medible.

### LOOP PRIORITARIO 2 — Creación → web → publicación → cliente real

```text
Fashion Studio
→ Website Builder
→ Publish
→ Cliente real
```

Criterio de éxito:

1. una marca configura catálogo, looks y contenido;
2. construye una web mediante secciones;
3. obtiene preview responsive;
4. publica;
5. un cliente real navega;
6. medimos interacción y conversión.

Cuando ambos loops estén cerrados, Fashion Studio SOL deja de ser un conjunto de tecnologías avanzadas conectables y pasa a ser **un producto demostrable y vendible de extremo a extremo**.

---

## 14. Orden de ejecución recomendado

```text
1. Cerrar Fase 2G con evidencia real
        ↓
2. Consolidar / mergear Fase 2
        ↓
3. Consolidar Wardrobe PR #2 + MIRRORA PR #3
        ↓
4. Definir contratos mínimos de Wearly
        ↓
5. Conectar Wardrobe/Fashion Schema → Wearly
        ↓
6. Conectar Wearly → MIRRORA
        ↓
7. Cerrar Fit Report + try-on + conversión
        ↓
8. Revisar y consolidar Pose / Model Consistency
        ↓
9. Construir Website Builder MVP
        ↓
10. Publishing + piloto real
```

Trabajo paralelo permitido siempre que no bloquee este orden:

- validación del MIRRORA AI Bridge;
- preparación de Brand Acquisition;
- benchmarks de calidad/licencias;
- documentación.

---

## 15. Contratos de datos clave

Entidades actuales/objetivo:

```text
Project
Brand
Collection
Garment
GarmentAsset
GarmentSource
Outfit
OutfitItem
ModeledRender
GeneratedAsset
GenerationJob
Storefront
StorefrontSection
Theme
Campaign
SavedLook
WishlistItem
AnalyticsEvent
```

Contratos nuevos a formalizar para Wearly:

```text
GarmentVariantForTryOn
ConsumerBodyProfile
FitReport
TryOnJob / TryOnResult
```

La ontología debe seguir siendo progresiva: suficiente para el producto real y extensible, sin bloquear el piloto con una taxonomía gigantesca.

---

## 16. Pruebas y criterios de verdad

No afirmar que una función está cerrada únicamente porque existe código.

Evidencias mínimas según módulo:

- tests unitarios/contrato;
- integración API/persistencia;
- E2E de recorridos críticos;
- recuperación de jobs;
- prueba visual desktop/tablet/mobile;
- assets reales;
- QA humano cuando el resultado es generativo;
- coste y errores registrados;
- prueba entre navegadores/dispositivos cuando existe handoff;
- evidencia física cuando se hable de talla/fit.

Benchmark de imagen:

1. identidad;
2. fidelidad de prenda;
3. silueta/construcción;
4. color/material;
5. logos/texto;
6. bordes/transparencia;
7. fit/drape;
8. anatomía/manos;
9. fondo/iluminación;
10. utilidad comercial.

Una imagen atractiva pero incorrecta no se aprueba.

---

## 17. Riesgos principales

1. **Islas funcionales:** repositorios o ramas muy avanzados que no comparten persistencia/contratos.
2. **Dos fuentes de verdad:** producto/talla/asset no puede duplicarse entre Wardrobe, Wearly y MIRRORA.
3. **Confundir Draft con cerrado:** Fase 2 es el ejemplo principal.
4. **Fit estimado presentado como medición real:** prohibido sin evidencia.
5. **Fotos personales:** separación, consentimiento, TTL, purge y trazabilidad.
6. **Dependencia de proveedor:** adapters intercambiables.
7. **Coste IA:** coste, intentos y regeneraciones deben medirse.
8. **Builder demasiado ambicioso:** no construir Webflow + Shopify + Canva simultáneamente.
9. **Licencias:** ningún modelo/checkpoint/dataset externo entra en producción sin revisión comercial.
10. **Deuda por duplicación:** reutilizar contratos/motores antes de crear otra implementación.

---

## 18. Reglas para nuevas sesiones y agentes de IA

Antes de modificar código:

1. Leer este README completo.
2. Revisar `main`, PRs abiertos y rama exacta.
3. No asumir que una función documentada está fusionada.
4. Leer la ADR correspondiente.
5. Para fit/sizing/try-on, leer Wearly y `docs/WEARLY-FIT-TRYON-INTEGRATION-2026-08-08.md`.
6. No duplicar catálogo, Fit Engine, jobs o persistencia sin justificación.
7. Trabajar en rama enfocada y PR pequeño/verificable.
8. Ejecutar tests disponibles.
9. Mantener Wardrobe, Wearly y MIRRORA con límites claros.
10. No exponer API keys, fotos personales ni assets privados.
11. No introducir SaaS, clima o Dynamic Fabric para bloquear los dos loops prioritarios.
12. Documentar cambios arquitectónicos mediante ADR.
13. No afirmar que algo funciona de extremo a extremo sin evidencia reproducible.

### Orden de lectura recomendado

```text
README.md
→ docs/WEARLY-FIT-TRYON-INTEGRATION-2026-08-08.md cuando aplique
→ docs/ADR relevantes
→ docs/CONSOLIDATION-3-4.md
→ PR/branch de la microfase
→ código y tests
```

---

## 19. Próxima acción prioritaria

### PRIORIDAD 1 — Fase 2G

Cerrar la validación real de la plataforma persistente y decidir la consolidación de:

- Fashion Studio SOL PR #3;
- Wardrobe PR #2;
- MIRRORA PR #3.

### PRIORIDAD 2 — Integración Wearly

Una vez estable la plataforma compartida:

```text
Wardrobe garment
→ GarmentVariantForTryOn
→ Wearly Fit Engine
→ FitReport + Try-On
→ MIRRORA
→ wishlist / QR / cart / CTA
```

### PRIORIDAD 3 — Website Builder + Publish

Cerrar el segundo loop:

```text
Fashion Studio
→ Website Builder
→ Publish
→ Cliente real
```

---

## 20. Documentos de continuidad relevantes

- `docs/AUDIT-2026-07-13.md`
- `docs/THIRD_PARTY.md`
- `docs/EXECUTION-WARDROBE-CORE-2026-07-17.md`
- `docs/CONSOLIDATION-3-4.md`
- `docs/ADR/0001-integracion-wardrobe-mirrora.md`
- `docs/ADR/0002-ai-closet-module.md`
- `docs/ADR/0003-wearly-fit-tryon-engine.md`
- `docs/WEARLY-FIT-TRYON-INTEGRATION-2026-08-08.md`

Documentación todavía en PRs Draft:

- Fase 2A–2F / Fase 2G: PR #3.
- Brand Acquisition & Spec Campaign Engine: PR #5.
- Pose Library & Model Consistency Engine: PR #6.

---

## 21. Definición actual de éxito del MVP

Fashion Studio SOL alcanza su primer gran hito cuando una marca puede:

```text
importar fotografías reales
→ obtener prendas revisadas y persistentes
→ estructurar catálogo y variantes
→ crear outfits
→ generar/seleccionar contenido consistente
→ construir una web
→ publicar
→ permitir interacción del consumidor
→ medir conversión
```

Y, para el vertical de personalización:

```text
prenda real
→ talla/variante
→ Wearly Fit Intelligence
→ try-on
→ MIRRORA
→ decisión de compra
```

No necesitamos todavía para validar el MVP:

- SaaS completo;
- facturación;
- Weather Intelligence;
- Dynamic Fabric;
- vídeo try-on;
- simulación física perfecta del tejido.

---

## 22. Principio rector

> **No construir más islas. Cerrar recorridos completos.**

La prioridad desde 2026-08-08 es transformar la tecnología ya desarrollada en dos loops verificables:

```text
Wardrobe → PostgreSQL → Fashion Schema → Wearly → MIRRORA → Conversión
```

```text
Fashion Studio → Website Builder → Publish → Cliente real
```

Cuando ambos estén cerrados con evidencia, Fashion Studio SOL pasa de ser un ecosistema avanzado de capacidades a un **producto demostrable, operable y vendible de extremo a extremo**.
