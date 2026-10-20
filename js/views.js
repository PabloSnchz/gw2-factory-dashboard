/**
 * js/views.js — Vistas del Centro de Decisiones. Funciones puras: modelo → string HTML.
 *
 * Construidas con el Gato Design System (gds/components.css, gds/icons.js):
 * - Todo texto proveniente de la memoria se escapa (esc) antes de insertarse.
 * - Ningún estado depende solo del color: siempre ícono + texto (WCAG 1.4.1).
 * - Los IDs internos (DEC, LES, BL, RSK, REQ) son referencias secundarias, nunca el contenido principal.
 * - Orden de la vista Hoy: lo que necesita a Pablo primero; el estado de la Factory después.
 */

import { CONFIG, blobUrl, commitUrl, repoUrl } from './config.js';
import { esc, mdToHtml, extractIds } from './parse.js';
import { responseActions, buildIssueUrl } from './respond.js';
import { RESPONSES } from './decisions.js';
import { icon, brandMark } from '../gds/icons.js';

const WORKFLOW = [
  ['PRODUCT', 'Producto'], ['ARCHITECTURE', 'Arquitectura'], ['DEVELOPMENT', 'Desarrollo'],
  ['REVIEW', 'Revisión'], ['DOCUMENTATION', 'Documentación'],
];
const KIND_LABEL = { DEC: 'Decisión', LES: 'Lección', FEAT: 'Funcionalidad', BL: 'Tarea', RSK: 'Riesgo', REQ: 'Pedido', RESP: 'Respuesta' };

/** Nivel → variante visual, ícono y texto. El texto siempre acompaña al color. */
const LEVEL = {
  critical: { variant: 'danger', icon: 'octagon', label: 'Crítico' },
  warn: { variant: 'warning', icon: 'alert', label: 'Atención' },
  info: { variant: 'info', icon: 'info', label: 'Info' },
  ok: { variant: 'success', icon: 'check', label: 'En orden' },
};
const PRIORITY = {
  'CRÍTICO': { variant: 'danger', icon: 'octagon', label: 'Prioridad crítica' },
  ALTO: { variant: 'warning', icon: 'alert', label: 'Prioridad alta' },
  MEDIO: { variant: 'info', icon: 'info', label: 'Prioridad media' },
  BAJO: { variant: '', icon: 'info', label: 'Prioridad baja' },
};

export const NAV = [
  { route: 'hoy', label: 'Hoy', icon: 'compass' },
  { route: 'trabajo', label: 'Trabajo', icon: 'layers' },
  { route: 'conocimiento', label: 'Conocimiento', icon: 'book' },
  { route: 'riesgos', label: 'Riesgos', icon: 'shield' },
  { route: 'actividad', label: 'Actividad', icon: 'clock' },
  { route: 'salud', label: 'Salud', icon: 'pulse' },
];

/* ------------------------------------------------------------ formato */

export function relTime(ms) {
  if (ms == null) return '—';
  const abs = Math.abs(ms), s = abs / 1000, m = s / 60, h = m / 60, d = h / 24;
  const v = d >= 1 ? `${Math.floor(d)} d` : h >= 1 ? `${Math.floor(h)} h` : m >= 1 ? `${Math.floor(m)} min` : 'segundos';
  return ms >= 0 ? `hace ${v}` : `en ${v}`;
}

export function duration(ms) {
  if (ms == null || ms < 0) return '—';
  const min = Math.floor(ms / 60000), h = Math.floor(min / 60), d = Math.floor(h / 24);
  if (d >= 1) return `${d} d ${h % 24} h`;
  if (h >= 1) return `${h} h ${min % 60} min`;
  return `${min} min`;
}

