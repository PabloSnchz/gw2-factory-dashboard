# Arquitectura

Decisiones de origen (en `gw2-factory-dev/ai-memory/decisions/`): DEC-008 (panel nuevo), DEC-010 (GDS), DEC-011 (pedidos y respuestas), DEC-012 (canal de respuesta), DEC-013 (Centro de Decisiones).

## Principios

1. **Lo que necesita a Pablo va primero** (DEC-013). La vista Hoy se ordena por decisión, no por secciones fijas.
2. **Observar el trabajo, no a los trabajadores** (LES-010). Cada vista responde una pregunta de Pablo sobre el trabajo.
3. **Medido vs. declarado.** Lo que la Factory escribe se contrasta con lo que se observa en GitHub; las diferencias son señales.
4. **Ningún dato falso.** Lo que no se pudo leer se muestra como "—" con el motivo. Nunca 0, nunca vacío silencioso.
5. **Sin infraestructura propia** (LES-011). Nada de backend, scripts locales, build ni secretos. El navegador mide; GitHub autentica a Pablo cuando responde.
6. **El panel evoluciona con la memoria.** El formato de ai-memory es un contrato (DEC-009, v3 en DEC-011); cambiarlo implica actualizar el parser y sus tests en el mismo ciclo.

## Capas

```
index.html                gds/tokens.css → gds/components.css → css/app.css
└── js/app.js             router por hash, ciclo de carga, refresco, foco y anuncios
    ├── js/loader.js      orquesta las fuentes → datos crudos (nunca lanza)
    │   └── js/github.js  red: raw (sin cuota) + API (caché, cuota, datos viejos)
    ├── js/model.js       PURO: datos crudos → modelo, cola, canal y chequeos de salud
    │   ├── js/parse.js       PURO: markdown de ai-memory → estructuras
    │   └── js/decisions.js   PURO: pedidos y respuestas (contrato v3)
    ├── js/views.js       PURO: modelo → HTML con componentes GDS (todo texto escapado)
    │   ├── js/respond.js     PURO: botones de respuesta → URL de issue prellenado
    │   └── gds/icons.js      íconos decorativos (aria-hidden)
    └── js/config.js      repos, archivos obligatorios, umbrales
```

`parse`, `decisions`, `model`, `respond` y `views` no tocan el DOM ni la red: se testean en node con la memoria real.

## Fuentes y presupuesto

| # | Llamada | Para qué |
|---|---|---|
| 1 | `GET /repos/…/gw2-factory-dev/commits` | Actividad + SHA del snapshot |
| 2 | `GET /repos/…/gw2-factory-dev/git/trees/{sha}?recursive=1` | Qué archivos de memoria existen |
| 3 | `GET /repos/…/gw2-factory-dashboard/commits` | Actividad del panel |
| 4 | `GET /repos/…/gw2-wallet-ligero/branches/main` | Protección y último commit de PROD |
| 5 | `GET /repos/…/gw2-factory-dev/compare/{prod}...{dev}` | DEV adelante/atrás de PROD |
| 6 | `GET /repos/…/gw2-factory-dev/issues?state=open&creator=PabloSnchz` | Respuestas del canal sin registrar (DEC-013) |

- Contenido de archivos: `raw.githubusercontent.com/{owner}/{repo}/{sha}/…` — sin cuota, inmutable.
- La API anónima permite 60 req/h por IP. Con caché de 10 min, el uso máximo es ~36 req/h.
- Si la API falla: se usa la última respuesta en caché (marcada) o, sin caché, se lee `memory-index.md` por rama y se siguen sus links. "Salud" lo informa.
- Al volver de GitHub después de tocar un botón de respuesta, el panel relee sin caché.

## Vista Hoy (orden)

1. Frase de resumen (`verdict`): respuestas que fallaron > pendientes > problema crítico > en orden.
2. Respuestas del canal sin registrar cuyo pedido no está en la cola.
3. **Necesita tu decisión**: una tarjeta por pendiente. Si es un pedido: por qué importa, opciones, "La Factory recomienda", "Cómo hacerlo", error del canal si lo hay y botones (la recomendada es el único `--primary`).
4. **Ya respondiste**: pedidos respondidos, pospuestos o verificados que la Factory todavía no cerró.
5. Qué hace la Factory (tarea, motivo, etapa, tiempo, próxima acción), qué debería preocuparte, hoy y esta semana, números, entornos.

