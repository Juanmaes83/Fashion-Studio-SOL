# ADR 0003 — Wearly como Fit Intelligence + Fit-Aware Virtual Try-On Engine

**Estado:** aprobado para el ecosistema · 2026-08-08

## Contexto

Fashion Studio SOL es el repositorio canónico del producto integrado. La arquitectura ya separa responsabilidades entre:

- `Juanmaes83/wardrobe`: ingesta, detección, reconstrucción, revisión y gestión de prendas;
- `Juanmaes83/MIRRORA-Style-Studio`: experiencia de consumidor, catálogo, looks, wishlist, QR/handoff, carrito y consola white-label;
- `Juanmaes83/Fashion-Studio-SOL`: producto principal, contratos compartidos, jobs, providers, publicación, operaciones y evolución hacia plataforma.

El área de **virtual try-on comercial** estaba todavía poco madura dentro del producto integrado. En paralelo se desarrolló el repositorio propio:

- `Juanmaes83/wearly` — https://github.com/Juanmaes83/wearly

Wearly ya contiene un prototipo funcional de virtual try-on con un enfoque diferencial: antes de pedir a un modelo generativo que vista a una persona, calcula de forma determinista cómo debería comportarse una prenda concreta en una talla, corte y material concretos sobre un cuerpo determinado, y convierte ese análisis en restricciones visuales para la generación.

La propiedad y permisos del repositorio Wearly han sido confirmados por Juanma. No debe tratarse como third-party.

## Decisión

1. **Wearly entra formalmente en el ecosistema Fashion Studio SOL como repositorio propio especializado.**
2. Su responsabilidad principal será **Fit Intelligence + Fit-Aware Virtual Try-On**, no la ingesta de prendas, no el storefront completo y no la orquestación global.
3. **Fashion Studio SOL continúa siendo el producto canónico y coordinador.** Wearly no se convierte en un cuarto producto competidor.
4. **Wardrobe sigue siendo la fuente de activos de prenda.** Una prenda aprobada en Wardrobe debe poder alimentar el pipeline de fit/try-on mediante el contrato canónico de Fashion Studio SOL.
5. **MIRRORA sigue siendo la experiencia de consumidor.** El usuario entra al try-on desde MIRRORA, selecciona prenda/talla/color/corte, recibe el resultado y continúa hacia wishlist, look, carrito, QR o CTA.
6. **Wearly aporta al sistema:**
   - perfil corporal con referencias frontal/lateral/trasera;
   - cálculo determinista de fit;
   - severidad `too-small` / `correct` / `too-large`;
   - geometría y consecuencias de ajuste;
   - razonamiento sobre talla, corte, largo, hombro, manga, cintura, cadera y materiales;
   - construcción de prompts de try-on basados en el Fit Report;
   - pipeline real de generación de imagen;
   - jobs de generación y caché por variante;
   - prewarm/optimización de referencias;
   - validación y sanitización de inputs;
   - streaming/progressive preview cuando el proveedor lo permite.
7. **La lógica de Wearly no debe duplicar el catálogo canónico.** Producto, variante, talla, color, material y medidas deben evolucionar para venir de `fashion-schema` / catálogo compartido, no de un catálogo demo interno.
8. **El Fit Engine debe evolucionar de estimaciones genéricas hacia datos reales de marca cuando existan.** Las medidas de usuario y tech packs/size charts reales deben tener prioridad sobre heurísticas.
9. **La capa BYOK actual de Wearly es válida para desarrollo/demo, no para el producto final.** En producción, Fashion Studio SOL debe gobernar providers, credenciales, costes, rate limits y jobs.
10. **No se copia el repositorio completo dentro de Fashion Studio SOL.** Se integrará por contratos y módulos reutilizables, conservando Wearly como repositorio especializado hasta que exista una razón técnica aprobada para mover paquetes concretos.

## Flujo objetivo

```text
Wardrobe
  ↓
prenda aprobada + asset canónico
  ↓
Fashion Schema
  ↓
producto / variante / talla / color / material / medidas
  ↓
Wearly Fit Intelligence
  ↓
Fit Report
  ↓
Wearly Try-On Pipeline / Provider Gateway
  ↓
resultado visual + explicación de fit
  ↓
MIRRORA
  ↓
try-on del consumidor
  ↓
wishlist / look / QR / carrito / CTA / conversión
```

## Contrato conceptual entre módulos

### Wardrobe → Fashion Studio SOL / Wearly

Debe aportar, progresivamente:

- `garmentId` / `productId`;
- asset de prenda aprobado;
- categoría;
- material;
- color/variante;
- construcción y metadatos disponibles;
- relación con SKU/variante cuando exista;
- estado de QA del asset.

### Fashion Schema → Wearly

Debe convertirse en la fuente de verdad para:

- talla;
- fit/cut;
- medidas de prenda;
- size chart;
- stretch/comportamiento de tejido;
- largo;
- manga;
- hombro;
- cintura/cadera;
- rise/inseam cuando aplique;
- reglas y metadatos necesarios para el Fit Engine.

### Wearly → MIRRORA

Debe poder devolver:

- job id;
- estado;
- progreso;
- previews;
- resultado final;
- variante usada;
- talla/color/fit seleccionados;
- `FitReport` estructurado;
- severidad;
- explicación legible para el consumidor;
- errores recuperables;
- información suficiente para guardar/repetir el try-on sin regeneración innecesaria.

### Fashion Studio SOL

Debe gobernar a medio plazo:

- provider gateway;
- credenciales y costes;
- jobs persistentes;
- storage;
- observabilidad;
- configuración de marca;
- contratos de datos;
- permisos;
- publicación;
- analytics;
- integración ecommerce.

## Qué resuelve Wearly

Wearly resuelve una carencia importante del virtual try-on generativo: los modelos tienden a producir una imagen favorecedora aunque la talla seleccionada sea incorrecta. El motor introduce una etapa de razonamiento físico/geométrico previa y obliga al render a mostrar las consecuencias de esa selección.

El valor diferencial buscado no es solamente:

> “mírate con esta prenda”.

Es:

> “mira esta prenda concreta, en esta talla concreta, sobre tu cuerpo, y entiende si esa talla realmente te conviene”.

## Cuándo se usa

Wearly debe entrar cuando exista una pregunta de **fit, talla o try-on personalizado**.

Ejemplos:

- usuario cambia M → S y queremos que el resultado refleje realmente la diferencia;
- comparar Slim / Regular / Oversized;
- mostrar cómo cambia un largo o una manga;
- elegir entre dos tallas antes de añadir al carrito;
- explicar por qué una talla queda pequeña/grande;
- generar un try-on respetando identidad, prenda y variante;
- reutilizar un resultado ya generado para la misma combinación.

No debe utilizarse para:

- detectar prendas desde una foto de catálogo — responsabilidad de Wardrobe;
- construir outfits/editorial por sí solo — responsabilidad del Outfit Layer/Fashion Studio;
- gestionar storefront, wishlist o carrito — responsabilidad de MIRRORA;
- gobernar toda la plataforma — responsabilidad de Fashion Studio SOL.

## Qué hemos avanzado con este repositorio

Wearly reduce de forma importante el trabajo pendiente en varias capacidades que antes estaban incompletas:

1. **Virtual Try-On:** ya existe un pipeline funcional real, no solo una intención de roadmap.
2. **Fit Intelligence:** aparece una capa determinista nueva que antes no estaba consolidada en Fashion Studio SOL.
3. **Body Profile:** existe un flujo frontal/lateral/trasero y metadatos corporales utilizables por try-on.
4. **Garment fidelity:** el pipeline trata la imagen de prenda como referencia canónica de textura, construcción y detalles.
5. **Variant-aware generation:** talla, color y corte forman parte de la identidad del job y del resultado.
6. **Jobs y cache:** ya existe una base funcional para renders concurrentes, restauración y no regenerar innecesariamente.
7. **Provider integration:** existe una implementación real con streaming y manejo de errores que puede informar el provider gateway futuro.
8. **Seguridad de inputs:** existen validaciones, sanitización y catálogo de servidor que sirven como referencia para producción.

Esto **no significa que las fases del producto integrado estén cerradas**. El avance es funcional y arquitectónico, pero todavía falta conectar estas capacidades con los contratos, persistencia y UI canónicos.

## Trabajo pendiente antes de considerar la integración cerrada

- mapear Wearly al `fashion-schema` canónico;
- sustituir catálogo demo por datos de Wardrobe/Fashion Studio;
- definir size charts y tech packs reales de marcas;
- definir cómo se capturan o importan medidas corporales reales;
- decidir qué heurísticas de `fitEngine` siguen siendo fallback;
- mover BYOK a provider gateway gestionado para producción;
- persistir jobs/resultados fuera de memoria/IndexedDB cuando corresponda;
- compartir perfil del consumidor con MIRRORA;
- añadir consentimiento, retención y borrado dentro del flujo de producto;
- conectar resultado con wishlist/cart/CTA/analytics;
- QA con prendas, tallas y cuerpos reales;
- medir precisión del fit frente a una referencia física.

## Consecuencias

- Fashion Studio SOL gana una pieza especializada para cerrar el hueco entre **prenda digital** y **experiencia de compra personalizada**.
- Wardrobe y MIRRORA quedan mejor conectados conceptualmente: Wardrobe genera la verdad de la prenda; Wearly razona el ajuste; MIRRORA presenta y convierte.
- El roadmap de virtual try-on deja de partir desde cero.
- El proyecto evita duplicar pipelines y evita convertir Wearly en un storefront paralelo.
- Las próximas IAs o sesiones deben leer esta ADR antes de decidir arquitectura de try-on, fit, sizing o perfil corporal.