function fmtDate(d, withTime = false) {
  if (!d) return '—';
  const opts = withTime
    ? { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' };
  return d.toLocaleString('es-AR', opts);
}

/** Estado de la Factory en lenguaje humano (status.md usa códigos). */
export function humanStatus(code) {
  const c = String(code || '').toUpperCase();
  if (/BLOQUEAD/.test(c)) return { text: 'Bloqueada', level: 'warn' };
  if (/VALIDAC/.test(c)) return { text: 'Esperando tu validación', level: 'warn' };
  if (/CURSO|EJECUC|ACTIVO/.test(c)) return { text: 'Trabajando', level: 'ok' };
  if (/ESPERA/.test(c)) return { text: 'Esperando', level: 'info' };
  if (/IDLE|PAUSA/.test(c)) return { text: 'En pausa', level: 'info' };
  if (!c || c === 'SIN DATO') return { text: 'Sin dato', level: 'critical' };
  return { text: code, level: 'info' };
}

/** Quita IDs del comienzo de un título ("BL-020 — X", "[REQ-001] X") para mostrar solo el contenido. */
export function plainTitle(text) {
  return String(text || '').replace(/^(\[?(DEC|LES|FEAT|BL|RSK|REQ|RESP)-\d{3}\]?\s*[—:\-–]?\s*)+/, '').trim();
}

/** Primer párrafo de un texto markdown, en una línea (para resúmenes). */
function firstParagraph(md) {
  return String(md || '').trim().split(/\n\s*\n/)[0].replace(/^\s*[-*]\s+/gm, '').replace(/\s*\n\s*/g, ' ').trim();
}

function statusChip(text, variant, iconName) {
  return `<span class="gds-status${variant ? ' gds-status--' + variant : ''}">${icon(iconName || 'info')}${esc(text)}</span>`;
}
function levelChip(level, text) {
  const L = LEVEL[level] || LEVEL.info;
  return statusChip(text || L.label, L.variant, L.icon);
}
function prioChip(p) {
  const P = PRIORITY[p];
  return P ? statusChip(P.label, P.variant, P.icon) : '';
}
function count(n, label) {
  return `<span class="gds-count">${n}<span class="gds-visually-hidden"> ${esc(label || '')}</span></span>`;
}

/** Referencia interna: link chico y secundario. */
function ref(id, model, label) {
  if (!id) return '';
  return model.allIds.has(id)
    ? `<a class="gds-ref" href="#/item/${esc(id)}"${label ? ` aria-label="${esc(label)}"` : ''}>${esc(id)}</a>`
    : `<span class="gds-ref gds-ref--missing" title="No existe en la memoria">${esc(id)}</span>`;
}

/** Convierte IDs conocidos dentro de texto YA escapado en referencias secundarias. */
function linkIds(escaped, model) {
  return escaped.replace(/\b(DEC|LES|FEAT|BL|RSK|REQ|RESP)-\d{3}\b/g, (id) => ref(id, model));
}

/** Texto de una línea: escapa, renderiza `código` y enlaza IDs. */
function t(text, model) {
  return esc(text).split(/(`[^`]+`)/g)
    .map(part => (/^`[^`]+`$/.test(part) ? `<code>${part.slice(1, -1)}</code>` : linkIds(part, model)))
    .join('');
}

/** Dato faltante explícito: un dato no leído nunca se muestra como 0. */
function na(reason) { return `<span class="gds-na">— <small>${esc(reason || 'sin dato')}</small></span>`; }

function empty(text) { return `<p class="gds-empty">${esc(text)}</p>`; }

function sectionHead(title, n, extra) {
  return `<div class="gds-card__header"><h2 class="gds-title-1">${esc(title)}${n != null ? ' ' + count(n) : ''}</h2>${extra || ''}</div>`;
}

/* ------------------------------------------------------------ responder (DEC-012) */

const reqOf = (m, id) => (m.decisions && id ? m.decisions.requests.find(r => r.id === id) : null);

/** Botones de respuesta de un pedido abierto: enlaces a un issue prellenado (sin secretos en el navegador). */
export function renderRespond(req, m) {
  const actions = responseActions(req, m.generatedAt);
  if (!actions.length) return '';
  return `<div class="respond" role="group" aria-label="Responder: ${esc(plainTitle(req.titulo))}">
    <div class="gds-cluster">
      ${actions.map((a, i) => `<a class="gds-button ${i === 0 ? 'gds-button--primary' : 'gds-button--secondary'}" href="${esc(buildIssueUrl(req, a))}" target="_blank" rel="noopener"
        aria-label="${esc(a.label)}: ${esc(plainTitle(req.titulo))} (abre GitHub en otra pestaña)">${esc(a.label)}${icon('external')}</a>`).join('')}
    </div>
    <p class="gds-caption gds-text-muted">Se abre GitHub con tu respuesta lista. Podés agregar un comentario y tocá <strong>Submit new issue</strong>: en un minuto queda registrada.</p>
  </div>`;
}

const TIPO_LABEL = { accion: 'Acción tuya', pedido: 'Decisión', decision: 'Decisión', backlog: 'Bloqueado por vos', status: 'Pendiente tuyo' };

/** Tarjeta de decisión: qué se pide, por qué importa, qué recomienda la Factory y cómo responder. */
function renderDecisionCard(h, m, first) {
  const req = reqOf(m, h.id);
  const failed = (m.channel && m.channel.items || []).find(c => c.solicitud && c.solicitud === h.id);
  const why = req ? firstParagraph(req.porQueImporta) : h.pregunta;
  const extra = (h.relacionados || []).filter(r => r !== h.id);
  const headId = 'dq-' + (h.id || Math.abs(hash(h.titulo)));
  return `<article class="gds-card decision${first ? ' gds-card--accent' : ''}" aria-labelledby="${esc(headId)}">
    <div class="decision__meta gds-cluster">
      ${statusChip(TIPO_LABEL[h.tipo] || 'Pendiente', 'accent', h.tipo === 'accion' ? 'hand' : 'compass')}
      ${prioChip(h.prioridad)}
      ${h.esperaMs != null ? `<span class="gds-caption gds-text-muted">${icon('clock')} Esperando ${esc(duration(h.esperaMs))}</span>` : ''}
    </div>
    <h3 id="${esc(headId)}" class="gds-title-1">${t(plainTitle(h.titulo), m)}</h3>
    ${why && !(req && req.recomendacion && why === h.pregunta) ? `<p class="gds-body-2 gds-text-secondary gds-measure">${t(why, m)}</p>` : ''}
    ${req && req.opciones && req.opciones.length ? `<ul class="decision__options gds-body-2">${req.opciones.map(o => `<li><strong>${esc(o.clave)}</strong> — ${t(o.texto, m)}</li>`).join('')}</ul>` : ''}
    ${req && req.recomendacion ? `<div class="gds-callout gds-callout--accent">${icon('sparkle')}<div>
      <p class="gds-callout__title">La Factory recomienda</p><p class="gds-callout__body">${t(req.recomendacion.texto, m)}</p></div></div>` : ''}
    ${req && req.comoHacerlo ? `<details class="decision__how"><summary class="gds-label-1">Cómo hacerlo</summary><div class="md gds-body-2">${linkIdsInHtml(mdToHtml(req.comoHacerlo, () => '#'), m)}</div></details>` : ''}
    ${failed ? renderChannelItem(failed, m, true) : ''}
    ${req ? renderRespond(req, m) : `<p class="gds-caption gds-text-muted">${icon('info')} Se responde fuera del panel, en la conversación con la Factory.</p>`}
    <p class="gds-caption gds-text-muted decision__refs">${h.id ? `Detalle: ${ref(h.id, m, 'Ver detalle de ' + h.id)}` : ''}${extra.length ? ` · También resuelve: ${extra.map(r => ref(r, m)).join(', ')}` : ''}</p>
  </article>`;
}

function hash(s) { let x = 0; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) | 0; return x; }

