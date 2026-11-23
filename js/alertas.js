/**
 * js/alertas.js — La salud de Shiruna en «Salud» (SH-4c).
 *
 * Su ciclo continuo (DEC-007 de Shiruna) tiene reglas: un paso por ciclo, tests completos antes de commitear,
 * nunca empujar en rojo ni borrar tests, y cada paso con el formato «BL-NNN paso X/Y — qué — tests N/N».
 * Acá miro si las cumple, con lo que ya leyó el panel (sus commits de hoy, su status.md y su backlog):
 * - critical · quieta: más de 2 h sin moverse con trabajo en cola (¿PC apagada o suspendida?).
 * - critical · en rojo: su último commit con tests dice que fallan.
 * - critical · tests que bajan: su último conteo es menor que uno anterior de hoy (¿borró tests?).
 * - warn · sin tests: un paso commiteado sin decir cuántos tests pasaron.
 * - warn · bloqueada: su status.md dice BLOQUEADA o tiene tareas en «Bloqueado».
 * - info · sin datos: no pude leer sus commits, o hay líneas de su backlog fuera de formato.
 * Sus alertas van en su propia sección y no se suman a mis chequeos: son de ella, con su nombre.
 * vestirAlertas: después de cada dibujo, solo en «Salud», antes de «De dónde salen los datos».
 */
import { esc } from './parse.js';
import { icon } from '../gds/icons.js';

export const ALERTAS_VERSION = '1.0.0';
const NIVEL = {
  critical: { variant: 'danger', icon: 'octagon', label: 'Crítico' },
  warn: { variant: 'warning', icon: 'alert', label: 'Para revisar' },
  info: { variant: 'info', icon: 'info', label: 'Informativo' },
  ok: { variant: 'success', icon: 'check', label: 'En orden' },
};
const corto = (sha) => String(sha || '').slice(0, 7);

/**
 * @param pulso   su día (buildPulso): commits de hoy ya leídos, vida y cola.
 * @param h       su modelo (buildHija): estado y motivo declarados.
 * @param tablero su tablero (buildTablero): bloqueadas y líneas fuera de formato.
 * @returns null si no hay hija leída; si no, { nombre, key, nivel, checks: [{ id, level, title, detail, source }] }.
 */
export function buildAlertas({ pulso, h, tablero } = {}) {
  if (!h || !h.leida) return null;
  const checks = [];
  const add = (id, level, title, detail, source) => checks.push({ id, level, title, detail: detail || null, source });
  const n = h.nombre;

  if (pulso && pulso.vida && pulso.vida.level === 'critical') {
    add('hija:quieta', 'critical', `${n} no se mueve con trabajo en cola`,
      `${pulso.vida.text} Tiene ${pulso.enCola} en cola. Su ciclo corre cada 30 min: si la PC duerme, no avanza.`, 'medido');
  }
  const conTests = ((pulso && pulso.items) || []).filter(c => c.total != null);
  if (conTests.length) {
    const ult = conTests[0];
    if (ult.pass !== ult.total) {
      add('hija:rojo', 'critical', `${n} commiteó con tests en rojo`,
        `Su último conteo es ${ult.pass}/${ult.total} (${corto(ult.sha)}). Su regla es no empujar nunca en rojo.`, 'medido');
    }
    const max = Math.max(...conTests.slice(1).map(c => c.total));
    if (conTests.length > 1 && ult.total < max) {
      add('hija:bajan', 'critical', `A ${n} le bajaron los tests`,
        `Hoy llegó a ${max} y su último commit dice ${ult.total} (${corto(ult.sha)}). Su regla es no borrar tests.`, 'medido');
    }
  }
  const sinTests = ((pulso && pulso.items) || []).filter(c => c.paso != null && c.total == null);
  if (sinTests.length) {
    add('hija:sintests', 'warn', sinTests.length === 1 ? `${n} commiteó un paso sin decir sus tests` : `${n} commiteó ${sinTests.length} pasos sin decir sus tests`,
      `El formato es «BL-NNN paso X/Y — qué — tests N/N». ${sinTests.slice(0, 3).map(c => corto(c.sha)).join(', ')}${sinTests.length > 3 ? '…' : ''}`, 'medido');
  }
  const bloq = (tablero && tablero.leido && tablero.BLOCKED) || [];
  const declarada = h.estado && h.estado.text === 'Bloqueada';
  if (declarada || bloq.length) {
    const partes = [];
    if (declarada) partes.push(`Su estado dice BLOQUEADA${h.motivo ? ': ' + String(h.motivo).replace(/\.?\s*$/, '.') : '.'}`);
    if (bloq.length) partes.push(`En «Bloqueado»: ${bloq.map(b => b.id).join(', ')}.`);
    add('hija:bloqueada', 'warn', `${n} está trabada`, partes.join(' '), 'declarado');
  }
  if (pulso && pulso.leidos === false) {
    add('hija:sincommits', 'info', `No pude leer los commits de ${n}`, 'La API de GitHub no respondió: las alertas de tests no se pudieron revisar. Vuelvo a intentar en la próxima lectura.', 'medido');
  }
  if (tablero && tablero.leido && tablero.malformadas) {
    add('hija:formato', 'info', `${tablero.malformadas === 1 ? '1 línea' : tablero.malformadas + ' líneas'} de su backlog fuera de formato`,
      'No se muestran en su tablero.', 'declarado');
  }
  // Se agregan ya de lo más grave a lo menos (los tests lo vigilan): el primero da el nivel.
  return { nombre: n, key: h.key, nivel: checks.length ? checks[0].level : 'ok', checks };
}

