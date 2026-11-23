// Shiruna en el Centro de mando (S-4, DEC-053): lectura sin cuota, modelo chico, unión con mi cola y filtro por dueña.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CONFIG } from '../js/config.js';
import {
  hijaUrl, hijaBoveda, loadHija, lineaHija, estadoHija, buildHija, renderHija, unirHija, renderFiltro, aplicarFiltro,
  HIJA_FILES, HIJA_VERSION, DUENA_MIA,
} from '../js/hija.js';

const NOW = Date.parse('2026-11-21T21:00:00Z');
const HIJA = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };

const STATUS = `# Estado de Shiruna

Estado: EN CURSO
Tarea actual: Nacer: identidad, memoria limpia y lugar en el Centro de mando.
Motivo: Pablo necesita llevar a Shiruvana fuera de Copilot Studio.
Etapa actual: DOCUMENTATION
Inicio: 2026-11-21 20:26Z
Última actualización: 2026-11-21 20:50Z
Próxima acción: Mi madre me suma al Centro de mando (S-4).

## Esperando a Pablo

- Info: Nací el 2026-11-21. Todavía no tengo motor.
- [BL-001] Validación: mirar <b>mi</b> tarjeta (ver BL-016)
- Decisión: elegir mi motor

## Para tu información

- Mi ADN está en identidad/ADN.md.
`;
const BACKLOG = `# Backlog

## READY

- [BL-001] [ALTO] Elegir mi motor — algo — 2026-11-21

## IN_PROGRESS

- [BL-000] [ALTO] Nacer — S-1..S-4 — 2026-11-21

## BLOCKED

## DONE
`;
const ROADMAP = `| Fase | Objetivo | Criterio de salida | Estado |
|------|----------|--------------------|--------|
| F0 — Nacimiento | x | y | EN_CURSO |
| F1 — Motor | x | y | PENDIENTE |
`;
const FILES = { 'status.md': STATUS, 'backlog.md': BACKLOG, 'roadmap.md': ROADMAP };
const hija = () => buildHija({ files: FILES, errors: {} }, NOW, HIJA);

test('versión y config: la hija es Shiruna en su propia organización', () => {
  assert.equal(HIJA_VERSION, '1.2.0');
  assert.equal(DUENA_MIA, 'shiruvana');
  assert.deepEqual(CONFIG.hija, HIJA);
});

test('hijaUrl: raw de su repo, rama main, con parámetro que cambia cada 5 min', () => {
  const u = hijaUrl('status.md', NOW, HIJA);
  assert.match(u, /^https:\/\/raw\.githubusercontent\.com\/shiruna-gato-negro\/gw2-factory-dev\/main\/ai-memory\/status\.md\?v=\d+$/);
  assert.equal(hijaUrl('status.md', NOW + 60000, HIJA), u);
  assert.notEqual(hijaUrl('status.md', NOW + 300000, HIJA), u);
});

test('loadHija: solo raw (sin api.github.com), y nunca lanza', async () => {
  const pedidas = [];
  const ok = await loadHija({ now: NOW, hija: HIJA, fetchImpl: async (url) => {
    pedidas.push(url);
    if (url.includes('roadmap')) return { ok: false, status: 404 };
    if (url.includes('backlog')) throw new Error('red');
    return { ok: true, status: 200, text: async () => STATUS };
  } });
  assert.equal(pedidas.length, HIJA_FILES.length);
  assert.ok(pedidas.every(u => u.startsWith('https://raw.githubusercontent.com/')));
  assert.equal(ok.files['status.md'], STATUS);
  assert.equal(ok.files['roadmap.md'], null);
  assert.equal(ok.errors['roadmap.md'], 'no existe');
  assert.equal(ok.errors['backlog.md'], 'error de red');
  assert.equal(await loadHija({ hija: null }), null);
});

test('lineaHija y estadoHija', () => {
  assert.deepEqual(lineaHija('[BL-001] Validación: mirar'), { id: 'BL-001', clase: 'validacion', texto: 'mirar' });
  assert.deepEqual(lineaHija('Info: nací'), { id: null, clase: 'info', texto: 'nací' });
  assert.equal(lineaHija('algo sin clase').clase, 'accion');
  assert.equal(lineaHija('Decisión: x').clase, 'decision');
  assert.equal(estadoHija('EN CURSO').level, 'ok');
  assert.equal(estadoHija('BLOQUEADA').level, 'warn');
  assert.equal(estadoHija('').text, 'Sin dato');
});

