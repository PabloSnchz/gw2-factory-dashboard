# Contrato de datos — ai-memory v2

Decisión oficial: DEC-009 en `gw2-factory-dev/ai-memory/decisions/`. Este documento es la especificación que implementa `js/parse.js`.

Todos los archivos: UTF-8 sin BOM, fin de línea LF. Fechas ISO (`YYYY-MM-DD` o `YYYY-MM-DDTHH:MMZ`).

## Archivos obligatorios

`status.md`, `backlog.md`, `memory-index.md`, `roadmap.md`, `risks.md`.

## status.md

```
# STATUS

Estado: EN_CURSO | ESPERANDO_VALIDACIÓN | BLOQUEADO | IDLE
Tarea actual: FEAT-001 — Título
Motivo: por qué se hace (con IDs)
Fase: F1 — Visibilidad
Etapa actual: PRODUCT | ARCHITECTURE | DEVELOPMENT | REVIEW | DOCUMENTATION [completada]
Inicio: 2026-10-20T00:10Z
Última actualización: 2026-10-20T00:18Z
Próxima acción: texto

## Esperando a Pablo
- [ID] qué decisión hace falta

## Bloqueos
- texto
```

| Clave | Uso en el panel |
|---|---|
| Estado | Color del estado (EN_CURSO verde, BLOQUEADO ámbar, ESPERA/IDLE azul) |
| Tarea actual / Motivo | "¿Qué está haciendo?" / "Por qué" |
| Etapa actual | Paso resaltado del workflow; "completada" marca el paso como hecho |
| Inicio | Tiempo en ejecución |
| Última actualización | Chequeos de frescura |
| Esperando a Pablo | Cola de decisión humana |

Compatibilidad: también se acepta la forma v1 (`Clave:` seguida de una línea `- valor`).

## backlog.md

```
## READY | ## IN_PROGRESS | ## BLOCKED | ## DONE
- [BL-XXX] [CRÍTICO|ALTO|MEDIO|BAJO] Título — contexto · referencias
```

- Un ítem BLOCKED que espera a Pablo contiene la palabra "Pablo".
- Un ítem DONE termina con `— YYYY-MM-DD` (fecha de cierre; alimenta "hoy / esta semana").
- Las líneas que no cumplen el formato se reportan en Salud.

## roadmap.md

Tabla `| Fase | Objetivo | Criterio de salida | Estado |`, con fase `F# — Nombre` y estado `EN CURSO | PENDIENTE | BLOQUEADA | HECHA`.

## risks.md

Tabla `| ID | Severidad | Estado | Riesgo | Mitigación | Responsable | Ref |`.
- ID `RSK-XXX`. Severidad `CRÍTICO|ALTO|MEDIO|BAJO`. Estado `ABIERTO|MITIGADO|CERRADO`.
- Las filas no se borran.

## memory-index.md

Secciones `## DECISIONS`, `## LESSONS`, `## FEATURES` con líneas `- [ID](ruta/relativa.md) — resumen`.

## Entradas (decisions/, lessons/, features/)

```
# DEC-XXX — Título

- Estado: PROPUESTA | ACEPTADA | REEMPLAZADA (por DEC-YYY) | DESCARTADA
- Fecha: YYYY-MM-DD

## Contexto
...
## Pendiente de Pablo      ← opcional, solo en PROPUESTA
- pregunta
```

- Nombre de archivo `<ID>-<slug>.md`; el ID del título debe coincidir.
- Lecciones pueden usar `Fecha de registro`.
- Los metadatos son las líneas `- Clave: valor` inmediatamente después del título.
- Cualquier ID citado (`DEC|LES|FEAT|BL|RSK-XXX`) debe existir; si no, se reporta.
