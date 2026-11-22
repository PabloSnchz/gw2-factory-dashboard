# CI: FALLA

- Commit verificado: 93d46bd821a85658db7bed605cfd9adad96246b2
- Fecha: 2026-11-22T18:41Z

## Fallas

```
21:✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (44.209632ms)
82:✖ accesibilidad: index.html con salto al contenido, región viva e idioma (2.246805ms)
159:✖ failing tests:
162:✖ accesibilidad: index.html con salto al contenido, región viva e idioma (2.246805ms)
163:  AssertionError [ERR_ASSERTION]: tokens → componentes → disposición → kit de Shiruvana → universo (BL-091)
164:  + actual - expected
184:    actual: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css', 'css/hija.css', 'css/universo.css' ],
185:    expected: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css', 'css/universo.css' ],
```

## Salida (últimos 60 KB)

```
✔ cache: muchas cargas a lo largo de días no acumulan claves (21.749674ms)
✔ cache: fresco solo con la misma ruta; un árbol de otro commit se vuelve a pedir (0.487866ms)
✔ cache: si la API falla se usa el último dato del casillero (aunque sea de otra ruta) (0.772382ms)
✔ cache: guarda solo lo que usa el panel (0.437031ms)
✔ cache: la ventana de 30 días no cambia dentro del mismo día UTC (0.169743ms)
✔ limpieza: al iniciar borra las claves del formato viejo y nada de otras apps (0.337384ms)
✔ lleno: libera solo su propia caché y reintenta; sin lugar sigue funcionando (0.582434ms)
✔ localStorage real (length/key): storageKeys lo recorre (0.183743ms)
✔ pedidos reales publicados: sin problemas de formato (4.494161ms)
✔ pedido de decisión: opciones y recomendación (1.476646ms)
✔ pedido mal formado: cada problema se explica (0.399488ms)
✔ respuestas: códigos canónicos, sinónimos y validación (0.921598ms)
✔ buildResponseMarkdown: ida y vuelta, y no permite inyectar metadatos (1.258687ms)
✔ ciclo de vida: abierto → respondido → procesado → cerrado (1.920524ms)
✔ posponer: desaparece hasta la fecha y vuelve cuando vence (0.8663ms)
✔ acciones verificadas por medición no esperan respuesta (0.542296ms)
✔ chequeos: espera larga, respuesta sin procesar, huérfana, opción inexistente, README ignorado (19.032673ms)
✔ contrato v3: una DEC PROPUESTA sin pedido es una inconsistencia (solo si ya se usan pedidos) (0.639415ms)
✔ panel: los pedidos encabezan "Necesita tu decisión" y absorben lo que cubren (12.951951ms)
✔ panel: un pedido pospuesto saca de la cola todo lo que cubre (4.916134ms)
✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (44.209632ms)
✔ tokens: todos declarados dentro de :root (salvo la redefinición de movimiento) (2.17691ms)
✔ tokens: sin duplicados (0.507063ms)
✔ tokens: los semánticos de color nunca llevan hex; solo referencian primitivos (o rgba para tintes) (0.535735ms)
✔ tokens: toda referencia var(--gds-*) existe (tokens, componentes, íconos) (0.958419ms)
✔ espaciado: escala exacta 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (0.482325ms)
✔ tipografía: existen los roles headline, title, body, label y caption, en rem (0.577827ms)
✔ componentes: sin hex, rgb/hsl, primitivos ni medidas sueltas (1.668462ms)
✔ accesibilidad: foco visible, salto al contenido y movimiento reducido (0.296088ms)
✔ contraste: todos los pares de uso cumplen WCAG 2.1 AA (2.136869ms)
✔ contraste: la tabla de GDS_FOUNDATION.md coincide con el cálculo (1.304255ms)
✔ íconos: decorativos (aria-hidden) y con color heredado (0.440907ms)
✔ marca: el gato de Gato Negro Factory no cambia (DEC-024 §1) (0.735028ms)
✔ voz de Shiruvana: rótulo visible, ícono y avatar decorativo (0.735615ms)
✔ voz de Shiruvana: avatar oficial liviano y tamaños con tokens (0.607569ms)
✔ foundation: documenta principios, tokens, tipografía, espaciado, componentes y accesibilidad (1.120882ms)
✔ mensaje: con la memoria de prueba dice algo concreto, sin «undefined» (22.80291ms)
✔ mensaje: prioridad — respuesta fallida, riesgo crítico, decisiones, tareas, nada (7.565862ms)
✔ corto: títulos largos en palabra entera con «…»; los cortos, intactos (0.623172ms)
✔ reacción del gato: festeja cuando baja lo pendiente, camina con algo nuevo o crítico (5.433125ms)
✔ montarGlobo: lo crea una vez con su clave, después solo cambia lo que digo; reacciona solo a lecturas nuevas (5.619154ms)
✔ montarGlobo: sin kit, sin modelo o con el kit roto, el panel sigue (devuelve null, no tira) (3.819767ms)
✔ index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo (0.489479ms)
✔ universo.css: con globo, las tarjetas no repiten mi cara; sin kit, quedan como antes (0.540723ms)
✔ Hoy con Shiruna: filtro, su tarjeta debajo de la mía y lo que pide en «Te toca» (52.626946ms)
✔ sin Shiruna (o sin leerla) Hoy queda como antes; la cabecera y el veredicto cuentan lo de las dos (10.898488ms)
✔ con Shiruna, ninguna vista muestra undefined ni NaN (4.493677ms)
✔ versión y config: la hija es Shiruna en su propia organización (2.036994ms)
✔ hijaUrl: raw de su repo, rama main, con parámetro que cambia cada 5 min (0.563306ms)
✔ loadHija: solo raw (sin api.github.com), y nunca lanza (0.692408ms)
✔ lineaHija y estadoHija (0.63854ms)
✔ buildHija: estado, tarea, fase, pendientes e info (3.174879ms)
✔ buildHija: sin status.md dice por qué; sin hija o sin datos, null (0.225023ms)
✔ unirHija: sus pendientes entran en mi cola por clase, con su nombre y sin ID mío (1.043148ms)
✔ unirHija: sin hija o sin leer, mi modelo no cambia (y la hija queda para su tarjeta) (0.56553ms)
✔ renderHija: tarjeta con su nombre y dueña, sin repetir la lista, escapada y con link a su memoria (2.124733ms)
✔ renderFiltro: Las dos · Shiruvana · Shiruna, arranca en Las dos (1.179096ms)
✔ aplicarFiltro: oculta lo de la otra, marca el botón y vuelve a Las dos (0.663187ms)
✔ app.js: lee a Shiruna junto con mi memoria, la une al modelo y vuelve a aplicar el filtro en cada dibujo (0.559206ms)
✔ pipeline completo: snapshot por SHA y presupuesto de 6 llamadas a la API (incluye el canal de respuestas) (30.604464ms)
✔ caché: la segunda lectura no gasta API (7.873654ms)
✔ la memoria real es coherente: sin inconsistencias declaradas (3.691266ms)
✔ producción sin protección se reporta como crítico medido (3.809914ms)
✔ cola de decisión humana: agrupa y no duplica (2.371421ms)
✔ preocupaciones: un riesgo declarado y su medición no se duplican (2.714267ms)
✔ estado, tiempo en ejecución y actividad (6.493802ms)
✔ sin API (cuota agotada): sigue funcionando desde el índice y lo avisa (20.59073ms)
✔ detecta inconsistencias inyectadas (3.112493ms)
✔ codificación corrupta es crítica (6.004407ms)
✔ Hoy: lo que necesita a Pablo va antes que el estado de la Factory (52.147435ms)
✔ veredicto: una frase que dice qué hacer (5.654199ms)
✔ tarjetas: la acción recomendada es el botón principal y va primero (5.290012ms)
✔ lenguaje: los títulos no empiezan con IDs internos; los IDs quedan como referencia secundaria (6.147228ms)
✔ lenguaje: estados en palabras, no en códigos (0.362291ms)
✔ cola: un pendiente propio no se esconde dentro de otro ítem que solo lo cita (3.444584ms)
✔ canal: una respuesta que no se registró se ve en Hoy, en su tarjeta y en Salud (6.478149ms)
✔ canal: recién enviada se muestra como "registrando", no como error (8.553223ms)
✔ canal: ignora PRs e issues sin la marca; si la API falla no rompe (6.392608ms)
✔ accesibilidad: estados con ícono y texto, ids únicos, foco y nombres accesibles (14.737925ms)
✔ accesibilidad: cada vista tiene un h1 y los niveles de título no se saltean (GDS §5) (10.738964ms)
✔ textos: la procedencia de una alerta se dice en palabras, no en códigos (3.622212ms)
✖ accesibilidad: index.html con salto al contenido, región viva e idioma (2.246805ms)
✔ GDS: la aplicación no usa colores sueltos y solo referencia tokens existentes (1.402188ms)
✔ status v2: claves de una línea y secciones (3.272876ms)
✔ status v1 (formato de la inicialización) sigue siendo legible (0.676247ms)
✔ status: resumen de la sesión con viñetas de primer nivel (DEC-024) (0.458857ms)
✔ status ausente devuelve null (nunca un objeto vacío engañoso) (0.189208ms)
✔ backlog: secciones, prioridad, referencias y fecha de cierre (3.33293ms)
✔ riesgos: tabla completa (1.198064ms)
✔ índice: secciones y links (0.643715ms)
✔ entradas: título, metadatos y estado (0.788403ms)
✔ roadmap: fases (0.730318ms)
✔ fechas (0.548218ms)
✔ IDs (0.333524ms)
✔ markdown seguro: escapa HTML y bloquea javascript: (1.175858ms)
✔ la memoria real está en UTF-8 limpio (0.27038ms)
✔ versión y poses (1.948583ms)
✔ poseHija: cada estado con su pose, en orden de prioridad (2.811745ms)
✔ marcarLogro: la primera vez solo guarda; festeja cuando sube; nunca lanza (2.879447ms)
✔ vestirHija: pose en su tarjeta, su cara en lo que pide, una sola vez aunque se dibuje de nuevo (0.785124ms)
✔ css/hija.css: una imagen por pose, sin colores literales, antes de la piel y quieta con movimiento reducido (1.280982ms)
✔ assets/shiruna: si ya están subidas, son las 7 webp (una por pose + la cara) (0.239544ms)
✔ app.js: marca el logro en cada lectura y la viste después de cada dibujo (0.427906ms)
✔ contrato espejo: cuerpo del issue idéntico al texto dorado del canal (2.868685ms)
✔ contrato espejo: archivo de respuesta idéntico al texto dorado y válido para el panel (1.800899ms)
✔ acciones: una acción ofrece Ya lo hice / Posponer / No lo voy a hacer (0.599235ms)
✔ acciones: una decisión con opciones pone primero la recomendada (1.57274ms)
✔ acciones: solo pedidos abiertos se pueden responder (0.405928ms)
✔ URL: issue nuevo en gw2-factory-dev, título acotado y todo codificado (0.583761ms)
✔ panel: cada pedido abierto muestra sus botones de respuesta (29.426258ms)
✔ panel: después de responder, el pedido sale de la cola y aparece en "Ya respondiste" (4.858871ms)
✔ una decisión justificada llega a Pablo con contexto, impacto, motivo y recomendación (49.399594ms)
✔ una decisión sin justificar no llega a Pablo y queda como aviso en Salud (5.356114ms)
✔ con pedidos en uso, una DEC PROPUESTA o una tarea bloqueada "por decisión" sin pedido no llegan a Pablo (3.510403ms)
✔ sin pedidos (memoria v2) se conserva la cola anterior (4.590167ms)
✔ status.md: cada línea declara su clase; Info y "Para tu información" no son pendientes (8.630611ms)
✔ un riesgo que Pablo aceptó pasa a información: sin alarma crítica y con su fecha de revisión (9.072869ms)
✔ Hoy: sin decisiones lo dice claro y separa las tareas (7.161702ms)
✔ splitStatusLine reconoce clases con y sin tilde (0.485835ms)
✔ paleta: colores literales solo en el primer :root y solo como --uv-* (3.487605ms)
✔ referencias: toda var(--uv-*) y var(--gds-*) existe; solo se reasignan colores del GDS que existen (1.068258ms)
✔ contraste: los pares del GDS cumplen WCAG 2.1 AA con la paleta del universo (2.614743ms)
✔ movimiento: con prefers-reduced-motion no hay chispas ni latido (0.315168ms)
✔ index.html: la piel va última y las chispas son decorativas (0.724343ms)
✔ cabecera: «Centro de mando», marca con aro y latido decorativo (0.635074ms)
✔ mesa: 01 · Ahora arriba y dos columnas; lo tuyo a la izquierda, la Factory a la derecha (46.926141ms)
✔ mesa: antetítulos 01 a 06, cada uno una sola vez (11.580785ms)
✔ mesa: tres cifras; «te esperan» es la cantidad de pendientes y el cero va en gris (6.637671ms)
✔ mesa: estilos — dos columnas que se apilan en pantallas chicas, cifras en ámbar (0.891484ms)
✔ vistas: cada una abre con «01 · …», su único h1 y tres o más cifras en ámbar (14.087517ms)
✔ vistas: las cifras dicen lo mismo que la vista (8.802939ms)
✔ vistas: líneas de tiempo con puntos, tablero y niveles con su color (8.121018ms)
✔ resumen: si entra, todo; si no, la primera oración; si es muy larga, cortada en una palabra entera con «…» (0.504646ms)
✔ 04 · La Factory ahora: con textos de miles de caracteres, el resumen arriba y el resto plegado con scroll propio (8.964929ms)
✔ 04 · La Factory ahora: con textos cortos no hay nada plegado (5.554144ms)
✔ celular: etapas en vertical, sin desenfoque por tarjeta, cifras más chicas y puertas sin hover pegado (0.456164ms)
✔ Hoy responde las preguntas de la misión (47.099427ms)
✔ todas las vistas renderizan (23.074496ms)
✔ detalle: links internos entre entradas y "citado por" (5.616326ms)
✔ el contenido de la memoria se escapa en todas las vistas (6.8877ms)
✔ dato faltante se muestra con motivo, nunca vacío (5.522827ms)
✔ caras: cada tipo de mensaje tiene la suya (3.044448ms)
✔ caras: WebP embebido y liviano (0.593644ms)
✔ voz: recomienda, advierte, decide y resume con su rótulo (29.66828ms)
✔ voz: un solo avatar por sección visible (5.068552ms)
✔ voz: tamaños — 56 px en resumen y decisión importante, 48 px en el resto (4.594058ms)
✔ voz: el resumen muestra hasta 3 viñetas de primer nivel (3.12809ms)
✔ voz: solo decisiones de la Factory; las de Pablo no son "Shiruvana decidió" (2.4842ms)
✔ voz: nunca en la cabecera, las métricas ni sin nada que decir (9.511725ms)
ℹ tests 149
ℹ suites 0
ℹ pass 148
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 807.915391

✖ failing tests:

test at tests/panel.test.mjs:182:1
✖ accesibilidad: index.html con salto al contenido, región viva e idioma (2.246805ms)
  AssertionError [ERR_ASSERTION]: tokens → componentes → disposición → kit de Shiruvana → universo (BL-091)
  + actual - expected
  
    [
      'gds/tokens.css',
      'gds/components.css',
      'css/app.css',
      'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css',
  +   'css/hija.css',
      'css/universo.css'
    ]
  
      at TestContext.<anonymous> (file:///home/runner/work/gw2-factory-dashboard/gw2-factory-dashboard/tests/panel.test.mjs:190:10)
      at Test.runInAsyncScope (node:async_hooks:214:14)
      at Test.run (node:internal/test_runner/test:1047:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:744:18)
      at Test.postRun (node:internal/test_runner/test:1173:19)
      at Test.run (node:internal/test_runner/test:1101:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css', 'css/hija.css', 'css/universo.css' ],
    expected: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css', 'css/universo.css' ],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }
```
