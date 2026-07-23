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
  const COMPANIONS = level.companions || {};
  const rows = MAP.length;
  const cols = MAP[0].length;
  const width = cols * TILE;
  const height = rows * TILE;

  const blocked = new Set(); // 'col,row' cells that can't be walked into
  const items = []; // pickable documents
  const npcs = []; // interactable buildings
  const trees = []; // punchable-tree world positions (for the Vent Mechanic)
  const enemySpawns = { slime: [], bat: [], conflict: [] }; // world positions, keyed by kind
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
        const centerX = houseCenterXForEntrance(worldX);
        mesh.position.set(centerX, tileBottom + h / 2 - 2, depthForY(tileBottom));
        root.add(mesh);
        for (let offset = -2; offset <= 2; offset++) {
          blocked.add(`${c + offset},${r}`);
        }
        // A readable name banner floating just above the roof.
        if (BUILDINGS[ch].label) {
          const banner = makeLabelMesh(BUILDINGS[ch].label);
          const roofTop = tileBottom + h - 2;
          banner.position.set(centerX, roofTop + 7, depthForY(tileBottom) + 0.5);
          root.add(banner);
        }
        npcs.push({ ...BUILDINGS[ch], x: worldX, y: worldY, mesh });
      } else if (COMPANIONS[ch]) {
        const mesh = makeCompanionMesh();
        mesh.position.set(worldX, tileBottom + 15, depthForY(tileBottom));
        root.add(mesh);
        blocked.add(`${c},${r}`);
        npcs.push({ ...COMPANIONS[ch], x: worldX, y: worldY, mesh });
      } else if (ch === 's') {
        enemySpawns.slime.push({ x: worldX, y: worldY });
      } else if (ch === 'b') {
        enemySpawns.bat.push({ x: worldX, y: worldY });
      } else if (ch === 'c') {
        enemySpawns.conflict.push({ x: worldX, y: worldY });
      } else if (ch === 'U') {
        // The "Untätigkeit" mini-boss: a big, immovable case-worker blob.
        const mesh = makeBossMesh();
        mesh.position.set(worldX, worldY + 10, depthForY(worldY));
        root.add(mesh);
        const banner = makeLabelMesh('Untätigkeit');
        banner.position.set(worldX, worldY + 34, depthForY(worldY) + 0.5);
        root.add(banner);
        npcs.push({ id: 'untaetigkeit', boss: true, prompt: 'Endure the case-worker', x: worldX, y: worldY, mesh });
      } else if (DOCUMENTS[ch]) {
        const doc = DOCUMENTS[ch];
        const mesh = makeDocumentMesh();
        mesh.position.set(worldX, worldY, depthForY(tileBottom));
        root.add(mesh);
        items.push({ ...doc, mesh, baseY: worldY, x: worldX, collected: false });
      }
    }
  }

  return { map: MAP, width, height, rows, cols, blocked, items, npcs, trees, enemySpawns, trail, playerStart, root };
}

// A crisp parchment name banner for a building, drawn on a canvas. Rendered at
// 3x so the text stays sharp under the pixel-art NearestFilter at CAMERA_ZOOM.
function makeLabelMesh(text) {
  const S = 3; // supersample factor
  const padX = 8 * S;
  const fontPx = 11 * S;
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `bold ${fontPx}px "Courier New", monospace`;
  const textW = Math.ceil(measure.measureText(text).width);
  const c = document.createElement('canvas');
  c.width = textW + padX * 2;
  c.height = 20 * S;
  const ctx = c.getContext('2d');
  // parchment plate with border
  ctx.fillStyle = 'rgba(20,20,30,0.9)';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#e8d5a0';
  ctx.fillRect(1 * S, 1 * S, c.width - 2 * S, c.height - 2 * S);
  ctx.fillStyle = '#2a2620';
  ctx.font = `bold ${fontPx}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + S);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const w = c.width / S;
  const h = c.height / S;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  return mesh;
}

// The Untätigkeit mini-boss: a large sour grey-green blob clutching a red stamp.
function makeBossMesh() {
  const c = document.createElement('canvas');
  c.width = 40;
  c.height = 40;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5c6b4a'; // sickly bureaucratic green
  ctx.beginPath();
  ctx.ellipse(20, 24, 16, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#47543a';
  ctx.fillRect(6, 24, 28, 8);
  ctx.fillStyle = '#1c1c1c'; // scowling eyes
  ctx.fillRect(13, 18, 4, 5);
  ctx.fillRect(23, 18, 4, 5);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(14, 28, 12, 2); // flat frown
  ctx.fillStyle = '#b01818'; // red stamp held aloft
  ctx.fillRect(28, 6, 9, 6);
  ctx.fillStyle = '#7a1010';
  ctx.fillRect(31, 12, 3, 6);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
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

// Marlene's records kiosk uses hard-edged pixels that match the existing world.
function makeCompanionMesh() {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#2c473b';
  ctx.fillRect(2, 18, 20, 12);
  ctx.fillStyle = '#d7ad4f';
  ctx.fillRect(2, 18, 20, 2);
  ctx.fillRect(4, 28, 3, 3);
  ctx.fillRect(17, 28, 3, 3);
  ctx.fillStyle = '#493126';
  ctx.fillRect(5, 8, 14, 11);
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

export function surfaceAt(world, x, y) {
  const column = Math.max(0, Math.min(world.cols - 1, Math.floor(x / TILE)));
  const row = Math.max(0, Math.min(world.rows - 1, Math.floor((world.height - y) / TILE)));
  return world.map[row]?.[column] === '#' ? 'path' : 'grass';
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