function chip(level, text) {
  const L = NIVEL[level] || NIVEL.info;
  return `<span class="gds-status gds-status--${L.variant}">${icon(L.icon)}${esc(text || L.label)}</span>`;
}

/** La sección «Salud de Shiruna». */
export function renderAlertas(a) {
  if (!a) return '';
  const L = NIVEL[a.nivel];
  const resumen = a.nivel === 'ok' ? 'Todo en orden' : a.nivel === 'critical' ? 'Hay algo crítico' : a.nivel === 'warn' ? 'Hay algo para revisar' : 'Solo avisos';
  const cuerpo = a.checks.length
    ? `<ul class="gds-list">${a.checks.map(c => `<li class="gds-list__item" data-alerta="${esc(c.id)}">${icon(NIVEL[c.level].icon, 'is-' + NIVEL[c.level].variant)}<div class="gds-stack--sm gds-stack">
        <p class="gds-label-1">${chip(c.level)} ${esc(c.title)}</p>
        ${c.detail ? `<p class="gds-body-2 gds-text-secondary">${esc(c.detail)}</p>` : ''}
        <p class="gds-caption gds-text-muted">${c.source === 'medido' ? 'Medido en GitHub' : `Declarado en su memoria`}</p></div></li>`).join('')}</ul>`
    : `<p class="gds-body-2 gds-text-secondary">Se mueve, sus tests están en verde y no está trabada.</p>`;
  return `<section class="gds-card uv-nivel uv-nivel--${a.nivel} uv-salud-hija" aria-labelledby="salud-hija-title" data-duena="${esc(a.key)}">
    <p class="uv-ante uv-ante--t">La salud de ${esc(a.nombre)}</p>
    <div class="gds-card__header">
      <h2 id="salud-hija-title" class="gds-title-1">${icon(L.icon, 'is-' + L.variant)} ¿Cómo está ${esc(a.nombre)}?</h2>
      <p class="gds-cluster">${chip(a.nivel, resumen)}</p>
    </div>
    ${cuerpo}
    <p class="gds-caption gds-text-muted">Sus reglas de trabajo continuo, revisadas en cada lectura. No se suman a mis chequeos.</p>
  </section>`;
}

/** Después de cada dibujo: solo en «Salud», antes de «De dónde salen los datos». Una sola vez; nunca rompe. */
export function vestirAlertas(root, a) {
  try {
    if (!root || typeof root.querySelector !== 'function' || !a) return;
    if (root.querySelector('.uv-salud-hija')) return;
    const fuentes = root.querySelector('section[aria-labelledby="sources-title"]');
    if (!fuentes) return;
    fuentes.insertAdjacentHTML('beforebegin', renderAlertas(a));
  } catch { /* nunca rompe el panel */ }
}
