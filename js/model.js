/**
 * js/model.js — Construye el modelo de la Factory a partir de los datos crudos
 * y ejecuta los chequeos de salud. Puro: sin DOM ni red (testeable en node).
 *
 * Distinción central (heredada del dashboard histórico, la que sí tenía valor):
 *   - DECLARADO: lo que la Factory escribe en ai-memory.
 *   - MEDIDO:    lo que se observa en GitHub (commits, protección, diferencias).
 * Las inconsistencias entre ambos son las señales más valiosas del panel.
 */

import { CONFIG } from './config.js';
import {
  parseStatus, parseBacklog, parseRoadmap, parseRisks, parseIndex, parseEntry,
  parseDate, extractIds, PRIORITIES,
} from './parse.js';
import { buildDecisions, idsIn } from './decisions.js';

const H = 3600 * 1000;
const D = 24 * H;
const LEVEL_ORDER = { critical: 0, warn: 1, info: 2, ok: 3 };

/**
 * @param raw {
 *   now: number,
 *   files: { [relPathFromMemoryRoot]: string|null },   // null = no se pudo leer
 *   fileErrors: { [path]: string },
 *   tree: string[]|null,                              // paths bajo ai-memory/ (null = API no disponible)
 *   ref: string|null,                                 // SHA del snapshot leído
 *   commits: { dev: Commit[]|null, dashboard: Commit[]|null },
 *   prod: { sha, protected, date }|null,
 *   compare: { ahead_by, behind_by, status }|null,
 *   api: { remaining, limit, reset, errors: string[], stale: string[] },
 * }
 */
export function buildModel(raw) {
  const now = raw.now;
  const f = raw.files || {};

  const status = parseStatus(f['status.md']);
  const backlog = parseBacklog(f['backlog.md']);
  const roadmap = parseRoadmap(f['roadmap.md']);
  const risks = parseRisks(f['risks.md']);
  const index = parseIndex(f['memory-index.md']);

  const entries = {};
  for (const col of CONFIG.collections) {
    entries[col.prefix] = Object.keys(f)
      .filter(p => p.startsWith(col.dir + '/') && p.endsWith('.md'))
      .map(p => parseEntry(f[p], p))
      .filter(Boolean)
      .sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  }

  // Intercambio de decisiones (contrato v3, DEC-011): pedidos de la Factory y respuestas de Pablo.
  const decisions = buildDecisions({ files: f, now, prod: raw.prod, decs: entries.DEC || [], thresholds: CONFIG.thresholds });
  entries.REQ = decisions.requests;
  entries.RESP = decisions.responses;

  const allIds = new Set([
    ...Object.values(entries).flat().map(e => e.id),
    ...(backlog ? Object.values(backlog).flat().filter(x => x && x.id).map(x => x.id) : []),
    ...(risks || []).map(r => r.id),
  ].filter(Boolean));

  const commits = mergeCommits(raw.commits);
  const statusInfo = deriveStatus(status, now);
  const human = buildHumanQueue({ status, backlog, entries, decisions, now });
  const channel = buildChannel(raw.channel, decisions, now);
  const health = runHealthChecks({ raw, status, statusInfo, backlog, roadmap, risks, index, entries, allIds, commits, decisions, channel, now });
  const activity = buildActivity({ commits, entries, backlog, now });
  const concerns = buildConcerns({ risks, backlog, health });
  const fase = (roadmap || []).find(p => /CURSO/.test(p.estado)) || null;

  return {
    generatedAt: now,
    ref: raw.ref,
    status, statusInfo, backlog, roadmap, fase, risks, index, entries, allIds,
    commits, activity, human, concerns, health, decisions, channel,
    prod: raw.prod, compare: raw.compare, api: raw.api,
  };
}

/* ------------------------------------------------------------ estado */

