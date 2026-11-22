// SH-4a: «Hoy hizo» — el seguimiento del trabajo de Shiruna en su tarjeta (js/pulso.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PULSO_VERSION, UMBRAL, inicioDia, slimHija, loadCommitsHija, leerCommit, vida, buildPulso, renderPulso, vestirPulso,
} from '../js/pulso.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-11-23T02:30:00Z'); // 23:30 del 22/11 en Buenos Aires
const HIJA = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };
const URL_REPO = 'https://github.com/shiruna-gato-negro/gw2-factory-dev';
const BACKLOG = '# Backlog\n\n## READY\n\n- [BL-006] [MEDIO] Metas — x — 2026-11-22\n- [BL-007] [MEDIO] Sidebar — x — 2026-11-22\n\n## IN_PROGRESS\n\n- [BL-005] [MEDIO] Modal — x — 2026-11-22\n\n## BLOCKED\n\n## DONE\n';
const raw = (backlog = BACKLOG) => ({ files: { 'backlog.md': backlog } });
const h = (actualizadoMs = 3 * 3600000) => ({ leida: true, actualizadoMs });
const commit = (min, msg, sha = 'a'.repeat(40)) => ({ sha, msg, date: new Date(NOW - min * 60000).toISOString() });
const DIA = [
  commit(10, 'BL-005 paso 2/2 — el modal ya no se abre solo — tests 17/17', 'c'.repeat(40)),
  commit(40, 'BL-005 paso 1/2 — test que falla sin el cambio — tests 16/16', 'b'.repeat(40)),
  commit(70, 'DEC-007: autonomia y ciclo continuo'),
];

test('versión y umbrales', () => {
  assert.equal(PULSO_VERSION, '1.0.0');
  assert.deepEqual(UMBRAL, { activaMs: 45 * 60000, alertaMs: 2 * 3600000 });
});

test('inicioDia: medianoche de Buenos Aires (03:00 UTC), también pasada la medianoche UTC', () => {
  assert.equal(new Date(inicioDia(NOW)).toISOString(), '2026-11-22T03:00:00.000Z');
  assert.equal(new Date(inicioDia(Date.parse('2026-11-23T03:00:00Z'))).toISOString(), '2026-11-23T03:00:00.000Z');
  assert.equal(new Date(inicioDia(Date.parse('2026-11-23T02:59:59Z'))).toISOString(), '2026-11-22T03:00:00.000Z');
});

test('slimHija: solo sha, primera línea del mensaje y fecha', () => {
  const s = slimHija([{ sha: 'x', commit: { message: 'uno\n\ncuerpo', committer: { date: '2026-11-22T10:00:00Z' }, author: { name: 'n' } }, extra: 1 }]);
  assert.deepEqual(s, [{ sha: 'x', msg: 'uno', date: '2026-11-22T10:00:00Z' }]);
  assert.equal(slimHija(null), null);
});

test('loadCommitsHija: UNA llamada, sus commits desde la medianoche, casillero fijo y nunca lanza', async () => {
  const llamadas = [];
  const gh = { api: async (path, opts) => { llamadas.push([path, opts]); return [{ sha: 's', msg: 'm', date: 'd' }]; } };
  const r = await loadCommitsHija({ gh, now: NOW, hija: HIJA });
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0][0], '/repos/shiruna-gato-negro/gw2-factory-dev/commits?sha=main&per_page=50&since=2026-11-22T03:00:00.000Z');
  assert.equal(llamadas[0][1].slot, 'commits:hija');
  assert.equal(llamadas[0][1].shape, slimHija);
  assert.equal(llamadas[0][1].allow404, true);
  assert.equal(r.length, 1);
  assert.deepEqual(await loadCommitsHija({ gh: { api: async () => null }, now: NOW, hija: HIJA }), [], '404: sin commits');
  assert.equal(await loadCommitsHija({ gh: { api: async () => undefined }, now: NOW, hija: HIJA }), undefined, 'sin API: sin dato');
  assert.equal(await loadCommitsHija({ gh: { api: async () => { throw new Error('x'); } }, now: NOW, hija: HIJA }), undefined);
  assert.equal(await loadCommitsHija({ now: NOW, hija: HIJA }), undefined);
});

test('leerCommit: el formato pedido, variantes tolerables y lo que no trae queda null', () => {
  assert.deepEqual(leerCommit('BL-005 paso 1/2 — test que falla — tests 16/16'),
    { texto: 'BL-005 paso 1/2 — test que falla — tests 16/16', bl: 'BL-005', paso: 1, de: 2, que: 'test que falla', pass: 16, total: 16 });
  const v = leerCommit('BL-007 Paso 3 / 4 - sidebar - tests: 15/18');
  assert.deepEqual([v.bl, v.paso, v.de, v.que, v.pass, v.total], ['BL-007', 3, 4, 'sidebar', 15, 18]);
  const o = leerCommit('orden: ciclo continuo');
  assert.deepEqual([o.bl, o.paso, o.que, o.pass], [null, null, null, null]);
  assert.equal(leerCommit('BL-005 paso 1/1 — tests 3/3').que, null, '«tests» no es el qué');
});

