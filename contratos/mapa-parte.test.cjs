/**
 * tests/mapa-parte.test.cjs — mi parte del «Mapa de las dos» (MAP-3, orden de Shiruvana 2026-11-25).
 * El Centro de mando lee ai-memory/mapa.json y lo dibuja en la pestaña «Mapa». Este test cuida su contrato
 * para que lo que escribo entre entero: si algo no entra acá, tampoco entra allá.
 * Contrato: parte «shiruna», autora «Shiruna», version 1.0.0, actualizado AAAA-MM-DD y una lista de nodos.
 * Cada nodo: id, nombre, estado y ficha.que; sub y ficha.donde/cuando/workflow/enlace (https) opcionales.
 * Mis cajas del plano: shiruna, pc-shiruvana, su-boveda, su-guarida, a-ciclo, a-resumen. Una caja nueva solo
 * puede ser una automatización («tipo»: «auto») de su-boveda o su-guarida, 5 como mucho por repo.
 * Nunca: x, y, duena ni cara (el plano las pone), ni ids de Shiruvana.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ARCHIVO = path.join(__dirname, '..', 'ai-memory', 'mapa.json');
const PLANO = { shiruna: ['agente', null, true], 'pc-shiruvana': ['pc', null, false], 'su-boveda': ['repo', null, false],
  'su-guarida': ['repo', null, false], 'a-ciclo': ['auto', 'su-boveda', false], 'a-resumen': ['auto', 'su-boveda', false] };
const ANCHO = { agente: 230, pc: 170, repo: 150, auto: 150 };
const ESTADOS = ['ok', 'espera', 'revisar', 'alerta', 'pausa'];
const texto = v => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 400;

const leer = () => JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'));

test('mapa: el archivo existe y tiene la forma del contrato', () => {
  const m = leer();
  assert.equal(m.parte, 'shiruna');
  assert.equal(m.autora, 'Shiruna');
  assert.match(String(m.version), /^\d+\.\d+\.\d+$/);
  assert.match(String(m.actualizado), /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Array.isArray(m.nodos) && m.nodos.length > 0 && m.nodos.length <= 40);
});

test('mapa: cada caja es mía, tiene lo que hace falta y entra en el dibujo', () => {
  const m = leer();
  const ids = new Set();
  const porRepo = { 'su-boveda': 0, 'su-guarida': 0 };
  for (const n of m.nodos) {
    assert.match(String(n.id), /^[a-z0-9][a-z0-9-]{1,39}$/, `id válido: ${n.id}`);
    assert.ok(!ids.has(n.id), `${n.id} repetido`);
    ids.add(n.id);
    for (const k of ['x', 'y', 'duena', 'cara']) assert.equal(n[k], undefined, `${n.id}: «${k}» lo pone el plano`);
    const plano = PLANO[n.id];
    const tipo = plano ? plano[0] : n.tipo;
    const padre = plano ? plano[1] : n.padre;
    if (!plano) {
      assert.equal(n.tipo, 'auto', `${n.id}: una caja nueva solo puede ser una automatización`);
      assert.ok(n.padre in porRepo, `${n.id}: padre su-boveda o su-guarida`);
    } else {
      if (n.tipo !== undefined) assert.equal(n.tipo, tipo, `${n.id}: el tipo no cambia`);
      if (n.padre !== undefined) assert.equal(n.padre, padre, `${n.id}: el repo no cambia`);
    }
    if (tipo === 'auto') porRepo[padre] += 1;
    assert.ok(texto(n.nombre), `${n.id}: nombre`);
    const cara = plano ? plano[2] : false;
    assert.ok(n.nombre.trim().length * (tipo === 'auto' ? 7 : 8) <= ANCHO[tipo] - (cara ? 78 : 24), `${n.id}: el nombre «${n.nombre}» no entra en la caja`);
    if (n.sub !== undefined) {
      assert.ok(texto(n.sub), `${n.id}: sub vacío`);
      if (tipo === 'auto') assert.ok(n.sub.trim().length <= 40, `${n.id}: sub de más de 40`);
      else assert.ok(n.sub.trim().length * 5.9 <= ANCHO[tipo] - (cara ? 78 : 24), `${n.id}: el sub «${n.sub}» no entra en la caja`);
    }
    assert.ok(ESTADOS.includes(n.estado), `${n.id}: estado ${n.estado} (vale ${ESTADOS.join(', ')})`);
    assert.ok(n.ficha && typeof n.ficha === 'object' && texto(n.ficha.que), `${n.id}: ficha.que (hasta 400 caracteres)`);
    for (const k of ['donde', 'cuando', 'workflow']) if (n.ficha[k] !== undefined) assert.ok(texto(n.ficha[k]), `${n.id}: ficha.${k}`);
    if (n.ficha.enlace !== undefined) assert.match(n.ficha.enlace, /^https:\/\/[^\s"'<>]{1,300}$/, `${n.id}: enlace https`);
  }
  for (const [r, c] of Object.entries(porRepo)) assert.ok(c <= 5, `${r}: ${c} automatizaciones (entran 5)`);
  for (const id of ['shiruna', 'su-boveda']) assert.ok(ids.has(id), `${id} está (si no, queda el borrador de Shiruvana)`);
});
