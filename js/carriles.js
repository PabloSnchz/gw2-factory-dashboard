/**
 * js/carriles.js — «Sus dos carriles» en la tarjeta de Shiruna (orden v9, 2026-11-26).
 *
 * Desde la v9 Shiruna reparte sus ciclos entre La Bóveda [B] y oportunidades nuevas [N], alternando, y los dos
 * carriles tienen que quedar parejos en 7 días (±1 ciclo). Cada commit empieza con su carril: «[B] BL-063 …»,
 * «[N] OP-001 FICHA — …». Acá se ve si lo cumple:
 * - loadCarriles: UNA llamada a la API por lectura (sus últimos 100 commits de los 7 días), cacheada en su
 *   propio casillero. Nunca lanza. Si trae 100, la ventana real empieza en el más viejo y se dice.
 * - carrilDe: «[B]» o «[N]» al principio del mensaje; lo demás (órdenes, notas) no tiene carril.
 * - buildCarriles: ciclos por carril (un ciclo = los commits de un mismo carril en la misma media hora del cron),
 *   diferencia, a cuál le toca el próximo y el último de cada uno.
 * - renderCarriles / vestirCarriles: el bloque al final de su tarjeta, después de «Hoy hizo». Su texto se escapa.
 */
import { CONFIG } from './config.js';
import { esc } from './parse.js';

export const CARRILES_VERSION = '1.0.0';
const MIN = 60000;
const DIA = 24 * 60 * MIN;
export const VENTANA_MS = 7 * DIA;
export const CICLO_MS = 30 * MIN;
export const POR_PAGINA = 100;
export const TOLERANCIA = 1;
export const DESDE_V9 = Date.parse('2026-11-26T03:00:00Z'); // antes no había carriles: no se cuenta
export const NOMBRE = { B: 'La Bóveda', N: 'Nuevas' };

/** Solo lo que uso de cada commit (igual que en pulso.js). */
export function slimCarriles(list) {
  if (!Array.isArray(list)) return list;
  return list.map(x => {
    const c = (x && x.commit) || {};
    const fecha = (c.committer && c.committer.date) || (c.author && c.author.date) || null;
    return { sha: x && x.sha, msg: String(c.message || '').split('\n')[0], date: fecha };
  });
}

/** Desde cuándo se cuenta: 7 días atrás, pero nunca antes de la v9. */
export function inicioVentana(now) {
  return Math.max(now - VENTANA_MS, DESDE_V9);
}

/** Sus commits de los últimos 7 días (hasta 100). Array, o undefined si no se pudo leer. */
export async function loadCarriles({ gh, now = Date.now(), hija = CONFIG.hija } = {}) {
  if (!gh || !hija) return undefined;
  try {
    const since = new Date(inicioVentana(now)).toISOString();
    const r = await gh.api(`/repos/${hija.owner}/${hija.repo}/commits?sha=${hija.branch}&per_page=${POR_PAGINA}&since=${since}`,
      { label: `carriles de ${hija.nombre}`, allow404: true, slot: 'commits:hija7', shape: slimCarriles });
    return r === null ? [] : r;
  } catch {
    return undefined;
  }
}

/** «[B] BL-063 …» → 'B'; «[n] …» → 'N'; sin carril → null. */
export function carrilDe(msg) {
  const m = /^\s*\[(B|N)\]/i.exec(String(msg || ''));
  return m ? m[1].toUpperCase() : null;
}

/**
 * @param commits sus commits (loadCarriles) o undefined.
 * @returns { leidos: false } sin lectura; si no, { leidos, desde, recortada, B, N, sinCarril, dif, parejo, cargado, toca, ultimo }.
 */
export function buildCarriles({ commits, now }) {
  if (!Array.isArray(commits)) return { leidos: false };
  const inicio = inicioVentana(now);
  const items = commits
    .filter(c => c && c.date)
    .map(c => ({ sha: String(c.sha || ''), t: Date.parse(c.date), msg: String(c.msg || ''), carril: carrilDe(c.msg) }))
    .filter(c => Number.isFinite(c.t) && c.t >= inicio)
    .sort((a, b) => b.t - a.t);
  const recortada = commits.length >= POR_PAGINA;
  const desde = recortada && items.length ? items[items.length - 1].t : inicio;
  const ciclos = { B: new Set(), N: new Set() };
  const ultimo = { B: null, N: null };
  let sinCarril = 0;
  for (const c of items) {
    if (!c.carril) { sinCarril++; continue; }
    ciclos[c.carril].add(Math.floor(c.t / CICLO_MS));
    if (!ultimo[c.carril]) ultimo[c.carril] = c;
  }
  const B = ciclos.B.size, N = ciclos.N.size;
  const dif = B - N;
  const parejo = Math.abs(dif) <= TOLERANCIA;
  const masNuevo = [ultimo.B, ultimo.N].filter(Boolean).sort((a, b) => b.t - a.t)[0] || null;
  // Le toca: si se desparejó, el que va atrás; si no, el contrario del último (alternancia). Sin nada todavía: [N].
  const toca = !parejo ? (dif > 0 ? 'N' : 'B') : masNuevo ? (masNuevo.carril === 'B' ? 'N' : 'B') : 'N';
  return { leidos: true, desde, recortada, B, N, sinCarril, dif, parejo, cargado: parejo ? null : (dif > 0 ? 'B' : 'N'), toca, ultimo };
}

