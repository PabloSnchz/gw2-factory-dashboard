/**
 * js/decisions.js — Intercambio de decisiones entre Pablo y la Factory (contrato v3, DEC-011).
 *
 *   Factory trabaja → escribe un PEDIDO   ai-memory/requests/REQ-XXX-<slug>.md
 *   Panel propone   → muestra los pedidos abiertos
 *   Pablo responde  → queda una RESPUESTA ai-memory/responses/RESP-XXX.md
 *   Factory continúa→ procesa la respuesta (Estado: PROCESADA) y cierra el pedido
 *
 * Puro: sin DOM ni red. Formato completo y protocolo: docs/DECISIONS.md.
 */

import { parseEntry, parseDate, normalizeNewlines } from './parse.js';

export const REQUESTS_DIR = 'requests';
export const RESPONSES_DIR = 'responses';

/** Respuestas posibles. El código canónico es el que pidió Pablo; la etiqueta es lo que se muestra. */
export const RESPONSES = {
  APPROVED:  { label: 'Aprobada',  verbo: 'Aprobar' },
  REJECTED:  { label: 'Rechazada', verbo: 'Rechazar' },
  POSTPONED: { label: 'Pospuesta', verbo: 'Posponer' },
  DONE:      { label: 'Hecha',     verbo: 'Marcar como hecha' },
};
const SYNONYMS = {
  APROBADA: 'APPROVED', APROBADO: 'APPROVED', APROBAR: 'APPROVED',
  RECHAZADA: 'REJECTED', RECHAZADO: 'REJECTED', RECHAZAR: 'REJECTED',
  POSPUESTA: 'POSTPONED', POSPUESTO: 'POSTPONED', POSPONER: 'POSTPONED',
  HECHA: 'DONE', HECHO: 'DONE',
};

/** Estados de un pedido, en lenguaje de Pablo. */
export const STATE_TEXT = {
  open: 'Esperando tu respuesta',
  postponed: 'Pospuesto',
  answered: 'Respondido · la Factory lo está procesando',
  measured: 'Hecho (verificado) · la Factory lo cierra',
  closed: 'Cerrado',
};

/** Verificaciones medidas: permiten cerrar una acción sin que Pablo tenga que responder. */
export const VERIFY = {
  prod_protegida: (ctx) => (ctx.prod ? ctx.prod.protected === true : null),
};

const FILE_RE = /\/(REQ|RESP)-\d{3}[^/]*\.md$/;
const DEC_IDS = /\b(?:DEC|LES|FEAT|BL|RSK|REQ|RESP)-\d{3}\b/g;
const OPTION_RE = /^\s*[-*]\s+([A-Z])\s+[—-]\s+(.+)$/;
const ACCENTS = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };

const fold = (s) => String(s || '').toLowerCase().replace(/[áéíóú]/g, c => ACCENTS[c]).trim();
export const idsIn = (text) => [...new Set(String(text || '').match(DEC_IDS) || [])];

/** Secciones "## Título" de un cuerpo markdown → { 'titulo sin acentos': texto }. */
export function parseSections(body) {
  const out = {};
  let key = null;
  for (const line of normalizeNewlines(body).split('\n')) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) { key = fold(h[1]); out[key] = []; continue; }
    if (key) out[key].push(line);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join('\n').trim() || null;
  return out;
}

const meta = (e, ...keys) => { for (const k of keys) if (e.meta[k] != null && e.meta[k] !== '') return e.meta[k]; return null; };

/* ------------------------------------------------------------ pedido (REQ) */

