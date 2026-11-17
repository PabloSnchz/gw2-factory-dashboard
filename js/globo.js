/**
 * js/globo.js — Mi globo con el gato en el Centro de mando (BL-091 CD-3, D2 «globo con el gato»).
 *
 * Usa el kit compartido del repo shiruvana (kit/escena-kit.js 1.0.0 → window.ShiruvanaKit).
 * Si el kit no carga (sin red, bloqueado o con un error), el panel sigue igual: el globo es
 * un extra y nunca rompe el dibujo de la vista.
 *
 * - mensaje(m): qué digo y con qué cara, según lo que te espera (pura).
 * - reaccion(antes, m): cómo reacciona el gato cuando cambia la lectura (pura).
 * - montarGlobo(m): crea el globo la primera vez y después solo cambia lo que digo.
 * Con el globo a la vista, las tarjetas no repiten mi cara (css/universo.css, body.svk-con-globo).
 */
import { byClase, plainTitle } from './views.js';

export const GLOBO_KEY = 'gfd:globo:v1';
const MAX = 80;

/** Corta un título largo en una palabra entera, con «…». */
export function corto(text, max = MAX) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:—-]+$/, '') + '…';
}

const n = (k, uno, varios) => (k === 1 ? uno : `${k} ${varios}`);

/** Lo que digo en el globo: primero lo urgente, después lo tuyo, y si no hay nada, en qué sigo. */
export function mensaje(m) {
  const g = byClase(m);
  const failed = ((m.channel && m.channel.items) || []).filter(c => c.state === 'failed').length;
  const crit = (m.risks || []).filter(r => r.estado === 'ABIERTO' && r.severidad === 'CRÍTICO').length;
  if (failed) {
    return { cara: 'ojo', nivel: 'critical', texto: `${n(failed, 'Una respuesta tuya no se pudo registrar', 'respuestas tuyas no se pudieron registrar')}. El motivo está en el aviso de arriba.` };
  }
  if (crit) {
    return { cara: 'ojo', nivel: 'critical', texto: `Hay ${n(crit, 'un riesgo crítico abierto', 'riesgos críticos abiertos')}: freno todo hasta resolverlo.` };
  }
  if (g.decision.length) {
    const t = corto(plainTitle(g.decision[0].titulo));
    return { cara: 'hola', nivel: 'warn', texto: g.decision.length === 1
      ? `Te espera una decisión: «${t}». Mi recomendación está en la tarjeta.`
      : `Te esperan ${g.decision.length} decisiones. Empezá por «${t}»; mi recomendación está en cada tarjeta.` };
  }
  const tareas = [...g.accion, ...g.validacion];
  if (tareas.length) {
    const t = corto(plainTitle(tareas[0].titulo));
    return { cara: 'explica', nivel: 'info', texto: tareas.length === 1
      ? `Nada que decidir. Te queda una cosa para mirar: «${t}».`
      : `Nada que decidir. Te quedan ${tareas.length} cosas para mirar; la primera: «${t}».` };
  }
  const tarea = m.status && m.status.tarea ? corto(plainTitle(m.status.tarea)) : '';
  return { cara: 'festeja', nivel: 'ok', texto: tarea ? `Nada te espera. Sigo con ${tarea}` + (tarea.endsWith('…') ? '' : '.') : 'Nada te espera. Todo en orden.' };
}

/**
 * Cómo reacciona el gato a una lectura nueva. `antes`: lo que había en la lectura anterior
 * ({ pendientes, nivel }) o null en la primera. Devuelve { pose, frase } o null.
 */
export function reaccion(antes, m) {
  const ahora = { pendientes: m.human.length, nivel: mensaje(m).nivel };
  if (ahora.nivel === 'critical' && (!antes || antes.nivel !== 'critical')) return { pose: 'camina', frase: 'Ojo con eso.' };
  if (!antes) return null;
  if (ahora.pendientes < antes.pendientes) return { pose: 'festeja', frase: ahora.pendientes ? '¡Una menos!' : '¡Nada pendiente!' };
  if (ahora.pendientes > antes.pendientes) return { pose: 'camina', frase: 'Llegó algo nuevo.' };
  return null;
}

let ctrl = null;
let antes = null;

/** Para los tests: olvida el globo montado. */
export function _reset() { ctrl = null; antes = null; }

/** Monta o actualiza el globo. Devuelve el controlador del kit, o null si no hay kit. */
export function montarGlobo(m, win = globalThis) {
  const K = win && win.ShiruvanaKit;
  const doc = win && win.document;
  if (!m || !K || typeof K.globo !== 'function' || !doc || !doc.body) return null;
  try {
    const msg = mensaje(m);
    if (!ctrl) {
      ctrl = K.globo({ texto: msg.texto, cara: msg.cara, storageKey: GLOBO_KEY });
      doc.body.classList.add('svk-con-globo');
      if (typeof K.posesSinFondo === 'function') K.posesSinFondo({ el: doc.body, poses: ['sentada'] });
    } else {
      ctrl.decir(msg.texto, msg.cara);
    }
    // Compara con lo que había: al cambiar de vista con la misma lectura no hay diferencia y el gato no se mueve.
    const r = reaccion(antes, m);
    if (r) ctrl.gato(r.pose, r.frase);
    antes = { pendientes: m.human.length, nivel: msg.nivel };
    return ctrl;
  } catch (e) {
    if (win.console) win.console.warn('[globo] el kit de Shiruvana falló; el panel sigue sin globo', e);
    return null;
  }
}
