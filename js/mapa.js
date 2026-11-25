/**
 * js/mapa.js — «El mapa de las dos» (BL-105): cómo estamos armadas Shiruvana y Shiruna. v1.1.0
 *
 * Fuente de datos: una parte por agente (mapa/shiruvana.json, mapa/shiruna-borrador.json). Cada nodo es una
 * persona, una agente, una PC, un repo, producción, otro dominio o una automatización; cada flujo une dos nodos.
 * La parte de Shiruna es un borrador mío hasta que ella publique la suya en su repo (MAP-3).
 *
 * MAP-2 (1.1.0): estados en vivo. aplicarVivo() (pura) toma el mapa declarado y lo corrige con lo medido:
 * - Automatizaciones: la última corrida de su workflow en GitHub Actions. Los repos que se pueden leer llevan
 *   `repo` en el JSON; una llamada por repo (las últimas 100 corridas), solo al abrir el Mapa, cacheada 10 min
 *   en un casillero fijo como el resto del panel. Falló → «Con problemas»; sin corridas → queda lo declarado.
 * - Pablo, yo, Shiruna, su ciclo y la PC SHIRUVANA: con lo que el panel ya leyó de las dos memorias (sin cuota):
 *   lo que te espera en «Hoy», mi estado, su salud (alertas.js) y su pulso (pulso.js).
 * - Un repo toma el peor estado medido de sus automatizaciones.
 * Cada ficha dice «Ahora:» y de dónde sale el dato (medido en GitHub, leído de una memoria o declarado).
 *
 * - SVG propio, sin librerías. Funciones puras (datos → HTML) para poder testearlas; montarMapa() solo
 *   lee los archivos y conecta clics y teclado.
 * - Accesibilidad: cada nodo es un botón (tabindex, role, aria-label con nombre y estado); el estado va con
 *   símbolo y texto, nunca solo color; el mapa también se puede leer como lista.
 * - Todo texto de los archivos se escapa antes de entrar al HTML.
 */

import { pageHead } from './views.js';
import { SHIRUVANA_AVATAR } from '../gds/voice.js';

export const MAPA_ARCHIVOS = ['mapa/shiruvana.json', 'mapa/shiruna-borrador.json'];
export const LIENZO = { ancho: 1200, alto: 640 };

/** Medidas de cada tipo de nodo (en unidades del lienzo). */
export const TIPOS = {
  persona: { w: 210, h: 64, rotulo: 'Persona' },
  agente: { w: 230, h: 72, rotulo: 'Agente' },
  pc: { w: 170, h: 56, rotulo: 'PC' },
  repo: { w: 150, h: 52, rotulo: 'Repositorio' },
  prd: { w: 180, h: 52, rotulo: 'Producción' },
  externo: { w: 170, h: 48, rotulo: 'Otro dominio' },
  auto: { w: 150, h: 30, rotulo: 'Automatización' },
};

/** Estados: símbolo + texto (WCAG 1.4.1). */
export const ESTADOS = {
  ok: { simbolo: '✓', texto: 'Funcionando' },
  espera: { simbolo: '…', texto: 'Esperando a Pablo' },
  revisar: { simbolo: '?', texto: 'Para revisar' },
  alerta: { simbolo: '!', texto: 'Con problemas' },
  pausa: { simbolo: '‖', texto: 'En pausa' },
  externo: { simbolo: '↗', texto: 'Fuera de mi dominio' },
};

export const FLUJOS = {
  orden: 'Orden o pedido', comando: 'Comando', publica: 'Publica', lee: 'Lee',
  vive: 'Corre en', control: 'Control', decide: 'Decide', externo: 'Otro dominio',
};

export const DUENAS = { shiruvana: 'Shiruvana', shiruna: 'Shiruna', pablo: 'Pablo', otros: 'Otros agentes' };

const FILTROS = [
  ['todo', 'Todo'], ['flujos', 'Flujos'], ['auto', 'Automatizaciones'], ['shiruvana', 'Solo Shiruvana'], ['shiruna', 'Solo Shiruna'],
];

const CARAS = { pablo: 'assets/pablo/pablo-cara.webp', shiruna: 'assets/shiruna/shiruna-cara.webp', shiruvana: SHIRUVANA_AVATAR };

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ------------------------------------------------------------ datos */

