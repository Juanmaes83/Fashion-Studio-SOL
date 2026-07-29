# Brand Acquisition & Spec Campaign Engine

**Estado:** arquitectura y proceso comercial aprobados; implementación de runtime no iniciada  
**Rama de diseño:** `feature/brand-acquisition-spec-campaign-engine`  
**Base:** `phase-2/persistence-foundation`  
**Producto canónico:** Fashion Studio SOL  
**Referencia original preservada:** `docs/reference-artifacts/hermes-on-model-reel-field-notes-20.html`

## 1. Decisión

Fashion Studio SOL incorpora una nueva capa de crecimiento B2B que transforma la capacidad creativa de la plataforma en un proceso medible de captación, demostración, venta y onboarding de boutiques y marcas de moda.

La idea central es **deliver first**: no vender una promesa abstracta, sino presentar una demostración privada y personalizada, construida con una prenda real de la tienda y con trazabilidad de origen, derechos y consentimiento.

Esta capa no sustituye Wardrobe, MIRRORA ni el futuro Campaign Builder. Los conecta en un funnel comercial:

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
→ Fashion Studio SOL production workflow
```

## 2. Qué eleva en la plataforma

Antes de esta decisión, Fashion Studio SOL comenzaba cuando una marca ya estaba dentro del sistema. Este motor añade el tramo anterior:

```text
descubrir una boutique adecuada
→ demostrar valor con una campaña de muestra
→ convertir interés en conversación comercial
→ incorporar la marca y su catálogo
```

El producto completo pasa a cubrir:

```text
captación
→ onboarding
→ ingesta
→ catálogo
→ prendas
→ outfits
→ contenido editorial
→ campañas
→ publicación
→ experiencia de consumidor
→ analítica y conversión
```

## 3. Límites obligatorios

La referencia original se conserva como fuente de inspiración, no como especificación ejecutable. Sus afirmaciones sobre scraping, reutilización de imágenes públicas, Shopify, Google Places, QR o Scribeless no quedan aprobadas automáticamente.

### 3.1 Derechos y consentimiento

Ninguna prenda o fotografía entra en un job generativo sin un estado de derechos explícito:

- `unknown`: origen conocido, permiso no evaluado.
- `discovery-only`: puede usarse únicamente para identificar una oportunidad; no para generar ni publicar.
- `private-concept-authorised`: existe permiso para una demostración privada y limitada.
- `merchant-authorised`: la marca autoriza el uso para campaña y comunicación comercial acordada.
- `licensed`: existe licencia documentada con alcance suficiente.
- `blocked`: no puede usarse.

Reglas:

1. Que una imagen sea pública no equivale a permiso de reutilización comercial.
2. No se publicará una campaña de muestra como si fuera oficial.
3. No se insinuará colaboración, aprobación o representación de una marca sin consentimiento.
4. Toda demo no aceptada tendrá expiración y borrado.
5. La fuente, titular conocido, permiso y alcance deben quedar asociados al asset.
6. La marca puede solicitar retirada inmediata.

### 3.2 Prospección y contacto

- Mantener lista de exclusión y `doNotContact`.
- Limitar frecuencia y número de contactos.
- No comprar ni enriquecer datos personales opacos.
- Separar datos públicos de empresa de datos personales del propietario.
- Registrar base, propósito, fecha y canal del contacto.
- No automatizar seguimientos agresivos por una simple visualización o escaneo.

### 3.3 Publicación y privacidad

- Las campañas de muestra son privadas, no indexadas y con token no predecible.
- Los assets de prospección no entran en el catálogo público normal.
- El QR no debe incluir datos personales ni secretos.
- Las URLs pueden expirar y ser revocadas.
- Los eventos de engagement se reducen a lo necesario para el funnel.

## 4. Superficie de producto

### 4.1 Growth Console

Nueva superficie interna para equipo comercial/marketing:

- descubrir e importar prospects;
- deduplicar por proveedor e identificador estable;
- calificar oportunidad;
- registrar consentimiento y derechos;
- elegir una prenda autorizada;
- lanzar una campaña de muestra;
- revisar calidad;
- generar landing privada y QR;
- preparar outreach;
- ver señales de interacción;
- convertir el prospect en workspace/brand/project real.

### 4.2 Relación con superficies existentes

```text
Growth Console
  → Fashion Studio API
  → Wardrobe / ingestion pipeline
  → jobs / workers / providers
  → Campaign Builder
  → private preview publication
  → analytics events
  → CRM adapter
