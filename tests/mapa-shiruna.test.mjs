/**
 * tests/mapa-shiruna.test.mjs — «El mapa de las dos», la parte de Shiruna escrita por ella (BL-105 MAP-3).
 * Guardianes: su archivo manda en lo que dice de sus cajas y nunca en lo mío ni en las posiciones; lo que no
 * confirma queda punteado; lo que no entra se avisa (y se escapa); una automatización nueva entra en la columna
 * de su repo sin pisar nada; si su archivo falta, está roto o no se puede leer, queda mi borrador y se dice por qué.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as M from '../js/mapa.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const mia = () => JSON.parse(read('mapa/shiruvana.json'));
const plano = () => JSON.parse(read('mapa/shiruna-borrador.json'));
const inicial = () => JSON.parse(read('tests/mapa-shiruna-inicial.json'));
const unir = (suya) => {
  const r = M.leerParteShiruna(plano(), suya, [mia()]);
  return { r, m: M.unirMapa([mia(), r.parte]) };
};
const nodo = (m, id) => m.nodos.find(n => n.id === id);
const choca = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** Las mismas reglas de dibujo de tests/mapa.test.mjs, para el mapa con su parte. */
function dibujoSano(m) {
  assert.deepEqual(M.validarMapa(m), []);
  const ids = new Map(m.nodos.map(n => [n.id, n]));
  for (const f of m.flujos) {
    const rc = M.recorrido(ids.get(f.de), ids.get(f.a), f.curva || 0, f.t ?? 0.5);
    for (const p of M.muestras(rc, 100)) {
      for (const n of m.nodos) {
        if (n.id === f.de || n.id === f.a) continue;
        const c = M.caja(n);
        assert.ok(!(p.x > c.x0 && p.x < c.x1 && p.y > c.y0 && p.y < c.y1), `${f.de} → ${f.a} atraviesa ${n.id}`);
      }
    }
    if (f.rotulo !== 'al-tocar') for (const n of m.nodos) assert.ok(!choca(M.cajaRotulo(f.texto, rc), M.caja(n)), `«${f.texto}» tapa ${n.id}`);
  }
  for (const n of m.nodos) assert.ok(M.entraNombre(n.tipo, n.cara, n.nombre), `${n.id}: nombre largo`);
}

test('contrato: su archivo inicial (el que le doy en la orden) entra entero y sin avisos', () => {
  const { r, m } = unir(inicial());
  assert.equal(r.propia, true);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.sinConfirmar, [], 'confirma todas sus cajas');
  assert.ok(m.nodos.filter(n => n.duena === 'shiruna').every(n => n.borrador === false));
  assert.ok(m.flujos.every(f => f.borrador === false), 'sin cajas en borrador, sus flujos dejan de ser borrador');
  assert.equal(nodo(m, 'su-boveda').nombre, 'Mi Bóveda');
  assert.match(nodo(m, 'shiruna').ficha.que, /^Soy Shiruna/);
  assert.equal(m.fuentes[1].autora, 'Shiruna');
  assert.equal(m.fuentes[1].borrador, false);
  dibujoSano(m);
});

test('sin su archivo queda mi borrador, entero y punteado', () => {
  const { r, m } = unir(null);
  assert.equal(r.propia, false);
  assert.ok(m.nodos.filter(n => n.duena === 'shiruna').every(n => n.borrador));
  assert.equal(r.parte.version, '0.2.0', 'el plano tal cual');
  for (const malo of [[], 'hola', { parte: 'otra', nodos: [] }, { parte: 'shiruna' }]) {
    const x = M.leerParteShiruna(plano(), malo, [mia()]);
    assert.equal(x.propia, false);
    assert.match(x.avisos[0], /no tiene la forma del contrato/);
  }
});

test('lo que no confirma queda punteado; lo que confirma, firme, con su estado y su ficha', () => {
  const { r, m } = unir({ parte: 'shiruna', version: '1.0.0', actualizado: '2026-11-25', nodos: [
    { id: 'shiruna', estado: 'revisar', ficha: { que: 'Hoy voy despacio.' } },
    { id: 'a-ciclo', sub: 'cada 30 min', ficha: { cuando: 'Cada media hora.' } },
  ] });
  assert.deepEqual(r.avisos, []);
  assert.equal(nodo(m, 'shiruna').estado, 'revisar');
  assert.equal(nodo(m, 'shiruna').ficha.que, 'Hoy voy despacio.');
  assert.equal(nodo(m, 'shiruna').ficha.donde, plano().nodos[0].ficha.donde, 'lo que no dice queda del plano');
  assert.equal(nodo(m, 'shiruna').borrador, false);
  assert.equal(nodo(m, 'a-ciclo').ficha.cuando, 'Cada media hora.');
  assert.equal(nodo(m, 'su-guarida').borrador, true);
  assert.deepEqual(r.sinConfirmar.sort(), ['PC SHIRUVANA', 'Resumen del día', 'Su Bóveda', 'Su Guarida']);
  assert.equal(m.flujos.find(f => f.de === 'shiruna' && f.a === 'su-boveda').borrador, true, 'un extremo sin confirmar');
  assert.equal(m.flujos.find(f => f.de === 'shiruvana' && f.a === 'shiruna').borrador, false);
});

