# Fashion Studio SOL

> Plataforma de inteligencia, creación, consistencia visual y publicación para moda.
>
> Este README es el **documento maestro de continuidad**. Debe permitir que otra sesión, un desarrollador o un agente de IA entienda qué estamos construyendo, qué activos existen, qué hace cada repositorio, cómo se integra y qué trabajo falta sin depender de conversaciones anteriores.

---

## Estado del proyecto — 2026-07-29

| Área / fase | Estado verificable |
|---|---|
| **Fase 0 — Consolidación documental y auditoría** | ✅ Fusionada en `main` mediante PR #2. Existen auditoría, terceros y ADR de integración. |
| **Fase 1 — Foundation Wardrobe + MIRRORA** | ✅ Consolidada: pipeline Wardrobe validado, `fashion-schema` v0.1, exportador Wardrobe→MIRRORA y catálogo real en MIRRORA. |
| **Fase 2 — Persistencia y pipeline profesional** | 🟠 Fases 2A–2F implementadas en el **PR #3 Draft** (`phase-2/persistence-foundation`); 2G y validación final siguen pendientes. No confundir trabajo en PR con código ya fusionado en `main`. |
| **Fase 3 — Ontología V1** | ✅ Contrato canónico consolidado y validado. |
| **Fase 4 — Outfit Layer** | ✅ Creación, revisión y publicación consolidadas con validación fail-closed. |
| **Fase 4B — Pose Library & Model Consistency Engine** | 🟠 Especificación, transcripción canónica, JSON y JSON Schema incorporados en una rama de revisión. Implementación de runtime pendiente. |
| **Fase 5 — Website Builder MVP** | ⏳ Pendiente. Antes debe auditarse el inventario de builders del propietario y elegirse una sola base modular. |
| **Brand Acquisition & Spec Campaign Engine** | 🧭 Documentado en **PR #5 Draft**, dependiente del PR #3. Es una pista paralela de crecimiento, no sustituye la prioridad de persistencia. |
| **Fases 6–10** | ⏳ Según roadmap de este documento. |

### Pull requests abiertos relevantes

- **PR #3:** `phase-2/persistence-foundation` → `main`. Plataforma persistente 2A–2F, todavía Draft.
- **PR #5:** `feature/brand-acquisition-spec-campaign-engine` → `phase-2/persistence-foundation`. Documentación de captación B2B, todavía Draft y dependiente del PR #3.
- La integración del **Pose Library & Model Consistency Engine** debe permanecer en una rama y PR independientes para no acoplarse innecesariamente al PR #3.

---

## 1. Visión

Fashion Studio SOL debe convertir fotografías, catálogos y activos de una marca en un sistema operativo visual y comercial para moda:

```text
crear proyecto y marca
→ importar fotografías o catálogo
→ detectar, reconstruir y revisar prendas
→ enriquecer el catálogo con datos fiables
→ crear outfits
→ registrar modelos y bibliotecas de poses
→ generar contenido e-commerce, editorial y de campaña
→ revisar identidad, prenda, pose, anatomía y framing
→ configurar una web de moda
→ previsualizar y publicar
→ medir interacción, conversión y coste operativo
```

Objetivo final:

> **AI Fashion CMS + Wardrobe Intelligence + Outfit Engine + Pose Library & Model Consistency Engine + Fashion Website Builder + Visual Content Generator + Ecommerce Personalization Platform.**

En fases posteriores podrá añadir:

```text
virtual try-on mediante gateway intercambiable
+
recomendación según clima y contexto
+
movimiento dinámico de tejidos y prendas
+
SaaS multicliente, cuotas y facturación
```

Estas capacidades posteriores no deben bloquear la validación inicial.

---

## 2. Decisiones estratégicas aprobadas

