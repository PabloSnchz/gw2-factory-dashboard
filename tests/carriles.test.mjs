// Orden v9: «Sus dos carriles» de Shiruna en su tarjeta (js/carriles.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CARRILES_VERSION, VENTANA_MS, POR_PAGINA, DESDE_V9, slimCarriles, inicioVentana, loadCarriles, carrilDe,
  buildCarriles, renderCarriles, vestirCarriles,
} from '../js/carriles.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-11-28T15:10:00Z'); // 12:10 del 28/11 en Buenos Aires
const HIJA = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };
const URL_REPO = 'https://github.com/shiruna-gato-negro/gw2-factory-dev';
const c = (iso, msg, sha = 'a') => ({ sha: sha.repeat(40), msg, date: iso });

test('versión, ventana y carril', () => {
  assert.equal(CARRILES_VERSION, '1.0.0');
  assert.equal(VENTANA_MS, 7 * 24 * 3600000);
  assert.equal(carrilDe('[B] BL-063 paso 1/1 — algo — tests 9/9'), 'B');
  assert.equal(carrilDe('  [n] OP-001 FICHA — x'), 'N');
  assert.equal(carrilDe('orden: v9 dos carriles — recibida'), null);
  assert.equal(carrilDe('BL-061 [B] en el medio no cuenta'), null);
  assert.equal(carrilDe(null), null);
  assert.equal(inicioVentana(NOW), DESDE_V9, 'antes de la v9 no se cuenta');
  const tarde = Date.parse('2026-12-20T00:00:00Z');
  assert.equal(inicioVentana(tarde), tarde - VENTANA_MS);
});

test('loadCarriles: UNA llamada de hasta 100, su casillero propio y nunca lanza', async () => {
  const llamadas = [];
  const gh = { api: async (path, opts) => { llamadas.push([path, opts]); return []; } };
  assert.deepEqual(await loadCarriles({ gh, now: NOW, hija: HIJA }), []);
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0][0], '/repos/shiruna-gato-negro/gw2-factory-dev/commits?sha=main&per_page=100&since=2026-11-26T03:00:00.000Z');
  assert.equal(llamadas[0][1].slot, 'commits:hija7', 'no pisa el casillero de «Hoy hizo»');
  assert.equal(llamadas[0][1].shape, slimCarriles);
  assert.deepEqual(await loadCarriles({ gh: { api: async () => null }, now: NOW, hija: HIJA }), []);
  assert.equal(await loadCarriles({ gh: { api: async () => { throw new Error('x'); } }, now: NOW, hija: HIJA }), undefined);
  assert.equal(await loadCarriles({ now: NOW, hija: HIJA }), undefined);
  assert.deepEqual(slimCarriles([{ sha: 's', commit: { message: '[B] uno\n\ncuerpo', author: { date: 'd' } } }]), [{ sha: 's', msg: '[B] uno', date: 'd' }]);
});

const SEMANA = [
  c('2026-11-28T15:02:00Z', '[N] OP-002 FICHA — calculadora de cuotas', 'f'),
  c('2026-11-28T14:31:00Z', '[B] BL-064 paso 1/1 — cabeceras en celular — tests 1320/1326', 'e'),
  c('2026-11-28T14:05:00Z', '[N] OP-001 SEÑAL — x', 'd'),
  c('2026-11-28T14:01:00Z', '[N] OP-001 FICHA — x (mismo ciclo)', 'c'),
  c('2026-11-28T13:33:00Z', '[B] BL-063 paso 2/2 — y — tests 1318/1324', 'b'),
  c('2026-11-26T03:13:24Z', 'orden: v9 dos carriles — primer ciclo — tests 1310/1316', 'a'),
  c('2026-11-26T02:34:31Z', 'BL-061 paso 1/1 — antes de la v9', '9'),
];

