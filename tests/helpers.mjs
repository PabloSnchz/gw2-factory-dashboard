// Utilidades de test: lee la memoria de fixtures y simula GitHub.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURE_ROOT = join(here, 'fixtures', 'ai-memory');

export function readMemory(root = FIXTURE_ROOT) {
  const out = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.md')) out[relative(root, p).split('\\').join('/')] = readFileSync(p, 'utf8');
    }
  };
  walk(root);
  return out;
}

export const NOW = Date.parse('2026-10-20T00:30:00Z');
export const HEAD = 'a'.repeat(40);
export const PROD_SHA = 'c0471e0f6f8cae523a383627d86e5b6552952b1b';

export function commit(sha, iso, msg) {
  return { sha, commit: { message: msg, author: { name: 'Pablo Sanchez', date: iso }, committer: { date: iso } } };
}

/** fetch simulado. `apiDown` simula cuota agotada. */
export function mockFetch(files, { apiDown = false, prodProtected = false } = {}) {
  const calls = [];
  const json = (data, status = 200) => ({
    ok: status >= 200 && status < 300, status,
    headers: { get: (h) => ({ 'x-ratelimit-remaining': '55', 'x-ratelimit-limit': '60', 'x-ratelimit-reset': String(NOW / 1000 + 3600) })[h] ?? null },
    json: async () => data, text: async () => JSON.stringify(data),
  });
  const fn = async (url) => {
    calls.push(url);
    if (url.startsWith('https://api.github.com')) {
      if (apiDown) return json({ message: 'rate limit' }, 403);
      if (url.includes('/gw2-factory-dev/commits')) return json([
        commit(HEAD, '2026-10-20T00:25:00Z', 'docs(ai-memory): FACTORY-001'),
        commit('b'.repeat(40), '2026-10-19T23:57:08Z', 'docs(ai-memory): propuestas DEC-005..007'),
        commit('c'.repeat(40), '2026-10-12T10:00:00Z', 'commit viejo'),
      ]);
      if (url.includes('/gw2-factory-dashboard/commits')) return json([commit('d'.repeat(40), '2026-10-20T00:20:00Z', 'feat: Dashboard Factory v1')]);
      if (url.includes('/gw2-wallet-ligero/branches/main')) return json({ name: 'main', protected: prodProtected, commit: { sha: PROD_SHA, commit: { message: 'feat: Armería', committer: { date: '2026-10-03T23:59:13Z' } } } });
      if (url.includes('/git/trees/')) return json({ tree: Object.keys(files).map(p => ({ type: 'blob', path: 'ai-memory/' + p })) });
      if (url.includes('/compare/')) return json({ status: 'ahead', ahead_by: 3, behind_by: 0 });
      return json({ message: 'not found' }, 404);
    }
    if (url.startsWith('https://raw.githubusercontent.com')) {
      const m = url.match(/\/ai-memory\/([^?]+)/);
      const p = m ? decodeURIComponent(m[1]) : null;
      if (p && files[p] != null) return { ok: true, status: 200, text: async () => files[p] };
      return { ok: false, status: 404, text: async () => '404' };
    }
    return { ok: false, status: 500 };
  };
  fn.calls = calls;
  return fn;
}