test('vida: activa, hace un rato, sin actividad con trabajo en cola, descansando', () => {
  assert.equal(vida(null, 3).level, 'info');
  assert.equal(vida(10 * 60000, 3).level, 'ok');
  assert.equal(vida(44 * 60000, 3).level, 'ok');
  assert.equal(vida(45 * 60000, 3).level, 'warn');
  assert.equal(vida(119 * 60000, 3).level, 'warn');
  assert.equal(vida(121 * 60000, 3).level, 'critical');
  assert.match(vida(121 * 60000, 3).text, /PC está apagada o suspendida/);
  assert.equal(vida(10 * 3600000, 0).level, 'info', 'sin trabajo en cola no es una alarma');
  assert.match(vida(10 * 3600000, 0).text, /Descansando/);
});

test('buildPulso: pasos, tareas cerradas, últimos tests, cola y último movimiento', () => {
  const p = buildPulso({ commits: DIA, raw: raw(), h: h(), now: NOW });
  assert.equal(p.leidos, true);
  assert.deepEqual(p.items.map(i => i.sha[0]), ['c', 'b', 'a'], 'lo último primero');
  assert.equal(p.pasos, 2);
  assert.deepEqual(p.cerradas, ['BL-005']);
  assert.deepEqual(p.tests, { pass: 17, total: 17, verde: true }, 'los del último commit que trae tests');
  assert.equal(p.enCola, 3);
  assert.equal(p.ultimaMs, 10 * 60000, 'el commit más reciente, no el status de hace 3 h');
  assert.equal(p.vida.level, 'ok');
});

test('buildPulso: sin commits hoy usa la última actualización de status.md; sin leer, sin dato', () => {
  const p = buildPulso({ commits: [], raw: raw(), h: h(20 * 60000), now: NOW });
  assert.equal(p.ultimaMs, 20 * 60000);
  assert.equal(p.vida.level, 'ok');
  const viejo = buildPulso({ commits: [], raw: raw(), h: h(5 * 3600000), now: NOW });
  assert.equal(viejo.vida.level, 'critical', 'cinco horas quieta con 3 en cola');
  const sinCola = buildPulso({ commits: [], raw: raw('# Backlog\n\n## READY\n\n## DONE\n'), h: h(5 * 3600000), now: NOW });
  assert.equal(sinCola.vida.level, 'info');
  const sinLeer = buildPulso({ commits: undefined, raw: raw(), h: h(), now: NOW });
  assert.equal(sinLeer.leidos, false);
  assert.equal(sinLeer.pasos, 0);
  assert.equal(sinLeer.tests, null);
  assert.equal(buildPulso({ commits: DIA, raw: raw(), h: { leida: false }, now: NOW }), null);
  assert.equal(buildPulso({ commits: DIA, raw: raw(), h: null, now: NOW }), null);
});

test('buildPulso: tests en rojo se notan; commits sin fecha se ignoran', () => {
  const p = buildPulso({ commits: [commit(5, 'BL-006 paso 1/3 — algo — tests 14/16'), { sha: 'z', msg: 'x', date: null }], raw: raw(), h: h(), now: NOW });
  assert.equal(p.items.length, 1);
  assert.deepEqual(p.tests, { pass: 14, total: 16, verde: false });
  assert.deepEqual(p.cerradas, []);
});

