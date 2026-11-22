/**
 * js/pablo.js — Pablo con cuerpo en el Centro de mando (SH-2).
 *
 * Pablo es quien nos dio vida a Shiruvana y a Shiruna; el Centro de mando es su lugar, así que aparece en lo suyo:
 *   - «02 · Te toca» lleva su cara al lado del antetítulo (lo que hay ahí es de Pablo);
 *   - si no le queda nada pendiente, en «Te toca» aparece tranquilo, en paz;
 *   - si hoy se terminó algo, en la tarjeta «Hoy» aparece festejando.
 *
 * Las imágenes viven en assets/pablo/ (webp sin fondo) y entran por css/hija.css como fondo de un
 * <span aria-hidden="true">: si una imagen falta, no se ve nada roto. Todo es decorativo: lo que dice la
 * pantalla sigue escrito en el texto. No toca las vistas (js/views.js sigue siendo pura). Nunca lanza.
 */

export const PABLO_VERSION = '1.0.0';
export const POSES_PABLO = ['paz', 'festeja'];

/** Qué se le pone a Pablo según el modelo (pura): { paz, festeja }. */
export function posesPablo(m) {
  if (!m) return { paz: false, festeja: false };
  const hechas = m.activity && Array.isArray(m.activity.doneToday) ? m.activity.doneToday.length : 0;
  return { paz: Array.isArray(m.human) && m.human.length === 0, festeja: hechas > 0 };
}

/** La figura decorativa de una pose de Pablo. */
export function figuraPablo(pose) {
  return POSES_PABLO.includes(pose) ? `<span class="uv-pablo uv-pablo--${pose}" aria-hidden="true"></span>` : '';
}

/** Su cara chiquita, al lado de «02 · Te toca». */
export const CARA_PABLO = '<span class="uv-cara uv-cara--pablo" aria-hidden="true"></span>';

function poner(el, pose) {
  if (!el || el.querySelector('.uv-pablo')) return;
  el.setAttribute('data-pablo', pose);
  el.insertAdjacentHTML('afterbegin', figuraPablo(pose));
}

/** Después de cada dibujo: su cara en «Te toca», en paz si no le queda nada, festejando en «Hoy». */
export function vestirPablo(root, m) {
  try {
    if (!root || typeof root.querySelector !== 'function' || !m) return;
    const toca = root.querySelector('section[aria-labelledby="human-title"]');
    if (!toca) return; // solo la vista Hoy
    const ante = toca.querySelector('.uv-ante');
    if (ante && !ante.querySelector('.uv-cara--pablo')) ante.insertAdjacentHTML('afterbegin', CARA_PABLO);
    const p = posesPablo(m);
    if (p.paz) poner(toca, 'paz');
    if (p.festeja) poner(root.querySelector('section[aria-label="Actividad: Hoy"]'), 'festeja');
  } catch { /* decorativo: nunca rompe el panel */ }
}
