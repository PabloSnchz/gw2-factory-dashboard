import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import * as V from '../js/views.js';
import {
  parseRequest, parseResponse, buildResponseMarkdown, buildDecisions, normalizeResponse, RESPONSES,
} from '../js/decisions.js';
import { readMemory, mockFetch, NOW, FIXTURE_ROOT } from './helpers.mjs';

const mem = readMemory();
const v3 = readMemory(join(FIXTURE_ROOT, '..', 'v3'));
const D = 864e5;

async function run(files, opts = {}) {
  const fetchImpl = mockFetch(files, opts);
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl, storage: memoryStorage(), now: () => NOW, ttlMs: 600000, prefix: 't:' });
  const raw = await loadAll(gh, NOW);
  return buildModel(raw);
}

const REQ_DEC = `# REQ-010 — ¿Dónde publicamos la versión de prueba?

- Estado: ABIERTA
- Tipo: decisión
- Fecha: 2026-10-20
- Prioridad: MEDIO
- Relacionado: BL-001

## Qué pasó

Algo pasó.

## Por qué importa

Importa.

## Opciones

- A — Opción uno.
- B — Opción dos.

## Recomendación

B — Es la más simple.
`;

const resp = (id, solicitud, respuesta, extra = '') => `# ${id} — Respuesta a ${solicitud}

- Estado: PENDIENTE
- Fecha: 2026-10-20T00:10Z
- Solicitud: ${solicitud}
- Respuesta: ${respuesta}
${extra}
## Comentario

Ok.
`;

/* ------------------------------------------------------------ formato */

test('pedidos reales publicados: sin problemas de formato', () => {
  for (const [p, md] of Object.entries(v3).filter(([p]) => p.startsWith('requests/'))) {
    const r = parseRequest(md, p);
    assert.deepEqual(r.problems, [], p);
    assert.equal(r.tipo, 'accion');
    assert.ok(r.abierta && r.quePaso && r.porQueImporta && r.comoHacerlo && r.recomendacion, p);
  }
  const r1 = parseRequest(v3['requests/REQ-001-proteger-produccion.md'], 'requests/REQ-001-proteger-produccion.md');
  assert.deepEqual(r1.relacionados, ['RSK-001', 'BL-010']);
  assert.equal(r1.verificacion, 'prod_protegida');
  assert.equal(r1.prioridad, 'ALTO');
});

test('pedido de decisión: opciones y recomendación', () => {
  const r = parseRequest(REQ_DEC, 'requests/REQ-010-x.md');
  assert.deepEqual(r.problems, []);
  assert.equal(r.tipo, 'decision');
  assert.deepEqual(r.opciones.map(o => o.clave), ['A', 'B']);
  assert.equal(r.recomendacion.clave, 'B');
});

test('pedido mal formado: cada problema se explica', () => {
  const bad = parseRequest(`# REQ-011 — Mal

- Estado: PENDIENTE
- Tipo: consulta
- Fecha: 2026-10-20
- Verificación: magia

## Opciones

- A — Única.

## Recomendación

C — Otra.
`, 'requests/REQ-011.md');
  const txt = bad.problems.join(' | ');
  for (const frag of ['Tipo', 'Estado', 'Qué pasó', 'Por qué importa', 'una sola opción', 'recomendación C', 'verificación desconocida']) {
    assert.ok(txt.includes(frag), frag);
  }
});

test('respuestas: códigos canónicos, sinónimos y validación', () => {
  assert.equal(normalizeResponse('aprobada'), 'APPROVED');
  assert.equal(normalizeResponse('HECHA'), 'DONE');
  assert.equal(normalizeResponse('POSTPONED'), 'POSTPONED');
  assert.equal(normalizeResponse('quizás'), null);
  assert.deepEqual(Object.keys(RESPONSES), ['APPROVED', 'REJECTED', 'POSTPONED', 'DONE']);

  const ok = parseResponse(resp('RESP-001', 'REQ-010', 'Aprobada', '- Opción: A\n'), 'responses/RESP-001.md');
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.respuesta, 'APPROVED');
  assert.equal(ok.opcion, 'A');
  assert.equal(ok.procesada, false);

  const noHasta = parseResponse(resp('RESP-002', 'REQ-010', 'POSTPONED'), 'responses/RESP-002.md');
  assert.ok(noHasta.problems.some(p => p.includes('Hasta')));
  const noReq = parseResponse(resp('RESP-003', 'nada', 'TALVEZ'), 'responses/RESP-003.md');
  assert.ok(noReq.problems.some(p => p.includes('Respuesta')));
  assert.ok(noReq.problems.some(p => p.includes('Solicitud')));
});

