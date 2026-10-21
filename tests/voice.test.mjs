// Voz de Shiruvana en el panel (DEC-024): Gato Negro Factory es la marca; Shiruvana es la voz.
// El avatar aparece solo cuando ella recomienda, advierte, decide o resume; nunca en datos del sistema.
// Un solo avatar por sección visible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import * as V from '../js/views.js';
import { readMemory, mockFetch, NOW, FIXTURE_ROOT } from './helpers.mjs';

const mem = readMemory();
const v3 = readMemory(join(FIXTURE_ROOT, '..', 'v3'));

async function model(files) {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(files), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  return buildModel(await loadAll(gh, NOW));
}

const req = (n, titulo) => `# REQ-${n} — ${titulo}

- Estado: ABIERTA
- Tipo: decisión
- Fecha: 2026-10-20
- Prioridad: MEDIO
- Relacionado: BL-001

## Qué pasó

Contexto de la decisión ${n}.

## Por qué importa

Cambia lo que ve el usuario.

## Por qué te lo pregunto

Es una decisión de producto.

## Opciones

- A — Hacerlo.
- B — No hacerlo.

## Recomendación

A — Recomendación ${n} de la Factory.
`;

const summary = '\n## Resumen de la sesión\n\n- Cerré BL-013.\n- Registré DEC-024:\n  - detalle que no se muestra.\n- Próximo: BL-034.\n- Cuarta línea.\n';
const critical = '| RSK-098 | CRÍTICO | ABIERTO | Un cambio tocaría producción sin autorización. | Detener y preguntar. | Factory | BL-010 |\n' +
  '| RSK-099 | CRÍTICO | ABIERTO | Se perdió la memoria de la última sesión. | Reconstruir desde Git. | Factory | BL-010 |\n';

const files = () => ({
  ...mem, ...v3,
  'status.md': mem['status.md'] + summary,
  'risks.md': mem['risks.md'].replace('| RSK-001 |', critical + '| RSK-001 |'),
  'requests/REQ-010-uno.md': req('010', '¿Primera decisión?'),
  'requests/REQ-011-dos.md': req('011', '¿Segunda decisión?'),
});

/** Secciones de Hoy con la cantidad de mensajes y avatares de Shiruvana de cada una. */
function sections(html) {
  return html.split(/<section /).slice(1).map(s => ({
    id: (s.match(/aria-labelledby="([^"]+)"/) || [])[1],
    voices: (s.match(/class="gds-voice /g) || []).length,
    avatars: (s.match(/class="gds-voice__avatar/g) || []).length,
    html: s,
  }));
}

test('voz: recomienda, advierte, decide y resume con su rótulo', async () => {
  const html = V.renderHome(await model(files()));
  for (const s of ['Shiruvana recomienda', 'Shiruvana advierte · Crítico', 'Shiruvana decidió', 'Shiruvana resume']) assert.ok(html.includes(s), s);
  assert.ok(html.includes('Recomendación 010 de la Factory') && html.includes('Recomendación 011 de la Factory'));
  assert.ok(!html.includes('La Factory recomienda'), 'la recomendación ya no es un aviso genérico');
});

test('voz: un solo avatar por sección visible', async () => {
  const list = sections(V.renderHome(await model(files())));
  const withVoice = list.filter(s => s.voices);
  assert.ok(withVoice.length >= 4, 'advertencias, decisiones, resumen y decididas');
  for (const s of withVoice) assert.equal(s.avatars, 1, `${s.id}: ${s.voices} mensajes y ${s.avatars} avatares`);
  const human = list.find(s => s.id === 'human-title');
  assert.ok(human.voices >= 2, 'varias recomendaciones: solo la primera con avatar');
  assert.match(human.html, /gds-voice--recomienda gds-voice--compact/);
});

test('voz: tamaños — 56 px en resumen y decisión importante, 48 px en el resto', async () => {
  const list = sections(V.renderHome(await model(files())));
  const by = id => list.find(s => s.id === id).html;
  assert.match(by('summary-title'), /gds-voice__avatar gds-voice__avatar--lg"[^>]* width="56"/);
  assert.match(by('decided-title'), /gds-voice__avatar gds-voice__avatar--lg"[^>]* width="56"/);
  assert.match(by('warn-title'), /class="gds-voice__avatar"[^>]* width="48"/);
  assert.match(by('human-title'), /class="gds-voice__avatar"[^>]* width="48"/);
});

test('voz: el resumen muestra hasta 3 viñetas de primer nivel', async () => {
  const s = sections(V.renderHome(await model(files()))).find(x => x.id === 'summary-title').html;
  assert.equal((s.match(/<li>/g) || []).length, 3);
  assert.ok(!s.includes('detalle que no se muestra'), 'las viñetas anidadas no se muestran');
  assert.ok(s.includes('Y 1 más en status.md'));
});

test('voz: solo decisiones de la Factory; las de Pablo no son "Shiruvana decidió"', async () => {
  const pablo = '# DEC-030 — Algo que eligió Pablo\n\n- Estado: ACEPTADA — decidida por Pablo el 2026-10-21\n- Fecha: 2026-10-21\n\n## Decisión\n\nX.\n';
  const m = await model({ ...files(), 'decisions/DEC-030-pablo.md': pablo });
  const ids = V.factoryDecisions(m).map(d => d.id);
  assert.ok(ids.length > 0);
  assert.ok(!ids.includes('DEC-030'), 'una decisión de Pablo no se atribuye a Shiruvana');
  assert.ok(ids.every(id => (m.entries.DEC.find(d => d.id === id).estadoCodigo) === 'ACEPTADA'));
});

test('voz: nunca en la cabecera, las métricas ni sin nada que decir', async () => {
  const m = await model(files());
  const header = V.renderHeader(m, 'hoy', false);
  assert.ok(header.includes('gds-brand-mark') && header.includes('Gato Negro Factory') && header.includes('Centro de decisiones'), 'la marca sigue en la cabecera');
  assert.ok(!header.includes('gds-voice'), 'la cabecera no lleva a Shiruvana');
  const html = V.renderHome(m);
  const metrics = html.slice(html.indexOf('id="metrics-title"'));
  assert.ok(!metrics.includes('gds-voice'), 'las métricas son datos: sin avatar');
  for (const view of [V.renderWork(m), V.renderRisks(m), V.renderHealth(m), V.renderActivity(m, '7d')]) assert.ok(!view.includes('gds-voice__avatar'), 'vistas de datos sin avatar');
  const quiet = V.renderHome(await model({ ...mem, ...v3 }));
  assert.ok(!sections(quiet).some(s => s.id === 'warn-title' || s.id === 'summary-title'), 'sin riesgos críticos ni resumen: no habla');
});
