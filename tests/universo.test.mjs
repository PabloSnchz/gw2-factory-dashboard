/**
 * tests/universo.test.mjs — Piel «Universo Shiruvana» del Centro de mando (BL-091 CD-1).
 * Guardianes: paleta en un solo lugar, referencias existentes, contraste AA con la paleta nueva,
 * movimiento reducido, chispas decorativas y cabecera con el nombre elegido por Pablo (D4).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens, checkPairs } from '../gds/contrast.mjs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const UV = strip(read('css/universo.css'));
const ROOT = UV.match(/:root\s*\{([^}]*)\}/);
const PALETTE = Object.fromEntries([...ROOT[1].matchAll(/(--uv-[\w-]+)\s*:\s*([^;]+);/g)].map(d => [d[1], d[2].trim()]));
const REST = UV.slice(0, ROOT.index) + UV.slice(ROOT.index + ROOT[0].length);
const GDS = parseTokens(read('gds/tokens.css'));

/** Reasignaciones --gds-color-* que hace la piel dentro de body.gds. */
function overrides() {
  const out = {};
  for (const block of REST.matchAll(/body\.gds\s*\{([^}]*)\}/g)) {
    for (const d of block[1].matchAll(/(--gds-[\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

test('paleta: colores literales solo en el primer :root y solo como --uv-*', () => {
  assert.ok(ROOT, 'existe el bloque :root');
  const names = [...ROOT[1].matchAll(/(--[\w-]+)\s*:/g)].map(x => x[1]);
  assert.deepEqual(names.filter(n => !n.startsWith('--uv-')), [], 'el :root solo declara --uv-*');
  assert.doesNotMatch(REST, /#[0-9a-fA-F]{3,8}\b/, 'sin hex fuera de la paleta');
  assert.doesNotMatch(REST, /\b(rgb|rgba|hsl|hsla)\(/, 'sin rgb/hsl fuera de la paleta');
  assert.doesNotMatch(UV, /--gds-p-/, 'sin primitivos del GDS');
  assert.equal(PALETTE['--uv-bg'], '#0B0B10', 'fondo del sitio');
  assert.equal(PALETTE['--uv-amber'], '#E8B34B', 'ámbar del sitio');
  assert.equal(PALETTE['--uv-violet'], '#9B82FF', 'violeta del sitio');
});

test('referencias: toda var(--uv-*) y var(--gds-*) existe; solo se reasignan colores del GDS que existen', () => {
  for (const [, n] of UV.matchAll(/var\((--uv-[\w-]+)/g)) assert.ok(n in PALETTE, `${n} existe`);
  for (const [, n] of UV.matchAll(/var\((--gds-[\w-]+)/g)) assert.ok(n in GDS, `${n} existe`);
  const ov = overrides();
  assert.ok(Object.keys(ov).length >= 10, 'la piel reasigna la paleta del GDS');
  for (const [n, v] of Object.entries(ov)) {
    assert.ok(n.startsWith('--gds-color-') && n in GDS, `${n} es un color semántico del GDS`);
    assert.match(v, /^var\(--uv-[\w-]+\)$/, `${n} apunta a la paleta`);
  }
});

test('contraste: los pares del GDS cumplen WCAG 2.1 AA con la paleta del universo', () => {
  const merged = { ...GDS };
  for (const [n, v] of Object.entries(overrides())) merged[n] = PALETTE[v.match(/--uv-[\w-]+/)[0]];
  const fails = checkPairs(merged).filter(r => !r.ok).map(r => `${r.fg} / ${r.bg}${r.over ? ' sobre ' + r.over : ''} = ${r.ratio}`);
  assert.deepEqual(fails, []);
  // Pares propios de la cabecera (texto oscuro sobre ámbar y violeta, ámbar sobre tinta).
  const hex = h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 });
  const lum = c => ['r', 'g', 'b'].map(k => c[k] / 255).map(s => (s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4));
  const L = c => { const [r, g, b] = lum(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [hi, lo] = [L(hex(a)), L(hex(b))].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const P = PALETTE;
  for (const [fg, bg] of [[P['--uv-ink'], P['--uv-amber']], [P['--uv-ink'], P['--uv-violet']], [P['--uv-amber'], P['--uv-ink']], [P['--uv-muted'], P['--uv-s1']]]) {
    assert.ok(ratio(fg, bg) >= 4.5, `${fg} sobre ${bg} = ${ratio(fg, bg).toFixed(2)}`);
  }
});

test('movimiento: con prefers-reduced-motion no hay chispas ni latido', () => {
  const rm = UV.slice(UV.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(rm.length > 40, 'existe el bloque de movimiento reducido');
  assert.match(rm, /\.uv-chispas\s*\{\s*display:\s*none/);
  assert.match(rm, /\.uv-pulso\s*\{\s*animation:\s*none/);
});

test('index.html: la piel va última y las chispas son decorativas', () => {
  const html = read('index.html');
  const css = [...html.matchAll(/href="([^"?]+\.css)/g)].map(x => x[1]);
  assert.equal(css[css.length - 1], 'css/universo.css', 'universo se carga al final');
  const chispas = html.match(/<div class="uv-chispas" aria-hidden="true">((?:<i><\/i>)+)<\/div>/);
  assert.ok(chispas, 'capa de chispas con aria-hidden');
  assert.equal(chispas[1].match(/<i>/g).length, 12, '12 chispas (una regla nth-child por cada una)');
  for (let n = 1; n <= 12; n++) assert.match(UV, new RegExp(`\\.uv-chispas i:nth-child\\(${n}\\)\\s*\\{`), `chispa ${n}`);
  assert.ok(html.indexOf('class="gds-skip"') < html.indexOf('uv-chispas'), 'el salto al contenido sigue siendo lo primero');
  assert.match(html, /<title>Gato Negro Factory · Centro de mando<\/title>/, 'D4: nombre «Centro de mando»');
});

test('cabecera: «Centro de mando», marca con aro y latido decorativo', () => {
  const src = read('js/views.js');
  const head = src.slice(src.indexOf('export function renderHeader'), src.indexOf('/* ------------------------------------------------------------ HOY'));
  assert.match(head, /<span class="uv-logo">\$\{brandMark\(32\)\}<\/span>/, 'el gato oficial, sin cambios, dentro del aro');
  assert.match(head, /<span class="uv-sub">Centro de mando<\/span>/);
  assert.doesNotMatch(head, /Centro de decisiones/, 'el rótulo viejo ya no aparece');
  assert.match(head, /<span class="uv-pulso" aria-hidden="true"><\/span>/);
  for (const cls of ['uv-logo', 'uv-sub', 'uv-pulso', 'uv-lectura']) assert.match(UV, new RegExp(`\\.${cls}\\b`), `${cls} tiene estilo`);
});
