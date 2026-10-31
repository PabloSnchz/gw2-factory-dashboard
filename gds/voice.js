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

/** Avatar oficial (DEC-048 en gw2-factory-dev, 2026-10-31): cara de la figura ilustrada (shiruvana-hola), 112 px (2x de 56), WebP. Igual al de js/shiruvana.js de la Bóveda. */
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