test('buildResponseMarkdown: ida y vuelta, y no permite inyectar metadatos', () => {
  const md = buildResponseMarkdown({
    id: 'RESP-012', solicitud: 'REQ-010', respuesta: 'POSTPONED', hasta: '2026-10-27',
    fecha: '2026-10-20T01:00Z', opcion: null, issue: 'https://github.com/x\n- Estado: PROCESADA',
    comentario: 'Más adelante.\n\n## Efecto\n\ninventado',
  });
  const r = parseResponse(md, 'responses/RESP-012.md');
  assert.deepEqual(r.problems, []);
  assert.equal(r.respuesta, 'POSTPONED');
  assert.equal(r.hasta.toISOString().slice(0, 10), '2026-10-27');
  assert.equal(r.procesada, false, 'el estado no se puede inyectar por un metadato');
  assert.equal(r.estadoCodigo, 'PENDIENTE');
  assert.throws(() => buildResponseMarkdown({ id: 'RESP-1', solicitud: 'REQ-010', respuesta: 'APPROVED' }));
  assert.throws(() => buildResponseMarkdown({ id: 'RESP-013', solicitud: 'REQ-010', respuesta: 'MAYBE' }));
  assert.throws(() => buildResponseMarkdown({ id: 'RESP-013', solicitud: 'REQ-010', respuesta: 'POSTPONED' }));
});

/* ------------------------------------------------------------ ciclo de vida */

function lifecycle(extraFiles, ctx = {}) {
  const files = { 'requests/REQ-010-x.md': REQ_DEC, ...extraFiles };
  return buildDecisions({ files, now: NOW, prod: { protected: false }, ...ctx });
}

test('ciclo de vida: abierto → respondido → procesado → cerrado', () => {
  let d = lifecycle({});
  assert.equal(d.requests[0].state, 'open');
  assert.equal(d.open.length, 1);

  d = lifecycle({ 'responses/RESP-001.md': resp('RESP-001', 'REQ-010', 'APPROVED', '- Opción: B\n') });
  assert.equal(d.requests[0].state, 'answered');
  assert.equal(d.pendingResponses.length, 1, 'la Factory tiene una respuesta para procesar');
  assert.equal(d.open.length, 0, 'ya no es el turno de Pablo');

  const processed = resp('RESP-001', 'REQ-010', 'APPROVED', '- Opción: B\n').replace('Estado: PENDIENTE', 'Estado: PROCESADA');
  d = lifecycle({ 'responses/RESP-001.md': processed });
  assert.ok(d.checks.some(c => c.id === 'req:notclosed:REQ-010'), 'procesada pero el pedido sigue abierto');

  d = lifecycle({ 'requests/REQ-010-x.md': REQ_DEC.replace('Estado: ABIERTA', 'Estado: CERRADA'), 'responses/RESP-001.md': processed });
  assert.equal(d.requests[0].state, 'closed');
  assert.equal(d.checks.filter(c => c.level !== 'info').length, 0);
});

test('posponer: desaparece hasta la fecha y vuelve cuando vence', () => {
  const later = new Date(NOW + 3 * D).toISOString().slice(0, 10);
  let d = lifecycle({ 'responses/RESP-001.md': resp('RESP-001', 'REQ-010', 'POSTPONED', `- Hasta: ${later}\n`) });
  assert.equal(d.requests[0].state, 'postponed');
  assert.equal(d.open.length, 0);

  d = lifecycle({ 'responses/RESP-001.md': resp('RESP-001', 'REQ-010', 'POSTPONED', '- Hasta: 2026-10-19\n') });
  assert.equal(d.requests[0].state, 'open');
  assert.equal(d.requests[0].vencida, true);
  assert.ok(d.checks.some(c => c.id === 'req:due:REQ-010'));
});

test('acciones verificadas por medición no esperan respuesta', () => {
  const files = { 'requests/REQ-001-proteger-produccion.md': v3['requests/REQ-001-proteger-produccion.md'] };
  assert.equal(buildDecisions({ files, now: NOW, prod: { protected: false } }).requests[0].state, 'open');
  const d = buildDecisions({ files, now: NOW, prod: { protected: true } });
  assert.equal(d.requests[0].state, 'measured');
  assert.ok(d.checks.some(c => c.id === 'req:measured:REQ-001'));
  assert.equal(buildDecisions({ files, now: NOW, prod: null }).requests[0].state, 'open', 'sin dato medido no se asume nada');
});