/** Una respuesta enviada que todavía no se registró (registrándose o con error). */
function renderChannelItem(c, m, compact) {
  const r = c.request;
  const what = c.respuesta && RESPONSES[c.respuesta] ? RESPONSES[c.respuesta].label : 'Tu respuesta';
  const subject = r ? `«${plainTitle(r.titulo)}»` : (c.solicitud || 'un pedido');
  if (c.state === 'processing') {
    return `<div class="gds-callout gds-callout--info" role="status">${icon('clock')}<div>
      <p class="gds-callout__title">Registrando tu respuesta (${esc(what.toLowerCase())})${compact ? '' : ' a ' + esc(subject)}</p>
      <p class="gds-callout__body">Enviada ${esc(relTime(c.ageMs))}. Tocá Refrescar en un minuto. <a href="${esc(c.url)}" target="_blank" rel="noopener">Ver el issue #${esc(c.number)}</a></p></div></div>`;
  }
  return `<div class="gds-callout gds-callout--danger">${icon('octagon')}<div>
    <p class="gds-callout__title">Tu respuesta (${esc(what.toLowerCase())})${compact ? '' : ' a ' + esc(subject)} no se pudo registrar</p>
    <p class="gds-callout__body">El motivo está en el último comentario del issue. Corregilo con Edit y se reintenta solo.
      <a href="${esc(c.url)}" target="_blank" rel="noopener">Abrir el issue #${esc(c.number)}</a></p></div></div>`;
}

/** Pedidos que ya respondiste y todavía no se cerraron: confirmación de que la respuesta llegó. */
function renderAnswered(m) {
  const d = m.decisions;
  if (!d) return '';
  const list = [...d.answered, ...d.postponed, ...d.measured];
  if (!list.length) return '';
  const what = (r) => {
    if (r.state === 'measured') return 'Hecho (verificado por el panel)';
    const u = r.ultima;
    const label = u && RESPONSES[u.respuesta] ? RESPONSES[u.respuesta].label : 'Respondido';
    return label + (u && u.opcion ? ` · opción ${u.opcion}` : '') + (r.state === 'postponed' && u.hasta ? ` hasta el ${u.hasta.toISOString().slice(0, 10)}` : '');
  };
  return `<section class="gds-stack--sm gds-stack" aria-labelledby="answered-title">
    <h3 id="answered-title" class="gds-label-2 gds-text-secondary">Ya respondiste</h3>
    <ul class="gds-list">${list.map(r => `<li class="gds-list__item">${icon('check', 'is-success')}<div>
      <p class="gds-label-1">${esc(plainTitle(r.titulo))}</p>
      <p class="gds-caption gds-text-secondary">${esc(what(r))} · ${esc(r.estadoTexto)} · ${ref(r.id, m)}</p></div></li>`).join('')}</ul>
  </section>`;
}

/* ------------------------------------------------------------ chrome */

export function renderHeader(model, route, loading) {
  const counts = model ? {
    hoy: model.human.length,
    riesgos: (model.risks || []).filter(r => r.estado === 'ABIERTO').length,
    salud: (model.health.counts.critical || 0) + (model.health.counts.warn || 0),
  } : {};
  const pillLabel = { hoy: 'pendientes tuyos', riesgos: 'riesgos abiertos', salud: 'problemas de salud' };
  const st = model ? humanStatus(model.statusInfo.code) : null;
  return `
  <div class="app-bar">
    <a class="brand" href="#/hoy" aria-label="Gato Negro Factory — inicio">
      ${brandMark(32)}
      <span><strong class="gds-title-2">Gato Negro Factory</strong><span class="gds-caption gds-text-muted">Centro de decisiones</span></span>
    </a>
    <nav class="app-nav gds-tabs" aria-label="Secciones">
      ${NAV.map(n => `<a href="#/${n.route}" class="gds-tab"${route === n.route ? ' aria-current="page"' : ''}>${icon(n.icon)}${n.label}${model && counts[n.route] ? ' ' + count(counts[n.route], pillLabel[n.route]) : ''}</a>`).join('')}
    </nav>
    <div class="app-meta gds-cluster">
      ${model ? `${levelChip(st.level, st.text)}
        <span class="gds-caption gds-text-muted">Leído ${esc(relTime(Date.now() - model.generatedAt))}
        ${model.ref ? `· <a class="gds-ref" href="${commitUrl('dev', model.ref)}" target="_blank" rel="noopener" title="Commit de la memoria leída">@${esc(model.ref.slice(0, 7))}</a>` : '· rama main'}</span>` : ''}
      <button id="btn-refresh" type="button" class="gds-button gds-button--secondary gds-button--sm" ${loading ? 'disabled aria-busy="true"' : ''}>${icon('refresh')}${loading ? 'Leyendo…' : 'Refrescar'}</button>
    </div>
  </div>`;
}

/* ------------------------------------------------------------ HOY */

/** Frase de una línea que resume la situación para Pablo. */
export function verdict(m) {
  const n = m.human.length;
  const failed = (m.channel && m.channel.items || []).filter(c => c.state === 'failed').length;
  if (failed) return { text: failed === 1 ? 'Una respuesta tuya no se pudo registrar' : `${failed} respuestas tuyas no se pudieron registrar`, level: 'critical' };
  if (n) return { text: n === 1 ? 'Hay 1 cosa esperando tu decisión' : `Hay ${n} cosas esperando tu decisión`, level: 'warn' };
  if (m.health.level === 'critical') return { text: 'Nada espera tu decisión, pero hay un problema crítico', level: 'critical' };
  const st = humanStatus(m.statusInfo.code);
  return { text: st.level === 'ok' ? 'La Factory está trabajando: nada necesita tu decisión' : 'Nada necesita tu decisión', level: 'ok' };
}

