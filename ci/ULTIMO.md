# CI: FALLA

- Commit verificado: 8f74c2686965ad83bbfccbf78e63ac33df69fe1e
- Fecha: 2026-11-21T21:10Z

## Fallas

```
21:✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (540.391125ms)
43:✖ index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo (2.087051ms)
145:✖ failing tests:
148:✖ index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo (2.087051ms)
149:  AssertionError [ERR_ASSERTION]: se monta después de dibujar la vista
159:    actual: '/**\n * js/app.js — Punto de entrada: carga, router por hash y refresco.\n *\n * Accesibilidad (GDS):\n * - Al cambiar de vista, el foco pasa al contenido principal (el lector de pantalla anuncia la vista nueva).\n * - El resultado de cada lectura se anuncia en una región aria-live.\n * - Después de Refrescar, el foco vuelve al botón (el encabezado se vuelve a dibujar).\n * Mi globo con el gato (js/globo.js) se monta después de cada dibujo con lectura.\n * Shiruna (js/hija.js, S-4a): su memoria se lee junto con la mía y su tarjeta va debajo de «La Factory ahora».\n */\n\nimport { CONFIG } from \'./config.js\';\nimport { createGitHub } from \'./github.js\';\nimport { loadAll } from \'./loader.js\';\nimport { buildModel } from \'./model.js\';\nimport * as V from \'./views.js\';\nimport { montarGlobo } from \'./globo.js\';\nimport { loadHija, buildHija, renderHija } from \'./hija.js\';\n\nconst gh = createGitHub({\n  owner: CONFIG.owner,\n  storage: safeStorage(),\n  ttlMs: CONFIG.apiCacheTtlMs,\n  prefix: CONFIG.storagePrefix,\n});\n\nconst state = { model: null, loading: false, error: null, refocusRefresh: false };\nconst $header = document.getElementById(\'app-header\');\nconst $main = document.getElementById(\'app-main\');\nconst $live = document.getElementById(\'app-live\');\n\nfunction parseRoute() {\n  const parts = (location.hash || \'#/hoy\').replace(/^#\\/?/, \'\').split(\'/\').filter(Boolean);\n  return { name: parts[0] || \'hoy\', arg: parts[1] || null };\n}\n\nfunction render() {\n  const r = parseRoute();\n  const navRoute = r.name === \'item\' ? guessSection(r.arg) : r.name;\n  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);\n  const $refresh = document.getElementById(\'btn-refresh\');\n  $refresh.addEventListener(\'click\', () => { state.refocusRefresh = true; refresh(true); });\n  if (state.refocusRefresh && !state.loading) { state.refocusRefresh = false; $refresh.focus(); }\n\n  if (!state.model) {\n    $main.innerHTML = state.error ? V.renderFatal(state.error) : V.renderLoading();\n    return;\n  }\n  const m = state.model;\n  let html;\n  switch (r.name) {\n    case \'trabajo\': html = V.renderWork(m); break;\n    case \'conocimiento\': html = V.renderKnowledge(m, r.arg); break;\n    case \'riesgos\': html = V.renderRisks(m); break;\n    case \'actividad\': html = V.renderActivity(m, r.arg); break;\n    case \'salud\': html = V.renderHealth(m); break;\n    case \'item\': html = V.renderItem(m, decodeURIComponent(r.arg || \'\')); break;\n    default: html = V.renderHome(m);\n  }\n  $main.innerHTML = html;\n  if (html.includes(\'id="factory-title"\') && m.hija) {\n    const $factory = $main.querySelector(\'section.factory\');\n    if ($factory) $factory.insertAdjacentHTML(\'afterend\', renderHija(m.hija));\n  }\n  montarGlobo(m); // mi globo con el gato (BL-091 CD-3); sin el kit, no pasa nada\n  const pending = m.human.length;\n  document.title = `${pending ? `(${pending}) ` : \'\'}${V.verdict(m).text} · Gato Negro Factory`;\n}\n\nfunction guessSection(id) {\n  const p = String(id || \'\').split(\'-\')[0];\n  return p === \'BL\' ? \'trabajo\' : p === \'RSK\' ? \'riesgos\' : p === \'REQ\' || p === \'RESP\' ? \'hoy\' : \'conocimiento\';\n}\n\nasync function refresh(force) {\n  if (state.loading) return;\n  if (force) clearApiCache();\n  state.loading = true;\n  announce(\'Leyendo la memoria de la Factory…\');\n  render();\n  try {\n    const now = Date.now();\n    const [raw, hija] = await Promise.all([loadAll(gh, now), loadHija({ now })]);\n    state.model = buildModel(raw);\n    state.model.hija = buildHija(hija, now);\n    state.error = null;\n    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);\n  } catch (e) {\n    console.error(e);\n    state.error = e;\n    announce(\'No se pudo leer la memoria de la Factory.\');\n  } finally {\n    state.loading = false;\n    render();\n  }\n}\n\nfunction announce(text) { if ($live) $live.textContent = text; }\n\nfunction clearApiCache() {\n  const s = safeStorage();\n  try {\n    Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix + \'api:\')).forEach(k => s.removeItem(k));\n  } catch { /* storage no disponible */ }\n}\n\nfunction safeStorage() {\n  try { localStorage.setItem(\'__t\', \'1\'); localStorage.removeItem(\'__t\'); return localStorage; }\n  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; }\n}\n\nwindow.addEventListener(\'hashchange\', () => {\n  render();\n  window.scrollTo(0, 0);\n  $main.focus({ preventScroll: true });\n});\n// Si Pablo abrió un botón de respuesta (issue prellenado), al volver a la pestaña se relee sin caché:\n// así ve enseguida "Registrando tu respuesta" o "Ya respondiste" (DEC-012).\n$main.addEventListener(\'click\', (e) => {\n  const a = e.target.closest && e.target.closest(\'a[href*="/issues/new?"]\');\n  if (a) state.respondedAt = Date.now();\n});\n// Al volver a la pestaña, relee si respondió hace poco o si los datos tienen más que el TTL de caché.\ndocument.addEventListener(\'visibilitychange\', () => {\n  if (document.visibilityState !== \'visible\' || !state.model) return;\n  if (state.respondedAt && Date.now() - state.respondedAt < 30 * 60 * 1000) { state.respondedAt = null; refresh(true); return; }\n  if (Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);\n});\n\nrefresh(false);\n',
160:    expected: /\$main\.innerHTML = html;\n\s*montarGlobo\(m\);/,
```

## Salida (últimos 60 KB)

```
✔ cache: muchas cargas a lo largo de días no acumulan claves (27.028799ms)
✔ cache: fresco solo con la misma ruta; un árbol de otro commit se vuelve a pedir (0.529237ms)
✔ cache: si la API falla se usa el último dato del casillero (aunque sea de otra ruta) (0.956073ms)
✔ cache: guarda solo lo que usa el panel (3.709397ms)
✔ cache: la ventana de 30 días no cambia dentro del mismo día UTC (0.218878ms)
✔ limpieza: al iniciar borra las claves del formato viejo y nada de otras apps (0.367917ms)
✔ lleno: libera solo su propia caché y reintenta; sin lugar sigue funcionando (0.579481ms)
✔ localStorage real (length/key): storageKeys lo recorre (0.186438ms)
✔ pedidos reales publicados: sin problemas de formato (5.188335ms)
✔ pedido de decisión: opciones y recomendación (0.625816ms)
✔ pedido mal formado: cada problema se explica (1.409127ms)
✔ respuestas: códigos canónicos, sinónimos y validación (1.100612ms)
✔ buildResponseMarkdown: ida y vuelta, y no permite inyectar metadatos (1.317527ms)
✔ ciclo de vida: abierto → respondido → procesado → cerrado (2.0381ms)
✔ posponer: desaparece hasta la fecha y vuelve cuando vence (1.032545ms)
✔ acciones verificadas por medición no esperan respuesta (0.669048ms)
✔ chequeos: espera larga, respuesta sin procesar, huérfana, opción inexistente, README ignorado (133.596612ms)
✔ contrato v3: una DEC PROPUESTA sin pedido es una inconsistencia (solo si ya se usan pedidos) (0.972944ms)
✔ panel: los pedidos encabezan "Necesita tu decisión" y absorben lo que cubren (20.904377ms)
✔ panel: un pedido pospuesto saca de la cola todo lo que cubre (8.348287ms)
✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (540.391125ms)
✔ tokens: todos declarados dentro de :root (salvo la redefinición de movimiento) (3.173828ms)
✔ tokens: sin duplicados (0.394676ms)
✔ tokens: los semánticos de color nunca llevan hex; solo referencian primitivos (o rgba para tintes) (0.40261ms)
✔ tokens: toda referencia var(--gds-*) existe (tokens, componentes, íconos) (0.70261ms)
✔ espaciado: escala exacta 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (0.363527ms)
✔ tipografía: existen los roles headline, title, body, label y caption, en rem (0.474656ms)
✔ componentes: sin hex, rgb/hsl, primitivos ni medidas sueltas (1.234672ms)
✔ accesibilidad: foco visible, salto al contenido y movimiento reducido (0.228356ms)
✔ contraste: todos los pares de uso cumplen WCAG 2.1 AA (1.538559ms)
✔ contraste: la tabla de GDS_FOUNDATION.md coincide con el cálculo (0.880332ms)
✔ íconos: decorativos (aria-hidden) y con color heredado (0.320297ms)
✔ marca: el gato de Gato Negro Factory no cambia (DEC-024 §1) (0.601141ms)
✔ voz de Shiruvana: rótulo visible, ícono y avatar decorativo (0.478172ms)
✔ voz de Shiruvana: avatar oficial liviano y tamaños con tokens (0.573099ms)
✔ foundation: documenta principios, tokens, tipografía, espaciado, componentes y accesibilidad (1.216378ms)
✔ mensaje: con la memoria de prueba dice algo concreto, sin «undefined» (36.132545ms)
✔ mensaje: prioridad — respuesta fallida, riesgo crítico, decisiones, tareas, nada (5.226276ms)
✔ corto: títulos largos en palabra entera con «…»; los cortos, intactos (0.48307ms)
✔ reacción del gato: festeja cuando baja lo pendiente, camina con algo nuevo o crítico (6.542369ms)
✔ montarGlobo: lo crea una vez con su clave, después solo cambia lo que digo; reacciona solo a lecturas nuevas (5.981233ms)
✔ montarGlobo: sin kit, sin modelo o con el kit roto, el panel sigue (devuelve null, no tira) (3.754441ms)
✖ index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo (2.087051ms)
✔ universo.css: con globo, las tarjetas no repiten mi cara; sin kit, quedan como antes (0.381492ms)
✔ config: la hija es Shiruna en su propia organización (2.603364ms)
✔ hijaUrl: raw de su repo, rama main, con parámetro que cambia cada 5 min (0.628953ms)
✔ loadHija: solo raw (sin api.github.com), y nunca lanza (0.826681ms)
✔ lineaHija y estadoHija (0.71877ms)
✔ buildHija: estado, tarea, fase, pendientes e info (3.461915ms)
✔ buildHija: sin status.md dice por qué; sin hija o sin datos, null (0.247943ms)
✔ renderHija: tarjeta con su nombre, todo escapado y link a su memoria (1.231927ms)
✔ app.js: lee a Shiruna junto con la memoria y pone su tarjeta debajo de «La Factory ahora» (1.290076ms)
✔ pipeline completo: snapshot por SHA y presupuesto de 6 llamadas a la API (incluye el canal de respuestas) (33.352972ms)
✔ caché: la segunda lectura no gasta API (9.296695ms)
✔ la memoria real es coherente: sin inconsistencias declaradas (4.414952ms)
✔ producción sin protección se reporta como crítico medido (4.739317ms)
✔ cola de decisión humana: agrupa y no duplica (3.943152ms)
✔ preocupaciones: un riesgo declarado y su medición no se duplican (3.169881ms)
✔ estado, tiempo en ejecución y actividad (6.380507ms)
✔ sin API (cuota agotada): sigue funcionando desde el índice y lo avisa (399.282186ms)
✔ detecta inconsistencias inyectadas (2.841779ms)
✔ codificación corrupta es crítica (6.220902ms)
✔ Hoy: lo que necesita a Pablo va antes que el estado de la Factory (442.12354ms)
✔ veredicto: una frase que dice qué hacer (6.347095ms)
✔ tarjetas: la acción recomendada es el botón principal y va primero (6.03883ms)
✔ lenguaje: los títulos no empiezan con IDs internos; los IDs quedan como referencia secundaria (6.696097ms)
✔ lenguaje: estados en palabras, no en códigos (0.378877ms)
✔ cola: un pendiente propio no se esconde dentro de otro ítem que solo lo cita (3.945006ms)
✔ canal: una respuesta que no se registró se ve en Hoy, en su tarjeta y en Salud (6.579528ms)
✔ canal: recién enviada se muestra como "registrando", no como error (4.754605ms)
✔ canal: ignora PRs e issues sin la marca; si la API falla no rompe (6.842108ms)
✔ accesibilidad: estados con ícono y texto, ids únicos, foco y nombres accesibles (18.211178ms)
✔ accesibilidad: cada vista tiene un h1 y los niveles de título no se saltean (GDS §5) (12.387339ms)
✔ textos: la procedencia de una alerta se dice en palabras, no en códigos (6.02828ms)
✔ accesibilidad: index.html con salto al contenido, región viva e idioma (0.529477ms)
✔ GDS: la aplicación no usa colores sueltos y solo referencia tokens existentes (2.007723ms)
✔ status v2: claves de una línea y secciones (2.469224ms)
✔ status v1 (formato de la inicialización) sigue siendo legible (0.518738ms)
✔ status: resumen de la sesión con viñetas de primer nivel (DEC-024) (0.380951ms)
✔ status ausente devuelve null (nunca un objeto vacío engañoso) (0.138749ms)
✔ backlog: secciones, prioridad, referencias y fecha de cierre (2.416807ms)
✔ riesgos: tabla completa (0.747173ms)
✔ índice: secciones y links (0.495323ms)
✔ entradas: título, metadatos y estado (0.559784ms)
✔ roadmap: fases (0.521944ms)
✔ fechas (0.417789ms)
✔ IDs (0.237382ms)
✔ markdown seguro: escapa HTML y bloquea javascript: (0.89041ms)
✔ la memoria real está en UTF-8 limpio (0.211314ms)
✔ contrato espejo: cuerpo del issue idéntico al texto dorado del canal (3.804805ms)
✔ contrato espejo: archivo de respuesta idéntico al texto dorado y válido para el panel (2.106278ms)
✔ acciones: una acción ofrece Ya lo hice / Posponer / No lo voy a hacer (0.743817ms)
✔ acciones: una decisión con opciones pone primero la recomendada (0.962775ms)
✔ acciones: solo pedidos abiertos se pueden responder (1.599332ms)
✔ URL: issue nuevo en gw2-factory-dev, título acotado y todo codificado (0.814561ms)
✔ panel: cada pedido abierto muestra sus botones de respuesta (47.026457ms)
✔ panel: después de responder, el pedido sale de la cola y aparece en "Ya respondiste" (7.307536ms)
✔ una decisión justificada llega a Pablo con contexto, impacto, motivo y recomendación (36.677761ms)
✔ una decisión sin justificar no llega a Pablo y queda como aviso en Salud (3.977937ms)
✔ con pedidos en uso, una DEC PROPUESTA o una tarea bloqueada "por decisión" sin pedido no llegan a Pablo (2.277977ms)
✔ sin pedidos (memoria v2) se conserva la cola anterior (3.085664ms)
✔ status.md: cada línea declara su clase; Info y "Para tu información" no son pendientes (4.17803ms)
✔ un riesgo que Pablo aceptó pasa a información: sin alarma crítica y con su fecha de revisión (7.080583ms)
✔ Hoy: sin decisiones lo dice claro y separa las tareas (4.136963ms)
✔ splitStatusLine reconoce clases con y sin tilde (0.236121ms)
✔ paleta: colores literales solo en el primer :root y solo como --uv-* (1.90931ms)
✔ referencias: toda var(--uv-*) y var(--gds-*) existe; solo se reasignan colores del GDS que existen (0.740721ms)
✔ contraste: los pares del GDS cumplen WCAG 2.1 AA con la paleta del universo (2.676481ms)
✔ movimiento: con prefers-reduced-motion no hay chispas ni latido (0.229107ms)
✔ index.html: la piel va última y las chispas son decorativas (0.533495ms)
✔ cabecera: «Centro de mando», marca con aro y latido decorativo (0.55814ms)
✔ mesa: 01 · Ahora arriba y dos columnas; lo tuyo a la izquierda, la Factory a la derecha (45.577816ms)
✔ mesa: antetítulos 01 a 06, cada uno una sola vez (8.808655ms)
✔ mesa: tres cifras; «te esperan» es la cantidad de pendientes y el cero va en gris (7.703515ms)
✔ mesa: estilos — dos columnas que se apilan en pantallas chicas, cifras en ámbar (0.96558ms)
✔ vistas: cada una abre con «01 · …», su único h1 y tres o más cifras en ámbar (14.533039ms)
✔ vistas: las cifras dicen lo mismo que la vista (11.15518ms)
✔ vistas: líneas de tiempo con puntos, tablero y niveles con su color (10.155416ms)
✔ resumen: si entra, todo; si no, la primera oración; si es muy larga, cortada en una palabra entera con «…» (0.395938ms)
✔ 04 · La Factory ahora: con textos de miles de caracteres, el resumen arriba y el resto plegado con scroll propio (16.254441ms)
✔ 04 · La Factory ahora: con textos cortos no hay nada plegado (6.677992ms)
✔ celular: etapas en vertical, sin desenfoque por tarjeta, cifras más chicas y puertas sin hover pegado (0.511063ms)
✔ Hoy responde las preguntas de la misión (53.76911ms)
✔ todas las vistas renderizan (25.014763ms)
✔ detalle: links internos entre entradas y "citado por" (5.983747ms)
✔ el contenido de la memoria se escapa en todas las vistas (5.310082ms)
✔ dato faltante se muestra con motivo, nunca vacío (4.793568ms)
✔ caras: cada tipo de mensaje tiene la suya (3.369022ms)
✔ caras: WebP embebido y liviano (0.724842ms)
✔ voz: recomienda, advierte, decide y resume con su rótulo (34.978612ms)
✔ voz: un solo avatar por sección visible (5.666707ms)
✔ voz: tamaños — 56 px en resumen y decisión importante, 48 px en el resto (5.3468ms)
✔ voz: el resumen muestra hasta 3 viñetas de primer nivel (3.415369ms)
✔ voz: solo decisiones de la Factory; las de Pablo no son "Shiruvana decidió" (2.631106ms)
✔ voz: nunca en la cabecera, las métricas ni sin nada que decir (11.773554ms)
ℹ tests 135
ℹ suites 0
ℹ pass 134
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1286.228683

✖ failing tests:

test at tests/globo.test.mjs:123:1
✖ index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo (2.087051ms)
  AssertionError [ERR_ASSERTION]: se monta después de dibujar la vista
      at TestContext.<anonymous> (file:///home/runner/work/gw2-factory-dashboard/gw2-factory-dashboard/tests/globo.test.mjs:132:10)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1047:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:744:18)
      at Test.postRun (node:internal/test_runner/test:1173:19)
      at Test.run (node:internal/test_runner/test:1101:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: '/**\n * js/app.js — Punto de entrada: carga, router por hash y refresco.\n *\n * Accesibilidad (GDS):\n * - Al cambiar de vista, el foco pasa al contenido principal (el lector de pantalla anuncia la vista nueva).\n * - El resultado de cada lectura se anuncia en una región aria-live.\n * - Después de Refrescar, el foco vuelve al botón (el encabezado se vuelve a dibujar).\n * Mi globo con el gato (js/globo.js) se monta después de cada dibujo con lectura.\n * Shiruna (js/hija.js, S-4a): su memoria se lee junto con la mía y su tarjeta va debajo de «La Factory ahora».\n */\n\nimport { CONFIG } from \'./config.js\';\nimport { createGitHub } from \'./github.js\';\nimport { loadAll } from \'./loader.js\';\nimport { buildModel } from \'./model.js\';\nimport * as V from \'./views.js\';\nimport { montarGlobo } from \'./globo.js\';\nimport { loadHija, buildHija, renderHija } from \'./hija.js\';\n\nconst gh = createGitHub({\n  owner: CONFIG.owner,\n  storage: safeStorage(),\n  ttlMs: CONFIG.apiCacheTtlMs,\n  prefix: CONFIG.storagePrefix,\n});\n\nconst state = { model: null, loading: false, error: null, refocusRefresh: false };\nconst $header = document.getElementById(\'app-header\');\nconst $main = document.getElementById(\'app-main\');\nconst $live = document.getElementById(\'app-live\');\n\nfunction parseRoute() {\n  const parts = (location.hash || \'#/hoy\').replace(/^#\\/?/, \'\').split(\'/\').filter(Boolean);\n  return { name: parts[0] || \'hoy\', arg: parts[1] || null };\n}\n\nfunction render() {\n  const r = parseRoute();\n  const navRoute = r.name === \'item\' ? guessSection(r.arg) : r.name;\n  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);\n  const $refresh = document.getElementById(\'btn-refresh\');\n  $refresh.addEventListener(\'click\', () => { state.refocusRefresh = true; refresh(true); });\n  if (state.refocusRefresh && !state.loading) { state.refocusRefresh = false; $refresh.focus(); }\n\n  if (!state.model) {\n    $main.innerHTML = state.error ? V.renderFatal(state.error) : V.renderLoading();\n    return;\n  }\n  const m = state.model;\n  let html;\n  switch (r.name) {\n    case \'trabajo\': html = V.renderWork(m); break;\n    case \'conocimiento\': html = V.renderKnowledge(m, r.arg); break;\n    case \'riesgos\': html = V.renderRisks(m); break;\n    case \'actividad\': html = V.renderActivity(m, r.arg); break;\n    case \'salud\': html = V.renderHealth(m); break;\n    case \'item\': html = V.renderItem(m, decodeURIComponent(r.arg || \'\')); break;\n    default: html = V.renderHome(m);\n  }\n  $main.innerHTML = html;\n  if (html.includes(\'id="factory-title"\') && m.hija) {\n    const $factory = $main.querySelector(\'section.factory\');\n    if ($factory) $factory.insertAdjacentHTML(\'afterend\', renderHija(m.hija));\n  }\n  montarGlobo(m); // mi globo con el gato (BL-091 CD-3); sin el kit, no pasa nada\n  const pending = m.human.length;\n  document.title = `${pending ? `(${pending}) ` : \'\'}${V.verdict(m).text} · Gato Negro Factory`;\n}\n\nfunction guessSection(id) {\n  const p = String(id || \'\').split(\'-\')[0];\n  return p === \'BL\' ? \'trabajo\' : p === \'RSK\' ? \'riesgos\' : p === \'REQ\' || p === \'RESP\' ? \'hoy\' : \'conocimiento\';\n}\n\nasync function refresh(force) {\n  if (state.loading) return;\n  if (force) clearApiCache();\n  state.loading = true;\n  announce(\'Leyendo la memoria de la Factory…\');\n  render();\n  try {\n    const now = Date.now();\n    const [raw, hija] = await Promise.all([loadAll(gh, now), loadHija({ now })]);\n    state.model = buildModel(raw);\n    state.model.hija = buildHija(hija, now);\n    state.error = null;\n    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);\n  } catch (e) {\n    console.error(e);\n    state.error = e;\n    announce(\'No se pudo leer la memoria de la Factory.\');\n  } finally {\n    state.loading = false;\n    render();\n  }\n}\n\nfunction announce(text) { if ($live) $live.textContent = text; }\n\nfunction clearApiCache() {\n  const s = safeStorage();\n  try {\n    Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix + \'api:\')).forEach(k => s.removeItem(k));\n  } catch { /* storage no disponible */ }\n}\n\nfunction safeStorage() {\n  try { localStorage.setItem(\'__t\', \'1\'); localStorage.removeItem(\'__t\'); return localStorage; }\n  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; }\n}\n\nwindow.addEventListener(\'hashchange\', () => {\n  render();\n  window.scrollTo(0, 0);\n  $main.focus({ preventScroll: true });\n});\n// Si Pablo abrió un botón de respuesta (issue prellenado), al volver a la pestaña se relee sin caché:\n// así ve enseguida "Registrando tu respuesta" o "Ya respondiste" (DEC-012).\n$main.addEventListener(\'click\', (e) => {\n  const a = e.target.closest && e.target.closest(\'a[href*="/issues/new?"]\');\n  if (a) state.respondedAt = Date.now();\n});\n// Al volver a la pestaña, relee si respondió hace poco o si los datos tienen más que el TTL de caché.\ndocument.addEventListener(\'visibilitychange\', () => {\n  if (document.visibilityState !== \'visible\' || !state.model) return;\n  if (state.respondedAt && Date.now() - state.respondedAt < 30 * 60 * 1000) { state.respondedAt = null; refresh(true); return; }\n  if (Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);\n});\n\nrefresh(false);\n',
    expected: /\$main\.innerHTML = html;\n\s*montarGlobo\(m\);/,
    operator: 'match',
    diff: 'simple'
  }
```