test('nunca toca lo mío ni las posiciones, tipos o dueñas del plano', () => {
  const p = plano();
  const { r, m } = unir({ parte: 'shiruna', version: '1.0.0', actualizado: '2026-11-25', nodos: [
    { id: 'shiruvana', nombre: 'Yo', estado: 'alerta', ficha: { que: 'x' } },
    { id: 'dev', estado: 'pausa' },
    { id: 'su-boveda', x: 5, y: 5, tipo: 'agente', duena: 'pablo', estado: 'ok' },
  ] });
  assert.equal(nodo(m, 'shiruvana').nombre, 'Shiruvana');
  assert.equal(nodo(m, 'dev').estado, mia().nodos.find(n => n.id === 'dev').estado);
  const b = nodo(m, 'su-boveda'), b0 = p.nodos.find(n => n.id === 'su-boveda');
  assert.deepEqual([b.x, b.y, b.tipo, b.duena], [b0.x, b0.y, b0.tipo, b0.duena]);
  const t = r.avisos.join('\n');
  assert.match(t, /shiruvana: es de mi parte/);
  assert.match(t, /dev: es de mi parte/);
  assert.match(t, /su-boveda: el tipo y el repo/);
  assert.match(t, /su-boveda: la posición, la dueña y la cara las pone el plano/);
  dibujoSano(m);
});

test('lo que no entra se avisa y queda lo del plano: nombre largo, estado raro, enlace sin https, textos vacíos', () => {
  const { r, m } = unir({ parte: 'shiruna', version: 'uno', nodos: [
    { id: 'su-boveda', nombre: 'Mi Bóveda gigante de verdad', sub: 'x'.repeat(30), estado: 'feliz',
      ficha: { que: '', enlace: 'javascript:alert(1)', donde: 'y'.repeat(401) } },
    { id: 'su-boveda', estado: 'alerta' }, { id: 'Mal Id' }, null,
  ] });
  const b = nodo(m, 'su-boveda');
  assert.equal(b.nombre, 'Su Bóveda');
  assert.equal(b.estado, 'ok');
  assert.equal(b.ficha.enlace, plano().nodos.find(n => n.id === 'su-boveda').ficha.enlace);
  const t = r.avisos.join('\n');
  for (const s of ['no entra en la caja', 'subtítulo', 'estado «feliz» desconocido', 'ficha.que vacío', 'ficha.donde vacío o de más de 400', 'https://', 'repetido', 'sin «id» válido', '«version»', '«actualizado»']) assert.ok(t.includes(s), s);
  dibujoSano(m);
});

test('una automatización nueva entra en la columna de su repo, sin pisar nada; las que no entran se avisan', () => {
  const nueva = i => ({ id: `a-nueva-${i}`, tipo: 'auto', padre: 'su-boveda', nombre: `Tarea ${i}`, estado: 'ok', ficha: { que: `Hace ${i}.`, workflow: 'dev-pages.yml' } });
  const { r, m } = unir({ ...inicial(), nodos: [...inicial().nodos, nueva(1), nueva(2), nueva(3), nueva(4)] });
  const col = m.nodos.filter(n => n.padre === 'su-boveda');
  const b = nodo(m, 'su-boveda');
  assert.ok(col.length >= 3 && col.length <= M.PARTE_SHIRUNA.porPadre, `entran hasta ${M.PARTE_SHIRUNA.porPadre}: ${col.length}`);
  for (const n of col) assert.equal(n.x, b.x, 'en la columna de su repo');
  const entraron = col.length - 2;
  assert.equal(r.avisos.filter(a => /no entró en el dibujo/.test(a)).length, 4 - entraron);
  assert.ok(nodo(m, 'a-nueva-1'), 'la primera nueva siempre entra');
  assert.equal(nodo(m, 'a-nueva-1').duena, 'shiruna');
  assert.equal(nodo(m, 'a-nueva-1').borrador, false);
  dibujoSano(m);
  const html = M.renderMapa({ datos: m });
  assert.match(html, /data-id="a-nueva-1"/);
  assert.match(html, /data-padre="su-boveda"/);

  const malo = unir({ ...inicial(), nodos: [...inicial().nodos,
    { id: 'otro-repo', tipo: 'repo', nombre: 'Otro', ficha: { que: 'x' } },
    { id: 'a-ajena', tipo: 'auto', padre: 'dev', nombre: 'X', ficha: { que: 'x' } },
    { id: 'a-sin-que', tipo: 'auto', padre: 'su-guarida', nombre: 'X' }] });
  const t = malo.r.avisos.join('\n');
  assert.match(t, /otro-repo: una caja nueva solo puede ser una automatización/);
  assert.match(t, /a-ajena: una caja nueva solo puede ser una automatización/);
  assert.match(t, /a-sin-que: una automatización nueva necesita/);
  assert.ok(!nodo(malo.m, 'otro-repo') && !nodo(malo.m, 'a-ajena') && !nodo(malo.m, 'a-sin-que'));
});

