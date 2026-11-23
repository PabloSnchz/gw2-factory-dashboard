/**
 * js/hija.js — Shiruna en el Centro de mando (S-4, DEC-053 de Shiruvana · DEC-002 de Shiruna).
 *
 * Shiruna es la hija de Shiruvana: trabaja en su propia organización y tiene su propia memoria.
 * El Centro de mando es uno solo y la lee para que Pablo vea el trabajo de las dos.
 *
 * - Lee solo por raw.githubusercontent.com (sin cuota de API): status.md, backlog.md y roadmap.md
 *   de la rama, con un parámetro que cambia cada 5 min para no quedar pegado al CDN.
 * - Nunca lanza: si no puede leer, devuelve el motivo y la tarjeta lo dice.
 * - 1.1.0 (S-4b): lo que Shiruna le pide a Pablo entra en «02 · Te toca» y sus avisos en
 *   «Para tu información», con su nombre (unirHija). Sus IDs son suyos: nunca se enlazan a mi memoria.
 *   Un filtro «Las dos · Shiruvana · Shiruna» oculta lo de la otra (data-duena), sin guardar nada.
 * - 1.2.0: botón «Su Bóveda» en su tarjeta, para entrar con un clic a su DEV publicado en GitHub Pages
 *   (https://<owner>.github.io/<repo>/, o CONFIG.hija.boveda si algún día cambia). Pedido de Pablo, 2026-11-23.
 */

import { CONFIG } from './config.js';
import { parseStatus, parseBacklog, parseRoadmap, parseDate, esc } from './parse.js';

export const HIJA_VERSION = '1.2.0';
export const HIJA_FILES = ['status.md', 'backlog.md', 'roadmap.md'];
/** Dueña de todo lo que no trae otra: yo. */
export const DUENA_MIA = 'shiruvana';
const ORDEN = ['decision', 'accion', 'validacion'];

/** URL raw de un archivo de su memoria. */
export function hijaUrl(path, now, hija = CONFIG.hija) {
  const file = `${CONFIG.memoryRoot}/${path}`.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${hija.owner}/${hija.repo}/${hija.branch}/${file}?v=${Math.floor(now / 300000)}`;
}

/** Su Bóveda (el DEV de la hija en GitHub Pages). null si no hay hija configurada. */
export function hijaBoveda(hija = CONFIG.hija) {
  if (!hija) return null;
  return hija.boveda || `https://${String(hija.owner).toLowerCase()}.github.io/${hija.repo}/`;
}

/** Lee su memoria. @returns { files: {path: text|null}, errors: {path: motivo} } o null si no hay hija configurada. */
export async function loadHija({ fetchImpl, now = Date.now(), hija = CONFIG.hija } = {}) {
  if (!hija) return null;
  const doFetch = fetchImpl || ((...a) => fetch(...a));
  const files = {};
  const errors = {};
  await Promise.all(HIJA_FILES.map(async (p) => {
    try {
      const res = await doFetch(hijaUrl(p, now, hija));
      if (!res.ok) { files[p] = null; errors[p] = res.status === 404 ? 'no existe' : 'HTTP ' + res.status; return; }
      files[p] = await res.text();
    } catch {
      files[p] = null;
      errors[p] = 'error de red';
    }
  }));
  return { files, errors };
}

const CLASE = /^(decisi[oó]n|acci[oó]n|validaci[oó]n|info(?:rmaci[oó]n)?)\s*:\s*/i;
const ID = /^\[?([A-Z]+-\d{3})\]?\s*[:—-]?\s*/;

/** "[BL-001] Validación: mirar X" → { id, clase, texto }. Sin clase cuenta como acción. */
export function lineaHija(txt) {
  let rest = String(txt || '');
  const idm = rest.match(ID);
  const id = idm ? idm[1] : null;
  if (idm) rest = rest.slice(idm[0].length);
  const m = rest.match(CLASE);
  if (!m) return { id, clase: 'accion', texto: rest.trim() };
  const k = m[1].toLowerCase()[0];
  return { id, clase: k === 'd' ? 'decision' : k === 'a' ? 'accion' : k === 'v' ? 'validacion' : 'info', texto: rest.slice(m[0].length).trim() };
}

