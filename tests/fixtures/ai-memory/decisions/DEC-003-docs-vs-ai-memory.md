# DEC-003 — Separación entre docs/ y ai-memory/

- Estado: ACEPTADA
- Fecha: 2026-10-19
- Ámbito: Documentación

## Contexto

El repositorio ya contiene documentación de producto extensa: `README.md` (~71 KB), `CHANGELOG.md` (~79 KB), `docs/ONBOARDING.md` (~144 KB), `docs/BRIEFING.md`, `docs/DESARROLLADORES.md`, `docs/Modulos JS Referencia.md`, guías de usuario y `docs/PRIVACIDAD.md`. Duplicar ese contenido en ai-memory generaría dos fuentes de verdad que divergen (ver LES-003).

## Decisión

| Ubicación | Propósito | Audiencia |
|---|---|---|
| `README.md`, `CHANGELOG.md`, `docs/` | Documentación del **producto**: uso, arquitectura, APIs, historial de versiones | Usuarios y desarrolladores |
| `ai-memory/` | Memoria de la **Factory**: estado, backlog, roadmap, decisiones, lecciones, features | Agentes de la Factory y Pablo (vía dashboard) |

- ai-memory **enlaza** a `docs/` en lugar de copiar contenido.
- Cuando una FEAT modifique el producto, se actualizan ambos: la FEAT en ai-memory y `CHANGELOG.md`/`docs/` según corresponda.
- Las lecciones de `docs/BRIEFING.md` se importan a `lessons/` como entradas LES (fuente de verdad para la Factory); BRIEFING se conserva como documento de onboarding.
