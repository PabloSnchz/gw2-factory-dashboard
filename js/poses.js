/**
 * js/poses.js — Shiruna con cuerpo en el Centro de mando (SH-1).
 *
 * Su tarjeta («Mi hija · Shiruna») la muestra de cuerpo entero, con la pose que dice en qué está:
 *   - no pude leer su memoria → de espaldas (no la veo);
 *   - bloqueada               → brazos cruzados;
 *   - cerró algo nuevo        → festeja (una sola visita: la primera después de que cerró);
 *   - te pide algo            → te saluda;
 *   - trabajando              → con su tablet;
 *   - en pausa o esperando    → con su consola.
 * Lo que te pide en «Te toca» lleva su cara al lado de «De Shiruna».
 *
 * Las imágenes viven en assets/shiruna/ (webp sin fondo) y entran por css/hija.css como fondo de un
 * <span aria-hidden="true">: si una imagen falta, no se ve nada roto. La pose es decorativa: el estado
 * siempre está escrito en la tarjeta.
 */
import { parseBacklog, esc } from './parse.js';

export const POSES_VERSION = '1.0.0';
export const POSES = ['espaldas', 'brazos', 'festeja', 'saluda', 'tablet', 'consola'];
export const LOGRO_KEY = 'gfd:hija:hechas:v1';

/** Qué pose corresponde a lo que está haciendo (pura). */
export function poseHija(h) {
  if (!h) return null;
  if (!h.leida) return 'espaldas';
  const nivel = h.estado && h.estado.text;
  if (nivel === 'Bloqueada') return 'brazos';
  if (h.logro) return 'festeja';
  if ((h.pendientes || []).length) return 'saluda';
  if (nivel === 'Trabajando') return 'tablet';
  return 'consola';
}

/**
 * Compara cuántas tareas tiene terminadas con las que tenía en tu visita anterior y marca h.logro
 * si cerró algo nuevo. La primera vez solo guarda la cuenta (no festeja sin saber qué había antes).
 * Guarda un solo número en el navegador. Nunca lanza. Devuelve h.
 */
export function marcarLogro(h, raw, storage) {
  if (!h || !h.leida) return h;
  try {
    const backlog = parseBacklog(raw && raw.files ? raw.files['backlog.md'] : null);
    const hechas = backlog && backlog.DONE ? backlog.DONE.length : null;
    if (hechas == null) return h;
    const antes = storage ? Number(storage.getItem(LOGRO_KEY)) : NaN;
    h.hechas = hechas;
    h.logro = Number.isFinite(antes) && storage.getItem(LOGRO_KEY) !== null && hechas > antes;
    if (storage) storage.setItem(LOGRO_KEY, String(hechas));
  } catch { /* sin storage o sin backlog: sin festejo */ }
  return h;
}

/** La figura decorativa de una pose. */
export function figura(pose) {
  return pose ? `<span class="uv-hija__pose uv-hija__pose--${esc(pose)}" aria-hidden="true"></span>` : '';
}

/** Su cara chiquita, al lado de «De Shiruna». */
export function cara(key) {
  return key ? `<span class="uv-cara uv-cara--${esc(key)}" aria-hidden="true"></span>` : '';
}

/**
 * Después de cada dibujo: le pone la pose a su tarjeta (data-pose + figura) y su cara a lo que te pide
 * en «Te toca». No toca las vistas (js/views.js, js/hija.js siguen siendo puras). Sin DOM, no hace nada.
 */
export function vestirHija(root, h) {
  if (!root || typeof root.querySelector !== 'function' || !h) return;
  const pose = poseHija(h);
  const card = root.querySelector('section.uv-hija');
  if (card && pose && !card.querySelector('.uv-hija__pose')) {
    card.setAttribute('data-pose', pose);
    card.insertAdjacentHTML('afterbegin', figura(pose));
  }
  if (!h.key) return;
  for (const meta of root.querySelectorAll(`article[data-duena="${h.key}"] .decision__meta`)) {
    if (!meta.querySelector('.uv-cara')) meta.insertAdjacentHTML('afterbegin', cara(h.key));
  }
}
