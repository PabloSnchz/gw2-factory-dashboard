import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseStatus, parseBacklog, parseRisks, parseIndex, parseEntry, parseRoadmap,
  parseDate, extractIds, mdToHtml, esc,
} from '../js/parse.js';
import { readMemory } from './helpers.mjs';

const mem = readMemory();

test('status v2: claves de una línea y secciones', () => {
  const s = parseStatus(mem['status.md']);
  assert.equal(s.estado, 'ESPERANDO_VALIDACIÓN');
  assert.match(s.tarea, /^FEAT-001/);
  assert.match(s.motivo, /60 segundos/);
  assert.equal(s.inicio, '2026-10-20T00:10Z');
  assert.ok(parseDate(s.actualizado));
  assert.ok(s.esperandoPablo.length >= 4);
  assert.equal(s.bloqueos.length, 1);
  assert.deepEqual(s.unknownKeys, []);
});

test('status v1 (formato de la inicialización) sigue siendo legible', () => {
  const v1 = '# STATUS\n\nEstado: IDLE\n\nFeature actual:\n- Ninguna\n\nÚltima actualización:\n- 2026-10-19 — Inicialización\n\nPróxima acción:\n- Esperar\n';
  const s = parseStatus(v1);
  assert.equal(s.estado, 'IDLE');
  assert.equal(s.tarea, 'Ninguna');
  assert.equal(parseDate(s.actualizado).toISOString(), '2026-10-19T00:00:00.000Z');
  assert.equal(s.proxima, 'Esperar');
});

test('status ausente devuelve null (nunca un objeto vacío engañoso)', () => {
  assert.equal(parseStatus(null), null);
});

test('backlog: secciones, prioridad, referencias y fecha de cierre', () => {
  const b = parseBacklog(mem['backlog.md']);
  assert.ok(b.READY.length > 0 && b.BLOCKED.length > 0 && b.DONE.length > 0);
  assert.equal(b.malformed.length, 0);
  const bl16 = b.BLOCKED.find(x => x.id === 'BL-016');
  assert.equal(bl16.prioridad, 'ALTO');
  assert.ok(bl16.refs.includes('FEAT-001'));
  const bl0 = b.DONE.find(x => x.id === 'BL-000');
  assert.equal(bl0.fecha.toISOString().slice(0, 10), '2026-10-19');
});

test('riesgos: tabla completa', () => {
  const r = parseRisks(mem['risks.md']);
  assert.equal(r.length, 7);
  assert.deepEqual(r[0], {
    id: 'RSK-001', severidad: 'ALTO', estado: 'ABIERTO', riesgo: r[0].riesgo, mitigacion: r[0].mitigacion,
    responsable: 'Pablo', refs: ['BL-010'],
  });
  assert.ok(r.some(x => x.estado === 'MITIGADO'));
});

test('índice: secciones y links', () => {
  const i = parseIndex(mem['memory-index.md']);
  assert.equal(i.DECISIONS.length, 9);
  assert.equal(i.LESSONS.length, 11);
  assert.equal(i.FEATURES.length, 2);
  assert.equal(i.DECISIONS[4].path, 'decisions/DEC-005-entorno-dev-publicado.md');
});

test('entradas: título, metadatos y estado', () => {
  const d = parseEntry(mem['decisions/DEC-005-entorno-dev-publicado.md'], 'decisions/DEC-005-entorno-dev-publicado.md');
  assert.equal(d.id, 'DEC-005');
  assert.equal(d.estadoCodigo, 'PROPUESTA');
  assert.equal(d.fecha.toISOString().slice(0, 10), '2026-10-19');
  const l = parseEntry(mem['lessons/LES-001-verificar-codigo-real.md'], 'x');
  assert.equal(l.fechaTexto, '2026-10-19');
  const r = parseEntry(mem['decisions/DEC-007-dashboard-fuente-factory.md'], 'x');
  assert.equal(r.estadoCodigo, 'REEMPLAZADA');
});

test('roadmap: fases', () => {
  const r = parseRoadmap(mem['roadmap.md']);
  assert.equal(r.length, 4);
  assert.equal(r[1].id, 'F1');
  assert.equal(r[1].estado, 'EN CURSO');
});

test('fechas', () => {
  assert.equal(parseDate('2026-10-20T00:10Z').toISOString(), '2026-10-20T00:10:00.000Z');
  assert.equal(parseDate('2026-10-05T12:39:24-03:00').toISOString(), '2026-10-05T15:39:24.000Z');
  assert.equal(parseDate('sin fecha'), null);
});

test('IDs', () => {
  assert.deepEqual(extractIds('ver DEC-001..003, BL-010 y RSK-001; ALERT-84 no'), ['DEC-001', 'BL-010', 'RSK-001']);
});

test('markdown seguro: escapa HTML y bloquea javascript:', () => {
  const html = mdToHtml('# T\n<script>alert(1)</script>\n\n[x](javascript:alert(1)) **b** `c<d>`\n\n| a | b |\n|---|---|\n| <i> | 2 |');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('<strong>b</strong>'));
  assert.ok(html.includes('<code>c&lt;d&gt;</code>'));
  assert.ok(html.includes('<td>&lt;i&gt;</td>'));
  assert.equal(esc('"\'<>&'), '&quot;&#39;&lt;&gt;&amp;');
});

test('la memoria real está en UTF-8 limpio', () => {
  for (const [p, t] of Object.entries(mem)) {
    assert.ok(!t.includes('\uFFFD'), p);
    assert.ok(!t.startsWith('\uFEFF'), p);
  }
});
