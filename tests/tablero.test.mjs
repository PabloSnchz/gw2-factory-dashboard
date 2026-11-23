// SH-4b: el tablero de Shiruna en «Trabajo» (js/tablero.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TABLERO_VERSION, sinFecha, progresos, buildTablero, renderTablero, vestirTablero,
} from '../js/tablero.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const HIJA = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };
const h = { leida: true, nombre: 'Shiruna', key: 'shiruna' };
const BACKLOG = `# Backlog de Shiruna

## READY

- [BL-006] [MEDIO] Metas por file:// — Problema: sin explicación; Tamaño: chico — 2026-11-22
- [BL-007] [ALTO] Sidebar con <i>key</i> — Problema: bloqueo — 2026-11-22
- esto no respeta el formato

## IN_PROGRESS

- [BL-005] [MEDIO] Modal de keys — Problema: bloquea la UI <b>x</b> — 2026-11-22

## BLOCKED

## DONE

- [BL-000] [ALTO] Nacer — 2026-11-21
- [BL-001] [ALTO] Motor — 2026-11-21
- [BL-003] [MEDIO] README — 2026-11-21
- [BL-004] [MEDIO] Duplicados — 2026-11-22
- [BL-009] [BAJO] Nueve — 2026-11-22
- [BL-010] [BAJO] Diez — 2026-11-22
`;
const raw = (b = BACKLOG) => ({ files: { 'backlog.md': b }, errors: {} });
const PULSO = { items: [
  { bl: 'BL-005', paso: 2, de: 3, que: 'el modal espera al clic', t: 3 },
  { bl: 'BL-005', paso: 1, de: 3, que: 'test que falla', t: 2 },
  { bl: null, paso: null, de: null, que: null, t: 1 },
] };
const tab = (o = {}) => buildTablero({ raw: raw(), h, pulso: PULSO, hija: HIJA, ...o });

test('versión', () => {
  assert.equal(TABLERO_VERSION, '1.1.0');
});

test('sinFecha: saca la fecha final del detalle y nada más', () => {
  assert.equal(sinFecha('Problema: x; Riesgo: bajo — 2026-11-22'), 'Problema: x; Riesgo: bajo');
  assert.equal(sinFecha('2026-11-22'), '');
  assert.equal(sinFecha('desde 2026-11-22 hasta hoy'), 'desde 2026-11-22 hasta hoy');
  assert.equal(sinFecha(null), '');
});

test('progresos: el paso más nuevo de cada tarea; sin pulso, vacío', () => {
  assert.deepEqual(progresos(PULSO), { 'BL-005': { paso: 2, de: 3, que: 'el modal espera al clic', t: 3 } });
  assert.deepEqual(progresos(null), {});
  assert.deepEqual(progresos({ items: [] }), {});
});

test('buildTablero: sin hija leída no hay tablero; sin backlog, lo dice', () => {
  assert.equal(buildTablero({ raw: raw(), h: null, hija: HIJA }), null);
  assert.equal(buildTablero({ raw: raw(), h: { leida: false }, hija: HIJA }), null);
  const t = buildTablero({ raw: { files: { 'backlog.md': null }, errors: { 'backlog.md': 'no existe' } }, h, hija: HIJA });
  assert.equal(t.leido, false);
  assert.equal(t.error, 'no existe');
  assert.equal(buildTablero({ raw: null, h, hija: HIJA }).error, 'sin dato');
});

test('buildTablero: columnas en su orden, hechas al revés, progreso solo fuera de Hecho, líneas rotas contadas', () => {
  const t = tab();
  assert.equal(t.leido, true);
  assert.equal(t.url, 'https://github.com/shiruna-gato-negro/gw2-factory-dev/blob/main/ai-memory/backlog.md');
  assert.deepEqual(t.READY.map(x => x.id), ['BL-006', 'BL-007'], 'la fila respeta su orden');
  assert.deepEqual(t.IN_PROGRESS.map(x => x.id), ['BL-005']);
  assert.deepEqual(t.DONE.map(x => x.id), ['BL-010', 'BL-009', 'BL-004', 'BL-003', 'BL-001', 'BL-000']);
  assert.equal(t.IN_PROGRESS[0].progreso.paso, 2);
  assert.equal(t.READY[0].progreso, null);
  assert.equal(t.READY[0].detalle, 'Problema: sin explicación; Tamaño: chico');
  assert.equal(t.malformadas, 1);
  const conDone = buildTablero({ raw: raw(BACKLOG.replace('[BL-010]', '[BL-005]')), h, pulso: PULSO, hija: HIJA });
  assert.equal(conDone.DONE[0].progreso, null, 'lo cerrado no muestra paso');
});

