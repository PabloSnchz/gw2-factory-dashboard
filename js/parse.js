/**
 * js/parse.js — Parsers puros de ai-memory (sin DOM, sin red).
 *
 * Contrato de formato: docs/DATA-CONTRACT.md.
 * Regla: un parser nunca inventa datos. Si un campo no está, devuelve null
 * y el modelo lo reporta como "sin dato", nunca como 0 o vacío silencioso.
 */

export const ID_RE = /\b(DEC|LES|FEAT|BL|RSK)-\d{3}\b/g;
export const PRIORITIES = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
export const BACKLOG_SECTIONS = ['READY', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

/* ------------------------------------------------------------ utilidades */

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function normalizeNewlines(md) {
  return String(md || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

export function extractIds(text) {
  const out = new Set();
  for (const m of String(text || '').matchAll(ID_RE)) out.add(m[0]);
  return [...out];
}

/** Acepta "2026-10-19", "2026-10-19 23:52", "2026-10-19T23:52Z", ISO completo. */
export function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  const m = s.match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?)\s*(Z|UTC|[+-]\d{2}:?\d{2})?)?/);
  if (!m) return null;
  let iso = m[1];
  if (m[2]) {
    const tz = !m[3] || m[3] === 'UTC' ? 'Z' : m[3];
    iso += 'T' + (m[2].length === 5 ? m[2] + ':00' : m[2]) + tz;
  } else {
    iso += 'T00:00:00Z';
  }
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function splitSections(md) {
  // Devuelve [{title, level, lines}] incluyendo un bloque inicial sin título.
  const out = [{ title: null, level: 0, lines: [] }];
  for (const line of normalizeNewlines(md).split('\n')) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) out.push({ title: h[2].trim(), level: h[1].length, lines: [] });
    else out[out.length - 1].lines.push(line);
  }
  return out;
}

function bulletText(line) {
  const m = line.match(/^\s*[-*]\s+(.*)$/);
  return m ? m[1].trim() : null;
}

/* ------------------------------------------------------------ status.md */

const STATUS_KEYS = {
  'estado': 'estado',
  'fase actual': 'fase',
  'fase': 'fase',
  'tarea actual': 'tarea',
  'feature actual': 'tarea',
  'motivo': 'motivo',
  'por qué': 'motivo',
  'etapa actual': 'etapa',
  'etapa': 'etapa',
  'inicio': 'inicio',
  'inicio de la tarea': 'inicio',
  'última actualización': 'actualizado',
  'ultima actualización': 'actualizado',
  'ultima actualizacion': 'actualizado',
  'próxima acción': 'proxima',
  'proxima accion': 'proxima',
  'bloqueos': 'bloqueos',
  'esperando a pablo': 'esperandoPablo',
  'decisiones pendientes de pablo': 'esperandoPablo',
  'para tu información': 'paraInfo',
  'para tu informacion': 'paraInfo',
  'resumen de la sesión': 'resumen',
  'resumen de la sesion': 'resumen',
};

/**
 * Tolera dos formas:
 *   "Clave: valor"            (contrato v2)
 *   "Clave:\n- valor\n- ..."  (forma v1, inicialización 2026-10-19)
 * Y secciones "## Esperando a Pablo" / "## Para tu información" / "## Bloqueos" con bullets.
 * En "Esperando a Pablo" cada línea declara su clase (contrato v4, DEC-018):
 *   "- [ID] Acción: …" · "- [ID] Validación: …" · "- [ID] Decisión: …" (solo con un pedido REQ) · "- [ID] Info: …"
 * "## Resumen de la sesión" (DEC-024): solo las viñetas de primer nivel; las anidadas son detalle.
 */
