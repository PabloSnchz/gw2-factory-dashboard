// Centro de decisiones (FACTORY-001B MC-5): jerarquía, lenguaje, cola, canal y reglas visuales del GDS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel, buildChannel, CHANNEL_PROCESSING_MS } from '../js/model.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW, FIXTURE_ROOT } from './helpers.mjs';

const mem = readMemory();
const v3 = readMemory(join(FIXTURE_ROOT, '..', 'v3'));
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

async function model(files = { ...mem, ...v3 }, opts = {}) {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(files, opts), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  return buildModel(await loadAll(gh, NOW));
}

const MARK = '<!-- gds:decision-response v1 -->';
const issue = (n, minutesAgo, body, extra = {}) => ({
  number: n, html_url: `https://github.com/PabloSnchz/gw2-factory-dev/issues/${n}`,
  created_at: new Date(NOW - minutesAgo * 60000).toISOString(), updated_at: new Date(NOW - minutesAgo * 60000).toISOString(),
  body, ...extra,
});
const respBody = (req, code) => `${MARK}\n\n\`\`\`gds-response\nsolicitud: ${req}\nrespuesta: ${code}\nopcion: —\nhasta: —\n\`\`\`\n`;

/* ------------------------------------------------------------ jerarquía */

test('Hoy: lo que necesita a Pablo va antes que el estado de la Factory', async () => {
  const html = V.renderHome(await model());
  const order = ['verdict-title', 'Necesita tu decisión', '¿Qué está haciendo la Factory?', 'Qué debería preocuparte', 'Entornos'].map(s => html.indexOf(s));
  assert.ok(order.every(i => i >= 0), 'todas las secciones presentes');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'orden: veredicto → decisiones → Factory → preocupaciones → entornos');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, 'un único h1 por vista');
});

test('veredicto: una frase que dice qué hacer', async () => {
  const m = await model();
  assert.match(V.verdict(m).text, /^Hay \d+ cosas esperando tu decisión$/);
  const none = { ...m, human: [], channel: { available: true, items: [] }, health: { ...m.health, level: 'ok' } };
  assert.match(V.verdict(none).text, /nada necesita tu decisión/i);
});

test('tarjetas: la acción recomendada es el botón principal y va primero', async () => {
  const m = await model();
  const html = V.renderHome(m);
  const card = html.slice(html.indexOf('aria-labelledby="dq-REQ-002"'));
  const firstBtn = card.match(/<a class="gds-button ([^"]+)"[^>]*>([^<]+)/);
  assert.equal(firstBtn[1], 'gds-button--primary');
  assert.equal(firstBtn[2], 'Ya lo hice');
  assert.equal((card.slice(0, card.indexOf('</article>')).match(/gds-button--primary/g) || []).length, 1, 'un solo botón principal por tarjeta');
  assert.ok(html.includes('La Factory recomienda'));
});

/* ------------------------------------------------------------ lenguaje */

