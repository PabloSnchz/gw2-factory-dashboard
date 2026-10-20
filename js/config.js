/**
 * js/config.js — Configuración del Dashboard Factory.
 *
 * Todo lo que depende del entorno vive acá. El resto del código no conoce
 * nombres de repositorios ni umbrales.
 */

export const CONFIG = {
  owner: 'PabloSnchz',

  repos: {
    dev:       { name: 'gw2-factory-dev',       branch: 'main', label: 'DEV · Factory', role: 'dev' },
    dashboard: { name: 'gw2-factory-dashboard', branch: 'main', label: 'Dashboard',     role: 'dashboard' },
    prod:      { name: 'gw2-wallet-ligero',     branch: 'main', label: 'Producción',    role: 'production' },
  },

  // Memoria oficial de la Factory (en el repo dev).
  memoryRoot: 'ai-memory',
  requiredFiles: ['status.md', 'backlog.md', 'memory-index.md', 'roadmap.md', 'risks.md'],
  collections: [
    { dir: 'decisions', prefix: 'DEC',  label: 'Decisiones' },
    { dir: 'lessons',   prefix: 'LES',  label: 'Lecciones' },
    { dir: 'features',  prefix: 'FEAT', label: 'Funcionalidades' },
  ],

  // Caché de la API de GitHub (anónima: 60 req/h por IP). Una carga usa 5.
  apiCacheTtlMs: 10 * 60 * 1000,
  storagePrefix: 'gfd:',

  thresholds: {
    statusStaleHours: 48,     // status.md sin actualizar con trabajo en curso
    statusDeadHours: 168,     // 7 días: la memoria dejó de reflejar la realidad
    proposalWaitDays: 7,      // una propuesta esperando decisión humana
    requestWaitDays: 7,       // un pedido abierto sin respuesta de Pablo
    responseUnprocessedHours: 48, // una respuesta de Pablo sin procesar por la Factory
    devIdleDays: 7,           // sin commits en DEV
    apiLowRemaining: 10,      // cuota de API casi agotada
  },
};

export function repoUrl(key) {
  const r = CONFIG.repos[key];
  return `https://github.com/${CONFIG.owner}/${r.name}`;
}

export function blobUrl(key, path, ref) {
  const r = CONFIG.repos[key];
  return `https://github.com/${CONFIG.owner}/${r.name}/blob/${ref || r.branch}/${path}`;
}

export function commitUrl(key, sha) {
  return `${repoUrl(key)}/commit/${sha}`;
}
