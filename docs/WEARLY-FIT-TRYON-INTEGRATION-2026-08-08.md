# Wearly ↔ Fashion Studio SOL ↔ Wardrobe ↔ MIRRORA

**Fecha de continuidad:** 2026-08-08  
**Estado:** repositorio Wearly auditado y aceptado como pieza propia del ecosistema. Integración documentada; conexión de código todavía pendiente.

## Resumen ejecutivo

El repositorio propio `Juanmaes83/wearly` se incorpora formalmente al mapa de Fashion Studio SOL como **Fit Intelligence + Fit-Aware Virtual Try-On Engine**.

Repositorio:

- https://github.com/Juanmaes83/wearly

Wearly no sustituye a Wardrobe, MIRRORA ni Fashion Studio SOL. Cubre un hueco entre ellos:

```text
Wardrobe
→ crea y valida la prenda digital

Fashion Studio SOL / fashion-schema
→ define el contrato canónico de producto, variante, talla y material

Wearly
→ calcula el fit y genera el try-on consciente de talla/corte

MIRRORA
→ presenta la experiencia al consumidor y cierra wishlist / QR / cart / CTA
```

## Qué existe hoy en Wearly

El repositorio auditado contiene un prototipo funcional con:

- Next.js + React + TypeScript;
- perfil corporal;
- fotos frontal, lateral y trasera;
- almacenamiento local de referencias en IndexedDB;
- catálogo y variantes demo;
- selección de talla, color y corte;
- `lib/fitEngine.ts` con cálculo determinista de ajuste;
- `lib/tryOnPrompt.ts` para traducir Fit Report a instrucciones visuales;
- `lib/virtualTryOn.ts` como servicio de generación;
- `lib/tryOnJobs.ts` como registro de jobs;
- caché por perfil/producto/talla/color/fit;
- prewarm y optimización de fotos/prenda;
- endpoint `/api/try-on`;
- generación real con proveedor de imagen;
- progressive previews / SSE cuando el proveedor lo permite;
- validación de inputs, tamaños y formatos;
- rate limiting básico;
- tests de fit, seguridad, responsive, jobs y HTML renderizado.

## La aportación diferencial

El problema que Wearly intenta resolver es que un generador visual puede “embellecer” el resultado y mostrar una prenda aparentemente correcta aunque el usuario haya elegido una talla equivocada.

Wearly añade una etapa previa:

```text
cuerpo + prenda + talla + corte + tejido
→ Fit Engine
→ Fit Report
→ consecuencias físicas esperadas
→ generación visual condicionada por esas consecuencias
```

El Fit Report trabaja con conceptos como:

- `too-small`;
- `correct`;
- `too-large`;
- chest / waist / hip / shoulder;
- ease;
- stretch;
- silhouette geometry;
- ride-up;
- closure gap;
- manga y largo;
- landmarks verticales;
- exposición provocada por una talla incorrecta;
- mandates visuales para el renderer.

## Rol exacto de cada repositorio

### `Juanmaes83/wardrobe`

**Rol:** Garment Source / Wardrobe Core.

Responsabilidad:

- importar fotos/catálogos;
- detectar prendas;
- crop;
- reconstrucción;
- background cleanup;
- QA;
- metadatos;
- assets aprobados;
- biblioteca de prendas.

No debe convertirse en el motor de fitting del consumidor.

### `Juanmaes83/wearly`

**Rol:** Fit Intelligence + Fit-Aware Virtual Try-On Engine.

Responsabilidad:

- interpretar talla/corte/material sobre un cuerpo;
- generar Fit Report;
- explicar fit;
- construir el brief técnico del render;
- ejecutar o solicitar el try-on;
- gestionar jobs/cache específicos de try-on mientras el provider gateway común no los absorba;
- servir resultados estructurados a la experiencia de consumidor.

### `Juanmaes83/MIRRORA-Style-Studio`

**Rol:** Consumer Experience Core.

Responsabilidad:

- catálogo de consumidor;
- selector de producto/variante;
- entrada al try-on;
- visualización del resultado;
- explicación “How this fits you”;
- looks;
- wishlist;
- QR / mobile handoff;
- carrito;
- CTA;
- experiencia white-label;
- conversión.

MIRRORA no debe volver a implementar un Fit Engine paralelo.

### `Juanmaes83/Fashion-Studio-SOL`

**Rol:** producto canónico y capa de coordinación.

Responsabilidad progresiva:

- fashion-schema;
- contratos comunes;
- catálogo canónico;
- jobs persistentes;
- storage;
- provider gateway;
- costes;
- configuración de marca;
- operaciones;
- publicación;
- analytics;
- ecommerce connectors;
- gobierno de Wardrobe, Wearly y MIRRORA como piezas especializadas.

## Flujo funcional objetivo

```text
1. Marca importa catálogo / fotos
   ↓
2. Wardrobe detecta y reconstruye prendas
   ↓
3. Humano aprueba asset y metadatos
   ↓
4. Fashion Studio SOL normaliza producto/variante
   ↓
5. Se incorporan talla, fit, material y medidas
   ↓
6. MIRRORA muestra producto al consumidor
   ↓
7. Consumidor selecciona talla/color/corte
   ↓
8. Perfil corporal + referencias entran en Wearly
   ↓
9. Wearly calcula Fit Report
   ↓
10. Se genera try-on consciente del fit
   ↓
11. MIRRORA muestra resultado + explicación
   ↓
12. Usuario cambia talla o guarda resultado
   ↓
13. Wishlist / outfit / QR / carrito / CTA
   ↓
14. Analytics y conversión
```

