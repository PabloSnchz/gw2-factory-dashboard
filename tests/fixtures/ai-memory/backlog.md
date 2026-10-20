# BACKLOG

Formato: `- [ID] [PRIORIDAD] Título — contexto · referencia` (ver DEC-009)
Prioridades: CRÍTICO · ALTO · MEDIO · BAJO

## READY

- [BL-004] [MEDIO] Sincronizar documentación de producto con el código real — `docs/BRIEFING.md` y `docs/DESARROLLADORES.md` describen v6.6.2 (ej. `api-gw2.js` v2.15.0) pero `index.html` carga `api-gw2.js?v=2.33.0`; la Armería Legendaria no figura en `CHANGELOG.md`. · LES-003, DEC-003
- [BL-005] [BAJO] `js/characters-theme.js?v=1.0.1` se incluye dos veces en `index.html` (una con `defer`, otra sin). · FEAT-000
- [BL-006] [MEDIO] Validación automática mínima en PRs de gw2-factory-dev — `node --check` sobre `js/*.js` y chequeo de UTF-8 + archivos obligatorios en `ai-memory/`. · LES-008
- [BL-007] [BAJO] Dependencias CDN sin Subresource Integrity — `crypto-js@4.2.0` (jsdelivr) y `xlsx-0.20.2` (sheetjs). · FEAT-000
- [BL-008] [BAJO] Email placeholder en commits heredados — varios usan "TU EMAIL DE LA CUENTA PRINCIPAL"; configurar `git user.email` en los entornos de agentes.
- [BL-013] [BAJO] Detalles heredados en la app — `js/analytics.js` empieza con BOM (U+FEFF); `js/activities.js` usa como fallback de PSNA una URL raw de `gw2-wallet-ligero/main`. · DEC-005
- [BL-017] [BAJO] Rama duplicada `chore/init-ai-memory` en gw2-factory-dev — mismo contenido que `main` @ b9599d2; la Factory no tiene herramienta para borrar ramas.
- [BL-018] [MEDIO] CI del dashboard — correr `node --test` en cada push de gw2-factory-dashboard. · FEAT-001

## IN_PROGRESS

## BLOCKED

- [BL-016] [ALTO] FEAT-001 Dashboard Factory: publicación y validación — código en gw2-factory-dashboard; falta que Pablo habilite GitHub Pages (Settings → Pages → main / root) y valide el criterio de 60 segundos. · FEAT-001, DEC-008 — Bloqueado: decisión de Pablo.
- [BL-001] [ALTO] Futuro de `gw2-wallet-agents` y `gw2-agents-dashboard` — la fuente del panel ya está resuelta (DEC-008); queda decidir si ambos pasan a archivo histórico. · DEC-001, DEC-008 — Bloqueado: decisión de Pablo.
- [BL-010] [ALTO] Proteger `main` de producción — `gw2-wallet-ligero` sin branch protection (medido en vivo por el dashboard). · RSK-001 — Acción exclusiva de Pablo.
- [BL-002] [MEDIO] Desacoplar GA4 por entorno — frontend con allowlist de host + guard de repo en `github-metrics-to-ga4.yml`. · DEC-006, RSK-003 — Bloqueado: decisión de Pablo.
- [BL-003] [MEDIO] Publicar DEV con origen propio — propuesta: Vercel. · DEC-005 — Bloqueado: decisión de Pablo; depende de BL-002.
- [BL-011] [ALTO] Origen compartido DEV/PROD — DEV en GitHub Pages compartiría `localStorage` con PROD. · RSK-002, DEC-005 — Se resuelve con la opción de hosting que elija Pablo.

## DONE

- [BL-000] [ALTO] Inicializar la memoria fundacional de la Factory — estructura, roadmap, DEC-001..004, LES-001..008, FEAT-000, corrección de codificación. — 2026-10-19
- [BL-015] [MEDIO] Proponer estrategias de entorno DEV — publicación (DEC-005), GA (DEC-006), dashboard (DEC-007). — 2026-10-19
- [BL-009] [MEDIO] Reemplazado: extender la pestaña "Salud" del dashboard histórico — sustituido por un dashboard nuevo (FEAT-001, DEC-008). — 2026-10-20
- [BL-012] [MEDIO] Obsoleto: datos del dashboard histórico sin actualizar — el histórico queda como referencia; el nuevo panel no depende de scripts locales (RSK-004). — 2026-10-20
- [BL-014] [BAJO] Obsoleto: detalles de `js/config.js` del dashboard histórico — fuera de alcance, el histórico no se modifica (DEC-008). — 2026-10-20
- [BL-019] [ALTO] FEAT-001 Dashboard Factory: investigación, diseño, implementación, tests y documentación — gw2-factory-dashboard. · DEC-008, DEC-009 — 2026-10-20