test('vista: dice de quién es su parte, qué no entró (escapado) y enlaza su archivo', () => {
  const con = (s, datos) => M.renderMapa({ datos: { ...datos, shiruna: s } });
  const { r, m } = unir(inicial());
  const origen = 'https://github.com/shiruna-gato-negro/gw2-factory-dev/blob/main/ai-memory/mapa.json';
  const ok = con({ propia: true, avisos: [], sinConfirmar: [], origen }, m);
  assert.match(ok, /La parte de Shiruna la escribe ella\./);
  assert.match(ok, /data-parte-shiruna="ok"/);
  assert.match(ok, /Shiruna · parte «shiruna» v1\.0\.0 · 2026-11-25/);
  assert.match(ok, /href="https:\/\/github\.com\/shiruna-gato-negro\/gw2-factory-dev\/blob\/main\/ai-memory\/mapa\.json" target="_blank" rel="noopener">Ver su archivo/);
  const av = con({ propia: true, avisos: ['<img src=x onerror=1>', ...Array.from({ length: 9 }, (_, i) => `aviso ${i}`)], sinConfirmar: ['Su Guarida'], origen }, m);
  assert.match(av, /gds-callout--warning mp-parte/);
  assert.match(av, /tiene 10 detalles que no entraron/);
  assert.match(av, /y 2 más\./);
  assert.match(av, /Sin confirmar por ella \(punteado\): Su Guarida\./);
  assert.ok(!av.includes('<img src=x'));
  const borr = con({ propia: false, avisos: [], sinConfirmar: [], motivo: 'todavía no publicó la suya' }, unir(null).m);
  assert.match(borr, /La parte de Shiruna es un borrador mío\./);
  assert.match(borr, /data-parte-shiruna="borrador">La parte de Shiruna es un borrador mío: todavía no publicó la suya/);
  assert.equal((ok.match(/<h1\b/g) || []).length, 1);
  assert.ok(!/undefined|NaN/.test(ok + av + borr));
  assert.equal(r.propia, true);
});

test('carga: lee su archivo por raw (sin cuota) y nunca rompe el mapa si falta, falla o está roto', async () => {
  const hija = { nombre: 'Shiruna', owner: 'shiruna-gato-negro', repo: 'gw2-factory-dev', branch: 'main' };
  const now = Date.parse('2026-11-25T05:00:00Z');
  assert.equal(M.urlParteShiruna(now, hija), `https://raw.githubusercontent.com/shiruna-gato-negro/gw2-factory-dev/main/ai-memory/mapa.json?v=${Math.floor(now / 300000)}`);
  assert.equal(M.urlParteShiruna(now, null), null);
  const local = { 'mapa/shiruvana.json': read('mapa/shiruvana.json'), 'mapa/shiruna-borrador.json': read('mapa/shiruna-borrador.json') };
  const fake = suya => async (url) => {
    const u = String(url);
    const k = Object.keys(local).find(p => u.endsWith(p));
    if (k) return { ok: true, status: 200, json: async () => JSON.parse(local[k]) };
    assert.match(u, /^https:\/\/raw\.githubusercontent\.com\//, 'su parte, por raw');
    if (suya === 'red') throw new Error('sin red');
    if (typeof suya === 'number') return { ok: false, status: suya, text: async () => '' };
    return { ok: true, status: 200, text: async () => suya };
  };
  const casos = [
    [JSON.stringify(inicial()), true, null],
    [404, false, /todavía no publicó la suya/],
    [500, false, /HTTP 500/],
    ['red', false, /error de red/],
    ['{ esto no es json', false, /no es un JSON válido/],
  ];
  for (const [suya, propia, motivo] of casos) {
    M._reiniciarMapa();
    let dibujos = 0;
    const c = await M.cargarMapa({ fetchImpl: fake(suya), base: new URL('../js/mapa.js', import.meta.url), alTerminar: () => dibujos++, now, hija });
    assert.ok(c.datos, `${suya}: el mapa se dibuja igual`);
    assert.equal(c.datos.shiruna.propia, propia);
    if (motivo) assert.match(c.datos.shiruna.motivo, motivo);
    assert.match(c.datos.shiruna.origen, /\/blob\/main\/ai-memory\/mapa\.json$/);
    assert.deepEqual(M.validarMapa(c.datos), []);
    assert.equal(dibujos, 1);
    const vivo = M.estadoMapa({ generatedAt: 1, human: [] }).datos;
    assert.equal(vivo.shiruna.propia, propia, 'los estados en vivo conservan de dónde salió su parte');
  }
  M._reiniciarMapa();
});