/** Une las partes en un solo mapa. Los nodos de una parte en borrador quedan marcados. */
export function unirMapa(partes) {
  const nodos = [], flujos = [], fuentes = [];
  for (const p of partes || []) {
    if (!p || !Array.isArray(p.nodos)) continue;
    fuentes.push({ parte: p.parte, autora: p.autora, version: p.version, actualizado: p.actualizado, borrador: !!p.borrador, fuente: p.fuente });
    for (const n of p.nodos) nodos.push({ ...n, borrador: !!p.borrador });
    for (const f of p.flujos || []) flujos.push({ ...f, borrador: !!p.borrador });
  }
  return { nodos, flujos, fuentes };
}

/** Problemas de forma del mapa (lista vacía = sano). La usan los tests y montarMapa avisa si hay. */
export function validarMapa(m) {
  const errores = [];
  const ids = new Map();
  for (const n of m.nodos) {
    if (!n.id || ids.has(n.id)) errores.push(`id repetido o vacío: ${n.id}`);
    ids.set(n.id, n);
    if (!TIPOS[n.tipo]) errores.push(`${n.id}: tipo desconocido ${n.tipo}`);
    if (!ESTADOS[n.estado]) errores.push(`${n.id}: estado desconocido ${n.estado}`);
    if (!DUENAS[n.duena]) errores.push(`${n.id}: dueña desconocida ${n.duena}`);
    if (!n.nombre || !n.ficha || !n.ficha.que) errores.push(`${n.id}: falta nombre o ficha.que`);
    if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) errores.push(`${n.id}: sin posición`);
  }
  for (const n of m.nodos) {
    if (n.tipo === 'auto' && !ids.has(n.padre)) errores.push(`${n.id}: padre inexistente ${n.padre}`);
    const t = TIPOS[n.tipo];
    if (!t) continue;
    const c = caja(n);
    if (c.x0 < 0 || c.y0 < 0 || c.x1 > LIENZO.ancho || c.y1 > LIENZO.alto) errores.push(`${n.id}: fuera del lienzo`);
  }
  for (const f of m.flujos) {
    if (!ids.has(f.de) || !ids.has(f.a)) errores.push(`flujo ${f.de} → ${f.a}: nodo inexistente`);
    if (!FLUJOS[f.tipo]) errores.push(`flujo ${f.de} → ${f.a}: tipo desconocido ${f.tipo}`);
  }
  const lista = m.nodos.filter(n => TIPOS[n.tipo]);
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a = caja(lista[i]), b = caja(lista[j]);
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) errores.push(`se pisan: ${lista[i].id} y ${lista[j].id}`);
    }
  }
  return errores;
}

/** Caja de un nodo: (x, y) es su centro. */
export function caja(n) {
  const t = TIPOS[n.tipo] || TIPOS.repo;
  return { x0: n.x - t.w / 2, y0: n.y - t.h / 2, x1: n.x + t.w / 2, y1: n.y + t.h / 2, w: t.w, h: t.h };
}

/** Punto del borde de la caja de n en dirección a (tx, ty). */
function borde(n, tx, ty) {
  const c = caja(n);
  const dx = tx - n.x, dy = ty - n.y;
  if (!dx && !dy) return { x: n.x, y: n.y };
  const s = Math.min(dx ? (c.w / 2) / Math.abs(dx) : Infinity, dy ? (c.h / 2) / Math.abs(dy) : Infinity);
  return { x: n.x + dx * s, y: n.y + dy * s };
}

/**
 * Recorrido de un flujo: recta de borde a borde, o curva si el flujo trae `curva` (desvío en unidades).
 * El rótulo va en el punto `t` del recorrido (0 = origen, 1 = destino; por defecto la mitad).
 */
export function recorrido(de, a, curva = 0, t = 0.5) {
  const mx = (de.x + a.x) / 2, my = (de.y + a.y) / 2;
  const len = Math.hypot(a.x - de.x, a.y - de.y) || 1;
  const cx = mx + (-(a.y - de.y) / len) * curva, cy = my + ((a.x - de.x) / len) * curva;
  const p0 = borde(de, curva ? cx : a.x, curva ? cy : a.y);
  const p1 = borde(a, curva ? cx : de.x, curva ? cy : de.y);
  const r = v => Math.round(v * 10) / 10;
  if (!curva) return { d: `M${r(p0.x)} ${r(p0.y)} L${r(p1.x)} ${r(p1.y)}`, lx: r(p0.x + (p1.x - p0.x) * t), ly: r(p0.y + (p1.y - p0.y) * t), p0, p1, c: null };
  const u = 1 - t;
  const lx = u * u * p0.x + 2 * u * t * cx + t * t * p1.x, ly = u * u * p0.y + 2 * u * t * cy + t * t * p1.y;
  return { d: `M${r(p0.x)} ${r(p0.y)} Q${r(cx)} ${r(cy)} ${r(p1.x)} ${r(p1.y)}`, lx: r(lx), ly: r(ly), p0, p1, c: { x: cx, y: cy } };
}

