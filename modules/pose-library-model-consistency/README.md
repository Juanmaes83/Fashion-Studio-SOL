# Pose Library & Model Consistency Engine

> Canonical module specification for Fashion Studio SOL.

## Status

- **Module ID:** `pose-library-model-consistency`
- **Current version:** `v1`
- **Current library:** one female reference, ten e-commerce poses and ten editorial poses.
- **Source:** screenshots supplied by the project owner on 29 July 2026.
- **Transcription rule:** wording, capitalization, hyphenation and punctuation are preserved from the source. Only visual line wrapping and bold styling are normalized.
- **Commercial status:** architecture and prompt library are project assets; any external model, checkpoint or provider used to render images must pass a separate licence review.

## Purpose

This module turns a real or approved synthetic model into a reusable, versioned visual identity that can be rendered across consistent e-commerce and editorial poses without losing identity, garment truth, framing discipline or production traceability.

It is not merely a prompt collection. It is the control layer between the canonical model, garments or outfits, image-generation providers, quality assurance and publishing.

## Product flow

```text
Canonical model reference
        ↓
Identity profile and consent/provenance
        ↓
Pose selection from the versioned registry
        ↓
Garment or outfit selection
        ↓
Prompt compilation and provider adapter
        ↓
Generation job with seed/model/version metadata
        ↓
Automated consistency checks
        ↓
Human review and approval
        ↓
Catalogue, lookbook, campaign, MIRRORA or storefront
```

## Responsibilities

The module owns:

1. canonical model references and identity profiles;
2. versioned pose definitions;
3. prompt composition without altering the approved source prompts;
4. generation-job metadata and provenance;
5. identity, anatomy, pose, garment and framing quality checks;
6. human approval and rejection reasons;
7. approved asset variants for catalogue, editorial and campaign use;
8. hand-offs to Wardrobe, Outfit Engine, MIRRORA and the publishing layer.

The module does **not** own:

- garment extraction or cut-outs;
- outfit recommendation logic;
- storefront page construction;
- payments, billing or SaaS tenancy;
- legal claims about garment fit, sizing or physical accuracy;
- provider-specific checkpoints whose licences are incompatible with commercial use.

## Internal components

### 1. Model Identity Registry

Stores the canonical identity and the boundaries that must remain stable:

- face and facial proportions;
- skin tone and texture;
- hair colour, length, part and texture;
- approximate age presentation;
- body proportions and height class;
- approved makeup and grooming;
- reference images, consent and provenance;
- allowed and disallowed transformations.

### 2. Pose Registry

Stores each pose as a stable ID with:

- category: `ecommerce` or `editorial`;
- framing;
- camera angle;
- body orientation;
- limbs and hands;
- gaze and expression;
- background;
- lighting;
- props;
- exact approved prompt;
- version and deprecation status.

### 3. Prompt Compiler

Combines four independent truths:

```text
identity truth + garment/outfit truth + pose truth + production truth
```

The compiler must never silently rewrite an approved pose. Provider-specific additions must be stored as adapters or overlays, not as replacements for the canonical prompt.

### 4. Generation Adapter Layer

A provider-neutral interface receives the compiled job and returns:

- output images;
- provider and model ID;
- model/checkpoint version;
- seed when available;
- dimensions;
- latency;
- cost;
- safety or moderation metadata;
- retry history.

Local processing and external providers must use the same job contract.

### 5. Consistency and QA Engine

Every output is scored independently on:

- identity preservation;
- garment accuracy;
- pose compliance;
- anatomy and hands;
- framing and crop;
- background and lighting;
- realism;
- commercial usefulness.

A generation cannot become a canonical asset solely because it looks attractive. It must preserve the model and garment facts.

### 6. Human Review Console

Review states:

```text
generated → needs-review → approved | rejected | regenerate
```

Every rejection must record one or more reasons, for example:

- face drift;
- hair drift;
- garment shape changed;
- colour changed;
- missing detail;
- incorrect pose;
- anatomy defect;
- bad crop;
- background inconsistency;
- artificial skin;
- unsuitable for catalogue;
- unsuitable for editorial.

### 7. Asset and Provenance Registry

Approved assets retain their complete lineage:

```text
modelReferenceId
poseId
garmentIds/outfitId
promptVersion
provider
modelVersion
seed
generationJobId
reviewDecision
reviewer
createdAt
approvedAt
```

## Consistency contracts

### Identity contract

The same model must remain recognisable across all approved images. Face, age presentation, skin, hair and body proportions may not drift merely to improve the pose.

### Garment contract

Garments and outfits come from Wardrobe or Outfit Engine as product truth. The renderer may change presentation, but not invent or remove material, colour, pattern, length, neckline, closures, logos or construction details without an explicit creative mode.

### Pose contract

The requested pose, framing, gaze, camera and crop must be reproduced closely enough to satisfy its acceptance criteria. A visually good but different pose is a failed generation.