/** Estado declarado → nivel y texto (el mismo criterio que uso para mí). */
export function estadoHija(code) {
  const c = String(code || '').toUpperCase();
  if (!c) return { level: 'warn', text: 'Sin dato' };
  if (/BLOQUEAD/.test(c)) return { level: 'warn', text: 'Bloqueada' };
  if (/CURSO|EJECUC|ACTIVO/.test(c)) return { level: 'ok', text: 'Trabajando' };
  if (/ESPERA/.test(c)) return { level: 'info', text: 'Esperándote' };
  return { level: 'info', text: 'En pausa' };
}

/** Modelo chico de Shiruna para el panel. null si no hay hija configurada. */
export function buildHija(raw, now, hija = CONFIG.hija) {
  if (!raw || !hija) return null;
  const f = raw.files || {};
  const status = parseStatus(f['status.md']);
  const backlog = parseBacklog(f['backlog.md']);
  const roadmap = parseRoadmap(f['roadmap.md']);
  const base = {
    nombre: hija.nombre,
    key: String(hija.nombre).toLowerCase(),
    url: `https://github.com/${hija.owner}/${hija.repo}/tree/${hija.branch}/${CONFIG.memoryRoot}`,
    boveda: hijaBoveda(hija),
  };
  if (!status) {
    return { ...base, leida: false, error: (raw.errors && raw.errors['status.md']) || 'sin dato', pendientes: [], info: [] };
  }
  const lineas = (status.esperandoPablo || []).map(lineaHija);
  const actualizado = parseDate(status.actualizado);
  return {
    ...base,
    leida: true,
    error: null,
    estado: estadoHija(status.estado),
    tarea: status.tarea,
    motivo: status.motivo,
    proxima: status.proxima,
    etapa: status.etapa,
    actualizadoMs: actualizado ? now - actualizado.getTime() : null,
    fase: (roadmap || []).find(p => /CURSO/.test(p.estado)) || null,
    enCurso: (backlog && backlog.IN_PROGRESS) || [],
    pendientes: lineas.filter(l => l.clase !== 'info'),
    info: [...lineas.filter(l => l.clase === 'info'), ...(status.paraInfo || []).map(lineaHija).map(l => ({ ...l, clase: 'info' }))],
  };
}

/**
 * Suma a Shiruna al modelo: m.hija, sus pendientes en m.human (después de los míos de la misma clase)
 * y sus avisos en m.info. No toca la salud ni mis chequeos. Devuelve el mismo modelo.
 */
export function unirHija(m, h) {
  if (!m) return m;
  m.hija = h || null;
  if (!h || !h.leida) return m;
  const suyo = (l) => ({ id: null, suId: l.id, duena: h.nombre, duenaKey: h.key, url: h.url });
  const extra = h.pendientes.map(l => ({
    ...suyo(l), clase: l.clase, titulo: l.texto, tipo: 'hija', prioridad: null, fecha: null, esperaMs: null,
    origenes: [`${h.nombre} · status.md`], relacionados: [], pregunta: null,
  }));
  const human = [...(m.human || []), ...extra]
    .map((x, i) => [x, i])
    .sort((a, b) => (ORDEN.indexOf(a[0].clase) - ORDEN.indexOf(b[0].clase)) || a[1] - b[1])
    .map(([x]) => x);
  human.skipped = (m.human && m.human.skipped) || [];
  m.human = human;
  m.info = [...(m.info || []), ...h.info.map(l => ({ ...suyo(l), titulo: l.texto, origen: `${h.nombre} · status.md` }))];
  return m;
}

/** Botones «Las dos · Shiruvana · Shiruna». Arranca en «Las dos». */
export function renderFiltro(h) {
  if (!h) return '';
  const op = [['todas', 'Las dos'], [DUENA_MIA, 'Shiruvana'], [h.key, h.nombre]];
  return `<div class="gds-cluster uv-filtro" role="group" aria-label="Mostrar lo de">
    <span class="gds-label-2 gds-text-muted">Mostrar:</span>
    ${op.map(([k, l], i) => `<button type="button" class="gds-button gds-button--sm ${i === 0 ? 'gds-button--primary' : 'gds-button--secondary'}" data-ver="${esc(k)}" aria-pressed="${i === 0}">${esc(l)}</button>`).join('')}
  </div>`;
}

