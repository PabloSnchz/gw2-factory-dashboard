/**
 * js/sudia.js — «El día de Shiruna» en «Actividad» (SH-4d).
 *
 * «Hoy hizo» (js/pulso.js) dice qué hizo; acá se ve CÓMO fue su día, que es lo que importa de un ciclo continuo:
 * - Desde cuándo y hasta cuándo se movió, cuántos commits, pasos y tareas cerradas.
 * - Sus tests al empezar y al terminar el día (si suben, está sumando pruebas).
 * - Las pausas largas: más de 45 min entre dos commits (su ciclo corre cada 30 min). Si la última sigue abierta
 *   y tiene trabajo en cola, se marca: es la señal de que la PC duerme o el ciclo no corre.
 * - Todos sus commits del día como línea de tiempo: 5 a la vista y el resto plegado (js/plegar.js).
 * Usa lo que ya leyó el panel (sus commits desde la medianoche de Buenos Aires): ninguna llamada nueva a la API.
 * vestirDia: después de cada dibujo, solo en «Actividad», debajo de la cabecera.
 */
import { esc } from './parse.js';
import { UMBRAL } from './pulso.js';
import { plegarColumna } from './plegar.js';

export const SUDIA_VERSION = '1.0.0';
const MIN = 60000;

/** 95 min → «1 h 35 min». */
export function duracion(ms) {
  const min = Math.max(0, Math.round(ms / MIN));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/**
 * @param pulso su día (buildPulso): items del más nuevo al más viejo, enCola, leidos.
 * @param now   ahora (ms).
 * @returns null sin pulso; si no, el resumen del día.
 */
export function buildDia({ pulso, now, nombre = 'Shiruna', key = 'shiruna' } = {}) {
  if (!pulso) return null;
  const items = pulso.items || [];
  const asc = [...items].sort((a, b) => a.t - b.t);
  const pausas = [];
  for (let i = 1; i < asc.length; i++) {
    const ms = asc[i].t - asc[i - 1].t;
    if (ms > UMBRAL.activaMs) pausas.push({ desde: asc[i - 1].t, hasta: asc[i].t, ms, abierta: false });
  }
  if (asc.length && now - asc[asc.length - 1].t > UMBRAL.activaMs && pulso.enCola > 0) {
    const desde = asc[asc.length - 1].t;
    pausas.push({ desde, hasta: null, ms: now - desde, abierta: true });
  }
  const conTests = asc.filter(c => c.total != null);
  return {
    nombre, key,
    leidos: pulso.leidos !== false,
    commits: asc.length,
    pasos: pulso.pasos || 0,
    cerradas: (pulso.cerradas || []).length,
    primero: asc.length ? asc[0].t : null,
    ultimo: asc.length ? asc[asc.length - 1].t : null,
    tests: conTests.length ? { desde: conTests[0].total, hasta: conTests[conTests.length - 1].total } : null,
    pausas: pausas.sort((a, b) => b.desde - a.desde),
    items,
  };
}

const hora = (t) => new Date(t).toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false });

function cifra(n, label) {
  return `<p class="uv-cifra${n ? '' : ' uv-cifra--cero'}"><b>${n}</b><span>${esc(label)}</span></p>`;
}

function linea(c, url) {
  const que = c.paso != null
    ? `<strong>${esc(c.bl || 'Paso')}</strong> · paso ${c.paso}/${c.de}${c.que ? ' · ' + esc(c.que) : ''}`
    : esc(c.texto);
  const tests = c.total != null ? ` <span class="gds-caption gds-text-muted">· tests ${c.pass}/${c.total}</span>` : '';
  const link = c.sha ? ` <a class="gds-ref" href="${esc(url)}/commit/${esc(c.sha)}" target="_blank" rel="noopener">${esc(String(c.sha).slice(0, 7))}</a>` : '';
  return `<li class="gds-timeline__item"><span class="gds-timeline__time">${esc(hora(c.t))}</span><span>${que}${tests}${link}</span></li>`;
}