function deriveStatus(status, now) {
  if (!status) return { level: 'critical', label: 'SIN DATO', inicio: null, actualizado: null, enEjecucionMs: null, desdeActualizacionMs: null };
  const inicio = parseDate(status.inicio);
  const actualizado = parseDate(status.actualizado);
  const code = (status.estado || '').toUpperCase();
  let level = 'info';
  if (/BLOQUEAD/.test(code)) level = 'warn';
  else if (/CURSO|EJECUC|ACTIVO/.test(code)) level = 'ok';
  else if (/IDLE|ESPERA/.test(code)) level = 'info';
  return {
    code,
    level,
    label: status.estado || 'SIN DATO',
    inicio, actualizado,
    enEjecucionMs: inicio ? now - inicio.getTime() : null,
    desdeActualizacionMs: actualizado ? now - actualizado.getTime() : null,
  };
}

/* ------------------------------------------------------------ cola de decisión humana */

function buildHumanQueue({ status, backlog, entries, decisions, now }) {
  const byId = new Map();
  const add = (id, item) => {
    const key = id || ('txt:' + item.titulo);
    const prev = byId.get(key);
    if (prev) { prev.origenes.push(...item.origenes); prev.relacionados.push(...item.relacionados); return; }
    byId.set(key, { id, ...item });
  };

  // 0. Pedidos abiertos (contrato v3): lo que la Factory le pregunta a Pablo, con su recomendación.
  //    Un pedido no cerrado "cubre" sus IDs relacionados: si está pospuesto o respondido,
  //    lo que cubre tampoco aparece en la cola (no es el turno de Pablo).
  const coveredBy = new Map();
  for (const r of (decisions && decisions.requests) || []) {
    if (r.state === 'closed' || !r.id) continue;
    for (const x of [r.id, ...r.relacionados]) if (!coveredBy.has(x)) coveredBy.set(x, r);
  }
  for (const r of (decisions && decisions.open) || []) {
    add(r.id, {
      titulo: r.titulo, tipo: r.tipo === 'accion' ? 'accion' : 'pedido', prioridad: r.prioridad, fecha: r.fecha,
      esperaMs: r.esperaMs, origenes: ['Pedido abierto'], relacionados: r.relacionados.slice(),
      pregunta: r.recomendacion ? 'Recomendación: ' + r.recomendacion.texto : r.porQueImporta,
    });
  }
  const absorb = (ids, origen) => {
    const r = ids.map(x => coveredBy.get(x)).find(Boolean);
    if (!r) return false;
    const q = byId.get(r.id);
    if (q) { q.relacionados.push(...ids.filter(x => x !== r.id)); if (origen) q.origenes.push(origen); }
    return true;
  };

  // 1. Decisiones PROPUESTA: son, por definición, pedidos de decisión a Pablo.
  for (const d of entries.DEC || []) {
    if (d.estadoCodigo === 'PROPUESTA') {
      if (absorb([d.id], 'DEC en estado PROPUESTA')) continue;
      add(d.id, {
        titulo: d.titulo, tipo: 'decision', fecha: d.fecha,
        esperaMs: d.fecha ? now - d.fecha.getTime() : null,
        origenes: ['DEC en estado PROPUESTA'], relacionados: [],
        pregunta: extractPendiente(d.body),
      });
    }
  }
  const proposedDecs = new Set([...byId.keys()]);

  // 2. Backlog BLOCKED que depende de Pablo. Si referencia una DEC ya en cola, se agrupa ahí.
  for (const it of (backlog && backlog.BLOCKED) || []) {
    if (!/pablo/i.test(it.raw)) continue;
    // Cubierto por un pedido: directamente (el pedido lo cita) o vía algo que cita (BL-011 → RSK-002).
    const via = coveredBy.has(it.id) ? it.id : it.refs.find(r => coveredBy.has(r));
    if (via) { absorb(via === it.id ? [it.id] : [via, it.id], null); continue; }
    const dec = it.refs.find(r => proposedDecs.has(r));
    if (dec) { byId.get(dec).relacionados.push(it.id); continue; }
    add(it.id, { titulo: it.titulo, tipo: 'backlog', prioridad: it.prioridad, fecha: null, esperaMs: null,
      origenes: ['Backlog BLOCKED: requiere a Pablo'], relacionados: it.refs, pregunta: it.detalle });
  }

  // 3. Lo que status.md declara explícitamente.
  for (const txt of (status && status.esperandoPablo) || []) {
    const ids = idsIn(txt);
    if (absorb(ids, 'status.md')) continue;
    // Coincidencia directa, o indirecta solo si la línea cita un dato de contexto (p. ej. BL-010 → RSK-001).
    // Si la línea nombra su propio trabajo (BL o pedido), es un pendiente propio: no se agrupa dentro
    // de otro ítem que solo lo cita (antes "Validar MC-4 [BL-020]" quedaba escondido dentro de BL-016).
    const own = ids[0] && /^(BL|REQ)-/.test(ids[0]);
    const known = ids.find(x => byId.has(x))
      || (!own && [...byId.keys()].find(k => ids.some(x => byId.get(k).relacionados.includes(x))));
    if (known) { byId.get(known).origenes.push('status.md'); continue; }
    add(ids[0] || null, { titulo: txt.replace(/^\[?[A-Z]+-\d{3}\]?\s*[:—-]?\s*/, ''), tipo: 'status', fecha: null, esperaMs: null,
      origenes: ['status.md: Esperando a Pablo'], relacionados: ids.slice(1), pregunta: null });
  }

  return [...byId.values()].map(x => ({ ...x, relacionados: [...new Set(x.relacionados)] }))
    .sort((a, b) => prioRank(a.prioridad) - prioRank(b.prioridad) || (b.esperaMs || 0) - (a.esperaMs || 0));
}

