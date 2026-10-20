# LES-002 — Diagnosticar la causa raíz; no entrar en bucles de prueba y error

- Fecha de registro: 2026-10-19
- Origen: `docs/BRIEFING.md` — "Claves que funcionaron" §1 y "Prácticas que NO funcionaron" §2

## Qué pasó

En el fix de paginación del Banco en Inventory Hub se hicieron 5-6 iteraciones de cambios sin diagnosticar. La causa era una llave extra introducida por un cambio anterior.

## Lección

- Antes de tocar código, diagnosticar: ejecutar los métodos `_debug()` de los módulos (ej. `InventoryHub._debug()`, `ConverterModal._debug()`, `WVObjectivesDashboard._debug()`) e inspeccionar el DOM.
- Ante un bug visual, comparar con una versión que sí funciona.
- Si un cambio no funciona a la primera, volver a diagnosticar antes de proponer otro.

## Cómo aplicar

No proponer un segundo intento de fix sin una hipótesis de causa raíz documentada.