1. **`Juanmaes83/Fashion-Studio-SOL` es el repositorio principal y la fuente de verdad del producto integrado.**
2. **Wardrobe** es el núcleo de ingesta, extracción, reconstrucción, revisión y gestión de prendas.
3. **MIRRORA Style Studio** es la base de la experiencia de consumidor, looks, wishlist, QR, carrito y primera consola white-label.
4. **Pose Library & Model Consistency Engine** es un módulo propio de primer nivel, no una carpeta informal de prompts.
5. Producto, identidad, prendas, outfits, poses y medios generados son verdades distintas y deben permanecer separadas.
6. Los prompts canónicos no se “mejoran” silenciosamente. Cualquier cambio exige una nueva versión.
7. El Website Builder será inicialmente estructurado por secciones y plantillas; no intentará replicar Webflow, Shopify y Canva a la vez.
8. SaaS, multitenancy y facturación se implementarán después de validar el flujo completo.
9. Antes del SaaS sí deben resolverse persistencia, storage, uploads, jobs, reintentos, costes, pruebas y trazabilidad.
10. La ontología crecerá progresivamente: una V1 suficiente y extensible antes que una taxonomía gigantesca.
11. Clima y telas dinámicas son posteriores y no bloquean el MVP.
12. Ningún código, modelo, checkpoint o dataset entra en producción sin revisión de licencia y uso comercial.
13. Una imagen atractiva no se aprueba si altera identidad, prenda, pose, anatomía o verdad comercial.
14. Ninguna imagen generada demuestra talla, fit, caída física real o comodidad.

---

## 3. Superficies del producto

### 3.1 Fashion Studio — aplicación interna

Para marcas, diseñadores, tiendas, estilistas y equipos de marketing:

- proyectos, marcas y colecciones;
- importación de fotografías, carpetas y catálogos;
- detección, crops, cut-outs y reconstrucción de prendas;
- revisión humana y edición de metadatos;
- outfit builder y generación de looks;
- registro de modelos, referencias y consentimiento;
- biblioteca de poses e-commerce y editoriales;
- generación y revisión de contenido;
- campañas y assets comerciales;
- configuración de storefronts;
- preview y publicación;
- operaciones, jobs, costes, errores y QA.

### 3.2 Fashion Storefront — experiencia pública

- home y colecciones;
- fichas de producto;
- lookbooks y Shop the Look;
- wishlist y looks guardados;
- outfit builder;
- contenido editorial y campañas;
- avatar editorial;
- QR y handoff entre escaparate, móvil y carrito;
- try-on opcional con consentimiento y limitaciones explícitas;
- recomendación climática en fases posteriores.

### 3.3 Brand Console / Website Builder

- identidad visual y design tokens;
- temas y plantillas;
- catálogo y outfits activos;
- secciones configurables;
- orden, visibilidad y layouts;
- CTA, carrito, campañas y recompensas;
- preview desktop, tablet y móvil;
- publicación de sitios.

### 3.4 Operations Console

```text
upload
→ detect
→ crop review
→ garment generation
→ background cleanup
→ garment QA
→ model/pose generation
→ consistency QA
→ outfit
→ storefront
→ publish
```

Cada job debe mostrar estado, proveedor, modelo/version, duración, coste, intentos, errores, inputs, outputs, decisión de revisión y recuperación.

### 3.5 Growth Console — pista posterior

Documentada en PR #5 para el flujo:

```text
Brand Discovery
→ Qualification
→ Rights & Consent Gate
→ Product Ingestion
→ Spec Campaign
→ Human QA
→ Private Campaign Landing
→ Outreach
→ Engagement Signals
→ CRM / Sales Handoff
→ Brand Onboarding
```

Debe permanecer separada del Production Plane y no puede iniciar generación sin derechos y consentimiento válidos.

---

## 4. Estado real: cuánto existe y cuánto está integrado

No partimos desde cero. Existen núcleos funcionales y varios activos útiles, pero un repositorio clonado no equivale a un módulo integrado.

| Área | Evaluación de prototipos antes de la consolidación completa |
|---|---:|
| Ingesta y gestión de prendas | 75–80 % |
| Experiencia de consumidor | 60–70 % |
| Outfits | 45–55 % |
| Website Builder | 20–30 % |
| Virtual try-on comercial | 10–20 % |
| MVP integrado completo | ~45 % |
| Superficies funcionales repartidas | ~65 % |

Desde entonces, Fases 1, 3 y 4 han avanzado, y Fase 2A–2F existe en PR #3. Aun así, no debe afirmarse que todo está en producción o fusionado: la comprobación correcta se hace sobre rama, PR, tests y flujo extremo a extremo.

---

## 5. Mapa de módulos y responsabilidades

