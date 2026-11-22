// SH-2: Pablo con cuerpo — su cara en «Te toca», en paz si no le queda nada y festejando en «Hoy» si se terminó algo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PABLO_VERSION, POSES_PABLO, posesPablo, figuraPablo, CARA_PABLO, vestirPablo } from '../js/pablo.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const modelo = (pendientes, hechasHoy) => ({
  human: Array.from({ length: pendientes }, (_, i) => ({ id: `REQ-${i}` })),
  activity: { doneToday: Array.from({ length: hechasHoy }, (_, i) => ({ id: `BL-${i}` })) },
});

test('versión y poses', () => {
  assert.equal(PABLO_VERSION, '1.0.0');
  assert.deepEqual(POSES_PABLO, ['paz', 'festeja']);
});

test('posesPablo: en paz sin pendientes, festeja si hoy se terminó algo; sin datos, nada', () => {
  assert.deepEqual(posesPablo(modelo(0, 0)), { paz: true, festeja: false });
  assert.deepEqual(posesPablo(modelo(2, 0)), { paz: false, festeja: false }, 'con pendientes no está en paz');
  assert.deepEqual(posesPablo(modelo(1, 3)), { paz: false, festeja: true });
  assert.deepEqual(posesPablo(modelo(0, 1)), { paz: true, festeja: true });
  assert.deepEqual(posesPablo(null), { paz: false, festeja: false });
  assert.deepEqual(posesPablo({}), { paz: false, festeja: false }, 'sin lista de pendientes no se asume que no hay');
});

test('figuraPablo y la cara: decorativas, solo poses conocidas', () => {
  assert.equal(figuraPablo('paz'), '<span class="uv-pablo uv-pablo--paz" aria-hidden="true"></span>');
  assert.equal(figuraPablo('festeja'), '<span class="uv-pablo uv-pablo--festeja" aria-hidden="true"></span>');
  assert.equal(figuraPablo('"><script>'), '');
  assert.equal(figuraPablo(null), '');
  assert.equal(CARA_PABLO, '<span class="uv-cara uv-cara--pablo" aria-hidden="true"></span>');
});

/** DOM mínimo: nodos con atributos, HTML insertado como texto y querySelector por clase. */
function nodo() {
  return {
    attrs: {}, inner: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    insertAdjacentHTML(pos, html) { assert.equal(pos, 'afterbegin'); this.inner = html + this.inner; },
    querySelector(sel) {
      if (sel === '.uv-ante') return this.ante || null;
      return this.inner.includes(`class="${sel.slice(1)}`) || this.inner.includes(` ${sel.slice(1)}"`) ? {} : null;
    },
  };
}
function fakeRoot({ toca = true, hoy = true } = {}) {
  const t = toca ? Object.assign(nodo(), { ante: nodo() }) : null;
  const h = hoy ? nodo() : null;
  return {
    toca: t, hoy: h,
    querySelector: (s) => (s === 'section[aria-labelledby="human-title"]' ? t : s === 'section[aria-label="Actividad: Hoy"]' ? h : null),
  };
}

test('vestirPablo: cara en «Te toca», en paz sin pendientes, festeja en «Hoy»; una sola vez aunque se dibuje de nuevo', () => {
  const r = fakeRoot();
  vestirPablo(r, modelo(0, 2));
  assert.equal(r.toca.ante.inner, CARA_PABLO);
  assert.equal(r.toca.attrs['data-pablo'], 'paz');
  assert.equal(r.toca.inner, figuraPablo('paz'));
  assert.equal(r.hoy.attrs['data-pablo'], 'festeja');
  assert.equal(r.hoy.inner, figuraPablo('festeja'));
  vestirPablo(r, modelo(0, 2));
  assert.equal((r.toca.ante.inner.match(/uv-cara--pablo/g) || []).length, 1, 'la cara no se duplica');
  assert.equal((r.toca.inner.match(/uv-pablo--/g) || []).length, 1, 'la figura no se duplica');
  assert.equal((r.hoy.inner.match(/uv-pablo--/g) || []).length, 1);
});

test('vestirPablo: con pendientes y sin nada hecho hoy, solo la cara', () => {
  const r = fakeRoot();
  vestirPablo(r, modelo(3, 0));
  assert.equal(r.toca.ante.inner, CARA_PABLO);
  assert.equal(r.toca.inner, '');
  assert.equal(r.toca.attrs['data-pablo'], undefined);
  assert.equal(r.hoy.inner, '');
});

test('vestirPablo: fuera de Hoy, sin DOM, sin modelo o con el DOM roto, no hace nada y no tira', () => {
  const r = fakeRoot({ toca: false });
  vestirPablo(r, modelo(0, 2));
  assert.equal(r.hoy.inner, '', 'sin «Te toca» no es la vista Hoy');
  assert.doesNotThrow(() => vestirPablo(fakeRoot({ hoy: false }), modelo(0, 2)));
  assert.doesNotThrow(() => vestirPablo(null, modelo(0, 0)));
  assert.doesNotThrow(() => vestirPablo(fakeRoot(), null));
  assert.doesNotThrow(() => vestirPablo({ querySelector() { throw new Error('x'); } }, modelo(0, 0)));
});

test('css/hija.css: una imagen por pose de Pablo y su cara, sin colores literales y quieto con movimiento reducido', () => {
  const css = read('css/hija.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const p of POSES_PABLO) assert.match(css, new RegExp(`\\.uv-pablo--${p}\\s*\\{[^}]*url\\("\\.\\./assets/pablo/pablo-${p}\\.webp"\\)`), p);
  assert.match(css, /\.uv-cara--pablo\s*\{[^}]*pablo-cara\.webp/);
  assert.match(css, /\[data-pablo\]\s*\{[^}]*position:\s*relative/);
  assert.match(css, /\.uv-pablo\s*\{[^}]*pointer-events:\s*none/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla)\(/, 'sin colores literales');
  assert.match(css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)')), /\.uv-pablo--festeja\s*\{\s*animation:\s*none/);
  assert.match(read('index.html'), /href="css\/hija\.css\?v=1\.1\.0"/, 'la hoja nueva se pide con su versión');
});

test('assets/pablo: si ya están subidas, son webp (las dos poses + la cara)', () => {
  const dir = new URL('../assets/pablo/', import.meta.url);
  if (!existsSync(dir)) return;
  for (const n of [...POSES_PABLO, 'cara']) {
    const buf = readFileSync(new URL(`pablo-${n}.webp`, dir));
    assert.equal(buf.subarray(0, 4).toString('latin1'), 'RIFF', n);
    assert.equal(buf.subarray(8, 12).toString('latin1'), 'WEBP', n);
  }
});

test('app.js: viste a Pablo después de Shiruna en cada dibujo', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ vestirPablo \} from '\.\/pablo\.js';/);
  assert.match(app, /vestirHija\(\$main, m\.hija\);[^\n]*\n\s*vestirPablo\(\$main, m\);/);
});
