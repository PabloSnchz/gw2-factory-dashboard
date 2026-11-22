/**
 * js/pulso.js — «Hoy hizo»: el seguimiento del trabajo de Shiruna en su tarjeta (SH-4a).
 *
 * Shiruna trabaja en ciclo continuo (un paso cada 30 min, DEC-007 de Shiruna). Su status.md es una foto;
 * lo que hizo durante el día está en sus commits, con el formato que le pedí:
 *   «BL-NNN paso X/Y — qué — tests N/N».
 * - loadCommitsHija: UNA llamada a la API por carga (sus commits desde la medianoche de Buenos Aires),
 *   cacheada como las mías (github.js: casillero fijo, solo los campos que uso). Nunca lanza.
 * - leerCommit: entiende el formato; si un commit no lo trae, se muestra tal cual (sin inventar datos).
 * - buildPulso: los pasos de hoy, las tareas que cerró, sus tests y si está viva:
 *     activa (< 45 min) · hace un rato (< 2 h) · sin actividad con trabajo en cola (¿PC apagada?)
 *     · descansando (sin trabajo en cola: no es una alarma).
 * - renderPulso / vestirPulso: el bloque «Hoy hizo» dentro de su tarjeta, después de cada dibujo
 *   (js/views.js y js/hija.js siguen siendo puras). Su texto se escapa siempre.
 */
import { CONFIG } from './config.js';
import { parseBacklog, esc } from './parse.js';

export const PULSO_VERSION = '1.0.0';
const MIN = 60000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;
const ART = 3 * HORA; // Buenos Aires: UTC-3, sin horario de verano
export const UMBRAL = { activaMs: 45 * MIN, alertaMs: 2 * HORA };

/** Medianoche de Buenos Aires (en ms UTC) del día de `now`. */
export function inicioDia(now) {
  return Math.floor((now - ART) / DIA) * DIA + ART;
}

/** Solo lo que uso de cada commit. */
export function slimHija(list) {
  if (!Array.isArray(list)) return list;
  return list.map(x => {
    const c = (x && x.commit) || {};
    const fecha = (c.committer && c.committer.date) || (c.author && c.author.date) || null;
    return { sha: x && x.sha, msg: String(c.message || '').split('\n')[0], date: fecha };
  });
}

/** Sus commits de hoy. Array (puede estar vacío), o undefined si no se pudo leer. */
export async function loadCommitsHija({ gh, now = Date.now(), hija = CONFIG.hija } = {}) {
  if (!gh || !hija) return undefined;
  try {
    const since = new Date(inicioDia(now)).toISOString();
    const r = await gh.api(`/repos/${hija.owner}/${hija.repo}/commits?sha=${hija.branch}&per_page=50&since=${since}`,
      { label: `commits de ${hija.nombre}`, allow404: true, slot: 'commits:hija', shape: slimHija });
    return r === null ? [] : r;
  } catch {
    return undefined;
  }
}

/** «BL-005 paso 1/2 — qué — tests 16/16» → { bl, paso, de, que, pass, total }. Lo que falte queda null. */
export function leerCommit(msg) {
  const s = String(msg || '').trim();
  const bl = /\b(BL-\d{3})\b/.exec(s);
  const paso = /\bpaso\s+(\d+)\s*\/\s*(\d+)/i.exec(s);
  const tests = /\btests?\s*:?\s*(\d+)\s*\/\s*(\d+)/i.exec(s);
  const partes = s.split(/\s+[—–-]\s+/);
  const que = paso && partes.length >= 2 ? partes[1].trim() : null;
  return {
    texto: s,
    bl: bl ? bl[1] : null,
    paso: paso ? Number(paso[1]) : null,
    de: paso ? Number(paso[2]) : null,
    que: que && !/^tests?\s*:?\s*\d+\s*\//i.test(que) ? que : null,
    pass: tests ? Number(tests[1]) : null,
    total: tests ? Number(tests[2]) : null,
  };
}

/** Estado de vida: cuánto hace que hizo algo y si tiene trabajo esperando. */
export function vida(ms, enCola) {
  if (ms == null) return { level: 'info', text: 'Sin dato de actividad' };
  if (ms < UMBRAL.activaMs) return { level: 'ok', text: 'Activa' };
  if (ms < UMBRAL.alertaMs) return { level: 'warn', text: 'Hace un rato que no avanza' };
  if (enCola > 0) return { level: 'critical', text: 'Sin actividad con trabajo en cola: ¿la PC está apagada o suspendida?' };
  return { level: 'info', text: 'Descansando: no tiene trabajo en cola' };
}

/**
 * @param commits  sus commits de hoy (loadCommitsHija) o undefined.
 * @param raw      lo que leyó loadHija ({ files }), para su backlog.
 * @param h        su modelo (buildHija), para la última actualización de status.md.
 */
