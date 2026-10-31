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
 *
 * Caché acotada (1.1.0, 2026-10-31): pablosnchz.github.io es UN solo origen
 * para la Bóveda, DEV, este panel, la bio y La Guarida; comparten ~5 MB de
 * localStorage. Antes cada carga guardaba una clave nueva (la URL llevaba
 * since=<ahora> o el SHA del árbol) y nunca se borraba: el panel llegó a ocupar
 * los 5 MB y La Guarida dejó de poder guardar. Ahora:
 *   - cada llamada guarda en un casillero fijo (`slot`): se sobrescribe, no se acumula;
 *   - el dato es fresco solo si fue pedido con la misma ruta (`p`);
 *   - `shape` recorta la respuesta a lo que el panel usa antes de guardarla;
 *   - al iniciar se borran las claves viejas (api:/…) del formato anterior;
 *   - si el storage está lleno, se libera solo la caché de este panel y se reintenta.
 */

export const GITHUB_VERSION = '1.1.0';

export function createGitHub({ owner, fetchImpl, storage, now, ttlMs, prefix }) {
  const doFetch = fetchImpl || ((...a) => fetch(...a));
  const clock = now || (() => Date.now());
  const store = storage || memoryStorage();
  const pre = prefix || '';
  const state = { remaining: null, limit: null, reset: null, errors: [], stale: [] };

  pruneLegacy(store, pre);

  function cacheGet(key) {
    try { const v = store.getItem(pre + key); return v ? JSON.parse(v) : null; } catch { return null; }
  }
  function cacheSet(key, path, data) {
    const value = JSON.stringify({ t: clock(), p: path, data });
    try { store.setItem(pre + key, value); return; } catch { /* lleno: se libera la caché propia y se reintenta */ }
    clearApiCache(store, pre, pre + key);
    try { store.setItem(pre + key, value); } catch { /* sigue sin lugar: se trabaja sin caché */ }
  }

  /**
   * @param path  ruta de la API (con query).
   * @param opts.slot   casillero de caché fijo (por defecto, la ruta).
   * @param opts.shape  recorta la respuesta antes de guardarla y devolverla.
   */
  async function api(path, { label, allow404 = false, slot, shape } = {}) {
    const key = 'api:' + (slot || path);
    const cached = cacheGet(key);
    const samePath = cached && (cached.p === undefined || cached.p === path);
    if (cached && samePath && clock() - cached.t < ttlMs) return cached.data;
    try {
      const res = await doFetch('https://api.github.com' + path, { headers: { Accept: 'application/vnd.github+json' } });
      readRate(res);
      if (res.status === 404 && allow404) { cacheSet(key, path, null); return null; }
      if (!res.ok) throw new Error(res.status === 403 || res.status === 429 ? 'cuota de API agotada' : 'HTTP ' + res.status);
      const full = await res.json();
      const data = shape ? shape(full) : full;
      cacheSet(key, path, data);
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

/** Claves del storage (localStorage o memoryStorage). */
export function storageKeys(store) {
  try {
    if (store && typeof store.key === 'function' && typeof store.length === 'number') {
      const out = [];
      for (let i = 0; i < store.length; i++) out.push(store.key(i));
      return out.filter(k => k != null);
    }
    if (store && typeof store.keys === 'function') return [...store.keys()];
  } catch { /* storage no disponible */ }
  return [];
}

/** Borra las claves de caché del formato anterior (una por URL: api:/repos/…). */
export function pruneLegacy(store, prefix) {
  const old = storageKeys(store).filter(k => k.startsWith(prefix + 'api:/'));
  for (const k of old) { try { store.removeItem(k); } catch { /* nada */ } }
  return old.length;
}

/** Borra la caché de API de este panel (nunca claves de otras apps del origen). */
export function clearApiCache(store, prefix, except) {
  const mine = storageKeys(store).filter(k => k.startsWith(prefix + 'api:') && k !== except);
  for (const k of mine) { try { store.removeItem(k); } catch { /* nada */ } }
  return mine.length;
}

export function memoryStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    keys: () => m.keys(),
  };
}
