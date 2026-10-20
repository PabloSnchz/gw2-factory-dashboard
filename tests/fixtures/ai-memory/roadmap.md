# ROADMAP

Horizonte de evolución de la Factory sobre gw2-factory-dev (DEV).
La promoción a producción no forma parte de este roadmap: es decisión exclusiva de Pablo.

| Fase | Objetivo | Criterio de salida | Estado |
|---|---|---|---|
| F0 — Fundación | Memoria oficial operativa y entorno DEV definido | ai-memory inicializada; DEC-005 y DEC-006 decididas por Pablo; GA desacoplado (BL-002); DEV publicado con origen propio (BL-003) | BLOQUEADA |
| F1 — Visibilidad | Pablo entiende el estado de la Factory en menos de 60 segundos | gw2-factory-dashboard publicado y validado por Pablo (FEAT-001, BL-016) | EN CURSO |
| F2 — Calidad | Cada cambio se valida automáticamente | `node --check` + validación de ai-memory en CI (BL-006); CI del dashboard (BL-018); documentación de producto sincronizada (BL-004) | PENDIENTE |
| F3 — Evolución | Funcionalidades nuevas listas para evaluación humana en DEV | ≥1 FEAT nueva con ciclo Product→Architecture→Development→Review→Documentation completo | PENDIENTE |

## Dependencias

- F1 depende de BL-016 (Pages habilitado por Pablo).
- F3 depende de BL-003 (DEV evaluable) o de un mecanismo alternativo de evaluación acordado con Pablo.

## Historial

- 2026-10-19 — Roadmap inicial creado durante la inicialización de ai-memory.
- 2026-10-19 — F0 amplía su criterio de salida con el entorno DEV (DEC-005, DEC-006); F1 redefine FEAT-001 como extensión de la pestaña "Salud" existente (DEC-007, LES-009).
- 2026-10-20 — Misión FACTORY-001 (Dashboard First): F1 pasa a EN CURSO con un dashboard nuevo (DEC-008, reemplaza DEC-007); F0 queda BLOQUEADA esperando decisiones de Pablo.