test('buildHija: estado, tarea, fase, pendientes e info', () => {
  const h = hija();
  assert.equal(h.leida, true);
  assert.equal(h.nombre, 'Shiruna');
  assert.equal(h.key, 'shiruna');
  assert.equal(h.estado.text, 'Trabajando');
  assert.match(h.tarea, /^Nacer/);
  assert.equal(h.etapa, 'DOCUMENTATION');
  assert.equal(h.actualizadoMs, 10 * 60000);
  assert.equal(h.fase.id, 'F0');
  assert.deepEqual(h.enCurso.map(x => x.id), ['BL-000']);
  assert.deepEqual(h.pendientes.map(p => p.clase), ['validacion', 'decision']);
  assert.equal(h.info.length, 2);
  assert.match(h.url, /shiruna-gato-negro\/gw2-factory-dev\/tree\/main\/ai-memory$/);
});

test('buildHija: sin status.md dice por qué; sin hija o sin datos, null', () => {
  const h = buildHija({ files: { 'status.md': null }, errors: { 'status.md': 'no existe' } }, NOW, HIJA);
  assert.equal(h.leida, false);
  assert.equal(h.error, 'no existe');
  assert.equal(buildHija(null, NOW, HIJA), null);
  assert.equal(buildHija({ files: {} }, NOW, null), null);
});

test('unirHija: sus pendientes entran en mi cola por clase, con su nombre y sin ID mío', () => {
  const mio = [{ id: 'REQ-001', clase: 'decision', titulo: 'mía D' }, { id: 'BL-016', clase: 'accion', titulo: 'mía A' }];
  mio.skipped = ['DEC-007'];
  const m = unirHija({ human: mio, info: [{ id: null, titulo: 'mi aviso', origen: 'status.md' }] }, hija());
  assert.deepEqual(m.human.map(x => x.titulo), ['mía D', 'elegir mi motor', 'mía A', 'mirar <b>mi</b> tarjeta (ver BL-016)']);
  assert.deepEqual(m.human.skipped, ['DEC-007'], 'conserva lo descartado para Salud');
  const suya = m.human.find(x => x.duena);
  assert.equal(suya.id, null, 'sus IDs no se confunden con los de mi memoria');
  assert.equal(suya.duena, 'Shiruna');
  assert.equal(suya.duenaKey, 'shiruna');
  assert.equal(m.human.find(x => x.suId === 'BL-001').clase, 'validacion');
  assert.equal(m.info.length, 3);
  assert.equal(m.info[1].duena, 'Shiruna');
  assert.equal(m.hija.nombre, 'Shiruna');
});

test('unirHija: sin hija o sin leer, mi modelo no cambia (y la hija queda para su tarjeta)', () => {
  const human = [{ id: 'BL-016', clase: 'accion', titulo: 'x' }];
  const m = unirHija({ human, info: [] }, null);
  assert.equal(m.human, human);
  assert.equal(m.hija, null);
  const e = unirHija({ human, info: [] }, buildHija({ files: {}, errors: { 'status.md': 'HTTP 500' } }, NOW, HIJA));
  assert.equal(e.human, human);
  assert.equal(e.hija.leida, false);
  assert.equal(unirHija(null, hija()), null);
});

test('renderHija: tarjeta con su nombre y dueña, sin repetir la lista, escapada y con link a su memoria', () => {
  const html = renderHija(hija());
  assert.match(html, /data-hija="ok"/);
  assert.match(html, /data-duena="shiruna"/);
  assert.match(html, /Mi hija · Shiruna/);
  assert.match(html, /¿Qué está haciendo Shiruna\?/);
  assert.match(html, /F0 · Nacimiento/);
  assert.match(html, /Te pide 2 cosas: están en «02 · Te toca»/);
  assert.ok(!html.includes('<b>mi</b>'));
  assert.match(html, /hace 10 min/);
  const err = renderHija(buildHija({ files: {}, errors: { 'status.md': 'HTTP 500' } }, NOW, HIJA));
  assert.match(err, /data-hija="error"/);
  assert.match(err, /No pude leer la memoria de Shiruna/);
  assert.match(err, /HTTP 500/);
  assert.equal(renderHija(null), '');
});

