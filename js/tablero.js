/**
 * js/tablero.js — El tablero de Shiruna en «Trabajo» (SH-4b).
 *
 * Su backlog.md ya se lee con su memoria (js/hija.js, por raw, sin cuota de API). Acá se arma su tablero:
 * - En curso · Bloqueado · En la fila (en su orden: la primera es la que toma en el próximo ciclo) · Hecho.
 * - Si hoy commiteó pasos de una tarea («BL-NNN paso X/Y», js/pulso.js), la tarea muestra por qué paso va.
 * - Sus IDs son suyos (su BL-005 no es el mío): nunca se enlazan a mi memoria; el tablero enlaza a su backlog.
 * - Las líneas de su backlog que no respetan el formato se cuentan (no se esconden ni se inventan).
 * - vestirTablero: después de cada dibujo, solo en «Trabajo», debajo de mi tablero. views.js sigue pura.
 * - 1.1.0: como el mío, cada columna muestra 5 tarjetas y el resto queda en «Ver N más» (js/plegar.js):
 *   nada se pierde y el tablero no se estira.
 */
import { CONFIG } from './config.js';
import { parseBacklog, esc } from './parse.js';
import { recientesPrimero, plegarColumna } from './plegar.js';

export const TABLERO_VERSION = '1.1.0';
const COLUMNAS = [
  ['IN_PROGRESS', 'En curso'], ['BLOCKED', 'Bloqueado'], ['READY', 'En la fila'], ['DONE', 'Hecho'],
];

/** «… — Riesgo: bajo — 2026-11-22» → sin la fecha final (ya se ve en el detalle de GitHub). */
export function sinFecha(s) {
  return String(s || '').replace(/\s*—?\s*\d{4}-\d{2}-\d{2}\s*$/, '').trim();
}

/** Último paso commiteado hoy de cada tarea: { 'BL-005': { paso, de, que, t } }. */
export function progresos(pulso) {
  const out = {};
  for (const c of (pulso && pulso.items) || []) {
    if (!c.bl || c.paso == null || out[c.bl]) continue; // items viene del más nuevo al más viejo
    out[c.bl] = { paso: c.paso, de: c.de, que: c.que, t: c.t };
  }
  return out;
}

/**
 * @param raw   lo que leyó loadHija ({ files }).
 * @param h     su modelo (buildHija): sin leer, no hay tablero.
 * @param pulso su día (buildPulso), para el progreso; puede faltar.
 * @returns null si no hay hija leída; { leido:false } si su backlog no se pudo leer; si no, el tablero.
 */
export function buildTablero({ raw, h, pulso, hija = CONFIG.hija } = {}) {
  if (!h || !h.leida || !hija) return null;
  const url = `https://github.com/${hija.owner}/${hija.repo}/blob/${hija.branch}/${CONFIG.memoryRoot}/backlog.md`;
  const b = parseBacklog(raw && raw.files ? raw.files['backlog.md'] : null);
  if (!b) return { nombre: h.nombre, key: h.key, url, leido: false, error: (raw && raw.errors && raw.errors['backlog.md']) || 'sin dato' };
  const prog = progresos(pulso);
  const col = (k) => b[k].map(it => ({ id: it.id, prioridad: it.prioridad, titulo: it.titulo, fecha: it.fecha || null, detalle: sinFecha(it.detalle), progreso: k === 'DONE' ? null : prog[it.id] || null }));
  return {
    nombre: h.nombre,
    key: h.key,
    url,
    leido: true,
    IN_PROGRESS: col('IN_PROGRESS'),
    BLOCKED: col('BLOCKED'),
    READY: col('READY'),
    DONE: recientesPrimero(col('DONE'), { nuevasAlFinal: true }), // lo último que cerró, primero (ella agrega abajo)
    malformadas: b.malformed.length,
  };
}

const PRIO = { 'CRÍTICO': 'danger', ALTO: 'warning', MEDIO: 'info', BAJO: '' };