/** Puntos a lo largo del recorrido (para el test de que ningún flujo atraviesa otro nodo). */
export function muestras(rc, n = 40) {
  const out = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (!rc.c) out.push({ x: rc.p0.x + (rc.p1.x - rc.p0.x) * t, y: rc.p0.y + (rc.p1.y - rc.p0.y) * t });
    else out.push({ x: (1 - t) ** 2 * rc.p0.x + 2 * (1 - t) * t * rc.c.x + t * t * rc.p1.x, y: (1 - t) ** 2 * rc.p0.y + 2 * (1 - t) * t * rc.c.y + t * t * rc.p1.y });
  }
  return out;
}

/** Caja aproximada del rótulo de un flujo (11 unidades de letra: ~5.8 por carácter). */
export function cajaRotulo(texto, rc) {
  const w = String(texto).length * 5.8 + 10, h = 16;
  return { x0: rc.lx - w / 2, x1: rc.lx + w / 2, y0: rc.ly - h / 2 - 4, y1: rc.ly + h / 2 - 4 };
}

export function cifrasMapa(m) {
  const cuenta = t => m.nodos.filter(n => n.tipo === t).length;
  const problemas = m.nodos.filter(n => n.estado === 'alerta' || n.estado === 'revisar').length;
  return [[cuenta('agente'), 'agentes'], [cuenta('repo') + cuenta('prd'), 'repositorios'], [cuenta('auto'), 'automatizaciones'],
    [m.flujos.length, 'flujos'], [problemas, 'para mirar']];
}

/* ------------------------------------------------------------ en vivo (MAP-2) */

export const FUENTES = {
  github: 'Medido en GitHub Actions',
  memoria: 'Leído de nuestras memorias en esta lectura',
  declarado: 'Como lo declaré en el mapa (no se puede medir desde el panel)',
};
const MALO = new Set(['failure', 'timed_out', 'startup_failure']);
const BUENO = new Set(['success']);
const PEOR = ['alerta', 'revisar', 'espera', 'ok'];

/** Solo lo que uso de cada corrida (lo que se guarda en la caché). */
export function formaRuns(full) {
  const l = full && Array.isArray(full.workflow_runs) ? full.workflow_runs : [];
  return l.slice(0, 100).map(r => ({
    f: String((r && r.path) || '').replace(/@.*$/, '').split('/').pop(),
    s: r && r.status, c: r && r.conclusion, t: r && (r.updated_at || r.created_at), u: r && r.html_url,
  })).filter(r => r.f);
}

/** La última corrida terminada (bien o mal) de un workflow, y si hay una corriendo ahora. Las corridas vienen de la más nueva a la más vieja. */
export function ultimaCorrida(runs, archivo) {
  let corriendo = false;
  for (const r of runs || []) {
    if (r.f !== archivo) continue;
    if (r.s && r.s !== 'completed') { corriendo = true; continue; }
    if (MALO.has(r.c) || BUENO.has(r.c)) return { corriendo, ultima: r };
  }
  return { corriendo, ultima: null };
}

const punto = s => (/[.!?…]$/.test(String(s || '').trim()) ? String(s).trim() : `${String(s || '').trim()}.`);

export function hace(now, t) {
  const ms = now - Date.parse(t);
  if (!Number.isFinite(ms)) return 'sin fecha';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
}

/**
 * El mapa con los estados de ahora. Pura: no toca el mapa que recibe.
 * @param runs  { 'Owner/repo': [corridas de formaRuns] } — solo los repos que se pudieron leer.
 * @param model el modelo del panel (human, statusInfo, health, alertas, pulso), o null.
 */