/** Muestra solo lo de `ver` ('todas', 'shiruvana' o la clave de la hija) y marca el botón elegido. */
export function aplicarFiltro(root, ver) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  const v = ver || 'todas';
  for (const el of root.querySelectorAll('[data-duena]')) {
    el.style.display = v === 'todas' || el.dataset.duena === v ? '' : 'none';
  }
  for (const b of root.querySelectorAll('[data-ver]')) {
    const on = b.dataset.ver === v;
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('gds-button--primary', on);
    b.classList.toggle('gds-button--secondary', !on);
  }
}

const LEVEL_VARIANT = { ok: 'success', info: 'info', warn: 'warning' };

function hace(ms) {
  if (ms == null) return 'sin dato';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

function chip(text, variant) {
  return `<span class="gds-status${variant ? ' gds-status--' + variant : ''}">${esc(text)}</span>`;
}

/** Botón «Su Bóveda»: abre su DEV en otra pestaña. */
function botonBoveda(h) {
  if (!h || !h.boveda) return '';
  return `<a class="gds-button gds-button--sm gds-button--primary" href="${esc(h.boveda)}" target="_blank" rel="noopener" data-boveda>Su Bóveda</a>`;
}

/** Tarjeta «Mi hija · Shiruna». Va debajo de «04 · Shiruvana ahora» en Hoy. Lo que pide está en «02 · Te toca». */
export function renderHija(h) {
  if (!h) return '';
  const head = `<p class="uv-ante uv-ante--t">Mi hija · ${esc(h.nombre)}</p>`;
  if (!h.leida) {
    return `<section class="gds-card uv-hija" aria-labelledby="hija-title" data-hija="error" data-duena="${esc(h.key)}">${head}
      <h2 id="hija-title" class="gds-title-1">No pude leer la memoria de ${esc(h.nombre)}</h2>
      <p class="gds-body-2 gds-text-secondary">status.md: ${esc(h.error)}. <a href="${esc(h.url)}" target="_blank" rel="noopener">Ver su memoria</a></p>
      <div class="gds-cluster">${botonBoveda(h)}</div>
    </section>`;
  }
  const n = h.pendientes.length;
  return `<section class="gds-card uv-hija" aria-labelledby="hija-title" data-hija="ok" data-duena="${esc(h.key)}">${head}
    <div class="gds-card__header">
      <h2 id="hija-title" class="gds-title-1">¿Qué está haciendo ${esc(h.nombre)}?</h2>
      <div class="gds-cluster">${chip(h.estado.text, LEVEL_VARIANT[h.estado.level])}${h.fase ? chip(`${h.fase.id} · ${h.fase.nombre}`, '') : ''}</div>
    </div>
    <div class="gds-stack">
      <p class="gds-headline-2">${h.tarea ? esc(h.tarea) : 'Sin tarea declarada'}</p>
      ${h.motivo ? `<p class="gds-body-1 gds-text-secondary gds-measure"><strong class="gds-label-1">Por qué:</strong> ${esc(h.motivo)}</p>` : ''}
      <dl class="facts">
        <div><dt>Etapa</dt><dd>${h.etapa ? esc(h.etapa) : 'sin dato'}</dd></div>
        <div><dt>Última actualización</dt><dd>${esc(hace(h.actualizadoMs))}</dd></div>
        <div class="facts__wide"><dt>Próxima acción</dt><dd>${h.proxima ? esc(h.proxima) : 'sin dato'}</dd></div>
      </dl>
      <p class="gds-body-2 gds-text-secondary">${n ? `Te pide ${n === 1 ? '1 cosa' : n + ' cosas'}: están en «02 · Te toca», con su nombre.` : 'No te pide nada.'}${h.info.length ? ` Sus avisos están en «Para tu información».` : ''}</p>
      <div class="gds-cluster">${botonBoveda(h)}<p class="gds-caption gds-text-muted"><a href="${esc(h.url)}" target="_blank" rel="noopener">Ver la memoria de ${esc(h.nombre)}</a></p></div>
    </div>
  </section>`;
}
