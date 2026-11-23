// SH-4c: la salud de Shiruna en «Salud» (js/alertas.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALERTAS_VERSION, buildAlertas, renderAlertas, vestirAlertas } from '../js/alertas.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const h = (o = {}) => ({ leida: true, nombre: 'Shiruna', key: 'shiruna', estado: { level: 'info', text: 'Esperándote' }, motivo: null, ...o });
const c = (sha, o = {}) => ({ sha: sha.repeat(40), bl: 'BL-005', paso: null, de: null, pass: null, total: null, ...o });
const pulso = (items = [], o = {}) => ({ leidos: true, items, enCola: 5, vida: { level: 'ok', text: 'Activa' }, ...o });
const tablero = (o = {}) => ({ leido: true, BLOCKED: [], malformadas: 0, ...o });
const ids = (a) => a.checks.map(x => x.id);

test('versión', () => assert.equal(ALERTAS_VERSION, '1.0.0'));

test('sin hija leída no hay alertas; sana, en orden', () => {
  assert.equal(buildAlertas({ h: null }), null);
  assert.equal(buildAlertas({ h: { leida: false } }), null);
  const a = buildAlertas({ pulso: pulso([c('a', { paso: 1, de: 2, pass: 16, total: 16 })]), h: h(), tablero: tablero() });
  assert.deepEqual(a.checks, []);
  assert.equal(a.nivel, 'ok');
  assert.equal(buildAlertas({ h: h() }).nivel, 'ok', 'sin pulso ni tablero tampoco inventa alertas');
});

test('quieta con trabajo en cola: crítico; «hace un rato» no alarma', () => {
  const a = buildAlertas({ pulso: pulso([], { vida: { level: 'critical', text: 'Sin actividad con trabajo en cola.' } }), h: h() });
  assert.deepEqual(ids(a), ['hija:quieta']);
  assert.equal(a.nivel, 'critical');
  assert.match(a.checks[0].detail, /Tiene 5 en cola/);
  assert.deepEqual(ids(buildAlertas({ pulso: pulso([], { vida: { level: 'warn', text: 'x' } }), h: h() })), []);
});

test('tests en rojo y tests que bajan: críticos, mirando el último conteo', () => {
  const rojo = buildAlertas({ pulso: pulso([c('b', { pass: 15, total: 16 }), c('a', { pass: 16, total: 16 })]), h: h() });
  assert.deepEqual(ids(rojo), ['hija:rojo']);
  assert.match(rojo.checks[0].detail, /15\/16 \(bbbbbbb\)/);
  const bajan = buildAlertas({ pulso: pulso([c('c', { pass: 14, total: 14 }), c('b', { pass: 17, total: 17 }), c('a', { pass: 16, total: 16 })]), h: h() });
  assert.deepEqual(ids(bajan), ['hija:bajan']);
  assert.match(bajan.checks[0].detail, /llegó a 17 y su último commit dice 14/);
  const arreglado = buildAlertas({ pulso: pulso([c('b', { pass: 17, total: 17 }), c('a', { pass: 15, total: 16 })]), h: h() });
  assert.deepEqual(ids(arreglado), [], 'un rojo viejo ya corregido no alarma');
  assert.deepEqual(ids(buildAlertas({ pulso: pulso([c('a', { pass: 3, total: 3 })]), h: h() })), [], 'un solo conteo no puede bajar');
});

test('pasos sin tests: aviso con los commits; las órdenes y decisiones no cuentan', () => {
  const a = buildAlertas({ pulso: pulso([c('d', { paso: 2, de: 3 }), c('e', { bl: null }), c('f', { paso: 1, de: 3 })]), h: h() });
  assert.deepEqual(ids(a), ['hija:sintests']);
  assert.equal(a.checks[0].level, 'warn');
  assert.match(a.checks[0].title, /2 pasos sin decir sus tests/);
  assert.match(a.checks[0].detail, /ddddddd, fffffff/);
  assert.match(buildAlertas({ pulso: pulso([c('d', { paso: 2, de: 3 })]), h: h() }).checks[0].title, /un paso sin decir/);
});

