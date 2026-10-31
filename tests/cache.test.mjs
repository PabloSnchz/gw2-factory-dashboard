// Caché acotada de la API (github.js 1.1.0): el panel comparte localStorage con la Bóveda,
// DEV, la bio y La Guarida (mismo origen pablosnchz.github.io). No puede crecer sin tope.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGitHub, memoryStorage, storageKeys, pruneLegacy, clearApiCache } from '../js/github.js';
import { loadAll, sinceFor, slimCommits } from '../js/loader.js';
import { mockFetch, NOW, HEAD } from './helpers.mjs';

const files = { 'status.md': '# status\n', 'backlog.md': '# backlog\n' };
const H = 3600 * 1000;

function gh(store, clock, opts) {
  return createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(files, opts), storage: store, now: () => clock.t, ttlMs: 10 * 60 * 1000, prefix: 'gfd:' });
}

test('cache: muchas cargas a lo largo de días no acumulan claves', async () => {
  const store = memoryStorage();
  const clock = { t: NOW };
  for (let i = 0; i < 40; i++) {
    clock.t = NOW + i * 3 * H; // 40 cargas en 5 días, cada una con la caché vencida
    await loadAll(gh(store, clock), clock.t);
  }
  const keys = storageKeys(store).filter(k => k.startsWith('gfd:api:'));
  assert.deepEqual(keys.sort(), ['gfd:api:branch:prod', 'gfd:api:commits:dashboard', 'gfd:api:commits:dev', 'gfd:api:compare:dev', 'gfd:api:issues:dev', 'gfd:api:tree:dev']);
});

test('cache: fresco solo con la misma ruta; un árbol de otro commit se vuelve a pedir', async () => {
  const store = memoryStorage();
  const clock = { t: NOW };
  const fetch1 = mockFetch(files);
  const g = createGitHub({ owner: 'o', fetchImpl: fetch1, storage: store, now: () => clock.t, ttlMs: 60000, prefix: 'p:' });
  await g.api('/repos/o/r/git/trees/aaa?recursive=1', { slot: 'tree:dev' });
  await g.api('/repos/o/r/git/trees/aaa?recursive=1', { slot: 'tree:dev' });
  assert.equal(fetch1.calls.length, 1, 'misma ruta dentro del TTL: sale de la caché');
  await g.api('/repos/o/r/git/trees/bbb?recursive=1', { slot: 'tree:dev' });
  assert.equal(fetch1.calls.length, 2, 'otro SHA: se pide de nuevo');
  assert.equal(storageKeys(store).length, 1, 'y ocupa el mismo casillero');
});

test('cache: si la API falla se usa el último dato del casillero (aunque sea de otra ruta)', async () => {
  const store = memoryStorage();
  const clock = { t: NOW };
  await loadAll(gh(store, clock), NOW);
  clock.t = NOW + 2 * 24 * H;
  const raw = await loadAll(gh(store, clock, { apiDown: true }), clock.t);
  assert.equal(raw.ref, HEAD, 'commits desde la caché');
  assert.ok(raw.api.stale.length > 0, 'marcado como en caché');
  assert.equal(raw.api.errors.length, 0);
});

test('cache: guarda solo lo que usa el panel', async () => {
  const store = memoryStorage();
  await loadAll(gh(store, { t: NOW }), NOW);
  const c = JSON.parse(store.getItem('gfd:api:commits:dev')).data[0];
  assert.deepEqual(Object.keys(c).sort(), ['commit', 'sha']);
  assert.deepEqual(Object.keys(c.commit).sort(), ['author', 'committer', 'message']);
  const big = [{ sha: 'x', html_url: 'u', author: { avatar_url: 'a' }, files: [1, 2], commit: { message: 'm', author: { name: 'P', date: 'd', email: 'e' }, committer: { date: 'd', email: 'e' }, tree: {} } }];
  assert.deepEqual(slimCommits(big), [{ sha: 'x', commit: { message: 'm', author: { name: 'P', date: 'd' }, committer: { date: 'd' } } }]);
});

test('cache: la ventana de 30 días no cambia dentro del mismo día UTC', () => {
  assert.equal(sinceFor(Date.parse('2026-10-31T00:00:01Z')), sinceFor(Date.parse('2026-10-31T23:59:59Z')));
  assert.equal(sinceFor(Date.parse('2026-10-31T12:00:00Z')), '2026-10-01T00:00:00.000Z');
});

test('limpieza: al iniciar borra las claves del formato viejo y nada de otras apps', () => {
  const store = memoryStorage();
  store.setItem('gfd:api:/repos/PabloSnchz/gw2-factory-dev/commits?since=1', 'x'.repeat(1000));
  store.setItem('gfd:api:/repos/PabloSnchz/gw2-factory-dev/git/trees/abc?recursive=1', 'x');
  store.setItem('gfd:api:commits:dev', '{}');
  store.setItem('la_guarida_data_v1', '{}');
  store.setItem('gn:account:keys', '[]');
  store.setItem('gfd:otra-cosa', '1');
  gh(store, { t: NOW });
  assert.deepEqual(storageKeys(store).sort(), ['gfd:api:commits:dev', 'gfd:otra-cosa', 'gn:account:keys', 'la_guarida_data_v1']);
  assert.equal(pruneLegacy(store, 'gfd:'), 0, 'idempotente');
});

test('lleno: libera solo su propia caché y reintenta; sin lugar sigue funcionando', async () => {
  // Storage con tope de 3 claves que imita QuotaExceededError.
  const m = new Map([['gn:wallet', '1'], ['gfd:api:viejo:a', '1'], ['gfd:api:viejo:b', '1']]);
  const store = {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { if (!m.has(k) && m.size >= 3) throw new Error('QuotaExceededError'); m.set(k, v); },
    removeItem: k => m.delete(k),
    keys: () => m.keys(),
  };
  const g = createGitHub({ owner: 'o', fetchImpl: mockFetch(files), storage: store, now: () => NOW, ttlMs: 60000, prefix: 'gfd:' });
  const data = await g.api('/repos/o/gw2-factory-dev/commits?x=1', { slot: 'commits:dev' });
  assert.ok(Array.isArray(data));
  assert.deepEqual([...m.keys()].sort(), ['gfd:api:commits:dev', 'gn:wallet'], 'la clave de la Bóveda queda intacta');
  assert.equal(clearApiCache(store, 'gfd:'), 1);

  const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => {}, keys: () => [].values() };
  const g2 = createGitHub({ owner: 'o', fetchImpl: mockFetch(files), storage: full, now: () => NOW, ttlMs: 60000, prefix: 'gfd:' });
  assert.ok(Array.isArray(await g2.api('/repos/o/gw2-factory-dev/commits?x=1', { slot: 'commits:dev' })), 'sin storage igual devuelve el dato');
});

test('localStorage real (length/key): storageKeys lo recorre', () => {
  const m = new Map([['a', '1'], ['b', '2']]);
  const ls = { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null };
  assert.deepEqual(storageKeys(ls), ['a', 'b']);
});
