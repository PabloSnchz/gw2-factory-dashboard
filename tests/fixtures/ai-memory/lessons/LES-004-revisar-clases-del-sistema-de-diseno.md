# LES-004 — Revisar qué estilos trae una clase antes de reutilizarla

- Fecha de registro: 2026-10-19
- Origen: `docs/BRIEFING.md` — "Prácticas que NO funcionaron" §4

## Qué pasó

Se agregó `class="card"` a las KPI cards del Purchase Detail para heredar el estilo unificado, pero `.card` tiene `min-height: 126px` y rompió la altura compacta.

## Lección

Antes de agregar una clase del sistema de diseño, revisar qué propiedades aporta (padding, min-height, border, box-shadow).

## Cómo aplicar

REVIEW: ante cualquier clase de sistema agregada a un componente existente, verificar las reglas que trae en `main.css` / `theme-polish.css`.