export function renderHome(m) {
  const s = m.status || {};
  const si = m.statusInfo;
  const st = humanStatus(si.code);
  const a = m.activity;
  const b = m.backlog || {};
  const v = verdict(m);
  const crit = m.health.counts.critical || 0;
  const blocked = (b.BLOCKED || []).length;
  const stage = (s.etapa || '').toUpperCase();
  const stageIdx = WORKFLOW.findIndex(([w]) => stage.includes(w));
  const stageDone = /COMPLETAD/.test(stage);
  const channel = (m.channel && m.channel.items) || [];
  const looseChannel = channel.filter(c => !m.human.some(h => h.id === c.solicitud));

  return `
  <section class="verdict gds-stack--sm gds-stack" aria-labelledby="verdict-title">
    <p class="gds-label-2 gds-text-muted">Resumen</p>
    <h1 id="verdict-title" class="gds-headline-1">${esc(v.text)}</h1>
    <div class="gds-cluster">
      ${m.human.length ? statusChip(`${m.human.length} esperando tu decisión`, 'warning', 'hand') : statusChip('Sin decisiones pendientes', 'success', 'check')}
      ${crit ? statusChip(`${crit} problema${crit > 1 ? 's' : ''} crítico${crit > 1 ? 's' : ''}`, 'danger', 'octagon') : ''}
      ${blocked ? statusChip(`${blocked} bloqueado${blocked > 1 ? 's' : ''}`, 'warning', 'alert') : ''}
      ${levelChip(st.level, 'Factory: ' + st.text)}
    </div>
  </section>

  ${looseChannel.length ? `<div class="gds-stack--sm gds-stack">${looseChannel.map(c => renderChannelItem(c, m, false)).join('')}</div>` : ''}

  <section class="gds-stack" aria-labelledby="human-title">
    <h2 id="human-title" class="gds-headline-2">Necesita tu decisión ${count(m.human.length, 'pendientes')}</h2>
    ${m.human.length
      ? `<div class="decisions">${m.human.map((h, i) => renderDecisionCard(h, m, i === 0)).join('')}</div>`
      : `<div class="gds-callout gds-callout--success">${icon('check')}<div><p class="gds-callout__title">Nada espera una decisión tuya.</p>
        <p class="gds-callout__body">Cuando la Factory necesite algo, aparece acá con su recomendación y los botones para responder.</p></div></div>`}
    ${renderAnswered(m)}
  </section>

  <section class="gds-card factory" aria-labelledby="factory-title">
    <div class="gds-card__header">
      <h2 id="factory-title" class="gds-title-1">¿Qué está haciendo la Factory?</h2>
      <div class="gds-cluster">${levelChip(st.level, st.text)}${m.fase ? `<a class="gds-ref" href="#/trabajo">${esc(m.fase.id)} · ${esc(m.fase.nombre)}</a>` : ''}</div>
    </div>
    <div class="gds-stack">
      <p class="gds-headline-2">${s.tarea ? t(plainTitle(s.tarea), m) : na('status.md no declara tarea')}</p>
      <p class="gds-body-1 gds-text-secondary gds-measure"><strong class="gds-label-1">Por qué:</strong> ${s.motivo ? t(s.motivo, m) : na('falta "Motivo:" en status.md')}</p>
      <ol class="gds-stepper" aria-label="Etapa del trabajo">
        ${WORKFLOW.map(([w, label], i) => {
          const state = stageIdx === -1 ? 'todo' : i < stageIdx || (i === stageIdx && stageDone) ? 'done' : i === stageIdx ? 'current' : 'todo';
          const sr = { done: 'completada', current: 'etapa actual', todo: 'pendiente' }[state];
          return `<li class="gds-stepper__step" data-state="${state}"${state === 'current' ? ' aria-current="step"' : ''}>${icon(state === 'done' ? 'check' : state === 'current' ? 'arrow' : 'clock')}<span>${label}<span class="gds-visually-hidden"> (${sr})</span></span></li>`;
        }).join('')}
      </ol>
      <dl class="facts">
        <div><dt>Tiempo en ejecución</dt><dd>${si.inicio ? esc(duration(si.enEjecucionMs)) + ` <span class="gds-caption gds-text-muted">desde ${esc(fmtDate(si.inicio, true))}</span>` : na('falta "Inicio:" en status.md')}</dd></div>
        <div><dt>Última actualización</dt><dd>${si.actualizado ? esc(relTime(si.desdeActualizacionMs)) : na()}</dd></div>
        <div class="facts__wide"><dt>Próxima acción</dt><dd>${s.proxima ? t(s.proxima, m) : na()}</dd></div>
      </dl>
    </div>
  </section>

  <section class="gds-card" aria-labelledby="concerns-title">
    <div class="gds-card__header"><h2 id="concerns-title" class="gds-title-1">Qué debería preocuparte ${count(m.concerns.length)}</h2></div>
    ${m.concerns.length ? `<ul class="gds-list">${m.concerns.slice(0, 6).map(c => `
      <li class="gds-list__item">${icon(LEVEL[c.level].icon, 'is-' + LEVEL[c.level].variant)}<div>
        <p class="gds-label-1"><span class="gds-visually-hidden">${esc(LEVEL[c.level].label)}: </span>${t(c.titulo, m)}</p>
        <p class="gds-caption gds-text-muted">${esc(c.origen)}${c.id ? ' · ' + ref(c.id, m) : ''}</p></div></li>`).join('')}</ul>
      ${m.concerns.length > 6 ? `<p class="more gds-body-2"><a href="#/salud">Ver ${m.concerns.length - 6} más en Salud y Riesgos</a></p>` : ''}`
    : empty('Sin riesgos altos abiertos ni problemas de salud.')}
  </section>

  <div class="gds-grid">
    ${renderPeriod('Hoy', a.commitsToday, a.memoryToday, a.doneToday, m)}
    ${renderPeriod('Esta semana', a.commitsWeek, a.memoryWeek, a.doneWeek, m)}
  </div>

  <section aria-labelledby="metrics-title">
    <h2 id="metrics-title" class="gds-visually-hidden">Números</h2>
    <div class="metrics">
      ${metric('Listo para hacer', (b.READY || []).length, '#/trabajo')}
      ${metric('En curso', (b.IN_PROGRESS || []).length, '#/trabajo')}
      ${metric('Bloqueado', blocked, '#/trabajo')}
      ${metric('Hecho', (b.DONE || []).length, '#/trabajo')}
      ${metric('Riesgos abiertos', (m.risks || []).filter(r => r.estado === 'ABIERTO').length, '#/riesgos')}
      ${metric('Decisiones', (m.entries.DEC || []).length, '#/conocimiento/dec')}
      ${metric('Lecciones', (m.entries.LES || []).length, '#/conocimiento/les')}
      ${metric('Funcionalidades', (m.entries.FEAT || []).length, '#/conocimiento/feat')}
    </div>
  </section>

  ${renderEnvironments(m)}`;
}