const fecha = (t) => new Date(t).toLocaleString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).replace(',', '');

function cifra(n, label) {
  return `<p class="uv-cifra${n ? '' : ' uv-cifra--cero'}"><b>${n}</b><span>${esc(label)}</span></p>`;
}

function ultimoHtml(c, carril, url) {
  if (!c) return `<li class="gds-list__item"><p class="gds-body-2 gds-text-secondary"><strong>${esc(NOMBRE[carril])}</strong> · todavía ningún ciclo.</p></li>`;
  const texto = c.msg.replace(/^\s*\[(B|N)\]\s*/i, '');
  const link = c.sha ? ` <a class="gds-ref" href="${esc(url)}/commit/${esc(c.sha)}" target="_blank" rel="noopener">${esc(c.sha.slice(0, 7))}</a>` : '';
  return `<li class="gds-list__item"><p class="gds-body-2"><strong>${esc(NOMBRE[carril])}</strong> · ${esc(fecha(c.t))} · ${esc(texto)}${link}</p></li>`;
}

/** El bloque «Sus dos carriles». `repoUrl`: https://github.com/<owner>/<repo>. */
export function renderCarriles(k, repoUrl) {
  if (!k) return '';
  const head = '<h3 class="gds-title-2">Sus dos carriles</h3>';
  if (!k.leidos) {
    return `<div class="uv-hija-carriles" data-parejo="sin-dato">${head}<p class="gds-body-2 gds-text-secondary">No pude leer sus commits de la semana (la API de GitHub no respondió). Vuelvo a intentar en la próxima lectura.</p></div>`;
  }
  const estado = k.B + k.N === 0
    ? '<span class="gds-status gds-status--info">Todavía sin ciclos con carril</span>'
    : k.parejo
      ? '<span class="gds-status gds-status--success">Parejos</span>'
      : `<span class="gds-status gds-status--warning">Se cargó para ${esc(NOMBRE[k.cargado])}: ${Math.abs(k.dif)} ciclos de diferencia</span>`;
  const ventana = k.recortada
    ? `En sus últimos ${POR_PAGINA} commits, desde el ${esc(fecha(k.desde))}.`
    : `Desde el ${esc(fecha(k.desde))}. Un ciclo es su media hora del cron.`;
  return `<div class="uv-hija-carriles" data-parejo="${k.parejo ? 'si' : 'no'}">
    ${head}
    <p class="gds-body-2">${estado} <span class="gds-text-secondary">Le toca: ${esc(NOMBRE[k.toca])}. La regla: alternar y quedar parejos en 7 días (±${TOLERANCIA}).</span></p>
    <div class="uv-cifras" role="group" aria-label="Los carriles de Shiruna, en números">${[
      cifra(k.B, k.B === 1 ? 'ciclo en La Bóveda' : 'ciclos en La Bóveda'),
      cifra(k.N, k.N === 1 ? 'ciclo en Nuevas' : 'ciclos en Nuevas'),
      cifra(k.sinCarril, k.sinCarril === 1 ? 'commit sin carril' : 'commits sin carril'),
    ].join('')}</div>
    <ul class="gds-list">${ultimoHtml(k.ultimo.B, 'B', repoUrl)}${ultimoHtml(k.ultimo.N, 'N', repoUrl)}</ul>
    <p class="gds-caption gds-text-muted">${ventana}</p>
  </div>`;
}

/** Después de cada dibujo: al final de su tarjeta (después de «Hoy hizo»). Una sola vez; nunca rompe. */
export function vestirCarriles(root, k, repoUrl) {
  try {
    if (!root || typeof root.querySelector !== 'function' || !k) return;
    const card = root.querySelector('section.uv-hija');
    if (!card || card.querySelector('.uv-hija-carriles')) return;
    const destino = card.querySelector('.gds-stack') || card;
    destino.insertAdjacentHTML('beforeend', renderCarriles(k, repoUrl));
  } catch { /* nunca rompe el panel */ }
}