/* ------------------------------------------------------------ canal de respuesta (DEC-012) */

/** Ventana en la que un issue abierto se considera "registrándose" y no "falló". */
export const CHANNEL_PROCESSING_MS = 5 * 60 * 1000;

/**
 * Respuestas enviadas desde el panel que todavía no se registraron.
 * El workflow cierra el issue al registrar: un issue abierto con la marca es
 * "registrándose" (recién enviado o editado) o "falló" (el workflow dejó el motivo en el issue).
 * @returns { available: boolean, items: [{ number, url, solicitud, respuesta, state, ageMs, request }] }
 */
export function buildChannel(issues, decisions, now) {
  if (!Array.isArray(issues)) return { available: false, items: [] };
  const requests = (decisions && decisions.requests) || [];
  const items = issues.map(i => {
    const at = Date.parse(i.updated_at || i.created_at);
    const ageMs = isNaN(at) ? null : now - at;
    const solicitud = (String(i.body || '').match(/^\s*solicitud:\s*(REQ-\d{3})\s*$/mi) || [])[1] || null;
    const respuesta = ((String(i.body || '').match(/^\s*respuesta:\s*([A-Z]+)\s*$/mi) || [])[1] || '').toUpperCase() || null;
    return {
      number: i.number, url: i.html_url, solicitud, respuesta, ageMs,
      state: ageMs != null && ageMs < CHANNEL_PROCESSING_MS ? 'processing' : 'failed',
      request: requests.find(r => r.id === solicitud) || null,
    };
  }).sort((a, b) => (a.ageMs || 0) - (b.ageMs || 0));
  return { available: true, items };
}