function metric(label, value, href) {
  return `<a class="gds-metric" href="${href}"><span class="gds-metric__value">${value}</span><span class="gds-metric__label">${esc(label)}</span></a>`;
}

function renderPeriod(title, commits, memory, done, m) {
  const total = commits.length + memory.length + done.length;
  return `<section class="gds-card" aria-label="Actividad: ${esc(title)}">
    <div class="gds-card__header"><h2 class="gds-title-1">${esc(title)}</h2>
      <span class="gds-caption gds-text-muted">${commits.length} commits · ${memory.length} registros · ${done.length} terminados</span></div>
    ${total ? `<ul class="gds-timeline">
      ${done.slice(0, 4).map(d => `<li class="gds-timeline__item"><span class="gds-timeline__time">Hecho</span><span>${esc(plainTitle(d.titulo))} ${ref(d.id, m)}</span></li>`).join('')}
      ${memory.slice(0, 4).map(x => `<li class="gds-timeline__item"><span class="gds-timeline__time">${esc(KIND_LABEL[x.kind] || x.kind)}</span><span>${esc(plainTitle(x.titulo))} ${ref(x.id, m)}</span></li>`).join('')}
      ${commits.slice(0, 4).map(c => `<li class="gds-timeline__item"><span class="gds-timeline__time">${esc(c.repo === 'dev' ? 'DEV' : 'Panel')}</span><span>${t(c.title, m)} <a class="gds-ref" href="${commitUrl(c.repo, c.sha)}" target="_blank" rel="noopener">${esc(c.short)}</a></span></li>`).join('')}
    </ul>` : empty('Sin actividad registrada en el período.')}
  </section>`;
}

