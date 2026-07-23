import * as THREE from "three";

const imageCache = new Map();

// Raw <img> elements so we can draw sub-rects onto scratch canvases.
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function preparePixelTexture(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Cuts an arbitrary pixel rectangle out of a bigger sheet into its own
 * canvas-backed texture. Extracting into a standalone texture (rather than
 * using offset/repeat directly against the shared atlas texture) means the
 * result can safely use RepeatWrapping to tile seamlessly — sampling wraps
 * around *this* small image, not into neighbouring atlas content.
 */
export function extractRegionTexture(image, { x, y, w, h }) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  preparePixelTexture(tex);
  return tex;
}

export function extractTile(image, tileSize, col, row) {
  return extractRegionTexture(image, { x: col * tileSize, y: row * tileSize, w: tileSize, h: tileSize });
}

/**
 * Slices a single animation-frame texture out of a horizontal spritesheet
 * by cloning + windowing the shared texture. Safe without canvas extraction
 * because we never repeat-wrap a single frame.
 */
export function frameTexture(baseTexture, frameCount, frameIndex) {
  const tex = baseTexture.clone();
  tex.needsUpdate = true;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  preparePixelTexture(tex);
  tex.repeat.set(1 / frameCount, 1);
  tex.offset.set(frameIndex / frameCount, 0);
  return tex;
}

export { preparePixelTexture };
