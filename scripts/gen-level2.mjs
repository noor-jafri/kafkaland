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

// Light civic-plaza scenery: two short broken hedges + scattered groves, all
// with clear gaps so the plaza stays open and easy to cross.
hRun(10, 15, 6, 'P'); hRun(24, 29, 6, 'T');
hRun(12, 17, 12, 'T'); hRun(23, 28, 12, 'P');
for (const [c, r, ch] of [
  [6, 3, 'R'], [20, 3, 'T'], [21, 3, 'P'],
  [8, 9, 'P'], [33, 8, 'R'], [17, 9, 'T'],
  [10, 14, 'P'], [30, 14, 'T'], [31, 14, 'P'],
]) put(c, r, ch);

// Kontoantrag in a shallow nook (top-left), a quick detour off the start.
hRun(2, 4, 2, 'T'); put(4, 3, 'T');
// Passfoto behind a short hedge (bottom-right), optional.
hRun(34, 36, 13, 'T'); put(34, 14, 'T');

// Features.
put(2, 9, '@');       // start
put(7, 4, 'B');       // Bank
put(19, 9, 'K');      // Krankenkasse
put(31, 4, 'F');      // Finanzamt (goal)
put(3, 3, '1');       // Kontoantrag (in nook)
put(35, 14, '2');     // Passfoto (optional)
put(13, 9, 's');      // slime
put(26, 8, 'b');      // bat

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
