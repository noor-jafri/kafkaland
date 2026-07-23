// Build the Level 3 map — the Ausländerbehörde Gauntlet. Denser, maze-ier office
// complex (comb walls + corridors), higher hazard density. Buildings: A, V, Z, J.
// Hidden pickup 1 = Fiktionsbescheinigung. Markers: s slime, b bat, c conflict
// slime, U Untätigkeit mini-boss. Reachability proven before print.
const W = 40, H = 18;
const g = Array.from({ length: H }, () => Array(W).fill('.'));
for (let c = 0; c < W; c++) { g[0][c] = 'T'; g[H - 1][c] = 'T'; }
for (let r = 0; r < H; r++) { g[r][0] = 'T'; g[r][W - 1] = 'T'; }
const put = (c, r, ch) => { if (c > 0 && c < W - 1 && r > 0 && r < H - 1) g[r][c] = ch; };
const hRun = (c0, c1, r, ch = 'T') => { for (let c = c0; c <= c1; c++) put(c, r, ch); };
const vRun = (r0, r1, c, ch = 'T') => { for (let r = r0; r <= r1; r++) put(c, r, ch); };

// Comb walls hanging from top and bottom with offset gaps → winding corridors.
vRun(1, 6, 8, 'T');
vRun(11, 16, 12, 'P');
vRun(1, 5, 15, 'T');
vRun(10, 16, 19, 'T');
vRun(1, 7, 23, 'P');
vRun(11, 16, 27, 'T');
vRun(1, 6, 31, 'T');
hRun(2, 6, 11, 'P');       // partition near the recognition wing
hRun(33, 37, 8, 'T');      // partition near the employer

// Scattered rubble/plants.
for (const [c, r, ch] of [[5, 4, 'R'], [13, 13, 'R'], [25, 4, 'R'], [35, 13, 'P'], [10, 6, 'P'], [21, 14, 'T']]) put(c, r, ch);

// --- Buildings (rows keep the roof in the map) ---
put(4, 4, 'A');            // Ausländerbehörde (eAT)
put(25, 3, 'V');          // Integrationskurs (VHS)
put(4, 14, 'Z');          // Recognition Authority (optional)
put(36, 11, 'J');         // Employer (goal)

// --- Pickup + hazards ---
put(2, 9, '@');            // start
put(11, 3, '1');           // Fiktionsbescheinigung (front, near start route)
put(9, 9, 's');
put(17, 6, 's');
put(29, 13, 's');
put(14, 8, 'b');
put(22, 10, 'b');
put(30, 6, 'b');
put(33, 12, 'b');
put(21, 5, 'c');           // conflicting-information official at a door
put(28, 9, 'U');           // Untätigkeit mini-boss on the busy corridor

// --- Verify reachability (building footprints blocked) ---
const BUILD = new Set(['A', 'V', 'Z', 'J']);
const blocked = new Set();
let start = null;
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
  const ch = g[r][c];
  if (ch === '@') start = { c, r };
  if (ch === 'T' || ch === 'P' || ch === 'R') blocked.add(`${c},${r}`);
  if (BUILD.has(ch)) for (let o = -2; o <= 2; o++) blocked.add(`${c + o},${r}`);
}
const seen = new Set([`${start.c},${start.r}`]);
const stack = [start];
while (stack.length) {
  const { c, r } = stack.pop();
  for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nc = c + dc, nr = r + dr, k = `${nc},${nr}`;
    if (nc < 0 || nr < 0 || nc >= W || nr >= H || blocked.has(k) || seen.has(k)) continue;
    seen.add(k); stack.push({ c: nc, r: nr });
  }
}
const findChar = (ch) => { for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] === ch) return { c, r }; };
const problems = [];
const TILE = 16, HOUSE_H = 64;
for (const ch of ['1']) { const p = findChar(ch); if (!seen.has(`${p.c},${p.r}`)) problems.push(`doc ${ch} unreachable @${p.c},${p.r}`); }
for (const ch of ['A', 'V', 'Z', 'J', 'c', 'U', 's', 'b']) {
  let anyReach = false;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] === ch) {
    let near = false;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (seen.has(`${c + dc},${r + dr}`)) near = true;
    if (near) anyReach = true; else problems.push(`${ch} @${c},${r} no reachable approach`);
    if (BUILD.has(ch)) {
      const tileBottom = (H - 1 - r) * TILE;
      if (tileBottom + HOUSE_H - 2 > H * TILE) problems.push(`building ${ch} roof exits map @row${r}`);
    }
  }
}
console.log(g.map((row) => `  '${row.join('')}',`).join('\n'));
console.error(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : `OK: ${seen.size} reachable tiles`);
