import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOUSE_ART,
  HOUSE_TEXTURE_SIZES,
  HOUSE_VARIANTS,
} from '../src/house.js';

for (const [variant, layers] of Object.entries(HOUSE_VARIANTS)) {
  test(`${variant} house uses exact in-bounds asset pixels`, () => {
    assert.ok(layers.length > 0);

    for (const layer of layers) {
      const texture = HOUSE_TEXTURE_SIZES[layer.texture];
      assert.ok(texture, `${layer.role} references a known texture`);

      const values = [...Object.values(layer.source), ...Object.values(layer.destination)];
      assert.ok(values.every(Number.isInteger), `${layer.role} uses integer pixel coordinates`);
      assert.ok(layer.source.x >= 0 && layer.source.y >= 0);
      assert.ok(layer.source.x + layer.source.w <= texture.width);
      assert.ok(layer.source.y + layer.source.h <= texture.height);
      assert.ok(layer.destination.x >= 0 && layer.destination.y >= 0);
      assert.ok(layer.destination.x + layer.destination.w <= HOUSE_ART.width);
      assert.ok(layer.destination.y + layer.destination.h <= HOUSE_ART.height);
      assert.equal(layer.destination.w, layer.source.w, `${layer.role} is not resampled`);
      assert.equal(layer.destination.h, layer.source.h, `${layer.role} is not resampled`);
    }
  });

  test(`${variant} house has complete architecture and a centered entrance`, () => {
    const roles = new Set(layers.map((layer) => layer.role));
    for (const role of ['roof-gable', 'roof-eave', 'wall', 'foundation', 'window', 'door']) {
      assert.ok(roles.has(role), `missing ${role}`);
    }
    assert.ok(layers.filter((layer) => layer.role === 'window').length >= 2);

    const door = layers.find((layer) => layer.role === 'door').destination;
    assert.equal(door.x + door.w / 2, HOUSE_ART.entranceCenterX);
    assert.equal(HOUSE_ART.entranceCenterX, HOUSE_ART.width / 2);
  });
}
