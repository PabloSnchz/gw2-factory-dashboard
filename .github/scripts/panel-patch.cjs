'use strict';
/**
 * Canal de parches del Centro de mando (FX-1; misma idea que DEC-035 en gw2-factory-dev).
 *
 * Shiruvana publica un parche chico (patches/PATCH-NNN.json) en vez de reescribir un archivo grande
 * (js/views.js pasa los 70 KB). Este script, corrido por .github/workflows/panel-patch.yml:
 *   - toma los parches sin RESULT, en orden;
 *   - verifica el blob base de cada archivo, aplica reemplazos con ancla única (o crea un archivo nuevo);
 *   - corre la suite completa; si algo falla, deja todo como estaba (todo o nada por parche);
 *   - escribe patches/RESULT-NNN.md con lo que pasó (APLICADO o RECHAZADO y el motivo).
 *
 * Seguridad: nunca toca .github/, .git/, patches/ ni ci/; el contenido del parche nunca va a un comando.
 *
 * Formato:
 * { "id": "PATCH-001", "summary": "…",
 *   "files": [ { "path": "js/views.js", "base_sha": "df5cdfd…", "ops": [ { "op": "replace", "anchor": "…", "text": "…" } ] },
 *              { "path": "tests/nuevo.test.mjs", "create": true, "content": "…" } ] }
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const DIR = 'patches';
const FILE_RE = /^PATCH-(\d{3,})\.json$/;
const PROHIBIDO = ['.github', '.git', DIR, 'ci'];

/** sha del blob de git (el mismo que muestra GitHub). */
function blobSha(data) {
  const b = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
}

/** Ruta relativa, sin saltos hacia arriba y fuera de las carpetas protegidas. */
function validPath(p) {
  if (typeof p !== 'string' || !p || p.startsWith('/') || p.includes('\\')) return false;
  const parts = p.split('/');
  if (parts.some(x => x === '' || x === '.' || x === '..')) return false;
  return !PROHIBIDO.includes(parts[0]);
}

/** Aplica los reemplazos en orden. Cada ancla tiene que aparecer exactamente una vez. */
function applyOps(text, ops) {
  if (!Array.isArray(ops) || !ops.length) throw new Error('sin ops');
  let out = String(text);
  ops.forEach((op, i) => {
    if (!op || op.op !== 'replace' || typeof op.anchor !== 'string' || !op.anchor || typeof op.text !== 'string') {
      throw new Error(`op ${i + 1}: solo «replace» con anchor y text`);
    }
    const n = out.split(op.anchor).length - 1;
    if (n !== 1) throw new Error(`op ${i + 1}: el ancla aparece ${n} veces (tiene que ser 1): ${op.anchor.slice(0, 60)}`);
    out = out.replace(op.anchor, () => op.text);
  });
  return out;
}

/** Valida el parche y calcula el resultado de cada archivo, sin escribir nada. */
function prepare(patch, root) {
  if (!patch || typeof patch !== 'object' || !/^PATCH-\d{3,}$/.test(patch.id || '')) throw new Error('id inválido');
  if (!Array.isArray(patch.files) || !patch.files.length) throw new Error('sin files');
  const seen = new Set();
  return patch.files.map((f, i) => {
    if (!f || !validPath(f.path)) throw new Error(`archivo ${i + 1}: ruta no permitida (${f && f.path})`);
    if (seen.has(f.path)) throw new Error(`${f.path} aparece dos veces`);
    seen.add(f.path);
    const abs = path.join(root, f.path);
    if (f.create === true) {
      if (fs.existsSync(abs)) throw new Error(`${f.path} ya existe (create)`);
      if (typeof f.content !== 'string' || !f.content) throw new Error(`${f.path}: create sin content`);
      return { path: f.path, abs, before: null, antes: null, after: Buffer.from(f.content, 'utf8') };
    }
    if (!fs.existsSync(abs)) throw new Error(`${f.path} no existe`);
    const before = fs.readFileSync(abs);
    const antes = blobSha(before);
    if (typeof f.base_sha !== 'string' || f.base_sha.length < 7 || !antes.startsWith(f.base_sha)) {
      throw new Error(`${f.path}: el blob actual es ${antes.slice(0, 7)} y el parche espera ${f.base_sha}`);
    }
    return { path: f.path, abs, before, antes, after: Buffer.from(applyOps(before.toString('utf8'), f.ops), 'utf8') };
  });
}

