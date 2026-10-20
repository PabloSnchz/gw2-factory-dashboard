# DEC-001 — Rol de gw2-factory-dev

- Estado: ACEPTADA (con puntos abiertos, ver BL-001..003)
- Fecha: 2026-10-19
- Ámbito: Ecosistema de repositorios

## Contexto

El repositorio `PabloSnchz/gw2-factory-dev` fue creado el 2026-10-19. Su historial es el de producción (`gw2-wallet-ligero`): el último commit heredado es `c0471e0` (2026-10-03, promoción de la Armería Legendaria). Sobre esa base se agregó un único commit `c2f7248` ("chore(factory): initialize ai-memory structure").

Hasta ahora el trabajo de agentes ocurría en `gw2-wallet-agents`, que tiene historia propia (no compartida con producción) y contiene logs internos (`TEAM_STATUS.md`, `SESSION_LOG.md`, etc.) que el dashboard consume.

## Decisión

| Rol | Repositorio | Escritura de la Factory |
|---|---|---|
| DEV (Factory) | `gw2-factory-dev` | Permitida |
| DASHBOARD | `gw2-agents-dashboard` | Permitida |
| PRODUCCIÓN | `gw2-wallet-ligero` | Prohibida salvo instrucción explícita de Pablo |

- La línea base de DEV es el estado de producción al 2026-10-03 (`c0471e0`).
- La memoria oficial de la Factory vive en `ai-memory/` de este repositorio.

## Puntos abiertos (decisión de Pablo)

- BL-001: futuro de `gw2-wallet-agents` (archivo histórico vs. activo) y fuente de datos del dashboard.
- BL-002: comportamiento del workflow GA4 heredado en DEV.
- BL-003: publicación de DEV en GitHub Pages.

## Consecuencias

- Como DEV y PROD comparten historia, las diferencias entre ambos son trazables con `git diff`.
- Mientras BL-001 no se resuelva, el dashboard no refleja el trabajo de este repositorio.