/** La sección «El día de Shiruna». `repoUrl`: https://github.com/<owner>/<repo>. */
export function renderDia(d, repoUrl) {
  if (!d) return '';
  const head = `<p class="uv-ante uv-ante--t">El día de ${esc(d.nombre)}</p>`;
  if (!d.leidos) {
    return `<section class="gds-card uv-dia-hija" aria-labelledby="dia-hija-title" data-duena="${esc(d.key)}">${head}
      <h2 id="dia-hija-title" class="gds-title-1">No pude leer los commits de ${esc(d.nombre)}</h2>
      <p class="gds-body-2 gds-text-secondary">La API de GitHub no respondió. Vuelvo a intentar en la próxima lectura.</p></section>`;
  }
  if (!d.commits) {
    return `<section class="gds-card uv-dia-hija" aria-labelledby="dia-hija-title" data-duena="${esc(d.key)}">${head}
      <h2 id="dia-hija-title" class="gds-title-1">${esc(d.nombre)} todavía no se movió hoy</h2>
      <p class="gds-body-2 gds-text-secondary">El día se cuenta desde la medianoche de Buenos Aires.</p></section>`;
  }
  const rango = d.primero === d.ultimo ? `a las ${hora(d.primero)}` : `de ${hora(d.primero)} a ${hora(d.ultimo)}`;
  const tests = d.tests
    ? (d.tests.hasta > d.tests.desde ? `Sus tests pasaron de ${d.tests.desde} a ${d.tests.hasta}.`
      : d.tests.hasta < d.tests.desde ? `Sus tests bajaron de ${d.tests.desde} a ${d.tests.hasta}.`
        : `Sus tests se mantienen en ${d.tests.hasta}.`)
    : 'Ningún commit de hoy dice sus tests.';
  const pausas = d.pausas.length
    ? `<ul class="gds-list">${d.pausas.map(p => `<li class="gds-list__item"><div class="gds-stack--sm gds-stack"><p class="gds-body-2">${p.abierta
      ? `<span class="gds-status gds-status--warning">Sigue en pausa</span> desde las ${esc(hora(p.desde))} · ${esc(duracion(p.ms))}, con trabajo en cola`
      : `De ${esc(hora(p.desde))} a ${esc(hora(p.hasta))} · ${esc(duracion(p.ms))}`}</p></div></li>`).join('')}</ul>`
    : '<p class="gds-body-2 gds-text-secondary">Sin pausas largas: avanzó a ritmo de ciclo.</p>';
  const lis = d.items.map(c => linea(c, repoUrl));
  const timeline = plegarColumna(lis, { nombre: `Commits de ${d.nombre}`, clase: 'gds-timeline uv-linea' });
  return `<section class="gds-card uv-dia-hija" aria-labelledby="dia-hija-title" data-duena="${esc(d.key)}">${head}
    <div class="gds-card__header">
      <h2 id="dia-hija-title" class="gds-title-1">Hoy trabajó ${esc(rango)}</h2>
      <span class="gds-caption gds-text-muted">Su ciclo corre cada 30 min: una pausa es más de 45 min sin commits.</span>
    </div>
    <div class="uv-cifras" role="group" aria-label="El día de ${esc(d.nombre)}, en números">${[
      cifra(d.commits, d.commits === 1 ? 'commit' : 'commits'), cifra(d.pasos, d.pasos === 1 ? 'paso' : 'pasos'),
      cifra(d.cerradas, d.cerradas === 1 ? 'tarea cerrada' : 'tareas cerradas'), cifra(d.pausas.length, d.pausas.length === 1 ? 'pausa larga' : 'pausas largas'),
    ].join('')}</div>
    <p class="gds-body-2">${esc(tests)}</p>
    <h3 class="gds-title-2">Pausas largas</h3>
    ${pausas}
    <h3 class="gds-title-2">Sus commits de hoy</h3>
    ${timeline}
  </section>`;
}

/** Después de cada dibujo: solo en «Actividad» (la de los períodos), debajo de la cabecera. Una vez; nunca rompe. */
export function vestirDia(root, d, repoUrl) {
  try {
    if (!root || typeof root.querySelector !== 'function' || !d) return;
    if (!root.querySelector('nav[aria-label="Período"]') || root.querySelector('.uv-dia-hija')) return;
    const head = root.querySelector('header.uv-head');
    if (!head) return;
    head.insertAdjacentHTML('afterend', renderDia(d, repoUrl));
  } catch { /* nunca rompe el panel */ }
}
