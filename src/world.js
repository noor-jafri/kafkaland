import * as THREE from 'three';
import { TILE, REGIONS } from './config.js';
import { spriteMesh } from './textures.js';
import { createHouseMesh, houseCenterXForEntrance } from './house.js';

// Painter's sort for the top-down view: things lower on screen render on top.
export function depthForY(y) {
  return 1 + y * -0.001;
}

// Builds a level from its data object (see src/levels/*). Returns everything
// main.js needs. `level` supplies { map, documents, buildings }.
export function buildWorld(scene, textures, level) {
  const MAP = level.map;
  const DOCUMENTS = level.documents;
  const BUILDINGS = level.buildings;
  const rows = MAP.length;
  const cols = MAP[0].length;
  const width = cols * TILE;
  const height = rows * TILE;

  const blocked = new Set(); // 'col,row' cells that can't be walked into
  const items = []; // pickable documents
  const npcs = []; // interactable buildings
  const trees = []; // punchable-tree world positions (for the Vent Mechanic)
  const enemySpawns = { slime: [], bat: [] }; // world positions, keyed by kind
  const trail = []; // breadcrumb of recent player positions (the Nag follows it)
  let playerStart = new THREE.Vector2(width / 2, height / 2);

  // Everything a level owns hangs off this group, so a level switch can remove
  // the whole thing (and its enemies) in one call. See main.js startLevel().
  const root = new THREE.Group();
  scene.add(root);

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
  root.add(ground);

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
        root.add(mesh);
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
        root.add(mesh);
        for (let offset = -2; offset <= 2; offset++) {
          blocked.add(`${c + offset},${r}`);
        }
        npcs.push({ ...BUILDINGS[ch], x: worldX, y: worldY, mesh });
      } else if (ch === 's') {
        enemySpawns.slime.push({ x: worldX, y: worldY });
      } else if (ch === 'b') {
        enemySpawns.bat.push({ x: worldX, y: worldY });
      } else if (DOCUMENTS[ch]) {
        const doc = DOCUMENTS[ch];
        const mesh = makeDocumentMesh();
        mesh.position.set(worldX, worldY, depthForY(tileBottom));
        root.add(mesh);
        items.push({ ...doc, mesh, baseY: worldY, x: worldX, collected: false });
      }
    }
  }

  return { width, height, rows, cols, blocked, items, npcs, trees, enemySpawns, trail, playerStart, root };
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
