/**
 * js/app.js — Punto de entrada: carga, router por hash y refresco.
 *
 * Accesibilidad (GDS):
 * - Al cambiar de vista, el foco pasa al contenido principal (el lector de pantalla anuncia la vista nueva).
 * - El resultado de cada lectura se anuncia en una región aria-live.
 * - Después de Refrescar, el foco vuelve al botón (el encabezado se vuelve a dibujar).
 */

import { CONFIG } from './config.js';
import { createGitHub } from './github.js';
import { loadAll } from './loader.js';
import { buildModel } from './model.js';
import * as V from './views.js';

const gh = createGitHub({
  owner: CONFIG.owner,
  storage: safeStorage(),
  ttlMs: CONFIG.apiCacheTtlMs,
  prefix: CONFIG.storagePrefix,
});

const state = { model: null, loading: false, error: null, refocusRefresh: false };
const $header = document.getElementById('app-header');
const $main = document.getElementById('app-main');
const $live = document.getElementById('app-live');

function parseRoute() {
  const parts = (location.hash || '#/hoy').replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'hoy', arg: parts[1] || null };
}

function render() {
  const r = parseRoute();
  const navRoute = r.name === 'item' ? guessSection(r.arg) : r.name;
  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);
  const $refresh = document.getElementById('btn-refresh');
  $refresh.addEventListener('click', () => { state.refocusRefresh = true; refresh(true); });
  if (state.refocusRefresh && !state.loading) { state.refocusRefresh = false; $refresh.focus(); }

  if (!state.model) {
    $main.innerHTML = state.error ? V.renderFatal(state.error) : V.renderLoading();
    return;
  }
  const m = state.model;
  let html;
  switch (r.name) {
    case 'trabajo': html = V.renderWork(m); break;
    case 'conocimiento': html = V.renderKnowledge(m, r.arg); break;
    case 'riesgos': html = V.renderRisks(m); break;
    case 'actividad': html = V.renderActivity(m, r.arg); break;
    case 'salud': html = V.renderHealth(m); break;
    case 'item': html = V.renderItem(m, decodeURIComponent(r.arg || '')); break;
    default: html = V.renderHome(m);
  }
  $main.innerHTML = html;
  const pending = m.human.length;
  document.title = `${pending ? `(${pending}) ` : ''}${V.verdict(m).text} · Gato Negro Factory`;
}

function guessSection(id) {
  const p = String(id || '').split('-')[0];
  return p === 'BL' ? 'trabajo' : p === 'RSK' ? 'riesgos' : p === 'REQ' || p === 'RESP' ? 'hoy' : 'conocimiento';
}

async function refresh(force) {
  if (state.loading) return;
  if (force) clearApiCache();
  state.loading = true;
  announce('Leyendo la memoria de la Factory…');
  render();
  try {
    const raw = await loadAll(gh, Date.now());
    state.model = buildModel(raw);
    state.error = null;
    announce(`Datos actualizados. ${V.verdict(state.model).text}.`);
  } catch (e) {
    console.error(e);
    state.error = e;
    announce('No se pudo leer la memoria de la Factory.');
  } finally {
    state.loading = false;
    render();
  }
}

function announce(text) { if ($live) $live.textContent = text; }

function clearApiCache() {
  const s = safeStorage();
  try {
    Object.keys(localStorage).filter(k => k.startsWith(CONFIG.storagePrefix + 'api:')).forEach(k => s.removeItem(k));
  } catch { /* storage no disponible */ }
}

function safeStorage() {
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return localStorage; }
  catch { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; }
}

window.addEventListener('hashchange', () => {
  render();
  window.scrollTo(0, 0);
  $main.focus({ preventScroll: true });
});
// Si Pablo abrió un botón de respuesta (issue prellenado), al volver a la pestaña se relee sin caché:
// así ve enseguida "Registrando tu respuesta" o "Ya respondiste" (DEC-012).
$main.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href*="/issues/new?"]');
  if (a) state.respondedAt = Date.now();
});
// Al volver a la pestaña, relee si respondió hace poco o si los datos tienen más que el TTL de caché.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !state.model) return;
  if (state.respondedAt && Date.now() - state.respondedAt < 30 * 60 * 1000) { state.respondedAt = null; refresh(true); return; }
  if (Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);
});

refresh(false);
