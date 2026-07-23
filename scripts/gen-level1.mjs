// Build the Level 1 map by coordinates (no hand-counting), print a JS literal.
// Design: an open town whose obstacles form winding lanes + dead-end pockets.
// Islands of walls can't disconnect an open field, and we flood-fill to prove
// every document + building approach is reachable before printing.
const W = 40, H = 18;
const g = Array.from({ length: H }, () => Array(W).fill('.'));

// Border of trees.
for (let c = 0; c < W; c++) { g[0][c] = 'T'; g[H - 1][c] = 'T'; }
for (let r = 0; r < H; r++) { g[r][0] = 'T'; g[r][W - 1] = 'T'; }

const put = (c, r, ch) => { if (c > 0 && c < W - 1 && r > 0 && r < H - 1) g[r][c] = ch; };
// Horizontal / vertical wall runs (using T, P for pines, R for rocks).
const hRun = (c0, c1, r, ch = 'T') => { for (let c = c0; c <= c1; c++) put(c, r, ch); };
const vRun = (r0, r1, c, ch = 'T') => { for (let r = r0; r <= r1; r++) put(c, r, ch); };

// --- Winding lanes: staggered comb walls hanging from top and bottom, each
// leaving a gap so the field stays one connected space but the route snakes. ---
vRun(1, 6, 8, 'T');            // wall down from top, gap below row 6
vRun(11, 16, 12, 'T');         // wall up from bottom, gap above row 11
vRun(1, 9, 16, 'P');           // pine comb from top, gap below row 9
vRun(9, 16, 20, 'T');          // wall up from bottom, gap above row 9
vRun(1, 7, 24, 'P');           // pine comb from top, gap below row 7
vRun(10, 16, 28, 'T');         // wall up from bottom
hRun(29, 34, 3, 'T');          // short hedge near the far-right offices

// --- Dead-end pocket (top-left) hiding the passport: a C of trees with a
// single opening at the bottom, off the main route. ---
hRun(2, 5, 11, 'T');           // pocket ceiling
vRun(11, 15, 2, 'T');          // pocket left wall (col2 rows11-15) — but keep col1 lane open
vRun(11, 14, 6, 'T');          // pocket right wall, opening at row15/col? -> gap at row15
put(3, 14, 'R');               // a rock for flavor inside the mouth

// --- Second pocket (bottom-right) for the optional SIM. ---
hRun(31, 36, 14, 'T');
vRun(14, 16, 31, 'T');
vRun(14, 15, 36, 'T');

// Scatter a few island trees/rocks for texture (all isolated, safe).
for (const [c, r, ch] of [[12, 4, 'T'], [13, 5, 'P'], [34, 8, 'T'], [33, 9, 'R'], [18, 14, 'R'], [22, 5, 'T'], [26, 12, 'P'], [10, 13, 'T']]) put(c, r, ch);

// --- Features ---
put(2, 8, '@');                // player start (left, mid)
put(6, 3, 'H');                // hostel (flavor)  — row 3 keeps roof in-map
put(22, 4, 'M');               // apartment (grants flat docs)
put(33, 12, 'G');              // Bürgeramt (goal)
put(3, 13, '1');               // passport — inside the top-left pocket
put(34, 15, '2');              // SIM — inside the bottom-right pocket
put(15, 8, 's');               // slime on the main lane (chokepoint)
put(27, 9, 's');               // slime guarding the approach to the offices

// --- Verify reachability with building footprints blocked ---
const BUILD = new Set(['H', 'M', 'G']);
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
const problems = [];
const findChar = (ch) => { for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (g[r][c] === ch) return { c, r }; };
for (const ch of ['1', '2']) { const p = findChar(ch); if (!seen.has(`${p.c},${p.r}`)) problems.push(`doc ${ch} unreachable @${p.c},${p.r}`); }
for (const ch of ['H', 'M', 'G']) {
  const p = findChar(ch); let near = false;
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (seen.has(`${p.c + dc},${p.r + dr}`)) near = true;
  if (!near) problems.push(`building ${ch} no approach @${p.c},${p.r}`);
}

const lit = g.map((row) => `  '${row.join('')}',`).join('\n');
console.log(lit);
console.error(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : `OK: ${seen.size} reachable tiles`);
