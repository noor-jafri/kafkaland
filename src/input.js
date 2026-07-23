// Keyboard state. WASD + arrow keys for movement, E for interact.
const keys = new Set();
const pressedThisFrame = new Set();

window.addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (!keys.has(e.code)) pressedThisFrame.add(e.code);
  keys.add(e.code);
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

export function getMoveVector() {
  let x = 0;
  let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.sqrt(2);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

// True only on the frame the key went down.
export function wasPressed(code) {
  return pressedThisFrame.has(code);
}

// Call once at the end of each frame.
export function endFrame() {
  pressedThisFrame.clear();
}
