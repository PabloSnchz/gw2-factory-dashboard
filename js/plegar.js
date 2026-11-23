/**
 * js/plegar.js — Columnas del tablero con altura de 5 tarjetas, sin perder nada (BL-TAB, pedido por Pablo).
 *
 * Mi columna «Hecho» tiene cerca de 90 tareas y empujaba el tablero de Shiruna muy abajo. Ahora cada columna
 * muestra 5 tarjetas y el resto queda en «Ver N más»: plegado y, abierto, con scroll propio (uv-mas__txt,
 * máximo 40 % de la pantalla, css/universo.css). El conteo de la columna sigue diciendo el total.
 * - recientesPrimero: lo hecho, de lo más nuevo a lo más viejo (por fecha; a igual fecha, el orden del archivo).
 * - plegarColumna: recibe los <li> ya armados (y escapados) y devuelve la lista con el resto plegado.
 */
import { esc } from './parse.js';

export const PLEGAR_VERSION = '1.0.0';
export const VISIBLES = 5;

const ms = (f) => (f instanceof Date ? f.getTime() : f == null ? NaN : Date.parse(f));

/**
 * Ordena por fecha, de la más nueva a la más vieja. Sin fecha, al final. A igual fecha manda el archivo:
 * `nuevasAlFinal` dice si en ese archivo lo nuevo se agrega abajo (Shiruna) o arriba (yo).
 */
export function recientesPrimero(items, { nuevasAlFinal = false } = {}) {
  const base = (items || []).map((it, i) => ({ it, i, t: ms(it && it.fecha) }));
  if (nuevasAlFinal) base.reverse().forEach((x, i) => { x.i = i; });
  return base.sort((a, b) => {
    const fa = Number.isFinite(a.t), fb = Number.isFinite(b.t);
    if (fa !== fb) return fa ? -1 : 1;
    return (fa && b.t !== a.t ? b.t - a.t : 0) || a.i - b.i;
  }).map(x => x.it);
}

/** `<ul>` con las primeras `max` y el resto en «Ver N más» (plegado, con scroll propio). */
export function plegarColumna(lis, { nombre = 'Columna', max = VISIBLES } = {}) {
  const todas = lis || [];
  const vis = todas.slice(0, max);
  const resto = todas.slice(max);
  const lista = `<ul class="gds-list">${vis.join('')}</ul>`;
  if (!resto.length) return lista;
  return `${lista}
      <details class="uv-mas"><summary class="gds-caption">Ver ${resto.length} más</summary>
        <div class="uv-mas__txt gds-body-2" tabindex="0" role="region" aria-label="${esc(nombre)}: ${resto.length} más"><ul class="gds-list">${resto.join('')}</ul></div></details>`;
}
