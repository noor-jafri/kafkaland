import * as THREE from 'three';
import { TILE, REGIONS } from './config.js';
import { MAP, DOCUMENTS, BUILDINGS, COMPANIONS } from './map.js';
import { spriteMesh } from './textures.js';
import { createHouseMesh, houseCenterXForEntrance } from './house.js';

// Painter's sort for the top-down view: things lower on screen render on top.
export function depthForY(y) {
  return 1 + y * -0.001;
}

// Builds the whole level. Returns everything main.js needs.
export function buildWorld(scene, textures) {
  const rows = MAP.length;
  const cols = MAP[0].length;
  const width = cols * TILE;
  const height = rows * TILE;

  const blocked = new Set(); // 'col,row' cells that can't be walked into
  const items = []; // pickable documents
  const npcs = []; // interactable buildings
  const trees = []; // punchable-tree world positions (for the Vent Mechanic)
  const slimeSpawns = []; // world positions where slimes patrol
  let playerStart = new THREE.Vector2(width / 2, height / 2);

  // --- Ground: one canvas with grass everywhere + dirt on path tiles ---
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const grassImg = textures.grassTileset.image;
  let seed = 1337; // deterministic scatter of sprout tiles
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let region = MAP[r][c] === '#' ? REGIONS.dirt : REGIONS.grass;
      if (region === REGIONS.grass && rand() < 0.07) region = REGIONS.grassSprout;
      ctx.drawImage(grassImg, region.x, region.y, TILE, TILE, c * TILE, r * TILE, TILE, TILE);
    }
  }
  const groundTex = new THREE.CanvasTexture(canvas);
  groundTex.magFilter = THREE.NearestFilter;
  groundTex.minFilter = THREE.NearestFilter;
  groundTex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: groundTex })
  );
  ground.position.set(width / 2, height / 2, 0);
  scene.add(ground);

  // --- Scenery objects ---
  const sceneryDefs = {
    T: { tex: 'natureTileset', region: REGIONS.tree, scale: 1, punchable: true },
    P: { tex: 'natureTileset', region: REGIONS.pine, scale: 1, punchable: true },
    R: { tex: 'natureTileset', region: REGIONS.rock, scale: 1 },
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = MAP[r][c];
      const worldX = c * TILE + TILE / 2;
      const worldY = (rows - 1 - r) * TILE + TILE / 2; // map row 0 is the top
      const tileBottom = worldY - TILE / 2;

      if (ch === '@') {
        playerStart = new THREE.Vector2(worldX, worldY);
      } else if (sceneryDefs[ch]) {
        const def = sceneryDefs[ch];
        const mesh = spriteMesh(textures[def.tex], def.region, { scale: def.scale });
        const h = def.region.h * def.scale;
        mesh.position.set(worldX, tileBottom + h / 2 - 2, depthForY(tileBottom));
        scene.add(mesh);
        blocked.add(`${c},${r}`);
        if (def.punchable) trees.push({ x: worldX, y: worldY, mesh });
      } else if (BUILDINGS[ch]) {
        const mesh = createHouseMesh(textures);
        const h = mesh.geometry.parameters.height;
        mesh.position.set(
          houseCenterXForEntrance(worldX),
          tileBottom + h / 2 - 2,
          depthForY(tileBottom)
        );
        scene.add(mesh);
        for (let offset = -2; offset <= 2; offset++) {
          blocked.add(`${c + offset},${r}`);
        }
        npcs.push({ ...BUILDINGS[ch], x: worldX, y: worldY, mesh });
      } else if (COMPANIONS[ch]) {
        const mesh = makeCompanionMesh();
        mesh.position.set(worldX, tileBottom + 15, depthForY(tileBottom));
        scene.add(mesh);
        blocked.add(`${c},${r}`);
        npcs.push({ ...COMPANIONS[ch], x: worldX, y: worldY, mesh });
      } else if (ch === 's') {
        slimeSpawns.push({ x: worldX, y: worldY });
      } else if (DOCUMENTS[ch]) {
        const doc = DOCUMENTS[ch];
        const mesh = makeDocumentMesh();
        mesh.position.set(worldX, worldY, depthForY(tileBottom));
        scene.add(mesh);
        items.push({ ...doc, mesh, baseY: worldY, x: worldX, collected: false });
      }
    }
  }

  return { width, height, rows, cols, blocked, items, npcs, trees, slimeSpawns, playerStart };
}

// A little paper document, drawn on a canvas (no asset needed).
function makeDocumentMesh() {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f0dc';
  ctx.fillRect(3, 1, 10, 14);
  ctx.strokeStyle = '#8a8265';
  ctx.lineWidth = 1;
  ctx.strokeRect(3.5, 1.5, 9, 13);
  ctx.fillStyle = '#8a8265';
  for (let i = 0; i < 4; i++) ctx.fillRect(5, 4 + i * 3, 6, 1);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(9, 10, 3, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  return mesh;
}

// Marlene's tiny records kiosk is drawn from hard-edged pixels so the companion
// belongs to the same world as the bundled sprites without adding a new asset.
function makeCompanionMesh() {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Desk and brass trim.
  ctx.fillStyle = '#2c473b';
  ctx.fillRect(2, 18, 20, 12);
  ctx.fillStyle = '#d7ad4f';
  ctx.fillRect(2, 18, 20, 2);
  ctx.fillRect(4, 28, 3, 3);
  ctx.fillRect(17, 28, 3, 3);

  // Owl silhouette.
  ctx.fillStyle = '#493126';
  ctx.fillRect(7, 5, 10, 14);
  ctx.fillRect(5, 8, 14, 8);
  ctx.fillStyle = '#a76540';
  ctx.fillRect(7, 7, 10, 10);
  ctx.fillStyle = '#f3e4b3';
  ctx.fillRect(7, 9, 4, 4);
  ctx.fillRect(13, 9, 4, 4);
  ctx.fillStyle = '#25231f';
  ctx.fillRect(9, 10, 2, 2);
  ctx.fillRect(13, 10, 2, 2);
  ctx.fillStyle = '#e1a83f';
  ctx.fillRect(11, 13, 3, 2);
  ctx.fillRect(12, 15, 1, 2);

  // Question placard.
  ctx.fillStyle = '#f1e5bd';
  ctx.fillRect(16, 1, 7, 8);
  ctx.fillStyle = '#9f3e35';
  ctx.fillRect(18, 2, 3, 1);
  ctx.fillRect(20, 3, 1, 2);
  ctx.fillRect(19, 5, 1, 2);
  ctx.fillRect(19, 8, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 32),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  mesh.userData.companionNpc = true;
  return mesh;
}

// AABB collision against blocked tiles. Returns true if the box hits a wall.
export function resolveCollision(world, x, y, halfW, halfH) {
  const minC = Math.floor((x - halfW) / TILE);
  const maxC = Math.floor((x + halfW) / TILE);
  const minR = Math.floor((world.height - (y + halfH)) / TILE);
  const maxR = Math.floor((world.height - (y - halfH)) / TILE);
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (world.blocked.has(`${c},${r}`)) return true;
    }
  }
  return false;
}
