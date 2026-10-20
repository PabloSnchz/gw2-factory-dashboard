/**
 * gds/icons.js — Íconos y marca del GDS (trazo 2px, 24x24, color = currentColor).
 * Decorativos por defecto (aria-hidden). El significado siempre va en texto al lado.
 */

const PATHS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3 2 21h20L12 3z"/><path d="M12 10v4M12 18h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  octagon: '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path d="M12 8v5M12 16h.01"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  book: '<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 16a4 4 0 0 1 4-4h10"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  hand: '<path d="M8 13V5a2 2 0 0 1 4 0v6M12 11V4a2 2 0 0 1 4 0v7M16 11V6a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3l-3-5a2 2 0 0 1 3.4-2L8 13"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
};

export function icon(name, cls = '') {
  const p = PATHS[name] || PATHS.info;
  return `<svg class="gds-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
}

/** Marca de la Factory: gato negro con ojos ámbar dentro de la bóveda. */
export function brandMark(size = 32) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" class="gds-brand-mark">
    <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--gds-color-surface-2)" stroke="var(--gds-color-brand-frame)"/>
    <path d="M8 25V12l3-5 3 4h4l3-4 3 5v13c0 1-1 2-2 2H10c-1 0-2-1-2-2z" fill="var(--gds-color-bg)"/>
    <ellipse cx="13" cy="17" rx="1.6" ry="2.2" fill="var(--gds-color-brand-eyes)"/>
    <ellipse cx="19" cy="17" rx="1.6" ry="2.2" fill="var(--gds-color-brand-eyes)"/>
  </svg>`;
}

export const ICON_NAMES = Object.keys(PATHS);