## Cola "Necesita tu decisión"

Une y deduplica cuatro orígenes:

1. **Pedidos abiertos** (`requests/`). Un pedido no cerrado "cubre" sus IDs relacionados: esos ítems no aparecen sueltos.
2. **DEC en estado `PROPUESTA`** (incluye "Pendiente de Pablo"), salvo que un pedido las cubra.
3. **Ítems `BLOCKED` del backlog que mencionan a Pablo.** Si referencian una DEC ya en cola o algo cubierto por un pedido, se agrupan ahí.
4. **`## Esperando a Pablo` de status.md.** Una línea que nombra su propio trabajo (BL o REQ) es un pendiente propio. Una línea que cita un dato de contexto (por ejemplo, un riesgo) se agrupa con la tarea que lo referencia.

## Chequeos de salud

| Chequeo | Nivel | Fuente |
|---|---|---|
| Archivo obligatorio ausente | crítico (status.md) / atención | medido |
| Codificación corrupta (U+FFFD) | crítico | medido |
| Entradas fuera del índice / links rotos del índice | atención | medido |
| ID duplicado / ID ≠ nombre de archivo / sin fecha | crítico / atención / info | declarado |
| Referencias a IDs inexistentes | atención | declarado |
| Backlog fuera de formato o con ítems repetidos | info / atención | declarado |
| status.md sin actualizar > 48 h (en curso) / > 7 d | atención / crítico | medido |
| Trabajando sin tareas en curso / tareas en curso mientras espera | atención / info | declarado |
| Commits en DEV posteriores a status.md (> 12 h) | atención | medido |
| DEC PROPUESTA esperando > 7 días | atención | medido |
| Pedidos y respuestas (ver docs/DECISIONS.md) | atención / info | declarado |
| Respuesta del canal sin registrar (`channel:failed:N`) | atención | medido |
| Riesgo CRÍTICO abierto | crítico | declarado |
| `main` de producción sin protección | crítico | medido |
| API con errores, caché o cuota baja; snapshot por rama | atención / info | medido |

Umbrales en `js/config.js → thresholds`. Los títulos se escriben para Pablo; el detalle técnico (archivo, código de estado) va en la descripción.

## Accesibilidad (WCAG 2.1 AA)

| Criterio | Cómo |
|---|---|
| 1.3.1 Estructura | Un h1 por vista y niveles sin saltear (test sobre todas las vistas); el markdown de la memoria baja a h2/h3 bajo el h1; secciones con `aria-labelledby` a ids existentes; tablas con `th scope` |
| 1.4.1 Uso del color | Todo estado `.gds-status` / `.gds-callout` lleva ícono + texto (test) |
| 1.4.3 / 1.4.11 Contraste | Pares calculados en `gds/contrast.mjs`; la aplicación no usa colores propios (test) |
| 2.1.1 Teclado | Solo `a`, `button` y `details` nativos; sin manejadores en elementos no interactivos |
| 2.4.1 Saltar bloques | `.gds-skip` → `#app-main` |
| 2.4.3 Orden del foco | Orden del DOM = orden visual; al cambiar de vista el foco pasa a `main`; después de Refrescar vuelve al botón |
| 2.4.4 Propósito de los enlaces | Los botones de respuesta tienen `aria-label` con la acción, el pedido y "abre GitHub en otra pestaña" |
| 2.4.7 Foco visible | Anillo del GDS en todo elemento interactivo |
| 4.1.2 Nombre, rol, valor | Íconos `aria-hidden`; pestaña actual `aria-current="page"`; paso actual `aria-current="step"`; contadores con texto oculto |
| 4.1.3 Mensajes de estado | Lecturas anunciadas en `#app-live` (`aria-live="polite"`); "Registrando tu respuesta" con `role="status"` |

Pendiente: revisión visual y con lector de pantalla en un navegador real (RSK-015).

## Seguridad

- Todo texto de la memoria se escapa antes de insertarse. El renderer de markdown escapa primero, luego da formato y descarta links `javascript:`.
- El panel no maneja secretos ni tokens. Lee repos públicos y arma URLs de issues prellenados; quien escribe es el workflow de gw2-factory-dev con su propio `GITHUB_TOKEN` (DEC-012).
- Enlaces externos con `target="_blank" rel="noopener"` (test).