test('buildCarriles: ciclos por carril (varios commits de una media hora son un ciclo), parejo y a quién le toca', () => {
  const k = buildCarriles({ commits: SEMANA, now: NOW });
  assert.equal(k.leidos, true);
  assert.deepEqual([k.B, k.N, k.sinCarril], [2, 2, 1], 'el de antes de la v9 no entra; la orden no tiene carril');
  assert.equal(k.parejo, true);
  assert.equal(k.toca, 'B', 'el último fue [N]: alterna');
  assert.equal(k.ultimo.N.sha[0], 'f');
  assert.equal(k.ultimo.B.sha[0], 'e');
  assert.equal(k.recortada, false);
  assert.equal(k.desde, DESDE_V9);
});

test('buildCarriles: desparejo, sin nada todavía, recortada y sin lectura', () => {
  const cargada = buildCarriles({ commits: [
    c('2026-11-28T15:00:00Z', '[B] 3'), c('2026-11-28T14:30:00Z', '[B] 2'), c('2026-11-28T14:00:00Z', '[B] 1'), c('2026-11-28T13:30:00Z', '[N] 1'),
  ], now: NOW });
  assert.deepEqual([cargada.B, cargada.N, cargada.dif, cargada.parejo, cargada.cargado, cargada.toca], [3, 1, 2, false, 'B', 'N']);
  const justo = buildCarriles({ commits: [c('2026-11-28T15:00:00Z', '[N] 2'), c('2026-11-28T14:30:00Z', '[N] 1')], now: NOW });
  assert.equal(justo.parejo, false, '2 a 0 ya se pasa de ±1');
  assert.equal(justo.toca, 'B');
  const uno = buildCarriles({ commits: [c('2026-11-28T15:00:00Z', '[N] 1')], now: NOW });
  assert.deepEqual([uno.parejo, uno.toca], [true, 'B'], '1 a 0 está dentro de ±1 y alterna');
  const vacio = buildCarriles({ commits: [], now: NOW });
  assert.deepEqual([vacio.B, vacio.N, vacio.toca], [0, 0, 'N'], 'el primer ciclo después de la orden es [N]');
  const cien = Array.from({ length: POR_PAGINA }, (_, i) => c(new Date(NOW - i * 60000).toISOString(), '[B] x'));
  const r = buildCarriles({ commits: cien, now: NOW });
  assert.equal(r.recortada, true);
  assert.equal(r.desde, NOW - (POR_PAGINA - 1) * 60000, 'la ventana real empieza en el más viejo que llegó');
  assert.deepEqual(buildCarriles({ commits: undefined, now: NOW }), { leidos: false });
});

