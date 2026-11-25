# 🐈‍⬛ Gato Negro Factory — Centro de mando

El lugar donde Pablo sigue lo que hacemos Shiruvana y Shiruna, mi hija. En menos de 60 segundos responde **qué necesita tu decisión, qué estoy haciendo y por qué, qué está haciendo Shiruna, qué pasó hoy y esta semana, y qué está bloqueado**. Y permite responder desde el mismo lugar.

Gato Negro Factory es la marca y el concepto; quien decide y hace soy yo, Shiruvana (o Shiruna en su repo, o Pablo). Lo vigila `tests/autoria.test.mjs`.

**Panel:** https://pablosnchz.github.io/gw2-factory-dashboard/ · versión 3.5.0

```
Shiruvana trabaja → el panel propone → Pablo responde → Shiruvana continúa
Shiruna trabaja sola en su repo (ciclo continuo) → el panel la muestra
```

## Qué muestra

| Vista | Pregunta que responde |
|---|---|
| **Hoy** | ¿Tengo que hacer algo? Una frase de resumen, una tarjeta por pendiente (de las dos, con su dueña), lo que ya respondiste, qué hago yo y por qué, qué hace Shiruna y su **«Hoy hizo»** (commits, pasos, tests y si está activa), qué debería preocuparme, qué pasó hoy y esta semana, cómo están DEV y PROD |
| **Trabajo** | Etapas del plan, mi tablero y **el tablero de Shiruna**, con el paso por el que va cada tarea. Cada columna muestra 5 tarjetas y el resto en «Ver N más» |
| **Conocimiento** | Decisiones, lecciones y funcionalidades, con detalle y "citado por" |
| **Riesgos** | Críticos, altos, otros abiertos y mitigados |
| **Actividad** | **«El día de Shiruna»** (horario, tests, pausas largas y sus commits) y mis commits y registros de memoria por día (24 h / 7 d / 30 d) |
| **Salud** | Diferencias entre lo que mi memoria dice y lo que se mide en GitHub, y **«¿Cómo está Shiruna?»**: quieta con trabajo en cola, tests en rojo o que bajan, pasos sin tests, trabada |
| **Mapa** | ¿Cómo estamos armadas? Personas, agentes, PCs, repos, flujos y automatizaciones en un dibujo navegable: cada caja abre su ficha (qué es, dónde corre, cuándo se ejecuta, con quién se conecta). Datos en `mapa/*.json`, una parte por agente (BL-105). Los estados son en vivo: cada automatización según su última corrida en GitHub Actions y nosotras según nuestras memorias; lo que no se puede medir queda como lo declaré y la ficha lo dice |

El filtro «Las dos · Shiruvana · Shiruna» de Hoy muestra lo de una, lo de la otra o lo de las dos. Los IDs de Shiruna son suyos: nunca enlazan a mi memoria.

**Marca y voz (DEC-024).** La marca es Gato Negro Factory: el gato de la cabecera no cambia. Cuando yo recomiendo, advierto, decido o resumo, el mensaje lleva mi avatar y el rótulo "Shiruvana …". Los datos del sistema nunca lo llevan, y hay un solo avatar por sección.

## Responder una decisión

1. En **Hoy**, cada pedido tiene sus botones: *Aprobar (recomendada)*, *Rechazar*, *Posponer 7 días*, *Ya lo hice*…
2. El botón abre GitHub con la respuesta lista. Podés agregar un comentario y tocás **Submit new issue**.
3. Un workflow de `gw2-factory-dev` la guarda en `ai-memory/responses/`, comenta y cierra el issue. Al volver al panel, el pedido pasa a **Ya respondiste**.
4. Si algo falla, el panel lo dice ("no se pudo registrar") y enlaza el motivo.

Sin tokens ni secretos en el navegador: GitHub te identifica a vos. Detalle en [docs/DECISIONS.md](docs/DECISIONS.md).

## Cómo funciona

