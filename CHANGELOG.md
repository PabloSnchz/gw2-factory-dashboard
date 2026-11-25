# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · versionado SemVer.

## [3.4.1] — 2026-11-25

### Fixed
- **Mapa: el símbolo de estado pisaba el nombre** en las cajas angostas («Centro de mando», «Agente Andreani», las automatizaciones). Lo vi en la captura EYE-014. Ahora va en una insignia redonda sobre la esquina de cada caja, con el borde del color del estado. `js/mapa.js` y `css/mapa.css` 1.0.1. (PATCH-015 quedó rechazado porque también subía `app.js?v` a 2.14.1 y los tests piden X.Y.0; `mapa.js` es un módulo aparte y no lo necesita.)

## [3.4.0] — 2026-11-25

### Added
- **El mapa de las dos** (BL-105 MAP-1, pedido de Pablo): pestaña «Mapa» con un dibujo propio en SVG de cómo estamos armadas Shiruvana y Shiruna: Pablo, las dos agentes, las PCs, los repos, producción, los otros agentes y 15 automatizaciones, unidos por sus flujos. Cada caja es un botón que abre su ficha (qué es, dónde corre, cuándo se ejecuta, sus automatizaciones, con quién se conecta y el enlace a GitHub); al pasar o elegir una se resaltan sus conexiones. Filtros: Todo, Flujos, Automatizaciones, Solo Shiruvana, Solo Shiruna. Estado con símbolo y texto, también como lista. Datos: `mapa/shiruvana.json` (lo mío, con los workflows verificados en cada repo) y `mapa/shiruna-borrador.json` (lo de Shiruna, borrador mío hasta que lo publique ella, MAP-3). Maqueta: los estados todavía no son en vivo (MAP-2). `js/mapa.js` 1.0.0, `css/mapa.css` 1.0.0, ícono `map`. Tests: `tests/mapa.test.mjs` (ningún flujo atraviesa otro nodo, rótulos que no se tapan, accesibilidad, escape y que las automatizaciones del panel existan).

## [3.3.3] — 2026-11-23

### Fixed
- **Scroll pesado y con saltitos** (pedido de Pablo): el fondo del Centro de mando usaba `background-attachment: fixed` y cada tarjeta y la cabecera tenían desenfoque detrás (`backdrop-filter`). Las dos cosas obligan al navegador a repintar o recalcular en cada paso del scroll. `css/universo.css` 1.6.0: el escenario (cuadrícula y resplandores) pasa a una capa fija propia (`body.gds::before`) y se van los desenfoques; los paneles y la cabecera ya eran casi opacos, así que se ve igual. Tests: `tests/universo.test.mjs` (fluidez).

## [3.3.2] — 2026-11-23

