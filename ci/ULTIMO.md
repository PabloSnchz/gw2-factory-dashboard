# CI: FALLA

- Commit: 31f0093c96cdd03d135edbddbbd5fc3331e78f9e
- Fecha: 2026-11-17T04:03Z

## Fallas

```
21:✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (68.988476ms)
108:✖ voz: nunca en la cabecera, las métricas ni sin nada que decir (3.037931ms)
118:✖ failing tests:
121:✖ voz: nunca en la cabecera, las métricas ni sin nada que decir (3.037931ms)
122:  AssertionError [ERR_ASSERTION]: la marca sigue en la cabecera
128:    actual: false,
129:    expected: true,
```

## Salida (últimos 60 KB)

```
✔ cache: muchas cargas a lo largo de días no acumulan claves (16.197155ms)
✔ cache: fresco solo con la misma ruta; un árbol de otro commit se vuelve a pedir (0.349119ms)
✔ cache: si la API falla se usa el último dato del casillero (aunque sea de otra ruta) (0.478104ms)
✔ cache: guarda solo lo que usa el panel (0.388178ms)
✔ cache: la ventana de 30 días no cambia dentro del mismo día UTC (0.128615ms)
✔ limpieza: al iniciar borra las claves del formato viejo y nada de otras apps (0.225552ms)
✔ lleno: libera solo su propia caché y reintenta; sin lugar sigue funcionando (0.352725ms)
✔ localStorage real (length/key): storageKeys lo recorre (0.179802ms)
✔ pedidos reales publicados: sin problemas de formato (2.931951ms)
✔ pedido de decisión: opciones y recomendación (0.37603ms)
✔ pedido mal formado: cada problema se explica (0.268867ms)
✔ respuestas: códigos canónicos, sinónimos y validación (1.302893ms)
✔ buildResponseMarkdown: ida y vuelta, y no permite inyectar metadatos (0.890028ms)
✔ ciclo de vida: abierto → respondido → procesado → cerrado (1.157523ms)
✔ posponer: desaparece hasta la fecha y vuelve cuando vence (0.581971ms)
✔ acciones verificadas por medición no esperan respuesta (0.33702ms)
✔ chequeos: espera larga, respuesta sin procesar, huérfana, opción inexistente, README ignorado (22.600655ms)
✔ contrato v3: una DEC PROPUESTA sin pedido es una inconsistencia (solo si ya se usan pedidos) (0.643905ms)
✔ panel: los pedidos encabezan "Necesita tu decisión" y absorben lo que cubren (8.229034ms)
✔ panel: un pedido pospuesto saca de la cola todo lo que cubre (3.324735ms)
✔ panel: las vistas actuales muestran pedidos y respuestas sin romperse (68.988476ms)
✔ tokens: todos declarados dentro de :root (salvo la redefinición de movimiento) (0.995398ms)
✔ tokens: sin duplicados (0.248556ms)
✔ tokens: los semánticos de color nunca llevan hex; solo referencian primitivos (o rgba para tintes) (0.24464ms)
✔ tokens: toda referencia var(--gds-*) existe (tokens, componentes, íconos) (0.393135ms)
✔ espaciado: escala exacta 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (0.208877ms)
✔ tipografía: existen los roles headline, title, body, label y caption, en rem (0.298863ms)
✔ componentes: sin hex, rgb/hsl, primitivos ni medidas sueltas (0.910189ms)
✔ accesibilidad: foco visible, salto al contenido y movimiento reducido (0.140062ms)
✔ contraste: todos los pares de uso cumplen WCAG 2.1 AA (0.880934ms)
✔ contraste: la tabla de GDS_FOUNDATION.md coincide con el cálculo (0.569773ms)
✔ íconos: decorativos (aria-hidden) y con color heredado (0.244039ms)
✔ marca: el gato de Gato Negro Factory no cambia (DEC-024 §1) (0.406876ms)
✔ voz de Shiruvana: rótulo visible, ícono y avatar decorativo (0.308458ms)
✔ voz de Shiruvana: avatar oficial liviano y tamaños con tokens (0.280715ms)
✔ foundation: documenta principios, tokens, tipografía, espaciado, componentes y accesibilidad (0.539467ms)
✔ pipeline completo: snapshot por SHA y presupuesto de 6 llamadas a la API (incluye el canal de respuestas) (12.224995ms)
✔ caché: la segunda lectura no gasta API (3.285045ms)
✔ la memoria real es coherente: sin inconsistencias declaradas (1.493632ms)
✔ producción sin protección se reporta como crítico medido (1.496236ms)
✔ cola de decisión humana: agrupa y no duplica (1.532571ms)
✔ preocupaciones: un riesgo declarado y su medición no se duplican (1.005683ms)
✔ estado, tiempo en ejecución y actividad (3.230472ms)
✔ sin API (cuota agotada): sigue funcionando desde el índice y lo avisa (19.474265ms)
✔ detecta inconsistencias inyectadas (2.42962ms)
✔ codificación corrupta es crítica (5.522965ms)
✔ Hoy: lo que necesita a Pablo va antes que el estado de la Factory (40.410113ms)
✔ veredicto: una frase que dice qué hacer (5.692592ms)
✔ tarjetas: la acción recomendada es el botón principal y va primero (3.457236ms)
✔ lenguaje: los títulos no empiezan con IDs internos; los IDs quedan como referencia secundaria (4.45717ms)
✔ lenguaje: estados en palabras, no en códigos (0.305573ms)
✔ cola: un pendiente propio no se esconde dentro de otro ítem que solo lo cita (2.220523ms)
✔ canal: una respuesta que no se registró se ve en Hoy, en su tarjeta y en Salud (3.827216ms)
✔ canal: recién enviada se muestra como "registrando", no como error (6.197997ms)
✔ canal: ignora PRs e issues sin la marca; si la API falla no rompe (5.413759ms)
✔ accesibilidad: estados con ícono y texto, ids únicos, foco y nombres accesibles (10.959523ms)
✔ accesibilidad: cada vista tiene un h1 y los niveles de título no se saltean (GDS §5) (4.772087ms)
✔ textos: la procedencia de una alerta se dice en palabras, no en códigos (2.711167ms)
✔ accesibilidad: index.html con salto al contenido, región viva e idioma (0.305082ms)
✔ GDS: la aplicación no usa colores sueltos y solo referencia tokens existentes (0.797889ms)
✔ status v2: claves de una línea y secciones (2.352893ms)
✔ status v1 (formato de la inicialización) sigue siendo legible (0.540549ms)
✔ status: resumen de la sesión con viñetas de primer nivel (DEC-024) (0.31733ms)
✔ status ausente devuelve null (nunca un objeto vacío engañoso) (0.099752ms)
✔ backlog: secciones, prioridad, referencias y fecha de cierre (2.386835ms)
✔ riesgos: tabla completa (0.693691ms)
✔ índice: secciones y links (0.417212ms)
✔ entradas: título, metadatos y estado (0.506938ms)
✔ roadmap: fases (0.455039ms)
✔ fechas (0.357581ms)
✔ IDs (0.20484ms)
✔ markdown seguro: escapa HTML y bloquea javascript: (0.776316ms)
✔ la memoria real está en UTF-8 limpio (0.192031ms)
✔ contrato espejo: cuerpo del issue idéntico al texto dorado del canal (2.519997ms)
✔ contrato espejo: archivo de respuesta idéntico al texto dorado y válido para el panel (1.311997ms)
✔ acciones: una acción ofrece Ya lo hice / Posponer / No lo voy a hacer (0.614711ms)
✔ acciones: una decisión con opciones pone primero la recomendada (0.496793ms)
✔ acciones: solo pedidos abiertos se pueden responder (1.14242ms)
✔ URL: issue nuevo en gw2-factory-dev, título acotado y todo codificado (0.542211ms)
✔ panel: cada pedido abierto muestra sus botones de respuesta (26.572195ms)
✔ panel: después de responder, el pedido sale de la cola y aparece en "Ya respondiste" (4.525444ms)
✔ una decisión justificada llega a Pablo con contexto, impacto, motivo y recomendación (23.198134ms)
✔ una decisión sin justificar no llega a Pablo y queda como aviso en Salud (3.24405ms)
✔ con pedidos en uso, una DEC PROPUESTA o una tarea bloqueada "por decisión" sin pedido no llegan a Pablo (1.962683ms)
✔ sin pedidos (memoria v2) se conserva la cola anterior (2.81927ms)
✔ status.md: cada línea declara su clase; Info y "Para tu información" no son pendientes (3.769288ms)
✔ un riesgo que Pablo aceptó pasa a información: sin alarma crítica y con su fecha de revisión (5.541023ms)
✔ Hoy: sin decisiones lo dice claro y separa las tareas (5.108177ms)
✔ splitStatusLine reconoce clases con y sin tilde (0.273795ms)
✔ paleta: colores literales solo en el primer :root y solo como --uv-* (1.481453ms)
✔ referencias: toda var(--uv-*) y var(--gds-*) existe; solo se reasignan colores del GDS que existen (0.617585ms)
✔ contraste: los pares del GDS cumplen WCAG 2.1 AA con la paleta del universo (2.434487ms)
✔ movimiento: con prefers-reduced-motion no hay chispas ni latido (0.225232ms)
✔ index.html: la piel va última y las chispas son decorativas (0.428739ms)
✔ cabecera: «Centro de mando», marca con aro y latido decorativo (0.359294ms)
✔ Hoy responde las preguntas de la misión (22.5183ms)
✔ todas las vistas renderizan (9.760403ms)
✔ detalle: links internos entre entradas y "citado por" (2.730806ms)
✔ el contenido de la memoria se escapa en todas las vistas (3.891634ms)
✔ dato faltante se muestra con motivo, nunca vacío (2.141563ms)
✔ caras: cada tipo de mensaje tiene la suya (1.72948ms)
✔ caras: WebP embebido y liviano (0.348788ms)
✔ voz: recomienda, advierte, decide y resume con su rótulo (21.621106ms)
✔ voz: un solo avatar por sección visible (3.486891ms)
✔ voz: tamaños — 56 px en resumen y decisión importante, 48 px en el resto (3.176982ms)
✔ voz: el resumen muestra hasta 3 viñetas de primer nivel (2.285352ms)
✔ voz: solo decisiones de la Factory; las de Pablo no son "Shiruvana decidió" (1.445619ms)
✖ voz: nunca en la cabecera, las métricas ni sin nada que decir (3.037931ms)
ℹ tests 108
ℹ suites 0
ℹ pass 107
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 410.39567

✖ failing tests:

test at tests/voice.test.mjs:115:1
✖ voz: nunca en la cabecera, las métricas ni sin nada que decir (3.037931ms)
  AssertionError [ERR_ASSERTION]: la marca sigue en la cabecera
      at TestContext.<anonymous> (file:///home/runner/work/gw2-factory-dashboard/gw2-factory-dashboard/tests/voice.test.mjs:118:10)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: '==',
    diff: 'simple'
  }
```
