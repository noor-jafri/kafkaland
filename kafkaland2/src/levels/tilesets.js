import * as THREE from "three";
import { extractRegionTexture } from "../engine/textureUtils.js";
import { createSprite, createColorPlane, placeSprite } from "../engine/Sprite.js";

export const TILE = 32;

// Coordinates below are tile indices (col,row) read off a grid overlay of
// each sheet — see the project's tile-map notes. All sheets use 32x32 cells.

// "Building Tiles 32x32.png" — 22 cols x 12 rows.
// Each facade block is one ground floor's worth (windows + a built-in dark
// doorway at local column 2) and can be tiled both horizontally (more
// tiles-wide) and vertically (more floors) since it's cut into its own
// standalone canvas texture first.
const FACADES = {
  office: { col: 0, row: 0, colSpan: 9, rowSpan: 2 }, // blue/grey glass — used for the Bürgeramt
  tan: { col: 0, row: 2, colSpan: 9, rowSpan: 2 },
  red: { col: 0, row: 4, colSpan: 9, rowSpan: 2 },
  magenta: { col: 0, row: 6, colSpan: 9, rowSpan: 2 },
  shop: { col: 0, row: 8, colSpan: 8, rowSpan: 4 },
};

// "GandalfHardcore city tiles 32x32.png" — 13 cols x 4 rows.
const ARCH_DOOR = { col: 3, row: 0, colSpan: 3, rowSpan: 3 }; // rounded archway, transparent opening
const GROUND_TILE = { col: 1, row: 3 };

// "Decoration 32x32.png" — 9 cols x 4 rows.
const PROPS = {
  trashBags: { col: 1, row: 0, colSpan: 1, rowSpan: 1 },
  bin: { col: 3, row: 0, colSpan: 1, rowSpan: 1 },
  stopSign: { col: 2, row: 1, colSpan: 1, rowSpan: 1 },
  parkingSign: { col: 2, row: 3, colSpan: 1, rowSpan: 1 },
  trafficLight: { col: 5, row: 0, colSpan: 1, rowSpan: 4 },
  lampPost: { col: 6, row: 0, colSpan: 1, rowSpan: 3 },
};

function regionOf(image, def) {
  return extractRegionTexture(image, {
    x: def.col * TILE,
    y: def.row * TILE,
    w: def.colSpan * TILE,
    h: def.rowSpan * TILE,
  });
}

export function buildGroundStrip(images, { levelWidth, bottomY, z }) {
  const tex = regionOf(images.cityTiles, { ...GROUND_TILE, colSpan: 1, rowSpan: 1 });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(levelWidth / TILE, 1);
  const mesh = createSprite(tex, levelWidth, TILE, { anchorX: 0, anchorY: 0, z });
  placeSprite(mesh, 0, bottomY, z);
  return mesh;
}

export function buildFacade(images, kind, { x, bottomY, tilesWide, floors, z }) {
  const def = FACADES[kind];
  const blockW = def.colSpan * TILE;
  const blockH = def.rowSpan * TILE;
  const tex = regionOf(images.buildingTiles, def);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(tilesWide / def.colSpan, floors);
  const width = tilesWide * TILE;
  const height = floors * blockH;
  const mesh = createSprite(tex, width, height, { anchorX: 0.5, anchorY: 0, z });
  placeSprite(mesh, x, bottomY, z);
  return { mesh, width, height };
}

export function buildArchDoor(images, { x, bottomY, z }) {
  const tex = regionOf(images.cityTiles, ARCH_DOOR);
  const w = ARCH_DOOR.colSpan * TILE;
  const h = ARCH_DOOR.rowSpan * TILE;

  const backing = createColorPlane(0x0c0906, w * 0.55, h * 0.82, { anchorX: 0.5, anchorY: 0, z: z - 1 });
  placeSprite(backing, x, bottomY, z - 1);

  const mesh = createSprite(tex, w, h, { anchorX: 0.5, anchorY: 0, z });
  placeSprite(mesh, x, bottomY, z);
  return { mesh, backing, width: w, height: h };
}

export function buildProp(images, kind, { x, bottomY, z }) {
  const def = PROPS[kind];
  const tex = regionOf(images.decoration, def);
  const w = def.colSpan * TILE;
  const h = def.rowSpan * TILE;
  const mesh = createSprite(tex, w, h, { anchorX: 0.5, anchorY: 0, z });
  placeSprite(mesh, x, bottomY, z);
  return mesh;
}

export function buildPlatform(images, { x, bottomY, width, height, z }) {
  const tex = regionOf(images.cityTiles, { ...GROUND_TILE, colSpan: 1, rowSpan: 1 });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(width / TILE, height / TILE);
  const mesh = createSprite(tex, width, height, { anchorX: 0.5, anchorY: 0, z });
  placeSprite(mesh, x, bottomY, z);
  return mesh;
}

// No document sprite exists in the art pack, so we draw a small paper icon
// procedurally — a stand-in that still reads clearly as "official document".
function createDocumentCanvasTexture() {
  const w = 32,
    h = 40;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f4ecd8";
  ctx.strokeStyle = "#8a7250";
  ctx.lineWidth = 1.5;
  const pad = 3;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(w - pad - 7, pad);
  ctx.lineTo(w - pad, pad + 7);
  ctx.lineTo(w - pad, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // folded corner
  ctx.fillStyle = "#d8c9a3";
  ctx.beginPath();
  ctx.moveTo(w - pad - 7, pad);
  ctx.lineTo(w - pad, pad + 7);
  ctx.lineTo(w - pad - 7, pad + 7);
  ctx.closePath();
  ctx.fill();

  // text lines
  ctx.strokeStyle = "#9a8a6a";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const ly = pad + 12 + i * 4;
    ctx.beginPath();
    ctx.moveTo(pad + 3, ly);
    ctx.lineTo(w - pad - 3 - (i === 3 ? 8 : 0), ly);
    ctx.stroke();
  }

  // red official stamp
  ctx.strokeStyle = "#b5342c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(w - pad - 8, h - pad - 8, 5, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, w, h };
}

export function buildDocumentSprite({ x, y, z }) {
  const { tex, w, h } = createDocumentCanvasTexture();
  const width = w * 0.9;
  const height = h * 0.9;
  const mesh = createSprite(tex, width, height, { anchorX: 0.5, anchorY: 0, z });
  placeSprite(mesh, x, y, z);
  return { mesh, width, height };
}

function createSignCanvasTexture(text) {
  const w = 256,
    h = 64;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1c1a17";
  ctx.strokeStyle = "#caa15a";
  ctx.lineWidth = 4;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeRect(2, 2, w - 4, h - 4);

  ctx.fillStyle = "#e8c789";
  ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, w, h };
}

export function buildSign(text, { x, bottomY, z }) {
  const { tex, w, h } = createSignCanvasTexture(text);
  const scale = 0.55;
  const mesh = createSprite(tex, w * scale, h * scale, { anchorX: 0.5, anchorY: 0, z });
  placeSprite(mesh, x, bottomY, z);
  return mesh;
}
