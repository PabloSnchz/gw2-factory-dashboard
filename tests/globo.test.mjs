// Mi globo con el gato en el Centro de mando (BL-091 CD-3, D2): qué digo, cómo reacciona el gato,
// que nunca rompa el panel y que el kit se pida con versión fija.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGitHub, memoryStorage } from '../js/github.js';
import { loadAll } from '../js/loader.js';
import { buildModel } from '../js/model.js';
import { mensaje, reaccion, montarGlobo, corto, _reset, GLOBO_KEY } from '../js/globo.js';
import { readMemory, mockFetch, NOW } from './helpers.mjs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

async function base() {
  const gh = createGitHub({ owner: 'PabloSnchz', fetchImpl: mockFetch(readMemory()), storage: memoryStorage(), now: () => NOW, ttlMs: 1, prefix: 't:' });
  return buildModel(await loadAll(gh, NOW));
}
const item = (id, clase, titulo) => ({ id, clase, titulo });
const con = (m, cambios) => ({ ...m, ...cambios });

test('mensaje: con la memoria de prueba dice algo concreto, sin «undefined»', async () => {
  const msg = mensaje(await base());
  assert.ok(msg.texto.length > 10 && !/undefined|NaN/.test(msg.texto), msg.texto);
  assert.ok(['hola', 'ojo', 'explica', 'festeja'].includes(msg.cara));
});

test('mensaje: prioridad — respuesta fallida, riesgo crítico, decisiones, tareas, nada', async () => {
  const m = con(await base(), { human: [], risks: [], channel: { items: [] }, status: { tarea: 'BL-091 — El Centro de mando' } });
  assert.deepEqual(mensaje(m), { cara: 'festeja', nivel: 'ok', texto: 'Nada te espera. Sigo con El Centro de mando.' });
  assert.equal(mensaje(con(m, { status: {} })).texto, 'Nada te espera. Todo en orden.');
  const alto = con(m, { risks: [{ id: 'RSK-9', estado: 'ABIERTO', severidad: 'ALTO', refs: [] }] });
  assert.equal(mensaje(alto).nivel, 'ok', 'un riesgo ALTO no es crítico: no freno nada');

  const t1 = con(m, { human: [item('BL-1', 'validacion', 'BL-001 — Mirar el Centro')] });
  assert.deepEqual(mensaje(t1), { cara: 'explica', nivel: 'info', texto: 'Nada que decidir. Te queda una cosa para mirar: «Mirar el Centro».' });
  const t2 = con(m, { human: [item('BL-1', 'accion', 'Subir la imagen'), item('BL-2', 'validacion', 'Mirar')] });
  assert.match(mensaje(t2).texto, /^Nada que decidir\. Te quedan 2 cosas para mirar; la primera: «Subir la imagen»\.$/);

  const d1 = con(t2, { human: [...t2.human, item('REQ-1', 'decision', '[REQ-001] ¿Lo publico?')] });
  assert.deepEqual(mensaje(d1), { cara: 'hola', nivel: 'warn', texto: 'Te espera una decisión: «¿Lo publico?». Mi recomendación está en la tarjeta.' });
  const d2 = con(d1, { human: [...d1.human, item('REQ-2', 'decision', 'Otra')] });
  assert.match(mensaje(d2).texto, /^Te esperan 2 decisiones\. Empezá por «¿Lo publico\?»/);

  const crit = con(d2, { risks: [{ id: 'RSK-1', estado: 'ABIERTO', severidad: 'CRÍTICO', refs: [] }, { id: 'RSK-2', estado: 'MITIGADO', severidad: 'CRÍTICO', refs: [] }] });
  assert.deepEqual(mensaje(crit), { cara: 'ojo', nivel: 'critical', texto: 'Hay un riesgo crítico abierto: freno todo hasta resolverlo.' });

  const fail = con(crit, { channel: { items: [{ state: 'failed' }, { state: 'failed' }, { state: 'processing' }] } });
  assert.deepEqual(mensaje(fail), { cara: 'ojo', nivel: 'critical', texto: '2 respuestas tuyas no se pudieron registrar. El motivo está en el aviso de arriba.' });
});

test('corto: títulos largos en palabra entera con «…»; los cortos, intactos', () => {
  assert.equal(corto('Hola'), 'Hola');
  const largo = 'BL-091 la estética de mi sitio en La Guarida y después en el Centro de mando, con mi globo, el gato y las poses';
  const c = corto(largo);
  assert.ok(c.length <= 81 && c.endsWith('…'), c);
  assert.ok(!/\s…$/.test(c) && largo.startsWith(c.slice(0, -1)), 'empieza igual');
  assert.match(largo.slice(c.length - 1), /^[^\p{L}\d]/u, 'corta en una palabra entera (después no sigue una letra)');
});