- Página estática, JavaScript sin dependencias ni build.
- Lee mi `ai-memory/` de [gw2-factory-dev](https://github.com/PabloSnchz/gw2-factory-dev/tree/main/ai-memory) **fijado al SHA del último commit** (snapshot consistente).
- Lee la memoria de Shiruna (`status.md`, `backlog.md`, `roadmap.md` de [shiruna-gato-negro/gw2-factory-dev](https://github.com/shiruna-gato-negro/gw2-factory-dev)) por raw, sin gastar cuota (`js/hija.js`), y sus commits del día con una llamada a la API (`js/pulso.js`). Entiende el formato de su ciclo: `BL-NNN paso X/Y — qué — tests N/N`.
- Mide en GitHub: commits, protección de producción, diferencia DEV/PROD y respuestas del canal sin registrar. **7 llamadas a la API por lectura** (6 mías y 1 de Shiruna), con caché de 10 minutos en casilleros fijos. Al abrir el **Mapa** se suman 4 (las corridas de DEV, el panel, mi sitio y producción), una vez por lectura y en sus propios casilleros.
- **Sin backend y sin scripts locales**: todo se calcula en el navegador.
- Un dato que no se pudo leer aparece como **—** con el motivo, nunca como 0.
- Visual: [Gato Design System](gds/GDS_FOUNDATION.md) 1.1.0. Contraste WCAG 2.1 AA calculado, estados con ícono y texto, navegación por teclado.
- Piel «Universo Shiruvana» (`css/universo.css`, BL-091): la paleta, el fondo y las cabeceras numeradas de mi sitio sobre el GDS. Mi globo con el gato (`js/globo.js`) usa el kit del repo [shiruvana](https://github.com/PabloSnchz/shiruvana/tree/main/kit) con versión fija; si el kit no carga, el panel sigue igual, sin globo.
- Lo de Shiruna se monta después de cada dibujo (`js/pulso.js`, `js/tablero.js`, `js/alertas.js`, `js/sudia.js`, con `js/plegar.js` para las listas largas); si falta un dato, nunca rompe el panel.

## Documentación

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — capas, fuentes, presupuesto de API, accesibilidad.
- [docs/DECISIONS.md](docs/DECISIONS.md) — pedidos, respuestas y canal de respuesta (contrato v3).
- [docs/DATA-CONTRACT.md](docs/DATA-CONTRACT.md) — formato de ai-memory que el panel consume.
- [gds/GDS_FOUNDATION.md](gds/GDS_FOUNDATION.md) — el sistema de diseño.
- [docs/ANALISIS-HISTORICO.md](docs/ANALISIS-HISTORICO.md) — qué se conservó, qué se eliminó y qué se creó respecto de `gw2-agents-dashboard`.
- [CHANGELOG.md](CHANGELOG.md)

Decisiones oficiales en mi memoria: DEC-008 (panel nuevo), DEC-009 (contrato de datos), DEC-010 (GDS), DEC-011 (pedidos y respuestas), DEC-012 (canal), DEC-013 (Centro de Decisiones), DEC-024 (marca y voz), DEC-053 (Shiruna). Funcionalidades: FEAT-001, FEAT-027 y FEAT-030 (seguir a Shiruna).

## Desarrollo

```bash
node --test tests/*.test.mjs     # Node 20+; sin npm install
```

Los tests usan la memoria real (`tests/fixtures/ai-memory/`) y simulan GitHub: cuota agotada, canal con errores, contraste, reglas del GDS, accesibilidad y textos dorados compartidos con el workflow de respuestas.

En cada push a `main`, `.github/workflows/ci-report.yml` corre la suite y deja el resultado en `ci/ULTIMO.md`. Los cambios grandes entran por el canal de parches (`patches/PATCH-NNN.json` → `patches/RESULT-NNN.md`, todo o nada, con la suite completa).

Para probar localmente: servir la carpeta con cualquier servidor estático (`python3 -m http.server`) y abrir `http://localhost:8000`.

## Publicación

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `/ (root)`.

Si un cambio no entra en un solo commit, publicarlo en orden de dependencias (GDS y estilos → modelo → vistas → `app.js` / `index.html`) para que cada commit deje el sitio funcionando (LES-017).
