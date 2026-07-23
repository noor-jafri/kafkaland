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

// --- Light scenery only: a mostly open village with loose tree groves for
// texture and a couple of short hedges. Nothing that walls off a region. ---
for (const [c, r, ch] of [
  [11, 2, 'T'], [12, 2, 'P'], [11, 3, 'P'],       // grove near hostel
  [17, 6, 'T'], [18, 7, 'P'], [24, 3, 'T'],
  [30, 6, 'P'], [31, 6, 'T'], [30, 7, 'P'],       // grove mid-right
  [8, 11, 'T'], [9, 12, 'P'], [20, 13, 'R'],
  [26, 14, 'P'], [27, 14, 'T'], [34, 9, 'R'], [14, 15, 'T'],
]) put(c, r, ch);

// --- Shallow nook (one tile deep) that hides the passport just off the path:
// a little three-sided bracket you step into, not a maze. ---
hRun(2, 4, 6, 'T');            // nook ceiling
put(2, 7, 'T');               // one side post (open on the right → easy entry)

// --- Optional SIM tucked behind a short hedge, bottom-right, quick detour. ---
hRun(33, 35, 13, 'T');
put(33, 14, 'T');

// --- Features ---
put(2, 9, '@');                // player start (left, mid)
put(6, 3, 'H');                // hostel (flavor)  — row 3 keeps roof in-map
put(21, 4, 'M');               // apartment (grants flat docs)
put(33, 11, 'G');              // Bürgeramt (goal)
put(3, 7, '1');                // passport — in the shallow nook, near start
put(35, 14, '2');              // SIM — behind the short hedge (optional)
put(14, 9, 's');               // one slime loosely on the route

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
