# FEAT-000 — Inventario inicial del producto

- Estado: LÍNEA BASE (no es una funcionalidad nueva)
- Fecha: 2026-10-19
- Base: `main` @ `c2f7248` (código = producción `gw2-wallet-ligero` @ `c0471e0`, 2026-10-03)
- Método: verificado contra `index.html` (etiquetas `<script>` con `?v=`) y el listado real de `js/`, `css/`, `assets/`, `docs/`. No copiado de BRIEFING (ver LES-003).

## Producto

**Bóveda del Gato Negro** — app web estática para Guild Wars 2 (vanilla JS, sin backend, GitHub Pages). Requiere API key de GW2 (permisos `account`, `wallet`).

## Rutas de navegación (`index.html`)

`#/welcome` · `#/cards` (Cartera) · `#/meta` · `#/activities` · `#/account/accounts` · `#/account/achievements` · `#/account/characters` · `#/account/legendary-armory` · `#/account/raids` · `#/account/wizards-vault`

## Módulos (versión cargada en `index.html`)

| Área | Archivos |
|---|---|
| Núcleo | `app.js` 2.8.0 · `router.js` 2.17.0 · `api-gw2.js` 2.33.0 · `storage.js` 1.1.0 · `sidebar-nav.js` 1.2 · `analytics.js` · `theme-selector.js` 1.1.0 |
| Bienvenida y cuentas | `welcome-panel.js` 1.4.0 · `accounts-panel.js` 2.0.2 · `settings-manager.js` 1.0.4 · `gist-sync.js` 1.1.0 |
| Cartera | `wallet-dashboard.js` 2.9.0 · `wallet-theme.js` 1.3.1 · `converter-modal.js` 1.2.0 · `commerce-delivery-theme.js` 1.0.0 |
| Meta & Eventos | `meta.js` 3.4.1 · `meta-theme.js` 1.4.2 |
| Actividades | `activities.js` 3.20.4 · `activities-theme.js` 2.6.1 · `fractal-tracker-theme.js` 1.0.1 |
| Logros | `achievements.js` 3.2.1 · `achievements-theme.js` 1.1.1 · `progress-eta.js` 1.0.0 |
| Inventario y Personajes | `inventory-hub.js` 1.4.0 · `inventory-dashboard.js` 1.2.0 · `characters.js` 2.4.1 · `characters-theme.js` 1.0.1 · `item-icons.js` 1.0.0 |
| Raids y Strikes | `raid-tracker.js` 1.9.0 · `strike-tracker.js` 1.0.0 |
| Armería Legendaria | `legendary-tracker.js` 1.1.0 · `legendary-data.js` 1.0.0 · `legendary-recipes.js` 1.0.0 · `legendary-tree.js` 1.0.0 · `legendary-tree-ui.js` 1.0.0 · `render-catologo.js` 1.0.0 · `legendary-precursors.js` (carga diferida, ~268 KB) |
| Cámara del Brujo (WV) | `wizards-vault.js` 1.3.1 · `wv-season-storage.js` 1.1.1 · `wv-shop-ui.js` 1.0.2 · `wv-objectives-ui.js` 1.0.0 · `wv-objectives-dashboard.js` 1.0.0 · `wv-purchase-detail.js` 1.14.0 · `wv-tabs-skin.js` 1.0.0 · `wv-theme.js` 1.0.1 · `luck-curve.js` 1.0.0 |

Total: 46 archivos en `js/`; 45 cargados vía `<script>` + `legendary-precursors.js` bajo demanda.

## Estilos

- `css/main.css` (layout) · `css/theme-polish.css` (piel unificada) — ver DEC-004.
- 18 temas en `css/themes/`: boveda, catppuccin, cyberpunk, discord, dracula, everforest, fluent, glassmorphism, gruvbox, macos, material-dark, nord, notion, one-dark, ps5, solarized-dark, steam, tokyo-night.

## Datos estáticos

- `assets/meta-events.json`, `assets/meta-drops.json`
- `assets/data/`: `gemstore-items.json`, `inventory-sets.json`, `pois.json`, `psna-schedule.json`, `race_icons.json`
- Íconos e imágenes: `assets/icons/`, `assets/gifanim/`, `favicon.png`, `header-texture.png`, `logo-gato-negro.png`

## Dependencias externas

- Google Analytics 4 (`G-LB782QT9TR`, mismo ID que producción).
- `crypto-js@4.2.0` (jsdelivr) — usado por `accounts-panel.js`; `gist-sync.js` ya migró a Web Crypto API.
- `xlsx-0.20.2` (SheetJS) — plantillas/import de cuentas.
- API pública de GW2, Google Fonts, wiki-es de GW2.

## Automatización y gobierno

- `.github/workflows/github-metrics-to-ga4.yml` — diario 00:00 UTC (ver BL-002).
- `.github/CODEOWNERS` (`@PabloSnchz`), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, plantillas de issues y PR.
- Sin tests automatizados ni CI de validación (ver BL-006).

## Documentación de producto

`README.md` · `CHANGELOG.md` · `docs/BRIEFING.md` · `docs/ONBOARDING.md` · `docs/DESARROLLADORES.md` · `docs/Modulos JS Referencia.md` · `docs/PRIVACIDAD.md` · `docs/user-guide*.{md,html}` · `privacy.html`

## Estado parcial conocido

- Armería Legendaria: `legendary-tracker.js` 1.1.0 indica que `loadLegendaryData()` sigue siendo un stub (contrato y cableado listos; datos de API pendientes).

## Deuda detectada en la línea base

Registrada en `backlog.md`: BL-004 (deriva de documentación), BL-005 (`characters-theme.js` incluido dos veces), BL-006 (sin CI), BL-007 (CDN sin SRI).
