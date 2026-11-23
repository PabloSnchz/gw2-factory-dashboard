// SH-4d: «El día de Shiruna» en «Actividad» (js/sudia.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SUDIA_VERSION, duracion, buildDia, renderDia, vestirDia } from '../js/sudia.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-11-23T00:45:00Z'); // 21:45 en Buenos Aires
const URL_REPO = 'https://github.com/shiruna-gato-negro/gw2-factory-dev';
const at = (hhmmZ) => Date.parse(`2026-11-22T${hhmmZ}:00Z`);
const c = (hhmmZ, sha, o = {}) => ({ t: at(hhmmZ), sha: sha.repeat(40), texto: `commit ${sha}`, bl: null, paso: null, de: null, que: null, pass: null, total: null, ...o });
// items del más nuevo al más viejo, como los arma buildPulso
const DIA = [
  c('23:25', 'd', { bl: 'BL-005', paso: 2, de: 2, que: 'el modal ya no se abre', pass: 17, total: 17 }),
  c('23:00', 'c', { bl: 'BL-005', paso: 1, de: 2, que: 'test que falla', pass: 16, total: 16 }),
  c('21:25', 'b'),
  c('20:20', 'a', { pass: 15, total: 15 }),
];
const pulso = (o = {}) => ({ leidos: true, items: DIA, pasos: 2, cerradas: ['BL-005'], enCola: 4, ...o });

test('versión y duración legible', () => {
  assert.equal(SUDIA_VERSION, '1.0.0');
  assert.equal(duracion(44 * 60000), '44 min');
  assert.equal(duracion(60 * 60000), '1 h');
  assert.equal(duracion(95 * 60000), '1 h 35 min');
  assert.equal(duracion(-5), '0 min');
});

test('buildDia: rango, cifras y tests del día', () => {
  assert.equal(buildDia({ pulso: null, now: NOW }), null);
  const d = buildDia({ pulso: pulso(), now: NOW });
  assert.equal(d.commits, 4);
  assert.equal(d.pasos, 2);
  assert.equal(d.cerradas, 1);
  assert.equal(d.primero, at('20:20'));
  assert.equal(d.ultimo, at('23:25'));
  assert.deepEqual(d.tests, { desde: 15, hasta: 17 });
  assert.equal(d.items, DIA, 'la línea de tiempo usa sus commits tal cual');
});

test('buildDia: pausas de más de 45 min, la más nueva primero; la abierta solo con trabajo en cola', () => {
  const d = buildDia({ pulso: pulso(), now: NOW });
  assert.deepEqual(d.pausas.map(p => [p.desde, p.hasta, Math.round(p.ms / 60000), p.abierta]), [
    [at('23:25'), null, 80, true],
    [at('21:25'), at('23:00'), 95, false],
    [at('20:20'), at('21:25'), 65, false],
  ]);
  assert.equal(buildDia({ pulso: pulso({ enCola: 0 }), now: NOW }).pausas.some(p => p.abierta), false, 'sin cola, descansar no es pausa');
  assert.equal(buildDia({ pulso: pulso(), now: at('23:25') + 45 * 60000 }).pausas.some(p => p.abierta), false, '45 min justos no es pausa');
  const seguido = buildDia({ pulso: pulso({ items: [c('23:30', 'f'), c('23:00', 'e')] }), now: at('23:40') });
  assert.deepEqual(seguido.pausas, [], '30 min entre commits es su ritmo');
});

test('renderDia: el día con su rango, tests, pausas y commits plegados', () => {
  const html = renderDia(buildDia({ pulso: pulso(), now: NOW }), URL_REPO);
  assert.match(html, /data-duena="shiruna"/);
  assert.match(html, /El día de Shiruna/);
  assert.match(html, /Hoy trabajó de 17:20 a 20:25/, 'horas de Buenos Aires');
  assert.match(html, /Sus tests pasaron de 15 a 17\./);
  assert.match(html, /Sigue en pausa<\/span> desde las 20:25 · 1 h 20 min, con trabajo en cola/);
  assert.match(html, /De 18:25 a 20:00 · 1 h 35 min/);
  assert.match(html, /<b>3<\/b><span>pausas largas<\/span>/);
  assert.match(html, /<b>1<\/b><span>tarea cerrada<\/span>/);
  assert.match(html, /<ul class="gds-timeline uv-linea">/);
  assert.match(html, /<strong>BL-005<\/strong> · paso 2\/2 · el modal ya no se abre/);
  assert.match(html, /href="https:\/\/github\.com\/shiruna-gato-negro\/gw2-factory-dev\/commit\/d{40}"/);
  const muchos = Array.from({ length: 8 }, (_, i) => c(`23:${String(50 - i * 5).padStart(2, '0')}`, String.fromCharCode(103 + i)));
  const p = renderDia(buildDia({ pulso: pulso({ items: muchos }), now: NOW }), URL_REPO);
  assert.match(p, /Ver 3 más/, '5 a la vista y el resto plegado');
});

