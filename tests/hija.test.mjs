// Shiruna en el Centro de mando (S-4a, DEC-053): lectura sin cuota, modelo chico y tarjeta escapada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { hijaUrl, loadHija, lineaHija, estadoHija, buildHija, renderHija, HIJA_FILES } from '../js/hija.js';

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
- [BL-001] Validación: mirar <b>mi</b> tarjeta

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

test('config: la hija es Shiruna en su propia organización', () => {
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
  const h = buildHija({ files: { 'status.md': STATUS, 'backlog.md': BACKLOG, 'roadmap.md': ROADMAP }, errors: {} }, NOW, HIJA);
  assert.equal(h.leida, true);
  assert.equal(h.nombre, 'Shiruna');
  assert.equal(h.estado.text, 'Trabajando');
  assert.match(h.tarea, /^Nacer/);
  assert.equal(h.etapa, 'DOCUMENTATION');
  assert.equal(h.actualizadoMs, 10 * 60000);
  assert.equal(h.fase.id, 'F0');
  assert.deepEqual(h.enCurso.map(x => x.id), ['BL-000']);
  assert.equal(h.pendientes.length, 1);
  assert.equal(h.pendientes[0].clase, 'validacion');
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

test('renderHija: tarjeta con su nombre, todo escapado y link a su memoria', () => {
  const h = buildHija({ files: { 'status.md': STATUS, 'backlog.md': BACKLOG, 'roadmap.md': ROADMAP }, errors: {} }, NOW, HIJA);
  const html = renderHija(h);
  assert.match(html, /data-hija="ok"/);
  assert.match(html, /Mi hija · Shiruna/);
  assert.match(html, /¿Qué está haciendo Shiruna\?/);
  assert.match(html, /Te pide/);
  assert.match(html, /Shiruna · BL-001/);
  assert.match(html, /F0 · Nacimiento/);
  assert.ok(!html.includes('<b>mi</b>'), 'el texto de su memoria se escapa');
  assert.match(html, /&lt;b&gt;mi&lt;\/b&gt;/);
  assert.match(html, /hace 10 min/);
  const err = renderHija(buildHija({ files: {}, errors: { 'status.md': 'HTTP 500' } }, NOW, HIJA));
  assert.match(err, /data-hija="error"/);
  assert.match(err, /No pude leer la memoria de Shiruna/);
  assert.match(err, /HTTP 500/);
  assert.equal(renderHija(null), '');
});

test('app.js: lee a Shiruna junto con la memoria y pone su tarjeta debajo de «La Factory ahora»', async () => {
  const { readFileSync } = await import('node:fs');
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.match(app, /import \{ loadHija, buildHija, renderHija \} from '\.\/hija\.js';/);
  assert.match(app, /Promise\.all\(\[loadAll\(gh, now\), loadHija\(\{ now \}\)\]\)/);
  assert.match(app, /state\.model\.hija = buildHija\(hija, now\);/);
  assert.match(app, /insertAdjacentHTML\('afterend', renderHija\(m\.hija\)\)/);
});
