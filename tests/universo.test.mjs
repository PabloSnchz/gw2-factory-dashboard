/**
 * tests/universo.test.mjs — Piel «Universo Shiruvana» del Centro de mando (BL-091 CD-1).
 * Guardianes: paleta en un solo lugar, referencias existentes, contraste AA con la paleta nueva,
 * movimiento reducido, chispas decorativas y cabecera con el nombre elegido por Pablo (D4).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens, checkPairs } from '../gds/contrast.mjs';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW } from './helpers.mjs';

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
  const names = [...ROOT[1].matchAll(/([\w-]+)\s*:\s*[^;]+;/g)].map(x => x[1]);
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

/* ------------------------------------------------------------ CD-2: Hoy como Mesa de mando (D1) */

async function home() {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(readMemory()), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  const m = buildModel(await loadAll(gh, NOW));
  return { m, html: V.renderHome(m) };
}

test('mesa: 01 · Ahora arriba y dos columnas; lo tuyo a la izquierda, la Factory a la derecha', async () => {
  const { html } = await home();
  assert.equal((html.match(/<div class="uv-mesa">/g) || []).length, 1, 'una sola mesa');
  const cols = html.split('<div class="uv-col">');
  assert.equal(cols.length, 3, 'dos columnas');
  const [, left, right] = cols;
  assert.ok(html.indexOf('verdict-title') < html.indexOf('uv-mesa'), 'el veredicto va arriba de la mesa');
  for (const id of ['human-title']) assert.ok(left.includes(`id="${id}"`), `${id} en la izquierda`);
  assert.ok(left.includes('uv-hoy') && left.includes('Esta semana'), 'lo que pasó, en la izquierda');
  for (const id of ['factory-title', 'concerns-title']) assert.ok(right.includes(`id="${id}"`), `${id} en la derecha`);
  assert.ok(!left.includes('factory-title') && !right.includes('human-title'), 'nada cruzado');
  const abajo = html.slice(html.indexOf('<div class="uv-abajo">'));
  assert.ok(abajo.includes('id="env-title"') && abajo.includes('id="metrics-title"'), 'entornos y números abajo');
  assert.ok(abajo.indexOf('env-title') < abajo.indexOf('metrics-title'), '05 antes que 06');
});