export function parseRequest(md, path) {
  const e = parseEntry(md, path);
  if (!e) return null;
  const s = parseSections(e.body);
  const problems = [];
  if (!e.id || !e.id.startsWith('REQ-')) problems.push('el título no empieza con "REQ-XXX —"');

  const tipoRaw = fold(meta(e, 'tipo'));
  const tipo = tipoRaw === 'decision' ? 'decision' : tipoRaw === 'accion' ? 'accion' : null;
  if (!tipo) problems.push('"Tipo" debe ser decisión o acción');
  if (!['ABIERTA', 'CERRADA'].includes(e.estadoCodigo)) problems.push('"Estado" debe ser ABIERTA o CERRADA');

  const opciones = (s['opciones'] || '').split('\n').map(l => l.match(OPTION_RE)).filter(Boolean)
    .map(m => ({ clave: m[1], texto: m[2].trim() }));
  const recTexto = s['recomendacion'];
  const recClave = recTexto ? (recTexto.match(/^([A-Z])\s+[—-]\s+/) || [])[1] || null : null;

  const impacto = s['por que importa'] || s['impacto'] || null;
  // Soberanía de decisiones (DEC-018): un pedido de decisión explica por qué la Factory no puede decidirlo sola.
  const justificacion = s['por que te lo pregunto'] || s['por que no lo decide la factory'] || null;

  if (!s['que paso']) problems.push('falta "## Qué pasó"');
  if (!impacto) problems.push('falta "## Por qué importa"');
  if (!recTexto) problems.push('falta "## Recomendación"');
  if (opciones.length === 1) problems.push('una sola opción no es una decisión: usar 2 o más, o ninguna (aprobar/rechazar)');
  if (recClave && !opciones.some(o => o.clave === recClave)) problems.push(`la recomendación ${recClave} no está entre las opciones`);
  if (tipo === 'accion' && !s['como hacerlo']) problems.push('una acción necesita "## Cómo hacerlo"');

  const verificacion = meta(e, 'verificación', 'verificacion');
  if (verificacion && !VERIFY[verificacion]) problems.push(`verificación desconocida: ${verificacion}`);

  return {
    ...e,
    kind: 'REQ',
    tipo,
    abierta: e.estadoCodigo === 'ABIERTA',
    prioridad: (meta(e, 'prioridad') || '').toUpperCase() || null,
    relacionados: idsIn(meta(e, 'relacionado', 'relacionados')),
    verificacion,
    quePaso: s['que paso'] || null,
    porQueImporta: impacto,
    justificacion,
    // Una decisión sin justificación no llega a Pablo: la Factory debe decidirla o justificarla.
    sinJustificar: tipo === 'decision' && !justificacion,
    comoHacerlo: s['como hacerlo'] || null,
    opciones,
    recomendacion: recTexto ? { clave: recClave, texto: recTexto } : null,
    problems,
  };
}

/* ------------------------------------------------------------ respuesta (RESP) */

export function normalizeResponse(code) {
  const c = String(code || '').trim().toUpperCase().split(/\s/)[0];
  return RESPONSES[c] ? c : SYNONYMS[c] || null;
}

export function parseResponse(md, path) {
  const e = parseEntry(md, path);
  if (!e) return null;
  const s = parseSections(e.body);
  const problems = [];
  if (!e.id || !e.id.startsWith('RESP-')) problems.push('el título no empieza con "RESP-XXX —"');

  const respuesta = normalizeResponse(meta(e, 'respuesta'));
  if (!respuesta) problems.push('"Respuesta" debe ser APPROVED, REJECTED, POSTPONED o DONE');
  const solicitud = idsIn(meta(e, 'solicitud', 'pedido')).find(x => x.startsWith('REQ-')) || null;
  if (!solicitud) problems.push('"Solicitud" debe indicar el pedido (REQ-XXX)');
  const opcionRaw = meta(e, 'opción', 'opcion');
  const opcion = opcionRaw && /^[A-Z]$/.test(opcionRaw.trim()) ? opcionRaw.trim() : null;
  if (opcionRaw && !opcion && opcionRaw.trim() !== '—' && opcionRaw.trim() !== '-') problems.push('"Opción" debe ser una letra (A, B, C…)');
  const hasta = parseDate(meta(e, 'hasta'));
  if (respuesta === 'POSTPONED' && !hasta) problems.push('una respuesta POSTPONED necesita "Hasta: AAAA-MM-DD"');
  if (!['PENDIENTE', 'PROCESADA'].includes(e.estadoCodigo)) problems.push('"Estado" debe ser PENDIENTE o PROCESADA');
  if (!e.fecha) problems.push('falta "Fecha"');

  return {
    ...e,
    kind: 'RESP',
    respuesta,
    solicitud,
    opcion,
    hasta,
    procesada: e.estadoCodigo === 'PROCESADA',
    issue: meta(e, 'issue'),
    autor: meta(e, 'autor'),
    comentario: s['comentario'] || null,
    efecto: s['efecto'] || null,
    problems,
  };
}

