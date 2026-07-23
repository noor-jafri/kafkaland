import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ASSETS, TILE } from '../src/config.js';
import { HOUSE_ART, houseCenterXForEntrance } from '../src/house.js';
import { BUILDINGS, MAP } from '../src/map.js';

test('Craftpix runtime house matches its declared native render size', async () => {
  const png = await readFile(new URL('../assets/Craftpix/house.png', import.meta.url));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.subarray(12, 16).toString(), 'IHDR');
  assert.equal(png.readUInt32BE(16), HOUSE_ART.width);
  assert.equal(png.readUInt32BE(20), HOUSE_ART.height);
  assert.equal(ASSETS.craftpixHouse, '/assets/Craftpix/house.png');
  assert.equal('houseTileset' in ASSETS, false, 'the obsolete miniature house sheet is not loaded');
});

test('offset Craftpix door remains centered on every map entrance', () => {
  const buildingCells = [];
  for (const [row, line] of MAP.entries()) {
    for (const [column, character] of [...line].entries()) {
      if (BUILDINGS[character]) buildingCells.push({ row, column });
    }
  }
  assert.equal(buildingCells.length, Object.keys(BUILDINGS).length);

  for (const { row, column } of buildingCells) {
    const entranceX = column * TILE + TILE / 2;
    const meshCenterX = houseCenterXForEntrance(entranceX);
    const leftEdge = meshCenterX - HOUSE_ART.width / 2;
    assert.equal(leftEdge + HOUSE_ART.entranceCenterX, entranceX);
    assert.ok(Number.isInteger(leftEdge), 'house art remains aligned to whole world pixels');

    const tileBottom = (MAP.length - 1 - row) * TILE;
    assert.ok(tileBottom + HOUSE_ART.height - 2 <= MAP.length * TILE, 'roof stays inside the map');
  }
});
