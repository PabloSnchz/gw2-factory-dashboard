import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import * as V from '../js/views.js';
import { responseActions, buildIssueTitle, buildIssueBody, buildIssueUrl, MARKER } from '../js/respond.js';
import { parseRequest, buildResponseMarkdown, parseResponse } from '../js/decisions.js';
import { readMemory, mockFetch, NOW, FIXTURE_ROOT } from './helpers.mjs';

const mem = readMemory();
const v3 = readMemory(join(FIXTURE_ROOT, '..', 'v3'));
const D = 864e5;

/* Textos dorados: idénticos en gw2-factory-dev/.github/scripts/decision-response.test.cjs.
   Si cambia el formato de un lado, el test del otro lado lo detecta. */
const GOLDEN_ISSUE_BODY = `<!-- gds:decision-response v1 -->
**Respuesta de Pablo** desde el Centro de Decisiones.

Pedido: REQ-002 — Publicar la versión de prueba en Vercel y apagar GitHub Pages en DEV
Respuesta: Hecha

\`\`\`gds-response
solicitud: REQ-002
respuesta: DONE
opcion: —
hasta: —
\`\`\`

### Comentario

_Escribí acá si querés agregar algo (opcional)._
`;
const GOLDEN_RESP_INPUT = {
  id: 'RESP-007', solicitud: 'REQ-002', respuesta: 'DONE', opcion: null, fecha: '2026-10-20T03:50Z',
  issue: 'https://github.com/PabloSnchz/gw2-factory-dev/issues/12', autor: 'PabloSnchz', comentario: 'Listo: https://gw2-factory-dev.vercel.app',
};
const GOLDEN_RESP = `# RESP-007 — Hecha: REQ-002

- Estado: PENDIENTE
- Fecha: 2026-10-20T03:50Z
- Solicitud: REQ-002
- Respuesta: DONE
- Opción: —
- Issue: https://github.com/PabloSnchz/gw2-factory-dev/issues/12
- Autor: PabloSnchz

## Comentario

Listo: https://gw2-factory-dev.vercel.app
`;

const REQ_DEC = `# REQ-010 — ¿Dónde publicamos la versión de prueba?

- Estado: ABIERTA
- Tipo: decisión
- Fecha: 2026-10-20
- Prioridad: MEDIO

## Qué pasó

Algo.

## Por qué importa

Importa.

## Opciones

- A — Uno.
- B — Dos.

## Recomendación

B — Simple.
`;

const withState = (r, state) => Object.assign(r, { state });
const req2 = () => withState(parseRequest(v3['requests/REQ-002-dev-en-vercel.md'], 'requests/REQ-002-dev-en-vercel.md'), 'open');

test('contrato espejo: cuerpo del issue idéntico al texto dorado del canal', () => {
  const r = req2();
  const done = responseActions(r, NOW).find(a => a.respuesta === 'DONE');
  assert.equal(buildIssueBody(r, done), GOLDEN_ISSUE_BODY);
  assert.ok(GOLDEN_ISSUE_BODY.startsWith(MARKER));
});

test('contrato espejo: archivo de respuesta idéntico al texto dorado y válido para el panel', () => {
  assert.equal(buildResponseMarkdown(GOLDEN_RESP_INPUT), GOLDEN_RESP);
  const parsed = parseResponse(GOLDEN_RESP, 'responses/RESP-007.md');
  assert.deepEqual(parsed.problems, []);
  assert.equal(parsed.respuesta, 'DONE');
  assert.equal(parsed.issue, GOLDEN_RESP_INPUT.issue);
});

test('acciones: una acción ofrece Ya lo hice / Posponer / No lo voy a hacer', () => {
  const acts = responseActions(req2(), NOW);
  assert.deepEqual(acts.map(a => a.respuesta), ['DONE', 'POSTPONED', 'REJECTED']);
  assert.equal(acts[1].hasta, new Date(NOW + 7 * D).toISOString().slice(0, 10));
  assert.ok(acts[0].recomendada);
});