export function buildPulso({ commits, raw, h, now }) {
  if (!h || !h.leida) return null;
  const backlog = parseBacklog(raw && raw.files ? raw.files['backlog.md'] : null);
  const enCola = backlog ? (backlog.READY || []).length + (backlog.IN_PROGRESS || []).length : 0;
  const leidos = Array.isArray(commits);
  const items = (leidos ? commits : [])
    .filter(c => c && c.date)
    .map(c => ({ sha: String(c.sha || ''), t: Date.parse(c.date), ...leerCommit(c.msg) }))
    .filter(c => Number.isFinite(c.t))
    .sort((a, b) => b.t - a.t);
  const pasos = items.filter(c => c.paso != null).length;
  const cerradas = [...new Set(items.filter(c => c.paso != null && c.paso === c.de && c.bl).map(c => c.bl))];
  const conTests = items.find(c => c.total != null);
  const ultimoCommit = items.length ? now - items[0].t : null;
  const candidatos = [ultimoCommit, h.actualizadoMs].filter(x => x != null && x >= 0);
  const ms = candidatos.length ? Math.min(...candidatos) : null;
  return {
    leidos,
    items,
    pasos,
    cerradas,
    tests: conTests ? { pass: conTests.pass, total: conTests.total, verde: conTests.pass === conTests.total } : null,
    enCola,
    ultimaMs: ms,
    vida: vida(ms, enCola),
  };
}

const VARIANTE = { ok: 'success', info: 'info', warn: 'warning', critical: 'danger' };
const hora = (t) => new Date(t).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });

function hace(ms) {
  if (ms == null) return 'sin dato';
  const min = Math.round(ms / MIN);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const hs = Math.round(min / 60);
  return hs < 48 ? `hace ${hs} h` : `hace ${Math.round(hs / 24)} días`;
}

function cifra(n, label) {
  return `<p class="uv-cifra${n ? '' : ' uv-cifra--cero'}"><b>${n}</b><span>${esc(label)}</span></p>`;
}

function linea(c, url) {
  const titulo = c.paso != null
    ? `<strong>${esc(c.bl || 'Paso')}</strong> · paso ${c.paso}/${c.de}${c.que ? ' · ' + esc(c.que) : ''}`
    : esc(c.texto);
  const tests = c.total != null
    ? ` <span class="gds-status gds-status--${c.pass === c.total ? 'success' : 'danger'}">tests ${c.pass}/${c.total}</span>` : '';
  const link = c.sha ? ` <a class="gds-ref" href="${esc(url)}/commit/${esc(c.sha)}" target="_blank" rel="noopener">${esc(c.sha.slice(0, 7))}</a>` : '';
  return `<li class="gds-timeline__item"><span class="gds-timeline__time">${esc(hora(c.t))}</span><span>${titulo}${tests}${link}</span></li>`;
}

/** El bloque «Hoy hizo». `repoUrl`: https://github.com/<owner>/<repo>. */
export function renderPulso(p, repoUrl, max = 12) {
  if (!p) return '';
  const v = p.vida;
  const cifras = [
    cifra(p.pasos, p.pasos === 1 ? 'paso hoy' : 'pasos hoy'),
    cifra(p.cerradas.length, p.cerradas.length === 1 ? 'tarea cerrada' : 'tareas cerradas'),
    p.tests ? cifra(p.tests.pass, `tests (${p.tests.pass}/${p.tests.total})`) : cifra(0, 'tests sin dato'),
  ].join('');
  let cuerpo;
  if (!p.leidos) cuerpo = '<p class="gds-body-2 gds-text-secondary">No pude leer sus commits de hoy (la API de GitHub no respondió). Vuelvo a intentar en la próxima lectura.</p>';
  else if (!p.items.length) cuerpo = '<p class="gds-body-2 gds-text-secondary">Todavía no hizo nada hoy.</p>';
  else {
    const resto = p.items.length - max;
    cuerpo = `<ul class="gds-timeline uv-linea">${p.items.slice(0, max).map(c => linea(c, repoUrl)).join('')}</ul>`
      + (resto > 0 ? `<p class="gds-caption gds-text-muted"><a href="${esc(repoUrl)}/commits/main" target="_blank" rel="noopener">y ${resto} más en GitHub</a></p>` : '');
  }
  return `<div class="uv-hija-hoy" data-vida="${esc(v.level)}">
    <h3 class="gds-title-2">Hoy hizo</h3>
    <p class="gds-body-2"><span class="gds-status gds-status--${VARIANTE[v.level] || 'info'}">${esc(v.text)}</span> <span class="gds-text-secondary">Último movimiento: ${esc(hace(p.ultimaMs))}${p.enCola ? ` · ${p.enCola} en cola` : ''}.</span></p>
    <div class="uv-cifras" role="group" aria-label="Lo de Shiruna hoy, en números">${cifras}</div>
    ${cuerpo}
  </div>`;
}

/** Después de cada dibujo: pone «Hoy hizo» al final del contenido de su tarjeta. Una sola vez; sin DOM, nada. */
export function vestirPulso(root, p, repoUrl) {
  try {
    if (!root || typeof root.querySelector !== 'function' || !p) return;
    const card = root.querySelector('section.uv-hija');
    if (!card || card.querySelector('.uv-hija-hoy')) return;
    const destino = card.querySelector('.gds-stack') || card;
    destino.insertAdjacentHTML('beforeend', renderPulso(p, repoUrl));
  } catch { /* nunca rompe el panel */ }
}