test('lenguaje: los títulos no empiezan con IDs internos; los IDs quedan como referencia secundaria', async () => {
  const files = { ...mem, ...v3 };
  files['status.md'] = files['status.md'].replace(/^Tarea actual: .*$/m, 'Tarea actual: BL-020 — FACTORY-001B: Centro de decisiones');
  const m = await model(files);
  const html = V.renderHome(m);
  const titles = [...html.matchAll(/<h3 id="dq-[^"]+" class="gds-title-1">([^<]*)/g)].map(x => x[1]);
  assert.equal(titles.length, m.human.length, 'una tarjeta con título por pendiente');
  for (const title of titles) assert.doesNotMatch(title, /^\[?(DEC|LES|FEAT|BL|RSK|REQ|RESP)-\d{3}/, title);
  assert.ok(titles.includes('Dashboard Factory: publicación y validación'), '"FEAT-001 Dashboard…" se muestra sin el ID');
  assert.ok(html.includes('FACTORY-001B: Centro de decisiones'));
  assert.ok(!html.includes('>BL-020 — FACTORY'), 'la tarea se muestra sin su ID delante');
  assert.equal(V.plainTitle('[REQ-001] BL-010 — Proteger producción'), 'Proteger producción');
  assert.ok(/class="gds-ref" href="#\/item\/REQ-002"/.test(html), 'el ID sigue accesible como referencia');
});

test('lenguaje: estados en palabras, no en códigos', () => {
  assert.equal(V.humanStatus('EN_CURSO').text, 'Trabajando');
  assert.equal(V.humanStatus('ESPERANDO_VALIDACIÓN').text, 'Esperando tu validación');
  assert.equal(V.humanStatus('BLOQUEADA').level, 'warn');
  assert.equal(V.humanStatus('').text, 'Sin dato');
});

/* ------------------------------------------------------------ cola de decisiones */

test('cola: un pendiente propio no se esconde dentro de otro ítem que solo lo cita', async () => {
  const files = { ...mem, ...v3 };
  files['backlog.md'] = files['backlog.md'].replace('· FEAT-001, DEC-008 — Bloqueado', '· FEAT-001, DEC-008, BL-020 — Bloqueado')
    .replace('## IN_PROGRESS\n', '## IN_PROGRESS\n\n- [BL-020] [ALTO] FACTORY-001B — Centro de decisiones. · BL-016\n');
  files['status.md'] = files['status.md'].replace('## Esperando a Pablo\n', '## Esperando a Pablo\n\n- [BL-020] Validar MC-4 para continuar con MC-5.\n');
  const m = await model(files);
  const ids = m.human.map(h => h.id);
  assert.ok(ids.includes('BL-020'), 'la validación pendiente aparece como ítem propio (antes quedaba dentro de BL-016)');
  assert.equal(m.human.find(h => h.id === 'BL-020').titulo, 'Validar MC-4 para continuar con MC-5.');
  assert.ok(!ids.includes('RSK-001'), 'un dato de contexto (riesgo) sí se sigue agrupando con su tarea');
  assert.equal(new Set(ids).size, ids.length);
});

/* ------------------------------------------------------------ canal de respuestas (errores visibles) */

test('canal: una respuesta que no se registró se ve en Hoy, en su tarjeta y en Salud', async () => {
  const m = await model(undefined, { issues: [issue(7, 30, respBody('REQ-002', 'DONE'))] });
  assert.equal(m.channel.items[0].state, 'failed');
  assert.equal(V.verdict(m).text, 'Una respuesta tuya no se pudo registrar');
  const html = V.renderHome(m);
  const card = html.slice(html.indexOf('aria-labelledby="dq-REQ-002"'));
  assert.match(card.slice(0, card.indexOf('</article>')), /no se pudo registrar[\s\S]*issues\/7/, 'el error aparece dentro de la tarjeta del pedido');
  assert.ok(m.health.checks.some(c => c.id === 'channel:failed:7' && c.level === 'warn'));
  assert.ok(m.concerns.some(c => /no se pudo registrar/.test(c.titulo)), 'también en "Qué debería preocuparte"');
});

test('canal: recién enviada se muestra como "registrando", no como error', async () => {
  const m = await model(undefined, { issues: [issue(8, 1, respBody('REQ-999', 'APPROVED'))] });
  assert.equal(m.channel.items[0].state, 'processing');
  const html = V.renderHome(m);
  assert.ok(html.includes('Registrando tu respuesta'), 'pedido desconocido: aviso suelto arriba de la cola');
  assert.ok(!m.health.checks.some(c => c.id.startsWith('channel:')));
});

test('canal: ignora PRs e issues sin la marca; si la API falla no rompe', async () => {
  const m = await model(undefined, { issues: [issue(9, 60, 'issue normal'), issue(10, 60, respBody('REQ-002', 'DONE'), { pull_request: {} })] });
  assert.deepEqual(m.channel, { available: true, items: [] });
  const down = await model(undefined, { issues: 'error' });
  assert.equal(down.channel.available, false);
  assert.ok(V.renderHealth(down).includes('no se pudo consultar'));
  assert.ok(down.health.checks.some(c => c.id === 'api:errors'), 'la falta de dato se informa');
  assert.equal(buildChannel([issue(1, 0, respBody('REQ-001', 'DONE'))], null, NOW).items[0].ageMs < CHANNEL_PROCESSING_MS, true);
});

/* ------------------------------------------------------------ accesibilidad (WCAG 2.1 AA) */

test('accesibilidad: estados con ícono y texto, ids únicos, foco y nombres accesibles', async () => {
  const files = { ...mem, ...v3 };
  files['status.md'] = files['status.md'].replace(/^Etapa actual: .*$/m, 'Etapa actual: DEVELOPMENT');
  const m = await model(files, { issues: [issue(7, 30, respBody('REQ-002', 'DONE'))] });
  const views = { home: V.renderHome(m), work: V.renderWork(m), risks: V.renderRisks(m), health: V.renderHealth(m), item: V.renderItem(m, 'REQ-002'), header: V.renderHeader(m, 'hoy', false) };
  for (const [name, html] of Object.entries(views)) {
    for (const s of html.match(/<span class="gds-status[^"]*">[\s\S]*?<\/span>/g) || []) {
      assert.match(s, /<svg[\s\S]*<\/svg>[^<\s]/, `${name}: estado con ícono y texto (no solo color): ${s.slice(0, 80)}`);
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
    assert.equal(new Set(ids).size, ids.length, `${name}: ids únicos`);
    for (const [, target] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(target), `${name}: aria-labelledby="${target}" apunta a un id existente`);
    for (const a of html.match(/<a [^>]*target="_blank"[^>]*>/g) || []) assert.ok(a.includes('rel="noopener"'), `${name}: noopener`);
    assert.ok(!/<svg(?![^>]*aria-hidden="true")[^>]*class="gds-icon/.test(html), `${name}: íconos decorativos`);
  }
  assert.match(views.header, /aria-current="page"/);
  assert.match(views.header, /<button id="btn-refresh" type="button"/);
  assert.match(views.home, /aria-current="step"/, 'el paso actual se anuncia');
  assert.match(views.home, /<span class="gds-visually-hidden"> pendientes<\/span>/, 'los contadores tienen texto para lector de pantalla');
});

test('accesibilidad: cada vista tiene un h1 y los niveles de título no se saltean (GDS §5)', async () => {
  const m = await model(undefined, { issues: [issue(7, 30, respBody('REQ-002', 'DONE'))] });
  const views = {
    home: V.renderHome(m), work: V.renderWork(m), knowledge: V.renderKnowledge(m, 'dec'), risks: V.renderRisks(m),
    activity: V.renderActivity(m, '7d'), health: V.renderHealth(m), req: V.renderItem(m, 'REQ-002'),
    dec: V.renderItem(m, 'DEC-008'), bl: V.renderItem(m, 'BL-016'), rsk: V.renderItem(m, 'RSK-001'),
  };
  for (const [name, html] of Object.entries(views)) {
    const levels = [...html.matchAll(/<h([1-6])\b/g)].map(x => Number(x[1]));
    assert.equal(levels[0], 1, `${name}: el primer título es h1`);
    assert.equal(levels.filter(l => l === 1).length, 1, `${name}: un solo h1`);
    levels.forEach((l, i) => { if (i) assert.ok(l <= levels[i - 1] + 1, `${name}: h${levels[i - 1]} → h${l} saltea un nivel`); });
  }
  assert.match(views.req, /<h2 id="dq-REQ-002" class="gds-title-1">Qué necesitás decidir<\/h2>/, 'en el detalle, la tarjeta es un h2 bajo el h1 del pedido');
});

test('textos: la procedencia de una alerta se dice en palabras, no en códigos', async () => {
  const m = await model();
  for (const c of m.concerns) assert.doesNotMatch(c.origen, /Salud · |medido$|declarado$|Backlog/, c.origen);
  const files = { ...mem, ...v3 };
  files['status.md'] = files['status.md'].replace(/^Estado: .*$/m, 'Estado: EN_CURSO');
  files['backlog.md'] = files['backlog.md'].replace(/## IN_PROGRESS\n[\s\S]*?(?=\n## )/, '## IN_PROGRESS\n');
  const busy = await model(files);
  const check = busy.health.checks.find(c => c.id === 'status:noprogress');
  assert.ok(check, 'el chequeo se dispara');
  assert.doesNotMatch(check.title, /IN_PROGRESS|EN_CURSO|status\.md/, 'el título no expone códigos internos');
  assert.match(check.detail, /EN_CURSO/, 'el detalle técnico queda disponible');
});

test('accesibilidad: index.html con salto al contenido, región viva e idioma', () => {
  const html = read('index.html');
  assert.match(html, /<html lang="es">/);
  assert.match(html, /<body class="gds">/);
  assert.match(html, /<a class="gds-skip" href="#app-main">/);
  assert.match(html, /<main id="app-main"[^>]*tabindex="-1"/);
  assert.match(html, /aria-live="polite"/);
  const css = [...html.matchAll(/href="([^"?]+\.css)/g)].map(x => x[1]);
  assert.deepEqual(css, ['gds/tokens.css', 'gds/components.css', 'css/app.css'], 'tokens → componentes → disposición');
  const app = read('js/app.js');
  assert.match(app, /\$main\.focus\(/, 'al cambiar de vista el foco pasa al contenido');
});

/* ------------------------------------------------------------ reglas del GDS en la aplicación */

test('GDS: la aplicación no usa colores sueltos y solo referencia tokens existentes', () => {
  const tokens = new Set([...read('gds/tokens.css').matchAll(/(--gds-[\w-]+)\s*:/g)].map(x => x[1]));
  const css = read('css/app.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, 'sin hex');
  assert.doesNotMatch(css, /\b(rgb|rgba|hsl|hsla)\(/, 'sin rgb/hsl');
  assert.doesNotMatch(css, /--gds-p-/, 'sin primitivos');
  const literal = css.replace(/@media[^{]+/g, '').match(/(?<![\w-])\d+(\.\d+)?(px|rem|em)\b/g) || [];
  assert.deepEqual(literal, [], 'medidas solo con tokens (salvo cortes de @media)');
  for (const src of [css, read('js/views.js')]) {
    for (const [, name] of src.matchAll(/var\((--gds-[\w-]+)\)/g)) assert.ok(tokens.has(name), name + ' existe');
  }
  const views = read('js/views.js');
  assert.doesNotMatch(views, /style="/, 'las vistas no usan estilos en línea');
  // GDS 1.0.1: un componente usado como <a> no hereda el color de enlace de ".gds a".
  const comp = read('gds/components.css');
  for (const cls of ['gds-button--primary', 'gds-button--secondary', 'gds-button--ghost', 'gds-button--danger', 'gds-metric', 'gds-ref', 'gds-tab']) {
    assert.match(comp, new RegExp(`\\.gds a\\.${cls}\\s*[,{]`), `.gds a.${cls} define su color`);
  }
  assert.doesNotMatch(views, /#[0-9a-fA-F]{6}\b/, 'las vistas no usan hex');
});