test('acciones: una decisión con opciones pone primero la recomendada', () => {
  const r = withState(parseRequest(REQ_DEC, 'requests/REQ-010-x.md'), 'open');
  const acts = responseActions(r, NOW);
  assert.deepEqual(acts.map(a => a.label), ['Aprobar B (recomendada)', 'Aprobar A', 'Rechazar', 'Posponer 7 días']);
  const body = buildIssueBody(r, acts[0]);
  assert.match(body, /respuesta: APPROVED\nopcion: B\nhasta: —/);
  const noOpts = withState(parseRequest(REQ_DEC.replace(/## Opciones[\s\S]*?## Recomendación\n\nB — /, '## Recomendación\n\n'), 'requests/REQ-010-x.md'), 'open');
  assert.deepEqual(responseActions(noOpts, NOW).map(a => a.label), ['Aprobar', 'Rechazar', 'Posponer 7 días']);
});

test('acciones: solo pedidos abiertos se pueden responder', () => {
  for (const st of ['answered', 'postponed', 'measured', 'closed']) assert.deepEqual(responseActions(withState(req2(), st), NOW), []);
});

test('URL: issue nuevo en gw2-factory-dev, título acotado y todo codificado', () => {
  const r = req2();
  r.titulo = 'Título largo '.repeat(20) + '& <raro> "comillas"';
  const a = responseActions(r, NOW)[0];
  const url = new URL(buildIssueUrl(r, a));
  assert.equal(url.origin + url.pathname, 'https://github.com/PabloSnchz/gw2-factory-dev/issues/new');
  assert.ok(url.searchParams.get('title').length <= 120);
  assert.equal(url.searchParams.get('body'), buildIssueBody(r, a));
  assert.ok(buildIssueUrl(r, a).length < 6000, 'bien por debajo del límite de URL de GitHub');
  assert.ok(!buildIssueUrl(r, a).includes('+'), 'espacios como %20, nunca "+"');
  assert.match(buildIssueTitle(req2(), a), /^\[Decisión\] Hecha · REQ-002 — /);
});

test('panel: cada pedido abierto muestra sus botones de respuesta', async () => {
  const fetchImpl = mockFetch({ ...mem, ...v3 });
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl, storage: memoryStorage(), now: () => NOW, ttlMs: 600000, prefix: 't:' });
  const m = buildModel(await loadAll(gh, NOW));
  const home = V.renderHome(m);
  for (const label of ['Ya lo hice ↗', 'Posponer 7 días ↗', 'No lo voy a hacer ↗']) assert.ok(home.includes(label), label);
  assert.equal((home.match(/issues\/new\?/g) || []).length, 6, '3 respuestas × 2 pedidos');
  assert.ok(home.includes('target="_blank" rel="noopener"'));
  assert.ok(home.includes('Submit new issue'));
  assert.ok(V.renderItem(m, 'REQ-002').includes('Ya lo hice ↗'), 'también desde el detalle del pedido');
  assert.doesNotMatch(home, /undefined|NaN/);
});

test('panel: después de responder, el pedido sale de la cola y aparece en "Ya respondiste"', async () => {
  const files = { ...mem, ...v3, 'responses/RESP-001.md': GOLDEN_RESP.replace('RESP-007', 'RESP-001') };
  const fetchImpl = mockFetch(files);
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl, storage: memoryStorage(), now: () => NOW, ttlMs: 600000, prefix: 't:' });
  const m = buildModel(await loadAll(gh, NOW));
  assert.ok(!m.human.some(h => h.id === 'REQ-002'));
  const home = V.renderHome(m);
  assert.ok(home.includes('Ya respondiste'));
  assert.match(home, /Hecha · Respondido · la Factory lo está procesando/);
  assert.ok(!V.renderItem(m, 'REQ-002').includes('Ya lo hice ↗'), 'un pedido respondido no se vuelve a responder');
});
