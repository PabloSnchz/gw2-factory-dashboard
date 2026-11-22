// FX-1: «la Factory» es un concepto, no alguien. Lo que se decide, se escribe o se hace lo hace alguien:
// Shiruvana, Shiruna o Pablo. Ningún texto del panel le atribuye a «la Factory» una acción.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../js/', import.meta.url);
const sinComentarios = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const AGENTE = [
  /\b[Ll]a Factory\s+(?:decid\w*|toma|tom[óo]|recomienda|est[áa]|espera|debe|dice|puede|no puede|lo |se detiene|todav[íi]a|escrib\w*|proces\w*|cierra|frena)/,
  /\bpor la Factory\b/,
  /\b(?:con|de) la Factory[.…]/,
  /'Factory: '/,
];

test('autoría: ningún texto del panel dice que «la Factory» decide, hace o espera', () => {
  for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const src = sinComentarios(readFileSync(new URL(f, dir), 'utf8'));
    for (const re of AGENTE) {
      const m = src.match(re);
      assert.equal(m, null, `${f}: «${m && src.slice(Math.max(0, m.index - 30), m.index + 60)}»`);
    }
  }
});

test('autoría: lo decidido y lo que pasa tiene nombre', () => {
  const views = readFileSync(new URL('views.js', dir), 'utf8');
  for (const s of ['>Decidido por Shiruvana</h2>', '¿Qué está haciendo Shiruvana?', '04 · Shiruvana ahora', 'Las decisiones técnicas las toma Shiruvana']) {
    assert.ok(views.includes(s), s);
  }
  assert.match(readFileSync(new URL('decisions.js', dir), 'utf8'), /answered: 'Respondido · Shiruvana lo está procesando'/);
});
