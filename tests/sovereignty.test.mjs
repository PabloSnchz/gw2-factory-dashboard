// Soberanía de decisiones (DEC-018): a Pablo solo le llegan decisiones de producto, negocio o estrategia,
// con contexto, impacto, recomendación y el motivo por el que la Factory no puede decidirlas.
// Acciones y validaciones son tareas, no decisiones; lo informativo no cuenta como pendiente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel, splitStatusLine } from '../js/model.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW, FIXTURE_ROOT } from './helpers.mjs';

const mem = readMemory();
const v3 = readMemory(join(FIXTURE_ROOT, '..', 'v3'));

async function model(files, opts = {}) {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(files, opts), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  return buildModel(await loadAll(gh, NOW));
}

const decisionReq = (why) => `# REQ-010 — ¿Mostramos el historial de la cartera?

- Estado: ABIERTA
- Tipo: decisión
- Fecha: 2026-10-20
- Prioridad: MEDIO
- Relacionado: BL-001

## Qué pasó

La Factory puede guardar una foto diaria de la cartera.

## Por qué importa

Te deja ver cuánto ganaste en la semana.
${why ? `
## Por qué te lo pregunto

Cambia qué datos tuyos se guardan en el navegador: es una decisión de producto.
` : ''}
## Opciones

- A — Guardar 30 días.
- B — No guardar nada.

## Recomendación

A — Es lo que más piden los jugadores.
`;

const base = () => ({ ...mem, ...v3 });

test('una decisión justificada llega a Pablo con contexto, impacto, motivo y recomendación', async () => {
  const m = await model({ ...base(), 'requests/REQ-010-historial.md': decisionReq(true) });
  const d = m.human.filter(h => h.clase === 'decision');
  assert.deepEqual(d.map(h => h.id), ['REQ-010']);
  assert.equal(V.verdict(m).text, 'Hay 1 decisión esperándote');
  const html = V.renderHome(m);
  const card = html.slice(html.indexOf('aria-labelledby="dq-REQ-010"'));
  const body = card.slice(0, card.indexOf('</article>'));
  for (const s of ['Decisión', 'Contexto', 'Impacto', 'Por qué te lo pregunto', 'Shiruvana recomienda', 'Aprobar A (recomendada)']) assert.ok(body.includes(s), s);
  assert.ok(html.indexOf('dq-REQ-010') < html.indexOf('tasks-title'), 'las decisiones van antes que las tareas');
});

test('una decisión sin justificar no llega a Pablo y queda como aviso en Salud', async () => {
  const m = await model({ ...base(), 'requests/REQ-010-historial.md': decisionReq(false) });
  assert.ok(!m.human.some(h => h.id === 'REQ-010'));
  const c = m.health.checks.find(x => x.id === 'req:unjustified:REQ-010');
  assert.ok(c && c.level === 'warn', 'aviso para la Factory');
  assert.match(c.detail, /Por qué te lo pregunto/);
});

test('con pedidos en uso, una DEC PROPUESTA o una tarea bloqueada "por decisión" sin pedido no llegan a Pablo', async () => {
  const m = await model(base());
  const ids = m.human.map(h => h.id);
  for (const id of ['DEC-006', 'BL-001', 'BL-016']) assert.ok(!ids.includes(id), id);
  assert.ok(m.health.checks.some(c => c.id === 'dec:noreq:DEC-006'), 'la DEC sin pedido ya tenía su aviso');
  const s = m.health.checks.find(c => c.id === 'sovereignty:noreq');
  assert.ok(s && /BL-001/.test(s.detail) && !/DEC-006/.test(s.detail), 'un solo aviso por ítem');
  assert.ok(m.human.every(h => h.clase !== 'decision'));
});

test('sin pedidos (memoria v2) se conserva la cola anterior', async () => {
  const m = await model(mem);
  const ids = m.human.map(h => h.id);
  for (const id of ['DEC-005', 'DEC-006']) assert.ok(ids.includes(id), id);
  assert.equal(m.human.find(h => h.id === 'DEC-005').clase, 'decision');
});