```

- **Wardrobe:** ingestión, limpieza, categorización, fidelidad de producto y QA.
- **Fashion Studio SOL:** fuente de verdad, jobs, storage, proyectos, assets y estados.
- **Campaign Builder:** composición del reel, story, poster, postcard, microsite y variantes.
- **MIRRORA:** no es la consola de ventas; puede reutilizar componentes de look, QR y landing cuando proceda.
- **Operations Console:** costes, errores, reintentos y trazabilidad.

## 5. Modelo de dominio mínimo

### 5.1 `BrandProspect`

```ts
type BrandProspectStatus =
  | "discovered"
  | "qualified"
  | "permission-required"
  | "permission-granted"
  | "spec-campaign-queued"
  | "spec-campaign-review"
  | "spec-campaign-approved"
  | "outreach-ready"
  | "contacted"
  | "engaged"
  | "meeting-requested"
  | "won"
  | "lost"
  | "do-not-contact"
  | "archived";

type BrandProspect = {
  id: string;
  provider: "manual" | "google-places" | "shopify" | "website" | "other";
  providerExternalId?: string;
  brandName: string;
  websiteUrl?: string;
  publicBusinessAddress?: string;
  region?: string;
  status: BrandProspectStatus;
  qualificationScore?: number;
  qualificationReasons: string[];
  rightsStatus: RightsStatus;
  consentEvidenceId?: string;
  doNotContact: boolean;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};
```

### 5.2 `ProspectAsset`

Campos obligatorios:

- `prospectId`
- `sourceUrl`
- `sourceProvider`
- `sourceCapturedAt`
- `usageRightsStatus`
- `usageRightsBasis`
- `usageRightsScope`
- `merchantConsent`
- `merchantConsentEvidenceId`
- `privateOnly`
- `expiresAt`
- `checksum`
- `generatedByJobId`
- `derivedFromAssetIds`

### 5.3 `SpecCampaign`

```ts
type SpecCampaignStatus =
  | "draft"
  | "blocked-rights"
  | "generating"
  | "qa-required"
  | "approved-private"
  | "outreach-ready"
  | "sent"
  | "engaged"
  | "converted"
  | "expired"
  | "revoked";