/**
 * Genera el archivo de una respuesta. Lo usan el canal automático (MC-4) y los tests.
 * Cualquier texto libre se limpia de saltos de línea en los metadatos.
 */
export function buildResponseMarkdown(r) {
  const one = (v) => String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();
  const code = normalizeResponse(r.respuesta);
  if (!code) throw new Error('Respuesta inválida: ' + r.respuesta);
  if (!/^RESP-\d{3,}$/.test(r.id || '')) throw new Error('ID inválido: ' + r.id);
  if (!/^REQ-\d{3}$/.test(r.solicitud || '')) throw new Error('Solicitud inválida: ' + r.solicitud);
  if (code === 'POSTPONED' && !r.hasta) throw new Error('POSTPONED necesita "hasta"');
  const lines = [
    `# ${r.id} — ${RESPONSES[code].label}: ${r.solicitud}`,
    '',
    `- Estado: PENDIENTE`,
    `- Fecha: ${one(r.fecha)}`,
    `- Solicitud: ${r.solicitud}`,
    `- Respuesta: ${code}`,
    `- Opción: ${r.opcion ? one(r.opcion) : '—'}`,
  ];
  if (code === 'POSTPONED') lines.push(`- Hasta: ${one(r.hasta)}`);
  if (r.issue) lines.push(`- Issue: ${one(r.issue)}`);
  if (r.autor) lines.push(`- Autor: ${one(r.autor)}`);
  lines.push('', '## Comentario', '', (String(r.comentario || '').trim() || '—'), '');
  return lines.join('\n');
}

/* ------------------------------------------------------------ ciclo de vida */

function parseDir(files, dir, parser) {
  return Object.keys(files)
    .filter(p => p.startsWith(dir + '/') && FILE_RE.test('/' + p) && files[p] != null)
    .map(p => parser(files[p], p))
    .filter(Boolean)
    .sort((a, b) => (a.id || a.path).localeCompare(b.id || b.path, 'en', { numeric: true }));
}

/**
 * @param ctx { files, now, prod, decs: Entry[] (DEC), thresholds: { requestWaitDays, responseUnprocessedHours } }
 */
