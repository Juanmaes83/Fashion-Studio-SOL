# AI Closet Engine

Modulo portable inspirado en `Juanmaes83/ai-closet` para sumar inteligencia de armario,
canvas de looks y virtual try-on al ecosistema Fashion Studio SOL / MIRRORA sin mezclar
la app Expo original ni exponer secretos en cliente.

## Origen

- Repo integrado como referencia: `Juanmaes83/ai-closet`
- Upstream: `zebangeth/ai-closet`
- Licencia declarada: MIT
- Decision: adaptar contratos, flujos y patrones de UX. No importar la app React Native
  completa dentro de SOL.

## Responsabilidad

Este paquete define la capa comun:

- Modelo `ClosetItem` compatible con el concepto de prenda de ai-closet.
- Mapeo hacia `fashion-schema/Garment`.
- Contrato de jobs para categorizacion, limpieza de fondo y try-on.
- Cliente de gateway que apunta a backend propio, nunca a proveedores IA desde navegador.

La UI concreta vive fuera:

- `Fashion-Studio-SOL`: ingestion, revision, catalogo y jobs.
- `MIRRORA-Style-Studio`: experiencia publica, avatar, wishlist, canvas y handoff.
- `mirrora-tryon-gateway`: proxy/backend con secretos, consentimiento, TTL y purge.

## Regla de seguridad

Los servicios heredados de ai-closet usan claves cliente:

- `EXPO_PUBLIC_OPENAI_KEY`
- `EXPO_PUBLIC_FAL_KEY`
- `EXPO_PUBLIC_KWAI_ACCESS_KEY`
- `EXPO_PUBLIC_KWAI_SECRET_KEY`

En esta adaptacion esas claves quedan prohibidas en frontend. El modulo solo acepta un
`baseUrl` del gateway propio, por ejemplo `/api/ai-closet`.

## Primer vertical slice

1. Crear prenda desde upload local.
2. Solicitar categorizacion via gateway.
3. Solicitar fondo transparente via gateway.
4. Mapear a `fashion-schema/Garment`.
5. Exportar a MIRRORA como catalogo/closet consumible.
6. En fase posterior, enviar try-on con consentimiento explicito.