```

Una `SpecCampaign` debe guardar:

- prospect y prenda objetivo;
- briefing y propuesta de valor;
- assets de entrada y salida;
- modelo/proveedor/versiones;
- coste y duración;
- QA de fidelidad de prenda;
- aprobación humana;
- landing privada;
- QR o canal de entrega;
- expiración;
- eventos permitidos;
- resultado comercial.

## 6. Proceso operativo

### Etapa 0 — Discovery

Fuentes mediante adaptadores, nunca como lógica mezclada:

- `ManualProspectAdapter`
- `GooglePlacesProspectAdapter`
- `MerchantReferralAdapter`
- `WebsiteMetadataAdapter`
- futuro `ShopifyMerchantAdapter` autorizado

Salida: registro de empresa deduplicado, sin copiar indiscriminadamente catálogos o fotografías.

### Etapa 1 — Qualification

Evaluación humana asistida por reglas:

- negocio real y activo;
- catálogo visual adecuado;
- necesidad evidente de contenido;
- encaje geográfico/comercial;
- capacidad de contacto legítimo;
- ticket y potencial de continuidad;
- ausencia de señales de exclusión.

La puntuación nunca sustituye una decisión humana ni justifica por sí sola usar assets.

### Etapa 2 — Rights & Consent Gate

Antes de generar:

```text
rightsStatus in {private-concept-authorised, merchant-authorised, licensed}
AND doNotContact = false
AND source traceable
AND expiry defined
```

Si no se cumple, la campaña queda `blocked-rights`.

### Etapa 3 — Product Ingestion

Preferencia de fuentes:

1. upload directo de la boutique;
2. conexión autorizada de catálogo;
3. asset entregado por la marca;
4. uso privado expresamente autorizado;
5. nunca scraping indiscriminado como fuente de producción.

El asset pasa por el pipeline existente:

```text
upload
→ validate
→ background cleanup
→ categorise
→ garment QA
→ approve
```

### Etapa 4 — Spec Campaign Generation

El Campaign Builder producirá un paquete configurable, no solo un vídeo:

- reel vertical;
- hero still;
- story/post;
- before/after opcional;
- microsite privada;
- CTA de reunión o solicitud de más campañas;
- postcard/QR opcional.

Cada generación es un job persistente con proveedor, modelo, coste, intentos, errores y outputs.

### Etapa 5 — Human QA

Gates obligatorios:

- fidelidad de prenda;
- color, patrón, logos y texto;
- silueta y longitud;
- anatomía y manos;
- calidad del movimiento;
- ausencia de claims falsos;
- ausencia de apariencia de colaboración oficial;
- derechos y expiración válidos;
- landing y QR correctos.

Sin aprobación humana no puede pasar a `outreach-ready`.

### Etapa 6 — Private Campaign Landing

Requisitos:

- URL no indexable;
- token aleatorio;
- marca claramente identificada como demostración conceptual;
- assets servidos desde storage autorizado;
- expiración y revocación;
- CTA único y medible;
- privacidad visible;
- sin carrito ni publicación comercial no autorizada.

### Etapa 7 — Outreach

Adaptadores intercambiables:

- `EmailOutreachAdapter`
- `ManualOutreachAdapter`
- `DirectMailAdapter`
- futuro `CRMOutreachAdapter`

El correo o postal debe explicar que se trata de una demostración privada, no una campaña oficial. Scribeless puede evaluarse como proveedor, pero su contrato debe implementarse desde documentación actual y pruebas propias; el payload del artefacto no es fuente de verdad.

### Etapa 8 — Engagement Signals

Eventos mínimos:

- `spec_campaign_published_private`
- `spec_campaign_link_opened`
- `spec_campaign_qr_scanned`
- `spec_campaign_video_started`
- `spec_campaign_video_completed`
- `spec_campaign_cta_selected`
- `spec_campaign_reply_received`
- `spec_campaign_meeting_requested`
- `spec_campaign_converted`
- `spec_campaign_expired`
- `spec_campaign_revoked`

No registrar contenido sensible, imágenes, mensajes completos ni datos innecesarios en analytics.

### Etapa 9 — Sales Handoff

Una señal no equivale automáticamente a intención de compra. El handoff comercial debe mostrar:

- prospect;
- campaña enviada;
- canal y fecha;
- eventos observados;
- consentimiento y límites;
- recomendación de siguiente acción;
- historial de contactos;
- bloqueo `doNotContact`.

### Etapa 10 — Onboarding

Cuando el prospect se convierte:

```text
BrandProspect(won)
→ create workspace
→ create brand
→ create project
→ attach consent/licence evidence
→ ingest authorised catalogue
→ start normal Fashion Studio SOL workflow
```

No se duplican assets ni se crea una segunda fuente de verdad.

## 7. Arquitectura de servicios

```text
apps/growth-console
  ├── discovery
  ├── qualification
  ├── rights-and-consent
  ├── spec-campaigns
  └── sales-handoff

services/platform-api
  ├── prospects
  ├── consent-evidence
  ├── private-publications
  └── engagement-events

services/worker
  ├── garment-prep
  ├── image-generation
  ├── video-generation
  ├── campaign-render
  └── qr/postcard-render

packages/fashion-schema
  ├── prospect
  ├── rights
  ├── campaign
  └── engagement

adapters
  ├── discovery
  ├── catalog
  ├── image/video providers
  ├── email/direct mail
  └── CRM
