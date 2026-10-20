/**
 * js/respond.js — Responder un pedido desde el panel (DEC-012).
 *
 * Cada respuesta es un enlace a un issue prellenado en gw2-factory-dev. Pablo revisa el texto,
 * puede agregar un comentario y toca "Submit new issue". La Action decision-response escribe
 * ai-memory/responses/RESP-XXX.md (formato DEC-011), comenta y cierra el issue.
 *
 * Sin tokens ni secretos en el navegador: GitHub autentica a Pablo.
 * Formato espejo de gw2-factory-dev/.github/scripts/decision-response.cjs (parseIssueBody).
 */

import { CONFIG } from './config.js';
import { RESPONSES } from './decisions.js';

export const MARKER = '<!-- gds:decision-response v1 -->';
export const POSTPONE_DAYS = 7;
const TITLE_MAX = 120;
const PLACEHOLDER = '_Escribí acá si querés agregar algo (opcional)._';

const day = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Respuestas posibles para un pedido abierto, en orden de uso.
 * @returns [{ respuesta, opcion, hasta, label, recomendada }]
 */
export function responseActions(req, now) {
  if (!req || req.state !== 'open') return [];
  const hasta = day(now + POSTPONE_DAYS * 864e5);
  const postpone = { respuesta: 'POSTPONED', opcion: null, hasta, label: `Posponer ${POSTPONE_DAYS} días` };
  if (req.tipo === 'accion') {
    return [
      { respuesta: 'DONE', opcion: null, hasta: null, label: 'Ya lo hice', recomendada: true },
      postpone,
      { respuesta: 'REJECTED', opcion: null, hasta: null, label: 'No lo voy a hacer' },
    ];
  }
  const rec = req.recomendacion && req.recomendacion.clave;
  const approve = req.opciones && req.opciones.length
    ? [...req.opciones].sort((a, b) => (b.clave === rec) - (a.clave === rec)).map(o => ({
      respuesta: 'APPROVED', opcion: o.clave, hasta: null,
      label: `Aprobar ${o.clave}${o.clave === rec ? ' (recomendada)' : ''}`, recomendada: o.clave === rec,
    }))
    : [{ respuesta: 'APPROVED', opcion: null, hasta: null, label: 'Aprobar', recomendada: true }];
  return [...approve, { respuesta: 'REJECTED', opcion: null, hasta: null, label: 'Rechazar' }, postpone];
}

export function buildIssueTitle(req, a) {
  const t = `[Decisión] ${RESPONSES[a.respuesta].label}${a.opcion ? ' ' + a.opcion : ''} · ${req.id} — ${req.titulo}`;
  return t.length > TITLE_MAX ? t.slice(0, TITLE_MAX - 1) + '…' : t;
}

export function buildIssueBody(req, a) {
  const opcion = a.opcion ? ` (opción ${a.opcion})` : '';
  return [
    MARKER,
    '**Respuesta de Pablo** desde el Centro de Decisiones.',
    '',
    `Pedido: ${req.id} — ${String(req.titulo).replace(/[\r\n]+/g, ' ')}`,
    `Respuesta: ${RESPONSES[a.respuesta].label}${opcion}${a.respuesta === 'POSTPONED' ? ` hasta el ${a.hasta} (podés cambiar la fecha abajo)` : ''}`,
    '',
    '```gds-response',
    `solicitud: ${req.id}`,
    `respuesta: ${a.respuesta}`,
    `opcion: ${a.opcion || '—'}`,
    `hasta: ${a.hasta || '—'}`,
    '```',
    '',
    '### Comentario',
    '',
    PLACEHOLDER,
    '',
  ].join('\n');
}

export function buildIssueUrl(req, a) {
  const { owner } = CONFIG;
  const repo = CONFIG.repos.dev.name;
  // encodeURIComponent (espacios como %20, no "+"): inequívoco para GitHub.
  const q = `title=${encodeURIComponent(buildIssueTitle(req, a))}&body=${encodeURIComponent(buildIssueBody(req, a))}`;
  return `https://github.com/${owner}/${repo}/issues/new?${q}`;
}