test('renderPulso: título, vida, cifras, línea de tiempo con hora de Buenos Aires y enlaces a sus commits', () => {
  const html = renderPulso(buildPulso({ commits: DIA, raw: raw(), h: h(), now: NOW }), URL_REPO);
  assert.match(html, /<h3 class="gds-title-2">Hoy hizo<\/h3>/);
  assert.match(html, /data-vida="ok"/);
  assert.match(html, /gds-status--success">Activa</);
  assert.match(html, /Último movimiento: hace 10 min · 3 en cola\./);
  const cifras = [...html.matchAll(/<p class="uv-cifra( uv-cifra--cero)?"><b>(\d+)<\/b><span>([^<]+)<\/span><\/p>/g)].map(x => [x[2], x[3]]);
  assert.deepEqual(cifras, [['2', 'pasos hoy'], ['1', 'tarea cerrada'], ['17', 'tests (17/17)']]);
  assert.match(html, /aria-label="Lo de Shiruna hoy, en números"/);
  const items = [...html.matchAll(/<li class="gds-timeline__item"><span class="gds-timeline__time">([^<]+)<\/span>/g)].map(x => x[1]);
  assert.deepEqual(items, ['23:20', '22:50', '22:20'], 'hora de Buenos Aires, lo último primero');
  assert.match(html, /<strong>BL-005<\/strong> · paso 2\/2 · el modal ya no se abre solo <span class="gds-status gds-status--success">tests 17\/17<\/span>/);
  assert.match(html, /href="https:\/\/github\.com\/shiruna-gato-negro\/gw2-factory-dev\/commit\/c{40}"[^>]*>c{7}<\/a>/);
  assert.match(html, />DEC-007: autonomia y ciclo continuo </, 'lo que no trae el formato se muestra tal cual');
  assert.doesNotMatch(html, /undefined|NaN/);
});

test('renderPulso: sin commits, sin leer, tests en rojo, alarma, muchos commits y texto escapado', () => {
  assert.match(renderPulso(buildPulso({ commits: [], raw: raw(), h: h(20 * 60000), now: NOW }), URL_REPO), /Todavía no hizo nada hoy\./);
  const sin = renderPulso(buildPulso({ commits: undefined, raw: raw(), h: h(), now: NOW }), URL_REPO);
  assert.match(sin, /No pude leer sus commits de hoy/);
  assert.match(sin, /<b>0<\/b><span>tests sin dato<\/span>/);
  assert.match(renderPulso(buildPulso({ commits: [commit(5, 'BL-006 paso 1/3 — x — tests 14/16')], raw: raw(), h: h(), now: NOW }), URL_REPO),
    /gds-status--danger">tests 14\/16</);
  const alarma = renderPulso(buildPulso({ commits: [], raw: raw(), h: h(5 * 3600000), now: NOW }), URL_REPO);
  assert.match(alarma, /data-vida="critical"/);
  assert.match(alarma, /gds-status--danger">Sin actividad con trabajo en cola/);
  const muchos = Array.from({ length: 15 }, (_, i) => commit(i + 1, `BL-008 paso ${i + 1}/15 — p — tests 9/9`));
  const largo = renderPulso(buildPulso({ commits: muchos, raw: raw(), h: h(), now: NOW }), URL_REPO);
  assert.equal((largo.match(/gds-timeline__item/g) || []).length, 12);
  assert.match(largo, /y 3 más en GitHub/);
  const evil = renderPulso(buildPulso({ commits: [commit(5, '<img src=x onerror=alert(1)>')], raw: raw(), h: h(), now: NOW }), URL_REPO);
  assert.ok(!evil.includes('<img'), 'su texto se escapa');
  assert.equal(renderPulso(null, URL_REPO), '');
});

/** DOM mínimo: la tarjeta, su .gds-stack y HTML insertado como texto. */
function fakeRoot({ conCard = true, conStack = true } = {}) {
  const stack = { inner: '', insertAdjacentHTML(pos, html) { assert.equal(pos, 'beforeend'); this.inner += html; } };
  const card = {
    inner: '',
    insertAdjacentHTML(pos, html) { this.inner += html; },
    querySelector(s) {
      if (s === '.uv-hija-hoy') return (stack.inner + this.inner).includes('uv-hija-hoy') ? {} : null;
      if (s === '.gds-stack') return conStack ? stack : null;
      return null;
    },
  };
  return { card, stack, querySelector: (s) => (s === 'section.uv-hija' && conCard ? card : null) };
}

test('vestirPulso: al final de su tarjeta, una sola vez; sin tarjeta, sin DOM o con el DOM roto, nada', () => {
  const p = buildPulso({ commits: DIA, raw: raw(), h: h(), now: NOW });
  const r = fakeRoot();
  vestirPulso(r, p, URL_REPO);
  vestirPulso(r, p, URL_REPO);
  assert.equal((r.stack.inner.match(/class="uv-hija-hoy"/g) || []).length, 1);
  const sinStack = fakeRoot({ conStack: false });
  vestirPulso(sinStack, p, URL_REPO);
  assert.match(sinStack.card.inner, /Hoy hizo/);
  assert.doesNotThrow(() => vestirPulso(fakeRoot({ conCard: false }), p, URL_REPO));
  assert.doesNotThrow(() => vestirPulso(null, p, URL_REPO));
  assert.doesNotThrow(() => vestirPulso(fakeRoot(), null, URL_REPO));
  assert.doesNotThrow(() => vestirPulso({ querySelector() { throw new Error('x'); } }, p, URL_REPO));
});

test('app.js: lee sus commits después de las memorias y pone «Hoy hizo» después de vestirla a ella y a Pablo', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ loadCommitsHija, buildPulso, vestirPulso \} from '\.\/pulso\.js';/);
  assert.match(app, /Promise\.all\(\[loadAll\(gh, now\), loadHija\(\{ now \}\)\]\);\n\s*const commitsHija = await loadCommitsHija\(\{ gh, now \}\);/);
  assert.match(app, /state\.model\.pulso = buildPulso\(\{ commits: commitsHija, raw: hija, h: state\.model\.hija, now \}\);/);
  assert.match(app, /vestirPablo\(\$main, m\);[^\n]*\n\s*vestirPulso\(\$main, m\.pulso, HIJA_REPO\);/);
  assert.match(app, /const HIJA_REPO = `https:\/\/github\.com\/\$\{CONFIG\.hija\.owner\}\/\$\{CONFIG\.hija\.repo\}`;/);
  assert.match(read('index.html'), /src="js\/app\.js\?v=2\.9\.0"/, 'el navegador pide la versión nueva');
});
