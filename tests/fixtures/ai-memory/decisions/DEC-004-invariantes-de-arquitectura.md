# DEC-004 — Invariantes de arquitectura del producto

- Estado: ACEPTADA (formaliza reglas preexistentes)
- Fecha: 2026-10-19
- Ámbito: Código de la aplicación
- Origen: `docs/BRIEFING.md`, `docs/DESARROLLADORES.md`, `.github/CONTRIBUTING.md`, `CHANGELOG.md`

## Decisión

Toda modificación de la aplicación en DEV debe respetar estas invariantes. Romper una requiere una nueva DEC que la reemplace.

1. **CSS en 3 capas (NO ROMPER)**
   - `css/main.css`: layout, fondos, tipografía. Sin bordes ni box-shadows.
   - `css/theme-polish.css`: bordes neutros, glow base, hover, dimensiones de UI.
   - `js/*-theme.js`: **solo** `borderLeft: 3px solid <color>`. No sobrescribir `border`, `boxShadow`, `borderRadius`, `transition`.
   - **Nunca `!important`** en estilos de tema.
   - Colores mediante variables CSS (temas en `css/themes/*.css`).
2. **Router-first**: `js/router.js` orquesta; los módulos se activan/desactivan por ruta y no tocan DOM ajeno.
3. **Canal único de cambio de cuenta**: evento `gn:tokenchange` (disparado por `KeyManager.setSelected()`).
4. **Persistencia vía Storage API** (`js/storage.js`): claves con prefijo `gn:`; evitar `localStorage` innecesario; preferir caché en memoria con TTL.
5. **Módulos IIFE en vanilla JS** con API pública en `window.*` y método `_debug()` cuando aplique.
6. **Sin backend**: la app es estática (GitHub Pages) y consume la API pública de GW2 con la API key del usuario.
7. **Cache-busting**: los `<script>`/`<link>` en `index.html` usan `?v=<versión>` alineado con el encabezado del archivo.
8. **Datos pesados bajo demanda**: catálogos grandes se cargan de forma diferida (ej. `legendary-precursors.js`, ~268 KB, se pide al abrir un árbol, no al arrancar).

## Consecuencias

- REVIEW debe verificar estas invariantes en cada cambio de código.
- La validación automática (BL-006) debería cubrir al menos el punto 1 (`!important` en temas) y la sintaxis JS.