test('renderCarriles: estado, le toca, cifras, el último de cada carril con su enlace y la ventana', () => {
  const html = renderCarriles(buildCarriles({ commits: SEMANA, now: NOW }), URL_REPO);
  assert.match(html, /<h3 class="gds-title-2">Sus dos carriles<\/h3>/);
  assert.match(html, /data-parejo="si"/);
  assert.match(html, /gds-status--success">Parejos</);
  assert.match(html, /Le toca: La Bóveda\. La regla: alternar y quedar parejos en 7 días \(±1\)\./);
  const cifras = [...html.matchAll(/<b>(\d+)<\/b><span>([^<]+)<\/span>/g)].map(x => [x[1], x[2]]);
  assert.deepEqual(cifras, [['2', 'ciclos en La Bóveda'], ['2', 'ciclos en Nuevas'], ['1', 'commit sin carril']]);
  assert.match(html, /<strong>La Bóveda<\/strong> · 28\/11 11:31 · BL-064 paso 1\/1 — cabeceras en celular — tests 1320\/1326 <a class="gds-ref" href="https:\/\/github\.com\/shiruna-gato-negro\/gw2-factory-dev\/commit\/e{40}" target="_blank" rel="noopener">e{7}<\/a>/);
  assert.match(html, /<strong>Nuevas<\/strong> · 28\/11 12:02 · OP-002 FICHA — calculadora de cuotas/);
  assert.match(html, /Desde el 26\/11 00:00\. Un ciclo es su media hora del cron\./);
  assert.doesNotMatch(html, /undefined|NaN|\[B\]|\[N\]/);
});

test('renderCarriles: desparejo, vacío, sin leer, recortada y texto escapado', () => {
  const mal = renderCarriles(buildCarriles({ commits: [c('2026-11-28T15:00:00Z', '[N] <img src=x>'), c('2026-11-28T14:30:00Z', '[N] 1')], now: NOW }), URL_REPO);
  assert.match(mal, /data-parejo="no"/);
  assert.match(mal, /gds-status--warning">Se cargó para Nuevas: 2 ciclos de diferencia</);
  assert.match(mal, /<strong>La Bóveda<\/strong> · todavía ningún ciclo\./);
  assert.match(mal, /&lt;img src=x&gt;/);
  assert.doesNotMatch(mal, /<img/);
  assert.match(renderCarriles(buildCarriles({ commits: [], now: NOW }), URL_REPO), /gds-status--info">Todavía sin ciclos con carril</);
  assert.match(renderCarriles({ leidos: false }, URL_REPO), /No pude leer sus commits de la semana/);
  const cien = Array.from({ length: POR_PAGINA }, (_, i) => c(new Date(NOW - i * 60000).toISOString(), '[B] x'));
  assert.match(renderCarriles(buildCarriles({ commits: cien, now: NOW }), URL_REPO), /En sus últimos 100 commits, desde el 28\/11 10:31\./);
  assert.equal(renderCarriles(null, URL_REPO), '');
});

function fakeRoot({ conCard = true, conStack = true } = {}) {
  const stack = { inner: '', insertAdjacentHTML(pos, html) { assert.equal(pos, 'beforeend'); this.inner += html; } };
  const card = {
    inner: '',
    insertAdjacentHTML(pos, html) { this.inner += html; },
    querySelector(s) {
      if (s === '.uv-hija-carriles') return (stack.inner + this.inner).includes('uv-hija-carriles') ? {} : null;
      if (s === '.gds-stack') return conStack ? stack : null;
      return null;
    },
  };
  return { card, stack, querySelector: (s) => (s === 'section.uv-hija' && conCard ? card : null) };
}

test('vestirCarriles: al final de su tarjeta, una sola vez; nunca rompe', () => {
  const k = buildCarriles({ commits: SEMANA, now: NOW });
  const r = fakeRoot();
  vestirCarriles(r, k, URL_REPO);
  vestirCarriles(r, k, URL_REPO);
  assert.equal((r.stack.inner.match(/class="uv-hija-carriles"/g) || []).length, 1);
  const sinStack = fakeRoot({ conStack: false });
  vestirCarriles(sinStack, k, URL_REPO);
  assert.match(sinStack.card.inner, /Sus dos carriles/);
  assert.doesNotThrow(() => vestirCarriles(fakeRoot({ conCard: false }), k, URL_REPO));
  assert.doesNotThrow(() => vestirCarriles(null, k, URL_REPO));
  assert.doesNotThrow(() => vestirCarriles(fakeRoot(), null, URL_REPO));
  assert.doesNotThrow(() => vestirCarriles({ querySelector() { throw new Error('x'); } }, k, URL_REPO));
});

test('app.js: lee la semana después de «Hoy hizo», arma los carriles después de su día y los pone después de él', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ loadCarriles, buildCarriles, vestirCarriles \} from '\.\/carriles\.js';/);
  assert.match(app, /const commitsHija = await loadCommitsHija\(\{ gh, now \}\);[^\n]*\n\s*const semanaHija = await loadCarriles\(\{ gh, now \}\);/);
  assert.match(app, /state\.model\.dia = buildDia\([^\n]*\n\s*state\.model\.carriles = buildCarriles\(\{ commits: semanaHija, now \}\);/);
  assert.match(app, /vestirDia\(\$main, m\.dia, HIJA_REPO\);[^\n]*\n\s*vestirCarriles\(\$main, m\.carriles, HIJA_REPO\);/);
  assert.match(read('index.html'), /src="js\/app\.js\?v=2\.(1[7-9]|[2-9]\d)\.0"/, 'el navegador pide una versión que ya trae los carriles (2.17.0 o posterior)');
});