function escribir(prepared) {
  for (const p of prepared) {
    fs.mkdirSync(path.dirname(p.abs), { recursive: true });
    fs.writeFileSync(p.abs, p.after);
  }
}

function deshacer(prepared) {
  for (const p of prepared) {
    if (p.before) fs.writeFileSync(p.abs, p.before);
    else if (fs.existsSync(p.abs)) fs.unlinkSync(p.abs);
  }
}

function suite(root) {
  const files = fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.mjs')).sort().map(f => 'tests/' + f);
  const r = spawnSync(process.execPath, ['--test', ...files], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const num = k => (out.match(new RegExp(`^ℹ ${k} (\\d+)`, 'm')) || [])[1] || '?';
  const fallas = out.split('\n').filter(l => /✖|AssertionError|Error:/.test(l)).slice(0, 40).join('\n');
  return { ok: r.status === 0, tests: num('tests'), pass: num('pass'), fail: num('fail'), fallas };
}

function main(root = process.cwd(), runSuite = suite) {
  const dir = path.join(root, DIR);
  const pendientes = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => FILE_RE.test(f) && !fs.existsSync(path.join(dir, f.replace(/^PATCH/, 'RESULT').replace(/\.json$/, '.md')))).sort()
    : [];
  const tocados = [];
  const ids = [];
  for (const f of pendientes) {
    const id = f.replace(/\.json$/, '');
    ids.push(id);
    const lines = [`# RESULT de ${id}`, '', `- Fecha: ${new Date().toISOString()}`];
    let prepared = [];
    try {
      const patch = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (patch.id !== id) throw new Error(`el id interno (${patch.id}) no coincide con el archivo`);
      prepared = prepare(patch, root);
      escribir(prepared);
      const t = runSuite(root);
      if (!t.ok) {
        deshacer(prepared);
        throw new Error(`la suite falló con el parche (${t.fail} de ${t.tests}); no se aplicó nada.\n\n\`\`\`\n${t.fallas}\n\`\`\``);
      }
      lines.push('- Estado: APLICADO', `- Resumen: ${String(patch.summary || '').replace(/\n/g, ' ')}`, `- Suite: ${t.pass}/${t.tests} en verde`, '',
        '| Archivo | Blob antes | Blob después | Bytes |', '|---|---|---|---|',
        ...prepared.map(p => `| \`${p.path}\` | \`${p.antes || '(nuevo)'}\` | \`${blobSha(p.after)}\` | ${p.after.length} |`));
      tocados.push(...prepared.map(p => p.path));
    } catch (e) {
      lines.push('- Estado: RECHAZADO', `- Motivo: ${e.message}`);
    }
    const res = `${DIR}/RESULT-${id.slice('PATCH-'.length)}.md`;
    fs.writeFileSync(path.join(root, res), lines.join('\n') + '\n');
    tocados.push(res);
  }
  return { ids, tocados };
}

if (require.main === module) {
  const { ids, tocados } = main();
  const tmp = process.env.RUNNER_TEMP;
  if (tmp) {
    fs.writeFileSync(path.join(tmp, 'panel-patch-files.txt'), tocados.join('\n') + (tocados.length ? '\n' : ''));
    fs.writeFileSync(path.join(tmp, 'panel-patch-ids.txt'), ids.join(', '));
  }
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${ids.length}\n`);
  console.log(ids.length ? `Procesados: ${ids.join(', ')}` : 'Sin parches pendientes');
}

module.exports = { blobSha, validPath, applyOps, prepare, main };
