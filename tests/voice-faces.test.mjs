// Una cara por tipo de mensaje (BL-087, DEC-048 de gw2-factory-dev): misma figura, otra pose.
// recomienda = la cara principal (hola), decidió = guiño, advierte y crítico = ojo, explica = explica, resume = con el gato.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voice, VOICE_KINDS, SHIRUVANA_AVATAR, SHIRUVANA_FACES } from '../gds/voice.js';

const src = (kind, size) => (voice({ kind, body: 'x', size }).match(/<img class="gds-voice__avatar[^"]*" src="([^"]+)"/) || [])[1];

test('caras: cada tipo de mensaje tiene la suya', () => {
  assert.deepEqual(Object.keys(SHIRUVANA_FACES).sort(), Object.keys(VOICE_KINDS).sort(), 'una cara por tipo');
  for (const kind of Object.keys(VOICE_KINDS)) assert.equal(src(kind), SHIRUVANA_FACES[kind], kind);
  assert.equal(src('recomienda'), SHIRUVANA_AVATAR, 'recomienda con la cara principal');
  assert.equal(src('advierte'), src('critico'), 'advierte y crítico con la misma');
  assert.equal(new Set(Object.values(SHIRUVANA_FACES)).size, 5, 'cinco caras distintas');
  assert.equal(src('no-existe'), SHIRUVANA_FACES.explica, 'tipo desconocido: la cara de explica');
  assert.equal(src('resume', 'lg'), SHIRUVANA_FACES.resume, 'el tamaño no cambia la cara');
});

test('caras: WebP embebido y liviano', () => {
  for (const [kind, f] of Object.entries(SHIRUVANA_FACES)) {
    assert.match(f, /^data:image\/webp;base64,UklGR[A-Za-z0-9+/]+=*$/, kind);
    assert.ok(f.length < 8000, `${kind}: menos de 8 KB embebido`);
  }
});
