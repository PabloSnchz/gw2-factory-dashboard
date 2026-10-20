import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW } from './helpers.mjs';

async function model(files = readMemory()) {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(files), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  return buildModel(await loadAll(gh, NOW));
}

test('Hoy responde las preguntas de la misión', async () => {
  const html = V.renderHome(await model());
  for (const s of ['¿Qué está haciendo la Factory?', 'Por qué', 'Tiempo en ejecución', 'Próxima acción',
    'Necesita tu decisión', 'Qué debería preocuparte', 'Hoy', 'Esta semana', 'Entornos']) assert.ok(html.includes(s), s);
  assert.ok(html.includes('20 min'), 'tiempo en ejecución calculado');
  assert.ok(html.includes('href="#/item/DEC-005"'));
});

test('todas las vistas renderizan', async () => {
  const m = await model();
  const views = [
    V.renderWork(m), V.renderKnowledge(m, 'dec'), V.renderKnowledge(m, 'les'), V.renderKnowledge(m, 'feat'),
    V.renderRisks(m), V.renderActivity(m, '24h'), V.renderActivity(m, '7d'), V.renderActivity(m, '30d'), V.renderHealth(m),
    V.renderItem(m, 'DEC-008'), V.renderItem(m, 'BL-016'), V.renderItem(m, 'RSK-001'), V.renderItem(m, 'DEC-999'),
    V.renderHeader(m, 'hoy', false),
  ];
  for (const h of views) assert.ok(typeof h === 'string' && h.length > 50);
  assert.ok(!views.join('').includes('undefined'), 'ninguna vista muestra "undefined"');
  assert.ok(!views.join('').includes('NaN'), 'ninguna vista muestra NaN');
});

test('detalle: links internos entre entradas y "citado por"', async () => {
  const m = await model();
  const html = V.renderItem(m, 'DEC-002');
  assert.ok(html.includes('#/item/DEC-009'));
  assert.ok(html.includes('Citado por'));
});

test('el contenido de la memoria se escapa en todas las vistas', async () => {
  const files = readMemory();
  files['status.md'] = files['status.md'].replace(/^Tarea actual: .*$/m, 'Tarea actual: <img src=x onerror=alert(1)>');
  files['decisions/DEC-010-x.md'] = '# DEC-010 — <script>x</script>\n\n- Estado: PROPUESTA\n- Fecha: 2026-10-20\n\n## Pendiente de Pablo\n\n- <b>hola</b>\n';
  files['memory-index.md'] += '- [DEC-010](decisions/DEC-010-x.md) — <svg onload=1>\n';
  const m = await model(files);
  const all = [V.renderHome(m), V.renderKnowledge(m, 'dec'), V.renderItem(m, 'DEC-010'), V.renderHealth(m)].join('');
  assert.ok(!/<img src=x/.test(all));
  assert.ok(!/<script>x/.test(all));
  assert.ok(!/<svg onload/.test(all));
  assert.ok(!/<b>hola/.test(all));
});

test('dato faltante se muestra con motivo, nunca vacío', async () => {
  const files = readMemory();
  files['status.md'] = '# STATUS\n\nEstado: IDLE\n';
  const html = V.renderHome(await model(files));
  assert.ok(html.includes('status.md no declara tarea'));
  assert.ok(html.includes('falta &quot;Inicio:&quot; en status.md') || html.includes('falta "Inicio:" en status.md'));
});
