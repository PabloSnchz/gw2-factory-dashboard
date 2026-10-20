/**
 * js/github.js — Acceso a GitHub sin backend ni tokens.
 *
 * - raw.githubusercontent.com: contenido de archivos. Sin cuota. Se lee por
 *   SHA siempre que se pueda: un SHA es inmutable, así que la memoria que se
 *   muestra es un snapshot consistente (todos los archivos del mismo commit) y
 *   el CDN no puede servir una versión vieja.
 * - api.github.com (anónima, 60 req/h por IP): commits, árbol, protección,
 *   comparación. Cacheada en localStorage; si la API falla o se agota la cuota
 *   se usa la última respuesta buena y se marca como "en caché".
 */

export function createGitHub({ owner, fetchImpl, storage, now, ttlMs, prefix }) {
  const doFetch = fetchImpl || ((...a) => fetch(...a));
  const clock = now || (() => Date.now());
  const store = storage || memoryStorage();
  const state = { remaining: null, limit: null, reset: null, errors: [], stale: [] };

  function cacheGet(key) {
    try { const v = store.getItem(prefix + key); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  function cacheSet(key, data) {
    try { store.setItem(prefix + key, JSON.stringify({ t: clock(), data })); } catch { /* cuota de storage: se ignora */ }
  }

  async function api(path, { label, allow404 = false } = {}) {
    const key = 'api:' + path;
    const cached = cacheGet(key);
    if (cached && clock() - cached.t < ttlMs) return cached.data;
    try {
      const res = await doFetch('https://api.github.com' + path, { headers: { Accept: 'application/vnd.github+json' } });
      readRate(res);
      if (res.status === 404 && allow404) { cacheSet(key, null); return null; }
      if (!res.ok) throw new Error(res.status === 403 || res.status === 429 ? 'cuota de API agotada' : 'HTTP ' + res.status);
      const data = await res.json();
      cacheSet(key, data);
      return data;
    } catch (e) {
      if (cached) {
        state.stale.push(`${label || path}: ${e.message}, dato de hace ${Math.round((clock() - cached.t) / 60000)} min`);
        return cached.data;
      }
      state.errors.push(`${label || path}: ${e.message}`);
      return undefined;
    }
  }

  function readRate(res) {
    const h = res.headers;
    if (!h || typeof h.get !== 'function') return;
    const r = h.get('x-ratelimit-remaining');
    if (r != null) {
      state.remaining = Number(r);
      state.limit = Number(h.get('x-ratelimit-limit'));
      state.reset = Number(h.get('x-ratelimit-reset')) * 1000;
    }
  }

  async function raw(repo, ref, path) {
    const isSha = /^[0-9a-f]{40}$/.test(ref);
    const bust = isSha ? '' : '?v=' + Math.floor(clock() / 300000);
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path.split('/').map(encodeURIComponent).join('/')}${bust}`;
    try {
      const res = await doFetch(url);
      if (!res.ok) return { ok: false, text: null, error: res.status === 404 ? 'no existe' : 'HTTP ' + res.status };
      return { ok: true, text: await res.text(), error: null };
    } catch (e) {
      return { ok: false, text: null, error: 'error de red' };
    }
  }

  return { api, raw, state, resetState() { state.errors = []; state.stale = []; } };
}

export function memoryStorage() {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