| Módulo | Responsabilidad | Fuente principal |
|---|---|---|
| **Fashion Schema** | Contratos compartidos de prendas, outfits, modelos, poses, assets, jobs, campañas y storefronts | Fashion Studio SOL |
| **Wardrobe Core** | Ingesta, detección, crops, cut-outs, reconstrucción, metadatos y revisión | `Juanmaes83/wardrobe` |
| **Image Pipeline** | Procesamiento de imagen, chroma, fondo, render modelado y adaptadores | Wardrobe + servicios propios |
| **Outfit Core / Engine** | Relaciones entre prendas, styling, reglas, scoring, creación y aprobación | Fashion Studio SOL + skills Wardrobe |
| **Pose Library & Model Consistency Engine** | Identidad canónica, poses versionadas, generación, QA, aprobación y procedencia | Módulo canónico nuevo |
| **MIRRORA Experience** | Descubrimiento, looks, wishlist, QR, handoff y conversión | `Juanmaes83/MIRRORA-Style-Studio` |
| **AI Closet Engine** | Patrones portables de armario, canvas de looks, categorización y cliente de try-on | `Juanmaes83/ai-closet` como referencia/adaptación |
| **Brand Console** | Configuración white-label, campañas, catálogo y evolución hacia builder | MIRRORA + desarrollo propio |
| **Website Builder** | Secciones, themes, merchandising, preview y publicación | Desarrollo propio tras auditar builders |
| **Try-On Gateway** | Consentimiento, proveedor intercambiable, cola, TTL, purge, auditoría y QA | Servicio propio; repos de investigación solo benchmark |
| **Prompt QA** | Rúbricas, defectos, reparación dirigida y benchmark visual | `aiclothswap-showcase` + reglas propias |
| **Image Enhancement** | Upscale/mejora opcional mediante adaptador aislado | Servicio propio; Clarity solo referencia jurídica/técnica |
| **Operations Console** | Visualización de jobs, pasos, errores, costes y recuperación | Desarrollo propio; `llmd-flow-visualizer` como patrón |
| **Publishing** | Preview, assets aprobados, deploy y URLs | Servicio propio |
| **Growth / Spec Campaign Engine** | Captación B2B, campañas privadas y handoff comercial | Documentado en PR #5 |

---

## 6. Inventario de repositorios y cómo integrarlos

Que un repositorio aparezca aquí **no lo convierte en dependencia de producción**.

### 6.1 Repositorios núcleo

#### `Juanmaes83/Fashion-Studio-SOL`

**Hace:** producto integrado, contratos, decisiones, módulos, documentación, tests y roadmap.

**Integra:** Wardrobe, MIRRORA y los módulos propios mediante contratos; no copiando indiscriminadamente todos los repositorios.

**Decisión:** fuente de verdad canónica.

#### `Juanmaes83/wardrobe`

**Upstream:** `tandpfun/wardrobe`.  
**Licencia:** MIT; conservar atribución e historial.

**Hace:**

- React/Vite y galería editorial;
- drag, drop y paste;
- detección de múltiples prendas;
- bounding boxes y crops;
- reconstrucción aislada de prendas;
- chroma adaptativo, despill y limpieza de fondo;
- revisión humana por etapas;
- imagen modelada con referencia;
- persistencia local y recuperación de jobs;
- skills `import-clothes` y `generate-outfits`.

**Cómo funciona:**

```text
foto
→ detección
→ crop
→ aprobación
→ reconstrucción
→ fondo/transparencia
→ aprobación
→ imagen modelada
→ aprobación
→ biblioteca
```

**Cómo se integra:** su lógica se adapta a `wardrobe-core`, `image-pipeline`, Fashion Studio y jobs persistentes. Debe desacoplar extracción de prenda y render modelado, eliminar JSON/localStorage como fuente definitiva y conectar el esquema común.

#### `Juanmaes83/MIRRORA-Style-Studio`

**Hace:** PWA de consumidor, home editorial, catálogo, avatar paramétrico sin foto, combinaciones, looks, wishlist, QR, carrito, eventos locales, PWA y consola white-label con preview y JSON.

**Cómo funciona:**

```text
descubrir look
→ identidad de estilo
→ avatar
→ probar y combinar
→ guardar
→ QR / móvil
→ carrito
```

**Cómo se integra:** se evoluciona hacia `storefront`, `brand-console`, `qr-handoff`, `analytics` y componentes reutilizables. Consume prendas, outfits y assets aprobados; no es fuente de verdad de producto ni identidad.

### 6.2 Repositorios auxiliares utilizables

#### `Juanmaes83/ai-closet`

**Upstream:** `zebangeth/ai-closet`.  
**Licencia:** MIT.

**Hace:** app Expo/React Native de armario, categorización visual, eliminación de fondo, canvas de outfits con mover/escalar/rotar/capas y try-on externo.

