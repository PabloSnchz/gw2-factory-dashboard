# REQ-001 — Proteger la rama principal de producción

- Estado: ABIERTA
- Tipo: acción
- Fecha: 2026-10-20
- Prioridad: ALTO
- Relacionado: RSK-001, BL-010
- Verificación: prod_protegida

## Qué pasó

La rama `main` de gw2-wallet-ligero (la app que usan los jugadores) no tiene protección. El panel lo comprueba cada vez que lo abrís.

## Por qué importa

Cualquier push con permisos de escritura, incluida una herramienta automática, llega directo a producción sin revisión. Es la única barrera técnica que respalda la regla "producción es de Pablo".

## Cómo hacerlo

1. Abrí gw2-wallet-ligero → Settings → Branches (o Rules → Rulesets).
2. Agregá una regla para `main`.
3. Marcá "Require a pull request before merging" y guardá.

Cuando la protección esté activa, el panel lo detecta solo: no hace falta que respondas.

## Recomendación

Hacelo cuando puedas: son dos minutos y no cambia nada de la app.
