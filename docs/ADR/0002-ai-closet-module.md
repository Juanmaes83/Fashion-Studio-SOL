# ADR 0002 - Adaptacion de ai-closet como modulo, no como app embebida

## Estado

Propuesta implementada como primera capa portable.

## Contexto

`Juanmaes83/ai-closet` aporta funcionalidades relevantes para Fashion Studio SOL y
MIRRORA:

- armario digital,
- categorizacion visual de prendas,
- eliminacion de fondo,
- canvas de outfits,
- virtual try-on,
- historial y estado de procesamiento.

El repo original es una app Expo / React Native. Sus servicios llaman directamente a
OpenAI, Fal y Kling/Kwai usando variables `EXPO_PUBLIC_*`. Ese patron no puede
trasladarse a una experiencia web publica ni a una consola de marca.

## Decision

No se copia la app Expo completa dentro de SOL. Se crea `packages/ai-closet-engine`
como modulo portable con:

- contratos de datos,
- mapeo hacia `fashion-schema`,
- definicion de jobs,
- modelo editable de look y mapeo hacia `Outfit`,
- cliente de gateway backend,
- tests de seguridad basicos.

La UI se adaptara por superficies:

- SOL usa el modulo para ingesta, revision, catalogo y operaciones.
- MIRRORA usa el modulo para closet/canvas/try-on desde experiencia de consumidor.
- `mirrora-tryon-gateway` concentra secretos, proveedores, consentimiento, TTL y purge.

## Consecuencias

- Se preserva el valor funcional de ai-closet sin contaminar SOL con dependencias Expo.
- No se exponen claves de IA en frontend.
- La integracion puede avanzar por slices pequenos.
- La atribucion MIT del upstream debe mantenerse en `docs/THIRD_PARTY.md`.

## Siguientes pasos

1. Implementar endpoints reales del gateway contra `gateway-contract.v0.1.json`.
2. Portar el canvas de outfits a web con Pointer Events o libreria canvas aprobada.
3. Conectar export SOL -> MIRRORA con prendas y looks reales.
4. Anadir consentimiento, TTL, purge y auditoria antes de try-on publico.
