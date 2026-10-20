/**
 * js/app.js — Punto de entrada: carga, router por hash y refresco.
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

const state = { model: null, loading: false, error: null };
const $header = document.getElementById('app-header');
const $main = document.getElementById('app-main');

function parseRoute() {
  const parts = (location.hash || '#/hoy').replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: parts[0] || 'hoy', arg: parts[1] || null };
}

function render() {
  const r = parseRoute();
  const navRoute = r.name === 'item' ? guessSection(r.arg) : r.name;
  $header.innerHTML = V.renderHeader(state.model, navRoute, state.loading);
  document.getElementById('btn-refresh').addEventListener('click', () => refresh(true));

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
  document.title = `${state.model.statusInfo.label} · Gato Negro Factory`;
}

function guessSection(id) {
  const p = String(id || '').split('-')[0];
  return p === 'BL' ? 'trabajo' : p === 'RSK' ? 'riesgos' : 'conocimiento';
}

async function refresh(force) {
  if (state.loading) return;
  if (force) clearApiCache();
  state.loading = true;
  render();
  try {
    const raw = await loadAll(gh, Date.now());
    state.model = buildModel(raw);
    state.error = null;
  } catch (e) {
    console.error(e);
    state.error = e;
  } finally {
    state.loading = false;
    render();
  }
}

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

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
// Al volver a la pestaña, relee si los datos tienen más que el TTL de caché.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.model && Date.now() - state.model.generatedAt > CONFIG.apiCacheTtlMs) refresh(false);
});

refresh(false);
