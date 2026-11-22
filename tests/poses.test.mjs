// SH-1: Shiruna con cuerpo — la pose dice en qué está, festeja una sola vez y su cara va en «Te toca».
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildHija } from '../js/hija.js';
import { POSES, POSES_VERSION, LOGRO_KEY, poseHija, marcarLogro, figura, cara, vestirHija } from '../js/poses.js';
import { memoryStorage } from '../js/github.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-11-22T18:00:00Z');
const HIJA = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };
const status = (estado, esperando = '') => `# Estado de Shiruna

Estado: ${estado}
Tarea actual: Algo.
Motivo: Porque sí.
Etapa actual: DEVELOPMENT
Última actualización: 2026-11-22 17:46Z
Próxima acción: Seguir.

## Esperando a Pablo

${esperando}
`;
const backlog = (n) => `# Backlog\n\n## READY\n\n## IN_PROGRESS\n\n## BLOCKED\n\n## DONE\n\n${Array.from({ length: n }, (_, i) => `- [BL-00${i}] [ALTO] Hecha ${i} — x — 2026-11-21`).join('\n')}\n`;
const raw = (st, done = 2) => ({ files: { 'status.md': st, 'backlog.md': backlog(done), 'roadmap.md': null }, errors: {} });
const hija = (st, done) => buildHija(raw(st, done), NOW, HIJA);

test('versión y poses', () => {
  assert.equal(POSES_VERSION, '1.0.0');
  assert.deepEqual(POSES, ['espaldas', 'brazos', 'festeja', 'saluda', 'tablet', 'consola']);
});

test('poseHija: cada estado con su pose, en orden de prioridad', () => {
  assert.equal(poseHija(null), null);
  assert.equal(poseHija(buildHija({ files: {}, errors: { 'status.md': 'HTTP 500' } }, NOW, HIJA)), 'espaldas', 'sin leerla, de espaldas');
  assert.equal(poseHija(hija(status('BLOQUEADA', '- Acción: algo'))), 'brazos', 'bloqueada gana a lo que pide');
  assert.equal(poseHija(hija(status('EN CURSO', '- Acción: decime algo'))), 'saluda', 'te pide algo');
  assert.equal(poseHija(hija(status('EN CURSO', '- Info: solo un aviso'))), 'tablet', 'un aviso no es un pedido');
  assert.equal(poseHija(hija(status('ESPERANDO A PABLO'))), 'consola');
  const h = hija(status('EN CURSO', '- Acción: decime algo'));
  h.logro = true;
  assert.equal(poseHija(h), 'festeja', 'el festejo gana a lo que pide (una sola visita)');
});

test('marcarLogro: la primera vez solo guarda; festeja cuando sube; nunca lanza', () => {
  const s = memoryStorage();
  const st = status('EN CURSO');
  assert.equal(marcarLogro(hija(st), raw(st, 2), s).logro, false, 'sin visita anterior no festeja');
  assert.equal(s.getItem(LOGRO_KEY), '2');
  assert.equal(marcarLogro(hija(st), raw(st, 2), s).logro, false, 'igual que antes: no festeja');
  const c = marcarLogro(hija(st), raw(st, 3), s);
  assert.equal(c.logro, true, 'cerró una más');
  assert.equal(c.hechas, 3);
  assert.equal(poseHija(c), 'festeja');
  assert.equal(marcarLogro(hija(st), raw(st, 3), s).logro, false, 'la visita siguiente ya no festeja');
  assert.equal(marcarLogro(null, raw(st), s), null);
  const sinLeer = buildHija({ files: {}, errors: {} }, NOW, HIJA);
  assert.equal(marcarLogro(sinLeer, raw(st), s).logro, undefined);
  const rota = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.doesNotThrow(() => marcarLogro(hija(st), raw(st, 9), rota));
});

