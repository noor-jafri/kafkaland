import * as THREE from 'three';
import { ASSETS } from './config.js';

const loader = new THREE.TextureLoader();

// Loads every asset once. Returns { name: THREE.Texture }.
export async function loadAll() {
  const entries = await Promise.all(
    Object.entries(ASSETS).map(async ([name, url]) => {
      const tex = await loader.loadAsync(url);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      return [name, tex];
    })
  );
  return Object.fromEntries(entries);
}

// A texture clone windowed to a sub-region of the source image.
export function regionTexture(baseTex, region) {
  const img = baseTex.image;
  const tex = baseTex.clone();
  tex.repeat.set(region.w / img.width, region.h / img.height);
  tex.offset.set(region.x / img.width, 1 - (region.y + region.h) / img.height);
  tex.needsUpdate = true;
  return tex;
}

// A flat, transparent-capable quad showing a texture region, sized in world px.
export function spriteMesh(baseTex, region, { scale = 1 } = {}) {
  const tex = regionTexture(baseTex, region);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.01 });
  const geo = new THREE.PlaneGeometry(region.w * scale, region.h * scale);
  return new THREE.Mesh(geo, mat);
}
