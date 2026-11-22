// S-4b: el Centro de mando con las dos dueñas — Hoy, «Te toca», «Para tu información» y el filtro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import { buildHija, unirHija } from '../js/hija.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW } from './helpers.mjs';

const HIJA = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };
const STATUS = `# Estado de Shiruna

Estado: EN CURSO
Tarea actual: Nacer <i>ya</i>.
Motivo: ensayo general.
Etapa actual: DOCUMENTATION
Última actualización: 2026-10-20 00:20Z
Próxima acción: S-4.

## Esperando a Pablo

- [BL-016] Validación: mirar <b>mi</b> tarjeta (ver DEC-005)
- Info: todavía no tengo motor.
`;

async function mio() {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(readMemory()), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  return buildModel(await loadAll(gh, NOW));
}
async function conHija(status = STATUS) {
  const m = await mio();
  return unirHija(m, buildHija({ files: { 'status.md': status, 'backlog.md': null, 'roadmap.md': null }, errors: {} }, NOW, HIJA));
}
const suTarjeta = (html) => (html.match(/<article[^>]*data-duena="shiruna"[\s\S]*?<\/article>/) || [''])[0];

test('Hoy con Shiruna: filtro, su tarjeta debajo de la mía y lo que pide en «Te toca»', async () => {
  const solo = await mio();
  const m = await conHija();
  assert.equal(m.human.length, solo.human.length + 1, 'lo que pide Shiruna suma a lo que te toca');
  const html = V.renderHome(m);
  assert.match(html, /class="gds-cluster uv-filtro" role="group" aria-label="Mostrar lo de"/);
  assert.ok(html.indexOf('uv-filtro') < html.indexOf('id="human-title"'), 'el filtro va arriba de «Te toca»');
  assert.ok(html.indexOf('id="factory-title"') < html.indexOf('id="hija-title"'), 'su tarjeta va debajo de «Shiruvana ahora»');
  assert.match(html, /data-duena="shiruvana"/);
  const card = suTarjeta(html);
  assert.ok(card, 'su pendiente es una tarjeta con data-duena="shiruna"');
  assert.match(card, /De Shiruna/);
  assert.match(card, /Shiruna · BL-016/);
  assert.match(card, /Se lo respondés a Shiruna/);
  assert.match(card, /href="https:\/\/github\.com\/shiruna-gato-negro\/gw2-factory-dev\/tree\/main\/ai-memory"/);
  assert.ok(!card.includes('#/item/'), 'sus IDs nunca enlazan a mi memoria');
  assert.ok(!card.includes('<b>mi</b>'), 'su texto se escapa');
  assert.match(html, /<li class="gds-list__item" data-duena="shiruna">/);
  assert.match(html, /todavía no tengo motor/);
  assert.ok(!html.includes('<i>ya</i>'));
  assert.equal((html.match(/id="hija-title"/g) || []).length, 1);
});

test('sin Shiruna (o sin leerla) Hoy queda como antes; la cabecera y el veredicto cuentan lo de las dos', async () => {
  const solo = await mio();
  const html = V.renderHome(solo);
  assert.ok(!html.includes('uv-filtro'));
  assert.ok(!html.includes('data-duena="shiruna"'));
  const m = await conHija();
  assert.match(V.renderHeader(m, 'hoy', false), new RegExp(`>${m.human.length}<span class="gds-visually-hidden"> pendientes tuyos`));
  const sinLeer = unirHija(await mio(), buildHija({ files: {}, errors: { 'status.md': 'HTTP 500' } }, NOW, HIJA));
  assert.equal(sinLeer.human.length, solo.human.length);
  assert.match(V.renderHome(sinLeer), /No pude leer la memoria de Shiruna/);
});

test('con Shiruna, ninguna vista muestra undefined ni NaN', async () => {
  const m = await conHija();
  const all = [V.renderHome(m), V.renderWork(m), V.renderHealth(m), V.renderHeader(m, 'hoy', false)].join('');
  assert.ok(!all.includes('undefined'));
  assert.ok(!all.includes('NaN'));
});
