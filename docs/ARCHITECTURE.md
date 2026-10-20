# Arquitectura

Decisión de origen: DEC-008 en `gw2-factory-dev/ai-memory/decisions/`.

## Principios

1. **Observar el trabajo, no a los trabajadores** (LES-010). Cada vista responde una pregunta de Pablo sobre el trabajo.
2. **Medido vs. declarado.** Lo que la Factory escribe se contrasta con lo que se observa en GitHub; las diferencias son señales.
3. **Ningún dato falso.** Lo que no se pudo leer se muestra como "—" con el motivo. Nunca 0, nunca vacío silencioso.
4. **Sin infraestructura propia** (LES-011). Nada de backend, scripts locales ni build. El navegador mide.
5. **El panel evoluciona con la memoria.** El formato de ai-memory es un contrato (DEC-009); cambiarlo implica actualizar el parser y sus tests en el mismo ciclo.

## Capas

```
index.html
└── js/app.js        router por hash, ciclo de carga, refresco
    ├── js/loader.js     orquesta las fuentes → datos crudos (nunca lanza)
    │   └── js/github.js     red: raw (sin cuota) + API (caché, cuota, datos viejos)
    ├── js/model.js      PURO: datos crudos → modelo + chequeos de salud
    │   └── js/parse.js      PURO: markdown de ai-memory → estructuras
    ├── js/views.js      PURO: modelo → HTML (todo texto escapado)
    └── js/config.js     repos, archivos obligatorios, umbrales
```

`parse`, `model` y `views` no tocan el DOM ni la red: se testean en node con la memoria real.

## Fuentes y presupuesto

| # | Llamada | Para qué |
|---|---|---|
| 1 | `GET /repos/…/gw2-factory-dev/commits` | Actividad + SHA del snapshot |
| 2 | `GET /repos/…/gw2-factory-dev/git/trees/{sha}?recursive=1` | Qué archivos de memoria existen |
| 3 | `GET /repos/…/gw2-factory-dashboard/commits` | Actividad del panel |
| 4 | `GET /repos/…/gw2-wallet-ligero/branches/main` | Protección y último commit de PROD |
| 5 | `GET /repos/…/gw2-factory-dev/compare/{prod}...{dev}` | DEV adelante/atrás de PROD |

- Contenido de archivos: `raw.githubusercontent.com/{owner}/{repo}/{sha}/…` — sin cuota, inmutable.
- La API anónima permite 60 req/h por IP. Con caché de 10 min, el uso máximo es ~30 req/h.
- Si la API falla: se usa la última respuesta en caché (marcada) o, sin caché, se lee `memory-index.md` por rama y se siguen sus links. "Salud" lo informa.

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
| EN_CURSO sin ítems IN_PROGRESS | atención | declarado |
| Commits en DEV posteriores a status.md (> 12 h) | atención | medido |
| DEC PROPUESTA esperando > 7 días | atención | medido |
| Riesgo CRÍTICO abierto | crítico | declarado |
| `main` de producción sin protección | crítico | medido |
| API con errores, caché o cuota baja; snapshot por rama | atención / info | medido |

Umbrales en `js/config.js → thresholds`.

## Cola "Necesita tu decisión"

Une tres orígenes y deduplica por ID y por referencia cruzada:
1. Decisiones en estado `PROPUESTA` (incluye su sección "Pendiente de Pablo").
2. Ítems `BLOCKED` del backlog que mencionan a Pablo. Si referencian una DEC ya en cola, se agrupan bajo ella.
3. `## Esperando a Pablo` de status.md.

## Seguridad

- Todo texto de la memoria se escapa antes de insertarse; el renderer de markdown escapa primero y luego da formato, y descarta links `javascript:`.
- El panel no maneja secretos ni tokens. Solo lectura de repos públicos.