test('Su Bóveda: su DEV en GitHub Pages, un botón en la tarjeta (también si no pude leer su memoria)', () => {
  assert.equal(hijaBoveda(HIJA), 'https://shiruna-gato-negro.github.io/gw2-factory-dev/');
  assert.equal(hijaBoveda({ ...HIJA, owner: 'Otra-Org' }), 'https://otra-org.github.io/gw2-factory-dev/', 'Pages va en minúsculas');
  assert.equal(hijaBoveda({ ...HIJA, boveda: 'https://x.dev/' }), 'https://x.dev/');
  assert.equal(hijaBoveda(null), null);
  assert.equal(hija().boveda, 'https://shiruna-gato-negro.github.io/gw2-factory-dev/');
  const btn = /<a class="gds-button gds-button--sm gds-button--primary" href="https:\/\/shiruna-gato-negro\.github\.io\/gw2-factory-dev\/" target="_blank" rel="noopener" data-boveda>Su Bóveda<\/a>/;
  const ok = renderHija(hija());
  assert.match(ok, btn);
  assert.ok(ok.indexOf('data-boveda') < ok.indexOf('Ver la memoria de Shiruna'), 'el botón va antes del link a su memoria');
  assert.match(renderHija(buildHija({ files: {}, errors: { 'status.md': 'HTTP 500' } }, NOW, HIJA)), btn);
  assert.ok(!renderHija({ ...hija(), boveda: null }).includes('data-boveda'), 'sin dirección, sin botón');
});

test('renderFiltro: Las dos · Shiruvana · Shiruna, arranca en Las dos', () => {
  const html = renderFiltro(hija());
  assert.match(html, /role="group" aria-label="Mostrar lo de"/);
  assert.deepEqual([...html.matchAll(/data-ver="([^"]+)"/g)].map(x => x[1]), ['todas', 'shiruvana', 'shiruna']);
  assert.deepEqual([...html.matchAll(/aria-pressed="([^"]+)"/g)].map(x => x[1]), ['true', 'false', 'false']);
  assert.equal(renderFiltro(null), '');
});

/** DOM mínimo para el filtro: elementos con dataset, style y classList. */
function fakeRoot() {
  const el = (attrs) => {
    const classes = new Set(attrs.cls || []);
    return {
      dataset: attrs.dataset, style: { display: '' }, attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), has: (c) => classes.has(c) },
    };
  };
  const items = [el({ dataset: { duena: 'shiruvana' } }), el({ dataset: { duena: 'shiruna' } }), el({ dataset: { duena: 'shiruvana' } })];
  const botones = ['todas', 'shiruvana', 'shiruna'].map(v => el({ dataset: { ver: v } }));
  return { items, botones, querySelectorAll: (s) => (s === '[data-duena]' ? items : s === '[data-ver]' ? botones : []) };
}

test('aplicarFiltro: oculta lo de la otra, marca el botón y vuelve a Las dos', () => {
  const r = fakeRoot();
  aplicarFiltro(r, 'shiruna');
  assert.deepEqual(r.items.map(i => i.style.display), ['none', '', 'none']);
  assert.deepEqual(r.botones.map(b => b.attrs['aria-pressed']), ['false', 'false', 'true']);
  assert.ok(r.botones[2].classList.has('gds-button--primary'));
  aplicarFiltro(r, 'shiruvana');
  assert.deepEqual(r.items.map(i => i.style.display), ['', 'none', '']);
  aplicarFiltro(r, null);
  assert.deepEqual(r.items.map(i => i.style.display), ['', '', '']);
  assert.equal(r.botones[0].attrs['aria-pressed'], 'true');
  aplicarFiltro(null, 'shiruna'); // sin DOM no tira
});

test('app.js: lee a Shiruna junto con mi memoria, la une al modelo y vuelve a aplicar el filtro en cada dibujo', () => {
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /import \{ loadHija, buildHija, unirHija, aplicarFiltro \} from '\.\/hija\.js';/);
  assert.match(app, /Promise\.all\(\[loadAll\(gh, now\), loadHija\(\{ now \}\)\]\)/);
  assert.match(app, /state\.model = unirHija\(buildModel\(raw\), buildHija\(hija, now\)\);/);
  assert.match(app, /montarGlobo\(m\);[^\n]*\n\s*aplicarFiltro\(\$main, state\.ver\);/);
  assert.match(app, /closest\('button\[data-ver\]'\)/);
  assert.doesNotMatch(app, /localStorage\.setItem\([^)]*ver/, 'el filtro no se guarda en el navegador');
});
