import * as THREE from 'three';

// The source house has an offset front door. Position the mesh so the door,
// rather than the roof's bounding box, stays centered on the map path.
export const HOUSE_ART = Object.freeze({
  width: 66,
  height: 64,
  entranceCenterX: 49,
});

export function houseCenterXForEntrance(entranceX) {
  return entranceX + HOUSE_ART.width / 2 - HOUSE_ART.entranceCenterX;
}

export function createHouseMesh(textures) {
  const texture = textures.craftpixHouse;
  if (!texture) throw new Error('Missing Craftpix house texture');

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(HOUSE_ART.width, HOUSE_ART.height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.01 })
  );
  mesh.userData.house = 'craftpix';
  return mesh;
}
