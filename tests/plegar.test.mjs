// Tablero con altura de 5 tarjetas, sin perder nada (js/plegar.js): pedido de Pablo, mi «Hecho» no tenía fin.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PLEGAR_VERSION, VISIBLES, recientesPrimero, plegarColumna } from '../js/plegar.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const li = (n) => `<li>t${n}</li>`;
const it = (id, fecha) => ({ id, fecha: fecha ? new Date(fecha + 'T00:00:00Z') : null });

test('versión y cinco a la vista', () => {
  assert.equal(PLEGAR_VERSION, '1.0.0');
  assert.equal(VISIBLES, 5);
});

test('plegarColumna: hasta 5, sin plegado', () => {
  const html = plegarColumna([1, 2, 3, 4, 5].map(li));
  assert.equal(html, `<ul class="gds-list">${[1, 2, 3, 4, 5].map(li).join('')}</ul>`);
  assert.equal(plegarColumna([]), '<ul class="gds-list"></ul>');
});

test('plegarColumna: más de 5, el resto plegado con scroll propio y nada se pierde', () => {
  const lis = Array.from({ length: 12 }, (_, i) => li(i + 1));
  const html = plegarColumna(lis, { nombre: 'Hecho <x>' });
  const [vista, plegado] = html.split('<details');
  assert.equal((vista.match(/<li>/g) || []).length, 5, 'a la vista, cinco');
  assert.equal((plegado.match(/<li>/g) || []).length, 7, 'plegadas, las otras siete');
  for (const l of lis) assert.equal(html.split(l).length - 1, 1, `${l} aparece una sola vez`);
  assert.ok(vista.includes('t5') && !vista.includes('t6'), 'en orden');
  assert.match(html, /<details class="uv-mas"><summary class="gds-caption">Ver 7 más<\/summary>/);
  assert.match(html, /<div class="uv-mas__txt gds-body-2" tabindex="0" role="region" aria-label="Hecho &lt;x&gt;: 7 más">/, 'región con nombre escapado, enfocable para desplazar con teclado');
  assert.match(plegarColumna(lis, { max: 10 }), /Ver 2 más/);
});

test('plegarColumna: el plegado usa el estilo con scroll propio que ya existe', () => {
  const uv = read('css/universo.css');
  assert.match(uv, /\.uv-mas__txt \{[^}]*max-height: 40vh; overflow-y: auto;/);
  assert.match(uv, /\.uv-mas summary \{/);
});

test('recientesPrimero: por fecha, sin fecha al final, a igual fecha manda el archivo', () => {
  const arriba = [it('A', '2026-11-19'), it('B', '2026-11-19'), it('C', '2026-10-24'), it('D', null), it('E', '2026-11-20')];
  assert.deepEqual(recientesPrimero(arriba).map(x => x.id), ['E', 'A', 'B', 'C', 'D'], 'yo agrego arriba');
  const abajo = [it('A', '2026-11-21'), it('B', '2026-11-21'), it('C', '2026-11-22'), it('D', '2026-11-22')];
  assert.deepEqual(recientesPrimero(abajo, { nuevasAlFinal: true }).map(x => x.id), ['D', 'C', 'B', 'A'], 'Shiruna agrega abajo');
  assert.deepEqual(arriba.map(x => x.id), ['A', 'B', 'C', 'D', 'E'], 'no modifica la lista original');
  assert.deepEqual(recientesPrimero(null), []);
});

// Integración con mi tablero: solo donde existe el panel completo (en CI siempre).
const PANEL = existsSync(new URL('./helpers.mjs', import.meta.url));

test('mi tablero: «Hecho» con 12 tareas muestra 5 (las más nuevas), pliega 7 y cuenta 12', { skip: !PANEL }, async () => {
  const { createGitHub, memoryStorage } = await import('../js/github.js');
  const { loadAll } = await import('../js/loader.js');
  const { buildModel } = await import('../js/model.js');
  const V = await import('../js/views.js');
  const { readMemory, mockFetch, NOW } = await import('./helpers.mjs');
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(readMemory()), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  const m = buildModel(await loadAll(gh, NOW));
  const done = Array.from({ length: 12 }, (_, i) => ({
    id: `BL-${String(900 + i)}`, prioridad: 'MEDIO', titulo: `Hecha ${900 + i}`, detalle: '', refs: [], seccion: 'DONE',
    fecha: new Date(Date.UTC(2026, 9, 1 + (i * 7) % 12)),
  }));
  m.backlog = { ...m.backlog, DONE: done };
  const html = V.renderWork(m);
  const col = html.slice(html.indexOf('board__col--done'), html.indexOf('</section>', html.indexOf('board__col--done')));
  assert.match(col, /class="gds-count">12</, 'el conteo sigue siendo el total');
  const [vista, plegado] = col.split('<details');
  assert.equal((vista.match(/class="gds-list__item ticket"/g) || []).length, 5);
  assert.equal((plegado.match(/class="gds-list__item ticket"/g) || []).length, 7);
  assert.match(col, /Ver 7 más/);
  const orden = [...col.matchAll(/Hecha (\d+)/g)].map(x => Number(x[1]));
  const fechas = orden.map(n => done.find(d => d.titulo === `Hecha ${n}`).fecha.getTime());
  assert.deepEqual(fechas, [...fechas].sort((a, b) => b - a), 'de lo más nuevo a lo más viejo');
  assert.equal(orden.length, 12, 'ninguna se pierde');
});

test('views.js y tablero.js usan el plegado', () => {
  assert.match(read('js/views.js'), /import \{ recientesPrimero, plegarColumna \} from '\.\/plegar\.js';/);
  assert.match(read('js/views.js'), /plegarColumna\(\(k === 'DONE' \? recientesPrimero\(b\[k\]\) : b\[k\]\)/);
  assert.match(read('js/tablero.js'), /plegarColumna\(all\.map/);
});