test('status.md: cada línea declara su clase; Info y "Para tu información" no son pendientes', async () => {
  const files = base();
  files['status.md'] = files['status.md'].replace(/## Esperando a Pablo\n[\s\S]*?\n## /, `## Esperando a Pablo

- [FEAT-002] Validación: Abrí DEV y confirmá que no carga Analytics.
- [BL-020] Acción: Crear el token de la API.
- [RSK-016] Info: La Factory no ve CI; si ves app-checks en rojo, avisá.
- Algo sin clase.

## Para tu información

- [RSK-008] Los repos históricos siguen activos como benchmark.

## `);
  const m = await model(files);
  const by = Object.fromEntries(m.human.filter(h => h.id).map(h => [h.id, h.clase]));
  assert.equal(by['FEAT-002'], 'validacion');
  assert.equal(by['BL-020'], 'accion');
  assert.equal(m.human.find(h => h.id === 'FEAT-002').titulo, 'Abrí DEV y confirmá que no carga Analytics.', 'la clase no se repite en el título');
  assert.ok(!m.human.some(h => h.id === 'RSK-016'), 'Info no es un pendiente');
  assert.ok(m.info.some(x => x.id === 'RSK-016'));
  assert.ok(m.info.some(x => x.id === 'RSK-008'));
  const loose = m.human.find(h => h.titulo === 'Algo sin clase.');
  assert.equal(loose.clase, 'accion');
  assert.ok(m.health.checks.some(c => c.id === 'status:noclass' && c.level === 'info'));
  const html = V.renderHome(m);
  assert.ok(html.includes('Para tu información') && html.includes('No hace falta que hagas nada.'));
  assert.ok(html.includes('Para validar'));
});

test('un riesgo que Pablo aceptó pasa a información: sin alarma crítica y con su fecha de revisión', async () => {
  const files = base();
  files['risks.md'] = files['risks.md'].replace('Activar branch protection (exigir PR). El dashboard lo verifica en vivo en cada lectura.',
    'ACEPTADO por Pablo el 2026-10-20. Revisión acordada: 2026-11-20.');
  const m = await model(files, { prodProtected: false });
  const c = m.health.checks.find(x => x.id === 'prod:unprotected');
  assert.equal(c.level, 'info', 'se sigue midiendo, pero no es crítico');
  assert.match(c.title, /riesgo que aceptaste/);
  assert.ok(!m.concerns.some(x => x.id === 'RSK-001'), 'no está en "Qué debería preocuparte"');
  const info = m.info.find(x => x.id === 'RSK-001');
  assert.match(info.titulo, /^Riesgo que aceptaste: .*Se revisa el 2026-11-20\.$/);
  const home = V.renderHome(m);
  assert.ok(home.includes('main sin protección (riesgo que aceptaste)'), 'Entornos tampoco lo muestra como crítico');
  assert.ok(home.indexOf('info-title') < home.indexOf('concerns-title'), '"Para tu información" va antes de las preocupaciones');
  const plain = await model(base(), { prodProtected: false });
  assert.equal(plain.health.checks.find(x => x.id === 'prod:unprotected').level, 'critical', 'sin aceptación sigue siendo crítico');
  assert.ok(V.renderHome(plain).includes('>main sin protección<'), 'sin aceptación, Entornos lo sigue mostrando como crítico');
});

test('Hoy: sin decisiones lo dice claro y separa las tareas', async () => {
  const m = await model(base());
  const html = V.renderHome(m);
  assert.ok(html.includes('Nada que decidir.'));
  assert.ok(html.includes('Necesita tu mano'));
  assert.ok(html.indexOf('human-title') < html.indexOf('tasks-title'));
  assert.doesNotMatch(html, /undefined|NaN/);
});

test('splitStatusLine reconoce clases con y sin tilde', () => {
  assert.deepEqual(splitStatusLine('[BL-016] Validacion: Mirar el panel'), { clase: 'validacion', texto: 'Mirar el panel' });
  assert.deepEqual(splitStatusLine('[REQ-004] Decisión: Elegir'), { clase: 'decision', texto: 'Elegir' });
  assert.deepEqual(splitStatusLine('[RSK-001] Información: Se revisa'), { clase: 'info', texto: 'Se revisa' });
  assert.deepEqual(splitStatusLine('[BL-003] Publicar'), { clase: null, texto: 'Publicar' });
});
