# DEC-002 — Convenciones de ai-memory

- Estado: ACEPTADA
- Fecha: 2026-10-19
- Ámbito: Memoria oficial de la Factory
- Ampliada por: DEC-009 (risks.md obligatorio y status.md por claves)

## Decisión

### Estructura

```
ai-memory/
├── status.md         Estado actual (se actualiza durante la ejecución)
├── backlog.md        READY / IN_PROGRESS / BLOCKED / DONE
├── memory-index.md   Índice: una línea por DEC / LES / FEAT
├── roadmap.md        Fases y criterios de salida
├── decisions/        DEC-XXX-slug.md
├── lessons/          LES-XXX-slug.md
└── features/         FEAT-XXX-slug.md
```

Los archivos `decisions.md`, `lessons.md` y `features.md` mencionados en la definición de la Factory se materializan como las secciones del `memory-index.md` más las carpetas correspondientes (un archivo por entrada), para mantener la memoria pequeña y cargar solo lo relevante.

### Identificadores

- `DEC-XXX` decisiones · `LES-XXX` lecciones · `FEAT-XXX` funcionalidades · `BL-XXX` ítems de backlog.
- Numeración de 3 dígitos, correlativa, nunca reutilizada.
- `FEAT-000` está reservado para la línea base del producto.

### Formato

- Un archivo = una entrada. Encabezado `# ID — Título` + metadatos (`Estado`, `Fecha`, `Ámbito`/`Origen`).
- Estados de DEC: PROPUESTA · ACEPTADA · REEMPLAZADA (por DEC-YYY) · DESCARTADA.
- Prioridades: CRÍTICO · ALTO · MEDIO · BAJO.
- Fechas en ISO `YYYY-MM-DD` (UTC).
- Las entradas no se borran: se marcan como REEMPLAZADA o DESCARTADA.

### Codificación

- Todos los archivos en **UTF-8 sin BOM**, fin de línea LF (ver LES-008).

### Protocolo de lectura

1. `status.md` → 2. `backlog.md` → 3. `memory-index.md` → solo los DEC/LES/FEAT relevantes para la tarea.
