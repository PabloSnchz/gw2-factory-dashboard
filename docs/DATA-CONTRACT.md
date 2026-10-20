# Contrato de datos — ai-memory v4

Decisiones oficiales (en `gw2-factory-dev/ai-memory/decisions/`): DEC-009 (v2), DEC-011 (v3: pedidos y respuestas) y DEC-018 (v4: soberanía de decisiones). Este documento es la especificación que implementan `js/parse.js`, `js/decisions.js` y `js/model.js`.

Todos los archivos: UTF-8 sin BOM, fin de línea LF. Fechas ISO (`YYYY-MM-DD` o `YYYY-MM-DDTHH:MMZ`).

## Archivos obligatorios

`status.md`, `backlog.md`, `memory-index.md`, `roadmap.md`, `risks.md`.

## status.md

```
# STATUS

Estado: EN_CURSO | ESPERANDO_VALIDACIÓN | BLOQUEADO | IDLE
Tarea actual: BL-XXX — Título
Motivo: por qué se hace (con IDs)
Fase: F1 — Visibilidad
Etapa actual: PRODUCT | ARCHITECTURE | DEVELOPMENT | REVIEW | DOCUMENTATION [completada]
Inicio: 2026-10-20T00:10Z
Última actualización: 2026-10-20T00:18Z
Próxima acción: texto

## Esperando a Pablo
- [ID] Decisión: qué hay que decidir (solo con un pedido REQ abierto)
- [ID] Acción: algo que solo Pablo puede hacer
- [ID] Validación: algo que Pablo tiene que mirar o probar
- [ID] Info: algo que conviene saber (no es un pendiente)

## Para tu información
- [ID] texto que no pide nada

## Bloqueos
- texto
```

| Clave | Uso en el panel |
|---|---|
| Estado | Estado en palabras: EN_CURSO "Trabajando", ESPERANDO_VALIDACIÓN "Esperando tu validación", BLOQUEADO "Bloqueada", IDLE "En pausa" |
| Tarea actual / Motivo | "¿Qué está haciendo la Factory?" / "Por qué". Los IDs al comienzo de la tarea se ocultan |
| Etapa actual | Paso resaltado del workflow (en castellano); "completada" marca el paso como hecho |
| Inicio | Tiempo en ejecución |
| Última actualización | Chequeos de frescura |
| Esperando a Pablo | Pendientes de Pablo por clase (v4): "Necesita tu decisión" (decisiones) y "Necesita tu mano" (acciones y validaciones). Una línea `Info:` va a "Para tu información". Una línea sin clase se muestra como acción y Salud avisa. Una decisión sin pedido justificado no se muestra. Una línea que empieza con su propio BL o REQ es un pendiente propio |
| Para tu información | Sección "Para tu información" de Hoy, junto con los riesgos aceptados. No cuenta como pendiente |

Compatibilidad: también se acepta la forma v1 (`Clave:` seguida de una línea `- valor`).

## backlog.md

```
## READY | ## IN_PROGRESS | ## BLOCKED | ## DONE
- [BL-XXX] [CRÍTICO|ALTO|MEDIO|BAJO] Título — contexto · referencias
```

- Un ítem BLOCKED que espera a Pablo contiene la palabra "Pablo". Su clase sale del motivo (`Bloqueado: validación de Pablo` es una validación; `… decisión de Pablo` es una decisión y necesita un pedido; lo demás es una acción).
- Un ítem DONE termina con `— YYYY-MM-DD` (fecha de cierre; alimenta "hoy / esta semana").
- Las líneas que no cumplen el formato se reportan en Salud.

## roadmap.md

Tabla `| Fase | Objetivo | Criterio de salida | Estado |`, con fase `F# — Nombre` y estado `EN CURSO | PENDIENTE | BLOQUEADA | HECHA`.

## risks.md

Tabla `| ID | Severidad | Estado | Riesgo | Mitigación | Responsable | Ref |`.
- ID `RSK-XXX`. Severidad `CRÍTICO|ALTO|MEDIO|BAJO`. Estado `ABIERTO|MITIGADO|CERRADO`.
- Las filas no se borran.
- Un riesgo que Pablo aceptó lo dice en la mitigación (`ACEPTADO por Pablo …`, idealmente con `Revisión acordada: YYYY-MM-DD`). Se sigue midiendo, pero su chequeo baja a informativo, sale de "Qué debería preocuparte" y aparece en "Para tu información" con la fecha de revisión.

## memory-index.md

Secciones `## DECISIONS`, `## LESSONS`, `## FEATURES` con líneas `- [ID](ruta/relativa.md) — resumen`. Los pedidos y respuestas no se indexan: su índice es la carpeta.

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
- Cualquier ID citado (`DEC|LES|FEAT|BL|RSK|REQ|RESP-XXX`) debe existir; si no, se reporta. Para nombrar algo que no existe (por ejemplo, el pedido de prueba 999), escribirlo sin el prefijo.
- El cuerpo se muestra bajo el título de la página (h1): `##` es h2 y `###` es h3.

## Pedidos y respuestas (v3)

`requests/REQ-XXX-<slug>.md` (lo que la Factory necesita de Pablo) y `responses/RESP-XXX.md` (lo que Pablo respondió). Formato, ciclo de vida, protocolo de procesamiento y canal de respuesta: [DECISIONS.md](DECISIONS.md).

Regla v3: toda DEC en estado PROPUESTA debe estar cubierta por un pedido no cerrado.

Regla v4 (DEC-018): un pedido de tipo decisión necesita, además de `## Qué pasó` (contexto), `## Por qué importa` (impacto) y `## Recomendación`, la sección `## Por qué te lo pregunto`: por qué la Factory no puede decidirlo sola. Sin ella, el pedido no se muestra a Pablo y Salud avisa (`req:unjustified`). Las decisiones técnicas las toma la Factory y no llegan al panel.
