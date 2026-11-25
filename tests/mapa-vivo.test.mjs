/**
 * tests/mapa-vivo.test.mjs — «El mapa de las dos», estados en vivo (BL-105 MAP-2).
 * Guardianes: lo medido corrige lo declarado (corridas de GitHub Actions y nuestras memorias), lo que no se
 * puede medir queda como lo declaré y lo dice, un repo toma el peor estado de sus automatizaciones, la caché
 * guarda solo lo que uso y el mapa pide las corridas una sola vez por lectura del panel.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as M from '../js/mapa.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const mapa = () => M.unirMapa(M.MAPA_ARCHIVOS.map(p => JSON.parse(read(p))));
const NOW = Date.parse('2026-11-25T04:00:00Z');
const hora = h => new Date(NOW - h * 3600000).toISOString();
const run = (f, c, h, s = 'completed') => ({ f, s, c, t: hora(h), u: `https://github.com/x/y/actions/runs/${f}-${h}` });
const nodo = (m, id) => m.nodos.find(n => n.id === id);
const DEV = 'PabloSnchz/gw2-factory-dev';

test('datos: los repos que se pueden medir declaran su `repo` y son públicos de Pablo', () => {
  const m = mapa();
  assert.deepEqual(M.reposVivos(m).sort(), ['PabloSnchz/gw2-factory-dashboard', 'PabloSnchz/gw2-factory-dev', 'PabloSnchz/gw2-wallet-ligero', 'PabloSnchz/shiruvana']);
  assert.ok(!nodo(m, 'manos').repo, 'shiruvana-manos es privado: no se puede leer sin token');
  for (const r of M.reposVivos(m)) {
    const n = m.nodos.find(x => x.repo === r);
    assert.ok(['repo', 'prd'].includes(n.tipo), `${r} está en un repo`);
    assert.ok(m.nodos.some(x => x.padre === n.id), `${n.id} tiene automatizaciones que medir`);
  }
});

test('caché: formaRuns guarda solo lo que uso y aguanta respuestas rotas', () => {
  const full = { workflow_runs: [
    { path: '.github/workflows/builds-watch.yml', status: 'completed', conclusion: 'success', updated_at: hora(1), html_url: 'https://github.com/a', name: 'x', head_commit: { message: 'grande' } },
    { path: 'dynamic/pages/pages-build-deployment', status: 'in_progress', conclusion: null, created_at: hora(0) },
    { path: '.github/workflows/test.yml@refs/heads/main', status: 'completed', conclusion: 'failure', updated_at: hora(2) },
    null, { nada: 1 },
  ] };
  const r = M.formaRuns(full);
  assert.deepEqual(r.map(x => x.f), ['builds-watch.yml', 'pages-build-deployment', 'test.yml']);
  assert.deepEqual(Object.keys(r[0]).sort(), ['c', 'f', 's', 't', 'u']);
  assert.deepEqual(M.formaRuns(null), []);
  assert.deepEqual(M.formaRuns({ workflow_runs: 'x' }), []);
});

test('corridas: la última terminada manda; una en curso se avisa; skipped y cancelled no cuentan', () => {
  const runs = [run('a.yml', null, 0, 'in_progress'), run('a.yml', 'cancelled', 1), run('a.yml', 'skipped', 2), run('a.yml', 'failure', 3), run('a.yml', 'success', 4)];
  const u = M.ultimaCorrida(runs, 'a.yml');
  assert.equal(u.corriendo, true);
  assert.equal(u.ultima.c, 'failure', 'la más nueva que terminó bien o mal');
  assert.deepEqual(M.ultimaCorrida(runs, 'b.yml'), { corriendo: false, ultima: null });
});

test('vivo: una automatización que falló queda «Con problemas» y su repo también, con el enlace a la corrida', () => {
  const m = M.aplicarVivo(mapa(), { now: NOW, runs: { [DEV]: [run('builds-watch.yml', 'failure', 3), run('app-checks.yml', 'success', 1), run('dev-pages.yml', 'success', 1)] } });
  const b = nodo(m, 'a-builds-dev');
  assert.equal(b.estado, 'alerta');
  assert.match(b.vivo.nota, /Falló la última corrida de builds-watch\.yml \(hace 3 h\)/);
  assert.equal(b.vivo.fuente, 'github');
  assert.match(b.vivo.enlace, /^https:\/\/github\.com\//);
  assert.equal(nodo(m, 'a-tests-dev').estado, 'ok');
  assert.match(nodo(m, 'a-tests-dev').vivo.nota, /Última corrida bien: app-checks\.yml, hace 1 h/);
  const dev = nodo(m, 'dev');
  assert.equal(dev.estado, 'alerta', 'el repo toma el peor estado de sus automatizaciones');
  assert.match(dev.vivo.nota, /Vigía de builds/);
  assert.equal(nodo(m, 'a-decisiones').vivo.fuente, 'declarado', 'sin corridas: queda lo declarado y lo dice');
  assert.equal(nodo(m, 'a-decisiones').estado, nodo(m, 'a-decisiones').declarado);
});

test('vivo: sin corridas leídas ni modelo, todo queda como lo declaré y el mapa original no cambia', () => {
  const base = mapa();
  const antes = JSON.stringify(base);
  const m = M.aplicarVivo(base, { now: NOW });
  assert.equal(JSON.stringify(base), antes, 'pura');
  for (const n of m.nodos) assert.equal(n.estado, n.declarado, n.id);
  assert.deepEqual(m.vivo, { repos: [], leido: false });
});

test('vivo: Pablo, yo, Shiruna, su ciclo y la PC salen de lo que el panel ya leyó', () => {
  const model = {
    human: [{}, {}], statusInfo: { code: 'ESPERANDO_VALIDACIÓN' }, health: { level: 'ok' },
    alertas: { nivel: 'critical', checks: [{ level: 'critical', title: 'Shiruna no se mueve con trabajo en cola' }] },
    pulso: { vida: { level: 'critical', text: 'Sin actividad con trabajo en cola: ¿la PC está apagada o suspendida?' } },
  };
  const m = M.aplicarVivo(mapa(), { now: NOW, model });
  assert.equal(nodo(m, 'pablo').estado, 'espera');
  assert.match(nodo(m, 'pablo').vivo.nota, /Te esperan 2 cosas en «Hoy»/);
  assert.equal(nodo(m, 'shiruvana').estado, 'espera');
  assert.equal(nodo(m, 'shiruna').estado, 'alerta');
  assert.equal(nodo(m, 'shiruna').vivo.nota, 'Shiruna no se mueve con trabajo en cola.');
  assert.equal(nodo(m, 'a-ciclo').estado, 'alerta');
  assert.ok(!/\?\.$/.test(nodo(m, 'a-ciclo').vivo.nota), 'sin «?.»');
  assert.equal(nodo(m, 'pc-shiruvana').estado, 'revisar');
  assert.equal(nodo(m, 'su-boveda').estado, 'alerta', 'su Bóveda toma el estado de su ciclo');
  assert.equal(nodo(m, 'a-resumen').estado, 'ok', 'lo que no se mide queda como estaba');

  const tranquila = M.aplicarVivo(mapa(), { now: NOW, model: { human: [], statusInfo: { code: 'EN_CURSO' }, health: { level: 'ok' },
    alertas: { nivel: 'ok', checks: [] }, pulso: { vida: { level: 'ok', text: 'Activa' } } } });
  assert.equal(nodo(tranquila, 'pablo').estado, 'ok');
  assert.equal(nodo(tranquila, 'shiruvana').vivo.nota, 'Mi estado: en curso.');
  assert.equal(nodo(tranquila, 'a-ciclo').vivo.nota, 'Activa.');
  assert.equal(nodo(tranquila, 'pc-shiruvana').estado, 'ok');
  assert.equal(M.aplicarVivo(mapa(), { now: NOW, model: { statusInfo: { code: 'BLOQUEADA' } } }).nodos.find(n => n.id === 'shiruvana').estado, 'alerta');
});

test('vivo: un repo en pausa sigue en pausa aunque se mida algo de adentro', () => {
  const base = mapa();
  base.nodos = base.nodos.map(n => (n.id === 'manos' ? { ...n, repo: 'PabloSnchz/shiruvana-manos' } : n));
  const m = M.aplicarVivo(base, { now: NOW, runs: { 'PabloSnchz/shiruvana-manos': [run('hola-shiruvana.yml', 'failure', 1)] } });
  assert.equal(nodo(m, 'a-runner').estado, 'alerta');
  assert.equal(nodo(m, 'manos').estado, 'pausa');
});

test('vista: «Ahora:» con su fuente en la ficha, «Para revisar» en las referencias y la cifra de lo que hay que mirar', () => {
  const m = M.aplicarVivo(mapa(), { now: NOW, runs: { [DEV]: [run('builds-watch.yml', 'failure', 3)] } });
  const f = M.fichaHtml(nodo(m, 'a-builds-dev'), m);
  assert.match(f, /<div class="mp-ahora mp-ahora--alerta"><p class="gds-body-2"><strong>Ahora:<\/strong> Falló/);
  assert.match(f, /Medido en GitHub Actions · <a href="https:\/\/github\.com\/[^"]+" target="_blank" rel="noopener">ver la corrida<\/a>/);
  const html = M.renderMapa({ datos: m });
  assert.match(html, /mp-chip--revisar/);
  assert.match(html, /<b>2<\/b><span>para mirar<\/span>/, 'la automatización y su repo');
  assert.match(html, /Estados en vivo: corridas de gw2-factory-dev\. Lo que no se puede medir/);
  assert.ok(!/undefined|NaN/.test(html));
  assert.match(M.renderMapa({ datos: mapa() }), /Estados: como los declaré/);
});

test('escape: lo que venga de las memorias o de GitHub nunca entra como HTML', () => {
  const m = M.aplicarVivo(mapa(), { now: NOW, model: { alertas: { nivel: 'warn', checks: [{ title: '<img src=x onerror=1>' }] } },
    runs: { [DEV]: [{ f: 'builds-watch.yml', s: 'completed', c: 'failure', t: hora(1), u: 'javascript:alert(1)' }] } });
  const html = M.fichaHtml(nodo(m, 'shiruna'), m) + M.fichaHtml(nodo(m, 'a-builds-dev'), m);
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('javascript:'), 'solo enlaces https');
});

test('carga: las corridas se piden una sola vez por lectura del panel, con un casillero fijo por repo', async () => {
  M._reiniciarMapa();
  M._ponerMapa(mapa());
  const pedidos = [];
  const gh = { api: async (path, opts) => { pedidos.push([path, opts.slot]); return opts.shape({ workflow_runs: [{ path: '.github/workflows/test.yml', status: 'completed', conclusion: 'success', updated_at: hora(1) }] }); } };
  let dibujos = 0;
  const model = { generatedAt: 1, human: [] };
  assert.equal(await M.cargarVivo({ gh, model, alTerminar: () => dibujos++ }), true);
  assert.equal(await M.cargarVivo({ gh, model, alTerminar: () => dibujos++ }), false, 'misma lectura: no vuelve a pedir');
  assert.equal(pedidos.length, 4, 'una llamada por repo');
  assert.equal(dibujos, 1);
  for (const [p, slot] of pedidos) {
    assert.match(p, /^\/repos\/PabloSnchz\/[\w.-]+\/actions\/runs\?per_page=100&exclude_pull_requests=true$/);
    assert.match(slot, /^mapa:runs:[\w.-]+$/);
  }
  assert.equal(M.estadoMapa(model, NOW).datos.nodos.find(n => n.id === 'a-ci-panel').estado, 'ok');
  assert.equal(await M.cargarVivo({ gh, model: { generatedAt: 2 }, alTerminar: () => dibujos++ }), true, 'lectura nueva: vuelve a pedir');
  assert.equal(pedidos.length, 8);
  M._reiniciarMapa();
  assert.equal(await M.cargarVivo({ gh, model }), false, 'sin mapa leído no pide nada');
});