test('renderDia: tests que bajan o iguales; sin tests; sin pausas; escape', () => {
  const baja = renderDia(buildDia({ pulso: pulso({ items: [c('23:30', 'b', { pass: 14, total: 14 }), c('23:00', 'a', { pass: 16, total: 16 })] }), now: at('23:40') }), URL_REPO);
  assert.match(baja, /Sus tests bajaron de 16 a 14\./);
  assert.match(baja, /Sin pausas largas: avanzó a ritmo de ciclo\./);
  assert.match(baja, /Hoy trabajó de 20:00 a 20:30/);
  const igual = renderDia(buildDia({ pulso: pulso({ items: [c('23:30', 'b', { pass: 16, total: 16 }), c('23:00', 'a', { pass: 16, total: 16 })] }), now: at('23:40') }), URL_REPO);
  assert.match(igual, /Sus tests se mantienen en 16\./);
  const uno = renderDia(buildDia({ pulso: pulso({ items: [c('23:30', 'b', { texto: '<img src=x>' })] }), now: at('23:40') }), URL_REPO);
  assert.match(uno, /Hoy trabajó a las 20:30/);
  assert.match(uno, /Ningún commit de hoy dice sus tests\./);
  assert.match(uno, /&lt;img src=x&gt;/);
  assert.doesNotMatch(uno, /<img/);
});

test('renderDia: sin commits hoy y sin poder leerlos lo dice; sin día, nada', () => {
  assert.equal(renderDia(null, URL_REPO), '');
  assert.match(renderDia(buildDia({ pulso: pulso({ items: [] }), now: NOW }), URL_REPO), /Shiruna todavía no se movió hoy/);
  assert.match(renderDia(buildDia({ pulso: pulso({ items: [], leidos: false }), now: NOW }), URL_REPO), /No pude leer los commits de Shiruna/);
});

function fakeRoot({ actividad = true } = {}) {
  const root = { html: '', pos: null, ya: false };
  const head = { insertAdjacentHTML(pos, html) { root.pos = pos; root.html += html; root.ya = true; } };
  root.querySelector = (sel) => {
    if (sel === 'nav[aria-label="Período"]') return actividad ? {} : null;
    if (sel === '.uv-dia-hija') return root.ya ? {} : null;
    if (sel === 'header.uv-head') return head;
    return null;
  };
  return root;
}

test('vestirDia: solo en Actividad, debajo de la cabecera, una vez; nunca rompe', () => {
  const d = buildDia({ pulso: pulso(), now: NOW });
  const r = fakeRoot();
  vestirDia(r, d, URL_REPO);
  assert.equal(r.pos, 'afterend');
  assert.match(r.html, /uv-dia-hija/);
  const largo = r.html.length;
  vestirDia(r, d, URL_REPO);
  assert.equal(r.html.length, largo, 'no se duplica');
  const otra = fakeRoot({ actividad: false });
  vestirDia(otra, d, URL_REPO);
  assert.equal(otra.html, '', 'fuera de Actividad no aparece');
  assert.doesNotThrow(() => vestirDia(null, d, URL_REPO));
  assert.doesNotThrow(() => vestirDia(fakeRoot(), null, URL_REPO));
  assert.doesNotThrow(() => vestirDia({ querySelector() { throw new Error('x'); } }, d, URL_REPO));
});

test('app.js: arma su día después de sus alertas y lo pone después de ellas', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ buildDia, vestirDia \} from '\.\/sudia\.js';/);
  assert.match(app, /state\.model\.alertas = buildAlertas\([^\n]*\n\s*state\.model\.dia = buildDia\(\{ pulso: state\.model\.pulso, now,/);
  assert.match(app, /vestirAlertas\(\$main, m\.alertas\);[^\n]*\n\s*vestirDia\(\$main, m\.dia, HIJA_REPO\);/);
  assert.match(read('index.html'), /src="js\/app\.js\?v=2\.(1[3-9]|[2-9]\d)\.0"/);
});
