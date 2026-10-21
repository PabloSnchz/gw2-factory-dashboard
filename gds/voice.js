/**
 * gds/voice.js — La voz de Shiruvana (DEC-024).
 *
 * Gato Negro Factory es la marca (brandMark en icons.js, sin cambios). Shiruvana es la voz operativa:
 * su avatar aparece SOLO cuando ella recomienda, decide, advierte, explica o resume.
 * Nunca en datos del sistema, métricas, navegación ni tarjetas de datos.
 *
 * Reglas:
 * - Un avatar por sección visible: el primer mensaje de la sección lo lleva; los siguientes van con
 *   `avatar: false` (rótulo, ícono y borde, sin imagen).
 * - 48 px (md) en general; 56 px (lg) en resúmenes y decisiones importantes; un escalón menos en pantallas angostas.
 * - El avatar es decorativo (alt vacío + aria-hidden): quién habla lo dice el rótulo visible.
 * - `body` y `meta` llegan como HTML ya escapado por quien llama (las vistas usan esc/t).
 */
import { icon } from './icons.js';

/** Avatar oficial aprobado por Pablo (REQ-009, opción A): recorte circular del retrato, 112 px (2x de 56), WebP. */
export const SHIRUVANA_AVATAR = 'data:image/webp;base64,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';

/** Tipo de mensaje → rótulo visible e ícono. */
export const VOICE_KINDS = {
  recomienda: { label: 'Shiruvana recomienda', icon: 'arrow' },
  decidio: { label: 'Shiruvana decidió', icon: 'check' },
  advierte: { label: 'Shiruvana advierte', icon: 'alert' },
  critico: { label: 'Shiruvana advierte', icon: 'octagon' },
  explica: { label: 'Shiruvana explica', icon: 'info' },
  resume: { label: 'Shiruvana resume', icon: 'sparkle' },
};

const SIZE_PX = { md: 48, lg: 56 };

/**
 * Mensaje de Shiruvana.
 * @param {object} o
 * @param {keyof VOICE_KINDS} o.kind  tipo de mensaje
 * @param {string} o.body             HTML ya escapado
 * @param {string} [o.meta]           HTML ya escapado (fecha · fuente)
 * @param {string} [o.suffix]         texto plano que sigue al rótulo (p. ej. "Crítico")
 * @param {'md'|'lg'} [o.size]        48 o 56 px
 * @param {boolean} [o.avatar]        false para el segundo mensaje y siguientes de una misma sección
 */
export function voice({ kind, body, meta = '', suffix = '', size = 'md', avatar = true }) {
  const k = VOICE_KINDS[kind] || VOICE_KINDS.explica;
  const kindClass = VOICE_KINDS[kind] ? kind : 'explica';
  const px = SIZE_PX[size] || SIZE_PX.md;
  const img = avatar
    ? `<img class="gds-voice__avatar${size === 'lg' ? ' gds-voice__avatar--lg' : ''}" src="${SHIRUVANA_AVATAR}" alt="" aria-hidden="true" width="${px}" height="${px}" decoding="async">`
    : '';
  const label = k.label + (suffix ? ' · ' + String(suffix).replace(/[<>&"']/g, '') : '');
  return `<div class="gds-voice gds-voice--${kindClass}${avatar ? '' : ' gds-voice--compact'}" data-voice="${kindClass}">${img}<div class="gds-voice__main">
    <p class="gds-voice__label">${icon(k.icon)}${label}</p>
    <div class="gds-voice__body">${body}</div>
    ${meta ? `<p class="gds-voice__meta">${meta}</p>` : ''}
  </div></div>`;
}