**Cómo se integra:** no como aplicación completa. Se adapta como `ai-closet-engine` portable, mapeado a `fashion-schema`, jobs backend y cliente del Try-On Gateway. Ninguna clave AI puede vivir como `EXPO_PUBLIC_*`; consentimiento, TTL, purge y auditoría son obligatorios.

#### `Juanmaes83/aiclothswap-showcase`

**Hace:** cookbook de prompts, ejemplos, rúbrica de calidad, fallos frecuentes y reparaciones dirigidas.

**Cómo se integra:** `prompt-qa`, `audit-generated-fashion`, motivos de rechazo, retries dirigidos y benchmark visual.

**Límite:** no es el motor privado de AIClothSwap ni debe tratarse como tal.

#### `Juanmaes83/fashionAI`

**Licencia del código:** MIT.

**Hace:** antiguo prototipo Next.js de upload, máscara/inpainting, comparación antes/después, slider, rate limiting y proveedor externo.

**Cómo se integra:** solo patrones o componentes concretos después de revisión; no como arquitectura base.

#### `Juanmaes83/gestalt-A-set-of-React-UI-components-that-supports-Pinterest-s-design-language`

**Upstream:** Pinterest Gestalt.  
**Licencia:** Apache 2.0.

**Hace:** componentes React maduros, accesibilidad, grids, modales, tabs, combobox, controles y estados de foco.

**Cómo se integra:** selección mínima de patrones/componentes compatibles con el design system propio. No copiar la identidad visual de Pinterest ni el monorepo completo.

#### `Juanmaes83/llmd-flow-visualizer`

**Licencia:** Apache 2.0.

**Hace:** flujos animados, componentes inspeccionables y pasos visuales.

**Cómo se integra:** patrón de interacción para Operations Console, sustituyendo su contenido LLM/Kubernetes por jobs de moda.

#### `Juanmaes83/clarity-upscaler`

**Hace:** upscale y mejora por tiles para imágenes de alta resolución.

**Cómo se integra:** nunca directamente en el core sin revisión legal. Solo como referencia o proveedor aislado `image-enhancement` intercambiable.

**Riesgo:** upstream AGPL y obligaciones asociadas; además, no todos los modelos mencionados son open source.

#### Gist de extracción de Wardrobe

**Recurso:** `tandpfun/b73063c8be8fc46644da9925d48b3240`.

**Hace:** inventario de fuentes, contact sheets, crops focalizados, reconstrucción basada en evidencia, chroma, QA y deduplicación conservadora.

**Cómo se integra:** principios en skills internas de ingestión y QA, después de sanitizar caracteres Unicode bidireccionales/ocultos y verificar licencia. No instalar ciegamente.

#### Repo Explainer de Wardrobe

**Hace:** explicación humana del repositorio.

**Cómo se integra:** solo orientación. El código y README originales son la autoridad.

### 6.3 Investigación — no integrar directamente en producción

#### `Juanmaes83/Magic-TryOn`

**Hace:** investigación de try-on de imagen/vídeo basada en Wan 2.1, Diffusion Transformer, máscaras, DensePose, human parsing y preservación temporal.

**Licencia:** CC BY-NC-SA 4.0.

**Decisión:** I+D y benchmark. Sin código ni pesos en el producto comercial salvo licencia adicional.

#### `Juanmaes83/IMAGDressing`

**Hace:** generación controlada por prenda, pose, rostro y escena; IP-Adapter, ControlNet, inpainting, FaceID y métrica CAMI.

**Decisión:** referencia de arquitectura, controles y métricas. Aunque el código sea permisivo, los modelos/checkpoints/datasets publicados tienen restricciones no comerciales.

#### `Juanmaes83/AI_Fashion_Cloth_Changer`

**Hace:** laboratorio histórico de DreamBooth, Stable Diffusion, ControlNet, inpainting, datasets y tagging.

**Decisión:** conservar como referencia histórica. Stack antiguo, coste alto, reproducibilidad limitada y licencia pendiente de auditoría.

#### `Juanmaes83/deepchange`

**Hace realmente:** dataset/benchmark de reidentificación de personas con cambios de ropa.

**No hace:** outfits, recomendación, extracción ni try-on.

**Decisión:** no integrar. Uso no comercial de investigación y restricciones fuertes; solo puede inspirar futuros estudios de consistencia de identidad.

### 6.4 Repositorios relacionados pendientes de auditoría

- `Juanmaes83/wardrowbe`
- `Juanmaes83/smart-wardrobe`
- `Juanmaes83/wardrobe-BE`
- `Juanmaes83/smart-wardrobe-style-and-try-on`
- `Juanmaes83/dressme`
- builders y proyectos web del propietario todavía no inventariados para Fase 5.