test('renderTablero: sus IDs nunca se enlazan a mi memoria y enlaza a su backlog', () => {
  const html = renderTablero(tab());
  assert.match(html, /data-duena="shiruna"/);
  assert.match(html, /04 · El tablero de Shiruna/);
  assert.match(html, /<span class="gds-ref">BL-005<\/span>/);
  assert.doesNotMatch(html, /#\/item\//, 'ni un enlace a mis ítems');
  assert.match(html, /href="https:\/\/github\.com\/shiruna-gato-negro\/gw2-factory-dev\/blob\/main\/ai-memory\/backlog\.md"/);
  assert.match(html, /Su repo lo manda ella/);
});

test('renderTablero: la próxima de la fila, el paso de hoy, hechas con tope y escape', () => {
  const html = renderTablero(tab());
  const fila = html.slice(html.indexOf('board__col--ready'), html.indexOf('board__col--done'));
  assert.equal((fila.match(/La próxima/g) || []).length, 1);
  assert.ok(fila.indexOf('La próxima') < fila.indexOf('BL-007'), 'la marca va en la primera');
  assert.match(html, /paso 2\/3<\/span> el modal espera al clic/);
  assert.match(html, /En curso <span class="gds-caption gds-text-muted">\(1\)/);
  assert.match(html, /Hecho <span class="gds-caption gds-text-muted">\(6\)/);
  const hecho = html.slice(html.indexOf('board__col--done'));
  assert.match(hecho, /<summary class="gds-caption">Ver 1 más<\/summary>/, 'de 6 hechas, 5 a la vista y 1 plegada');
  assert.ok(hecho.indexOf('>BL-000<') > hecho.indexOf('Ver 1 más'), 'la más vieja no se pierde: queda plegada');
  assert.match(hecho, /aria-label="Shiruna · Hecho: 1 más"/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>x<\/b>/);
  assert.match(html, /Sidebar con &lt;i&gt;key&lt;\/i&gt;/, 'el título también se escapa');
  assert.match(html, /1 línea de su backlog no respeta el formato y no se muestra\./);
  assert.match(html, /Bloqueado <span class="gds-caption gds-text-muted">\(0\)<\/span><\/h3><\/div>\s*<p class="gds-body-2 gds-text-muted">Vacío/);
});

test('renderTablero: sin backlog lo dice; sin tablero, nada', () => {
  assert.equal(renderTablero(null), '');
  const html = renderTablero({ nombre: 'Shiruna', key: 'shiruna', url: 'u', leido: false, error: 'HTTP 500' });
  assert.match(html, /No pude leer el backlog de Shiruna/);
  assert.match(html, /backlog\.md: HTTP 500/);
});

function fakeRoot({ trabajo = true, ya = false } = {}) {
  const root = {
    html: '',
    querySelector(sel) {
      if (sel === '#roadmap-title') return trabajo ? {} : null;
      if (sel === '.uv-tablero-hija') return ya || root.html ? {} : null;
      return null;
    },
    insertAdjacentHTML(pos, html) { root.pos = pos; root.html += html; },
  };
  return root;
}

test('vestirTablero: solo en Trabajo, al final, una sola vez; nunca rompe', () => {
  const r = fakeRoot();
  vestirTablero(r, tab());
  assert.equal(r.pos, 'beforeend');
  assert.match(r.html, /uv-tablero-hija/);
  const largo = r.html.length;
  vestirTablero(r, tab());
  assert.equal(r.html.length, largo, 'no se duplica');
  const hoy = fakeRoot({ trabajo: false });
  vestirTablero(hoy, tab());
  assert.equal(hoy.html, '', 'fuera de Trabajo no aparece');
  assert.doesNotThrow(() => vestirTablero(null, tab()));
  assert.doesNotThrow(() => vestirTablero(fakeRoot(), null));
  assert.doesNotThrow(() => vestirTablero({ querySelector() { throw new Error('x'); } }, tab()));
});

test('app.js: arma su tablero después del pulso y lo pone después de «Hoy hizo»', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ buildTablero, vestirTablero \} from '\.\/tablero\.js';/);
  assert.match(app, /state\.model\.pulso = buildPulso\([^\n]*\n\s*state\.model\.tablero = buildTablero\(\{ raw: hija, h: state\.model\.hija, pulso: state\.model\.pulso \}\);/);
  assert.match(app, /vestirPulso\(\$main, m\.pulso, HIJA_REPO\);[^\n]*\n\s*vestirTablero\(\$main, m\.tablero\);/);
  assert.match(read('index.html'), /src="js\/app\.js\?v=2\.(1\d|[2-9]\d)\.0"/, 'el navegador pide una versión que ya trae el tablero (2.10.0 o posterior)');
});
