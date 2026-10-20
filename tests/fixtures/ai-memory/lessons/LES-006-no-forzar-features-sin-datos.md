# LES-006 — Si la API no provee los datos, no insistir

- Fecha de registro: 2026-10-19
- Origen: `docs/BRIEFING.md` — "Prácticas que NO funcionaron" §6

## Qué pasó

La tab "Novedades de Gem Store" no puede construirse sin un backend que scrapee fuentes externas (ej. ThatShaman) o los archivos del juego. Se intentaron 4 enfoques distintos antes de aceptarlo.

## Lección

Si la API pública de GW2 no devuelve los datos necesarios, descartar la feature o buscar una alternativa realista. La app no tiene backend (DEC-004 §6).

## Cómo aplicar

PRODUCT/ARCHITECTURE: validar la disponibilidad de datos en la API **antes** de pasar a DEVELOPMENT.