/** DOM mínimo: un nodo con atributos, hijos insertados como texto y querySelector por clase. */
function nodo(cls, attrs = {}) {
  return {
    cls, attrs: { ...attrs }, inner: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    insertAdjacentHTML(pos, html) { assert.equal(pos, 'afterbegin'); this.inner = html + this.inner; },
    querySelector(sel) { return this.inner.includes(sel.replace('.', 'class="').split(' ')[0]) ? {} : null; },
  };
}
function fakeRoot({ card = true, metas = 2 } = {}) {
  const c = card ? nodo('uv-hija') : null;
  const ms = Array.from({ length: metas }, () => nodo('decision__meta'));
  return {
    card: c, metas: ms,
    querySelector: (s) => (s === 'section.uv-hija' ? c : null),
    querySelectorAll: (s) => (s === 'article[data-duena="shiruna"] .decision__meta' ? ms : []),
  };
}

test('vestirHija: pose en su tarjeta, su cara en lo que pide, una sola vez aunque se dibuje de nuevo', () => {
  const h = hija(status('EN CURSO', '- Acción: decime algo'));
  const r = fakeRoot();
  vestirHija(r, h);
  assert.equal(r.card.attrs['data-pose'], 'saluda');
  assert.equal(r.card.inner, '<span class="uv-hija__pose uv-hija__pose--saluda" aria-hidden="true"></span>');
  for (const m of r.metas) assert.equal(m.inner, '<span class="uv-cara uv-cara--shiruna" aria-hidden="true"></span>');
  vestirHija(r, h);
  assert.equal((r.card.inner.match(/uv-hija__pose--/g) || []).length, 1, 'no se duplica');
  for (const m of r.metas) assert.equal((m.inner.match(/uv-cara--/g) || []).length, 1);
  assert.doesNotThrow(() => vestirHija(fakeRoot({ card: false }), h));
  assert.doesNotThrow(() => vestirHija(null, h));
  assert.doesNotThrow(() => vestirHija(fakeRoot(), null));
  assert.equal(figura('festeja'), '<span class="uv-hija__pose uv-hija__pose--festeja" aria-hidden="true"></span>');
  assert.equal(figura(null), '');
  assert.equal(cara(null), '');
});

test('css/hija.css: una imagen por pose, sin colores literales, antes de la piel y quieta con movimiento reducido', () => {
  const css = read('css/hija.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const p of POSES) assert.match(css, new RegExp(`\\.uv-hija__pose--${p}\\s*\\{[^}]*url\\("\\.\\./assets/shiruna/shiruna-${p}\\.webp"\\)`), p);
  assert.match(css, /\.uv-cara--shiruna\s*\{[^}]*shiruna-cara\.webp/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla)\(/, 'sin colores literales');
  assert.match(css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)')), /\.uv-hija__pose--festeja\s*\{\s*animation:\s*none/);
  const html = read('index.html');
  const hrefs = [...html.matchAll(/href="([^"?]+\.css)/g)].map(x => x[1]);
  assert.ok(hrefs.indexOf('css/hija.css') > -1 && hrefs.indexOf('css/hija.css') < hrefs.indexOf('css/universo.css'), 'antes de la piel');
});

test('assets/shiruna: si ya están subidas, son las 7 webp (una por pose + la cara)', () => {
  const dir = new URL('../assets/shiruna/', import.meta.url);
  if (!existsSync(dir)) return; // todavía no subidas: la tarjeta se ve igual, sin figura
  for (const n of [...POSES, 'cara']) {
    const buf = readFileSync(new URL(`shiruna-${n}.webp`, dir));
    assert.equal(buf.subarray(0, 4).toString('latin1'), 'RIFF', n);
    assert.equal(buf.subarray(8, 12).toString('latin1'), 'WEBP', n);
  }
});

test('app.js: marca el logro en cada lectura y la viste después de cada dibujo', () => {
  const app = read('js/app.js');
  assert.match(app, /import \{ marcarLogro, vestirHija \} from '\.\/poses\.js';/);
  assert.match(app, /state\.model = unirHija\(buildModel\(raw\), buildHija\(hija, now\)\);\n\s*marcarLogro\(state\.model\.hija, hija, safeStorage\(\)\);/);
  assert.match(app, /aplicarFiltro\(\$main, state\.ver\);[^\n]*\n\s*vestirHija\(\$main, m\.hija\);/);
});
