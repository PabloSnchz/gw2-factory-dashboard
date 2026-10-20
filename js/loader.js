/**
 * js/loader.js — Orquesta la lectura de todas las fuentes y devuelve los
 * datos crudos que consume model.js. Nunca lanza: lo que no se puede leer
 * queda como null con su motivo.
 *
 * Presupuesto de API por carga (sin caché): 5 llamadas.
 *   1. commits de DEV   2. árbol de DEV   3. commits del dashboard
 *   4. rama main de PROD (protección)     5. comparación PROD...DEV
 */

import { CONFIG } from './config.js';
import { parseIndex } from './parse.js';

export async function loadAll(gh, now = Date.now()) {
  gh.resetState();
  const { owner, repos, memoryRoot } = CONFIG;
  const dev = repos.dev, dash = repos.dashboard, prod = repos.prod;
  const since = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

  const [devCommits, dashCommits, prodBranch] = await Promise.all([
    gh.api(`/repos/${owner}/${dev.name}/commits?sha=${dev.branch}&per_page=100&since=${since}`, { label: 'commits DEV' }),
    gh.api(`/repos/${owner}/${dash.name}/commits?sha=${dash.branch}&per_page=100&since=${since}`, { label: 'commits dashboard', allow404: true }),
    gh.api(`/repos/${owner}/${prod.name}/branches/${prod.branch}`, { label: 'rama de producción' }),
  ]);

  const ref = Array.isArray(devCommits) && devCommits[0] ? devCommits[0].sha : null;

  const [tree, compare] = await Promise.all([
    ref ? gh.api(`/repos/${owner}/${dev.name}/git/trees/${ref}?recursive=1`, { label: 'árbol DEV' }) : undefined,
    ref && prodBranch && prodBranch.commit
      ? gh.api(`/repos/${owner}/${dev.name}/compare/${prodBranch.commit.sha}...${ref}?per_page=1`, { label: 'DEV vs PROD', allow404: true })
      : undefined,
  ]);

  const memPrefix = memoryRoot + '/';
  const treePaths = tree && Array.isArray(tree.tree)
    ? tree.tree.filter(t => t.type === 'blob' && t.path.startsWith(memPrefix) && t.path.endsWith('.md')).map(t => t.path.slice(memPrefix.length))
    : null;

  const files = {};
  const fileErrors = {};
  const readRef = ref || dev.branch;
  const read = async (p) => {
    const r = await gh.raw(dev.name, readRef, memPrefix + p);
    files[p] = r.ok ? r.text : null;
    if (!r.ok) fileErrors[p] = r.error;
  };

  if (treePaths) {
    const wanted = new Set([...CONFIG.requiredFiles, ...treePaths]);
    await Promise.all([...wanted].map(read));
  } else {
    // Sin API: se lee el índice y se siguen sus links.
    await Promise.all(CONFIG.requiredFiles.map(read));
    const idx = parseIndex(files['memory-index.md']);
    if (idx) await Promise.all(Object.values(idx).flat().filter(x => x && x.path).map(x => read(x.path)));
  }

  return {
    now,
    ref,
    files,
    fileErrors,
    tree: treePaths,
    commits: {
      dev: Array.isArray(devCommits) ? devCommits : null,
      dashboard: Array.isArray(dashCommits) ? dashCommits : (dashCommits === null ? [] : null),
    },
    prod: prodBranch && prodBranch.commit ? {
      sha: prodBranch.commit.sha,
      protected: prodBranch.protected,
      date: prodBranch.commit.commit && prodBranch.commit.commit.committer ? prodBranch.commit.commit.committer.date : null,
      message: prodBranch.commit.commit ? prodBranch.commit.commit.message.split('\n')[0] : '',
    } : null,
    compare: compare ? { ahead_by: compare.ahead_by, behind_by: compare.behind_by, status: compare.status } : null,
    api: { remaining: gh.state.remaining, limit: gh.state.limit, reset: gh.state.reset, errors: [...gh.state.errors], stale: [...gh.state.stale] },
  };
}
