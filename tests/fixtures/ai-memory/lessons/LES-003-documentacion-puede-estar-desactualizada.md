# LES-003 — La documentación puede no reflejar el código

- Fecha de registro: 2026-10-19
- Origen: `docs/BRIEFING.md` — "Prácticas que NO funcionaron" §3; confirmado en el análisis inicial de gw2-factory-dev

## Qué pasó

El onboarding contiene snippets que pueden estar desactualizados. En el análisis del 2026-10-19 se confirmó la deriva: `docs/BRIEFING.md` y `docs/DESARROLLADORES.md` describen v6.6.2 (ej. `api-gw2.js` v2.15.0), mientras `index.html` carga `api-gw2.js?v=2.33.0`, y la Armería Legendaria no figura en `CHANGELOG.md`.

## Lección

Usar la documentación como referencia, nunca como fuente de verdad del código. Verificar siempre contra el archivo real (LES-001).

## Cómo aplicar

Ver BL-004 (sincronizar documentación). Al cerrar cada FEAT, actualizar la documentación de producto afectada (DEC-003).
