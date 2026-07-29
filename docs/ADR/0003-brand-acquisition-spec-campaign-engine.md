# ADR 0003 — Separate Brand Acquisition & Spec Campaign Engine

- **Status:** Accepted for architecture and roadmap; runtime implementation deferred
- **Date:** 2026-07-29
- **Decision owners:** Fashion Studio SOL
- **Depends on:** Phase 2 persistence foundation, Campaign Builder
- **Reference:** `docs/BRAND_ACQUISITION_AND_SPEC_CAMPAIGN_ENGINE.md`

## Context

Fashion Studio SOL already covers ingestion, assets, garments, outfits, jobs, publication and consumer experiences. A public reference artifact proposes an automated “deliver first” funnel: discover boutiques, select a garment, generate an on-model reel, deliver it through a private link/QR/direct mail and follow engagement as a sales signal.

The commercial principle is valuable, but the source artifact also assumes that public images may be scraped and reused, treats provider-specific API examples as stable contracts and compresses rights, consent, privacy and anti-spam concerns into an autonomous loop.

We need the growth opportunity without making the core platform dependent on unsafe assumptions or creating a parallel source of truth.

## Decision

Create a separate **Growth Plane** inside the Fashion Studio SOL architecture:

```text
Growth Plane
→ BrandProspect
→ Rights & Consent Gate
→ SpecCampaign
→ Private Publication
→ Engagement Signals
→ CRM / Sales Handoff
→ Brand Onboarding

Production Plane
→ Workspace / Brand / Project
→ Garments / Assets / Outfits
→ Campaign Builder
→ Public Publication
```

The Growth Plane reuses the existing production services through contracts. It does not copy Wardrobe, MIRRORA, storage, jobs or publication logic.

The original HTML artifact is stored unchanged as a reference snapshot. It is explicitly non-canonical and does not authorise code reuse, provider integration, scraping or public deployment.

## Consequences

### Positive

- Fashion Studio SOL gains an acquisition and sales loop.
- “Deliver first” becomes a measurable product capability.
- Prospects can convert into canonical workspaces/projects without data duplication.
- Rights and consent become first-class domain state.
- Provider integrations remain replaceable.
- Commercial validation can happen with a controlled pilot before SaaS scale.

### Negative / cost

- Additional domain, UI and operational complexity.
- Consent evidence, retention and revocation require maintenance.
- Private campaign publication needs a separate security posture.
- Sales and engagement events must not contaminate product analytics.
- Human QA remains mandatory and limits early throughput.

## Rejected alternatives

### Put the funnel directly inside Wardrobe

Rejected. Wardrobe owns ingestion and garment QA, not prospecting or sales.

### Put the funnel directly inside MIRRORA

Rejected. MIRRORA is the consumer experience, not a CRM or internal growth console.

### Build a standalone “Hermes” application with its own database

Rejected. It would create duplicate assets, jobs, brands and publications.

### Copy the source artifact literally

Rejected. It contains unverified provider assumptions and insufficient rights/privacy gates.

### Automate scraping and outreach first

Rejected. Automation before proving quality, rights, cost and conversion would scale risk rather than value.

## Invariants

1. No generation without an authorised rights state.
2. No public campaign without merchant authorisation.
3. No implied endorsement.
4. Every demo is private, expiring and revocable.
5. Fashion Studio SOL remains the source of truth.
6. Every provider is behind an adapter.
7. Engagement is a signal, not proof of purchase intent.
8. `doNotContact` overrides every automation.
9. The pilot precedes autonomous operation.
10. Fase 2G remains the immediate technical priority.
