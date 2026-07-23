// Build the Level 2 map by coordinates. Theme: Money, Health, Taxes.
// Buildings: B Bank → K Krankenkasse → F Finanzamt (goal). A hidden Kontoantrag
// (1) gates the bank; an optional Passfoto (2) hides in a second pocket.
// 's' slimes, 'b' bats (Processing Delay). Reachability is proven before print.
const W = 40, H = 18;
const g = Array.from({ length: H }, () => Array(W).fill('.'));
for (let c = 0; c < W; c++) { g[0][c] = 'T'; g[H - 1][c] = 'T'; }
for (let r = 0; r < H; r++) { g[r][0] = 'T'; g[r][W - 1] = 'T'; }
const put = (c, r, ch) => { if (c > 0 && c < W - 1 && r > 0 && r < H - 1) g[r][c] = ch; };
const hRun = (c0, c1, r, ch = 'T') => { for (let c = c0; c <= c1; c++) put(c, r, ch); };
const vRun = (r0, r1, c, ch = 'T') => { for (let r = r0; r <= r1; r++) put(c, r, ch); };

// Central hedge divider with staggered gaps — a small civic plaza feel.
hRun(4, 12, 6, 'T'); hRun(15, 24, 6, 'P'); hRun(27, 35, 6, 'T');
hRun(4, 10, 11, 'P'); hRun(13, 22, 11, 'T'); hRun(26, 35, 11, 'P');
vRun(2, 5, 13, 'T'); vRun(12, 15, 9, 'T'); vRun(12, 16, 30, 'T');

// Kontoantrag pocket (top-left C of trees, one opening downward).
hRun(2, 5, 2, 'T'); vRun(2, 4, 5, 'T'); put(4, 2, 'T');
// Passfoto pocket (bottom-right).
hRun(33, 36, 13, 'T'); vRun(13, 16, 33, 'T'); vRun(14, 15, 36, 'T');

// Island scatter.
for (const [c, r, ch] of [[8, 8, 'R'], [20, 3, 'T'], [24, 14, 'R'], [17, 9, 'P'], [10, 14, 'T'], [28, 8, 'P']]) put(c, r, ch);

// Features.
put(2, 9, '@');       // start
put(7, 3, 'B');       // Bank
put(20, 8, 'K');      // Krankenkasse
put(31, 4, 'F');      // Finanzamt (goal)
put(3, 3, '1');       // Kontoantrag (in pocket)
put(35, 15, '2');     // Passfoto (optional, in pocket)
put(13, 8, 's');      // slime
put(26, 13, 's');     // slime
put(16, 4, 'b');      // bat
put(29, 10, 'b');     // bat

const BUILD = new Set(['B', 'K', 'F']);
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
for (const ch of ['1', '2']) { const p = findChar(ch); if (!seen.has(`${p.c},${p.r}`)) problems.push(`doc ${ch} unreachable @${p.c},${p.r}`); }
for (const ch of ['B', 'K', 'F']) {
  const p = findChar(ch); let near = false;
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) if (seen.has(`${p.c + dc},${p.r + dr}`)) near = true;
  if (!near) problems.push(`building ${ch} no approach @${p.c},${p.r}`);
  const tileBottom = (H - 1 - p.r) * TILE;
  if (tileBottom + HOUSE_H - 2 > H * TILE) problems.push(`building ${ch} roof exits map @row${p.r}`);
}
console.log(g.map((row) => `  '${row.join('')}',`).join('\n'));
console.error(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : `OK: ${seen.size} reachable tiles`);
