// FX-1: el canal de parches del Centro de mando aplica todo o nada y nunca toca lo protegido.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const P = require('../.github/scripts/panel-patch.cjs');

test('blobSha: el mismo sha que git', () => {
  assert.equal(P.blobSha(''), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
  assert.equal(P.blobSha('hola\n'), P.blobSha(Buffer.from('hola\n')));
});

test('validPath: nada de rutas absolutas, saltos hacia arriba ni carpetas protegidas', () => {
  for (const ok of ['js/views.js', 'tests/x.test.mjs', 'index.html']) assert.ok(P.validPath(ok), ok);
  for (const no of ['', '/etc/x', '../x', 'js/../../x', 'js//x', '.github/workflows/x.yml', '.git/config', 'patches/RESULT-001.md', 'ci/ULTIMO.md', 'js\\x']) {
    assert.ok(!P.validPath(no), no);
  }
});

test('applyOps: ancla única, en orden; si aparece 0 o 2 veces, falla', () => {
  assert.equal(P.applyOps('a b c', [{ op: 'replace', anchor: 'b', text: 'B' }, { op: 'replace', anchor: 'B c', text: 'x$&y' }]), 'a x$&y');
  assert.throws(() => P.applyOps('a a', [{ op: 'replace', anchor: 'a', text: 'b' }]), /2 veces/);
  assert.throws(() => P.applyOps('a', [{ op: 'replace', anchor: 'z', text: 'b' }]), /0 veces/);
  assert.throws(() => P.applyOps('a', [{ op: 'delete', anchor: 'a', text: '' }]), /solo «replace»/);
  assert.throws(() => P.applyOps('a', []), /sin ops/);
});

function repo() {
  const root = mkdtempSync(join(tmpdir(), 'pp-'));
  mkdirSync(join(root, 'patches'));
  mkdirSync(join(root, 'js'));
  writeFileSync(join(root, 'js/a.js'), 'const x = 1;\n');
  return root;
}
const verde = () => ({ ok: true, tests: '3', pass: '3', fail: '0', fallas: '' });
const rojo = () => ({ ok: false, tests: '3', pass: '2', fail: '1', fallas: '✖ algo' });

test('main: aplica, crea archivos nuevos y deja el RESULT; un parche ya procesado no se repite', () => {
  const root = repo();
  try {
    const base = P.blobSha('const x = 1;\n').slice(0, 7);
    writeFileSync(join(root, 'patches/PATCH-001.json'), JSON.stringify({ id: 'PATCH-001', summary: 's', files: [
      { path: 'js/a.js', base_sha: base, ops: [{ op: 'replace', anchor: '1', text: '2' }] },
      { path: 'js/b.js', create: true, content: 'nuevo\n' },
    ] }));
    const r = P.main(root, verde);
    assert.deepEqual(r.ids, ['PATCH-001']);
    assert.equal(readFileSync(join(root, 'js/a.js'), 'utf8'), 'const x = 2;\n');
    assert.equal(readFileSync(join(root, 'js/b.js'), 'utf8'), 'nuevo\n');
    assert.match(readFileSync(join(root, 'patches/RESULT-001.md'), 'utf8'), /Estado: APLICADO[\s\S]*Suite: 3\/3/);
    assert.deepEqual(r.tocados, ['js/a.js', 'js/b.js', 'patches/RESULT-001.md']);
    assert.deepEqual(P.main(root, verde).ids, [], 'ya tiene RESULT');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('main: con la suite en rojo, con un blob distinto o con una ruta protegida no cambia nada', () => {
  const root = repo();
  try {
    const base = P.blobSha('const x = 1;\n');
    writeFileSync(join(root, 'patches/PATCH-002.json'), JSON.stringify({ id: 'PATCH-002', files: [
      { path: 'js/a.js', base_sha: base, ops: [{ op: 'replace', anchor: '1', text: '9' }] },
      { path: 'js/c.js', create: true, content: 'c\n' },
    ] }));
    P.main(root, rojo);
    assert.equal(readFileSync(join(root, 'js/a.js'), 'utf8'), 'const x = 1;\n', 'se deshizo');
    assert.ok(!existsSync(join(root, 'js/c.js')), 'el archivo nuevo se borró');
    assert.match(readFileSync(join(root, 'patches/RESULT-002.md'), 'utf8'), /RECHAZADO[\s\S]*la suite falló/);

    writeFileSync(join(root, 'patches/PATCH-003.json'), JSON.stringify({ id: 'PATCH-003', files: [
      { path: 'js/a.js', base_sha: 'deadbee', ops: [{ op: 'replace', anchor: '1', text: '9' }] }] }));
    writeFileSync(join(root, 'patches/PATCH-004.json'), JSON.stringify({ id: 'PATCH-004', files: [
      { path: '.github/workflows/x.yml', create: true, content: 'x' }] }));
    writeFileSync(join(root, 'patches/PATCH-005.json'), JSON.stringify({ id: 'PATCH-999', files: [] }));
    P.main(root, verde);
    assert.match(readFileSync(join(root, 'patches/RESULT-003.md'), 'utf8'), /RECHAZADO[\s\S]*parche espera deadbee/);
    assert.match(readFileSync(join(root, 'patches/RESULT-004.md'), 'utf8'), /RECHAZADO[\s\S]*ruta no permitida/);
    assert.match(readFileSync(join(root, 'patches/RESULT-005.md'), 'utf8'), /RECHAZADO[\s\S]*no coincide/);
    assert.equal(readFileSync(join(root, 'js/a.js'), 'utf8'), 'const x = 1;\n');
    assert.ok(!existsSync(join(root, '.github')));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
