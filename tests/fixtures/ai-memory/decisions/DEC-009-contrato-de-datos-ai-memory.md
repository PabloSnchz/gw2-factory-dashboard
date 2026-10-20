# DEC-009 — Contrato de datos v2 de ai-memory

- Estado: ACEPTADA
- Fecha: 2026-10-20
- Ámbito: Memoria oficial de la Factory
- Amplía: DEC-002

## Contexto

El Dashboard Factory (DEC-008) lee ai-memory directamente. Para que el panel sea confiable, el formato tiene que ser explícito y estable. La especificación completa vive en `gw2-factory-dashboard/docs/DATA-CONTRACT.md`; esta decisión fija las reglas.

## Decisión

### status.md — claves de una línea

```
Estado: EN_CURSO | ESPERANDO_VALIDACIÓN | BLOQUEADO | IDLE
Tarea actual: <ID> — <título>
Motivo: <por qué se hace, con referencias>
Fase: <F#> — <nombre>
Etapa actual: PRODUCT | ARCHITECTURE | DEVELOPMENT | REVIEW | DOCUMENTATION [completada]
Inicio: YYYY-MM-DDTHH:MMZ
Última actualización: YYYY-MM-DDTHH:MMZ
Próxima acción: <texto>

## Esperando a Pablo
- [ID] <qué decisión hace falta>

## Bloqueos
- <texto>
```

- `Inicio` alimenta "tiempo en ejecución"; `Última actualización` alimenta los chequeos de frescura.
- Se actualiza al cambiar de tarea o de etapa, y al cerrar cada sesión de trabajo.

### risks.md — nuevo archivo obligatorio

Tabla con columnas `ID | Severidad | Estado | Riesgo | Mitigación | Responsable | Ref`.
IDs `RSK-XXX`. Severidad CRÍTICO/ALTO/MEDIO/BAJO. Estado ABIERTO/MITIGADO/CERRADO. Nunca se borran filas.

### backlog.md

`- [BL-XXX] [PRIORIDAD] Título — contexto · referencias` dentro de `## READY / IN_PROGRESS / BLOCKED / DONE`.
- Un ítem que espera a Pablo lo dice con la palabra "Pablo" (entra a la cola de decisión humana).
- Los ítems DONE terminan con la fecha de cierre `— YYYY-MM-DD`.

### Entradas DEC / LES / FEAT

- Archivo `<ID>-<slug>.md`, título `# <ID> — <Título>`, seguido de metadatos `- Clave: valor` (`Estado`, `Fecha` o `Fecha de registro`).
- Una DEC en estado `PROPUESTA` es, por definición, un pedido de decisión a Pablo; puede incluir `## Pendiente de Pablo`.
- Toda entrada se registra en `memory-index.md` como `- [ID](ruta) — resumen`.

### Archivos obligatorios

`status.md`, `backlog.md`, `memory-index.md`, `roadmap.md`, `risks.md`. UTF-8 sin BOM (LES-008).

## Consecuencias

- El dashboard reporta en "Salud" cualquier desvío del contrato (archivo ausente, línea fuera de formato, ID inexistente o duplicado, entrada fuera del índice).
- Cambiar el contrato requiere una nueva DEC y actualizar el parser y sus tests en el mismo ciclo.
