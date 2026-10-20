import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW, HEAD } from './helpers.mjs';

const mem = readMemory();

async function run(opts = {}, files = mem, storage = memoryStorage()) {
  const fetchImpl = mockFetch(files, opts);
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl, storage, now: () => NOW, ttlMs: 600000, prefix: 't:' });
  const raw = await loadAll(gh, NOW);
  return { raw, model: buildModel(raw), calls: fetchImpl.calls };
}

test('pipeline completo: snapshot por SHA y presupuesto de 6 llamadas a la API (incluye el canal de respuestas)', async () => {
  const { raw, calls } = await run();
  assert.equal(raw.ref, HEAD);
  assert.equal(calls.filter(u => u.startsWith('https://api.github.com')).length, 6);
  const rawCalls = calls.filter(u => u.startsWith('https://raw.githubusercontent.com'));
  assert.ok(rawCalls.every(u => u.includes('/' + HEAD + '/')), 'todo el contenido se lee del mismo commit');
  assert.equal(Object.values(raw.files).filter(x => x == null).length, 0);
});

test('caché: la segunda lectura no gasta API', async () => {
  const storage = memoryStorage();
  await run({}, mem, storage);
  const { calls } = await run({}, mem, storage);
  assert.equal(calls.filter(u => u.startsWith('https://api.github.com')).length, 0);
});

test('la memoria real es coherente: sin inconsistencias declaradas', async () => {
  const { model } = await run({ prodProtected: true });
  const bad = model.health.checks.filter(c => c.source === 'declarado' && c.level !== 'info');
  assert.deepEqual(bad.map(c => c.title), []);
  assert.ok(!model.health.checks.some(c => c.id === 'refs:dangling'), 'sin referencias a IDs inexistentes');
  assert.ok(!model.health.checks.some(c => c.id.startsWith('index:')), 'índice y archivos coinciden');
});

test('producción sin protección se reporta como crítico medido', async () => {
  const { model } = await run({ prodProtected: false });
  const c = model.health.checks.find(x => x.id === 'prod:unprotected');
  assert.equal(c.level, 'critical');
  assert.equal(c.source, 'medido');
  assert.equal(model.health.level, 'critical');
});

test('cola de decisión humana: agrupa y no duplica', async () => {
  const { model } = await run();
  const ids = model.human.map(h => h.id);
  for (const id of ['DEC-005', 'DEC-006', 'BL-016', 'BL-010', 'BL-001']) assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length);
  const dec5 = model.human.find(h => h.id === 'DEC-005');
  assert.ok(dec5.relacionados.includes('BL-003'), 'BL-003 se agrupa bajo DEC-005');
  assert.ok(dec5.pregunta, 'incluye lo pendiente de Pablo');
  assert.ok(!ids.includes('BL-003'));
  assert.ok(!ids.includes('RSK-001'), 'RSK-001 se agrupa con BL-010 (lo referencia)');
});

test('preocupaciones: un riesgo declarado y su medición no se duplican', async () => {
  const { model } = await run({ prodProtected: false });
  const rsk1 = model.concerns.filter(c => c.id === 'RSK-001');
  assert.equal(rsk1.length, 1);
  assert.equal(rsk1[0].level, 'critical');
  assert.match(rsk1[0].origen, /confirmado por medición/);
});

test('estado, tiempo en ejecución y actividad', async () => {
  const { model } = await run();
  assert.equal(model.statusInfo.enEjecucionMs, 20 * 60 * 1000);
  assert.equal(model.fase.id, 'F1');
  assert.equal(model.activity.commitsWeek.length, 3);
  assert.ok(model.activity.memoryToday.some(x => x.id === 'DEC-008'));
  assert.ok(model.activity.doneToday.some(x => x.id === 'BL-019'));
  assert.equal(model.compare.ahead_by, 3);
});

test('sin API (cuota agotada): sigue funcionando desde el índice y lo avisa', async () => {
  const { model, raw } = await run({ apiDown: true });
  assert.equal(raw.ref, null);
  assert.ok(model.entries.DEC.length === 9 && model.entries.LES.length === 11);
  assert.ok(model.health.checks.some(c => c.id === 'api:errors'));
  assert.ok(model.health.checks.some(c => c.id === 'snapshot:branch'));
  assert.ok(model.health.checks.some(c => c.id === 'prod:unknown'));
  V.renderHome(model); // no debe lanzar sin commits ni prod
});

test('detecta inconsistencias inyectadas', async () => {
  const files = { ...mem };
  files['decisions/DEC-099-huerfana.md'] = '# DEC-099 — Huérfana\n\n- Estado: ACEPTADA\n- Fecha: 2026-10-20\n\nCita BL-999.\n';
  files['backlog.md'] = files['backlog.md'].replace('## IN_PROGRESS\n', '## IN_PROGRESS\n\nlínea suelta\n- sin formato\n');
  files['status.md'] = files['status.md'].replace('Estado: ESPERANDO_VALIDACIÓN', 'Estado: EN_CURSO').replace('Última actualización: 2026-10-20T00:18Z', 'Última actualización: 2026-10-10T00:00Z');
  files['risks.md'] += '| RSK-099 | CRÍTICO | ABIERTO | Algo grave | — | Factory | — |\n';
  delete files['roadmap.md'];
  const { model } = await run({}, files);
  const ids = model.health.checks.map(c => c.id);
  for (const id of ['index:unlisted', 'refs:dangling', 'backlog:malformed', 'status:dead', 'status:noprogress', 'missing:roadmap.md']) assert.ok(ids.includes(id), id);
  assert.ok(model.concerns.some(c => c.id === 'RSK-099' && c.level === 'critical'));
  V.renderWork(model); // roadmap ausente: no lanza
});

test('codificación corrupta es crítica', async () => {
  const files = { ...mem, 'status.md': mem['status.md'].replace('Próxima', 'Pr\uFFFDxima') };
  const { model } = await run({}, files);
  assert.equal(model.health.checks.find(c => c.id === 'encoding').level, 'critical');
});
