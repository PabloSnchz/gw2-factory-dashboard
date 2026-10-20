# DEC-005 — Estrategia de publicación del entorno DEV

- Estado: PROPUESTA (requiere decisión de Pablo — BL-003)
- Fecha: 2026-10-19
- Ámbito: Infraestructura de DEV

## Contexto

- La app es estática y usa rutas relativas (`js/…`, `css/…`, `assets/…`), por lo que funciona bajo cualquier subruta.
- Producción vive en `https://pablosnchz.github.io/gw2-wallet-ligero/`. Con GitHub Pages, DEV quedaría en `https://pablosnchz.github.io/gw2-factory-dev/`: **mismo origen** (`pablosnchz.github.io`).
- Mismo origen ⇒ **mismo `localStorage`**. La app guarda ahí API keys (`gn:apiKeys`, `gn:selectedKey`), cuentas cifradas, settings, caché y migraciones de `storage.js`. Código de DEV con migraciones o bugs de storage puede **alterar los datos reales de producción en el navegador de Pablo**. El riesgo ya existe hoy con `gw2-wallet-agents` publicado en el mismo origen.
- `gist-sync.js` puede sincronizar datos de DEV contra el mismo Gist que usa producción.
- Hallazgos menores: `js/activities.js` tiene como fallback de PSNA una URL raw de `gw2-wallet-ligero/main`; `settings-manager.js` exporta `app: 'gw2-wallet-ligero'` (compatibilidad de import, correcto).

## Opciones

| Opción | Aislamiento de storage | Cambios de código | Extras |
|---|---|---|---|
| A. GitHub Pages en `gw2-factory-dev` | ❌ comparte origen con PROD | Requiere namespace de storage por entorno (`storage.js`) | Simple, mismo proveedor |
| B. Hosting con origen propio (Vercel/Netlify/Cloudflare Pages) | ✅ origen distinto | Ninguno | Preview por rama/PR; Pablo ya usa Vercel (`gw2-metrics-dashboard`) |
| C. GitHub Pages + dominio propio (`dev.<dominio>`) | ✅ origen distinto | Ninguno | Requiere un dominio |

## Propuesta

**Opción B**: publicar `gw2-factory-dev` (rama `main`, raíz, sin build) en Vercel como proyecto estático. Previews automáticas por rama permiten evaluar cada FEAT antes de integrarla.

Reglas de uso de DEV (independientes de la opción):
1. Usar en DEV una API key de prueba o de solo lectura; no reutilizar el Gist de sincronización de producción.
2. Si se elige A, **no publicar** hasta implementar el namespace de storage por entorno (cambio de código → ciclo completo de la Factory).
3. GA desacoplado antes de publicar (DEC-006).

## Pendiente de Pablo

- Elegir A, B o C. Para B: crear el proyecto en Vercel (requiere su cuenta) o autorizar a la Factory a preparar la configuración.