test('trabada: por su estado o por tareas en Bloqueado', () => {
  const a = buildAlertas({ h: h({ estado: { text: 'Bloqueada' }, motivo: '3 ciclos fallidos' }), tablero: tablero({ BLOCKED: [{ id: 'BL-007' }] }) });
  assert.deepEqual(ids(a), ['hija:bloqueada']);
  assert.match(a.checks[0].detail, /BLOQUEADA: 3 ciclos fallidos\. En «Bloqueado»: BL-007\./);
  assert.equal(a.checks[0].source, 'declarado');
  assert.deepEqual(ids(buildAlertas({ h: h(), tablero: tablero({ BLOCKED: [{ id: 'BL-002' }] }) })), ['hija:bloqueada']);
});

test('sin datos: informativos; y todo ordenado de lo más grave a lo menos', () => {
  const a = buildAlertas({
    pulso: pulso([c('d', { paso: 1, de: 2 })], { leidos: false, vida: { level: 'critical', text: 'x' } }),
    h: h({ estado: { text: 'Bloqueada' } }), tablero: tablero({ malformadas: 2 }),
  });
  assert.deepEqual(ids(a), ['hija:quieta', 'hija:sintests', 'hija:bloqueada', 'hija:sincommits', 'hija:formato']);
  assert.equal(a.nivel, 'critical');
  assert.match(a.checks[4].title, /2 líneas de su backlog/);
});

test('renderAlertas: su sección, con su nombre, ícono y texto en cada estado, todo escapado', () => {
  assert.equal(renderAlertas(null), '');
  const ok = renderAlertas(buildAlertas({ h: h() }));
  assert.match(ok, /uv-nivel--ok uv-salud-hija/);
  assert.match(ok, /data-duena="shiruna"/);
  assert.match(ok, /¿Cómo está Shiruna\?/);
  assert.match(ok, /Todo en orden/);
  assert.match(ok, /No se suman a mis chequeos/);
  const mal = renderAlertas(buildAlertas({ h: h({ nombre: 'Shi<b>', estado: { text: 'Bloqueada' }, motivo: '<i>x</i>' }) }));
  assert.match(mal, /uv-nivel--warn/);
  assert.doesNotMatch(mal, /<b>|<i>x/);
  assert.match(mal, /&lt;i&gt;x&lt;\/i&gt;/);
  assert.match(mal, /Declarado en su memoria/);
  for (const s of mal.match(/<span class="gds-status[^"]*">[\s\S]*?<\/span>/g)) assert.match(s, /<svg[\s\S]*<\/svg>[^<\s]/, 'ícono y texto');
  assert.match(mal, /data-alerta="hija:bloqueada"/);
});

function fakeRoot({ salud = true } = {}) {
  const root = { html: '', pos: null, ya: false };
  const fuentes = { insertAdjacentHTML(pos, html) { root.pos = pos; root.html += html; root.ya = true; } };
  root.querySelector = (sel) => {
    if (sel === 'section[aria-labelledby="sources-title"]') return salud ? fuentes : null;
    if (sel === '.uv-salud-hija') return root.ya ? {} : null;
    return null;
  };
  return root;
}

test('vestirAlertas: solo en Salud, antes de las fuentes, una vez; nunca rompe', () => {
  const a = buildAlertas({ h: h() });
  const r = fakeRoot();
  vestirAlertas(r, a);
  assert.equal(r.pos, 'beforebegin');
  const largo = r.html.length;
  vestirAlertas(r, a);
  assert.equal(r.html.length, largo, 'no se duplica');
  const otra = fakeRoot({ salud: false });
  vestirAlertas(otra, a);
  assert.equal(otra.html, '');
  assert.doesNotThrow(() => vestirAlertas(null, a));
  assert.doesNotThrow(() => vestirAlertas(fakeRoot(), null));
  assert.doesNotThrow(() => vestirAlertas({ querySelector() { throw new Error('x'); } }, a));
});

test('app.js: arma sus alertas después del tablero y las pone después de él', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ buildAlertas, vestirAlertas \} from '\.\/alertas\.js';/);
  assert.match(app, /state\.model\.tablero = buildTablero\([^\n]*\n\s*state\.model\.alertas = buildAlertas\(\{ pulso: state\.model\.pulso, h: state\.model\.hija, tablero: state\.model\.tablero \}\);/);
  assert.match(app, /vestirTablero\(\$main, m\.tablero\);[^\n]*\n\s*vestirAlertas\(\$main, m\.alertas\);/);
  assert.match(read('index.html'), /src="js\/app\.js\?v=2\.(1[2-9]|[2-9]\d)\.0"/);
});