function extractPendiente(body) {
  const m = String(body || '').match(/##\s*Pendiente de Pablo\s*\n([\s\S]*?)(\n##\s|$)/i);
  if (!m) return null;
  return m[1].split('\n').map(l => l.replace(/^\s*[-*]\s+/, '').trim()).filter(Boolean).join(' · ');
}

function prioRank(p) {
  const i = PRIORITIES.indexOf(p);
  return i === -1 ? 9 : i;
}

/* ------------------------------------------------------------ actividad */

function mergeCommits(c) {
  const out = [];
  for (const [repo, list] of Object.entries(c || {})) {
    for (const x of list || []) {
      out.push({
        repo,
        sha: x.sha,
        short: (x.sha || '').slice(0, 7),
        message: (x.commit && x.commit.message) || '',
        title: ((x.commit && x.commit.message) || '').split('\n')[0],
        date: new Date((x.commit && (x.commit.committer || x.commit.author) || {}).date || 0),
        author: (x.commit && x.commit.author && x.commit.author.name) || '',
      });
    }
  }
  return out.filter(x => !isNaN(x.date.getTime())).sort((a, b) => b.date - a.date);
}

export function startOfLocalDay(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function buildActivity({ commits, entries, backlog, now }) {
  const today = startOfLocalDay(now);
  const week = now - 7 * D;
  const memory = Object.values(entries).flat().filter(e => e.fecha)
    .map(e => ({ kind: e.id ? e.id.split('-')[0] : '?', id: e.id, titulo: e.titulo, date: e.fecha, estado: e.estado }))
    .sort((a, b) => b.date - a.date);
  // Las fechas de ai-memory son días (sin hora): "hoy" se compara por día calendario UTC.
  const todayUtc = new Date(now).toISOString().slice(0, 10);
  const isToday = (d) => d.toISOString().slice(0, 10) === todayUtc;
  const done = ((backlog && backlog.DONE) || []).filter(x => x.fecha).sort((a, b) => b.fecha - a.fecha);
  return {
    commitsToday: commits.filter(c => c.date.getTime() >= today),
    commitsWeek: commits.filter(c => c.date.getTime() >= week),
    memoryToday: memory.filter(m => isToday(m.date)),
    memoryWeek: memory.filter(m => m.date.getTime() >= week - D),
    memory,
    doneToday: done.filter(x => isToday(x.fecha)),
    doneWeek: done.filter(x => x.fecha.getTime() >= week - D),
  };
}

/* ------------------------------------------------------------ preocupaciones */

function buildConcerns({ risks, backlog, health }) {
  const out = [];
  for (const r of risks || []) {
    if (r.estado === 'ABIERTO' && (r.severidad === 'CRÍTICO' || r.severidad === 'ALTO')) {
      out.push({ level: r.severidad === 'CRÍTICO' ? 'critical' : 'warn', id: r.id, titulo: r.riesgo, origen: 'Riesgo ' + r.severidad.toLowerCase() });
    }
  }
  for (const c of health.checks) {
    if (c.level === 'critical' || c.level === 'warn') {
      // Si el chequeo mide un riesgo ya declarado, se fusionan: gana el nivel más grave y el dato medido.
      const same = c.ref && out.find(o => o.id === c.ref);
      if (same) {
        if (LEVEL_ORDER[c.level] < LEVEL_ORDER[same.level]) same.level = c.level;
        same.titulo = c.title;
        same.origen += ' · confirmado por medición';
        continue;
      }
      out.push({ level: c.level, id: c.ref || null, titulo: c.title, origen: 'Salud · ' + c.source });
    }
  }
  for (const it of (backlog && backlog.BLOCKED) || []) {
    if (it.prioridad === 'CRÍTICO' && !out.some(o => o.id === it.id)) {
      out.push({ level: 'critical', id: it.id, titulo: it.titulo, origen: 'Backlog bloqueado' });
    }
  }
  return out.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

/* ------------------------------------------------------------ salud */

function runHealthChecks(ctx) {
  const { raw, status, statusInfo, backlog, roadmap, risks, index, entries, allIds, commits, decisions, channel, now } = ctx;
  const T = CONFIG.thresholds;
  const checks = [];
  const add = (level, id, title, detail, source, ref) => checks.push({ level, id, title, detail, source, ref: ref || null });

  // --- Intercambio de decisiones (pedidos y respuestas, DEC-011)
  if (decisions) checks.push(...decisions.checks);

  // --- Canal de respuesta (DEC-012): una respuesta enviada que no se registró
  for (const c of (channel && channel.items) || []) {
    if (c.state !== 'failed') continue;
    add('warn', 'channel:failed:' + c.number,
      `Tu respuesta${c.solicitud ? ' a ' + c.solicitud : ''} no se pudo registrar`,
      `El issue #${c.number} sigue abierto: el motivo está en su último comentario. Corregilo (Edit) y se reintenta solo.`,
      'medido', c.solicitud);
  }

  // --- Lectura de la memoria
  for (const file of CONFIG.requiredFiles) {
    if (raw.files[file] == null) {
      add(file === 'status.md' ? 'critical' : 'warn', 'missing:' + file, `No se pudo leer ${file}`,
        (raw.fileErrors && raw.fileErrors[file]) || 'Archivo obligatorio ausente o ilegible.', 'medido');
    }
  }
  const corrupt = Object.entries(raw.files).filter(([, t]) => t != null && /\uFFFD/.test(t)).map(([p]) => p);
  if (corrupt.length) add('critical', 'encoding', 'Archivos de memoria con caracteres corruptos', 'Contienen U+FFFD (codificación no UTF-8): ' + corrupt.join(', ') + '. Ver LES-008.', 'medido', 'LES-008');

  // --- Índice vs. archivos reales
  if (index) {
    const indexed = new Set(Object.values(index).flat().filter(x => x && x.id).map(x => x.path));
    const present = new Set(Object.keys(raw.files).filter(p => /^(decisions|lessons|features)\//.test(p)));
    const notIndexed = [...present].filter(p => !indexed.has(p));
    const missing = [...indexed].filter(p => raw.tree ? !raw.tree.includes(p) : raw.files[p] == null);
    if (notIndexed.length) add('warn', 'index:unlisted', `${notIndexed.length} entrada(s) fuera de memory-index.md`, notIndexed.join(', '), 'medido');
    if (missing.length) add('warn', 'index:broken', `${missing.length} link(s) del índice apuntan a archivos inexistentes`, missing.join(', '), 'medido');
  }

  // --- Coherencia de identificadores
  const seen = new Map();
  for (const e of Object.values(entries).flat()) {
    if (!e.id) { add('warn', 'entry:noid:' + e.path, 'Entrada sin ID en el título', e.path, 'declarado'); continue; }
    if (!e.path.split('/').pop().startsWith(e.id)) add('warn', 'entry:mismatch:' + e.id, `${e.id}: el ID no coincide con el nombre del archivo`, e.path, 'declarado', e.id);
    if (seen.has(e.id)) add('critical', 'entry:dup:' + e.id, `ID duplicado: ${e.id}`, seen.get(e.id) + ' y ' + e.path, 'declarado', e.id);
    seen.set(e.id, e.path);
    if (!e.fecha) add('info', 'entry:nodate:' + e.id, `${e.id} sin fecha`, 'No aparece en la actividad reciente.', 'declarado', e.id);
  }
  const backlogIds = backlog ? Object.values(backlog).flat().filter(x => x && x.id).map(x => x.id) : [];
  const dupBl = backlogIds.filter((x, i) => backlogIds.indexOf(x) !== i);
  if (dupBl.length) add('warn', 'backlog:dup', 'Ítems de backlog repetidos', [...new Set(dupBl)].join(', '), 'declarado');
  if (backlog && backlog.malformed.length) add('info', 'backlog:malformed', `${backlog.malformed.length} línea(s) del backlog fuera de formato`, backlog.malformed.slice(0, 3).join(' | '), 'declarado');

  const texts = [
    ...Object.values(entries).flat().map(e => [e.id, e.body]),
    ...(backlog ? Object.values(backlog).flat().filter(x => x && x.id).map(x => [x.id, x.raw]) : []),
    ...(risks || []).map(r => [r.id, r.riesgo + ' ' + r.mitigacion]),
  ];
  const dangling = new Map();
  for (const [from, txt] of texts) {
    for (const id of extractIds(txt)) if (!allIds.has(id)) dangling.set(id, [...(dangling.get(id) || []), from]);
  }
  if (dangling.size) {
    add('warn', 'refs:dangling', `${dangling.size} referencia(s) a IDs inexistentes`,
      [...dangling.entries()].map(([id, from]) => `${id} (citado en ${[...new Set(from)].join(', ')})`).join('; '), 'declarado');
  }

  // --- Estado declarado vs. realidad
  if (status) {
    const enCurso = /CURSO|EJECUC/.test(statusInfo.code || '');
    const hours = statusInfo.desdeActualizacionMs != null ? statusInfo.desdeActualizacionMs / H : null;
    if (!statusInfo.actualizado) add('warn', 'status:nodate', 'status.md sin fecha de última actualización', 'No se puede saber si el estado está vigente.', 'declarado');
    else if (hours > T.statusDeadHours) add('critical', 'status:dead', `status.md sin actualizar hace ${Math.round(hours / 24)} días`, 'La memoria dejó de reflejar la realidad.', 'medido');
    else if (enCurso && hours > T.statusStaleHours) add('warn', 'status:stale', `Trabajo "en curso" sin actualizar hace ${Math.round(hours)} h`, 'Puede estar detenido sin que status.md lo diga.', 'medido');
    if (enCurso && backlog && backlog.IN_PROGRESS.length === 0) add('warn', 'status:noprogress', 'status.md dice EN_CURSO pero no hay ítems IN_PROGRESS en el backlog', 'Estado y backlog no coinciden.', 'declarado');
    if (!enCurso && backlog && backlog.IN_PROGRESS.length > 0) add('info', 'status:idleprogress', `Hay ${backlog.IN_PROGRESS.length} ítem(s) IN_PROGRESS con la Factory en estado ${statusInfo.label}`, backlog.IN_PROGRESS.map(x => x.id).join(', '), 'declarado');
    const lastDev = commits.find(c => c.repo === 'dev');
    if (lastDev && statusInfo.actualizado && lastDev.date.getTime() - statusInfo.actualizado.getTime() > 12 * H) {
      add('warn', 'status:behind', 'Hay commits en DEV posteriores a la última actualización de status.md', `Último commit: ${lastDev.short} (${lastDev.date.toISOString().slice(0, 16)}Z).`, 'medido');
    }
  }

  // --- Decisiones esperando demasiado
  for (const d of entries.DEC || []) {
    if (d.estadoCodigo === 'PROPUESTA' && d.fecha && now - d.fecha.getTime() > T.proposalWaitDays * D) {
      add('warn', 'dec:waiting:' + d.id, `${d.id} espera decisión hace ${Math.floor((now - d.fecha.getTime()) / D)} días`, d.titulo, 'medido', d.id);
    }
  }

  // --- Riesgos
  for (const r of risks || []) {
    if (r.estado === 'ABIERTO' && r.severidad === 'CRÍTICO') add('critical', 'risk:' + r.id, `Riesgo crítico abierto: ${r.id}`, r.riesgo, 'declarado', r.id);
  }

  // --- Roadmap
  if (roadmap && roadmap.filter(p => /CURSO/.test(p.estado)).length > 1) add('info', 'roadmap:multi', 'Más de una fase del roadmap EN CURSO', roadmap.filter(p => /CURSO/.test(p.estado)).map(p => p.id).join(', '), 'declarado');

  // --- Repositorios (medido)
  const devCommits = raw.commits && raw.commits.dev;
  if (devCommits == null) add('warn', 'git:dev', 'No se pudieron leer los commits de DEV', 'Actividad incompleta.', 'medido');
  else if (devCommits.length) {
    const last = commits.find(c => c.repo === 'dev');
    if (last && now - last.date.getTime() > T.devIdleDays * D) add('info', 'git:idle', `Sin commits en DEV hace ${Math.floor((now - last.date.getTime()) / D)} días`, '', 'medido');
  }
  if (raw.prod) {
    if (raw.prod.protected === false) add('critical', 'prod:unprotected', 'La rama main de producción no tiene protección', 'Cualquier push con permisos de escritura llega a producción sin revisión. Solo Pablo puede activarla (Settings → Branches).', 'medido', 'RSK-001');
  } else {
    add('info', 'prod:unknown', 'Estado de producción no verificable', 'La API de GitHub no respondió.', 'medido');
  }

  // --- Fuente de datos
  const api = raw.api || {};
  if (api.errors && api.errors.length) add('warn', 'api:errors', 'Algunos datos de GitHub no están disponibles', api.errors.join(' · '), 'medido');
  if (api.stale && api.stale.length) add('info', 'api:stale', 'Se muestran datos de GitHub en caché', api.stale.join(' · '), 'medido');
  if (api.remaining != null && api.remaining < T.apiLowRemaining) add('info', 'api:quota', `Cuota de API casi agotada (${api.remaining} restantes)`, 'Se usará caché hasta el reinicio de la cuota.', 'medido');
  if (!raw.ref) add('info', 'snapshot:branch', 'Memoria leída desde la rama (no fijada a un commit)', 'Sin API: el CDN puede servir una versión de hasta 5 min.', 'medido');

  checks.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  const level = checks.some(c => c.level === 'critical') ? 'critical' : checks.some(c => c.level === 'warn') ? 'warn' : 'ok';
  return { level, checks, counts: countBy(checks, c => c.level) };
}

function countBy(arr, fn) {
  const out = {};
  for (const x of arr) out[fn(x)] = (out[fn(x)] || 0) + 1;
  return out;
}
