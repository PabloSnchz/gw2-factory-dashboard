# CI: FALLA

- Commit verificado: a8c02906f311c1a096f083c77cf75b8f79300ec9
- Fecha: 2026-11-17T04:34Z

## Fallas

```
21:✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (52.783714ms)
59:✖ accesibilidad: index.html con salto al contenido, región viva e idioma (3.41375ms)
122:✖ failing tests:
125:✖ accesibilidad: index.html con salto al contenido, región viva e idioma (3.41375ms)
126:  AssertionError [ERR_ASSERTION]: tokens → componentes → disposición → universo (BL-091)
127:  + actual - expected
146:    actual: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css', 'css/universo.css' ],
147:    expected: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'css/universo.css' ],
```

## Salida (últimos 60 KB)

```
✔ cache: muchas cargas a lo largo de días no acumulan claves (18.001943ms)
✔ cache: fresco solo con la misma ruta; un árbol de otro commit se vuelve a pedir (0.74387ms)
✔ cache: si la API falla se usa el último dato del casillero (aunque sea de otra ruta) (1.297164ms)
✔ cache: guarda solo lo que usa el panel (0.538751ms)
✔ cache: la ventana de 30 días no cambia dentro del mismo día UTC (2.811404ms)
✔ limpieza: al iniciar borra las claves del formato viejo y nada de otras apps (0.230277ms)
✔ lleno: libera solo su propia caché y reintenta; sin lugar sigue funcionando (0.394564ms)
✔ localStorage real (length/key): storageKeys lo recorre (0.180803ms)
✔ pedidos reales publicados: sin problemas de formato (2.39681ms)
✔ pedido de decisión: opciones y recomendación (0.266502ms)
✔ pedido mal formado: cada problema se explica (0.176526ms)
✔ respuestas: códigos canónicos, sinónimos y validación (0.965283ms)
✔ buildResponseMarkdown: ida y vuelta, y no permite inyectar metadatos (0.726414ms)
✔ ciclo de vida: abierto → respondido → procesado → cerrado (0.731792ms)
✔ posponer: desaparece hasta la fecha y vuelve cuando vence (0.352221ms)
✔ acciones verificadas por medición no esperan respuesta (0.187312ms)
✔ chequeos: espera larga, respuesta sin procesar, huérfana, opción inexistente, README ignorado (18.955829ms)
✔ contrato v3: una DEC PROPUESTA sin pedido es una inconsistencia (solo si ya se usan pedidos) (0.634506ms)
✔ panel: los pedidos encabezan "Necesita tu decisión" y absorben lo que cubren (10.691301ms)
✔ panel: un pedido pospuesto saca de la cola todo lo que cubre (3.871041ms)
✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (52.783714ms)
✔ tokens: todos declarados dentro de :root (salvo la redefinición de movimiento) (1.61369ms)
✔ tokens: sin duplicados (0.384679ms)
✔ tokens: los semánticos de color nunca llevan hex; solo referencian primitivos (o rgba para tintes) (0.394484ms)
✔ tokens: toda referencia var(--gds-*) existe (tokens, componentes, íconos) (0.648927ms)
✔ espaciado: escala exacta 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (0.32583ms)
✔ tipografía: existen los roles headline, title, body, label y caption, en rem (0.383387ms)
✔ componentes: sin hex, rgb/hsl, primitivos ni medidas sueltas (1.415702ms)
✔ accesibilidad: foco visible, salto al contenido y movimiento reducido (0.130587ms)
✔ contraste: todos los pares de uso cumplen WCAG 2.1 AA (1.22837ms)
✔ contraste: la tabla de GDS_FOUNDATION.md coincide con el cálculo (1.188611ms)
✔ íconos: decorativos (aria-hidden) y con color heredado (0.34583ms)
✔ marca: el gato de Gato Negro Factory no cambia (DEC-024 §1) (0.682838ms)
✔ voz de Shiruvana: rótulo visible, ícono y avatar decorativo (0.604229ms)
✔ voz de Shiruvana: avatar oficial liviano y tamaños con tokens (0.445291ms)
✔ foundation: documenta principios, tokens, tipografía, espaciado, componentes y accesibilidad (0.659603ms)
✔ pipeline completo: snapshot por SHA y presupuesto de 6 llamadas a la API (incluye el canal de respuestas) (20.734218ms)
✔ caché: la segunda lectura no gasta API (5.686264ms)
✔ la memoria real es coherente: sin inconsistencias declaradas (2.543781ms)
✔ producción sin protección se reporta como crítico medido (2.341637ms)
✔ cola de decisión humana: agrupa y no duplica (3.271237ms)
✔ preocupaciones: un riesgo declarado y su medición no se duplican (2.676441ms)
✔ estado, tiempo en ejecución y actividad (3.968937ms)
✔ sin API (cuota agotada): sigue funcionando desde el índice y lo avisa (12.473987ms)
✔ detecta inconsistencias inyectadas (3.740464ms)
✔ codificación corrupta es crítica (2.567467ms)
✔ Hoy: lo que necesita a Pablo va antes que el estado de la Factory (34.453527ms)
✔ veredicto: una frase que dice qué hacer (5.935459ms)
✔ tarjetas: la acción recomendada es el botón principal y va primero (3.384267ms)
✔ lenguaje: los títulos no empiezan con IDs internos; los IDs quedan como referencia secundaria (3.581043ms)
✔ lenguaje: estados en palabras, no en códigos (0.235735ms)
✔ cola: un pendiente propio no se esconde dentro de otro ítem que solo lo cita (2.110529ms)
✔ canal: una respuesta que no se registró se ve en Hoy, en su tarjeta y en Salud (5.003516ms)
✔ canal: recién enviada se muestra como "registrando", no como error (2.597401ms)
✔ canal: ignora PRs e issues sin la marca; si la API falla no rompe (6.227308ms)
✔ accesibilidad: estados con ícono y texto, ids únicos, foco y nombres accesibles (21.025726ms)
✔ accesibilidad: cada vista tiene un h1 y los niveles de título no se saltean (GDS §5) (10.88181ms)
✔ textos: la procedencia de una alerta se dice en palabras, no en códigos (3.544518ms)
✖ accesibilidad: index.html con salto al contenido, región viva e idioma (3.41375ms)
✔ GDS: la aplicación no usa colores sueltos y solo referencia tokens existentes (1.185014ms)
✔ status v2: claves de una línea y secciones (1.681272ms)
✔ status v1 (formato de la inicialización) sigue siendo legible (0.38504ms)
✔ status: resumen de la sesión con viñetas de primer nivel (DEC-024) (0.282896ms)
✔ status ausente devuelve null (nunca un objeto vacío engañoso) (0.105078ms)
✔ backlog: secciones, prioridad, referencias y fecha de cierre (2.679666ms)
✔ riesgos: tabla completa (0.51773ms)
✔ índice: secciones y links (0.281964ms)
✔ entradas: título, metadatos y estado (0.500323ms)
✔ roadmap: fases (0.443588ms)
✔ fechas (0.413763ms)
✔ IDs (0.213712ms)
✔ markdown seguro: escapa HTML y bloquea javascript: (1.111955ms)
✔ la memoria real está en UTF-8 limpio (0.343337ms)
✔ contrato espejo: cuerpo del issue idéntico al texto dorado del canal (2.180153ms)
✔ contrato espejo: archivo de respuesta idéntico al texto dorado y válido para el panel (1.028079ms)
✔ acciones: una acción ofrece Ya lo hice / Posponer / No lo voy a hacer (0.420694ms)
✔ acciones: una decisión con opciones pone primero la recomendada (0.519642ms)
✔ acciones: solo pedidos abiertos se pueden responder (0.999065ms)
✔ URL: issue nuevo en gw2-factory-dev, título acotado y todo codificado (0.521074ms)
✔ panel: cada pedido abierto muestra sus botones de respuesta (26.481592ms)
✔ panel: después de responder, el pedido sale de la cola y aparece en "Ya respondiste" (4.029078ms)
✔ una decisión justificada llega a Pablo con contexto, impacto, motivo y recomendación (27.957815ms)
✔ una decisión sin justificar no llega a Pablo y queda como aviso en Salud (3.17416ms)
✔ con pedidos en uso, una DEC PROPUESTA o una tarea bloqueada "por decisión" sin pedido no llegan a Pablo (1.878018ms)
✔ sin pedidos (memoria v2) se conserva la cola anterior (2.801439ms)
✔ status.md: cada línea declara su clase; Info y "Para tu información" no son pendientes (3.627804ms)
✔ un riesgo que Pablo aceptó pasa a información: sin alarma crítica y con su fecha de revisión (6.97158ms)
✔ Hoy: sin decisiones lo dice claro y separa las tareas (3.662716ms)
✔ splitStatusLine reconoce clases con y sin tilde (0.146321ms)
✔ paleta: colores literales solo en el primer :root y solo como --uv-* (1.08185ms)
✔ referencias: toda var(--uv-*) y var(--gds-*) existe; solo se reasignan colores del GDS que existen (0.468225ms)
✔ contraste: los pares del GDS cumplen WCAG 2.1 AA con la paleta del universo (2.211301ms)
✔ movimiento: con prefers-reduced-motion no hay chispas ni latido (0.184499ms)
✔ index.html: la piel va última y las chispas son decorativas (0.576138ms)
✔ cabecera: «Centro de mando», marca con aro y latido decorativo (0.35192ms)
✔ mesa: 01 · Ahora arriba y dos columnas; lo tuyo a la izquierda, la Factory a la derecha (22.608334ms)
✔ mesa: antetítulos 01 a 06, cada uno una sola vez (3.276043ms)
✔ mesa: tres cifras; «te esperan» es la cantidad de pendientes y el cero va en gris (3.046468ms)
✔ mesa: estilos — dos columnas que se apilan en pantallas chicas, cifras en ámbar (0.503528ms)
✔ Hoy responde las preguntas de la misión (24.563283ms)
✔ todas las vistas renderizan (8.171417ms)
✔ detalle: links internos entre entradas y "citado por" (2.405603ms)
✔ el contenido de la memoria se escapa en todas las vistas (2.757083ms)
✔ dato faltante se muestra con motivo, nunca vacío (2.095566ms)
✔ caras: cada tipo de mensaje tiene la suya (2.042065ms)
✔ caras: WebP embebido y liviano (0.361173ms)
✔ voz: recomienda, advierte, decide y resume con su rótulo (19.51457ms)
✔ voz: un solo avatar por sección visible (3.274321ms)
✔ voz: tamaños — 56 px en resumen y decisión importante, 48 px en el resto (3.669591ms)
✔ voz: el resumen muestra hasta 3 viñetas de primer nivel (3.548925ms)
✔ voz: solo decisiones de la Factory; las de Pablo no son "Shiruvana decidió" (1.971318ms)
✔ voz: nunca en la cabecera, las métricas ni sin nada que decir (7.126943ms)
ℹ tests 112
ℹ suites 0
ℹ pass 111
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 425.497818

✖ failing tests:

test at tests/panel.test.mjs:182:1
✖ accesibilidad: index.html con salto al contenido, región viva e idioma (3.41375ms)
  AssertionError [ERR_ASSERTION]: tokens → componentes → disposición → universo (BL-091)
  + actual - expected
  
    [
      'gds/tokens.css',
      'gds/components.css',
      'css/app.css',
  +   'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css',
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
    actual: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'https://pablosnchz.github.io/shiruvana/kit/escena-kit.css', 'css/universo.css' ],
    expected: [ 'gds/tokens.css', 'gds/components.css', 'css/app.css', 'css/universo.css' ],
    operator: 'deepStrictEqual',
    diff: 'simple'
  }
```
