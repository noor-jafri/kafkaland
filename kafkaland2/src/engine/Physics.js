export const GRAVITY = 1500; // px/s^2
export const JUMP_SPEED = 560; // px/s, initial upward velocity
export const MOVE_SPEED = 230; // px/s

/**
 * Very small "walk on top of things" collision resolver. Solids are simple
 * horizontal ledges: { left, right, top }. We only ever land on top of them —
 * there's no side/ceiling collision, which keeps the whole thing legible for
 * a first prototype and is enough for a flat city street with a couple of
 * raised curbs/planters to jump onto.
 */
export function resolveLanding({ x, halfWidth, prevFeetY, nextFeetY, vy }, solids) {
  let bestTop = null;

  for (const solid of solids) {
    const overlapsX = x + halfWidth > solid.left && x - halfWidth < solid.right;
    if (!overlapsX) continue;
    if (vy > 0) continue; // moving upward, can't land
    const wasAbove = prevFeetY >= solid.top - 0.01;
    const willBeAtOrBelow = nextFeetY <= solid.top;
    if (wasAbove && willBeAtOrBelow) {
      if (bestTop === null || solid.top > bestTop) bestTop = solid.top;
    }
  }

  if (bestTop !== null) {
    return { y: bestTop, vy: 0, grounded: true };
  }
  return { y: nextFeetY, vy, grounded: false };
}