```

Los nombres son objetivos arquitectónicos; no afirman que estas carpetas ya existan.

## 8. Relación con el roadmap

La Fase 6 existente, **Publicación y validación comercial**, se divide conceptualmente:

### Fase 6A — Brand Acquisition Foundation

- dominio `BrandProspect`;
- deduplicación;
- calificación;
- rights/consent gate;
- estados y auditoría;
- Growth Console mínima.

### Fase 6B — Spec Campaign Builder

- elegir prenda autorizada;
- generar paquete visual;
- QA de fidelidad;
- landing privada;
- expiración/revocación.

### Fase 6C — Outreach & Engagement

- email/manual/direct mail adapters;
- QR;
- eventos;
- CRM handoff;
- do-not-contact.

### Fase 6D — Pilot comercial

- 10 boutiques de Alicante/Costa Blanca;
- selección humana;
- autorización o asset entregado;
- una campaña por boutique;
- revisión humana de cada output;
- medición completa;
- sin autonomía masiva.

### Fase 6E — Automatización progresiva

Solo tras probar calidad, derechos, conversión y coste:

- discovery programado;
- qualification asistida;
- colas de producción;
- generación por lotes con límites;
- seguimiento condicionado;
- métricas y alertas.

## 9. Pilot de validación

### Cohorte

10 boutiques independientes de Alicante/Costa Blanca con producto visual y capacidad real de contratación.

### Oferta de prueba

Una campaña privada de muestra que incluya:

- una prenda autorizada;
- un reel corto;
- un hero still;
- una landing privada;
- una propuesta de continuidad clara.

### KPIs

- prospects descubiertos;
- cualificados;
- permisos obtenidos;
- campañas generadas;
- campañas aprobadas al primer intento;
- coste medio por campaña;
- tiempo total;
- entregas;
- aperturas/escaneos;
- visualizaciones;
- CTA;
- respuestas;
- reuniones;
- propuestas;
- clientes;
- ingreso y margen;
- solicitudes de retirada;
- quejas o bloqueos.

### Umbrales antes de automatizar

No se fija ahora un número inventado. La cohorte debe permitir decidir humanamente si:

- la calidad es suficientemente consistente;
- la fidelidad de prenda es comercial;
- el proceso de permisos es viable;
- el coste puede sostenerse;
- las boutiques responden positivamente;
- el funnel merece una segunda cohorte.

## 10. Riesgos principales

1. **Copyright y marca:** uso de imágenes o signos sin alcance suficiente.
2. **Falsa afiliación:** que la demo parezca una campaña oficial.
3. **Fidelidad:** prenda visualmente atractiva pero incorrecta.
4. **Spam:** sobreautomatización de contacto y seguimiento.
5. **Datos de proveedores:** almacenamiento o reutilización más allá de sus términos.
6. **Coste:** vídeo generado antes de cualificar o autorizar.
7. **Dependencia:** acoplar el funnel a un proveedor de Places, vídeo, correo o direct mail.
8. **Dos fuentes de verdad:** CRM separado de projects/assets sin IDs canónicos.
9. **Métricas engañosas:** interpretar un escaneo como compra.
10. **Escala prematura:** automatizar antes de validar diez casos manuales.

## 11. Criterios de aceptación de la arquitectura

- El artefacto original está preservado íntegro y separado de la especificación canónica.
- Existe un proceso completo de discovery a onboarding.
- Ningún asset puede generarse sin rights/consent gate.
- Las demos son privadas, revocables y con expiración.
- Fashion Studio SOL sigue siendo la fuente de verdad.
- Wardrobe y Campaign Builder se reutilizan; no se duplican.
- Los proveedores se conectan mediante adaptadores.
- Cada job registra coste, modelo, intentos y QA.
- El funnel incluye do-not-contact y retirada.
- El primer piloto es humano y limitado a 10 boutiques.

## 12. Fuera de alcance de esta decisión documental

- No se implementa scraping.
- No se conecta Google Places, Shopify, Scribeless ni un CRM.
- No se genera ni envía ninguna campaña real.
- No se publica una landing real.
- No se autoriza reutilización de fotografías de terceros.
- No se modifica el contrato `fashion-schema` todavía.
- No se cambia la prioridad inmediata de Fase 2G ni el orden de merge de las PR actuales.
- No se declara el sistema autónomo ni terminado.

## 13. Próxima autorización necesaria

Cuando Fase 2G y el Campaign Builder estén listos, abrir una microfase separada para **6A — Brand Acquisition Foundation**. Esa microfase deberá empezar por dominio, persistencia, derechos/consentimiento y tests; no por scraping ni por generación masiva.
