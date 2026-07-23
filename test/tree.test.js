import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { ASSETS, TILE } from '../src/config.js';
import { HOUSE_ART } from '../src/house.js';
import { MAP } from '../src/levels/level1.js';
import { TREE_ART, treeMeshPosition, treeVariantIndexFor, treeVisualBounds } from '../src/tree.js';
import { resolveCollision } from '../src/world.js';

const EXPECTED_TREES = [
  { name: 'Tree1.png', width: 128, height: 128, sha256: 'd174adbeaa3f5d0b1f87e330d7af6feb46511ff30e26141e7cc44c1461034635' },
  { name: 'Tree2.png', width: 64, height: 64, sha256: '67632e4a078c99e1b8c433f9b4a6e000fa1477725daa4dce7efff0a97ca2a8c3' },
  { name: 'Tree3.png', width: 64, height: 64, sha256: 'b84ee47d506be5cb8fdc6e4eaa395a10635b57b8c11ef8bcbae950660b6e0e4d' },
];

test('runtime uses the exact curated Craftpix tree PNGs and supplied license', async () => {
  assert.deepEqual(
    [ASSETS.craftpixTree1, ASSETS.craftpixTree2, ASSETS.craftpixTree3],
    ['/assets/Craftpix/trees/Tree1.png', '/assets/Craftpix/trees/Tree2.png', '/assets/Craftpix/trees/Tree3.png'],
  );

  for (const expected of EXPECTED_TREES) {
    const png = await readFile(new URL(`../assets/Craftpix/trees/${expected.name}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), expected.width);
    assert.equal(png.readUInt32BE(20), expected.height);
    assert.equal(createHash('sha256').update(png).digest('hex'), expected.sha256);
  }

  const license = await readFile(new URL('../assets/Craftpix/trees/License.txt', import.meta.url), 'utf8');
  assert.equal(license, 'https://craftpix.net/file-licenses/');
  const attribution = await readFile(new URL('../assets/Craftpix/trees/README.md', import.meta.url), 'utf8');
  assert.match(attribution, /Craftpix/);
  assert.match(attribution, /https:\/\/craftpix\.net\/file-licenses\//);
});

test('tree anchors place trunks on the map cell while keeping full canopies visible', () => {
  const trunkX = 120;
  const groundY = 80;
  for (const art of TREE_ART) {
    const position = treeMeshPosition(art, trunkX, groundY);
    assert.equal(position.x - art.width / 2 + art.trunkAnchor.x, trunkX);
    assert.equal(position.y + art.height / 2 - art.trunkAnchor.y, groundY);

    const bounds = treeVisualBounds(art, trunkX, groundY);
    assert.ok(bounds.minX < trunkX && bounds.maxX > trunkX);
    assert.ok(bounds.minY <= groundY && bounds.maxY > groundY);
    assert.ok(art.alphaBounds.right - art.alphaBounds.left <= HOUSE_ART.width);
    assert.ok(art.alphaBounds.bottom - art.alphaBounds.top <= HOUSE_ART.height * 1.25);
  }
});

test('deterministic map variation uses all three green trees without tall top-edge cropping', () => {
  const variants = new Set();
  for (const [row, line] of MAP.entries()) {
    for (const [column, symbol] of [...line].entries()) {
      if (symbol !== 'T' && symbol !== 'P') continue;
      const variant = treeVariantIndexFor({ column, row, symbol });
      variants.add(variant);
      if (row <= 1) assert.notEqual(variant, 0);
    }
  }
  assert.deepEqual([...variants].sort(), [0, 1, 2]);
});

test('tree collision remains a single trunk tile rather than the canopy', () => {
  const row = 3;
  const column = 10;
  const world = {
    width: MAP[0].length * TILE,
    height: MAP.length * TILE,
    blocked: new Set([`${column},${row}`]),
  };
  const trunkX = column * TILE + TILE / 2;
  const trunkY = (MAP.length - 1 - row) * TILE + TILE / 2;
  assert.equal(resolveCollision(world, trunkX, trunkY, 4, 4), true);
  assert.equal(resolveCollision(world, trunkX + 30, trunkY, 4, 4), false);
});