test('reacción del gato: festeja cuando baja lo pendiente, camina con algo nuevo o crítico', async () => {
  const m = con(await base(), { human: [item('A', 'accion', 'a'), item('B', 'accion', 'b')], risks: [], channel: { items: [] } });
  assert.equal(reaccion(null, m), null, 'primera lectura tranquila: no reacciona');
  assert.equal(reaccion({ pendientes: 2, nivel: 'info' }, m), null, 'nada cambió');
  assert.deepEqual(reaccion({ pendientes: 3, nivel: 'info' }, m), { pose: 'festeja', frase: '¡Una menos!' });
  assert.deepEqual(reaccion({ pendientes: 1, nivel: 'info' }, con(m, { human: [] })), { pose: 'festeja', frase: '¡Nada pendiente!' });
  assert.deepEqual(reaccion({ pendientes: 1, nivel: 'info' }, m), { pose: 'camina', frase: 'Llegó algo nuevo.' });
  const crit = con(m, { risks: [{ id: 'R', estado: 'ABIERTO', severidad: 'CRÍTICO', refs: [] }] });
  assert.deepEqual(reaccion(null, crit), { pose: 'camina', frase: 'Ojo con eso.' }, 'un crítico se avisa aunque sea la primera lectura');
  assert.equal(reaccion({ pendientes: 2, nivel: 'critical' }, crit), null, 'no repite el aviso en cada lectura');
});

/** Kit falso: registra lo que le piden. */
function fakeWin() {
  const calls = [];
  const clases = new Set();
  const ctrl = { decir: (t, c) => calls.push(['decir', t, c]), gato: (p, f) => calls.push(['gato', p, f]) };
  return {
    calls, clases,
    win: {
      document: { body: { classList: { add: c => clases.add(c) } } },
      ShiruvanaKit: {
        globo: o => { calls.push(['globo', o]); return ctrl; },
        posesSinFondo: o => calls.push(['poses', o.poses]),
      },
    },
  };
}

test('montarGlobo: lo crea una vez con su clave, después solo cambia lo que digo; reacciona solo a lecturas nuevas', async () => {
  _reset();
  const f = fakeWin();
  const m1 = con(await base(), { human: [item('A', 'accion', 'a'), item('B', 'accion', 'b')], risks: [], channel: { items: [] } });
  assert.ok(montarGlobo(m1, f.win));
  assert.equal(f.calls[0][0], 'globo');
  assert.equal(f.calls[0][1].storageKey, GLOBO_KEY);
  assert.equal(f.calls[0][1].texto, mensaje(m1).texto);
  assert.ok(f.clases.has('svk-con-globo'), 'marca el body para que las tarjetas no repitan mi cara');
  assert.deepEqual(f.calls.find(c => c[0] === 'poses'), ['poses', ['sentada']]);
  assert.ok(!f.calls.some(c => c[0] === 'gato'), 'primera lectura: el gato quieto');

  montarGlobo(m1, f.win); // cambio de vista con la misma lectura
  assert.equal(f.calls.filter(c => c[0] === 'globo').length, 1, 'un solo globo');
  assert.ok(!f.calls.some(c => c[0] === 'gato'));

  const m2 = con(m1, { human: [item('A', 'accion', 'a')] }); // respondiste una
  montarGlobo(m2, f.win);
  assert.deepEqual(f.calls.filter(c => c[0] === 'gato'), [['gato', 'festeja', '¡Una menos!']]);
  assert.deepEqual(f.calls.filter(c => c[0] === 'decir').at(-1), ['decir', mensaje(m2).texto, mensaje(m2).cara]);
  _reset();
});

test('montarGlobo: sin kit, sin modelo o con el kit roto, el panel sigue (devuelve null, no tira)', async () => {
  _reset();
  const m = await base();
  assert.equal(montarGlobo(m, {}), null);
  assert.equal(montarGlobo(null, fakeWin().win), null);
  const roto = { console: { warn() {} }, document: { body: { classList: { add() {} } } }, ShiruvanaKit: { globo() { throw new Error('kit roto'); } } };
  assert.doesNotThrow(() => montarGlobo(m, roto));
  assert.equal(montarGlobo(m, roto), null);
  _reset();
});

test('index.html: el kit se pide con versión fija, el JS antes que app.js y la hoja antes que universo', () => {
  const html = read('index.html');
  const js = html.indexOf('<script src="https://pablosnchz.github.io/shiruvana/kit/escena-kit.js?v=1.0.0" defer></script>');
  assert.ok(js > 0, 'kit JS con ?v=1.0.0 y defer');
  assert.ok(js < html.indexOf('<script type="module" src="js/app.js'), 'el kit antes que app.js');
  const css = html.indexOf('href="https://pablosnchz.github.io/shiruvana/kit/escena-kit.css?v=1.0.0"');
  assert.ok(css > 0 && css < html.indexOf('href="css/universo.css'), 'la hoja del kit antes que universo (universo puede ajustar)');
  const app = read('js/app.js');
  assert.match(app, /import \{ montarGlobo \} from '\.\/globo\.js';/);
  assert.match(app, /\$main\.innerHTML = html;\n\s*montarGlobo\(m\);/, 'se monta después de dibujar la vista');
});

test('universo.css: con globo, las tarjetas no repiten mi cara; sin kit, quedan como antes', () => {
  const css = read('css/universo.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(css, /body\.svk-con-globo \.decision \.gds-voice__avatar \{ display: none; \}/);
  assert.doesNotMatch(css, /(^|\})\s*\.decision \.gds-voice__avatar/, 'nunca sin la condición del globo');
  assert.match(css, /body\.svk-con-globo \.app-main \{ padding-bottom: 160px; \}/, 'el globo no tapa lo último');
  assert.match(css, /background-image: var\(--svk-p-sentada\)/, 'pose sin fondo del kit, nunca la imagen con fondo negro');
});