export function aplicarVivo(m, { runs = {}, model = null, now = Date.now() } = {}) {
  const nodos = m.nodos.map(n => ({ ...n, declarado: n.estado, vivo: null }));
  const ids = new Map(nodos.map(n => [n.id, n]));
  const marcar = (n, estado, nota, fuente, enlace) => { if (n) { n.estado = estado; n.vivo = { nota, fuente, enlace: enlace || null }; } };

  for (const n of nodos) {
    if (n.tipo !== 'auto') continue;
    const padre = ids.get(n.padre);
    const lista = padre && padre.repo ? runs[padre.repo] : null;
    const archivos = String((n.ficha && n.ficha.workflow) || '').split('·').map(s => s.trim()).filter(Boolean);
    if (!Array.isArray(lista) || !archivos.length) continue;
    const res = archivos.map(f => ({ f, ...ultimaCorrida(lista, f) }));
    const mal = res.find(x => x.ultima && MALO.has(x.ultima.c));
    const vistas = res.filter(x => x.ultima).sort((a, b) => Date.parse(b.ultima.t) - Date.parse(a.ultima.t));
    const ahora = res.some(x => x.corriendo) ? 'Corriendo ahora. ' : '';
    if (mal) marcar(n, 'alerta', `${ahora}Falló la última corrida de ${mal.f} (${hace(now, mal.ultima.t)}).`, 'github', mal.ultima.u);
    else if (vistas.length) marcar(n, 'ok', `${ahora}Última corrida bien: ${vistas[0].f}, ${hace(now, vistas[0].ultima.t)}.`, 'github', vistas[0].ultima.u);
    else if (ahora) marcar(n, 'ok', 'Corriendo ahora.', 'github');
    else n.vivo = { nota: 'Sin corridas entre las últimas 100 del repo: queda como lo declaré.', fuente: 'declarado', enlace: null };
  }

  if (model) {
    const pendientes = (model.human || []).length;
    const pablo = ids.get('pablo');
    if (pendientes) marcar(pablo, 'espera', `Te ${pendientes === 1 ? 'espera 1 cosa' : `esperan ${pendientes} cosas`} en «Hoy».`, 'memoria');
    else marcar(pablo, 'ok', 'Nada te espera en «Hoy».', 'memoria');

    const code = String((model.statusInfo && model.statusInfo.code) || '');
    const yo = ids.get('shiruvana');
    if (/BLOQUEAD/i.test(code)) marcar(yo, 'alerta', 'Estoy bloqueada: lo explico en «Hoy».', 'memoria');
    else if (model.health && model.health.level === 'critical') marcar(yo, 'alerta', 'Mi salud tiene algo crítico: está en «Salud».', 'memoria');
    else if (/ESPERANDO/i.test(code)) marcar(yo, 'espera', 'Terminé algo y espero tu validación.', 'memoria');
    else marcar(yo, 'ok', code ? `Mi estado: ${code.replace(/_/g, ' ').toLowerCase()}.` : 'Sin dato de mi estado.', 'memoria');

    const a = model.alertas, p = model.pulso;
    const hija = ids.get('shiruna');
    if (a) {
      const c = a.checks && a.checks[0];
      if (a.nivel === 'critical') marcar(hija, 'alerta', punto(c.title), 'memoria');
      else if (a.nivel === 'warn') marcar(hija, 'revisar', punto(c.title), 'memoria');
      else marcar(hija, 'ok', c ? punto(c.title) : 'Se mueve, sus tests están en verde y no está trabada.', 'memoria');
    }
    if (p && p.vida) {
      const v = p.vida;
      const ciclo = ids.get('a-ciclo');
      marcar(ciclo, v.level === 'critical' ? 'alerta' : v.level === 'warn' ? 'revisar' : 'ok', punto(v.text), 'memoria');
      if (v.level === 'critical') marcar(ids.get('pc-shiruvana'), 'revisar', 'Shiruna no se mueve hace más de 2 h con trabajo en cola: ¿la PC está apagada o suspendida?', 'memoria');
    }
  }

  // Un repo (o producción) toma el peor estado medido de sus automatizaciones.
  for (const n of nodos) {
    const hijos = nodos.filter(x => x.padre === n.id && x.vivo && x.vivo.fuente !== 'declarado');
    if (!hijos.length || n.declarado === 'pausa') continue;
    const peor = hijos.map(x => x.estado).sort((x, y) => PEOR.indexOf(x) - PEOR.indexOf(y))[0];
    const malos = hijos.filter(x => x.estado === 'alerta' || x.estado === 'revisar');
    if (malos.length) marcar(n, peor, `${malos.length === 1 ? 'Una de sus automatizaciones' : `${malos.length} de sus automatizaciones`} pide atención: ${malos.map(x => x.nombre).join(', ')}.`, hijos[0].vivo.fuente);
    else marcar(n, 'ok', `Sus automatizaciones medidas andan bien (${hijos.length}).`, hijos[0].vivo.fuente);
  }
  return { ...m, nodos, vivo: { repos: Object.keys(runs), leido: !!model } };
}

/* ------------------------------------------------------------ dibujo */

