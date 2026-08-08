# Fashion Studio SOL

> Plataforma de inteligencia, creación y publicación para moda.
>
> Este README es el **documento maestro de continuidad** del proyecto. Debe permitir que cualquier nueva sesión, desarrollador o agente de IA entienda qué estamos construyendo, qué activos existen, qué repositorio hace cada cosa, cómo deben integrarse y qué fases faltan.

---

## Estado del proyecto — 2026-07-17

| Fase | Estado |
|---|---|
| **Fase 0** — Consolidación documental y auditoría | ✅ Completada y fusionada en `main` (PR #2). Ver `docs/AUDIT-2026-07-13.md`, `docs/THIRD_PARTY.md`, `docs/ADR/0001` |
| **Fase 1** — Foundation e integración de núcleos | ✅ Completada: pipeline real de Wardrobe validado de extremo a extremo (`docs/EXECUTION-WARDROBE-CORE-2026-07-17.md`), `fashion-schema` v0.1, exportador Wardrobe→MIRRORA, y MIRRORA consumiendo el catálogo real con Outfit Studio por categorías (MIRRORA PR #1 fusionado) |
| **Fase 2** — Persistencia y pipeline profesional | ⏳ **Pendiente** (JSON local + localStorage siguen siendo la persistencia actual; no es la solución definitiva) |
| **Fase 3** — Ontología V1 | ✅ Consolidada (contrato canónico único, CI verde). Ver `docs/CONSOLIDATION-3-4.md` |
| **Fase 4** — Outfit Layer | ✅ Consolidada (creación/revisión/publicación con validación fail-closed). Ver `docs/CONSOLIDATION-3-4.md` |
| Fase 5 — Website Builder MVP | Posterior. Investigación previa registrada: inventariar y comparar los builders existentes en los repositorios del propietario antes de elegir base |
| Fases 6-10 | Según roadmap |

---

## 1. Visión

Fashion Studio SOL debe convertir fotografías, catálogos y activos de una marca en una experiencia de moda completa:

```text
crear proyecto
→ importar fotografías o catálogo
→ detectar y reconstruir prendas
→ revisar y enriquecer el catálogo
→ crear outfits y contenido editorial
→ definir cómo se muestran prendas y looks
→ generar una web de moda
→ previsualizarla
→ publicarla
→ medir interacción y conversión
```

En una segunda etapa incorporará:

```text
recomendación según clima y contexto
+
movimiento dinámico de tejidos y prendas
+
virtual try-on mediante proveedores intercambiables
```

Fashion Studio SOL no es solo un armario digital ni un generador de imágenes. El objetivo final es un:

> **AI Fashion CMS + Wardrobe Intelligence + Outfit Engine + Fashion Website Builder + Visual Content Generator + Ecommerce Personalization Platform.**

---

## 2. Decisiones estratégicas ya aprobadas

1. **`Fashion-Studio-SOL` es el repositorio principal y canónico.**
2. **Wardrobe será el núcleo de ingesta, extracción, revisión y gestión de prendas.**
3. **MIRRORA será la base de la experiencia de consumidor, looks, wishlist, QR, carrito y configuración white-label.**
4. La falta inicial de una interfaz completa de outfits no bloquea el MVP: se podrán importar imágenes locales, generar outfits mediante skill y asociarlos posteriormente a las prendas.
5. El constructor de webs se construirá mediante **secciones configurables y plantillas**, no intentando replicar Webflow desde el principio.
6. La arquitectura SaaS completa, multitenancy y facturación se implementarán después de validar el producto.
7. Antes de SaaS sí deben resolverse la persistencia inconsistente, los uploads, los jobs, las pruebas y la separación entre módulos.
8. La ontología crecerá de forma progresiva. Se implementará una **V1 suficiente y extensible**, no una taxonomía gigantesca antes de validar.
9. Clima y telas dinámicas pertenecen a una fase posterior y no bloquearán la validación inicial.
10. Ningún repositorio, modelo, checkpoint o dataset entrará en producción sin auditoría de licencia y uso comercial.

---

## 3. Superficies del producto

### 3.1 Fashion Studio — aplicación interna

Utilizada por la marca, diseñador, tienda o equipo de marketing.

Funciones objetivo:

- Crear proyectos y colecciones.
- Importar fotografías, carpetas y catálogos.
- Detectar prendas.
- Revisar crops y reconstrucciones.
- Editar metadatos.
- Generar imágenes de producto y editoriales.
- Crear y gestionar outfits.
- Elegir modelos de presentación.
- Construir la web de moda.
- Previsualizar y publicar.
- Revisar jobs, costes, errores y QA.

### 3.2 Fashion Storefront — experiencia pública

Utilizada por el consumidor final.

Funciones objetivo:

- Home de marca.
- Colecciones.
- Fichas de producto.
- Looks y lookbooks.
- Shop the Look.
- Wishlist.
- Outfit builder.
- Avatar editorial.
- Virtual try-on opcional.
- QR y handoff entre escaparate, móvil y carrito.
- Recomendaciones según clima en fases posteriores.

### 3.3 Brand Console / Website Builder

Utilizada para configurar y publicar experiencias white-label.

Funciones objetivo:

- Identidad visual.
- Tema y design tokens.
- Catálogo y productos activos.
- Plantillas.
- Secciones configurables.
- Orden y visibilidad de secciones.
- CTA, carrito y campañas.
- Preview responsive.
- Publicación.

### 3.4 Operations Console

Utilizada para supervisar el procesamiento.

```text
upload
→ detect
→ crop review
→ garment generation
→ background cleanup
→ garment QA
→ modeled image
→ outfit
→ storefront
→ publish
```

Cada job debe mostrar estado, duración, coste, proveedor, intentos, errores y acciones de recuperación.

---

## 4. Estado actual real

No partimos desde cero. Existen dos núcleos funcionales complementarios y varios activos auxiliares.

### Evaluación aproximada

| Área | Estado estimado |
|---|---:|
| Ingesta y gestión de prendas | 75–80 % del prototipo |
| Experiencia de consumidor | 60–70 % del prototipo |
| Outfits | 45–55 % |
| Constructor de webs | 20–30 % |
| Virtual try-on comercial | 10–20 % |
| MVP integrado completo | ~45 % |
| Superficies funcionales repartidas en prototipos | ~65 % |

Estas cifras no significan que todo esté conectado. Actualmente los activos no comparten aún una base de datos, esquema, jobs, publicación ni arquitectura común.

---

## 5. Mapa de repositorios y responsabilidades

### 5.1 Repositorios núcleo

#### `Juanmaes83/Fashion-Studio-SOL`

**Rol:** repositorio principal y producto integrado.

Debe contener progresivamente:

- Aplicaciones principales.
- Paquetes compartidos.
- Esquema de moda.
- Servicios de procesamiento.
- Website builder.
- Documentación de arquitectura.
- Tests.
- Registro de licencias y decisiones.

**No debe convertirse** en una copia indiscriminada de todos los repositorios auxiliares.

---

#### `Juanmaes83/wardrobe`

**Upstream original:** `tandpfun/wardrobe`  
**Licencia:** MIT.

**Rol:** Wardrobe Core.

Aporta:

- React + Vite.
- Galería editorial de prendas.
- Filtros por categoría.
- Drawer de edición.
- Nombre, categoría, colores y tags.
- Drag, drop y paste.
- Detección de múltiples prendas mediante OpenAI Responses API.
- Bounding boxes y crops automáticos.
- Generación de prendas aisladas.
- Chroma key adaptativo.
- Eliminación de fondo, despill y QA de bordes.
- Revisión humana por etapas.
- Imagen editorial con modelo de referencia.
- Persistencia local en JSON.
- Recuperación de jobs locales.
- Skill `import-clothes`.
- Skill `generate-outfits`.

Flujo actual:

```text
foto
→ detección
→ crop
→ aprobación
→ reconstrucción de prenda
→ limpieza de fondo
→ aprobación
→ imagen modelada
→ aprobación
→ biblioteca local
```

**Qué conservar:**

- Pipeline y estados.
- Skills.
- Motor de chroma.
- UX de revisión.
- Galería y drawer.
- Prompts con preservación de fidelidad.

**Qué modificar:**

- Migrar progresivamente a TypeScript.
- Separar frontend, API y workers.
- Desacoplar extracción de prenda y generación de modelo.
- Sustituir JSON/localStorage como fuente de verdad.
- Añadir upload a storage y jobs persistentes.
- Ampliar categorías y esquema.
- Añadir tests.
- Conectar outfits y storefront.

**Cómo se integra:**

Wardrobe no será la aplicación final aislada. Su lógica se convertirá en módulos `wardrobe-core`, `image-pipeline` y la aplicación interna `studio`.

---

#### `Juanmaes83/MIRRORA-Style-Studio`

**Rol:** Consumer Experience Core y primer Brand Console.

Aporta una PWA funcional con:

- Home editorial.
- Catálogo piloto.
- Avatar editorial paramétrico sin foto.
- Estudio de combinaciones.
- Órbita de complementos.
- Looks guardados.
- Wishlist.
- QR y handoff.
- CTA hacia carrito.
- Funnel local de eventos.
- PWA y service worker.
- Consola de marca white-label.
- Tema, colores, recompensa, carrito y catálogo activo.
- Preview en vivo.
- Exportación e importación JSON.
- QR de campaña.

Flujo actual:

```text
descubrir look
→ identidad de estilo
→ avatar
→ probar y combinar
→ guardar
→ QR / móvil
→ carrito
```

Arquitectura conceptual ya definida:

- PWA de consumidor.
- `mirrora-tryon-gateway` separado.
- Handoff con Escaparates Pro / Gesture Lab.
- Ningún dato facial en QR.
- No prometer talla o fit físico.

**Qué conservar:**

- UX de consumidor.
- Looks y wishlist.
- Avatar de nivel 1.
- QR/handoff.
- Funnel.
- Consola white-label.
- Separación de try-on mediante gateway.

**Qué modificar:**

- Reemplazar catálogo SVG piloto por prendas reales de Wardrobe.
- Sustituir localStorage como fuente de verdad.
- Conectar productos, outfits y assets compartidos.
- Evolucionar la consola hacia un website builder por secciones.
- Añadir preview responsive real.
- Añadir publicación de múltiples sitios.

**Cómo se integra:**

MIRRORA se dividirá en:

- `apps/storefront`.
- `apps/brand-console`.
- `packages/qr-handoff`.
- `packages/analytics`.
- Componentes reutilizables de avatar, catálogo, wishlist y looks.

---

### 5.2 Repositorios auxiliares utilizables

#### `Juanmaes83/ai-closet`

**Upstream original:** `zebangeth/ai-closet`  
**Licencia:** MIT.

**Rol:** AI Closet Engine y referencia de UX para armario, canvas de looks y try-on.

Aporta:

- App Expo / React Native de armario digital.
- Categorizacion visual de prendas.
- Eliminacion de fondo mediante proveedor externo.
- Canvas de outfits con gestos de mover, escalar, rotar y ordenar capas.
- Virtual try-on mediante proveedor externo.
- Estados locales de procesamiento.

**Decision de integracion:**

No se integra como app completa dentro de Fashion Studio SOL. Se adapta como
`packages/ai-closet-engine`, un modulo portable con contratos, mapeo a
`fashion-schema`, jobs y cliente de gateway.

**Regla de seguridad:**

Los servicios AI no pueden ejecutarse desde frontend ni usar claves `EXPO_PUBLIC_*`.
Categorizacion, fondo transparente y try-on deben pasar por backend/proxy
(`mirrora-tryon-gateway` o API equivalente) con secretos server-side, consentimiento,
TTL, purge y auditoria.

**Como se integra:**

```text
ai-closet reference
→ packages/ai-closet-engine
→ fashion-schema/Garment + Outfit
→ SOL Studio / Operations
→ MIRRORA closet, canvas y try-on gateway
```

#### `Juanmaes83/aiclothswap-showcase`

**Rol:** Prompt QA, benchmark y reparación de resultados.

Aporta:

- Prompts de clothes swap.
- Casos sintéticos.
- Fallos frecuentes.
- Prompts de reparación dirigidos.
- Rúbrica de evaluación.

Dimensiones de QA reutilizables:

- Preservación de identidad.
- Fidelidad de prenda.
- Fit y drape.
- Estabilidad del fondo.
- Manos y bordes.
- Iluminación y sombras.
- Utilidad final.

**Integración prevista:**

```text
packages/prompt-qa
skills/audit-generated-fashion
tests/visual-benchmark
```

No es el motor privado de AIClothSwap y no debe tratarse como tal.

---

#### `Juanmaes83/fashionAI`

**Licencia del código:** MIT.

**Rol:** referencia de UX y patrones de integración.

Aporta:

- Next.js.
- Upload.
- Comparación antes/después.
- Slider visual.
- Rate limiting con Upstash.
- Integración con proveedor externo.
- Framer Motion y Tailwind.

**Integración prevista:** extraer patrones o componentes concretos, no usar la aplicación completa como base.

Motivo: arquitectura antigua, prototipo descrito por su autor como modificación rápida de RoomGPT y dependencia de una pipeline histórica.

---

#### `Juanmaes83/gestalt-A-set-of-React-UI-components-that-supports-Pinterest-s-design-language`

**Upstream:** Pinterest Gestalt.  
**Licencia:** Apache 2.0.

**Rol:** referencia y posible librería selectiva de componentes accesibles.

Posibles usos:

- Grid/masonry.
- Modal y sheet.
- Tabs.
- Combobox.
- Segmented controls.
- Toast.
- Estados de foco y accesibilidad.

**Regla:** Fashion Studio SOL debe conservar lenguaje visual propio. No se clonará el monorepo completo ni se imitará Pinterest visualmente.

---

#### `Juanmaes83/llmd-flow-visualizer`

**Licencia:** Apache 2.0.

**Rol:** referencia visual para Operations Console.

Aporta:

- Flujos animados.
- Componentes inspeccionables.
- Estados paso a paso.
- Visualización de arquitecturas complejas.

**Integración prevista:** adaptar el patrón de flujo, no su contenido de Kubernetes/LLM-D.

---

#### `Juanmaes83/clarity-upscaler`

**Rol:** investigación para mejora y upscale de assets.

Posibles usos:

- Cutouts.
- Imágenes editoriales.
- Outfits.
- Campañas.
- Exportaciones de alta resolución.

**Riesgo:** licencia y obligaciones del upstream deben auditarse antes de integrar. No debe entrar directamente en el core.

**Integración prevista:** proveedor aislado e intercambiable:

```text
services/image-enhancement-provider
```

---

### 5.3 Repositorios de investigación — no integrar directamente en producción

#### `Juanmaes83/Magic-TryOn`

**Rol:** benchmark de virtual try-on de imagen y vídeo.

Aporta conocimiento sobre:

- Wan 2.1.
- Diffusion Transformer.
- Consistencia temporal.
- Preservación coarse-to-fine de prendas.
- DensePose, human parsing y máscaras.
- Try-on de vídeo.

**Licencia:** CC BY-NC-SA 4.0.  
**Decisión:** solo I+D y benchmark. No utilizar código ni pesos en el producto comercial sin licencia adicional.

---

#### `Juanmaes83/IMAGDressing`

**Rol:** benchmark para generación controlada mediante prenda, pose, rostro y escena.

Aporta conocimiento sobre:

- IP-Adapter.
- ControlNet.
- Inpainting.
- Pose.
- FaceID.
- Métrica CAMI.

**Licencias:** el código puede ser permisivo, pero modelos y checkpoints publicados están restringidos a investigación no comercial.

**Decisión:** utilizar como referencia de arquitectura, métricas y benchmark; no sus checkpoints en producción.

---

#### `Juanmaes83/AI_Fashion_Cloth_Changer`

**Rol:** laboratorio histórico de DreamBooth, Stable Diffusion, ControlNet e inpainting.

Aporta conocimiento sobre:

- Entrenamiento específico.
- Datasets y tagging.
- Máscaras.
- Transferencia de prendas.

**Riesgos:** stack antiguo, entrenamiento caro, reproducibilidad limitada y licencia pendiente de auditoría.

**Decisión:** conservar como referencia histórica, no integrar.

---

#### `Juanmaes83/deepchange`

**Rol real:** dataset y benchmark de reidentificación de personas con cambios de ropa.

No es un motor de outfits, recomendación, extracción o virtual try-on.

**Licencia/datos:** uso no comercial de investigación, con restricciones fuertes sobre imágenes y derivados.

**Decisión:** no integrar en Fashion Studio SOL. Solo podría inspirar investigación futura sobre consistencia de identidad.

---

### 5.4 Repositorios futuros por inventariar

El usuario dispone de varios website builders y proyectos web en GitHub que podrán aportar:

- Editor de secciones.
- Drag and drop.
- Plantillas.
- Design tokens.
- Preview responsive.
- Publicación.

**Antes de seleccionar uno:**

1. Auditar arquitectura.
2. Auditar licencia.
3. Confirmar que el editor es modular.
4. Evaluar deuda técnica.
5. Evitar fusionar varios builders completos.
6. Extraer únicamente el mejor núcleo o patrones reutilizables.

El objetivo no es coleccionar builders, sino elegir una base de edición compatible con el esquema de Fashion Studio SOL.

---

## 6. Arquitectura objetivo

```text
Fashion-Studio-SOL/
├── apps/
│   ├── studio/                  # Operador: prendas, outfits, contenido y webs
│   ├── storefront/              # Web pública generada
│   ├── brand-console/           # Configuración white-label y website builder
│   ├── api/                     # API de negocio
│   ├── vision-worker/           # Procesamiento IA/imagen
│   └── operations-console/      # Jobs, costes, errores y QA
│
├── packages/
│   ├── ui/                      # Design system propio
│   ├── fashion-schema/          # Contrato común de datos
│   ├── wardrobe-core/           # Prendas, galería y edición
│   ├── image-pipeline/          # Detección, crops, generación y limpieza
│   ├── outfit-core/             # Outfits y relaciones entre prendas
│   ├── outfit-engine/           # Reglas, scoring y recomendaciones
│   ├── website-builder/         # Secciones, temas y publicación
│   ├── storefront-sections/     # Bloques renderizables
│   ├── prompt-qa/               # Prompts, reparación y benchmarks
│   ├── analytics/               # Funnel y eventos
│   ├── qr-handoff/              # Contratos QR/campaña
│   ├── weather-engine/          # Fase posterior
│   └── fabric-motion/           # Fase posterior
│
├── services/
│   ├── tryon-gateway/           # Proveedores intercambiables
│   ├── image-enhancement/       # Upscale/mejora opcional
│   └── publishing/              # Preview y deploy
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

La estructura podrá ajustarse después de la fase de consolidación. No se debe crear toda vacía solo para aparentar avance.

---

## 7. Contrato de datos común

El primer gran trabajo de integración es crear `fashion-schema`.

### Entidades iniciales

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

### Ontología V1 aprobada

Debe ser suficiente para catálogo, outfits, web y clima básico sin bloquear el MVP:

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

Campos de ecommerce opcionales desde el diseño, aunque no todos sean obligatorios inicialmente:

```text
sku
brand
price
currency
sizes
stock
productUrl
```

### Evolución posterior

La ontología V2 podrá añadir:

- Cuello.
- Manga.
- Longitud.
- Cierre.
- Construcción.
- Peso del tejido.
- Transpirabilidad.
- Impermeabilidad.
- Elasticidad.
- Formalidad.
- Capas.
- Compatibilidad climática avanzada.
- Reglas de cuidado.
- Atributos específicos por categoría.

**Decisión:** esquema extensible y progresivo. No implementar toda la taxonomía mundial de moda antes del piloto.

---

## 8. Outfit Layer

### Situación actual

- Wardrobe incluye una skill capaz de crear outfits.
- MIRRORA ya representa y guarda looks.
- El usuario dispone o puede disponer de imágenes de outfits locales.
- Falta una entidad común y la interfaz editorial completa observada en el vídeo.

### Estrategia inicial

Se admitirán tres fuentes:

1. Imágenes locales subidas manualmente.
2. Outfits generados mediante la skill.
3. Outfits creados manualmente seleccionando prendas del catálogo.

### Entidad mínima

```json
{
  "id": "outfit-id",
  "name": "Navy & Camel Classic",
  "garmentIds": ["garment-1", "garment-2"],
  "occasion": ["smart-casual"],
  "season": ["autumn"],
  "description": "...",
  "tags": ["tonal", "layered"],
  "modeledImage": "...",
  "flatLayImage": "...",
  "status": "draft | review | approved"
}
```

### UI objetivo

- Grid editorial.
- Filtros.
- Hover o tap modelo → prendas utilizadas.
- Drawer del look.
- Flat lay.
- Descripción.
- Etiquetas.
- Regeneración.
- Compra el look.
- Asociación verificable con prendas reales.

---

## 9. Website Builder MVP

El primer builder será estructurado, no completamente libre.

### Secciones iniciales

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

### Cada sección debe ser schema-driven

Ejemplo conceptual:

```json
{
  "type": "shop-the-look",
  "visible": true,
  "order": 4,
  "settings": {
    "title": "Complete the look",
    "outfitIds": ["look-1", "look-2"],
    "layout": "editorial-grid"
  }
}
```

### Capacidades del MVP

- Elegir plantilla.
- Editar branding.
- Añadir, ocultar y reordenar secciones.
- Seleccionar productos y outfits.
- Editar textos y medios.
- Preview desktop, tablet y móvil.
- Publicar en una URL.

### Fuera del MVP

- Editor libre pixel-perfect.
- Código arbitrario por usuario.
- Marketplace completo de temas.
- CMS genérico para cualquier industria.

---

## 10. Persistencia y procesamiento antes del SaaS

Aunque el SaaS completo se pospone, no podemos validar con datos inconsistentes.

### Problemas actuales a resolver

- Wardrobe mezcla JSON local y localStorage.
- MIRRORA usa localStorage por dispositivo.
- Las imágenes se envían como Data URL dentro de JSON.
- Los jobs se ejecutan dentro del proceso local.
- No hay cola persistente.
- No hay fuente central de verdad.

### Solución para el MVP validable

No es necesario construir multitenancy completo, pero sí:

- Base de datos persistente sencilla.
- Storage de assets.
- Upload directo mediante URL firmada o multipart.
- Tabla de jobs.
- Worker separado.
- Estados recuperables.
- IDs comunes.
- Logs básicos.
- Control de coste y reintentos.

Infraestructura prevista:

- Vercel para frontend y previews.
- Railway para API y workers.
- PostgreSQL/Supabase para persistencia.
- Storage compatible con URLs firmadas.
- Redis/cola solo cuando el volumen lo justifique, pero con interfaz preparada.

### SaaS posterior

Después de validación:

- Organizaciones.
- Usuarios y roles.
- Multitenancy.
- Límites.
- Facturación.
- Planes.
- Cuotas de IA.
- Auditoría avanzada.

---

## 11. Virtual Try-On Gateway

El try-on será un servicio separado con proveedor intercambiable.

```text
submit(job) → job_id
status(job_id) → queued | running | done | failed
result(job_id) → asset temporal firmado
purge(job_id) → borrado verificable
```

### Requisitos no negociables

- Consentimiento explícito.
- TTL.
- Borrado.
- Auditoría.
- Métricas de cola.
- Separación de fotos personales.
- No prometer talla ni fit físico.
- Ningún QR transporta datos faciales.

### Proveedores

La primera versión podrá usar una API comercial o generación de imagen general con QA. Los modelos de investigación servirán para benchmark, no para producción si sus licencias lo impiden.

---

## 12. Weather Intelligence — fase posterior

Objetivo:

```text
ubicación + clima + contexto + armario
→ ranking y recomendación de prendas/outfits
```

No se basará únicamente en temperatura.

Variables relevantes:

- Temperatura aparente.
- Viento y rachas.
- Humedad.
- Precipitación.
- UV.
- Hora.
- Actividad.
- Ocasión.
- Preferencias.

La fuente meteorológica deberá ser intercambiable y revisada para uso comercial. Open-Meteo es un candidato, pero no debe asumirse que su servicio alojado gratuito cubre un SaaS comercial.

El motor actuará como reranker de:

- Home.
- Catálogo.
- Outfits.
- Planner.
- Recomendaciones.

---

## 13. Dynamic Fabric Engine — fase posterior

El repositorio de banderolas/telas dinámicas es una prueba de concepto, no un motor de ropa terminado.

Evolución prevista:

```text
WebGL demo
→ módulo TypeScript
→ componente React
→ texturas alpha
→ presets de material
→ rendimiento adaptativo
→ silueta de prenda
→ anclajes por categoría
→ exportación de vídeo
→ conexión meteorológica
```

Variables potenciales:

- Velocidad y dirección del viento.
- Rachas.
- Humedad.
- Lluvia.
- Tipo y peso de tejido.

Este módulo no sustituye un virtual try-on físico ni garantiza caída real sobre el cuerpo.

---

## 14. Roadmap

### Fase 0 — Consolidación documental y auditoría

**Objetivo:** saber exactamente qué existe y qué puede usarse.

- Mantener este README actualizado.
- Inventariar repositorios adicionales.
- Registrar upstream.
- Auditar licencias.
- Crear `THIRD_PARTY.md`.
- Crear ADR de integración Wardrobe + MIRRORA.
- Definir criterios de aceptación del MVP.

**Salida:** mapa de activos aprobado y sin ambigüedades.

---

### Fase 1 — Foundation e integración de núcleos

- Inicializar estructura mínima del repositorio.
- Importar Wardrobe preservando atribución MIT.
- Importar MIRRORA como aplicación separada.
- Crear `fashion-schema`.
- Normalizar IDs.
- Compartir catálogo y assets.
- Mantener ambas experiencias ejecutables.

**Criterio de salida:** una prenda aprobada en Wardrobe puede aparecer en el catálogo MIRRORA sin duplicar datos manualmente.

---

### Fase 2 — Persistencia y pipeline profesional

- Reemplazar JSON/localStorage como fuente de verdad.
- Base de datos inicial.
- Storage de assets.
- Upload escalable.
- Jobs persistentes.
- Worker separado.
- Reintentos.
- Logs y coste.
- Separar extracción y modeled rendering.

**Criterio de salida:** un job sobrevive a reinicios y sus ediciones se ven en cualquier navegador autorizado del entorno de prueba.

---

### Fase 3 — Ontología V1 y catálogo completo

- Implementar categorías y subcategorías necesarias.
- Añadir material, patrón, silueta, season, style, occasion y thermalWeight.
- Migrar metadatos existentes.
- Validación con Zod/JSON Schema.
- Editor de ficha mejorado.

**Criterio de salida:** las prendas tienen datos suficientes para búsqueda, outfits y storefront sin campos libres incoherentes.

---

### Fase 4 — Outfit Layer

- Import de imágenes locales.
- Import de manifiestos generados.
- Outfit builder manual.
- Asociación outfit-prendas.
- Grid editorial.
- Drawer y flat lay.
- Generación y regeneración.
- QA visual.
- Shop the Look.

**Criterio de salida:** se puede crear, revisar, mostrar y publicar un outfit formado por prendas reales del catálogo.

---

### Fase 5 — Website Builder MVP

- Themes y design tokens.
- Biblioteca de secciones.
- Reordenación.
- Configuración.
- Preview responsive.
- Home, colección, PDP y lookbook.
- Storefront generado por schema.

**Criterio de salida:** una marca puede construir una web de moda funcional sin modificar código.

---

### Fase 6 — Publicación y validación comercial

- Preview URLs.
- Deploy.
- Dominio de piloto.
- Analytics.
- Funnel catálogo → look → carrito/lead.
- Piloto real.
- Medición de tiempos, costes, errores y uso.

**Criterio de salida:** una marca real utiliza la plataforma y se puede medir si el flujo aporta valor.

---

### Fase 7 — Try-On Gateway

- Contrato de proveedor.
- Consentimiento.
- TTL y purge.
- Proveedor inicial.
- Benchmark de calidad.
- Integración en storefront.

---

### Fase 8 — SaaS

Solo después de validar:

- Auth.
- Organizaciones.
- Roles.
- Multitenancy.
- Planes.
- Stripe.
- Cuotas y facturación de IA.
- Panel de administración.

---

### Fase 9 — Weather Intelligence

- Geolocalización con permiso.
- Ciudad manual.
- Proveedor meteorológico.
- Reglas y scoring.
- Recomendaciones y reranking.
- Métricas de utilidad.

---

### Fase 10 — Dynamic Fabric Engine

- Refactor de la prueba WebGL.
- Presets textiles.
- Siluetas y anclajes.
- Interacción con clima.
- Exportación visual.
- Integración opcional en storefront y campañas.

---

## 15. Primer vertical slice recomendado

Antes de ampliar todas las fases, Fashion Studio SOL debe demostrar este recorrido completo:

```text
crear proyecto
→ subir una foto con varias prendas
→ detectar prendas
→ revisar crops
→ aprobar un PNG transparente
→ editar metadatos
→ crear o importar un outfit
→ seleccionar una plantilla
→ mostrar prenda y outfit en una web
→ publicar preview
```

Este flujo valida el núcleo del producto mejor que construir muchas pantallas desconectadas.

---

## 16. Pruebas y calidad

### Tests mínimos

- Unitarios del schema y reglas.
- Integración de API y persistencia.
- E2E de upload → aprobación → publicación.
- Tests visuales desktop/tablet/mobile.
- Recuperación de jobs.
- Uploads grandes y tipos inválidos.
- Seguridad de rutas de assets.

### Benchmark de imagen

Cada resultado debe evaluarse en:

1. Fidelidad de identidad.
2. Fidelidad de prenda.
3. Silueta y construcción.
4. Color y material.
5. Logos y texto.
6. Bordes y transparencia.
7. Fit/drape visual.
8. Manos y anatomía.
9. Fondo e iluminación.
10. Utilidad comercial.

No aprobar una imagen únicamente porque sea atractiva.

---

## 17. Riesgos principales

### 17.1 Licencias contaminadas

No mezclar código, pesos o datasets no comerciales en producción.

### 17.2 Repositorios clonados ≠ módulos integrados

Cada activo debe tener contrato, propietario, interfaz y criterio de aceptación.

### 17.3 Dos fuentes de verdad

Wardrobe y MIRRORA deben compartir `fashion-schema` y persistencia.

### 17.4 Builder demasiado ambicioso

No intentar construir Webflow, Shopify y Canva simultáneamente.

### 17.5 Coste de IA

Registrar coste, intentos y regeneraciones por job.

### 17.6 Imágenes bonitas pero incorrectas

La fidelidad del producto tiene prioridad sobre el impacto visual.

### 17.7 Privacidad

Las fotos personales deben permanecer separadas, temporales y auditables.

### 17.8 Dependencia de un proveedor

Usar interfaces intercambiables para imagen, try-on, clima, storage y upscale.

### 17.9 Deuda técnica por fusionar prototipos

No copiar todos los archivos directamente. Primero definir límites y contratos.

---

## 18. Reglas para agentes de IA y nuevas sesiones

Antes de modificar código:

1. Leer este README completo.
2. Revisar el estado real del repositorio y la rama.
3. No asumir que un repositorio listado está integrado.
4. Revisar licencia y upstream antes de copiar código.
5. No trabajar directamente en `main` después del commit inicial.
6. Crear rama enfocada.
7. Limitar cada PR a una microfase clara.
8. Ejecutar tests disponibles.
9. Documentar cambios de arquitectura.
10. No introducir SaaS, clima o telas dentro del MVP sin aprobación explícita.
11. Mantener Wardrobe y MIRRORA ejecutables durante la integración.
12. No exponer API keys, fotos personales ni carpetas `data/`.
13. No afirmar que una función existe sin probarla de principio a fin.

### Orden de lectura recomendado

```text
README.md
→ docs/PRODUCT.md
→ docs/ARCHITECTURE.md
→ docs/ROADMAP.md
→ docs/THIRD_PARTY.md
→ ADR relevante
→ código de la microfase
```

---

## 19. Convenciones de trabajo

- Rama por microfase.
- PR antes de merge.
- Commits descriptivos.
- Cambios pequeños y verificables.
- No mezclar refactor masivo con funcionalidad nueva.
- Mantener atribuciones de terceros.
- Documentar decisiones irreversibles mediante ADR.
- Priorizar vertical slices y validación real.

Ramas sugeridas:

```text
foundation/asset-inventory
foundation/wardrobe-mirrora-integration
core/fashion-schema-v1
core/persistent-jobs
feature/outfit-layer
feature/website-builder-mvp
feature/publishing-preview
research/tryon-benchmark
```

---

## 20. Próxima acción recomendada

Fases 0, 1, 3 y 4 están completadas y consolidadas (contrato canónico único,
máquina de estados protegida, CI verde en los tres repos; ver
`docs/CONSOLIDATION-3-4.md`). Los PR permanecen en draft a la espera de aprobación.

**Siguiente decisión real del roadmap: Fase 2 — Persistencia y pipeline profesional.**
Es el desbloqueo pendiente antes de cualquier SaaS. Decisión a tomar:

1. Elegir base de datos y storage (el roadmap propone PostgreSQL/Supabase + storage
   con URLs firmadas) manteniendo estables los IDs y el contrato `fashion-schema`.
2. Migrar la fuente de verdad de JSON local (`wardrobe/data`) y localStorage
   (MIRRORA) a persistencia compartida **sin cambiar la semántica** ya consolidada.
3. Extraer la Studio API y el pipeline de import a un servicio desplegable
   (hoy viven en el dev server de Vite).

En paralelo, investigación previa de Fase 5 (Website Builder): inventariar y comparar
los builders existentes en los repositorios del propietario antes de elegir base.

---

## 21. Definición de éxito del MVP

Fashion Studio SOL alcanza su primer objetivo cuando una marca puede:

- Importar fotografías reales.
- Obtener prendas revisadas y estructuradas.
- Crear o importar outfits.
- Elegir cómo se presentan.
- Construir una web de moda mediante secciones.
- Publicar una preview usable en móvil, tablet y escritorio.
- Medir interacción con productos, looks y CTA.

Sin necesidad todavía de:

- SaaS completo.
- Facturación.
- Clima.
- Telas dinámicas.
- Vídeo try-on.
- Simulación física real de fit.

---

## 22. Principio rector

> No estamos creando una colección de demos de IA. Estamos integrando un sistema operativo visual y comercial para moda.

Cada nueva tecnología debe mejorar al menos una de estas cuatro variables:

- Calidad del catálogo.
- Velocidad de creación.
- Experiencia del consumidor.
- Conversión o aprendizaje comercial.

Si no mejora ninguna, no pertenece al MVP.