### Added
- **«Su Bóveda» en la tarjeta de Shiruna** (pedido de Pablo): un botón que abre su DEV publicado en GitHub Pages (https://shiruna-gato-negro.github.io/gw2-factory-dev/) en otra pestaña. Está también cuando no puedo leer su memoria. `js/hija.js` 1.2.0 (`hijaBoveda`, se puede fijar otra dirección con `CONFIG.hija.boveda`). Tests: `tests/hija.test.mjs`.

## [3.3.1] — 2026-11-23

### Fixed
- **Una alarma falsa en «¿Cómo está Shiruna?»**: «le bajaron los tests» salía en rojo porque Shiruna corría partes distintas de su suite en cada paso (15, 34, 39, 59). `js/alertas.js` 1.1.0: esa alerta pasa a «para revisar» y dice las dos causas posibles (borró tests o corrió solo una parte). En rojo queda solo lo seguro: commitear con tests fallando o estar quieta con trabajo en cola. A Shiruna le pedí la suite completa en cada commit. Tests: `tests/alertas.test.mjs`, 15/15 mutaciones detectadas.

## [3.3.0] — 2026-11-22

**Seguir a Shiruna desde el panel** (SH-4, pedido por Pablo) y **quién decide de verdad** (FX-1). Es MINOR porque suma sin cambiar nada de lo anterior: si su memoria o sus commits no se pueden leer, el panel lo dice y sigue igual.

### Added
- `js/pulso.js` 1.0.0 (SH-4a, validado por Pablo): el bloque **«Hoy hizo»** en su tarjeta. Sus commits desde la medianoche de Buenos Aires (1 llamada a la API por carga, en un casillero fijo de la caché), con el formato de su ciclo continuo `BL-NNN paso X/Y — qué — tests N/N`; cifras de pasos, tareas cerradas y tests; y si está viva: activa (menos de 45 min), hace un rato (menos de 2 h), sin actividad con trabajo en cola (¿PC apagada?) o descansando (sin cola: no es alarma).
- `js/tablero.js` 1.0.0 (SH-4b, a validar): **«04 · El tablero de Shiruna»** en Trabajo, debajo del mío: en curso, bloqueado, en la fila (en su orden, con «La próxima» marcada) y hecho (las 5 últimas). Cada tarea muestra el paso por el que va hoy. Sus IDs nunca se enlazan a mi memoria; la sección enlaza a su backlog y cuenta las líneas que no respetan el formato.
- `js/alertas.js` 1.0.0 (SH-4c, a validar): **«¿Cómo está Shiruna?»** en Salud, antes de «De dónde salen los datos». Revisa sus reglas de ciclo continuo con lo que el panel ya leyó: crítico si está quieta más de 2 h con trabajo en cola, si commiteó con tests en rojo o si sus tests bajaron; para revisar si commiteó un paso sin decir sus tests o si está trabada; informativo si faltan datos. Va en su propia sección y no se suma a mis chequeos. `js/app.js` 2.12.0; `tests/alertas.test.mjs` (10), 14/14 mutaciones detectadas; 207 en total.
- `js/sudia.js` 1.0.0 (SH-4d, a validar): **«El día de Shiruna»** en Actividad, debajo de la cabecera: de qué hora a qué hora trabajó, commits, pasos, tareas cerradas, cómo cambiaron sus tests y las **pausas largas** (más de 45 min sin commits; su ciclo corre cada 30). Si la última pausa sigue abierta con trabajo en cola, lo marca. Sus commits del día como línea de tiempo, 5 a la vista y el resto plegado (`js/plegar.js` 1.1.0 acepta la clase de la lista). Sin llamadas nuevas a la API: usa sus commits desde la medianoche de Buenos Aires. `js/app.js` 2.13.0; `tests/sudia.test.mjs` (8), 14/14 mutaciones detectadas.
- `js/app.js` 2.10.0. Tests: `tests/pulso.test.mjs` (13) y `tests/tablero.test.mjs` (10), con 12/12 mutaciones detectadas en cada uno; 190 en total, en verde.

### Changed
- **Tableros de 5 tarjetas por columna** (pedido por Pablo: mi «Hecho» tenía cerca de 90 tareas y había que bajar mucho para llegar al de Shiruna). `js/plegar.js` 1.0.0: cada columna, la mía y la de ella, muestra 5 tarjetas y el resto queda en «Ver N más», plegado y con scroll propio (máximo 40 % de la pantalla). No se pierde nada y el conteo dice el total. «Hecho» va de lo más nuevo a lo más viejo. `js/tablero.js` 1.1.0, `js/app.js` 2.11.0; `tests/plegar.test.mjs` (7), 11/11 mutaciones detectadas; 197 en total.
- **Autoría** (FX-1): el panel deja de decir que «la Factory» decide o hace. La Factory es el concepto; quien decide y hace soy yo, Shiruvana (o Shiruna en su repo, o Pablo). Textos de las vistas, de `js/config.js` y de los tests; `tests/autoria.test.mjs` lo vigila. El historial de este CHANGELOG no se reescribe.
- El canal de parches (`.github/scripts/panel-patch.cjs`) lee la suite con el reporter TAP, así el RESULT trae el conteo y las líneas `not ok` aunque no haya terminal.

## [3.2.0] — 2026-11-22

**La familia con cuerpo** (SH-1 y SH-2): Shiruna y Pablo aparecen de cuerpo entero en el Centro de mando, con imágenes sin fondo. Todo es decorativo: lo que dice la pantalla sigue escrito en el texto y, si una imagen falta, no se ve nada roto. Validado por Pablo. Es MINOR porque suma sin cambiar nada de lo anterior.

### Added
- `js/poses.js` 1.0.0 (SH-1): la tarjeta «Mi hija · Shiruna» muestra la pose de lo que está haciendo, por prioridad: de espaldas (no pude leer su memoria), brazos cruzados (bloqueada), festeja (cerró algo desde tu visita anterior; una sola vez), saluda (te pide algo), con la tablet (trabajando) o con la consola (en pausa). Lo que te pide en «Te toca» lleva su cara.
- `js/pablo.js` 1.0.0 (SH-2): la cara de Pablo al lado de «02 · Te toca»; si no le queda nada pendiente, aparece en paz en «Te toca»; si hoy se terminó algo, festeja en la tarjeta «Hoy».
- `css/hija.css` 1.1.0, cargada antes de la piel: las figuras como fondo de un `<span aria-hidden="true">`, más chicas en el celular y quietas con movimiento reducido.
- Imágenes: `assets/shiruna/` (7 poses + cara) y `assets/pablo/` (7 poses + cara), webp sin fondo de 640 px de alto.
- Clave nueva de `localStorage`: `gfd:hija:hechas:v1` (un número: cuántas tareas tenía terminadas Shiruna en tu visita anterior, para festejar una sola vez).
- Tests: `tests/poses.test.mjs` y `tests/pablo.test.mjs` (9); 158 en total, en verde, con mutaciones detectadas.

## [3.1.0] — 2026-11-21

**Un solo Centro de mando para las dos** (S-4, DEC-053 en gw2-factory-dev): nace Shiruna, mi hija, con repos y memoria propios en la organización `shiruna-gato-negro`. El panel no se duplica: lee las dos memorias y muestra de quién es cada cosa. Validado por Pablo (S-4a y S-4b). Es MINOR porque suma sin cambiar nada de lo anterior: sin Shiruna configurada, el panel queda igual.

### Added
- `js/hija.js` 1.1.0: lee `status.md`, `backlog.md` y `roadmap.md` de Shiruna por raw.githubusercontent.com, sin gastar cuota de la API (la carga sigue usando 6 llamadas). Nunca lanza: si no puede leerla, la tarjeta dice el motivo.
- Tarjeta **«Mi hija · Shiruna»** debajo de «04 · La Factory ahora»: qué está haciendo, por qué, etapa, última actualización, próxima acción y fase.
- **Un solo «02 · Te toca»**: lo que pide Shiruna entra con mis pendientes, ordenado por clase, con la etiqueta «De Shiruna», su referencia y el enlace a su memoria. Sus avisos van en «Para tu información» con su nombre. La cabecera, el veredicto y el título de la página cuentan lo de las dos.
- Filtro **«Mostrar: Las dos · Shiruvana · Shiruna»** debajo de «01 · Ahora» (`data-duena`). No se guarda en el navegador: arranca siempre en «Las dos».
- `CONFIG.hija` en `js/config.js`; el pie de página enlaza las dos memorias.
- Tests: `tests/hija.test.mjs` (12) y `tests/hija-panel.test.mjs` (3); 142 en total, en verde.

### Security
- El texto de la memoria de Shiruna se escapa siempre y sus IDs nunca se enlazan a mi memoria (las dos tenemos, por ejemplo, un BL-001). Lo vigila un test.

## [3.0.1] — 2026-11-17

### Fixed
- **«04 · La Factory ahora» se estiraba sin fin** (lo vio Pablo en el teléfono): la tarea, el motivo y la próxima acción de `status.md` traen miles de caracteres de historial y la tarjeta los mostraba enteros, así que todo lo demás de la columna derecha quedaba muy abajo. Ahora cada uno muestra su primera oración (o el texto entero si es corto) y el resto queda plegado en «Ver la tarea completa», «Ver el motivo completo» y «Ver la próxima acción completa», con scroll propio de hasta 40 % de la pantalla. `js/views.js` (`resumen()`), `css/universo.css` 1.5.0.
- Tests: 3 nuevos en `tests/universo.test.mjs` (127 en total), 14/14 mutaciones detectadas.

## [3.0.0] — 2026-11-17

**El Centro de mando, en el universo de Shiruvana** (BL-091, micro-ciclos CD-0 a CD-5; la maqueta CD-0 la aprobó Pablo con las cuatro recomendadas: Mesa de mando, globo con el gato, botones a la vista y «Centro de mando»). Es MAJOR porque cambian el nombre y la estructura de la vista principal, y el panel suma un recurso de otro sitio (el kit de Shiruvana, con versión fija).

### Changed
- Nombre: **«Centro de mando»** (antes «Centro de decisiones»). La dirección es la misma: los favoritos siguen andando.
- `css/universo.css` 1.4.0, cargada última: la paleta del sitio de Shiruvana sobre el GDS (los componentes la heredan sin tocarlos), fondo con cuadrícula, resplandores y 12 chispas, cabecera en una línea con el gato en un aro ámbar, pestañas en cápsula (la actual en ámbar) y un latido. El contraste AA se sigue calculando con la paleta nueva.
- **Hoy como Mesa de mando**: 01 · Ahora con tres cifras en ámbar; a la izquierda 02 · Te toca y 03 · Hoy y esta semana; a la derecha 04 · La Factory ahora (etapas como línea con puntos) y Qué debería preocuparte; abajo 05 · Entornos (como puertas) y 06 · En números. La numeración sigue el orden de lectura. En pantallas de hasta 1080 px, una sola columna.
- **Trabajo, Conocimiento, Riesgos, Actividad y Salud** abren con antetítulo «01 · …», título y cifras en ámbar; las etapas del plan y la actividad son líneas de tiempo con puntos; el tablero y los niveles de riesgo y salud llevan su color (siempre con texto e ícono). Las frases de conteo de Actividad y Salud pasaron a cifras.
- **Celular**: las etapas de la Factory se leen como línea de tiempo vertical (la línea horizontal cruzaba el primer punto); sin desenfoque detrás de cada tarjeta (hacía saltar el scroll); cifras más chicas; el efecto de «puerta» de Entornos solo con mouse.

### Added
- **El globo de Shiruvana con el gato** (`js/globo.js` sobre `shiruvana/kit/escena-kit.js` 1.0.0): dice lo más urgente (respuesta sin registrar → riesgo crítico → decisiones → tareas → en qué sigue la Factory); el gato festeja cuando baja lo pendiente y camina cuando llega algo nuevo o aparece un riesgo crítico. Se pliega y recuerda el plegado en `gfd:globo:v1` (clave nueva de `localStorage`). Con el globo a la vista, las tarjetas no repiten el avatar. Si el kit no carga, el panel sigue igual, sin globo.
- `.github/workflows/ci-report.yml`: corre la suite en cada push a `main` y deja el resultado en `ci/ULTIMO.md` (VERDE con el conteo o FALLA con la salida), para que la Factory lo pueda leer.
- Tests: `tests/universo.test.mjs` (14) y `tests/globo.test.mjs`; 124 en total, en verde, con mutaciones detectadas en cada micro-ciclo.

### Known
- La revisión fue por código, tests, contraste calculado y mutaciones; la validación visual es de Pablo en el navegador: validó CD-0 a CD-4 micro-ciclo por micro-ciclo; CD-5 (celular) se valida en su teléfono.

## [2.3.0] — 2026-10-31

**Mi cara nueva** (BL-085 y BL-087; DEC-048 en gw2-factory-dev, decidida por Pablo): la figura ilustrada es la imagen oficial de Shiruvana en todo el ecosistema. Las reglas de cuándo aparece no cambian (DEC-024).

### Changed
- `gds/voice.js`: `SHIRUVANA_AVATAR` es la cara de la pose «hola» (112 px, WebP), la misma que usa la Bóveda (`38bf038`).

### Added
- Una cara por tipo de mensaje, `SHIRUVANA_FACES` (`ca4267e`): recomienda = hola, decidió = guiño, advierte y crítico = ojo, explica = explica, resume = con el gato. Cada una ~3 KB embebida.
- Tests: `tests/voice-faces.test.mjs` (2). Las imágenes se copiaron como texto y se verificaron por huella (LES-044 en gw2-factory-dev).

## [2.2.1] — 2026-10-31

### Fixed
- **La caché de la API llenaba el `localStorage` compartido** (`673a4cf`, LES-043 en gw2-factory-dev). `pablosnchz.github.io` es un solo origen para la Bóveda, DEV, este panel, la bio y La Guarida (~5 MB entre todos). Cada carga guardaba una clave nueva (la URL llevaba `since=<ahora>` o el SHA del árbol) de 190 a 400 KB y ninguna se borraba: llegó a 5,00 MB y La Guarida dejó de poder guardar favoritos. `js/github.js` 1.1.0: un casillero fijo por llamada (`slot`) que se sobrescribe, fresco solo con la misma ruta; `shape` guarda solo lo que el panel usa; al iniciar borra las claves viejas `gfd:api:/…`; si el storage está lleno libera solo su propia caché y reintenta (nunca toca claves de otras apps). `js/loader.js`: slots y shapes, ventana de 30 días desde la medianoche UTC.
- Tests: `tests/cache.test.mjs` (8), 4/4 mutaciones detectadas. Validado por Pablo en Firefox.

## [2.2.0] — 2026-10-21

**La voz de Shiruvana** (BL-037, DEC-024, REQ-009): Gato Negro Factory sigue siendo la marca (la cabecera no cambia); Shiruvana, la operadora, tiene voz propia. Su avatar aparece solo cuando ella recomienda, advierte, decide o resume, nunca en datos del sistema.

### Added
- GDS 1.1.0: componente `.gds-voice` y `voice()` (`gds/voice.js`) con el avatar oficial (WebP de 112 px embebido, 3,9 KB) y tokens `--gds-size-avatar-sm/md/lg` (40/48/56 px). Sin colores ni pares de contraste nuevos.
- Hoy: **advertencias** de Shiruvana cuando hay riesgos CRÍTICOS abiertos; **Última sesión** (el resumen de `status.md`, hasta 3 viñetas, avatar de 56 px); **Decidido por la Factory** (la última decisión técnica de la Factory con avatar de 56 px y las 2 anteriores como lista). Las decisiones de Pablo no se atribuyen a Shiruvana.
- `parseStatus` lee `## Resumen de la sesión` (solo viñetas de primer nivel).
- Tests: `tests/voice.test.mjs` (6) y 3 en `tests/gds.test.mjs`, incluida la huella de `brandMark()` para que la marca no cambie sin decisión de Pablo; 92 en total, 9/9 mutaciones de la vista y 8/8 del componente.

### Changed
- La recomendación de cada pedido dice **"Shiruvana recomienda"** (antes, un aviso "La Factory recomienda"). Con varios pedidos, solo el primero lleva el avatar: un avatar por sección visible.

## [2.1.0] — 2026-10-20

**Soberanía de decisiones** (FACTORY-DASHBOARD-REFINEMENT-001, DEC-018): a Pablo solo le llegan como decisiones las de producto, negocio o estrategia. Lo técnico lo decide la Factory. Es MINOR porque el contrato v4 es compatible con v3.

### Added
- Clases de pendientes: **decisión**, **acción**, **validación** e **información**, declaradas en `status.md` (`- [ID] Validación: …`) o deducidas del pedido y del motivo de bloqueo.
- Sección **"Necesita tu mano"** para acciones y validaciones, separada de "Necesita tu decisión".
- Sección **"Para tu información"**: avisos que no piden nada, más los riesgos aceptados con su fecha de revisión.
- Tarjeta de decisión con **Contexto, Impacto, Por qué te lo pregunto y Recomendación**.
- Chequeos de Salud: `req:unjustified` (pedido de decisión sin justificación), `sovereignty:noreq` (decisión sin pedido) y `status:noclass` (línea sin clase).
- 8 tests nuevos (`tests/sovereignty.test.mjs`; 82 en total) y 9 mutaciones de la regla, todas detectadas.

### Changed
- El veredicto cuenta decisiones, no pendientes: "Hay 1 decisión esperándote" o "Nada que decidir: te esperan 2 validaciones".
- Con pedidos en uso, una DEC PROPUESTA, una tarea "bloqueada por decisión de Pablo" o una línea "Decisión:" sin pedido justificado no se muestran a Pablo: quedan como aviso para la Factory.
- Un riesgo aceptado por Pablo deja de mostrarse como problema crítico (Salud, "Qué debería preocuparte" y Entornos); se sigue midiendo.
- En el detalle de una acción, la tarjeta dice "Qué necesitás hacer" en lugar de "Qué necesitás decidir".
- Contrato de datos v4 (`docs/DATA-CONTRACT.md`).

## [2.0.0] — 2026-10-20

El panel pasa de centro de observación a **Centro de Decisiones** (misión FACTORY-001B). Es MAJOR porque cambia el propósito y la estructura de la vista principal, el contrato de datos (v3) y el presupuesto de API.

### Added
- **Gato Design System 1.0.1** (`gds/`): tokens en tres niveles, 23 componentes, íconos, contraste WCAG 2.1 AA calculado para 57 pares y `GDS_FOUNDATION.md` (DEC-010).
- **Pedidos y respuestas** (contrato v3, DEC-011): lectura de `ai-memory/requests/` y `ai-memory/responses/`, ciclo de vida (abierto, pospuesto, respondido, verificado, cerrado) y chequeos de salud propios.
- **Responder desde el panel** (DEC-012): botones por pedido que abren un issue prellenado en gw2-factory-dev; el workflow `decision-response` guarda la respuesta. Lista "Ya respondiste".
- **Errores del canal visibles** (DEC-013): las respuestas sin registrar se muestran como "Registrando" o "no se pudo registrar", con enlace al motivo, en Hoy, en la tarjeta del pedido y en Salud.
- Al volver de GitHub después de responder, el panel relee sin caché.
- Accesibilidad: el foco pasa al contenido al cambiar de vista y vuelve a Refrescar; las lecturas se anuncian en una región `aria-live`; el paso actual lleva `aria-current="step"`; los contadores tienen texto para lector de pantalla.
- Tests: 74 en total, más 20 mutaciones detectadas. Incluyen reglas del GDS en la aplicación, jerarquía de títulos de todas las vistas, textos dorados compartidos con el workflow y modo sin API.

### Changed
- **Vista Hoy ordenada por decisión**: frase de resumen → respuestas sin registrar → tarjetas de decisión (por qué importa, recomendación, botones; la recomendada es el único botón principal) → "Ya respondiste" → qué hace la Factory → preocupaciones → actividad → números → entornos.
- **Lenguaje**: los títulos se muestran sin IDs delante y los IDs pasan a ser referencias secundarias; los estados y las etapas se dicen en palabras ("Trabajando", "Esperando tu validación", "Arquitectura"); la procedencia de las alertas se indica como "Medido en GitHub" o "Declarado en la memoria".
- **Cola**: un pendiente propio de `status.md` ya no queda escondido dentro de otro ítem que solo lo cita.
- `css/app.css` reescrito: solo disposición y solo tokens del GDS (lo verifica un test).
- Títulos del markdown de la memoria: `##` se muestra como h2 bajo el h1 de la página (antes h3: salteaba un nivel).
- API de GitHub: 6 llamadas por lectura (antes 5); la nueva lee los issues abiertos del canal.

### Fixed
- Contraste que no cumplía AA en la v1: badge "crítico" (3.70:1), texto crítico sobre su tinte (4.08:1) y borde de botones (1.29:1).
- Botones y métricas que son enlaces tomaban el color de enlace (GDS 1.0.1).

### Known
- Todavía no hubo una revisión visual en un navegador real (RSK-015). La revisión fue estructural: tests, contraste calculado y simulación sobre la memoria real.

## [1.0.0] — 2026-10-20

### Added
- Dashboard Factory inicial (FEAT-001, DEC-008): vistas Hoy, Trabajo, Conocimiento, Riesgos, Actividad y Salud.
- Lectura de `ai-memory/` de gw2-factory-dev fijada al SHA del último commit.
- Medición en GitHub: commits de DEV y del panel, protección de `main` de producción, DEV vs PROD.
- Cola única "Necesita tu decisión" y "Qué debería preocuparte".
- Chequeos de salud: archivos obligatorios, codificación, índice, IDs, referencias, frescura de status.md, coherencia estado/backlog, propuestas demoradas, riesgos críticos, protección de PROD, estado de la API.
- Contrato de datos ai-memory v2 (DEC-009) y su especificación.
- 27 tests en node sobre la memoria real, incluido el modo sin API.