export function parseStatus(md) {
  const res = {
    estado: null, fase: null, tarea: null, motivo: null, etapa: null,
    inicio: null, actualizado: null, proxima: null,
    bloqueos: [], esperandoPablo: [], paraInfo: [], resumen: [], unknownKeys: [],
  };
  if (md == null) return null;
  let current = null;
  const lines = normalizeNewlines(md).split('\n');
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^#{2,6}\s+(.*)$/);
    if (h) {
      const key = STATUS_KEYS[h[1].trim().toLowerCase()];
      current = key || null;
      continue;
    }
    if (/^#\s/.test(line)) continue;
    const kv = line.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,40}):\s*(.*)$/);
    if (kv && !/^\s*[-*]/.test(line)) {
      const key = STATUS_KEYS[kv[1].trim().toLowerCase()];
      if (!key) { res.unknownKeys.push(kv[1].trim()); current = null; continue; }
      current = key;
      if (kv[2]) assignStatus(res, key, kv[2].trim());
      continue;
    }
    const b = bulletText(line);
    if (b && current === 'resumen' && /^\s/.test(line)) continue;
    if (b && current) assignStatus(res, current, b);
  }
  return res;
}

function assignStatus(res, key, value) {
  if (value === '-' || value === '') return;
  if (Array.isArray(res[key])) { res[key].push(value); return; }
  res[key] = res[key] ? res[key] + ' · ' + value : value;
}

/* ------------------------------------------------------------ backlog.md */

export function parseBacklogItem(text) {
  const m = text.match(/^\[([A-Z]+-\d{3})\]\s*(?:\[([^\]]+)\])?\s*(.*)$/);
  if (!m) return null;
  const rest = m[3] || '';
  const [titulo, ...detalle] = rest.split(/\s+—\s+/);
  const dates = rest.match(/\d{4}-\d{2}-\d{2}/g);
  return {
    id: m[1],
    fecha: dates ? parseDate(dates[dates.length - 1]) : null,
    prioridad: m[2] && PRIORITIES.includes(m[2].toUpperCase()) ? m[2].toUpperCase() : null,
    titulo: titulo.trim(),
    detalle: detalle.join(' — ').trim(),
    refs: extractIds(rest).filter(x => x !== m[1]),
    raw: text,
  };
}

export function parseBacklog(md) {
  if (md == null) return null;
  const res = { READY: [], IN_PROGRESS: [], BLOCKED: [], DONE: [], malformed: [] };
  let section = null;
  for (const s of splitSections(md)) {
    if (s.level === 2) section = BACKLOG_SECTIONS.find(x => x === s.title.toUpperCase().replace(/\s+/g, '_')) || null;
    if (!section) continue;
    for (const line of s.lines) {
      const b = bulletText(line);
      if (!b) continue;
      const item = parseBacklogItem(b);
      if (item) { item.seccion = section; res[section].push(item); }
      else res.malformed.push(b);
    }
  }
  return res;
}

/* ------------------------------------------------------------ tablas */

export function parseTable(md) {
  const rows = [];
  let header = null;
  for (const line of normalizeNewlines(md).split('\n')) {
    if (!/^\s*\|.*\|\s*$/.test(line)) { if (header && rows.length) break; continue; }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
    if (!header) header = cells;
    else rows.push(Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));
  }
  return { header: header || [], rows };
}

/* ------------------------------------------------------------ roadmap.md */

export function parseRoadmap(md) {
  if (md == null) return null;
  const { rows } = parseTable(md);
  return rows.map(r => {
    const fase = r['Fase'] || '';
    const m = fase.match(/^(F\d+)\s*[—-]\s*(.*)$/);
    return {
      id: m ? m[1] : fase,
      nombre: m ? m[2] : fase,
      objetivo: r['Objetivo'] || '',
      criterio: r['Criterio de salida'] || '',
      estado: (r['Estado'] || '').toUpperCase(),
    };
  });
}

/* ------------------------------------------------------------ risks.md */

export function parseRisks(md) {
  if (md == null) return null;
  const { rows } = parseTable(md);
  return rows.map(r => ({
    id: (r['ID'] || '').trim(),
    severidad: (r['Severidad'] || '').toUpperCase(),
    estado: (r['Estado'] || '').toUpperCase(),
    riesgo: r['Riesgo'] || '',
    mitigacion: r['Mitigación'] || r['Mitigacion'] || '',
    responsable: r['Responsable'] || '',
    refs: extractIds(Object.values(r).join(' ')).filter(x => x !== r['ID']),
  })).filter(r => /^RSK-\d{3}$/.test(r.id));
}

