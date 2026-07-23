// Dev-only: validate a level MAP for row length, borders, building rows, and
// reachability of documents + building entrances from the player start.
// Usage: node scripts/verify-map.mjs src/levels/level1.js
import { pathToFileURL } from 'node:url';

const file = process.argv[2];
const mod = await import(pathToFileURL(file).href);
const level = mod.default || mod.LEVEL1 || mod.LEVEL2;
const MAP = level.map;
const DOCS = level.documents || {};
const BUILDINGS = level.buildings || {};

const H = MAP.length;
const W = MAP[0].length;
let ok = true;
const fail = (m) => { ok = false; console.log('  ✗ ' + m); };

// 1. Dimensions + border.
MAP.forEach((row, r) => {
  if (row.length !== W) fail(`row ${r} length ${row.length} != ${W}: "${row}"`);
});
for (let c = 0; c < W; c++) {
  if (MAP[0][c] !== 'T' || MAP[H - 1][c] !== 'T') fail(`top/bottom border not sealed at col ${c}`);
}
for (let r = 0; r < H; r++) {
  if (MAP[r][0] !== 'T' || MAP[r][W - 1] !== 'T') fail(`left/right border not sealed at row ${r}`);
}

// 2. Building rows: roof must stay inside the map (matches test/house.test.js).
const TILE = 16;
const HOUSE_H = 64;
const blocked = new Set();
const cellsOf = {};
let start = null;
for (let r = 0; r < H; r++) {
  for (let c = 0; c < W; c++) {
    const ch = MAP[r][c];
    if (ch === '@') start = { c, r };
    (cellsOf[ch] ||= []).push({ c, r });
    if (ch === 'T' || ch === 'P' || ch === 'R') blocked.add(`${c},${r}`);
    if (BUILDINGS[ch]) {
      const tileBottom = (H - 1 - r) * TILE;
      if (tileBottom + HOUSE_H - 2 > H * TILE) fail(`building '${ch}' at row ${r} roof exits map`);
      for (let o = -2; o <= 2; o++) blocked.add(`${c + o},${r}`);
    }
  }
}
for (const ch of Object.keys(BUILDINGS)) {
  const n = (cellsOf[ch] || []).length;
  if (n !== 1) fail(`building '${ch}' appears ${n} times (test expects exactly 1)`);
}
if (!start) fail('no player start (@)');

// 3. Flood fill walkable cells from @.
const seen = new Set();
if (start) {
  const stack = [start];
  seen.add(`${start.c},${start.r}`);
  while (stack.length) {
    const { c, r } = stack.pop();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr, k = `${nc},${nr}`;
      if (nc < 0 || nr < 0 || nc >= W || nr >= H) continue;
      if (blocked.has(k) || seen.has(k)) continue;
      seen.add(k);
      stack.push({ c: nc, r: nr });
    }
  }
}

// 4. Every document cell must be reached.
for (const [digit, doc] of Object.entries(DOCS)) {
  for (const cell of cellsOf[digit] || []) {
    if (!seen.has(`${cell.c},${cell.r}`)) fail(`document ${doc.id} (${digit}) at ${cell.c},${cell.r} unreachable`);
  }
}
// 5. Every building must have a reachable walkable neighbor within 2 tiles.
for (const ch of Object.keys(BUILDINGS)) {
  const cell = (cellsOf[ch] || [])[0];
  if (!cell) continue;
  let near = false;
  for (let dr = -2; dr <= 2 && !near; dr++)
    for (let dc = -2; dc <= 2 && !near; dc++)
      if (seen.has(`${cell.c + dc},${cell.r + dr}`)) near = true;
  if (!near) fail(`building '${ch}' has no reachable approach tile`);
}

// Also flag slimes off-map/blocked (informational).
for (const s of cellsOf['s'] || []) {
  if (!seen.has(`${s.c},${s.r}`)) console.log(`  · note: slime at ${s.c},${s.r} not on reachable floor`);
}

console.log(ok ? `✓ ${file} OK (${W}x${H}, ${seen.size} reachable tiles)` : `✗ ${file} FAILED`);
process.exit(ok ? 0 : 1);