test('chequeos: espera larga, respuesta sin procesar, huérfana, opción inexistente, README ignorado', () => {
  const late = NOW + 10 * D;
  const d = buildDecisions({
    now: late, prod: null,
    files: {
      'requests/REQ-010-x.md': REQ_DEC,
      'requests/REQ-020-y.md': REQ_DEC.replace('REQ-010', 'REQ-020'),
      'responses/RESP-001.md': resp('RESP-001', 'REQ-020', 'APPROVED', '- Opción: Z\n'),
      'responses/RESP-002.md': resp('RESP-002', 'REQ-099', 'REJECTED'),
      'responses/README.md': '# Respuestas\n\nGuía.\n',
    },
  });
  const ids = d.checks.map(c => c.id);
  for (const id of ['req:waiting:REQ-010', 'resp:unprocessed:RESP-001', 'resp:orphan:RESP-002', 'resp:option:RESP-001']) assert.ok(ids.includes(id), id);
  assert.equal(d.responses.length, 2, 'README.md no es una respuesta');
});

test('contrato v3: una DEC PROPUESTA sin pedido es una inconsistencia (solo si ya se usan pedidos)', () => {
  const decs = [{ id: 'DEC-050', estadoCodigo: 'PROPUESTA' }];
  assert.ok(buildDecisions({ files: {}, now: NOW, decs }).checks.some(c => c.id === 'decisions:v3' && c.level === 'info'));
  const d = buildDecisions({ files: { 'requests/REQ-010-x.md': REQ_DEC }, now: NOW, decs });
  assert.ok(d.checks.some(c => c.id === 'dec:noreq:DEC-050' && c.level === 'warn'));
  const covered = buildDecisions({ files: { 'requests/REQ-010-x.md': REQ_DEC.replace('Relacionado: BL-001', 'Relacionado: DEC-050') }, now: NOW, decs });
  assert.ok(!covered.checks.some(c => c.id.startsWith('dec:noreq')));
});

/* ------------------------------------------------------------ modelo y panel */

test('panel: los pedidos encabezan "Necesita tu decisión" y absorben lo que cubren', async () => {
  const m = await run({ ...mem, ...v3 });
  const ids = m.human.map(h => h.id);
  assert.deepEqual(ids.slice(0, 2).sort(), ['REQ-001', 'REQ-002']);
  for (const covered of ['RSK-001', 'BL-010', 'DEC-005', 'BL-003']) assert.ok(!ids.includes(covered), covered + ' queda dentro de su pedido');
  const r2 = m.human.find(h => h.id === 'REQ-002');
  assert.ok(r2.relacionados.includes('BL-003'));
  assert.match(r2.pregunta, /^Recomendación: /);
  assert.ok(ids.includes('DEC-006'), 'lo no cubierto por un pedido sigue apareciendo');
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(m.allIds.has('REQ-001'));
  assert.ok(m.health.checks.some(c => c.id === 'dec:noreq:DEC-006'), 'DEC-006 PROPUESTA sin pedido');
  assert.ok(!m.health.checks.some(c => c.id.startsWith('req:invalid')));
});

test('panel: un pedido pospuesto saca de la cola todo lo que cubre', async () => {
  const later = new Date(NOW + 5 * D).toISOString().slice(0, 10);
  const m = await run({ ...mem, ...v3, 'responses/RESP-001.md': resp('RESP-001', 'REQ-002', 'POSTPONED', `- Hasta: ${later}\n`) });
  const ids = m.human.map(h => h.id);
  for (const id of ['REQ-002', 'DEC-005', 'BL-003']) assert.ok(!ids.includes(id), id);
  assert.equal(m.decisions.postponed[0].id, 'REQ-002');
});

test('panel: las vistas actuales muestran pedidos y respuestas sin romperse', async () => {
  const evil = v3['requests/REQ-002-dev-en-vercel.md'].replace('Publicar la versión', '<img src=x onerror=alert(1)> Publicar');
  const m = await run({ ...mem, ...v3, 'requests/REQ-002-dev-en-vercel.md': evil, 'responses/RESP-001.md': resp('RESP-001', 'REQ-002', 'DONE') });
  const home = V.renderHome(m);
  assert.ok(home.includes('href="#/item/REQ-001"'));
  assert.ok(!home.includes('<img src=x'), 'el texto de la memoria se escapa');
  const item = V.renderItem(m, 'REQ-001');
  assert.ok(item.includes('Proteger la rama principal'));
  assert.ok(V.renderItem(m, 'RESP-001').includes('Respuesta a REQ-002'));
  const act = V.renderActivity(m, '7d');
  assert.ok(act.includes('Pedido') && act.includes('Respuesta'));
  for (const html of [home, item, act, V.renderHealth(m)]) assert.doesNotMatch(html, /undefined|NaN/);
});