test('mesa: antetítulos 01 a 06, cada uno una sola vez', async () => {
  const { html } = await home();
  const antes = [...html.matchAll(/<p class="uv-ante[^"]*">(\d\d) · ([^<]+)<\/p>/g)].map(x => x[1]);
  assert.deepEqual(antes, ['01', '02', '03', '04', '05', '06'], 'en orden de lectura: el lector de pantalla los oye en el mismo orden');
});

test('mesa: tres cifras; «te esperan» es la cantidad de pendientes y el cero va en gris', async () => {
  const { m, html } = await home();
  const cifras = [...html.matchAll(/<p class="uv-cifra( uv-cifra--cero)?"><b>(\d+)<\/b><span>([^<]+)<\/span><\/p>/g)];
  assert.equal(cifras.length, 3);
  assert.equal(Number(cifras[0][2]), m.human.length);
  assert.equal(cifras[0][3], 'te esperan');
  for (const c of cifras) assert.equal(Boolean(c[1]), Number(c[2]) === 0, `${c[3]}: gris solo si es cero`);
  assert.match(html, /<div class="uv-cifras" role="group" aria-label="En números">/);
});

test('mesa: estilos — dos columnas que se apilan en pantallas chicas, cifras en ámbar', () => {
  assert.match(UV, /\.uv-mesa\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.55fr\) minmax\(320px, 1fr\)/);
  const chica = UV.slice(UV.indexOf('@media (max-width: 1080px)'));
  assert.match(chica.slice(0, chica.indexOf('}\n}') + 3), /\.uv-mesa\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/, 'en ≤ 1080 px una columna');
  assert.match(UV, /\.uv-cifra b\s*\{[^}]*color:\s*var\(--uv-amber\)/);
  assert.match(UV, /\.uv-cifra--cero b\s*\{[^}]*color:\s*var\(--gds-color-text-muted\)/);
  const rm = UV.slice(UV.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(rm, /data-state="current"\]::before\s*\{\s*animation:\s*none/, 'la etapa actual no late con movimiento reducido');
});

/* ------------------------------------------------------------ CD-4: las otras cinco vistas */

async function vistas() {
  const { m } = await home();
  return { m, v: {
    trabajo: V.renderWork(m), conocimiento: V.renderKnowledge(m, 'dec'), riesgos: V.renderRisks(m),
    actividad: V.renderActivity(m, '7d'), salud: V.renderHealth(m),
  } };
}
const head = html => html.slice(html.indexOf('<header class="page-head uv-head">'), html.indexOf('</header>') + 9);

test('vistas: cada una abre con «01 · …», su único h1 y tres o más cifras en ámbar', async () => {
  const { v } = await vistas();
  const antes = { trabajo: '01 · El plan', conocimiento: '01 · Lo que sé', riesgos: '01 · Lo que vigilo', actividad: '01 · Lo que pasó', salud: '01 · Cómo estoy' };
  for (const [k, html] of Object.entries(v)) {
    const h = head(html);
    assert.ok(h.length > 40, `${k}: cabecera del universo`);
    assert.ok(h.includes(`<p class="uv-ante">${antes[k]}</p>`), `${k}: antetítulo`);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${k}: un solo h1`);
    assert.ok(h.indexOf('uv-ante') < h.indexOf('<h1'), `${k}: el antetítulo va antes del título`);
    assert.match(h, /<div class="uv-cifras" role="group" aria-label="En números">/, `${k}: cifras`);
    assert.ok((h.match(/class="uv-cifra/g) || []).length >= 3, `${k}: al menos tres cifras`);
    assert.ok(!/undefined|NaN/.test(h), `${k}: sin datos rotos`);
  }
});

test('vistas: las cifras dicen lo mismo que la vista', async () => {
  const { m, v } = await vistas();
  const nums = h => [...head(h).matchAll(/<b>(\d+)<\/b><span>([^<]+)<\/span>/g)].map(x => [Number(x[1]), x[2]]);
  const b = m.backlog;
  assert.deepEqual(nums(v.trabajo).map(x => x[0]), [b.IN_PROGRESS.length, b.BLOCKED.length, b.READY.length, b.DONE.length]);
  const crit = m.risks.filter(r => r.estado === 'ABIERTO' && r.severidad === 'CRÍTICO').length;
  assert.deepEqual(nums(v.riesgos)[0], [crit, 'críticos abiertos']);
  assert.deepEqual(nums(v.salud).map(x => x[0]), [m.health.counts.critical || 0, m.health.counts.warn || 0, m.health.counts.info || 0]);
  assert.deepEqual(nums(v.conocimiento)[0][0], (m.entries.DEC || []).length);
  assert.match(head(v.actividad), /<nav class="gds-tabs" aria-label="Período">/, 'el período se elige desde la cabecera');
});

test('vistas: líneas de tiempo con puntos, tablero y niveles con su color', async () => {
  const { v } = await vistas();
  assert.match(v.actividad, /<ul class="gds-timeline uv-linea">/);
  assert.match(v.trabajo, /<ol class="gds-list uv-linea">/, 'etapas del plan como línea de tiempo');
  for (const k of ['in_progress', 'blocked', 'ready', 'done']) {
    assert.match(v.trabajo, new RegExp(`board__col board__col--${k}"`), k);
    assert.match(UV, new RegExp(`\\.board__col--${k} \\{ border-top-color:`), `${k} tiene color`);
  }
  assert.match(v.riesgos, /class="gds-card uv-nivel uv-nivel--critical"/);
  for (const n of ['critical', 'warn', 'info', 'ok']) assert.match(UV, new RegExp(`\\.uv-nivel--${n} \\{ border-top-color:`), n);
  assert.match(UV, /\.uv-linea > li::before \{[^}]*border-radius: 50%/, 'punto en cada evento');
  assert.match(UV, /\.gds \.app-main a\.gds-tab\[aria-current="page"\] \{ background: var\(--uv-amber\); color: var\(--uv-ink\)/, 'pestaña actual en ámbar, texto oscuro (10:1)');
  const chica = UV.slice(UV.indexOf('@media (max-width: 1080px)'));
  assert.match(chica.slice(0, chica.indexOf('}\n}') + 3), /\.uv-head \{ grid-template-columns: minmax\(0, 1fr\); \}/, 'en pantallas chicas, una columna');
});

/* ------------------------------------------------------------ 3.0.1: textos largos de status.md */

test('resumen: si entra, todo; si no, la primera oración; si es muy larga, cortada en una palabra entera con «…»', () => {
  assert.equal(V.resumen('Hola. Chau.'), 'Hola. Chau.', 'un texto corto se muestra entero');
  assert.equal(V.resumen('Hola. Chau.', 8), 'Hola.');
  assert.equal(V.resumen('  Uno  dos\n tres  '), 'Uno dos tres', 'espacios normalizados');
  assert.equal(V.resumen('Versión v1.0.0 lista. Sigue.', 25), 'Versión v1.0.0 lista.', 'un punto entre cifras no corta');
  const largo = 'palabra '.repeat(60) + 'fin.';
  const r = V.resumen(largo, 100);
  assert.ok(r.length <= 101 && r.endsWith('…') && !r.includes('  '), r);
  assert.ok(largo.startsWith(r.slice(0, -1)), 'es el comienzo del texto');
  assert.ok(r.slice(0, -1).split(' ').every(w => w === 'palabra'), 'corta en una palabra entera');
  assert.equal(V.resumen(''), '');
});

test('04 · La Factory ahora: con textos de miles de caracteres, el resumen arriba y el resto plegado con scroll propio', async () => {
  const { m } = await home();
  const larga = (n, x) => `${x} primera oración. ` + `detalle ${x} `.repeat(n);
  m.status = { ...m.status, tarea: 'BL-091 — ' + larga(400, 'tarea'), motivo: larga(300, 'motivo'), proxima: larga(500, 'proxima') };
  const html = V.renderHome(m);
  const card = html.slice(html.indexOf('<section class="gds-card factory"'), html.indexOf('</section>', html.indexOf('factory-title')));
  assert.match(card, /<p class="gds-headline-2">tarea primera oración\.<\/p>/, 'el título es solo la primera oración, sin el ID');
  assert.match(card, /<strong class="gds-label-1">Por qué:<\/strong> motivo primera oración\.<\/p>/);
  assert.match(card, /<dt>Próxima acción<\/dt><dd>proxima primera oración\./);
  const plegados = [...card.matchAll(/<details class="uv-mas"><summary class="gds-caption">([^<]+)<\/summary>\s*<div class="uv-mas__txt gds-body-2" tabindex="0" role="region" aria-label="([^"]+)">([\s\S]*?)<\/div><\/details>/g)];
  assert.deepEqual(plegados.map(p => p[1]), ['Ver la tarea completa', 'Ver el motivo completo', 'Ver la próxima acción completa']);
  assert.equal(new Set(plegados.map(p => p[2])).size, 3, 'cada región con su nombre');
  for (const p of plegados) assert.ok(p[3].length > 2000, 'adentro está el texto completo');
  const fuera = card.replace(/<details class="uv-mas">[\s\S]*?<\/details>/g, '');
  assert.ok(fuera.length < 6000, `a la vista queda poco texto (${fuera.length})`);
  assert.match(UV, /\.uv-mas__txt \{[^}]*max-height: 40vh; overflow-y: auto;/, 'el texto completo se desplaza adentro');
  assert.match(UV, /\.uv-mas summary \{[^}]*min-height: var\(--gds-target-min\)/, 'el «Ver…» se puede tocar con el dedo');
});

test('04 · La Factory ahora: con textos cortos no hay nada plegado', async () => {
  const { m } = await home();
  m.status = { ...m.status, tarea: 'BL-100 — Algo corto', motivo: 'Porque sí. Y por esto también.', proxima: 'Seguir.' };
  const html = V.renderHome(m);
  assert.doesNotMatch(html, /class="uv-mas"/);
  assert.match(html, /<p class="gds-headline-2">Algo corto<\/p>/);
  assert.match(html, /Por qué:<\/strong> Porque sí\. Y por esto también\.<\/p>/, 'dos oraciones cortas se ven enteras');
});

/* ------------------------------------------------------------ CD-5: celular */

test('celular: etapas en vertical, sin desenfoque por tarjeta, cifras más chicas y puertas sin hover pegado', () => {
  const ini = UV.indexOf('@media (max-width: 640px)');
  assert.ok(ini > 0, 'existe el bloque del celular');
  const cel = UV.slice(ini, UV.indexOf('}\n}', ini) + 3);
  assert.match(cel, /\.factory \.gds-stepper::before \{[^}]*width: 2px; height: auto;/, 'la línea de las etapas pasa a vertical');
  assert.match(cel, /\.factory \.gds-stepper__step::before \{ position: absolute;/, 'el punto va a la izquierda del texto');
  assert.match(cel, /\.factory \.gds-stepper__step \{ justify-items: start; text-align: left; \}/);
  assert.match(cel, /\.gds-card, \.uv-panel, \.uv-numeros \.gds-metric \{ -webkit-backdrop-filter: none; backdrop-filter: none; \}/, 'sin desenfoque por tarjeta');
  assert.match(cel, /\.uv-cifra b \{ font-size: 2rem; \}/);
  // El efecto de «puerta» solo con mouse: fuera de @media (hover: hover) no hay :hover que mueva la tarjeta.
  const sinHover = UV.replace(/@media \(hover: hover\) \{[\s\S]*?\}\n\}/, '').replace(/@media \(prefers-reduced-motion: reduce\)[\s\S]*$/, '');
  assert.doesNotMatch(sinHover, /\.uv-entornos \.gds-card--inset:hover/, 'el hover de las puertas vive en @media (hover: hover)');
  assert.match(UV, /@media \(hover: hover\) \{\s*\.uv-entornos \.gds-card--inset:hover \{[^}]*translateY\(-2px\)/);
});