export function buildDecisions(ctx) {
  const { files = {}, now, decs = [] } = ctx;
  const T = { requestWaitDays: 7, responseUnprocessedHours: 48, ...(ctx.thresholds || {}) };
  const requests = parseDir(files, REQUESTS_DIR, parseRequest);
  const responses = parseDir(files, RESPONSES_DIR, parseResponse);
  const checks = [];
  const add = (level, id, title, detail, source, ref) => checks.push({ level, id, title, detail, source, ref: ref || null });
  const reqById = new Map(requests.filter(r => r.id).map(r => [r.id, r]));

  for (const r of requests) {
    r.respuestas = responses.filter(x => x.solicitud === r.id).sort((a, b) => (a.fecha || 0) - (b.fecha || 0));
    r.ultima = r.respuestas[r.respuestas.length - 1] || null;
    r.medido = r.verificacion && VERIFY[r.verificacion] ? VERIFY[r.verificacion](ctx) : null;
    r.vencida = false;
    const u = r.ultima && !r.ultima.problems.length ? r.ultima : null;
    if (!r.abierta) r.state = 'closed';
    else if (u && u.respuesta === 'POSTPONED' && u.hasta && u.hasta.getTime() > now) r.state = 'postponed';
    else if (u && u.respuesta !== 'POSTPONED') r.state = 'answered';
    else if (r.tipo === 'accion' && r.medido === true) r.state = 'measured';
    else { r.state = 'open'; r.vencida = !!(u && u.respuesta === 'POSTPONED'); }
    r.estadoTexto = STATE_TEXT[r.state];
    r.esperaMs = r.state === 'open' && r.fecha ? now - r.fecha.getTime() : null;

    if (r.problems.length) add('warn', 'req:invalid:' + (r.id || r.path), `Pedido ${r.id || r.path} fuera de formato`, r.problems.join('; '), 'declarado', r.id);
    if (r.sinJustificar && r.state !== 'closed') {
      add('warn', 'req:unjustified:' + r.id, `${r.id} no llega a Pablo: no explica por qué la Factory no puede decidirlo`,
        'Falta "## Por qué te lo pregunto". La Factory debe decidirlo sola o justificar el pedido (soberanía de decisiones, DEC-018).', 'declarado', r.id);
    }
    if (r.state === 'open' && r.esperaMs != null && r.esperaMs > T.requestWaitDays * 864e5) {
      add('warn', 'req:waiting:' + r.id, `Hace ${Math.floor(r.esperaMs / 864e5)} días que la Factory espera tu respuesta: ${r.titulo}`, 'Pedido abierto sin respuesta.', 'medido', r.id);
    }
    if (r.vencida) add('info', 'req:due:' + r.id, `Venció el plazo que pospusiste: ${r.titulo}`, 'Vuelve a "Esperando tu respuesta".', 'medido', r.id);
    if (r.state === 'measured') add('info', 'req:measured:' + r.id, `Hecho y verificado: ${r.titulo}`, 'La Factory debe cerrar el pedido.', 'medido', r.id);
    if (r.state === 'answered' && r.ultima.procesada) {
      add('warn', 'req:notclosed:' + r.id, `${r.id} tiene la respuesta procesada pero el pedido sigue ABIERTO`, `Cerrar el pedido (Estado: CERRADA) citando ${r.ultima.id}.`, 'declarado', r.id);
    }
  }

  for (const x of responses) {
    if (x.problems.length) add('warn', 'resp:invalid:' + (x.id || x.path), `Respuesta ${x.id || x.path} fuera de formato`, x.problems.join('; '), 'declarado', x.id);
    const req = x.solicitud ? reqById.get(x.solicitud) : null;
    if (x.solicitud && !req) add('warn', 'resp:orphan:' + x.id, `${x.id} responde a ${x.solicitud}, que no existe`, 'La Factory no puede procesarla.', 'declarado', x.id);
    if (req && x.opcion && req.opciones.length && !req.opciones.some(o => o.clave === x.opcion)) {
      add('warn', 'resp:option:' + x.id, `${x.id} elige la opción ${x.opcion}, que no existe en ${req.id}`, 'Opciones válidas: ' + req.opciones.map(o => o.clave).join(', '), 'declarado', x.id);
    }
    if (!x.procesada && x.respuesta && x.respuesta !== 'POSTPONED' && x.fecha) {
      const h = (now - x.fecha.getTime()) / 36e5;
      if (h > T.responseUnprocessedHours) add('warn', 'resp:unprocessed:' + x.id, `Respondiste hace ${Math.floor(h)} h y la Factory todavía no procesó ${x.id}`, 'La Factory debe procesar las respuestas pendientes al iniciar cada sesión (DEC-011).', 'medido', x.id);
    }
  }

  // Contrato v3: una DEC PROPUESTA debe tener un pedido que la presente a Pablo.
  const covered = new Set(requests.filter(r => r.state !== 'closed').flatMap(r => r.relacionados));
  const proposed = decs.filter(d => d.estadoCodigo === 'PROPUESTA');
  if (requests.length) {
    for (const d of proposed) if (!covered.has(d.id)) add('warn', 'dec:noreq:' + d.id, `${d.id} está PROPUESTA pero no hay un pedido abierto para Pablo`, 'Crear un REQ que la presente (contrato v3, DEC-011).', 'declarado', d.id);
  } else if (proposed.length) {
    add('info', 'decisions:v3', 'Todavía no hay pedidos en requests/', 'Las decisiones PROPUESTA se muestran desde su DEC (contrato v2).', 'declarado');
  }

  const by = (st) => requests.filter(r => r.state === st);
  return {
    requests, responses, checks,
    open: by('open').sort((a, b) => prio(a.prioridad) - prio(b.prioridad) || (b.esperaMs || 0) - (a.esperaMs || 0)),
    postponed: by('postponed'), answered: by('answered'), measured: by('measured'), closed: by('closed'),
    pendingResponses: responses.filter(x => !x.procesada && x.respuesta && !x.problems.length),
  };
}

const PRIO = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
function prio(p) { const i = PRIO.indexOf(p); return i === -1 ? 9 : i; }