function ticket(it, k, i) {
  const chips = [
    it.prioridad ? `<span class="gds-status${PRIO[it.prioridad] ? ' gds-status--' + PRIO[it.prioridad] : ''}">${esc(it.prioridad)}</span>` : '',
    `<span class="gds-ref">${esc(it.id)}</span>`,
    k === 'READY' && i === 0 ? '<span class="gds-status gds-status--accent">La próxima</span>' : '',
  ].join('');
  const p = it.progreso;
  return `<li class="gds-list__item ticket"><div class="gds-stack--sm gds-stack">
    <p class="gds-cluster">${chips}</p>
    <p class="gds-label-1">${esc(it.titulo)}</p>
    ${p ? `<p class="gds-caption"><span class="gds-status gds-status--success">paso ${p.paso}/${p.de}</span>${p.que ? ' ' + esc(p.que) : ''}</p>` : ''}
    ${it.detalle && k !== 'DONE' ? `<p class="gds-caption gds-text-secondary">${esc(it.detalle)}</p>` : ''}
  </div></li>`;
}

/** La sección «04 · El tablero de Shiruna». */
export function renderTablero(t) {
  if (!t) return '';
  const head = `<p class="uv-ante uv-ante--t">04 · El tablero de ${esc(t.nombre)}</p>`;
  const link = `<a href="${esc(t.url)}" target="_blank" rel="noopener">Ver su backlog</a>`;
  if (!t.leido) {
    return `<section class="gds-card uv-tablero-hija" aria-labelledby="tablero-hija-title" data-duena="${esc(t.key)}">${head}
      <h2 id="tablero-hija-title" class="gds-title-1">No pude leer el backlog de ${esc(t.nombre)}</h2>
      <p class="gds-body-2 gds-text-secondary">backlog.md: ${esc(t.error)}. ${link}</p>
    </section>`;
  }
  const cols = COLUMNAS.map(([k, label]) => {
    const all = t[k];
    return `<section class="gds-card board__col board__col--${k.toLowerCase()}" aria-labelledby="hcol-${k}">
      <div class="gds-card__header"><h3 id="hcol-${k}" class="gds-title-2">${label} <span class="gds-caption gds-text-muted">(${all.length})</span></h3></div>
      ${all.length ? plegarColumna(all.map((it, i) => ticket(it, k, i)), { nombre: `${t.nombre} · ${label}` }) : '<p class="gds-body-2 gds-text-muted">Vacío</p>'}
    </section>`;
  }).join('');
  const aviso = t.malformadas
    ? `<p class="gds-caption gds-text-secondary">${t.malformadas === 1 ? '1 línea de su backlog no respeta' : t.malformadas + ' líneas de su backlog no respetan'} el formato y no se muestra${t.malformadas === 1 ? '' : 'n'}.</p>` : '';
  return `<section class="gds-card uv-tablero-hija" aria-labelledby="tablero-hija-title" data-duena="${esc(t.key)}">${head}
    <div class="gds-card__header">
      <h2 id="tablero-hija-title" class="gds-title-1">En qué está cada tarea de ${esc(t.nombre)}</h2>
      <span class="gds-caption gds-text-muted">Su repo lo manda ella: elige, prueba y cierra sin pedir permiso. ${link}</span>
    </div>
    <div class="board">${cols}</div>
    ${aviso}
  </section>`;
}

/** Después de cada dibujo: solo en «Trabajo» (donde está mi roadmap), al final. Una sola vez; nunca rompe. */
export function vestirTablero(root, t) {
  try {
    if (!root || typeof root.querySelector !== 'function' || !t) return;
    if (!root.querySelector('#roadmap-title') || root.querySelector('.uv-tablero-hija')) return;
    root.insertAdjacentHTML('beforeend', renderTablero(t));
  } catch { /* nunca rompe el panel */ }
}
