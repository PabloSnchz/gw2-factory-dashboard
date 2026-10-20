/**
 * tests/gds.test.mjs — Reglas del Gato Design System (GDS_FOUNDATION.md).
 * Si una regla del sistema se rompe, el CI falla: la documentación no es opcional.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens, allDeclarations, resolve, checkPairs, PAIRS } from '../gds/contrast.mjs';
import { icon, brandMark, ICON_NAMES } from '../gds/icons.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const TOKENS_CSS = read('gds/tokens.css');
const COMPONENTS_CSS = read('gds/components.css');
const ICONS_JS = read('gds/icons.js');
const FOUNDATION = read('gds/GDS_FOUNDATION.md');
const tokens = parseTokens(TOKENS_CSS);
const stripComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');

test('tokens: todos declarados dentro de :root (salvo la redefinición de movimiento)', () => {
  const inRoot = new Set(Object.keys(tokens));
  const outside = allDeclarations(TOKENS_CSS).filter(n => !inRoot.has(n));
  assert.deepEqual(outside.filter(n => !n.startsWith('--gds-motion-')), []);
});

test('tokens: sin duplicados', () => {
  const seen = new Set(); const dup = [];
  const m = stripComments(TOKENS_CSS).match(/:root\s*\{([^}]*)\}/)[1];
  for (const d of m.matchAll(/(--gds-[\w-]+)\s*:/g)) { if (seen.has(d[1])) dup.push(d[1]); seen.add(d[1]); }
  assert.deepEqual(dup, []);
});

test('tokens: los semánticos de color nunca llevan hex; solo referencian primitivos (o rgba para tintes)', () => {
  const bad = Object.entries(tokens)
    .filter(([n]) => n.startsWith('--gds-color-'))
    .filter(([, v]) => !/^var\(--gds-[\w-]+\)$/.test(v) && !/^rgba\(/.test(v));
  assert.deepEqual(bad, []);
});

test('tokens: toda referencia var(--gds-*) existe (tokens, componentes, íconos)', () => {
  const refs = [TOKENS_CSS, COMPONENTS_CSS, ICONS_JS].flatMap(src => [...stripComments(src).matchAll(/var\((--gds-[\w-]+)/g)].map(x => x[1]));
  const missing = [...new Set(refs)].filter(r => !(r in tokens));
  assert.deepEqual(missing, []);
  for (const n of Object.keys(tokens)) resolve(tokens, n); // sin ciclos
});

test('espaciado: escala exacta 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64', () => {
  const scale = Object.keys(tokens).filter(n => /^--gds-space-\d+$/.test(n))
    .sort((a, b) => +a.split('-').pop() - +b.split('-').pop()).map(n => tokens[n]);
  assert.deepEqual(scale, ['4px', '8px', '12px', '16px', '24px', '32px', '48px', '64px']);
});

test('tipografía: existen los roles headline, title, body, label y caption, en rem', () => {
  for (const role of ['headline-1', 'headline-2', 'title-1', 'title-2', 'body-1', 'body-2', 'label-1', 'label-2', 'caption']) {
    const v = tokens[`--gds-font-${role}`];
    assert.ok(v, `falta --gds-font-${role}`);
    assert.match(v, /^\d{3} [\d.]+rem\/[\d.]+rem var\(--gds-font-family-sans\)$/, role);
  }
  const size = r => parseFloat(tokens[`--gds-font-${r}`].split(' ')[1]);
  assert.ok(size('headline-1') > size('headline-2') && size('headline-2') > size('title-1') && size('title-1') >= size('body-1'));
  assert.ok(size('body-2') >= 0.875 && size('caption') >= 0.75, 'nada por debajo de 12px');
});

test('componentes: sin hex, rgb/hsl, primitivos ni medidas sueltas', () => {
  const css = stripComments(COMPONENTS_CSS);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i, 'color hex');
  assert.doesNotMatch(css, /\b(rgba?|hsla?)\(/i, 'color literal');
  assert.doesNotMatch(css, /--gds-p-/, 'primitivo');
  const sizes = [...css.matchAll(/(?<![\w-])-?\d*\.?\d+(px|rem)\b/g)].map(x => x[0]);
  assert.deepEqual([...new Set(sizes)].sort(), ['-1px', '1px'], 'solo 1px del patrón visually-hidden');
  const hidden = css.match(/\.gds-visually-hidden\s*\{[^}]*\}/)[0];
  assert.equal(sizes.length, (hidden.match(/-?1px/g) || []).length, '1px solo dentro de .gds-visually-hidden');
});

test('accesibilidad: foco visible, salto al contenido y movimiento reducido', () => {
  assert.match(COMPONENTS_CSS, /:focus-visible\s*\{[^}]*outline:\s*var\(--gds-focus-width\) solid var\(--gds-color-focus\)/);
  assert.match(COMPONENTS_CSS, /\.gds-skip:focus/);
  assert.match(TOKENS_CSS, /prefers-reduced-motion: reduce[\s\S]*--gds-motion-base:\s*0ms/);
  assert.match(COMPONENTS_CSS, /prefers-reduced-motion: reduce/);
  assert.ok(parseInt(tokens['--gds-target-min'], 10) >= 24, 'objetivo mínimo');
});

test('contraste: todos los pares de uso cumplen WCAG 2.1 AA', () => {
  const fails = checkPairs(tokens).filter(r => !r.ok).map(r => `${r.fg} / ${r.bg}${r.over ? ' sobre ' + r.over : ''} = ${r.ratio} (< ${r.min})`);
  assert.deepEqual(fails, []);
  assert.ok(PAIRS.length >= 50);
});

test('contraste: la tabla de GDS_FOUNDATION.md coincide con el cálculo', () => {
  for (const r of checkPairs(tokens)) {
    const fondo = r.over ? `\`${r.bg}\` sobre \`${r.over}\`` : `\`${r.bg}\``;
    const row = `| \`${r.fg}\` | ${fondo} | ${r.ratio.toFixed(2)} |`;
    assert.ok(FOUNDATION.includes(row), `falta o está desactualizada la fila: ${row}`);
  }
});

test('íconos: decorativos (aria-hidden) y con color heredado', () => {
  assert.ok(ICON_NAMES.length >= 10);
  for (const n of ICON_NAMES) {
    const svg = icon(n);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /focusable="false"/);
    assert.match(svg, /class="gds-icon/);
  }
  assert.equal(icon('no-existe'), icon('info'), 'fallback seguro');
  assert.doesNotMatch(brandMark(), /#[0-9a-f]{3,8}\b/i, 'la marca usa tokens');
});

test('foundation: documenta principios, tokens, tipografía, espaciado, componentes y accesibilidad', () => {
  for (const s of ['Principios', 'Tokens', 'Color', 'Contraste', 'Tipografía', 'Espaciado', 'Componentes', 'Accesibilidad', 'Gobernanza']) {
    assert.match(FOUNDATION, new RegExp(`^##+ .*${s}`, 'm'), s);
  }
  const documented = [...COMPONENTS_CSS.matchAll(/^\.(gds-[a-z0-9]+(?:-[a-z0-9]+)*)/gm)].map(x => x[1]);
  const missing = [...new Set(documented)].filter(c => !FOUNDATION.includes(`\`.${c}\``));
  assert.deepEqual(missing, [], 'todo componente base está documentado');
});
