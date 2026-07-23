import * as THREE from 'three';

// Native Craftpix sprite geometry and trunk anchors. Alpha bounds are measured
// from the unmodified PNGs and are used only for camera-safe visual bounds.
export const TREE_ART = Object.freeze([
  Object.freeze({
    id: 'tree1',
    texture: 'craftpixTree1',
    width: 128,
    height: 128,
    trunkAnchor: Object.freeze({ x: 65, y: 99 }),
    alphaBounds: Object.freeze({ left: 33, top: 25, right: 95, bottom: 104 }),
  }),
  Object.freeze({
    id: 'tree2',
    texture: 'craftpixTree2',
    width: 64,
    height: 64,
    trunkAnchor: Object.freeze({ x: 31, y: 62 }),
    alphaBounds: Object.freeze({ left: 3, top: 0, right: 56, bottom: 64 }),
  }),
  Object.freeze({
    id: 'tree3',
    texture: 'craftpixTree3',
    width: 64,
    height: 64,
    trunkAnchor: Object.freeze({ x: 32, y: 51 }),
    alphaBounds: Object.freeze({ left: 13, top: 8, right: 52, bottom: 56 }),
  }),
]);

export function treeVariantIndexFor({ column, row, symbol }) {
  const seed = (column * 17 + row * 31 + (symbol === 'P' ? 7 : 0)) >>> 0;
  // Keep the tallest broad tree away from the upper forest edge so its canopy
  // stays visible. Former pine markers use the two narrower green variants.
  if (row <= 1) return [1, 2][seed % 2];
  if (symbol === 'P') return [2, 1, 2][seed % 3];
  return seed % TREE_ART.length;
}

export function treeMeshPosition(art, trunkX, groundY) {
  return {
    x: trunkX + art.width / 2 - art.trunkAnchor.x,
    y: groundY - art.height / 2 + art.trunkAnchor.y,
  };
}

export function treeVisualBounds(art, trunkX, groundY) {
  return {
    minX: trunkX + art.alphaBounds.left - art.trunkAnchor.x,
    maxX: trunkX + art.alphaBounds.right - art.trunkAnchor.x,
    minY: groundY + art.trunkAnchor.y - art.alphaBounds.bottom,
    maxY: groundY + art.trunkAnchor.y - art.alphaBounds.top,
  };
}

export function createTreeMesh(textures, art) {
  const texture = textures[art.texture];
  if (!texture) throw new Error(`Missing Craftpix tree texture: ${art.texture}`);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(art.width, art.height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.01 })
  );
  mesh.userData.treeVariant = art.id;
  mesh.userData.trunkAnchor = { ...art.trunkAnchor };
  return mesh;
}