function nodoSvg(n) {
  const c = caja(n), e = ESTADOS[n.estado] || ESTADOS.ok, t = TIPOS[n.tipo];
  const etiqueta = `${n.nombre}. ${t.rotulo}${n.sub ? ', ' + n.sub : ''}. ${e.texto}${n.borrador ? '. Borrador' : ''}.`;
  const cara = CARAS[n.cara];
  const tx = cara ? c.x0 + 66 : n.x;
  const ancla = cara ? 'start' : 'middle';
  const r = v => Math.round(v * 10) / 10;
  let texto;
  if (n.tipo === 'auto') {
    texto = `<text class="mp-n__nombre mp-n__nombre--auto" x="${n.x}" y="${r(n.y + 4)}" text-anchor="middle">${esc(n.nombre)}</text>`;
  } else {
    texto = `<text class="mp-n__nombre" x="${r(tx)}" y="${r(n.y - 3)}" text-anchor="${ancla}">${esc(n.nombre)}</text>`
      + (n.sub ? `<text class="mp-n__sub" x="${r(tx)}" y="${r(n.y + 15)}" text-anchor="${ancla}">${esc(n.sub)}</text>` : '');
  }
  return `<g class="mp-n mp-n--${n.tipo} mp-e--${n.estado}${n.borrador ? ' mp-n--borrador' : ''}" data-id="${esc(n.id)}" data-tipo="${n.tipo}" data-de-quien="${esc(n.duena)}"${n.padre ? ` data-padre="${esc(n.padre)}"` : ''} tabindex="0" role="button" aria-pressed="false" aria-label="${esc(etiqueta)}">
    <rect class="mp-n__caja" x="${r(c.x0)}" y="${r(c.y0)}" width="${c.w}" height="${c.h}" rx="${n.tipo === 'auto' ? 15 : 12}"/>
    ${cara ? `<image class="mp-n__cara" href="${esc(cara)}" x="${r(c.x0 + 12)}" y="${r(n.y - 22)}" width="44" height="44" clip-path="url(#mp-redondo)" preserveAspectRatio="xMidYMid slice"/>` : ''}
    ${texto}
    <g class="mp-n__insignia" aria-hidden="true"><circle cx="${r(c.x1 - 4)}" cy="${r(c.y0 + 2)}" r="${n.tipo === 'auto' ? 7 : 9}"/><text class="mp-n__estado" x="${r(c.x1 - 4)}" y="${r(c.y0 + 6)}" text-anchor="middle">${e.simbolo}</text></g>
  </g>`;
}

function rielesSvg(m) {
  const porPadre = new Map();
  for (const n of m.nodos) if (n.tipo === 'auto') porPadre.set(n.padre, [...(porPadre.get(n.padre) || []), n]);
  const ids = new Map(m.nodos.map(n => [n.id, n]));
  return [...porPadre.entries()].map(([pid, hijos]) => {
    const p = ids.get(pid);
    if (!p) return '';
    const ultimo = Math.max(...hijos.map(h => h.y));
    return `<line class="mp-riel" data-padre="${esc(pid)}" x1="${p.x}" y1="${caja(p).y1}" x2="${p.x}" y2="${ultimo}"/>`;
  }).join('');
}

function flujoSvg(f, i, ids) {
  const de = ids.get(f.de), a = ids.get(f.a);
  if (!de || !a) return '';
  const rc = recorrido(de, a, f.curva || 0, f.t ?? 0.5);
  return `<g class="mp-f mp-f--${f.tipo}${f.borrador ? ' mp-f--borrador' : ''}" data-de="${esc(f.de)}" data-a="${esc(f.a)}">
    <path class="mp-f__linea" d="${rc.d}" marker-end="url(#mp-punta)"/>
    <text class="mp-f__texto${f.rotulo === 'al-tocar' ? ' mp-f__texto--tocar' : ''}" x="${rc.lx}" y="${rc.ly}" text-anchor="middle"><title>${esc(FLUJOS[f.tipo] || '')}</title>${esc(f.texto)}</text>
  </g>`;
}

export function dibujarMapa(m) {
  const ids = new Map(m.nodos.map(n => [n.id, n]));
  return `<svg class="mp-svg" viewBox="0 0 ${LIENZO.ancho} ${LIENZO.alto}" role="group" aria-label="Mapa de Shiruvana y Shiruna: ${m.nodos.length} nodos y ${m.flujos.length} flujos" focusable="false">
    <defs>
      <clipPath id="mp-redondo" clipPathUnits="objectBoundingBox"><circle cx="0.5" cy="0.5" r="0.5"/></clipPath>
      <marker id="mp-punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="mp-punta" d="M0 0 L10 5 L0 10 z"/></marker>
    </defs>
    <g class="mp-zonas" aria-hidden="true">
      <text class="mp-zona" x="20" y="18">Otros agentes de Pablo</text>
      <text class="mp-zona" x="775" y="18">Producción · de Pablo</text>
      <text class="mp-zona" x="10" y="330">Lo de Shiruvana</text>
      <text class="mp-zona" x="820" y="330">Lo de Shiruna</text>
    </g>
    <g class="mp-rieles" aria-hidden="true">${rielesSvg(m)}</g>
    <g class="mp-flujos" aria-hidden="true">${m.flujos.map((f, i) => flujoSvg(f, i, ids)).join('')}</g>
    <g class="mp-nodos">${m.nodos.map(nodoSvg).join('')}</g>
  </svg>`;
}

