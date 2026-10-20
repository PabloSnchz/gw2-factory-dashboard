/**
 * js/views.js — Vistas. Funciones puras: modelo → string HTML.
 * Todo texto proveniente de la memoria se escapa (esc) antes de insertarse.
 */

import { CONFIG, blobUrl, commitUrl, repoUrl } from './config.js';
import { esc, mdToHtml, extractIds } from './parse.js';

const WORKFLOW = ['PRODUCT', 'ARCHITECTURE', 'DEVELOPMENT', 'REVIEW', 'DOCUMENTATION'];
const LEVEL_LABEL = { critical: 'Crítico', warn: 'Atención', info: 'Info', ok: 'OK' };
const KIND_LABEL = { DEC: 'Decisión', LES: 'Lección', FEAT: 'Funcionalidad', BL: 'Backlog', RSK: 'Riesgo', REQ: 'Pedido', RESP: 'Respuesta' };

export const NAV = [
  { route: 'hoy', label: 'Hoy', icon: '◉' },
  { route: 'trabajo', label: 'Trabajo', icon: '▤' },
  { route: 'conocimiento', label: 'Conocimiento', icon: '◈' },
  { route: 'riesgos', label: 'Riesgos', icon: '⚠' },
  { route: 'actividad', label: 'Actividad', icon: '↻' },
  { route: 'salud', label: 'Salud', icon: '✚' },
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

function badge(text, cls) { return `<span class="badge ${cls || ''}">${esc(text)}</span>`; }
function prioBadge(p) { return p ? badge(p, 'prio-' + p.toLowerCase().replace('í', 'i')) : ''; }
function levelDot(level) { return `<span class="dot dot-${level}" aria-hidden="true"></span>`; }

/** Convierte IDs conocidos dentro de texto YA escapado en links internos. */
function linkIds(escaped, model) {
  return escaped.replace(/\b(DEC|LES|FEAT|BL|RSK|REQ|RESP)-\d{3}\b/g, (id) =>
    model.allIds.has(id) ? `<a class="idref" href="#/item/${id}">${id}</a>` : `<span class="idref idref-missing" title="No existe en la memoria">${id}</span>`);
}

/** Texto de una línea: escapa, renderiza `código` y enlaza IDs. */
function t(text, model) {
  return esc(text).split(/(`[^`]+`)/g)
    .map(part => (/^`[^`]+`$/.test(part) ? `<code>${part.slice(1, -1)}</code>` : linkIds(part, model)))
    .join('');
}

/** Texto "sin dato" explícito: un dato no leído nunca se muestra como 0. */
function na(reason) { return `<span class="na" title="${esc(reason || 'sin dato')}">— <small>${esc(reason || 'sin dato')}</small></span>`; }

function empty(text) { return `<p class="empty">${esc(text)}</p>`; }

/* ------------------------------------------------------------ chrome */

export function renderHeader(model, route, loading) {
  const lvl = model ? model.health.level : 'info';
  const counts = model ? {
    human: model.human.length,
    risks: (model.risks || []).filter(r => r.estado === 'ABIERTO').length,
    health: (model.health.counts.critical || 0) + (model.health.counts.warn || 0),
  } : {};
  const pill = (r) => {
    if (!model) return '';
    if (r === 'hoy' && counts.human) return `<span class="pill pill-warn" title="Decisiones esperando a Pablo">${counts.human}</span>`;
    if (r === 'riesgos' && counts.risks) return `<span class="pill">${counts.risks}</span>`;
    if (r === 'salud' && counts.health) return `<span class="pill pill-${lvl}">${counts.health}</span>`;
    return '';
  };
  return `
  <div class="brand">
    <span class="brand-mark">🐈‍⬛</span>
    <div><strong>Gato Negro Factory</strong><small>Centro de observación</small></div>
  </div>
  <nav class="nav" aria-label="Secciones">
    ${NAV.map(n => `<a href="#/${n.route}" class="nav-link ${route === n.route ? 'active' : ''}" ${route === n.route ? 'aria-current="page"' : ''}>
      <span class="nav-icon" aria-hidden="true">${n.icon}</span>${n.label}${pill(n.route)}</a>`).join('')}
  </nav>
  <div class="header-meta">
    ${model ? `${levelDot(lvl)}<span class="muted">Leído ${esc(relTime(Date.now() - model.generatedAt))}</span>
      ${model.ref ? `<a class="sha" href="${commitUrl('dev', model.ref)}" target="_blank" rel="noopener" title="Snapshot de ai-memory">@${esc(model.ref.slice(0, 7))}</a>` : '<span class="sha" title="Leído desde la rama">@main</span>'}` : ''}
    <button id="btn-refresh" class="btn" ${loading ? 'disabled' : ''}>${loading ? 'Leyendo…' : '↻ Refrescar'}</button>
  </div>`;
}

/* ------------------------------------------------------------ HOY */

export function renderHome(m) {
  const s = m.status || {};
  const si = m.statusInfo;
  const a = m.activity;
  const b = m.backlog || {};
  const stage = (s.etapa || '').toUpperCase();
  const stageIdx = WORKFLOW.findIndex(w => stage.includes(w));
  const stageDone = /COMPLETAD/.test(stage);

  const statusLevel = m.health.level === 'critical' ? 'critical' : si.level;
  const extraRefs = (h) => h.relacionados.filter(r => !String(h.pregunta || '').includes(r));

  return `
  <section class="hero card lvl-${statusLevel}">
    <div class="hero-top">
      <div>
        <div class="eyebrow">¿Qué está haciendo la Factory?</div>
        <h1 class="hero-title">${s.tarea ? t(s.tarea, m) : na('status.md no declara tarea')}</h1>
      </div>
      <div class="hero-state">
        ${badge(si.label, 'state state-' + si.level)}
        ${m.fase ? `<a href="#/trabajo" class="phase">${esc(m.fase.id)} · ${esc(m.fase.nombre)}</a>` : ''}
      </div>
    </div>

    <div class="why"><span class="eyebrow">Por qué</span> ${s.motivo ? t(s.motivo, m) : na('falta "Motivo:" en status.md')}</div>

    <ol class="stepper" aria-label="Etapa del workflow">
      ${WORKFLOW.map((w, i) => {
        const cls = stageIdx === -1 ? '' : i < stageIdx || (i === stageIdx && stageDone) ? 'done' : i === stageIdx ? 'current' : '';
        return `<li class="${cls}"><span>${i + 1}</span>${w}</li>`;
      }).join('')}
    </ol>

    <dl class="facts">
      <div><dt>Etapa</dt><dd>${s.etapa ? esc(s.etapa) : na()}</dd></div>
      <div><dt>Tiempo en ejecución</dt><dd>${si.inicio ? esc(duration(si.enEjecucionMs)) + ` <small class="muted">desde ${esc(fmtDate(si.inicio, true))}</small>` : na('falta "Inicio:" en status.md')}</dd></div>
      <div><dt>Última actualización</dt><dd>${si.actualizado ? esc(relTime(si.desdeActualizacionMs)) : na()}</dd></div>
      <div class="wide"><dt>Próxima acción</dt><dd>${s.proxima ? t(s.proxima, m) : na()}</dd></div>
    </dl>
  </section>

  <div class="grid-2">
    <section class="card">
      <h2>Necesita tu decisión <span class="count">${m.human.length}</span></h2>
      ${m.human.length ? `<ul class="list">${m.human.map(h => `
        <li class="list-item">
          <div class="li-main">
            ${h.id ? `<a class="idref" href="#/item/${esc(h.id)}">${esc(h.id)}</a>` : ''}
            ${prioBadge(h.prioridad)}
            <strong>${t(h.titulo, m)}</strong>
          </div>
          ${h.pregunta ? `<p class="li-sub">${t(h.pregunta, m)}</p>` : ''}
          ${h.esperaMs != null || extraRefs(h).length ? `<p class="li-meta">${[
            h.esperaMs != null ? `Esperando ${esc(duration(h.esperaMs))}` : '',
            extraRefs(h).length ? `Relacionado: ${extraRefs(h).map(r => t(r, m)).join(', ')}` : '',
          ].filter(Boolean).join(' · ')}</p>` : ''}
        </li>`).join('')}</ul>` : empty('Nada espera una decisión tuya.')}
    </section>

    <section class="card">
      <h2>Qué debería preocuparte <span class="count">${m.concerns.length}</span></h2>
      ${m.concerns.length ? `<ul class="list">${m.concerns.slice(0, 7).map(c => `
        <li class="list-item">${levelDot(c.level)}
          <div class="li-main">${c.id ? t(c.id, m) + ' ' : ''}<span>${t(c.titulo, m)}</span></div>
          <p class="li-meta">${esc(c.origen)}</p></li>`).join('')}</ul>
        ${m.concerns.length > 7 ? `<p class="more"><a href="#/salud">+${m.concerns.length - 7} más en Salud y Riesgos</a></p>` : ''}`
      : empty('Sin riesgos altos abiertos ni problemas de salud.')}
    </section>
  </div>

  <div class="grid-2">
    ${renderPeriod('Hoy', a.commitsToday, a.memoryToday, a.doneToday, m)}
    ${renderPeriod('Esta semana', a.commitsWeek, a.memoryWeek, a.doneWeek, m)}
  </div>

  <section class="kpis">
    ${kpi('Listo', (b.READY || []).length, '#/trabajo')}
    ${kpi('En curso', (b.IN_PROGRESS || []).length, '#/trabajo')}
    ${kpi('Bloqueado', (b.BLOCKED || []).length, '#/trabajo', (b.BLOCKED || []).length ? 'warn' : '')}
    ${kpi('Hecho', (b.DONE || []).length, '#/trabajo')}
    ${kpi('Riesgos abiertos', (m.risks || []).filter(r => r.estado === 'ABIERTO').length, '#/riesgos')}
    ${kpi('Decisiones', (m.entries.DEC || []).length, '#/conocimiento/dec')}
    ${kpi('Lecciones', (m.entries.LES || []).length, '#/conocimiento/les')}
    ${kpi('Funcionalidades', (m.entries.FEAT || []).length, '#/conocimiento/feat')}
  </section>

  ${renderEnvironments(m)}`;
}

function kpi(label, value, href, tone) {
  return `<a class="kpi ${tone ? 'kpi-' + tone : ''}" href="${href}"><span class="kpi-value">${value}</span><span class="kpi-label">${esc(label)}</span></a>`;
}

function renderPeriod(title, commits, memory, done, m) {
  const total = commits.length + memory.length + done.length;
  return `<section class="card">
    <h2>${esc(title)}</h2>
    <div class="period-stats">
      <span><strong>${commits.length}</strong> commits</span>
      <span><strong>${memory.length}</strong> registros de memoria</span>
      <span><strong>${done.length}</strong> ítems terminados</span>
    </div>
    ${total ? `<ul class="timeline compact">
      ${done.slice(0, 4).map(d => `<li><span class="tl-kind kind-BL">Hecho</span> ${t(d.id, m)} ${t(d.titulo, m)}</li>`).join('')}
      ${memory.slice(0, 5).map(x => `<li><span class="tl-kind kind-${x.kind}">${esc(KIND_LABEL[x.kind] || x.kind)}</span> ${t(x.id, m)} ${esc(x.titulo)}</li>`).join('')}
      ${commits.slice(0, 5).map(c => `<li><span class="tl-kind kind-commit">${esc(CONFIG.repos[c.repo].label)}</span> <a href="${commitUrl(c.repo, c.sha)}" target="_blank" rel="noopener" class="sha">${esc(c.short)}</a> ${t(c.title, m)}</li>`).join('')}
    </ul>` : empty('Sin actividad registrada en el período.')}
  </section>`;
}

function renderEnvironments(m) {
  const p = m.prod, c = m.compare;
  return `<section class="card">
    <h2>Entornos <small class="muted">medido en GitHub</small></h2>
    <div class="env-grid">
      <div class="env">
        <div class="env-head"><a href="${repoUrl('dev')}" target="_blank" rel="noopener">${esc(CONFIG.repos.dev.name)}</a>${badge('DEV', 'env-dev')}</div>
        <p>${m.commits.find(x => x.repo === 'dev') ? `Último commit ${esc(relTime(m.generatedAt - m.commits.find(x => x.repo === 'dev').date))}` : na('sin commits leídos')}</p>
        <p>${c ? (c.status === 'identical' ? 'Idéntico a producción' : `${c.ahead_by} commit(s) por delante de producción` + (c.behind_by ? `, ${c.behind_by} por detrás` : '')) : na('comparación no disponible')}</p>
      </div>
      <div class="env">
        <div class="env-head"><a href="${repoUrl('prod')}" target="_blank" rel="noopener">${esc(CONFIG.repos.prod.name)}</a>${badge('PROD', 'env-prod')}</div>
        <p>${p ? `Último cambio ${p.date ? esc(relTime(m.generatedAt - new Date(p.date))) : ''} · <span class="sha">${esc(p.sha.slice(0, 7))}</span>` : na('no verificable')}</p>
        <p>${p ? (p.protected ? `${levelDot('ok')} main protegida` : `${levelDot('critical')} <strong>main sin protección</strong>`) : ''}</p>
        <p class="muted small">Solo lectura. La promoción es decisión exclusiva de Pablo.</p>
      </div>
      <div class="env">
        <div class="env-head"><a href="${repoUrl('dashboard')}" target="_blank" rel="noopener">${esc(CONFIG.repos.dashboard.name)}</a>${badge('PANEL', 'env-dash')}</div>
        <p>${m.commits.find(x => x.repo === 'dashboard') ? `Último commit ${esc(relTime(m.generatedAt - m.commits.find(x => x.repo === 'dashboard').date))}` : na('sin commits leídos')}</p>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------ TRABAJO */

export function renderWork(m) {
  const b = m.backlog;
  const cols = [
    ['IN_PROGRESS', 'En curso'], ['BLOCKED', 'Bloqueado'], ['READY', 'Listo'], ['DONE', 'Hecho'],
  ];
  return `
  <header class="page-head"><h1>Trabajo</h1><p class="muted">Roadmap y backlog declarados en <code>ai-memory/</code>.</p></header>
  <section class="card">
    <h2>Roadmap</h2>
    ${m.roadmap && m.roadmap.length ? `<ol class="roadmap">${m.roadmap.map(p => `
      <li class="phase-card ${/CURSO/.test(p.estado) ? 'current' : /HECH|COMPLET|DONE/.test(p.estado) ? 'done' : ''}">
        <div class="phase-head"><strong>${esc(p.id)}</strong> ${esc(p.nombre)} ${badge(p.estado || 'SIN ESTADO', 'phase-state')}</div>
        <p>${t(p.objetivo, m)}</p>
        <p class="li-meta"><strong>Sale cuando:</strong> ${t(p.criterio, m)}</p>
      </li>`).join('')}</ol>` : na('roadmap.md no disponible')}
  </section>
  ${b ? `<section class="board">${cols.map(([k, label]) => `
    <div class="column col-${k}">
      <h2>${label} <span class="count">${b[k].length}</span></h2>
      ${b[k].length ? b[k].map(it => `
        <article class="ticket" id="${esc(it.id)}">
          <div class="ticket-head"><a class="idref" href="#/item/${esc(it.id)}">${esc(it.id)}</a>${prioBadge(it.prioridad)}</div>
          <p class="ticket-title">${t(it.titulo, m)}</p>
          ${it.detalle ? `<p class="ticket-detail">${t(it.detalle, m)}</p>` : ''}
        </article>`).join('') : empty('Vacío')}
    </div>`).join('')}</section>` : na('backlog.md no disponible')}`;
}

/* ------------------------------------------------------------ CONOCIMIENTO */

export function renderKnowledge(m, sub) {
  const tabs = CONFIG.collections.map(c => ({ key: c.prefix.toLowerCase(), ...c }));
  const active = tabs.find(x => x.key === sub) || tabs[0];
  const list = m.entries[active.prefix] || [];
  const resumen = new Map(Object.values(m.index || {}).flat().filter(x => x && x.id).map(x => [x.id, x.resumen]));
  const backlinks = buildBacklinks(m);
  return `
  <header class="page-head"><h1>Conocimiento</h1><p class="muted">Lo que la Factory decidió, aprendió y construyó.</p></header>
  <div class="tabs" role="tablist">${tabs.map(x => `<a role="tab" href="#/conocimiento/${x.key}" class="tab ${x === active ? 'active' : ''}" aria-selected="${x === active}">${esc(x.label)} <span class="count">${(m.entries[x.prefix] || []).length}</span></a>`).join('')}</div>
  ${list.length ? `<div class="entries">${list.slice().reverse().map(e => `
    <a class="entry card" href="#/item/${esc(e.id || '')}">
      <div class="entry-head"><span class="idref">${esc(e.id || '?')}</span>${e.estadoCodigo ? badge(e.estadoCodigo, 'st-' + e.estadoCodigo.toLowerCase()) : ''}<span class="muted small">${esc(e.fechaTexto || 'sin fecha')}</span></div>
      <h3>${esc(e.titulo)}</h3>
      ${resumen.get(e.id) ? `<p>${esc(resumen.get(e.id))}</p>` : ''}
      ${(backlinks.get(e.id) || []).length ? `<p class="li-meta">Citado por ${(backlinks.get(e.id) || []).length}</p>` : ''}
    </a>`).join('')}</div>` : empty(`No hay ${active.label.toLowerCase()} registradas.`)}`;
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
  const cited = backlinks.length ? `<p class="li-meta">Citado por: ${backlinks.map(x => t(x, m)).join(', ')}</p>` : '';
  const entry = Object.values(m.entries).flat().find(e => e.id === id);
  if (entry) {
    const resolver = (href) => {
      const base = entry.path.split('/').slice(0, -1);
      const parts = [...base, ...href.split('/')].reduce((acc, p) => (p === '..' ? acc.slice(0, -1) : p === '.' ? acc : [...acc, p]), []);
      const target = parts.join('/');
      const linked = Object.values(m.entries).flat().find(e => e.path === target);
      return linked ? '#/item/' + linked.id : blobUrl('dev', CONFIG.memoryRoot + '/' + target, m.ref);
    };
    return `
    <nav class="crumbs"><a href="#/conocimiento/${esc(id.split('-')[0].toLowerCase())}">← ${esc(KIND_LABEL[id.split('-')[0]] || '')}</a></nav>
    <article class="card doc">
      <div class="entry-head"><span class="idref">${esc(entry.id)}</span>${entry.estadoCodigo ? badge(entry.estado, 'st-' + entry.estadoCodigo.toLowerCase()) : ''}</div>
      <h1>${esc(entry.titulo)}</h1>
      <dl class="meta">${Object.entries(entry.meta).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${t(v, m)}</dd></div>`).join('')}</dl>
      ${cited}
      <div class="md">${linkIdsInHtml(mdToHtml(entry.body, resolver), m)}</div>
      <p class="li-meta"><a href="${blobUrl('dev', CONFIG.memoryRoot + '/' + entry.path, m.ref)}" target="_blank" rel="noopener">Ver en GitHub ↗</a></p>
    </article>`;
  }
  const bl = m.backlog ? Object.values(m.backlog).flat().find(x => x && x.id === id) : null;
  if (bl) {
    return `<nav class="crumbs"><a href="#/trabajo">← Trabajo</a></nav>
    <article class="card doc"><div class="entry-head"><span class="idref">${esc(bl.id)}</span>${prioBadge(bl.prioridad)}${badge(bl.seccion, 'phase-state')}</div>
      <h1>${t(bl.titulo, m)}</h1>${bl.detalle ? `<p>${t(bl.detalle, m)}</p>` : ''}${cited}</article>`;
  }
  const rk = (m.risks || []).find(r => r.id === id);
  if (rk) {
    return `<nav class="crumbs"><a href="#/riesgos">← Riesgos</a></nav>
    <article class="card doc"><div class="entry-head"><span class="idref">${esc(rk.id)}</span>${prioBadge(rk.severidad)}${badge(rk.estado, 'st-' + rk.estado.toLowerCase())}</div>
      <h1>${t(rk.riesgo, m)}</h1><dl class="meta"><div><dt>Mitigación</dt><dd>${t(rk.mitigacion || '—', m)}</dd></div>
      <div><dt>Responsable</dt><dd>${esc(rk.responsable || '—')}</dd></div></dl>${cited}</article>`;
  }
  return `<article class="card">${empty(`No existe ${id} en la memoria.`)}<p><a href="#/hoy">Volver</a></p></article>`;
}

/** Enlaza IDs en HTML ya generado, sin tocar atributos ni contenido de <a>/<code>. */
function linkIdsInHtml(html, m) {
  return html.split(/(<a\b[\s\S]*?<\/a>|<code>[\s\S]*?<\/code>|<[^>]+>)/g)
    .map(part => (part.startsWith('<') ? part : linkIds(part, m))).join('');
}

/* ------------------------------------------------------------ RIESGOS */

export function renderRisks(m) {
  const risks = m.risks;
  if (!risks) return `<header class="page-head"><h1>Riesgos</h1></header>${na('risks.md no disponible')}`;
  const open = risks.filter(r => r.estado === 'ABIERTO');
  const groups = [
    ['Críticos abiertos', open.filter(r => r.severidad === 'CRÍTICO'), 'critical'],
    ['Altos abiertos', open.filter(r => r.severidad === 'ALTO'), 'warn'],
    ['Otros abiertos', open.filter(r => !['CRÍTICO', 'ALTO'].includes(r.severidad)), 'info'],
    ['Mitigados / cerrados', risks.filter(r => r.estado !== 'ABIERTO'), 'ok'],
  ];
  return `
  <header class="page-head"><h1>Riesgos</h1><p class="muted">${open.length} abiertos · ${risks.length - open.length} mitigados o cerrados.</p></header>
  ${groups.map(([title, list, lvl]) => `<section class="card">
    <h2>${levelDot(lvl)} ${esc(title)} <span class="count">${list.length}</span></h2>
    ${list.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Severidad</th><th>Riesgo</th><th>Mitigación</th><th>Responsable</th></tr></thead><tbody>
      ${list.map(r => `<tr><td><a class="idref" href="#/item/${esc(r.id)}">${esc(r.id)}</a></td><td>${prioBadge(r.severidad)}</td><td>${t(r.riesgo, m)}</td><td>${t(r.mitigacion, m)}</td><td>${esc(r.responsable)}</td></tr>`).join('')}
    </tbody></table></div>` : empty('Ninguno.')}
  </section>`).join('')}`;
}

/* ------------------------------------------------------------ ACTIVIDAD */

export const RANGES = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };

export function renderActivity(m, range) {
  const r = RANGES[range] ? range : '7d';
  const from = m.generatedAt - RANGES[r] * 3600 * 1000;
  const events = [
    ...m.commits.filter(c => c.date.getTime() >= from).map(c => ({ date: c.date, kind: 'commit', html:
      `<span class="tl-kind kind-commit">${esc(CONFIG.repos[c.repo].label)}</span> <a class="sha" href="${commitUrl(c.repo, c.sha)}" target="_blank" rel="noopener">${esc(c.short)}</a> ${t(c.title, m)}`, time: true })),
    ...m.activity.memory.filter(x => x.date.getTime() >= from - 24 * 3600 * 1000).map(x => ({ date: x.date, kind: x.kind, html:
      `<span class="tl-kind kind-${x.kind}">${esc(KIND_LABEL[x.kind] || x.kind)}</span> ${t(x.id, m)} ${esc(x.titulo)} ${x.estado ? `<small class="muted">· ${esc(x.estado)}</small>` : ''}`, time: false })),
  ].sort((a, b) => b.date - a.date);

  const byDay = new Map();
  for (const e of events) {
    const key = e.time ? e.date.toLocaleDateString('es-AR') : e.date.toLocaleDateString('es-AR', { timeZone: 'UTC' });
    byDay.set(key, [...(byDay.get(key) || []), e]);
  }
  const devCount = m.commits.filter(c => c.repo === 'dev' && c.date.getTime() >= from).length;
  const dashCount = m.commits.filter(c => c.repo === 'dashboard' && c.date.getTime() >= from).length;

  return `
  <header class="page-head"><h1>Actividad</h1>
    <div class="range" role="group" aria-label="Rango">${Object.keys(RANGES).map(k => `<a href="#/actividad/${k}" class="tab ${k === r ? 'active' : ''}">${k}</a>`).join('')}</div>
  </header>
  <p class="muted">${devCount} commits en DEV · ${dashCount} en el dashboard · ${events.length - devCount - dashCount} registros de memoria.</p>
  ${events.length ? [...byDay.entries()].map(([day, list]) => `<section class="card">
    <h2>${esc(day)}</h2>
    <ul class="timeline">${list.map(e => `<li>${e.time ? `<time>${esc(e.date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))}</time>` : '<time>—</time>'}<div>${e.html}</div></li>`).join('')}</ul>
  </section>`).join('') : empty('Sin actividad en el rango.')}`;
}

/* ------------------------------------------------------------ SALUD */

export function renderHealth(m) {
  const h = m.health;
  const api = m.api || {};
  const filesRead = m.allIds.size;
  const groups = ['critical', 'warn', 'info'];
  return `
  <header class="page-head"><h1>Salud</h1>
    <p>${levelDot(h.level)} <strong>${h.level === 'ok' ? 'Sin problemas detectados' : h.level === 'critical' ? 'Hay problemas críticos' : 'Hay puntos que requieren atención'}</strong>
    <span class="muted">· ${h.counts.critical || 0} críticos · ${h.counts.warn || 0} de atención · ${h.counts.info || 0} informativos</span></p>
  </header>
  ${groups.map(g => {
    const list = h.checks.filter(c => c.level === g);
    if (!list.length) return '';
    return `<section class="card"><h2>${levelDot(g)} ${LEVEL_LABEL[g]} <span class="count">${list.length}</span></h2>
      <ul class="list">${list.map(c => `<li class="list-item">
        <div class="li-main"><strong>${t(c.title, m)}</strong> ${badge(c.source, 'src-' + c.source)}</div>
        ${c.detail ? `<p class="li-sub">${t(c.detail, m)}</p>` : ''}</li>`).join('')}</ul></section>`;
  }).join('')}
  ${h.checks.length === 0 ? `<section class="card">${empty('Todos los chequeos pasaron.')}</section>` : ''}
  <section class="card">
    <h2>Fuentes de datos</h2>
    <dl class="facts">
      <div><dt>Memoria</dt><dd>${m.ref ? `Snapshot <a class="sha" href="${commitUrl('dev', m.ref)}" target="_blank" rel="noopener">${esc(m.ref.slice(0, 7))}</a>` : 'Rama main (sin fijar)'}</dd></div>
      <div><dt>IDs registrados</dt><dd>${filesRead}</dd></div>
      <div><dt>API GitHub</dt><dd>${api.remaining != null ? `${api.remaining}/${api.limit} restantes · reinicia ${esc(relTime((api.reset || 0) - Date.now()))}` : 'sin consultas nuevas (caché)'}</dd></div>
      <div><dt>Chequeos</dt><dd>Se ejecutan en tu navegador en cada lectura. Sin scripts locales.</dd></div>
    </dl>
    <p class="muted small"><strong>Declarado</strong> = lo que la Factory escribió en ai-memory. <strong>Medido</strong> = lo que se observa en GitHub. Una diferencia entre ambos es una inconsistencia.</p>
  </section>`;
}

/* ------------------------------------------------------------ estados de carga */

export function renderLoading() {
  return `<section class="card skeleton" aria-busy="true"><p>Leyendo la memoria de la Factory…</p></section>`;
}

export function renderFatal(err) {
  return `<section class="card lvl-critical"><h2>No se pudo construir el panel</h2><p>${esc(err && err.message || err)}</p>
  <p class="muted">Ningún dato se muestra como 0: si algo falla, se dice.</p></section>`;
}

export { extractIds };