/* ------------------------------------------------------------ memory-index.md */

export function parseIndex(md) {
  if (md == null) return null;
  const res = { DECISIONS: [], LESSONS: [], FEATURES: [], other: [] };
  let section = null;
  for (const s of splitSections(md)) {
    if (s.level === 2) section = ['DECISIONS', 'LESSONS', 'FEATURES'].includes(s.title.toUpperCase()) ? s.title.toUpperCase() : null;
    if (!section) continue;
    for (const line of s.lines) {
      const b = bulletText(line);
      if (!b) continue;
      const m = b.match(/^\[([A-Z]+-\d{3})\]\(([^)]+)\)\s*[—-]?\s*(.*)$/);
      if (m) res[section].push({ id: m[1], path: m[2], resumen: m[3].trim() });
      else res.other.push(b);
    }
  }
  return res;
}

/* ------------------------------------------------------------ entradas DEC/LES/FEAT */

export function parseEntry(md, path) {
  if (md == null) return null;
  const text = normalizeNewlines(md);
  const lines = text.split('\n');
  const titleLine = lines.find(l => /^#\s+/.test(l)) || '';
  const tm = titleLine.replace(/^#\s+/, '').match(/^([A-Z]+-\d{3})\s*[—-]\s*(.*)$/);
  const meta = {};
  let i = lines.indexOf(titleLine) + 1;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) { if (Object.keys(meta).length) break; continue; }
    const m = l.match(/^\s*-\s+([^:]{2,40}):\s*(.*)$/);
    if (!m) break;
    meta[m[1].trim().toLowerCase()] = m[2].trim();
  }
  const body = lines.slice(i).join('\n').trim();
  const fecha = meta['fecha'] || meta['fecha de registro'] || null;
  const estadoRaw = meta['estado'] || null;
  return {
    id: tm ? tm[1] : null,
    titulo: tm ? tm[2].trim() : titleLine.replace(/^#\s+/, '').trim(),
    path,
    estado: estadoRaw,
    estadoCodigo: estadoRaw ? estadoRaw.split(/[\s(—-]/)[0].toUpperCase() : null,
    fecha: parseDate(fecha),
    fechaTexto: fecha,
    meta,
    body,
    refs: extractIds(body),
  };
}

/* ------------------------------------------------------------ markdown → HTML seguro */

/**
 * Renderer mínimo y seguro (escapa todo antes de dar formato).
 * Cubre lo que usa ai-memory: títulos, listas, tablas, código, énfasis, links.
 * `linkResolver(href)` decide a dónde apunta un link relativo.
 */
export function mdToHtml(md, linkResolver = h => h) {
  const lines = normalizeNewlines(md).split('\n');
  const out = [];
  let i = 0;
  const inline = (s) => {
    let t = esc(s);
    t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
      const raw = href.replace(/&amp;/g, '&');
      const target = /^https?:\/\//.test(raw) ? raw : linkResolver(raw);
      if (!target || /^\s*javascript:/i.test(target)) return label;
      return `<a href="${esc(target)}" target="_blank" rel="noopener">${label}</a>`;
    });
    return t;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    // La página ya tiene su h1 (el título de la entrada): "#" y "##" del cuerpo son h2, "###" es h3 (GDS §5: sin saltear niveles).
    if (h) { const lv = Math.min(6, Math.max(2, h[1].length)); out.push(`<h${lv}>${inline(h[2])}</h${lv}>`); i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) buf.push(lines[i++]);
      const rows = buf.map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()))
        .filter(cells => !cells.every(c => /^:?-{2,}:?$/.test(c)));
      const [head, ...body] = rows;
      // gds-table-wrap: scroll horizontal propio para tablas anchas (WCAG 1.4.10); th con scope (1.3.1).
      out.push('<div class="gds-table-wrap"><table><thead><tr>' + head.map(c => `<th scope="col">${inline(c)}</th>`).join('') +
        '</tr></thead><tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const buf = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, ''));
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>` + buf.map(b => `<li>${inline(b)}</li>`).join('') + `</${tag}>`);
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i])) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}
