# DEC-007 — Adaptación de gw2-agents-dashboard para gw2-factory-dev

- Estado: REEMPLAZADA (por DEC-008, 2026-10-20)
- Fecha: 2026-10-19
- Ámbito: Dashboard

> Reemplazada: Pablo pidió un dashboard nuevo para la Factory en lugar de adaptar el histórico (misión FACTORY-001). El relevamiento de abajo se conserva como antecedente de DEC-008.

## Estado actual del dashboard (relevado 2026-10-19)

- `js/config.js` fija el repo de desarrollo en **dos** lugares: `repoName: 'gw2-wallet-agents'` (los `.md` del equipo) y `devRepoName: 'gw2-wallet-agents'` (`FEATURES.md`, `PROMOTIONS.md`). Además `getFeaturesUrl()` está definido dos veces.
- Espera archivos legacy en la raíz del repo (`TEAM_STATUS.md`, `ALERTS_LOG.md`, `BACKLOG.md`, `DECISIONS_LOG.md`, …), no `ai-memory/`.
- Muchos paneles leen `data/*.json` del propio dashboard, generados por scripts **locales** en la PC de Pablo (`_eco\health_check.py`, `git_export.py`, `gen_ramas.py`, …). Último `salud.json` y `git.json`: **2026-10-09 09:29 UTC** (10 días sin actualizar). Ese mismo `salud.json` marca los 6 archivos de estado como ROTO y 2 de 3 crons deshabilitados.
- **Ya existe una pestaña "Salud"** (`js/eco-health.js` + `data/salud.json`): frescura de archivos, ramas sin integrar, crons, tokens.
- `data/git.json` lista 3 repos (prod, `gw2-wallet-agents`, dashboard); `gw2-factory-dev` no figura. Reporta `protected: false` en `main` de producción.

## Propuesta (incremental, sin romper lo existente)

1. **Perfil de fuente configurable** en `config.js`:
   - `sources.legacy` = `gw2-wallet-agents` (comportamiento actual) y `sources.factory` = `{ owner: 'PabloSnchz', repo: 'gw2-factory-dev', branch: 'main', base: 'ai-memory/' }`.
   - Selección por `?src=factory` o clave `gn:dashboard:source`; **default `legacy`** hasta que Pablo resuelva BL-001.
   - Unificar `getFeaturesUrl()` duplicado.
2. **Lector de ai-memory**: `status.md`, `backlog.md`, `roadmap.md`, `memory-index.md` vía `raw.githubusercontent.com` (sin cuota de API, con el cache-bust existente). Parsers simples gracias al formato fijo de DEC-002 (`- [BL-XXX] [PRIORIDAD] …`, secciones `## READY/IN_PROGRESS/BLOCKED/DONE`). Tests en `tests/` como los existentes.
3. **FEAT-001 = extender la pestaña "Salud" existente** (no crear otra): agregar un bloque "Factory" con:
   - Estado general ← `status.md` (Estado, Fase, Etapa, Última actualización).
   - Problemas críticos ← ítems `CRÍTICO`/`ALTO` del backlog.
   - Riesgos ← sección `BLOCKED` + `MEDIO`.
   - Últimas decisiones ← sección `DECISIONS` de `memory-index.md` (últimas N).
   - Se mantiene la distinción del dashboard entre dato **medido** (`salud.json`) y **declarado** (ai-memory).
4. **Aviso de datos viejos**: mostrar la antigüedad de `salud.json`/`git.json` y marcarlos cuando superen un umbral (hoy el panel muestra datos de hace 10 días sin decirlo de forma prominente).
5. **Sin dependencia de la PC local** para la fuente factory: se lee directo del repo. A futuro, una GitHub Action en `gw2-factory-dev` podría generar un `factory.json` precalculado.

## Pendiente de Pablo

- BL-001: ¿`gw2-wallet-agents` pasa a histórico y el dashboard usa `factory` por defecto?
- ¿Los scripts locales `_eco\*.py` siguen vigentes? (no puedo verlos ni modificarlos desde la Factory).
