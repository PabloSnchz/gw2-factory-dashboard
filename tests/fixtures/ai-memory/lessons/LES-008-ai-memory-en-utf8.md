# LES-008 — ai-memory debe guardarse en UTF-8

- Fecha de registro: 2026-10-19
- Origen: análisis inicial de gw2-factory-dev (commit `c2f7248`)

## Qué pasó

`ai-memory/status.md` se creó con una codificación distinta de UTF-8: los caracteres acentuados ("actualización", "Próxima acción") quedaron como bytes inválidos. La herramienta de GitHub no pudo leer el archivo, y `status.md` es el primer archivo de lectura obligatoria de la Factory.

## Lección

Un archivo de memoria ilegible equivale a memoria inexistente. Todos los archivos de ai-memory deben estar en UTF-8 sin BOM (DEC-002).

## Cómo aplicar

- Al crear o editar archivos de memoria, verificar la codificación.
- BL-006: agregar una validación automática de UTF-8 sobre `ai-memory/`.