### Production contract

All outputs must be traceable, reproducible where the provider allows it, reviewable and separable from source product data.

### Legal and commercial contract

The system must not claim that an image proves physical fit, size, drape or real-world comfort. Commercial use is blocked when the selected provider, model, checkpoint, code or dataset has a non-commercial or incompatible licence.

## Integration with Fashion Studio SOL

### Wardrobe

Wardrobe supplies approved garment records, cut-outs, product images and garment metadata. This module returns model-on-garment assets with provenance; it does not overwrite the canonical garment record.

### Outfit Engine

Outfit Engine supplies one or more garment IDs plus the intended styling logic. The pose module renders an approved outfit in multiple controlled poses and crops.

### MIRRORA Style Studio

MIRRORA consumes approved assets for discovery, styling, saved looks, QR hand-off and commerce journeys. MIRRORA does not become the source of identity or garment truth.

### Fashion Website Builder and Storefront

The builder selects approved catalogue, editorial or campaign variants. It cannot publish `generated` or `needs-review` assets.

### Try-On Gateway

The gateway may provide identity-preserving garment transfer, but its outputs must pass this module's QA and licence gates before publication.

### Prompt QA

The benchmark and failure-repair knowledge extracted from `aiclothswap-showcase` can inform rejection categories and targeted retries without becoming a production dependency.

## Proposed repository location

```text
modules/
  pose-library-model-consistency/
    README.md
    data/
      female-pose-library.v1.json
    schema/
      pose-library.schema.json
    src/                 # future implementation
    tests/               # future contract and regression tests
    fixtures/            # future approved references and expected metadata
```

## Canonical prompt library

The exact source transcription is stored in [`PROMPTS.md`](./PROMPTS.md). The same data is available in machine-readable form at [`data/female-pose-library.v1.json`](./data/female-pose-library.v1.json) and is validated by [`schema/pose-library.schema.json`](./schema/pose-library.schema.json).

## Machine-readable source

The exact structured library is stored at:

```text
data/female-pose-library.v1.json
```

Its validation contract is stored at:

```text
schema/pose-library.schema.json
```

## Implementation phases

### Phase 0 — Canonical documentation

- register this module in the master README;
- preserve the exact source prompts;
- create machine-readable data and schema;
- record source and transcription policy.

**Exit:** another developer or AI can understand the module without the original conversation.

### Phase 1 — Registry and local interface

- pose browser;
- model reference creation;
- local JSON persistence;
- prompt preview;
- manual generation-result upload;
- approval and rejection workflow.

**Exit:** a complete pose library can be operated locally without SaaS infrastructure.

### Phase 2 — Provider-neutral generation jobs

- common generation contract;
- one local or external adapter;
- retries, status and errors;
- seed/model/version metadata;
- cost and latency capture.

**Exit:** the same pose can be generated through interchangeable providers.

### Phase 3 — Automated consistency QA

- identity similarity checks;
- pose compliance;
- garment and colour checks;
- anatomy and hand checks;
- framing/background checks;
- test fixtures and regression thresholds.

**Exit:** weak outputs are automatically held for review.

### Phase 4 — Wardrobe and Outfit Engine integration

- consume garment and outfit IDs;
- preserve source-product metadata;
- batch pose generation;
- variant sets for PDP, lookbook and campaign use.

**Exit:** approved garments and outfits can generate controlled asset packs.

### Phase 5 — MIRRORA and website publishing

- expose approved assets to MIRRORA;
- publish only approved variants;
- support catalogue/editorial/campaign slots;
- retain provenance after publishing.

**Exit:** the same approved asset system powers consumer experiences and storefronts.

### Phase 6 — Scale after validation

- shared storage;
- queue workers;
- authentication and projects;
- multi-user review;
- quotas, billing and SaaS tenancy.

**Exit:** product validation precedes infrastructure expansion.

## Acceptance criteria for the first functional release

- all 21 current prompts are loadable from the registry;
- no approved source prompt is silently modified;
- model identity, pose and garment facts are stored separately;
- a user can create a generation job and review its output;
- every output records provider, model/version and source IDs;
- rejected generations retain their reason;
- only approved assets can be published;
- tests validate schema, IDs, category counts and required fields;
- commercial licence status is visible before a provider is enabled;
- the UI displays the no-fit/no-size-guarantee limitation where relevant.

## Non-negotiable rules for future AI sessions

1. Do not paraphrase or “improve” canonical prompts without creating a new version.
2. Do not merge generated media into the garment source of truth.
3. Do not claim fit, sizing or physical accuracy from generated imagery.
4. Do not introduce non-commercial or incompatible dependencies into the production path.
5. Do not publish unreviewed outputs.
6. Do not make the module dependent on one provider.
7. Add new identities, genders, body types, poses and styles as versioned libraries rather than overwriting `female-ecom-editorial-v1`.
