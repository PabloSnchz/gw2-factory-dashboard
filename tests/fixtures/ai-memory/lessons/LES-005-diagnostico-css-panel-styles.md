# LES-005 — Diagnosticar CSS con el panel Styles, no con mediciones

- Fecha de registro: 2026-10-19
- Origen: `docs/BRIEFING.md` — "Prácticas que NO funcionaron" §5

## Qué pasó

En el fix de espaciado de íconos en las Meta cards se hicieron decenas de mediciones con `getBoundingClientRect` y ajustes inline de padding/margin sin revisar qué regla CSS aplicaba el estilo. Llevó 3 horas algo que tomaba 5 minutos.

## Lección

Si un estilo inline no se refleja, abrir DevTools → Elements → **Styles** y verificar:
1. Qué selector aplica el estilo actual (ej. `.m-foot { margin-top: 6px }`).
2. Si el estilo inline está tachado (sobrescrito por `!important` o mayor especificidad).
3. La cascada completa que afecta al elemento.

## Cómo aplicar

No ajustar valores a ciegas con mediciones si el panel Styles indica qué regla está ganando.
