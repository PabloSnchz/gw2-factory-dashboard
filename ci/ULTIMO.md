# CI: FALLA

- Commit verificado: 3cc248a7280ff60fd7bb80ac1a35e0701b65bad3
- Fecha: 2026-11-21T21:21Z

## Fallas

```
21:✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (51.559894ms)
51:✖ renderHija: tarjeta con su nombre, todo escapado y link a su memoria (2.545394ms)
52:✖ app.js: lee a Shiruna junto con la memoria y pone su tarjeta debajo de «La Factory ahora» (3.049329ms)
145:✖ failing tests:
148:✖ renderHija: tarjeta con su nombre, todo escapado y link a su memoria (2.545394ms)
149:  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /Shiruna · BL-001/. Input:
161:    '        <div><dt>Última actualización</dt><dd>hace 10 min</dd></div>\n' +
178:    actual: '<section class="gds-card uv-hija" aria-labelledby="hija-title" data-hija="ok" data-duena="shiruna"><p class="uv-ante uv-ante--t">Mi hija · Shiruna</p>\n    <div class="gds-card__header">\n      <h2 id="hija-title" class="gds-title-1">¿Qué está haciendo Shiruna?</h2>\n      <div class="gds-cluster"><span class="gds-status gds-status--success">Trabajando</span><span class="gds-status">F0 · Nacimiento</span></div>\n    </div>\n    <div class="gds-stack">\n      <p class="gds-headline-2">Nacer: identidad, memoria limpia y lugar en el Centro de mando.</p>\n      <p class="gds-body-1 gds-text-secondary gds-measure"><strong class="gds-label-1">Por qué:</strong> Pablo necesita llevar a Shiruvana fuera de Copilot Studio.</p>\n      <dl class="facts">\n        <div><dt>Etapa</dt><dd>DOCUMENTATION</dd></div>\n        <div><dt>Última actualización</dt><dd>hace 10 min</dd></div>\n        <div class="facts__wide"><dt>Próxima acción</dt><dd>Mi madre me suma al Centro de mando (S-4).</dd></div>\n      </dl>\n      <p class="gds-body-2 gds-text-secondary">Te pide 1 cosa: están en «02 · Te toca», con su nombre. Sus avisos están en «Para tu información».</p>\n      <p class="gds-caption gds-text-muted"><a href="https://github.com/shiruna-gato-negro/gw2-factory-dev/tree/main/ai-memory" target="_blank" rel="noopener">Ver la memoria de Shiruna</a></p>\n    </div>\n  </section>',
179:    expected: /Shiruna · BL-001/,
185:✖ app.js: lee a Shiruna junto con la memoria y pone su tarjeta debajo de «La Factory ahora» (3.049329ms)
186:  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /import \{ loadHija, buildHija, renderHija \} from '\.\/hija\.js';/. Input:
271:    '    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);\n' +
323:    actual: '/**\n * js/app.js — Punto de entrada: carga, router por hash y refresco.\n *\n * Accesibilidad (GDS):\n * - Al cambiar de vista, el foco pasa al contenido principal (el lector de pantalla anuncia la vista nueva).\n * - El resultado de cada lectura se anuncia en una región aria-live.\n * - Después de Refrescar, el foco vuelve al botón (el encabezado se vuelve a dibujar).\n * Mi globo con el gato (js/globo.js) se monta después de cada dibujo con lectura.\n * Shiruna (js/hija.js, S-4): su memoria se lee junto con la mía; lo que pide entra en «Te toca» y el filtro\n * «Las dos · Shiruvana · Shiruna» se vuelve a aplicar después de cada dibujo (en memoria, sin guardar nada).\n */\n\nimport { CONFIG } from \'./config.js\';\nimport { createGitHub } from \'./github.js\';\nimport { loadAll } from \'./loader.js\';\nimport { buildModel } from \'./model.js\';\nimport * as V from \'./views.js\';\nimport { montarGlobo } from \'./globo.js\';\nimport { loadHija, buildHija, unirHija, aplicarFiltro } from \'./hija.js\';\n\nconst gh = createGitHub({\n  owner: CONFIG.owner,\n  storage: safeStorage(),\n  ttlMs: CONFIG.apiCacheTtlMs,\n  prefix: CONFIG.storagePrefix,\n});\n\nconst state = { model: null, loading: false, error: null, refocusRefresh: false, ver: \'todas\' };\nconst $header = document.getElementById(\'app-header\');\nconst $main = document.getElementById(\'app-main\');\nconst $live = document.getElementById(\'app-live\');\n\nfunction parseRoute() {\n  const parts = (location.hash || \'#/hoy\').replace(/^#\\/?/, \'\').split(\'/\').filter(Boolean);\n  return { name: parts[0] || \'hoy\', arg: parts[1] || null };\n}\n\nfunction render() {\n  const r = parseRoute();\n  const navRoute = r.name === \'item\' ? guessSection(r.arg) : r.name;\n  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);\n  const $refresh = document.getElementById(\'btn-refresh\');\n  $refresh.addEventListener(\'click\', () => { state.refocusRefresh = true; refresh(true); });\n  if (state.refocusRefresh && !state.loading) { state.refocusRefresh = false; $refresh.focus(); }\n\n  if (!state.model) {\n    $main.innerHTML = state.error ? V.renderFatal(state.error) : V.renderLoading();\n    return;\n  }\n  const m = state.model;\n  let html;\n  switch (r.name) {\n    case \'trabajo\': html = V.renderWork(m); break;\n    case \'conocimiento\': html = V.renderKnowledge(m, r.arg); break;\n    case \'riesgos\': html = V.renderRisks(m); break;\n    case \'actividad\': html = V.renderActivity(m, r.arg); break;\n    case \'salud\': html = V.renderHealth(m); break;\n    case \'item\': html = V.renderItem(m, decodeURIComponent(r.arg || \'\')); break;\n    default: html = V.renderHome(m);\n  }\n  $main.innerHTML = html;\n  montarGlobo(m); // mi globo con el gato (BL-091 CD-3); sin el kit, no pasa nada\n  aplicarFiltro($main, state.ver); // lo de Shiruna, lo mío o lo de las dos (S-4b)\n  const pending = m.human.length;\n  document.title = `${pending ? `(${pending}) ` : \'\'}${V.verdict(m).text} · Gato Negro Factory`;\n}\n\nfunction guessSection(id) {\n  const p = String(id || \'\').split(\'-\')[0];\n  return p === \'BL\' ? \'trabajo\' : p === \'RSK\' ? \'riesgos\' : p === \'REQ\' || p === \'RESP\' ? \'hoy\' : \'conocimiento\';\n}\n\nasync function refresh(force) {\n  if (state.loading) return;\n  if (force) clearApiCache();\n  state.loading = true;\n  announce(\'Leyendo la memoria de la Factory…\');\n  render();\n  try {\n    const now = Date.now();\n    const [raw, hija] = await Promise.all([loadAll(gh, now), loadHija({ now })]);\n    state.model = unirHija(buildModel(raw), buildHija(hija, now));\n    state.error = null;\n    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);\n  } catch (e) {\n    console.error(e);\n    state.error = e;\n    announce(\'No se pudo leer la memoria de la Factory.\');\n  } finally {\n    state.loading = false;\n    render();\n  }\n}\n\nfunction announce(text) { if ($live) $live.textContent = text; }\n\nfunction clearApiCache() {\n  const s = safeStorage();\n  try {\n    Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix + \'api:\')).forEach(k => s.removeItem(k));\n  } catch { /* storage no disponible */ }\n}\n\nfunction safeStorage() {\n  try { localStorage.setItem(\'__t\', \'1\'); localStorage.removeItem(\'__t\'); return localStorage; }\n  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; }\n}\n\nwindow.addEventListener(\'hashchange\', () => {\n  render();\n  window.scrollTo(0, 0);\n  $main.focus({ preventScroll: true });\n});\n// Si Pablo abrió un botón de respuesta (issue prellenado), al volver a la pestaña se relee sin caché:\n// así ve enseguida "Registrando tu respuesta" o "Ya respondiste" (DEC-012).\n$main.addEventListener(\'click\', (e) => {\n  const a = e.target.closest && e.target.closest(\'a[href*="/issues/new?"]\');\n  if (a) state.respondedAt = Date.now();\n  const b = e.target.closest && e.target.closest(\'button[data-ver]\');\n  if (b) { state.ver = b.dataset.ver; aplicarFiltro($main, state.ver); }\n});\n// Al volver a la pestaña, relee si respondió hace poco o si los datos tienen más que el TTL de caché.\ndocument.addEventListener(\'visibilitychange\', () => {\n  if (document.visibilityState !== \'visible\' || !state.model) return;\n  if (state.respondedAt && Date.now() - state.respondedAt < 30 * 60 * 1000) { state.respondedAt = null; refresh(true); return; }\n  if (Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);\n});\n\nrefresh(false);\n',
324:    expected: /import \{ loadHija, buildHija, renderHija \} from '\.\/hija\.js';/,
```

## Salida (últimos 60 KB)

```
✔ cache: muchas cargas a lo largo de días no acumulan claves (30.679296ms)
✔ cache: fresco solo con la misma ruta; un árbol de otro commit se vuelve a pedir (0.53332ms)
✔ cache: si la API falla se usa el último dato del casillero (aunque sea de otra ruta) (0.937248ms)
✔ cache: guarda solo lo que usa el panel (0.876114ms)
✔ cache: la ventana de 30 días no cambia dentro del mismo día UTC (0.184806ms)
✔ limpieza: al iniciar borra las claves del formato viejo y nada de otras apps (0.400482ms)
✔ lleno: libera solo su propia caché y reintenta; sin lugar sigue funcionando (0.612429ms)
✔ localStorage real (length/key): storageKeys lo recorre (0.279895ms)
✔ pedidos reales publicados: sin problemas de formato (3.435944ms)
✔ pedido de decisión: opciones y recomendación (0.440296ms)
✔ pedido mal formado: cada problema se explica (0.304351ms)
✔ respuestas: códigos canónicos, sinónimos y validación (0.865223ms)
✔ buildResponseMarkdown: ida y vuelta, y no permite inyectar metadatos (0.98123ms)
✔ ciclo de vida: abierto → respondido → procesado → cerrado (1.334584ms)
✔ posponer: desaparece hasta la fecha y vuelve cuando vence (0.705343ms)
✔ acciones verificadas por medición no esperan respuesta (0.400882ms)
✔ chequeos: espera larga, respuesta sin procesar, huérfana, opción inexistente, README ignorado (18.960733ms)
✔ contrato v3: una DEC PROPUESTA sin pedido es una inconsistencia (solo si ya se usan pedidos) (0.956484ms)
✔ panel: los pedidos encabezan "Necesita tu decisión" y absorben lo que cubren (15.709005ms)
✔ panel: un pedido pospuesto saca de la cola todo lo que cubre (6.34438ms)
✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (51.559894ms)
✔ tokens: todos declarados dentro de :root (salvo la redefinición de movimiento) (2.642306ms)
✔ tokens: sin duplicados (0.555502ms)
✔ tokens: los semánticos de color nunca llevan hex; solo referencian primitivos (o rgba para tintes) (0.632937ms)
✔ tokens: toda referencia var(--gds-*) existe (tokens, componentes, íconos) (1.07735ms)
✔ espaciado: escala exacta 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (0.529954ms)
✔ tipografía: existen los roles headline, title, body, label y caption, en rem (0.717556ms)
✔ componentes: sin hex, rgb/hsl, primitivos ni medidas sueltas (1.780279ms)
✔ accesibilidad: foco visible, salto al contenido y movimiento reducido (0.313127ms)
✔ contraste: todos los pares de uso cumplen WCAG 2.1 AA (1.631337ms)
✔ contraste: la tabla de GDS_FOUNDATION.md coincide con el cálculo (1.148584ms)
✔ íconos: decorativos (aria-hidden) y con color heredado (0.454713ms)
✔ marca: el gato de Gato Negro Factory no cambia (DEC-024 §1) (0.938971ms)
✔ voz de Shiruvana: rótulo visible, ícono y avatar decorativo (0.727264ms)
✔ voz de Shiruvana: avatar oficial liviano y tamaños con tokens (0.555792ms)
✔ foundation: documenta principios, tokens, tipografía, espaciado, componentes y accesibilidad (6.771181ms)
✔ mensaje: con la memoria de prueba dice algo concreto, sin «undefined» (31.742257ms)
✔ mensaje: prioridad — respuesta fallida, riesgo crítico, decisiones, tareas, nada (6.756854ms)
✔ corto: títulos largos en palabra entera con «…»; los cortos, intactos (0.638758ms)
✔ reacción del gato: festeja cuando baja lo pendiente, camina con algo nuevo o crítico (5.739835ms)
✔ montarGlobo: lo crea una vez con su clave, después solo cambia lo que digo; reacciona solo a lecturas nuevas (5.991618ms)
✔ montarGlobo: sin kit, sin modelo o con el kit roto, el panel sigue (devuelve null, no tira) (4.948211ms)
✔ index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo (0.556143ms)
✔ universo.css: con globo, las tarjetas no repiten mi cara; sin kit, quedan como antes (0.566242ms)
✔ config: la hija es Shiruna en su propia organización (1.636249ms)
✔ hijaUrl: raw de su repo, rama main, con parámetro que cambia cada 5 min (0.471093ms)
✔ loadHija: solo raw (sin api.github.com), y nunca lanza (0.614984ms)
✔ lineaHija y estadoHija (0.589906ms)
✔ buildHija: estado, tarea, fase, pendientes e info (2.471876ms)
✔ buildHija: sin status.md dice por qué; sin hija o sin datos, null (0.17616ms)
✖ renderHija: tarjeta con su nombre, todo escapado y link a su memoria (2.545394ms)
✖ app.js: lee a Shiruna junto con la memoria y pone su tarjeta debajo de «La Factory ahora» (3.049329ms)
✔ pipeline completo: snapshot por SHA y presupuesto de 6 llamadas a la API (incluye el canal de respuestas) (29.877316ms)
✔ caché: la segunda lectura no gasta API (5.233686ms)
✔ la memoria real es coherente: sin inconsistencias declaradas (2.38849ms)
✔ producción sin protección se reporta como crítico medido (2.10081ms)
✔ cola de decisión humana: agrupa y no duplica (2.452871ms)
✔ preocupaciones: un riesgo declarado y su medición no se duplican (1.73818ms)
✔ estado, tiempo en ejecución y actividad (1.749962ms)
✔ sin API (cuota agotada): sigue funcionando desde el índice y lo avisa (17.137914ms)
✔ detecta inconsistencias inyectadas (3.813343ms)
✔ codificación corrupta es crítica (9.107893ms)
✔ Hoy: lo que necesita a Pablo va antes que el estado de la Factory (46.017001ms)
✔ veredicto: una frase que dice qué hacer (6.744219ms)
✔ tarjetas: la acción recomendada es el botón principal y va primero (6.010905ms)
✔ lenguaje: los títulos no empiezan con IDs internos; los IDs quedan como referencia secundaria (7.254958ms)
✔ lenguaje: estados en palabras, no en códigos (0.416782ms)
✔ cola: un pendiente propio no se esconde dentro de otro ítem que solo lo cita (3.700881ms)
✔ canal: una respuesta que no se registró se ve en Hoy, en su tarjeta y en Salud (6.278707ms)
✔ canal: recién enviada se muestra como "registrando", no como error (8.197846ms)
✔ canal: ignora PRs e issues sin la marca; si la API falla no rompe (8.010855ms)
✔ accesibilidad: estados con ícono y texto, ids únicos, foco y nombres accesibles (33.715068ms)
✔ accesibilidad: cada vista tiene un h1 y los niveles de título no se saltean (GDS §5) (19.956501ms)
✔ textos: la procedencia de una alerta se dice en palabras, no en códigos (7.218409ms)
✔ accesibilidad: index.html con salto al contenido, región viva e idioma (0.515316ms)
✔ GDS: la aplicación no usa colores sueltos y solo referencia tokens existentes (2.77799ms)
✔ status v2: claves de una línea y secciones (3.627744ms)
✔ status v1 (formato de la inicialización) sigue siendo legible (0.655008ms)
✔ status: resumen de la sesión con viñetas de primer nivel (DEC-024) (0.471524ms)
✔ status ausente devuelve null (nunca un objeto vacío engañoso) (0.206267ms)
✔ backlog: secciones, prioridad, referencias y fecha de cierre (2.928933ms)
✔ riesgos: tabla completa (1.003191ms)
✔ índice: secciones y links (2.614264ms)
✔ entradas: título, metadatos y estado (0.793237ms)
✔ roadmap: fases (0.760716ms)
✔ fechas (1.545529ms)
✔ IDs (0.348353ms)
✔ markdown seguro: escapa HTML y bloquea javascript: (1.271114ms)
✔ la memoria real está en UTF-8 limpio (0.293561ms)
✔ contrato espejo: cuerpo del issue idéntico al texto dorado del canal (4.668867ms)
✔ contrato espejo: archivo de respuesta idéntico al texto dorado y válido para el panel (1.926333ms)
✔ acciones: una acción ofrece Ya lo hice / Posponer / No lo voy a hacer (0.780013ms)
✔ acciones: una decisión con opciones pone primero la recomendada (1.053145ms)
✔ acciones: solo pedidos abiertos se pueden responder (1.891046ms)
✔ URL: issue nuevo en gw2-factory-dev, título acotado y todo codificado (0.975039ms)
✔ panel: cada pedido abierto muestra sus botones de respuesta (52.175132ms)
✔ panel: después de responder, el pedido sale de la cola y aparece en "Ya respondiste" (8.16759ms)
✔ una decisión justificada llega a Pablo con contexto, impacto, motivo y recomendación (53.50189ms)
✔ una decisión sin justificar no llega a Pablo y queda como aviso en Salud (6.064385ms)
✔ con pedidos en uso, una DEC PROPUESTA o una tarea bloqueada "por decisión" sin pedido no llegan a Pablo (3.986307ms)
✔ sin pedidos (memoria v2) se conserva la cola anterior (5.863347ms)
✔ status.md: cada línea declara su clase; Info y "Para tu información" no son pendientes (7.199524ms)
✔ un riesgo que Pablo aceptó pasa a información: sin alarma crítica y con su fecha de revisión (12.877002ms)
✔ Hoy: sin decisiones lo dice claro y separa las tareas (6.989921ms)
✔ splitStatusLine reconoce clases con y sin tilde (0.332454ms)
✔ paleta: colores literales solo en el primer :root y solo como --uv-* (2.019388ms)
✔ referencias: toda var(--uv-*) y var(--gds-*) existe; solo se reasignan colores del GDS que existen (0.726573ms)
✔ contraste: los pares del GDS cumplen WCAG 2.1 AA con la paleta del universo (3.01206ms)
✔ movimiento: con prefers-reduced-motion no hay chispas ni latido (0.292017ms)
✔ index.html: la piel va última y las chispas son decorativas (0.71962ms)
✔ cabecera: «Centro de mando», marca con aro y latido decorativo (0.577203ms)
✔ mesa: 01 · Ahora arriba y dos columnas; lo tuyo a la izquierda, la Factory a la derecha (36.292271ms)
✔ mesa: antetítulos 01 a 06, cada uno una sola vez (4.544645ms)
✔ mesa: tres cifras; «te esperan» es la cantidad de pendientes y el cero va en gris (5.737291ms)
✔ mesa: estilos — dos columnas que se apilan en pantallas chicas, cifras en ámbar (0.912181ms)
✔ vistas: cada una abre con «01 · …», su único h1 y tres o más cifras en ámbar (8.787092ms)
✔ vistas: las cifras dicen lo mismo que la vista (6.74438ms)
✔ vistas: líneas de tiempo con puntos, tablero y niveles con su color (5.977151ms)
✔ resumen: si entra, todo; si no, la primera oración; si es muy larga, cortada en una palabra entera con «…» (0.276359ms)
✔ 04 · La Factory ahora: con textos de miles de caracteres, el resumen arriba y el resto plegado con scroll propio (9.249247ms)
✔ 04 · La Factory ahora: con textos cortos no hay nada plegado (5.655627ms)
✔ celular: etapas en vertical, sin desenfoque por tarjeta, cifras más chicas y puertas sin hover pegado (0.503715ms)
✔ Hoy responde las preguntas de la misión (49.908581ms)
✔ todas las vistas renderizan (21.242273ms)
✔ detalle: links internos entre entradas y "citado por" (4.506592ms)
✔ el contenido de la memoria se escapa en todas las vistas (5.034442ms)
✔ dato faltante se muestra con motivo, nunca vacío (4.596622ms)
✔ caras: cada tipo de mensaje tiene la suya (3.607777ms)
✔ caras: WebP embebido y liviano (0.629461ms)
✔ voz: recomienda, advierte, decide y resume con su rótulo (35.380862ms)
✔ voz: un solo avatar por sección visible (5.552845ms)
✔ voz: tamaños — 56 px en resumen y decisión importante, 48 px en el resto (5.008023ms)
✔ voz: el resumen muestra hasta 3 viñetas de primer nivel (3.234407ms)
✔ voz: solo decisiones de la Factory; las de Pablo no son "Shiruvana decidió" (2.60695ms)
✔ voz: nunca en la cabecera, las métricas ni sin nada que decir (10.168973ms)
ℹ tests 135
ℹ suites 0
ℹ pass 133
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 791.916691

✖ failing tests:

test at tests/hija.test.mjs:111:1
✖ renderHija: tarjeta con su nombre, todo escapado y link a su memoria (2.545394ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /Shiruna · BL-001/. Input:
  
  '<section class="gds-card uv-hija" aria-labelledby="hija-title" data-hija="ok" data-duena="shiruna"><p class="uv-ante uv-ante--t">Mi hija · Shiruna</p>\n' +
    '    <div class="gds-card__header">\n' +
    '      <h2 id="hija-title" class="gds-title-1">¿Qué está haciendo Shiruna?</h2>\n' +
    '      <div class="gds-cluster"><span class="gds-status gds-status--success">Trabajando</span><span class="gds-status">F0 · Nacimiento</span></div>\n' +
    '    </div>\n' +
    '    <div class="gds-stack">\n' +
    '      <p class="gds-headline-2">Nacer: identidad, memoria limpia y lugar en el Centro de mando.</p>\n' +
    '      <p class="gds-body-1 gds-text-secondary gds-measure"><strong class="gds-label-1">Por qué:</strong> Pablo necesita llevar a Shiruvana fuera de Copilot Studio.</p>\n' +
    '      <dl class="facts">\n' +
    '        <div><dt>Etapa</dt><dd>DOCUMENTATION</dd></div>\n' +
    '        <div><dt>Última actualización</dt><dd>hace 10 min</dd></div>\n' +
    '        <div class="facts__wide"><dt>Próxima acción</dt><dd>Mi madre me suma al Centro de mando (S-4).</dd></div>\n' +
    '      </dl>\n' +
    '      <p class="gds-body-2 gds-text-secondary">Te pide 1 cosa: están en «02 · Te toca», con su nombre. Sus avisos están en «Para tu información».</p>\n' +
    '      <p class="gds-caption gds-text-muted"><a href="https://github.com/shiruna-gato-negro/gw2-factory-dev/tree/main/ai-memory" target="_blank" rel="noopener">Ver la memoria de Shiruna</a></p>\n' +
    '    </div>\n' +
    '  </section>'
  
      at TestContext.<anonymous> (file:///home/runner/work/gw2-factory-dashboard/gw2-factory-dashboard/tests/hija.test.mjs:118:10)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1047:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:744:18)
      at Test.postRun (node:internal/test_runner/test:1173:19)
      at Test.run (node:internal/test_runner/test:1101:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: '<section class="gds-card uv-hija" aria-labelledby="hija-title" data-hija="ok" data-duena="shiruna"><p class="uv-ante uv-ante--t">Mi hija · Shiruna</p>\n    <div class="gds-card__header">\n      <h2 id="hija-title" class="gds-title-1">¿Qué está haciendo Shiruna?</h2>\n      <div class="gds-cluster"><span class="gds-status gds-status--success">Trabajando</span><span class="gds-status">F0 · Nacimiento</span></div>\n    </div>\n    <div class="gds-stack">\n      <p class="gds-headline-2">Nacer: identidad, memoria limpia y lugar en el Centro de mando.</p>\n      <p class="gds-body-1 gds-text-secondary gds-measure"><strong class="gds-label-1">Por qué:</strong> Pablo necesita llevar a Shiruvana fuera de Copilot Studio.</p>\n      <dl class="facts">\n        <div><dt>Etapa</dt><dd>DOCUMENTATION</dd></div>\n        <div><dt>Última actualización</dt><dd>hace 10 min</dd></div>\n        <div class="facts__wide"><dt>Próxima acción</dt><dd>Mi madre me suma al Centro de mando (S-4).</dd></div>\n      </dl>\n      <p class="gds-body-2 gds-text-secondary">Te pide 1 cosa: están en «02 · Te toca», con su nombre. Sus avisos están en «Para tu información».</p>\n      <p class="gds-caption gds-text-muted"><a href="https://github.com/shiruna-gato-negro/gw2-factory-dev/tree/main/ai-memory" target="_blank" rel="noopener">Ver la memoria de Shiruna</a></p>\n    </div>\n  </section>',
    expected: /Shiruna · BL-001/,
    operator: 'match',
    diff: 'simple'
  }

test at tests/hija.test.mjs:130:1
✖ app.js: lee a Shiruna junto con la memoria y pone su tarjeta debajo de «La Factory ahora» (3.049329ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /import \{ loadHija, buildHija, renderHija \} from '\.\/hija\.js';/. Input:
  
  '/**\n' +
    ' * js/app.js — Punto de entrada: carga, router por hash y refresco.\n' +
    ' *\n' +
    ' * Accesibilidad (GDS):\n' +
    ' * - Al cambiar de vista, el foco pasa al contenido principal (el lector de pantalla anuncia la vista nueva).\n' +
    ' * - El resultado de cada lectura se anuncia en una región aria-live.\n' +
    ' * - Después de Refrescar, el foco vuelve al botón (el encabezado se vuelve a dibujar).\n' +
    ' * Mi globo con el gato (js/globo.js) se monta después de cada dibujo con lectura.\n' +
    ' * Shiruna (js/hija.js, S-4): su memoria se lee junto con la mía; lo que pide entra en «Te toca» y el filtro\n' +
    ' * «Las dos · Shiruvana · Shiruna» se vuelve a aplicar después de cada dibujo (en memoria, sin guardar nada).\n' +
    ' */\n' +
    '\n' +
    "import { CONFIG } from './config.js';\n" +
    "import { createGitHub } from './github.js';\n" +
    "import { loadAll } from './loader.js';\n" +
    "import { buildModel } from './model.js';\n" +
    "import * as V from './views.js';\n" +
    "import { montarGlobo } from './globo.js';\n" +
    "import { loadHija, buildHija, unirHija, aplicarFiltro } from './hija.js';\n" +
    '\n' +
    'const gh = createGitHub({\n' +
    '  owner: CONFIG.owner,\n' +
    '  storage: safeStorage(),\n' +
    '  ttlMs: CONFIG.apiCacheTtlMs,\n' +
    '  prefix: CONFIG.storagePrefix,\n' +
    '});\n' +
    '\n' +
    "const state = { model: null, loading: false, error: null, refocusRefresh: false, ver: 'todas' };\n" +
    "const $header = document.getElementById('app-header');\n" +
    "const $main = document.getElementById('app-main');\n" +
    "const $live = document.getElementById('app-live');\n" +
    '\n' +
    'function parseRoute() {\n' +
    "  const parts = (location.hash || '#/hoy').replace(/^#\\/?/, '').split('/').filter(Boolean);\n" +
    "  return { name: parts[0] || 'hoy', arg: parts[1] || null };\n" +
    '}\n' +
    '\n' +
    'function render() {\n' +
    '  const r = parseRoute();\n' +
    "  const navRoute = r.name === 'item' ? guessSection(r.arg) : r.name;\n" +
    '  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);\n' +
    "  const $refresh = document.getElementById('btn-refresh');\n" +
    "  $refresh.addEventListener('click', () => { state.refocusRefresh = true; refresh(true); });\n" +
    '  if (state.refocusRefresh && !state.loading) { state.refocusRefresh = false; $refresh.focus(); }\n' +
    '\n' +
    '  if (!state.model) {\n' +
    '    $main.innerHTML = state.error ? V.renderFatal(state.error) : V.renderLoading();\n' +
    '    return;\n' +
    '  }\n' +
    '  const m = state.model;\n' +
    '  let html;\n' +
    '  switch (r.name) {\n' +
    "    case 'trabajo': html = V.renderWork(m); break;\n" +
    "    case 'conocimiento': html = V.renderKnowledge(m, r.arg); break;\n" +
    "    case 'riesgos': html = V.renderRisks(m); break;\n" +
    "    case 'actividad': html = V.renderActivity(m, r.arg); break;\n" +
    "    case 'salud': html = V.renderHealth(m); break;\n" +
    "    case 'item': html = V.renderItem(m, decodeURIComponent(r.arg || '')); break;\n" +
    '    default: html = V.renderHome(m);\n' +
    '  }\n' +
    '  $main.innerHTML = html;\n' +
    '  montarGlobo(m); // mi globo con el gato (BL-091 CD-3); sin el kit, no pasa nada\n' +
    '  aplicarFiltro($main, state.ver); // lo de Shiruna, lo mío o lo de las dos (S-4b)\n' +
    '  const pending = m.human.length;\n' +
    "  document.title = `${pending ? `(${pending}) ` : ''}${V.verdict(m).text} · Gato Negro Factory`;\n" +
    '}\n' +
    '\n' +
    'function guessSection(id) {\n' +
    "  const p = String(id || '').split('-')[0];\n" +
    "  return p === 'BL' ? 'trabajo' : p === 'RSK' ? 'riesgos' : p === 'REQ' || p === 'RESP' ? 'hoy' : 'conocimiento';\n" +
    '}\n' +
    '\n' +
    'async function refresh(force) {\n' +
    '  if (state.loading) return;\n' +
    '  if (force) clearApiCache();\n' +
    '  state.loading = true;\n' +
    "  announce('Leyendo la memoria de la Factory…');\n" +
    '  render();\n' +
    '  try {\n' +
    '    const now = Date.now();\n' +
    '    const [raw, hija] = await Promise.all([loadAll(gh, now), loadHija({ now })]);\n' +
    '    state.model = unirHija(buildModel(raw), buildHija(hija, now));\n' +
    '    state.error = null;\n' +
    '    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);\n' +
    '  } catch (e) {\n' +
    '    console.error(e);\n' +
    '    state.error = e;\n' +
    "    announce('No se pudo leer la memoria de la Factory.');\n" +
    '  } finally {\n' +
    '    state.loading = false;\n' +
    '    render();\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    'function announce(text) { if ($live) $live.textContent = text; }\n' +
    '\n' +
    'function clearApiCache() {\n' +
    '  const s = safeStorage();\n' +
    '  try {\n' +
    "    Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix + 'api:')).forEach(k => s.removeItem(k));\n" +
    '  } catch { /* storage no disponible */ }\n' +
    '}\n' +
    '\n' +
    'function safeStorage() {\n' +
    "  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }\n" +
    '  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; }\n' +
    '}\n' +
    '\n' +
    "window.addEventListener('hashchange', () => {\n" +
    '  render();\n' +
    '  window.scrollTo(0, 0);\n' +
    '  $main.focus({ preventScroll: true });\n' +
    '});\n' +
    '// Si Pablo abrió un botón de respuesta (issue prellenado), al volver a la pestaña se relee sin caché:\n' +
    '// así ve enseguida "Registrando tu respuesta" o "Ya respondiste" (DEC-012).\n' +
    "$main.addEventListener('click', (e) => {\n" +
    `  const a = e.target.closest && e.target.closest('a[href*="/issues/new?"]');\n` +
    '  if (a) state.respondedAt = Date.now();\n' +
    "  const b = e.target.closest && e.target.closest('button[data-ver]');\n" +
    '  if (b) { state.ver = b.dataset.ver; aplicarFiltro($main, state.ver); }\n' +
    '});\n' +
    '// Al volver a la pestaña, relee si respondió hace poco o si los datos tienen más que el TTL de caché.\n' +
    "document.addEventListener('visibilitychange', () => {\n" +
    "  if (document.visibilityState !== 'visible' || !state.model) return;\n" +
    '  if (state.respondedAt && Date.now() - state.respondedAt < 30 * 60 * 1000) { state.respondedAt = null; refresh(true); return; }\n' +
    '  if (Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);\n' +
    '});\n' +
    '\n' +
    'refresh(false);\n'
  
      at TestContext.<anonymous> (file:///home/runner/work/gw2-factory-dashboard/gw2-factory-dashboard/tests/hija.test.mjs:133:10)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: '/**\n * js/app.js — Punto de entrada: carga, router por hash y refresco.\n *\n * Accesibilidad (GDS):\n * - Al cambiar de vista, el foco pasa al contenido principal (el lector de pantalla anuncia la vista nueva).\n * - El resultado de cada lectura se anuncia en una región aria-live.\n * - Después de Refrescar, el foco vuelve al botón (el encabezado se vuelve a dibujar).\n * Mi globo con el gato (js/globo.js) se monta después de cada dibujo con lectura.\n * Shiruna (js/hija.js, S-4): su memoria se lee junto con la mía; lo que pide entra en «Te toca» y el filtro\n * «Las dos · Shiruvana · Shiruna» se vuelve a aplicar después de cada dibujo (en memoria, sin guardar nada).\n */\n\nimport { CONFIG } from \'./config.js\';\nimport { createGitHub } from \'./github.js\';\nimport { loadAll } from \'./loader.js\';\nimport { buildModel } from \'./model.js\';\nimport * as V from \'./views.js\';\nimport { montarGlobo } from \'./globo.js\';\nimport { loadHija, buildHija, unirHija, aplicarFiltro } from \'./hija.js\';\n\nconst gh = createGitHub({\n  owner: CONFIG.owner,\n  storage: safeStorage(),\n  ttlMs: CONFIG.apiCacheTtlMs,\n  prefix: CONFIG.storagePrefix,\n});\n\nconst state = { model: null, loading: false, error: null, refocusRefresh: false, ver: \'todas\' };\nconst $header = document.getElementById(\'app-header\');\nconst $main = document.getElementById(\'app-main\');\nconst $live = document.getElementById(\'app-live\');\n\nfunction parseRoute() {\n  const parts = (location.hash || \'#/hoy\').replace(/^#\\/?/, \'\').split(\'/\').filter(Boolean);\n  return { name: parts[0] || \'hoy\', arg: parts[1] || null };\n}\n\nfunction render() {\n  const r = parseRoute();\n  const navRoute = r.name === \'item\' ? guessSection(r.arg) : r.name;\n  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);\n  const $refresh = document.getElementById(\'btn-refresh\');\n  $refresh.addEventListener(\'click\', () => { state.refocusRefresh = true; refresh(true); });\n  if (state.refocusRefresh && !state.loading) { state.refocusRefresh = false; $refresh.focus(); }\n\n  if (!state.model) {\n    $main.innerHTML = state.error ? V.renderFatal(state.error) : V.renderLoading();\n    return;\n  }\n  const m = state.model;\n  let html;\n  switch (r.name) {\n    case \'trabajo\': html = V.renderWork(m); break;\n    case \'conocimiento\': html = V.renderKnowledge(m, r.arg); break;\n    case \'riesgos\': html = V.renderRisks(m); break;\n    case \'actividad\': html = V.renderActivity(m, r.arg); break;\n    case \'salud\': html = V.renderHealth(m); break;\n    case \'item\': html = V.renderItem(m, decodeURIComponent(r.arg || \'\')); break;\n    default: html = V.renderHome(m);\n  }\n  $main.innerHTML = html;\n  montarGlobo(m); // mi globo con el gato (BL-091 CD-3); sin el kit, no pasa nada\n  aplicarFiltro($main, state.ver); // lo de Shiruna, lo mío o lo de las dos (S-4b)\n  const pending = m.human.length;\n  document.title = `${pending ? `(${pending}) ` : \'\'}${V.verdict(m).text} · Gato Negro Factory`;\n}\n\nfunction guessSection(id) {\n  const p = String(id || \'\').split(\'-\')[0];\n  return p === \'BL\' ? \'trabajo\' : p === \'RSK\' ? \'riesgos\' : p === \'REQ\' || p === \'RESP\' ? \'hoy\' : \'conocimiento\';\n}\n\nasync function refresh(force) {\n  if (state.loading) return;\n  if (force) clearApiCache();\n  state.loading = true;\n  announce(\'Leyendo la memoria de la Factory…\');\n  render();\n  try {\n    const now = Date.now();\n    const [raw, hija] = await Promise.all([loadAll(gh, now), loadHija({ now })]);\n    state.model = unirHija(buildModel(raw), buildHija(hija, now));\n    state.error = null;\n    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);\n  } catch (e) {\n    console.error(e);\n    state.error = e;\n    announce(\'No se pudo leer la memoria de la Factory.\');\n  } finally {\n    state.loading = false;\n    render();\n  }\n}\n\nfunction announce(text) { if ($live) $live.textContent = text; }\n\nfunction clearApiCache() {\n  const s = safeStorage();\n  try {\n    Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix + \'api:\')).forEach(k => s.removeItem(k));\n  } catch { /* storage no disponible */ }\n}\n\nfunction safeStorage() {\n  try { localStorage.setItem(\'__t\', \'1\'); localStorage.removeItem(\'__t\'); return localStorage; }\n  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; }\n}\n\nwindow.addEventListener(\'hashchange\', () => {\n  render();\n  window.scrollTo(0, 0);\n  $main.focus({ preventScroll: true });\n});\n// Si Pablo abrió un botón de respuesta (issue prellenado), al volver a la pestaña se relee sin caché:\n// así ve enseguida "Registrando tu respuesta" o "Ya respondiste" (DEC-012).\n$main.addEventListener(\'click\', (e) => {\n  const a = e.target.closest && e.target.closest(\'a[href*="/issues/new?"]\');\n  if (a) state.respondedAt = Date.now();\n  const b = e.target.closest && e.target.closest(\'button[data-ver]\');\n  if (b) { state.ver = b.dataset.ver; aplicarFiltro($main, state.ver); }\n});\n// Al volver a la pestaña, relee si respondió hace poco o si los datos tienen más que el TTL de caché.\ndocument.addEventListener(\'visibilitychange\', () => {\n  if (document.visibilityState !== \'visible\' || !state.model) return;\n  if (state.respondedAt && Date.now() - state.respondedAt < 30 * 60 * 1000) { state.respondedAt = null; refresh(true); return; }\n  if (Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);\n});\n\nrefresh(false);\n',
    expected: /import \{ loadHija, buildHija, renderHija \} from '\.\/hija\.js';/,
    operator: 'match',
    diff: 'simple'
  }
```