No se les asignará responsabilidad de producción hasta revisar código, historial, licencia, solapamiento y deuda técnica.

---

## 7. Arquitectura objetivo

```text
Fashion-Studio-SOL/
├── apps/
│   ├── studio/                         # Operador: prendas, outfits, modelos, contenido y webs
│   ├── storefront/                     # Experiencia pública
│   ├── brand-console/                  # White-label y Website Builder
│   ├── api/                            # API de negocio
│   ├── vision-worker/                  # Procesamiento IA/imagen
│   ├── operations-console/             # Jobs, costes, errores y QA
│   └── growth-console/                 # Pista B2B posterior
│
├── modules/
│   └── pose-library-model-consistency/
│       ├── README.md
│       ├── PROMPTS.md
│       ├── data/
│       └── schema/
│
├── packages/
│   ├── ui/
│   ├── fashion-schema/
│   ├── wardrobe-core/
│   ├── image-pipeline/
│   ├── ai-closet-engine/
│   ├── outfit-core/
│   ├── outfit-engine/
│   ├── website-builder/
│   ├── storefront-sections/
│   ├── prompt-qa/
│   ├── analytics/
│   ├── qr-handoff/
│   ├── weather-engine/                 # posterior
│   └── fabric-motion/                  # posterior
│
├── services/
│   ├── tryon-gateway/
│   ├── image-enhancement/
│   ├── publishing/
│   └── generation-adapters/
│
├── skills/
│   ├── import-clothes/
│   ├── generate-outfits/
│   ├── extract-clothing-cutouts/
│   └── audit-generated-fashion/
│
├── research/
│   ├── tryon-benchmarks/
│   ├── video-tryon/
│   └── legacy-pipelines/
│
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── THIRD_PARTY.md
│   └── ADR/
│
└── tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── visual-benchmark/
```

Es una arquitectura objetivo. No se deben crear carpetas vacías ni copiar aplicaciones enteras para aparentar avance.

---

## 8. Contratos y fuentes de verdad

### 8.1 Entidades compartidas

```text
Project
Brand
Collection
Garment
GarmentAsset
GarmentSource
Outfit
OutfitItem
ModelIdentity
ModelReference
PoseLibrary
PoseDefinition
ModelRender
ConsistencyReview
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

### 8.2 Ontología V1 de prendas

```text
category
subcategory
name
primaryColor
secondaryColor
material
pattern
silhouette
fit
season
style
occasion
thermalWeight
tags
```

Opcionales de ecommerce:

```text
sku
brand
price
currency
sizes
stock
productUrl
```

La V2 podrá incorporar cuello, manga, longitud, cierre, construcción, peso del tejido, transpirabilidad, impermeabilidad, elasticidad, formalidad, capas, cuidado y atributos por categoría.

### 8.3 Separación obligatoria

```text
Garment / Outfit / ModelIdentity / PoseDefinition
            = verdad aprobada

GeneratedAsset / ModelRender
            = resultado derivado, versionado y revisable
