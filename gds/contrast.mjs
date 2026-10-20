/**
 * gds/contrast.mjs — Verificación de contraste del Gato Design System.
 *
 * Lee gds/tokens.css, resuelve las variables y calcula el contraste WCAG 2.1
 * de cada par de uso declarado en PAIRS. Lo usan tests/gds.test.mjs y la tabla
 * de GDS_FOUNDATION.md §4 (que el test compara contra este cálculo).
 *
 * Sin dependencias. Funciona en node y en el navegador.
 */

/** Pares de uso permitidos. min: 4.5 texto normal · 3 texto grande y componentes no textuales (WCAG 1.4.3 / 1.4.11). */
export const PAIRS = [
  // Texto base sobre fondo y superficies
  ...['bg', 'surface-1', 'surface-2', 'surface-3'].flatMap(s => [
    { fg: 'text-primary', bg: s, min: 4.5, uso: 'Texto principal' },
    { fg: 'text-secondary', bg: s, min: 4.5, uso: 'Texto secundario' },
  ]),
  ...['bg', 'surface-1', 'surface-2'].map(s => ({ fg: 'text-muted', bg: s, min: 4.5, uso: 'Metadato, ayuda' })),
  ...['bg', 'surface-1', 'surface-2', 'surface-3'].map(s => ({ fg: 'text-link', bg: s, min: 4.5, uso: 'Enlace, acento' })),
  // Texto de estado sobre superficies
  ...['success', 'warning', 'danger', 'info'].flatMap(k => ['bg', 'surface-1', 'surface-2'].map(s => ({ fg: `text-${k}`, bg: s, min: 4.5, uso: `Texto de estado (${k})` }))),
  // Badges de estado: texto sobre tinte translúcido compuesto sobre la superficie
  ...['success', 'warning', 'danger', 'info'].flatMap(k => ['surface-1', 'surface-2'].map(s => ({ fg: `text-${k}`, bg: `tint-${k}`, over: s, min: 4.5, uso: `Badge de estado (${k})` }))),
  ...['surface-1', 'surface-2'].map(s => ({ fg: 'text-accent', bg: 'tint-primary', over: s, min: 4.5, uso: 'Badge de acento' })),
  ...['surface-1', 'surface-2'].map(s => ({ fg: 'text-primary', bg: 'tint-primary', over: s, min: 4.5, uso: 'Opción elegida, paso actual' })),
  // Texto sobre rellenos sólidos
  { fg: 'text-on-primary', bg: 'fill-primary', min: 4.5, uso: 'Botón principal' },
  { fg: 'text-on-primary', bg: 'fill-primary-hover', min: 4.5, uso: 'Botón principal (hover)' },
  { fg: 'text-on-primary', bg: 'fill-primary-pressed', min: 4.5, uso: 'Botón principal (presionado)' },
  { fg: 'text-on-danger', bg: 'fill-danger', min: 4.5, uso: 'Botón destructivo' },
  { fg: 'text-primary', bg: 'fill-neutral', min: 4.5, uso: 'Botón secundario' },
  { fg: 'text-primary', bg: 'fill-neutral-hover', min: 4.5, uso: 'Botón secundario (hover)' },
  ...['success', 'warning', 'info'].map(k => ({ fg: 'text-on-light', bg: `fill-${k}`, min: 4.5, uso: `Texto sobre relleno ${k}` })),
  // Componentes no textuales (WCAG 1.4.11): 3:1 contra la superficie donde viven
  ...['bg', 'surface-1', 'surface-2', 'surface-3'].map(s => ({ fg: 'focus', bg: s, min: 3, uso: 'Anillo de foco' })),
  ...['bg', 'surface-1', 'surface-2'].map(s => ({ fg: 'border-control', bg: s, min: 3, uso: 'Borde de control' })),
  ...['surface-1', 'surface-2'].map(s => ({ fg: 'border-accent', bg: s, min: 3, uso: 'Indicador de selección' })),
];

/** Lee las declaraciones `--gds-*: valor;` dentro de :root (fuera de @media). */
export function parseTokens(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = {};
  const re = /:root\s*\{([^}]*)\}/g;
  let m;
  // Solo el primer bloque :root (el de @media reduce únicamente redefine movimiento)
  if ((m = re.exec(clean))) {
    for (const d of m[1].matchAll(/(--gds-[\w-]+)\s*:\s*([^;]+);/g)) tokens[d[1]] = d[2].trim();
  }
  return tokens;
}

/** Todas las declaraciones --gds-* del archivo, con su ubicación (para detectar tokens fuera de :root). */
export function allDeclarations(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/(--gds-[\w-]+)\s*:/g)].map(x => x[1]);
}

export function resolve(tokens, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Referencia circular en ${name}`);
  seen.add(name);
  const v = tokens[name];
  if (v == null) throw new Error(`Token inexistente: ${name}`);
  const ref = v.match(/^var\((--gds-[\w-]+)\)$/);
  return ref ? resolve(tokens, ref[1], seen) : v;
}

export function parseColor(v) {
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] };
  throw new Error(`Color no soportado: ${v}`);
}

/** Compone un color translúcido sobre uno opaco (alpha blending). */
export function over(top, base) {
  const a = top.a;
  return { r: top.r * a + base.r * (1 - a), g: top.g * a + base.g * (1 - a), b: top.b * a + base.b * (1 - a), a: 1 };
}

function channel(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
export function ratio(c1, c2) {
  const [hi, lo] = [luminance(c1), luminance(c2)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Calcula todos los pares. Devuelve [{fg, bg, over, ratio, min, ok, uso}]. Ratio redondeado a 2 decimales. */
export function checkPairs(tokens, pairs = PAIRS) {
  const color = n => parseColor(resolve(tokens, `--gds-color-${n}`));
  return pairs.map(p => {
    let back = color(p.bg);
    if (back.a < 1) {
      if (!p.over) throw new Error(`${p.bg} es translúcido: falta 'over'`);
      back = over(back, color(p.over));
    }
    const fore = color(p.fg);
    if (fore.a < 1) throw new Error(`${p.fg} es translúcido: no se admite como primer plano`);
    const r = Math.round(ratio(fore, back) * 100) / 100;
    return { ...p, ratio: r, ok: r >= p.min };
  });
}
