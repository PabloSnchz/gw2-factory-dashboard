# DEC-006 — Desacople de Google Analytics por entorno

- Estado: PROPUESTA (requiere decisión de Pablo — BL-002)
- Fecha: 2026-10-19
- Ámbito: Telemetría

## Contexto

Dos puntos de contacto con GA4 en el código heredado:

1. **Frontend** — `index.html` carga `gtag.js` con el ID fijo `G-LB782QT9TR` (el de producción) en el `<head>`. `js/analytics.js` envuelve los eventos (`view_module`, `export_backup`, `add_api_key`, …) y ya tolera la ausencia de `gtag` (los encola sin romper).
2. **CI** — `.github/workflows/github-metrics-to-ga4.yml` corre a diario (00:00 UTC) y envía clones/vistas/stars del repo vía Measurement Protocol con `client_id: github_repo_metrics`, usando los secrets `GA4_MEASUREMENT_ID` / `GA4_API_SECRET`.

Restricción clave: la promoción a producción es una **copia de contenido** de archivos (ver commit `c0471e0`). Cualquier diferencia de configuración por entorno debe resolverse **en tiempo de ejecución**, no con archivos distintos por repo; si no, cada promoción arrastra o pisa la configuración.

## Propuesta

### Frontend
- Reemplazar el bloque fijo de `gtag` por un cargador condicionado al host (allowlist):
  - `pablosnchz.github.io` + ruta `/gw2-wallet-ligero/` → carga GA con `G-LB782QT9TR`.
  - Cualquier otro host/ruta (DEV, previews, localhost) → **no carga GA**. Opcional: un ID de GA de DEV separado, si Pablo lo crea.
- `analytics.js` no necesita cambios funcionales: sin `gtag` encola y no envía.
- Mismo archivo en DEV y PROD ⇒ promocionable sin edición.

### CI
- Agregar al job un guard `if: github.repository == 'PabloSnchz/gw2-wallet-ligero'`. En DEV el workflow queda como no-op (sin fallas diarias ni métricas mezcladas) y el archivo sigue idéntico entre repos.

### Panel de métricas
- `gw2-metrics-dashboard` queda limpio sin cambios: solo recibe datos de producción.

## Alcance

Ambos cambios tocan código de la app/CI ⇒ se implementan como FEAT con ciclo completo y **solo tras aprobación de Pablo**. Mientras tanto, DEV no debe publicarse (DEC-005).

## Pendiente de Pablo

- ¿Telemetría en DEV: ninguna (recomendado) o propiedad GA4 separada?
