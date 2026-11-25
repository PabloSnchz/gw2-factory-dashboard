/**
 * tests/mapa.test.mjs — «El mapa de las dos» (BL-105 MAP-1).
 * Guardianes: datos sanos (ids, tipos, estados, flujos que existen), dibujo legible (nada se pisa, ningún flujo
 * atraviesa otro nodo, rótulos visibles que no se tapan), accesibilidad, escape de textos y que las
 * automatizaciones del propio panel que figuran en el mapa existan de verdad.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as M from '../js/mapa.js';
import { NAV } from '../js/views.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const partes = () => M.MAPA_ARCHIVOS.map(p => JSON.parse(read(p)));
const mapa = () => M.unirMapa(partes());
const choca = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

test('datos: las dos partes existen y el mapa unido no tiene problemas de forma', () => {
  const [mia, suya] = partes();
  assert.equal(mia.parte, 'shiruvana');
  assert.equal(suya.parte, 'shiruna');
  assert.equal(suya.borrador, true, 'la parte de Shiruna es un borrador mío hasta MAP-3');
  const m = mapa();
  assert.deepEqual(M.validarMapa(m), []);
  assert.ok(m.nodos.filter(n => n.tipo === 'agente').map(n => n.id).sort().join() === 'shiruna,shiruvana', 'las dos agentes');
  assert.ok(m.nodos.some(n => n.id === 'pablo' && n.tipo === 'persona'), 'Pablo está');
  assert.ok(m.nodos.filter(n => n.borrador).every(n => n.duena === 'shiruna'), 'solo lo de Shiruna queda como borrador');
});

test('datos: validarMapa detecta lo que está mal', () => {
  const m = mapa();
  const roto = { nodos: [...m.nodos, { ...m.nodos[0] }, { id: 'x', tipo: 'nave', estado: 'raro', duena: 'nadie', x: 5000, y: 0 }],
    flujos: [...m.flujos, { de: 'pablo', a: 'fantasma', tipo: 'orden', texto: 'x' }] };
  const e = M.validarMapa(roto).join('\n');
  for (const s of ['id repetido', 'tipo desconocido nave', 'estado desconocido raro', 'dueña desconocida nadie', 'fantasma', 'se pisan']) assert.match(e, new RegExp(s), s);
});

test('dibujo: ningún flujo atraviesa un nodo que no es suyo y nada sale del lienzo', () => {
  const m = mapa();
  const ids = new Map(m.nodos.map(n => [n.id, n]));
  for (const f of m.flujos) {
    const rc = M.recorrido(ids.get(f.de), ids.get(f.a), f.curva || 0, f.t ?? 0.5);
    for (const p of M.muestras(rc, 100)) {
      assert.ok(p.x >= 0 && p.y >= 0 && p.x <= M.LIENZO.ancho && p.y <= M.LIENZO.alto, `${f.de} → ${f.a} sale del lienzo`);
      for (const n of m.nodos) {
        if (n.id === f.de || n.id === f.a) continue;
        const c = M.caja(n);
        assert.ok(!(p.x > c.x0 && p.x < c.x1 && p.y > c.y0 && p.y < c.y1), `${f.de} → ${f.a} atraviesa ${n.id}`);
      }
    }
  }
});

test('dibujo: los rótulos visibles no se tapan entre sí ni tapan nodos', () => {
  const m = mapa();
  const ids = new Map(m.nodos.map(n => [n.id, n]));
  const puestos = [];
  for (const f of m.flujos.filter(x => x.rotulo !== 'al-tocar')) {
    const c = M.cajaRotulo(f.texto, M.recorrido(ids.get(f.de), ids.get(f.a), f.curva || 0, f.t ?? 0.5));
    for (const n of m.nodos) assert.ok(!choca(c, M.caja(n)), `el rótulo «${f.texto}» tapa ${n.id}`);
    for (const p of puestos) assert.ok(!choca(c, p.c), `«${f.texto}» tapa «${p.t}»`);
    puestos.push({ c, t: f.texto });
  }
  assert.ok(puestos.length >= m.flujos.length - 4, 'casi todos los rótulos se ven sin tocar nada');
});

test('dibujo: los textos entran en su caja', () => {
  for (const n of mapa().nodos) {
    const ancho = M.TIPOS[n.tipo].w - (n.cara ? 78 : 24);
    assert.ok(n.nombre.length * (n.tipo === 'auto' ? 7 : 8) <= ancho, `${n.id}: nombre largo`);
    if (n.tipo !== 'auto' && n.sub) assert.ok(n.sub.length * 5.9 <= ancho, `${n.id}: «${n.sub}» no entra`);
  }
});

test('vista: un h1, cada nodo es un botón con nombre y estado en palabras, y nada roto', () => {
  const m = mapa();
  const html = M.renderMapa({ datos: m });
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const niveles = [...html.matchAll(/<h([1-6])\b/g)].map(x => Number(x[1]));
  niveles.forEach((l, i) => { if (i) assert.ok(l <= niveles[i - 1] + 1, `h${niveles[i - 1]} → h${l}`); });
  const botones = [...html.matchAll(/<g class="mp-n [^"]*" data-id="([^"]+)"[^>]*tabindex="0" role="button" aria-pressed="false" aria-label="([^"]+)"/g)];
  assert.equal(botones.length, m.nodos.length, 'un botón por nodo');
  for (const [, id, label] of botones) {
    const n = m.nodos.find(x => x.id === id);
    assert.ok(label.includes(M.esc(n.nombre)), `${id}: nombre en la etiqueta`);
    assert.ok(label.includes(M.ESTADOS[n.estado].texto), `${id}: estado en palabras`);
  }
  assert.ok(!/undefined|NaN/.test(html), 'sin datos rotos');
  assert.equal((html.match(/<g class="mp-n__insignia" aria-hidden="true"><circle /g) || []).length, m.nodos.length, '1.0.1: una insignia de estado por nodo, en la esquina');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(x => x[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  for (const [, t] of html.matchAll(/aria-labelledby="([^"]+)"/g)) assert.ok(ids.includes(t), `aria-labelledby=${t}`);
  for (const a of html.match(/<a [^>]*target="_blank"[^>]*>/g) || []) assert.ok(a.includes('rel="noopener"'));
  assert.match(html, /Ver el mapa como lista/);
  for (const n of m.nodos) assert.ok(html.includes(`<strong>${M.esc(n.nombre)}</strong>`), `${n.id} en la lista`);
  assert.match(html, /<div class="uv-cifras" role="group" aria-label="En números">/);
});

test('vista: mientras lee y si falla, lo dice', () => {
  const leyendo = M.renderMapa(null);
  assert.equal((leyendo.match(/<h1\b/g) || []).length, 1);
  assert.match(leyendo, /Dibujando el mapa/);
  const error = M.renderMapa({ error: 'mapa/shiruvana.json: HTTP 404 <b>' });
  assert.match(error, /No pude leer el mapa/);
  assert.ok(error.includes('HTTP 404 &lt;b&gt;'), 'el motivo se escapa');
});

test('escape: lo que venga en los archivos nunca entra como HTML', () => {
  const m = mapa();
  m.nodos[0] = { ...m.nodos[0], nombre: '<img src=x onerror=alert(1)>', sub: '"><script>x</script>', ficha: { que: '<b>hola</b>', enlace: 'javascript:alert(1)' } };
  m.flujos[0] = { ...m.flujos[0], texto: '<svg onload=1>' };
  const html = M.renderMapa({ datos: m }) + M.fichaHtml(m.nodos[0], m);
  assert.ok(!/<img src=x|<script>x|<b>hola|<svg onload/.test(html));
  assert.ok(!html.includes('javascript:'), 'solo enlaces https');
});

test('ficha: qué es, dónde, cuándo, sus automatizaciones y con quién se conecta', () => {
  const m = mapa();
  const dev = M.fichaHtml(m.nodos.find(n => n.id === 'dev'), m);
  for (const s of ['Bóveda DEV', 'Dónde', 'Cuándo', 'Sus automatizaciones', 'Vigía de builds', 'Se conecta con', 'Abrir en GitHub']) assert.ok(dev.includes(s), s);
  assert.match(M.fichaHtml(null, m), /Tocá un nodo/);
});

test('verdad: las automatizaciones del panel que dibuja el mapa existen en este repo', () => {
  const m = mapa();
  for (const n of m.nodos.filter(x => x.padre === 'panel')) {
    for (const w of String(n.ficha.workflow || '').split(' · ').filter(Boolean)) {
      assert.ok(existsSync(new URL(`../.github/workflows/${w}`, import.meta.url)), `${n.id}: .github/workflows/${w}`);
    }
  }
});

test('integración: pestaña «Mapa», ruta en app.js y estilos antes de la piel', () => {
  assert.ok(NAV.some(n => n.route === 'mapa' && n.label === 'Mapa'));
  const app = read('js/app.js');
  assert.match(app, /case 'mapa': html = renderMapa\(estadoMapa\(m\)\); break;/, 'MAP-2: la vista recibe el modelo para los estados en vivo');
  assert.match(app, /montarMapa\(\$main, \{ alTerminar: render, gh, model: m \}\)/, 'MAP-2: el mapa lee las corridas con el mismo cliente (y la misma caché)');
  const html = read('index.html');
  const css = [...html.matchAll(/href="([^"?]+\.css)/g)].map(x => x[1]);
  assert.ok(css.indexOf('css/mapa.css') > -1 && css.indexOf('css/mapa.css') < css.indexOf('css/universo.css'));
  const estilos = read('css/mapa.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(estilos, /#[0-9a-fA-F]{3,8}\b/, 'sin hex');
  assert.doesNotMatch(estilos, /\b(rgb|rgba|hsl|hsla)\(/, 'sin rgb/hsl');
  const tokens = new Set([...read('gds/tokens.css').matchAll(/(--gds-[\w-]+)\s*:/g)].map(x => x[1]));
  for (const [, t] of estilos.matchAll(/var\((--gds-[\w-]+)\)/g)) assert.ok(tokens.has(t), `${t} existe`);
  const uv = new Set([...read('css/universo.css').matchAll(/(--uv-[\w-]+)\s*:/g)].map(x => x[1]));
  for (const [, t] of estilos.matchAll(/var\((--uv-[\w-]+)\)/g)) assert.ok(uv.has(t), `${t} existe`);
});