```

Un render nunca sobrescribe la prenda, el outfit, la identidad o el prompt canónico.

---

## 9. Pose Library & Model Consistency Engine

### 9.1 Estado canónico actual

- **1 referencia femenina:** `FREF-01`.
- **10 poses e-commerce:** `S01–S10`.
- **10 poses editoriales:** `ED1–ED10`.
- **21 prompts totales** contando la referencia.
- Transcripción literal desde las capturas del propietario del 29 de julio de 2026.
- Se conservan wording, capitalization, hyphenation y punctuation; solo se normalizan saltos visuales y estilos tipográficos.

Archivos canónicos:

- [`modules/pose-library-model-consistency/README.md`](modules/pose-library-model-consistency/README.md) — arquitectura y fases.
- [`modules/pose-library-model-consistency/PROMPTS.md`](modules/pose-library-model-consistency/PROMPTS.md) — transcripción completa exacta.
- [`modules/pose-library-model-consistency/data/female-pose-library.v1.json`](modules/pose-library-model-consistency/data/female-pose-library.v1.json) — fuente estructurada.
- [`modules/pose-library-model-consistency/schema/pose-library.schema.json`](modules/pose-library-model-consistency/schema/pose-library.schema.json) — contrato de validación.

### 9.2 Flujo

```text
referencia canónica del modelo
→ identidad + consentimiento + procedencia
→ pose versionada
→ prenda u outfit aprobado
→ compilador de prompt
→ adaptador de generación
→ job con proveedor/modelo/versión/seed/coste
→ QA automático
→ revisión humana
→ approved | rejected | regenerate
→ catálogo, lookbook, campaña, MIRRORA o storefront
```

### 9.3 Componentes

1. Model Identity Registry.
2. Pose Registry.
3. Prompt Compiler.
4. Generation Adapter Layer.
5. Consistency & QA Engine.
6. Human Review Console.
7. Asset & Provenance Registry.

### 9.4 Contratos de consistencia

- **Identidad:** rostro, edad aparente, piel, pelo y proporciones no derivan entre poses.
- **Prenda:** no inventar o eliminar material, color, patrón, longitud, escote, cierres, logos o construcción.
- **Pose:** respetar framing, cámara, cuerpo, manos, mirada, expresión, fondo e iluminación.
- **Producción:** cada output debe ser trazable, revisable y reproducible cuando el proveedor lo permita.
- **Legal/comercial:** bloquear proveedores o pesos incompatibles y no prometer fit o talla.

### 9.5 Integración

```text
Wardrobe / Outfit Engine
→ prenda u outfit aprobado
→ Pose Library & Model Consistency Engine
→ assets modelados con QA y procedencia
→ MIRRORA / Website Builder / Storefront / Campaigns
```

Try-On Gateway y proveedores externos pueden producir imágenes, pero no saltarse esta revisión.

### 9.6 Fases internas del módulo

- **0 — Documentación canónica:** completada en esta rama.
- **1 — Registry y UI local:** browser de poses, referencias, preview y review.
- **2 — Jobs provider-neutral:** adaptador, estados, retries, seed, coste y latencia.
- **3 — QA automático:** identidad, pose, prenda, color, anatomía, manos, framing y fondo.
- **4 — Wardrobe/Outfit:** batch y packs PDP/lookbook/campaña.
- **5 — MIRRORA/Website Builder:** publicación solo de assets aprobados.
- **6 — Escala:** persistencia compartida, workers, usuarios y SaaS tras validación.

La prioridad global sigue siendo cerrar Fase 2G; el módulo puede documentarse y diseñarse en paralelo, pero no debe crear una segunda persistencia incompatible.

---

## 10. Outfit Layer

Fuentes admitidas:

1. imágenes locales;
2. manifiestos de la skill de generación;
3. selección manual de prendas reales.

Debe soportar grid editorial, filtros, drawer, flat lay, tags, regeneración, revisión, Shop the Look y asociación verificable con `garmentIds`.

Solo outfits `approved` pueden publicarse.

---

## 11. Website Builder MVP

Primer builder estructurado por secciones:

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

Capacidades:

- elegir plantilla;
- editar branding;
- añadir, ocultar y ordenar secciones;
- seleccionar productos, outfits y assets aprobados;
- editar textos y medios;
- preview responsive;
- publicar en una URL.

Fuera del MVP: editor libre pixel-perfect, código arbitrario, marketplace completo de temas y CMS genérico para cualquier industria.

---

## 12. Persistencia y procesamiento antes del SaaS

La validación exige una fuente de verdad consistente aunque todavía no haya multitenancy completo:

- PostgreSQL o equivalente;
- storage de assets;
- URLs firmadas o multipart;
- jobs persistentes;
- worker separado;
- retries y recuperación;
- IDs compartidos;
- checksums, logs y costes;
- estados de revisión;
- rollback y migración idempotente.

**PR #3** implementa gran parte de Fase 2A–2F. Antes de fusionarlo hay que completar y verificar 2G, ejecutar el flujo real, confirmar seguridad y mantener Wardrobe/MIRRORA alineados.

Infraestructura prevista después de validación local:

- Vercel para frontend/previews;
- Railway para API/workers;
- PostgreSQL/Supabase;
- storage con URLs firmadas;
- Redis/cola solo cuando el volumen lo justifique, con interfaz preparada.

---

## 13. Virtual Try-On Gateway

```text
submit(job) → job_id
status(job_id) → queued | running | done | failed
result(job_id) → asset temporal firmado
purge(job_id) → borrado verificable
```

No negociable:

- consentimiento explícito;
- TTL y purge;
- auditoría;
- separación de fotos personales;
- proveedores intercambiables;
- métricas de cola, coste y errores;
- QA de Pose Library & Model Consistency;
- ningún QR con datos faciales;
- ninguna promesa de talla o fit.

---

## 14. Fases posteriores

### Weather Intelligence

```text
ubicación + clima + contexto + armario
→ ranking y recomendación de prendas/outfits
```

Debe considerar temperatura aparente, viento, humedad, precipitación, UV, hora, actividad, ocasión y preferencias. El proveedor meteorológico debe ser intercambiable y válido para uso comercial.

### Dynamic Fabric Engine

```text
WebGL demo
→ TypeScript
→ React
→ texturas alpha
→ materiales
→ siluetas y anclajes
→ rendimiento adaptativo
→ exportación visual
→ clima opcional
```

No sustituye un try-on físico ni garantiza caída real.

---

## 15. Roadmap global

### Fase 0 — Consolidación y auditoría — ✅

Inventario, upstreams, licencias, terceros, ADR y criterios del MVP.

### Fase 1 — Foundation e integración — ✅

Wardrobe, MIRRORA, `fashion-schema`, IDs y catálogo compartido.

### Fase 2 — Persistencia y pipeline profesional — 🟠

2A–2F en PR #3; cerrar 2G, seguridad, demo real y decisión de merge.

**Salida:** jobs y ediciones sobreviven reinicios y navegadores autorizados.

### Fase 3 — Ontología V1 — ✅

Categorías, metadatos, validación y migración canónica.

### Fase 4 — Outfit Layer — ✅ base consolidada

Crear, revisar, asociar y publicar outfits con prendas reales.

### Fase 4B — Pose Library & Model Consistency Engine — 🟠

Documentación exacta y contrato ahora; runtime por microfases 1–5 después de alinearlo con Fase 2.

**Salida funcional:** una identidad y un outfit aprobados producen un pack de poses revisado, trazable y publicable.

### Fase 5 — Website Builder MVP — ⏳

Auditar builders, elegir una base, themes, secciones, responsive preview y storefront schema-driven.

### Fase 6 — Publicación y validación comercial — ⏳

Preview URLs, deploy piloto, analytics, funnel, tiempos, costes, errores y uso real.

### Pista 6B — Brand Acquisition & Spec Campaign Engine — 🧭

Tras Fase 2G y Campaign Builder: dominio de prospectos, rights/consent, campañas privadas, QA, outreach responsable, engagement y CRM handoff.

### Fase 7 — Try-On Gateway — ⏳

Contrato, consentimiento, proveedor inicial, benchmark y storefront.

### Fase 8 — SaaS — posterior a validación

Auth, organizaciones, roles, multitenancy, planes, Stripe, cuotas y administración.

### Fase 9 — Weather Intelligence — posterior

Geolocalización, proveedor, reglas, scoring y métricas de utilidad.

### Fase 10 — Dynamic Fabric Engine — posterior

Refactor, materiales, siluetas, clima, exportación e integración opcional.

---

## 16. Vertical slice prioritario

```text
crear proyecto
→ subir foto con varias prendas
→ detectar y revisar crops
→ aprobar PNG transparente
→ editar metadatos
→ crear/importar outfit
→ registrar modelo de referencia
→ seleccionar pose canónica
→ generar asset
→ revisar identidad + prenda + pose + anatomía
→ aprobar asset
→ seleccionar plantilla y secciones
→ mostrar prenda/outfit/asset en la web
→ publicar preview
→ medir interacción
```

Valida mejor el producto que construir muchas pantallas desconectadas.

---

## 17. Pruebas y calidad

### Tests mínimos

- schema y reglas;
- JSON Schema de bibliotecas de poses;
- conteo 1 referencia + 10 e-commerce + 10 editoriales;
- IDs únicos y prompts inmutables;
- API y persistencia;
- jobs y recuperación;
- E2E upload → review → generación → aprobación → publicación;
- uploads grandes e inválidos;
- seguridad de assets;
- responsive desktop/tablet/mobile;
- procedencia, licencia y estados fail-closed.

### Benchmark visual

1. identidad;
2. prenda;
3. pose;
4. silueta y construcción;
5. color y material;
6. logos y texto;
7. bordes y transparencia;
8. fit/drape visual sin convertirlo en promesa física;
9. manos y anatomía;
10. crop y framing;
11. fondo e iluminación;
12. realismo;
13. utilidad comercial.

No aprobar un output solo porque sea bonito.

---

## 18. Riesgos principales

1. **Licencias contaminadas:** código, pesos o datasets no comerciales en producción.
2. **Repositorios clonados ≠ integración:** cada activo necesita contrato, interfaz y criterio de salida.
3. **Varias fuentes de verdad:** Wardrobe, MIRRORA, outfits, poses y renders deben compartir IDs y persistencia.
4. **Prompt drift:** una IA reescribe la biblioteca y rompe consistencia.
5. **Identity drift:** el modelo cambia entre poses.
6. **Garment drift:** el render inventa, elimina o altera detalles.
7. **Builder descontrolado:** intentar construir Webflow + Shopify + Canva.
8. **Coste de IA:** no registrar intentos, latencia, proveedor y regeneraciones.
9. **Privacidad:** fotos personales sin consentimiento, separación o purge.
10. **Proveedor único:** dependencias cerradas sin adaptador.
11. **Deuda técnica:** fusionar prototipos enteros antes de definir límites.
12. **Confundir Draft con producción:** documentar como completado algo que vive solo en una rama/PR.

---

## 19. Reglas para agentes de IA y nuevas sesiones

Antes de tocar código o documentación:

1. Leer este README completo.
2. Revisar rama, working tree, PRs y estado real.
3. Leer el README del módulo afectado.
4. No asumir que un repo listado está integrado.
5. Revisar upstream y licencia antes de copiar.
6. No trabajar directamente en `main`.
7. Limitar cada PR a una microfase clara.
8. Mantener Wardrobe y MIRRORA ejecutables.
9. No exponer claves, fotos personales ni datos de producción.
10. No afirmar que un flujo funciona sin probarlo extremo a extremo.
11. No alterar prompts canónicos; crear versión nueva.
12. No publicar assets `generated` o `needs-review`.
13. No mezclar producto aprobado y medios generados.
14. No introducir SaaS, clima o telas en el MVP sin aprobación.
15. Actualizar README, roadmap, ADR y terceros cuando cambie arquitectura o alcance.

Orden recomendado:

```text
README.md
→ docs/PRODUCT.md
→ docs/ARCHITECTURE.md
→ docs/ROADMAP.md
→ docs/THIRD_PARTY.md
→ ADR relevante
→ README del módulo
→ PROMPTS/JSON/schema cuando afecte a poses
→ código y tests de la microfase
```

---

## 20. Convenciones de trabajo

- rama por microfase;
- PR Draft durante construcción;
- commits descriptivos;
- cambios pequeños y verificables;
- no mezclar refactor masivo y feature;
- conservar atribuciones;
- ADR para decisiones irreversibles;
- vertical slices antes que expansión horizontal.

Ramas orientativas:

```text
phase-2/persistence-foundation
feature/outfit-layer
agent/pose-library-model-consistency
feature/website-builder-mvp
feature/publishing-preview
feature/brand-acquisition-spec-campaign-engine
research/tryon-benchmark
```

---

## 21. Próxima acción recomendada

### Prioridad principal

Cerrar **Fase 2G** sobre PR #3:

1. demo real sobre datos migrados;
2. edición persistente y publicación;
3. catálogo MIRRORA y SavedLook entre navegadores;
4. job real autorizado, progreso y resultado;
5. seguridad, secretos, rollback y checks finales;
6. decisión de merge.

### Pista paralela controlada

Completar **Pose Library & Model Consistency Engine — Fase interna 1** solo sobre los contratos de Fase 2:

- pose browser;
- registro de identidad/referencia;
- prompt preview;
- upload de resultado;
- review y rechazo;
- sin crear otra base de datos o job system paralelo.

### Investigación previa de Fase 5

Inventariar y comparar builders existentes antes de seleccionar uno. No fusionar varios builders completos.

---

## 22. Definición de éxito del MVP

Una marca puede:

- importar fotografías reales;
- obtener prendas revisadas y estructuradas;
- crear o importar outfits;
- registrar un modelo autorizado;
- generar un pack consistente de assets e-commerce/editoriales;
- revisar y aprobar esos assets;
- elegir cómo se presentan;
- construir una web por secciones;
- publicar una preview responsive;
- medir interacción, coste y errores.

Sin necesitar todavía SaaS completo, facturación, clima, telas dinámicas, vídeo try-on o simulación física real.

---

## 23. Principio rector

> No estamos creando una colección de demos ni una carpeta de prompts. Estamos integrando un sistema operativo visual y comercial para moda.

Cada tecnología debe mejorar al menos una variable:

- calidad y fidelidad del catálogo;
- velocidad y control de creación;
- experiencia del consumidor;
- conversión o aprendizaje comercial.

Si no mejora ninguna, no pertenece al MVP.