/** Ficha de un nodo (o la ayuda si no hay ninguno elegido). */
export function fichaHtml(n, m) {
  if (!n) {
    return `<h2 class="gds-title-1" id="mp-ficha-titulo">Tocá un nodo</h2>
      <p class="gds-body-2 gds-text-secondary">Cada caja es alguien o algo del sistema. Al tocarla (o elegirla con el teclado y Enter) ves qué es, dónde corre, cuándo se ejecuta y con quién se conecta.</p>`;
  }
  const e = ESTADOS[n.estado] || ESTADOS.ok, f = n.ficha || {};
  const con = m.flujos.filter(x => x.de === n.id || x.a === n.id).map(x => {
    const otro = m.nodos.find(y => y.id === (x.de === n.id ? x.a : x.de));
    return `<li>${x.de === n.id ? '→' : '←'} ${esc(otro ? otro.nombre : '?')}: ${esc(x.texto)}</li>`;
  });
  const hijos = m.nodos.filter(x => x.padre === n.id).map(x => `<li>${esc(x.nombre)}${x.sub ? ` · ${esc(x.sub)}` : ''}</li>`);
  const dato = (dt, dd) => (dd ? `<div><dt>${dt}</dt><dd>${esc(dd)}</dd></div>` : '');
  return `<h2 class="gds-title-1" id="mp-ficha-titulo">${esc(n.nombre)}</h2>
    <p class="gds-cluster"><span class="mp-chip mp-chip--${n.estado}"><span aria-hidden="true">${e.simbolo}</span> ${e.texto}</span>
      <span class="gds-caption gds-text-muted">${esc(TIPOS[n.tipo].rotulo)} · de ${esc(DUENAS[n.duena])}${n.borrador ? ' · borrador' : ''}</span></p>
    ${n.vivo ? `<div class="mp-ahora mp-ahora--${n.estado}"><p class="gds-body-2"><strong>Ahora:</strong> ${esc(n.vivo.nota)}</p>
      <p class="gds-caption gds-text-muted">${esc(FUENTES[n.vivo.fuente] || '')}${n.vivo.enlace && /^https:\/\//.test(n.vivo.enlace) ? ` · <a href="${esc(n.vivo.enlace)}" target="_blank" rel="noopener">ver la corrida</a>` : ''}</p></div>` : ''}
    <p class="gds-body-2">${esc(f.que)}</p>
    <dl class="facts mp-facts">${dato('Dónde', f.donde)}${dato('Cuándo', f.cuando)}${dato('Workflow', f.workflow)}</dl>
    ${hijos.length ? `<h3 class="gds-label-1">Sus automatizaciones</h3><ul class="mp-lista-corta gds-body-2">${hijos.join('')}</ul>` : ''}
    ${con.length ? `<h3 class="gds-label-1">Se conecta con</h3><ul class="mp-lista-corta gds-body-2">${con.join('')}</ul>` : ''}
    ${f.enlace && /^https:\/\//.test(f.enlace) ? `<p><a class="gds-body-2" href="${esc(f.enlace)}" target="_blank" rel="noopener">Abrir en GitHub</a></p>` : ''}`;
}

/** El mapa como lista (para lector de pantalla y para buscar con Ctrl+F). */
function listaHtml(m) {
  const grupos = Object.keys(DUENAS).map(d => [d, m.nodos.filter(n => n.duena === d)]).filter(([, l]) => l.length);
  return `<details class="mp-lista"><summary class="gds-label-1">Ver el mapa como lista</summary>
    ${grupos.map(([d, l]) => `<h3 class="gds-title-2">${esc(DUENAS[d])}</h3><ul class="gds-body-2">${l.map(n => `<li><strong>${esc(n.nombre)}</strong> (${esc(TIPOS[n.tipo].rotulo.toLowerCase())}, ${esc((ESTADOS[n.estado] || ESTADOS.ok).texto.toLowerCase())}): ${esc(n.ficha.que)}</li>`).join('')}</ul>`).join('')}
  </details>`;
}

function leyendaHtml() {
  return `<ul class="mp-leyenda gds-caption" aria-label="Referencias">
    ${Object.entries(ESTADOS).map(([k, e]) => `<li><span class="mp-chip mp-chip--${k}"><span aria-hidden="true">${e.simbolo}</span> ${e.texto}</span></li>`).join('')}
    <li><span class="mp-chip mp-chip--borrador">borde punteado: borrador</span></li>
  </ul>`;
}

/**
 * Vista completa. `estado` = { datos } | { error } | null (todavía leyendo).
 * Pura: montarMapa() la vuelve a dibujar cuando terminan de llegar los archivos.
 */
export function renderMapa(estado) {
  const m = estado && estado.datos;
  const sub = 'Quién es quién, dónde corre cada cosa y qué se mueve sola. Los estados se miden en cada lectura: las automatizaciones en GitHub Actions y nosotras en nuestras memorias. La parte de Shiruna es un borrador mío.';
  if (!m) {
    const cuerpo = estado && estado.error
      ? `<div class="gds-callout gds-callout--warning"><p class="gds-callout__title">No pude leer el mapa.</p><p class="gds-body-2">${esc(estado.error)}</p></div>`
      : '<p class="gds-empty">Dibujando el mapa…</p>';
    return `${pageHead('01 · Cómo estamos armadas', 'El mapa de las dos', esc(sub))}<div id="mapa-raiz" class="mp">${cuerpo}</div>`;
  }
  return `${pageHead('01 · Cómo estamos armadas', 'El mapa de las dos', esc(sub), cifrasMapa(m))}
  <div id="mapa-raiz" class="mp" data-filtro="todo">
    <div class="mp-barra">
      <div class="mp-filtros" role="group" aria-label="Qué mostrar">
        ${FILTROS.map(([k, l], i) => `<button type="button" class="gds-button gds-button--secondary gds-button--sm" data-mp-filtro="${k}" aria-pressed="${i === 0}">${l}</button>`).join('')}
      </div>
      ${leyendaHtml()}
    </div>
    <div class="mp-cuerpo">
      <section class="gds-card mp-lienzo" aria-labelledby="mp-lienzo-titulo">
        <h2 id="mp-lienzo-titulo" class="gds-visually-hidden">Mapa</h2>
        <div class="mp-scroll">${dibujarMapa(m)}</div>
      </section>
      <aside class="gds-card mp-ficha" aria-labelledby="mp-ficha-titulo" aria-live="polite">${fichaHtml(null, m)}</aside>
    </div>
    ${listaHtml(m)}
    <p class="gds-caption gds-text-muted mp-medicion">${!m.vivo ? 'Estados: como los declaré (todavía no medí nada).'
      : `Estados en vivo: ${m.vivo.repos.length ? `corridas de ${m.vivo.repos.map(r => esc(r.split('/').pop())).join(', ')}` : 'sin corridas de GitHub todavía (midiendo o sin cuota)'}${m.vivo.leido ? ' y nuestras memorias' : ''}. Lo que no se puede medir queda como lo declaré.`}</p>
    <p class="gds-caption gds-text-muted">${m.fuentes.map(f => `${esc(f.autora)} · parte «${esc(f.parte)}» v${esc(f.version)} · ${esc(f.actualizado)}${f.borrador ? ' · borrador' : ''}`).join(' — ')}</p>
  </div>`;
}

/* ------------------------------------------------------------ navegador */

let cache = null; // { datos } | { error }
let leyendo = false;
let vivo = { runs: {}, leidoCon: null, leyendo: false }; // MAP-2: corridas por repo, de qué lectura del panel

/** Lo que dibuja la vista: el mapa declarado con los estados de ahora (si ya hay modelo del panel). */
export function estadoMapa(model = null, now = Date.now()) {
  if (!cache || !cache.datos) return cache;
  return { datos: aplicarVivo(cache.datos, { runs: vivo.runs, model, now }) };
}

/** Repos con corridas para leer (los que tienen `repo` en el JSON). */
export function reposVivos(datos) {
  return [...new Set((datos ? datos.nodos : []).map(n => n.repo).filter(r => /^[\w.-]+\/[\w.-]+$/.test(String(r || ''))))];
}

/**
 * Lee las corridas de cada repo una vez por lectura del panel (model.generatedAt) y pide redibujar.
 * gh.api ya cachea 10 min en un casillero fijo por repo y, si la API falla, devuelve la última buena.
 */
export async function cargarVivo({ gh, model, alTerminar } = {}) {
  if (!cache || !cache.datos || !gh || !model) return false;
  if (vivo.leyendo || vivo.leidoCon === model.generatedAt) return false;
  vivo.leyendo = true;
  const runs = {};
  try {
    await Promise.all(reposVivos(cache.datos).map(async (r) => {
      const d = await gh.api(`/repos/${r}/actions/runs?per_page=100&exclude_pull_requests=true`,
        { label: `corridas de ${r.split('/').pop()}`, slot: `mapa:runs:${r.split('/').pop()}`, shape: formaRuns });
      if (Array.isArray(d)) runs[r] = d;
    }));
  } catch { /* sin corridas: queda lo declarado */ }
  vivo = { runs, leidoCon: model.generatedAt, leyendo: false };
  if (alTerminar) alTerminar();
  return true;
}

/** Lee los archivos una vez por visita al panel; al terminar pide redibujar. */
export async function cargarMapa({ fetchImpl = globalThis.fetch, base = import.meta.url, alTerminar } = {}) {
  if (cache || leyendo) return cache;
  leyendo = true;
  try {
    const partes = await Promise.all(MAPA_ARCHIVOS.map(async (p) => {
      const r = await fetchImpl(new URL(`../${p}`, base), { cache: 'no-cache' });
      if (!r.ok) throw new Error(`${p}: HTTP ${r.status}`);
      return r.json();
    }));
    const datos = unirMapa(partes);
    const errores = validarMapa(datos);
    if (errores.length) console.warn('Mapa con problemas:', errores);
    cache = { datos };
  } catch (e) {
    cache = { error: String(e && e.message || e) };
  } finally {
    leyendo = false;
  }
  if (alTerminar) alTerminar();
  return cache;
}

/** Conecta filtros, selección y resaltado. Se llama después de cada dibujo de la vista. */
export function montarMapa($main, { alTerminar, gh, model } = {}) {
  if (!cache) { cargarMapa({ alTerminar }); return; }
  const raiz = $main.querySelector('#mapa-raiz');
  if (!raiz || !cache.datos) return;
  cargarVivo({ gh, model, alTerminar }); // MAP-2: una vez por lectura; al terminar, se vuelve a dibujar
  const m = estadoMapa(model).datos;
  const ficha = raiz.querySelector('.mp-ficha');
  const nodos = [...raiz.querySelectorAll('.mp-n')];

  const resaltar = (id, clase) => {
    raiz.querySelectorAll(`.${clase}`).forEach(el => el.classList.remove(clase));
    if (!id) return;
    raiz.querySelectorAll('.mp-f').forEach((f) => {
      if (f.dataset.de === id || f.dataset.a === id) {
        f.classList.add(clase);
        raiz.querySelectorAll(`.mp-n[data-id="${CSS.escape(f.dataset.de === id ? f.dataset.a : f.dataset.de)}"]`).forEach(n => n.classList.add(clase));
      }
    });
    raiz.querySelectorAll(`.mp-n[data-padre="${CSS.escape(id)}"], .mp-riel[data-padre="${CSS.escape(id)}"]`).forEach(n => n.classList.add(clase));
  };
  const elegir = (g) => {
    nodos.forEach(n => n.setAttribute('aria-pressed', String(n === g)));
    const id = g ? g.dataset.id : null;
    raiz.dataset.sel = id || '';
    resaltar(id, 'is-sel');
    ficha.innerHTML = fichaHtml(m.nodos.find(n => n.id === id), m);
  };

  raiz.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mp-filtro]');
    if (b) {
      raiz.dataset.filtro = b.dataset.mpFiltro;
      raiz.querySelectorAll('[data-mp-filtro]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      return;
    }
    const g = e.target.closest('.mp-n');
    if (g) elegir(g.getAttribute('aria-pressed') === 'true' ? null : g);
  });
  raiz.addEventListener('keydown', (e) => {
    const g = e.target.closest && e.target.closest('.mp-n');
    if (!g) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(g); }
    if (e.key === 'Escape') elegir(null);
  });
  for (const g of nodos) {
    g.addEventListener('mouseenter', () => resaltar(g.dataset.id, 'is-cerca'));
    g.addEventListener('mouseleave', () => resaltar(null, 'is-cerca'));
    g.addEventListener('focus', () => resaltar(g.dataset.id, 'is-cerca'));
    g.addEventListener('blur', () => resaltar(null, 'is-cerca'));
  }
}

/** Solo para tests: vuelve a empezar sin datos leídos. */
export function _reiniciarMapa() { cache = null; leyendo = false; vivo = { runs: {}, leidoCon: null, leyendo: false }; }

/** Solo para tests: carga un mapa ya leído sin pasar por fetch. */
export function _ponerMapa(datos) { cache = { datos }; }
