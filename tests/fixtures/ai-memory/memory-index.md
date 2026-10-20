# MEMORY INDEX

Índice de la memoria oficial de la Factory. Una línea por entrada. El detalle vive en cada archivo.
Convenciones: ver [DEC-002](decisions/DEC-002-convenciones-ai-memory.md) y contrato de datos [DEC-009](decisions/DEC-009-contrato-de-datos-ai-memory.md).

Lectura obligatoria antes de cualquier trabajo: `status.md` → `backlog.md` → `memory-index.md`.
Planificación: [roadmap.md](roadmap.md). Riesgos: [risks.md](risks.md).
Panel: https://pablosnchz.github.io/gw2-factory-dashboard/

## DECISIONS

- [DEC-001](decisions/DEC-001-rol-del-repositorio.md) — gw2-factory-dev es el entorno DEV de la Factory; base = copia de producción al 2026-10-03.
- [DEC-002](decisions/DEC-002-convenciones-ai-memory.md) — Estructura, IDs (DEC/LES/FEAT/BL), formato y codificación UTF-8 de ai-memory.
- [DEC-003](decisions/DEC-003-docs-vs-ai-memory.md) — `docs/` documenta el producto; `ai-memory/` es la memoria de la Factory. Se enlazan, no se duplican.
- [DEC-004](decisions/DEC-004-invariantes-de-arquitectura.md) — Invariantes técnicas: CSS 3 capas, router-first, `gn:tokenchange`, Storage API, IIFE + `window.*`.
- [DEC-005](decisions/DEC-005-entorno-dev-publicado.md) — PROPUESTA: publicar DEV con origen propio (Vercel) para no compartir `localStorage` con PROD.
- [DEC-006](decisions/DEC-006-desacople-google-analytics.md) — PROPUESTA: GA solo en el host de producción (allowlist en runtime) + guard de repo en el workflow GA4.
- [DEC-007](decisions/DEC-007-dashboard-fuente-factory.md) — REEMPLAZADA por DEC-008: adaptar el dashboard histórico.
- [DEC-008](decisions/DEC-008-dashboard-factory.md) — Dashboard nuevo (gw2-factory-dashboard): observa el trabajo, no a los trabajadores; sin scripts locales.
- [DEC-009](decisions/DEC-009-contrato-de-datos-ai-memory.md) — Contrato de datos v2 de ai-memory: status.md por claves, risks.md, formatos de backlog y entradas.

## LESSONS

- [LES-001](lessons/LES-001-verificar-codigo-real.md) — Verificar contra el código real antes de proponer cambios.
- [LES-002](lessons/LES-002-diagnosticar-antes-de-iterar.md) — Diagnosticar la causa raíz; no entrar en bucles de prueba y error.
- [LES-003](lessons/LES-003-documentacion-puede-estar-desactualizada.md) — La documentación (ONBOARDING/BRIEFING) puede no reflejar el código.
- [LES-004](lessons/LES-004-revisar-clases-del-sistema-de-diseno.md) — Revisar qué estilos trae una clase antes de reutilizarla.
- [LES-005](lessons/LES-005-diagnostico-css-panel-styles.md) — Diagnosticar CSS con el panel Styles, no con mediciones.
- [LES-006](lessons/LES-006-no-forzar-features-sin-datos.md) — Si la API no provee los datos, no insistir: descartar o buscar alternativa.
- [LES-007](lessons/LES-007-cambios-quirurgicos.md) — Cambios quirúrgicos; no reescribir archivos completos.
- [LES-008](lessons/LES-008-ai-memory-en-utf8.md) — ai-memory debe guardarse en UTF-8 (status.md original era ilegible).
- [LES-009](lessons/LES-009-relevar-antes-de-proponer.md) — Relevar el código real del destino antes de proponer una funcionalidad.
- [LES-010](lessons/LES-010-observar-el-trabajo-no-a-los-trabajadores.md) — Un panel debe observar el trabajo y sus decisiones, no la coordinación entre trabajadores.
- [LES-011](lessons/LES-011-dato-medido-sin-infraestructura-local.md) — El dato medido no puede depender de una máquina local; leer por SHA da snapshots consistentes.

## FEATURES

- [FEAT-000](features/FEAT-000-inventario-inicial.md) — Inventario inicial del producto (línea base de DEV).
- [FEAT-001](features/FEAT-001-dashboard-factory.md) — Dashboard Factory: centro de observación de la Factory (gw2-factory-dashboard).