function renderEnvironments(m) {
  const p = m.prod, c = m.compare;
  const lastOf = (repo) => m.commits.find(x => x.repo === repo);
  return `<section class="gds-card" aria-labelledby="env-title">
    <div class="gds-card__header"><h2 id="env-title" class="gds-title-1">Entornos</h2><span class="gds-caption gds-text-muted">medido en GitHub</span></div>
    <div class="gds-grid">
      <div class="gds-card gds-card--inset gds-stack--sm gds-stack">
        <p class="gds-cluster">${statusChip('DEV', 'info', 'layers')}<a href="${repoUrl('dev')}" target="_blank" rel="noopener">${esc(CONFIG.repos.dev.name)}</a></p>
        <p class="gds-body-2">${lastOf('dev') ? `Último commit ${esc(relTime(m.generatedAt - lastOf('dev').date))}` : na('sin commits leídos')}</p>
        <p class="gds-body-2">${c ? (c.status === 'identical' ? 'Idéntico a producción' : `${c.ahead_by} commit(s) por delante de producción` + (c.behind_by ? `, ${c.behind_by} por detrás` : '')) : na('comparación no disponible')}</p>
      </div>
      <div class="gds-card gds-card--inset gds-stack--sm gds-stack">
        <p class="gds-cluster">${statusChip('PROD', 'accent', 'shield')}<a href="${repoUrl('prod')}" target="_blank" rel="noopener">${esc(CONFIG.repos.prod.name)}</a></p>
        <p class="gds-body-2">${p ? `Último cambio ${p.date ? esc(relTime(m.generatedAt - new Date(p.date))) : ''} · <span class="gds-ref">${esc(p.sha.slice(0, 7))}</span>` : na('no verificable')}</p>
        <p class="gds-body-2">${p ? (p.protected ? levelChip('ok', 'main protegida') : levelChip('critical', 'main sin protección')) : ''}</p>
        <p class="gds-caption gds-text-muted">Solo lectura. Pasar algo a producción es decisión exclusiva tuya.</p>
      </div>
      <div class="gds-card gds-card--inset gds-stack--sm gds-stack">
        <p class="gds-cluster">${statusChip('PANEL', '', 'eye')}<a href="${repoUrl('dashboard')}" target="_blank" rel="noopener">${esc(CONFIG.repos.dashboard.name)}</a></p>
        <p class="gds-body-2">${lastOf('dashboard') ? `Último commit ${esc(relTime(m.generatedAt - lastOf('dashboard').date))}` : na('sin commits leídos')}</p>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ TRABAJO */

export function renderWork(m) {
  const b = m.backlog;
  const cols = [
    ['IN_PROGRESS', 'En curso', 'arrow'], ['BLOCKED', 'Bloqueado', 'alert'], ['READY', 'Listo para hacer', 'clock'], ['DONE', 'Hecho', 'check'],
  ];
  return `
  <header class="page-head gds-stack--sm gds-stack"><h1 class="gds-headline-1">Trabajo</h1><p class="gds-body-2 gds-text-secondary">Hacia dónde va la Factory y en qué está cada tarea.</p></header>
  <section class="gds-card" aria-labelledby="roadmap-title">
    <div class="gds-card__header"><h2 id="roadmap-title" class="gds-title-1">Etapas del plan</h2></div>
    ${m.roadmap && m.roadmap.length ? `<ol class="gds-list">${m.roadmap.map(p => {
      const lvl = /CURSO/.test(p.estado) ? ['accent', 'arrow', 'En curso'] : /HECH|COMPLET|DONE/.test(p.estado) ? ['success', 'check', 'Hecha'] : ['', 'clock', p.estado ? p.estado.charAt(0) + p.estado.slice(1).toLowerCase() : 'Sin estado'];
      return `<li class="gds-list__item">${icon(lvl[1])}<div class="gds-stack--sm gds-stack">
        <p class="gds-cluster"><strong class="gds-title-2">${esc(p.nombre)}</strong>${statusChip(lvl[2], lvl[0], lvl[1])}<span class="gds-ref">${esc(p.id)}</span></p>
        <p class="gds-body-2">${t(p.objetivo, m)}</p>
        <p class="gds-caption gds-text-secondary"><strong>Termina cuando:</strong> ${t(p.criterio, m)}</p></div></li>`;
    }).join('')}</ol>` : na('roadmap.md no disponible')}
  </section>
  ${b ? `<div class="board">${cols.map(([k, label, ic]) => `
    <section class="gds-card board__col" aria-labelledby="col-${k}">
      <div class="gds-card__header"><h2 id="col-${k}" class="gds-title-2">${icon(ic)} ${label} ${count(b[k].length)}</h2></div>
      ${b[k].length ? `<ul class="gds-list">${b[k].map(it => `
        <li class="gds-list__item ticket"><div class="gds-stack--sm gds-stack">
          <p class="gds-cluster">${prioChip(it.prioridad)}${ref(it.id, m)}</p>
          <p class="gds-label-1">${t(plainTitle(it.titulo), m)}</p>
          ${it.detalle ? `<p class="gds-caption gds-text-secondary">${t(it.detalle, m)}</p>` : ''}
        </div></li>`).join('')}</ul>` : empty('Vacío')}
    </section>`).join('')}</div>` : na('backlog.md no disponible')}`;
}

/* ------------------------------------------------------------ CONOCIMIENTO */

export function renderKnowledge(m, sub) {
  const tabs = CONFIG.collections.map(c => ({ key: c.prefix.toLowerCase(), ...c }));
  const active = tabs.find(x => x.key === sub) || tabs[0];
  const list = m.entries[active.prefix] || [];
  const resumen = new Map(Object.values(m.index || {}).flat().filter(x => x && x.id).map(x => [x.id, x.resumen]));
  const backlinks = buildBacklinks(m);
  return `
  <header class="page-head gds-stack--sm gds-stack"><h1 class="gds-headline-1">Conocimiento</h1><p class="gds-body-2 gds-text-secondary">Lo que la Factory decidió, aprendió y construyó.</p></header>
  <nav class="gds-tabs" aria-label="Tipo de registro">${tabs.map(x => `<a href="#/conocimiento/${x.key}" class="gds-tab"${x === active ? ' aria-current="page"' : ''}>${esc(x.label)} ${count((m.entries[x.prefix] || []).length)}</a>`).join('')}</nav>
  ${list.length ? `<div class="gds-grid">${list.slice().reverse().map(e => `
    <a class="gds-card gds-stack--sm gds-stack" href="#/item/${esc(e.id || '')}">
      <p class="gds-cluster">${e.estadoCodigo ? stateChip(e.estadoCodigo) : ''}<span class="gds-caption gds-text-muted">${esc(e.fechaTexto || 'sin fecha')}</span><span class="gds-ref">${esc(e.id || '?')}</span></p>
      <h2 class="gds-title-2">${esc(plainTitle(e.titulo))}</h2>
      ${resumen.get(e.id) ? `<p class="gds-body-2 gds-text-secondary">${esc(resumen.get(e.id))}</p>` : ''}
      ${(backlinks.get(e.id) || []).length ? `<p class="gds-caption gds-text-muted">Citado por ${(backlinks.get(e.id) || []).length}</p>` : ''}
    </a>`).join('')}</div>` : empty(`No hay ${active.label.toLowerCase()} registradas.`)}`;
}

/** Estado declarado de una entrada (ACEPTADA, PROPUESTA, …) con ícono y texto. */
function stateChip(code) {
  const c = String(code || '').toUpperCase();
  if (/ACEPTAD|HECH|DONE|DISPONIBLE|CERRAD|PROCESAD/.test(c)) return statusChip(code, 'success', 'check');
  if (/PROPUEST|ABIERT|PENDIENTE/.test(c)) return statusChip(code, 'warning', 'clock');
  if (/REEMPLAZ|DESCART|OBSOLET/.test(c)) return statusChip(code, '', 'x');
  return statusChip(code, 'info', 'info');
}

function buildBacklinks(m) {
  const map = new Map();
  const push = (to, from) => { if (to !== from) map.set(to, [...new Set([...(map.get(to) || []), from])]); };
  for (const e of Object.values(m.entries).flat()) for (const r of e.refs) push(r, e.id);
  for (const it of m.backlog ? Object.values(m.backlog).flat().filter(x => x && x.id) : []) for (const r of it.refs) push(r, it.id);
  for (const r of m.risks || []) for (const x of r.refs) push(x, r.id);
  return map;
}

export function renderItem(m, id) {
  const backlinks = buildBacklinks(m).get(id) || [];
  const cited = backlinks.length ? `<p class="gds-caption gds-text-secondary">Citado por: ${backlinks.map(x => ref(x, m)).join(', ')}</p>` : '';
  const entry = Object.values(m.entries).flat().find(e => e.id === id);
  if (entry) {
    const resolver = (href) => {
      const base = entry.path.split('/').slice(0, -1);
      const parts = [...base, ...href.split('/')].reduce((acc, p) => (p === '..' ? acc.slice(0, -1) : p === '.' ? acc : [...acc, p]), []);
      const target = parts.join('/');
      const linked = Object.values(m.entries).flat().find(e => e.path === target);
      return linked ? '#/item/' + linked.id : blobUrl('dev', CONFIG.memoryRoot + '/' + target, m.ref);
    };
    const kind = id.split('-')[0];
    const back = kind === 'REQ' || kind === 'RESP' ? ['#/hoy', 'Hoy'] : [`#/conocimiento/${kind.toLowerCase()}`, KIND_LABEL[kind] || 'Conocimiento'];
    const queueItem = entry.kind === 'REQ' ? m.human.find(h => h.id === id) : null;
    return `
    <nav class="crumbs gds-body-2" aria-label="Volver"><a href="${back[0]}">← ${esc(back[1])}</a></nav>
    ${queueItem ? renderDecisionCard(queueItem, m, true) : ''}
    <article class="gds-card doc gds-stack">
      <p class="gds-cluster">${statusChip(KIND_LABEL[kind] || kind, 'accent', 'book')}${entry.estadoCodigo ? stateChip(entry.estado || entry.estadoCodigo) : ''}<span class="gds-ref">${esc(entry.id)}</span></p>
      <h1 class="gds-headline-1">${esc(plainTitle(entry.titulo))}</h1>
      ${entry.kind === 'REQ' && !queueItem ? `<p class="gds-body-2 gds-text-secondary">${esc(entry.estadoTexto || '')}</p>` : ''}
      <dl class="meta">${Object.entries(entry.meta).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${t(v, m)}</dd></div>`).join('')}</dl>
      ${cited}
      <div class="md gds-measure">${linkIdsInHtml(mdToHtml(entry.body, resolver), m)}</div>
      <p class="gds-caption"><a href="${blobUrl('dev', CONFIG.memoryRoot + '/' + entry.path, m.ref)}" target="_blank" rel="noopener">Ver en GitHub ${icon('external')}</a></p>
    </article>`;
  }
  const bl = m.backlog ? Object.values(m.backlog).flat().find(x => x && x.id === id) : null;
  if (bl) {
    return `<nav class="crumbs gds-body-2" aria-label="Volver"><a href="#/trabajo">← Trabajo</a></nav>
    <article class="gds-card doc gds-stack"><p class="gds-cluster">${statusChip(SECTION_LABEL[bl.seccion] || bl.seccion, 'accent', 'layers')}${prioChip(bl.prioridad)}<span class="gds-ref">${esc(bl.id)}</span></p>
      <h1 class="gds-headline-1">${t(plainTitle(bl.titulo), m)}</h1>${bl.detalle ? `<p class="gds-body-1 gds-measure">${t(bl.detalle, m)}</p>` : ''}${cited}</article>`;
  }
  const rk = (m.risks || []).find(r => r.id === id);
  if (rk) {
    return `<nav class="crumbs gds-body-2" aria-label="Volver"><a href="#/riesgos">← Riesgos</a></nav>
    <article class="gds-card doc gds-stack"><p class="gds-cluster">${prioChip(rk.severidad)}${stateChip(rk.estado)}<span class="gds-ref">${esc(rk.id)}</span></p>
      <h1 class="gds-headline-2">${t(rk.riesgo, m)}</h1><dl class="meta"><div><dt>Mitigación</dt><dd>${t(rk.mitigacion || '—', m)}</dd></div>
      <div><dt>Responsable</dt><dd>${esc(rk.responsable || '—')}</dd></div></dl>${cited}</article>`;
  }
  return `<article class="gds-card gds-stack">${empty(`No existe ${id} en la memoria.`)}<p><a href="#/hoy">Volver a Hoy</a></p></article>`;
}

const SECTION_LABEL = { READY: 'Listo para hacer', IN_PROGRESS: 'En curso', BLOCKED: 'Bloqueado', DONE: 'Hecho' };

/** Enlaza IDs en HTML ya generado, sin tocar atributos ni contenido de <a>/<code>. */
function linkIdsInHtml(html, m) {
  return html.split(/(<a\b[\s\S]*?<\/a>|<code>[\s\S]*?<\/code>|<[^>]+>)/g)
    .map(part => (part.startsWith('<') ? part : linkIds(part, m))).join('');
}

/* ------------------------------------------------------------ RIESGOS */

export function renderRisks(m) {
  const risks = m.risks;
  if (!risks) return `<header class="page-head"><h1 class="gds-headline-1">Riesgos</h1></header>${na('risks.md no disponible')}`;
  const open = risks.filter(r => r.estado === 'ABIERTO');
  const groups = [
    ['Críticos abiertos', open.filter(r => r.severidad === 'CRÍTICO'), 'critical'],
    ['Altos abiertos', open.filter(r => r.severidad === 'ALTO'), 'warn'],
    ['Otros abiertos', open.filter(r => !['CRÍTICO', 'ALTO'].includes(r.severidad)), 'info'],
    ['Mitigados o cerrados', risks.filter(r => r.estado !== 'ABIERTO'), 'ok'],
  ];
  return `
  <header class="page-head gds-stack--sm gds-stack"><h1 class="gds-headline-1">Riesgos</h1><p class="gds-body-2 gds-text-secondary">${open.length} abiertos · ${risks.length - open.length} mitigados o cerrados.</p></header>
  ${groups.map(([title, list, lvl], gi) => `<section class="gds-card" aria-labelledby="rg-${gi}">
    <div class="gds-card__header"><h2 id="rg-${gi}" class="gds-title-1">${icon(LEVEL[lvl].icon, 'is-' + LEVEL[lvl].variant)} ${esc(title)} ${count(list.length)}</h2></div>
    ${list.length ? `<div class="gds-table-wrap"><table class="gds-table"><thead><tr><th scope="col">Riesgo</th><th scope="col">Severidad</th><th scope="col">Qué se hace</th><th scope="col">Responsable</th></tr></thead><tbody>
      ${list.map(r => `<tr><td>${t(r.riesgo, m)} ${ref(r.id, m)}</td><td>${prioChip(r.severidad)}</td><td>${t(r.mitigacion, m)}</td><td>${esc(r.responsable)}</td></tr>`).join('')}
    </tbody></table></div>` : empty('Ninguno.')}
  </section>`).join('')}`;
}

/* ------------------------------------------------------------ ACTIVIDAD */

export const RANGES = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };
const RANGE_LABEL = { '24h': 'Últimas 24 h', '7d': 'Últimos 7 días', '30d': 'Últimos 30 días' };

export function renderActivity(m, range) {
  const r = RANGES[range] ? range : '7d';
  const from = m.generatedAt - RANGES[r] * 3600 * 1000;
  const events = [
    ...m.commits.filter(c => c.date.getTime() >= from).map(c => ({ date: c.date, time: true, html:
      `${statusChip(c.repo === 'dev' ? 'DEV' : 'Panel', c.repo === 'dev' ? 'info' : '', 'layers')} ${t(c.title, m)} <a class="gds-ref" href="${commitUrl(c.repo, c.sha)}" target="_blank" rel="noopener">${esc(c.short)}</a>` })),
    ...m.activity.memory.filter(x => x.date.getTime() >= from - 24 * 3600 * 1000).map(x => ({ date: x.date, time: false, html:
      `${statusChip(KIND_LABEL[x.kind] || x.kind, 'accent', 'book')} ${esc(plainTitle(x.titulo))} ${ref(x.id, m)}${x.estado ? ` <span class="gds-caption gds-text-muted">· ${esc(x.estado)}</span>` : ''}` })),
  ].sort((a, b) => b.date - a.date);

  const byDay = new Map();
  for (const e of events) {
    const key = e.time ? e.date.toLocaleDateString('es-AR') : e.date.toLocaleDateString('es-AR', { timeZone: 'UTC' });
    byDay.set(key, [...(byDay.get(key) || []), e]);
  }
  const devCount = m.commits.filter(c => c.repo === 'dev' && c.date.getTime() >= from).length;
  const dashCount = m.commits.filter(c => c.repo === 'dashboard' && c.date.getTime() >= from).length;

  return `
  <header class="page-head gds-stack--sm gds-stack"><h1 class="gds-headline-1">Actividad</h1>
    <nav class="gds-tabs" aria-label="Período">${Object.keys(RANGES).map(k => `<a href="#/actividad/${k}" class="gds-tab"${k === r ? ' aria-current="page"' : ''}>${RANGE_LABEL[k]}</a>`).join('')}</nav>
    <p class="gds-body-2 gds-text-secondary">${devCount} commits en DEV · ${dashCount} en el panel · ${events.length - devCount - dashCount} registros de memoria.</p>
  </header>
  ${events.length ? [...byDay.entries()].map(([day, list]) => `<section class="gds-card" aria-label="${esc(day)}">
    <div class="gds-card__header"><h2 class="gds-title-1">${esc(day)}</h2></div>
    <ul class="gds-timeline">${list.map(e => `<li class="gds-timeline__item"><span class="gds-timeline__time">${e.time ? esc(e.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })) : 'día'}</span><span>${e.html}</span></li>`).join('')}</ul>
  </section>`).join('') : empty('Sin actividad en el período.')}`;
}

/* ------------------------------------------------------------ SALUD */

export function renderHealth(m) {
  const h = m.health;
  const api = m.api || {};
  const groups = ['critical', 'warn', 'info'];
  const GROUP_TITLE = { critical: 'Críticos', warn: 'Para revisar', info: 'Informativos' };
  const headline = h.level === 'ok' ? 'Sin problemas detectados' : h.level === 'critical' ? 'Hay problemas críticos' : 'Hay puntos para revisar';
  return `
  <header class="page-head gds-stack--sm gds-stack"><h1 class="gds-headline-1">Salud</h1>
    <p class="gds-cluster">${levelChip(h.level, headline)}<span class="gds-caption gds-text-muted">${h.counts.critical || 0} críticos · ${h.counts.warn || 0} para revisar · ${h.counts.info || 0} informativos</span></p>
  </header>
  ${groups.map(g => {
    const list = h.checks.filter(c => c.level === g);
    if (!list.length) return '';
    return `<section class="gds-card" aria-labelledby="hg-${g}"><div class="gds-card__header"><h2 id="hg-${g}" class="gds-title-1">${icon(LEVEL[g].icon, 'is-' + LEVEL[g].variant)} ${GROUP_TITLE[g]} ${count(list.length)}</h2></div>
      <ul class="gds-list">${list.map(c => `<li class="gds-list__item">${icon(LEVEL[g].icon, 'is-' + LEVEL[g].variant)}<div class="gds-stack--sm gds-stack">
        <p class="gds-label-1">${t(c.title, m)}</p>
        ${c.detail ? `<p class="gds-body-2 gds-text-secondary">${t(c.detail, m)}</p>` : ''}
        <p class="gds-caption gds-text-muted">${c.source === 'medido' ? 'Medido en GitHub' : 'Declarado en la memoria'}</p></div></li>`).join('')}</ul></section>`;
  }).join('')}
  ${h.checks.length === 0 ? `<div class="gds-callout gds-callout--success">${icon('check')}<div><p class="gds-callout__title">Todos los chequeos pasaron.</p></div></div>` : ''}
  <section class="gds-card" aria-labelledby="sources-title">
    <div class="gds-card__header"><h2 id="sources-title" class="gds-title-1">De dónde salen los datos</h2></div>
    <dl class="facts">
      <div><dt>Memoria</dt><dd>${m.ref ? `Commit <a class="gds-ref" href="${commitUrl('dev', m.ref)}" target="_blank" rel="noopener">${esc(m.ref.slice(0, 7))}</a>` : 'Rama main (sin fijar)'}</dd></div>
      <div><dt>Registros leídos</dt><dd>${m.allIds.size}</dd></div>
      <div><dt>Canal de respuestas</dt><dd>${m.channel && m.channel.available ? (m.channel.items.length ? `${m.channel.items.length} respuesta(s) sin registrar` : 'Sin respuestas pendientes de registrar') : na('no se pudo consultar')}</dd></div>
      <div><dt>API de GitHub</dt><dd>${api.remaining != null ? `${api.remaining}/${api.limit} consultas restantes · se renueva ${esc(relTime((api.reset || 0) - Date.now()))}` : 'sin consultas nuevas (caché)'}</dd></div>
      <div class="facts__wide"><dt>Cómo se calcula</dt><dd>Los chequeos corren en tu navegador en cada lectura, sin scripts locales. <strong>Declarado</strong> = lo que la Factory escribió en su memoria; <strong>medido</strong> = lo que se observa en GitHub. Una diferencia entre ambos es una inconsistencia.</dd></div>
    </dl>
  </section>`;
}

/* ------------------------------------------------------------ estados de carga */

export function renderLoading() {
  return `<section class="gds-stack" aria-busy="true" aria-label="Cargando">
    <p class="gds-body-1 gds-text-secondary">Leyendo la memoria de la Factory…</p>
    <div class="gds-skeleton"></div><div class="gds-skeleton"></div><div class="gds-skeleton"></div>
  </section>`;
}

export function renderFatal(err) {
  return `<div class="gds-callout gds-callout--danger" role="alert">${icon('octagon')}<div>
    <p class="gds-callout__title">No se pudo construir el panel</p>
    <p class="gds-callout__body">${esc(err && err.message || err)}. Ningún dato se muestra como 0: si algo falla, se dice. Probá con Refrescar.</p></div></div>`;
}

export { extractIds };
