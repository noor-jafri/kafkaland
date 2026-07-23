import * as THREE from "three";

/**
 * Builds a textured plane mesh positioned via an anchor point rather than
 * its geometric center. `anchorX`/`anchorY` are fractions (0..1) measured
 * from the bottom-left of the quad — (0,0) means `x,y` is the bottom-left
 * corner, (0.5,0) means `x,y` is bottom-center (the usual "feet" anchor).
 */
export function createSprite(texture, width, height, opts = {}) {
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  return createPlane(material, width, height, opts);
}

export function createColorPlane(color, width, height, opts = {}) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opts.opacity ?? 1 });
  return createPlane(material, width, height, opts);
}

function createPlane(material, width, height, { anchorX = 0, anchorY = 0, z = 0 } = {}) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.anchorX = anchorX;
  mesh.userData.anchorY = anchorY;
  mesh.userData.width = width;
  mesh.userData.height = height;
  placeSprite(mesh, 0, 0, z);
  return mesh;
}

export function placeSprite(mesh, x, y, z) {
  const { anchorX, anchorY, width, height } = mesh.userData;
  mesh.position.x = x + (0.5 - anchorX) * width;
  mesh.position.y = y + (0.5 - anchorY) * height;
  if (z !== undefined) mesh.position.z = z;
}