## Qué reutilizar de Wearly

Prioridad alta:

1. `fitEngine.ts` — razonamiento determinista de ajuste.
2. `tryOnPrompt.ts` — traducción del Fit Report a instrucciones visuales.
3. modelo de perfil frontal/lateral/trasero.
4. cache key por perfil + producto + variante.
5. jobs concurrentes y restaurables.
6. prewarm/optimización de referencias.
7. progressive previews.
8. sanitización de producto y petición.
9. tests del motor.

Prioridad media:

- UX de catálogo y panel de try-on como referencia;
- almacenamiento local de prototipo;
- BYOK para demos internas.

No convertir en arquitectura definitiva:

- catálogo demo interno;
- size blocks genéricos como verdad de marca;
- heurísticas corporales como medidas “reales”;
- `localStorage` / IndexedDB como persistencia de plataforma;
- rate limit in-memory;
- BYOK para consumidor final.

## Datos que deben venir de Wardrobe / Fashion Schema

El objetivo es que Wearly deje de mantener una descripción paralela del producto.

Idealmente recibe un objeto de variante con:

```text
productId
garmentId
sku
category
assetUrl
color
colorHex
material
selectedSize
fit
sizeChart
patternMeasurements
stretch
length
sleeve
shoulder
waist
hip
rise
inseam
qaStatus
```

No todos los campos son obligatorios desde el primer MVP. Cuando falten datos reales, el Fit Engine puede utilizar fallback documentado.

## Perfil corporal: estrategia progresiva

### Nivel 1 — actual Wearly

- altura;
- peso;
- body type;
- talla habitual;
- frontal/lateral/trasera;
- estimación matemática.

### Nivel 2

- medidas introducidas por el usuario;
- pecho/cintura/cadera/hombro/inseam;
- prioridad sobre las estimaciones.

### Nivel 3

- estimación por computer vision / body scan validada;
- incertidumbre explícita;
- QA y consentimiento específicos.

Nunca presentar una medida estimada como si hubiera sido físicamente medida.

## Cómo avanza el roadmap

La creación de Wearly **sí supone un avance importante**, pero debe interpretarse correctamente.

### Virtual Try-On

Antes: capacidad prevista y distribuida, sin un motor de fit consolidado.

Ahora: existe un pipeline standalone funcional con generación real, perfil, jobs, cache y Fit Engine.

**Resultado:** gran reducción del riesgo técnico de esta fase, aunque la integración producto aún está pendiente.

### Fit / Sizing Intelligence

Antes: no existía como módulo formal del ecosistema.

Ahora: existe un motor determinista funcional que puede evolucionar a datos de talla reales.

**Resultado:** nueva capacidad de producto.

### Perfil del consumidor

Antes: MIRRORA tenía experiencia de consumidor, pero no un perfil corporal de tres vistas orientado específicamente al fit.

Ahora: Wearly aporta una base funcional.

**Resultado:** se adelanta una parte de personalización que puede reutilizar MIRRORA.

### Jobs / provider pipeline

Antes: era trabajo pendiente de la plataforma profesional.

Ahora: Wearly demuestra patrones funcionales de jobs, cache, cancelación, prewarm, progressive preview y API de generación.

**Resultado:** hay código probado del que aprender, pero todavía debe converger con los jobs/providers canónicos.

### Integración Wardrobe → MIRRORA

Antes: Wardrobe y MIRRORA ya estaban conectados por contratos/catalog export.

Ahora aparece una capa intermedia con una responsabilidad clara:

```text
Wardrobe → producto real → Fit → Try-On → MIRRORA
```

**Resultado:** la arquitectura end-to-end queda mucho más completa.

## Qué NO está terminado todavía

No marcar como cerrado hasta que exista evidencia de integración:

- Wearly consumiendo datos canónicos de Fashion Studio SOL;
- Wearly recibiendo un asset real aprobado por Wardrobe;
- MIRRORA lanzando un job Wearly real;
- MIRRORA mostrando Fit Report y resultado;
- perfil corporal compartido;
- jobs persistentes comunes;
- provider gateway común;
- tech packs/size charts reales;
- ecommerce handoff del resultado;
- analytics compartida;
- QA con prendas y tallas físicas reales.

## Próxima sesión: orden recomendado de revisión

Antes de implementar:

1. leer `docs/ADR/0003-wearly-fit-tryon-engine.md`;
2. revisar `Juanmaes83/wearly` actual;
3. revisar `packages/fashion-schema` y ontología de talla/variantes;
4. revisar exporter Wardrobe → MIRRORA actual;
5. identificar el contrato mínimo `GarmentVariantForTryOn`;
6. identificar el contrato mínimo `ConsumerBodyProfile`;
7. identificar el contrato `FitReport` que MIRRORA necesita mostrar;
8. decidir si la primera conexión es por API, package compartido o adapter;
9. implementar el slice mínimo reversible sin copiar repos completos.

## Regla de continuidad

A partir de esta fecha, cualquier trabajo sobre:

- virtual try-on;
- sizing;
- fit;
- medidas corporales;
- body profile;
- `How this fits you`;
- comparación entre tallas;
- generación personalizada de prendas;

debe tener en cuenta `Juanmaes83/wearly` antes de crear lógica nueva.

No duplicar un Fit Engine en Wardrobe, MIRRORA o Fashion Studio SOL sin demostrar primero que Wearly no puede cumplir ese contrato.
