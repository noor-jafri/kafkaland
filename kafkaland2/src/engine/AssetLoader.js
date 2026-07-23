import * as THREE from "three";
import { ASSET_PATHS } from "../assets.js";
import { loadImage, preparePixelTexture } from "./textureUtils.js";

const textureLoader = new THREE.TextureLoader();

function loadTexture(src) {
  return new Promise((resolve, reject) => {
    textureLoader.load(src, (tex) => resolve(preparePixelTexture(tex)), undefined, reject);
  });
}

/**
 * Loads every art asset once up front.
 *  - `textures`: ready-to-use THREE.Textures for whole-image use (parallax
 *    backgrounds, character sheets sliced frame-by-frame via offset/repeat).
 *  - `images`: raw HTMLImageElements for the tile sheets, used to cut out
 *    arbitrary sub-rects onto scratch canvases (see textureUtils.extractRegionTexture).
 */
export async function loadAssets() {
  const [bgSky, bgFar, bgNear, charIdle, charRun, charJump, buildingTiles, cityTiles, decoration] =
    await Promise.all([
      loadTexture(ASSET_PATHS.background.sky),
      loadTexture(ASSET_PATHS.background.far),
      loadTexture(ASSET_PATHS.background.near),
      loadTexture(ASSET_PATHS.character.idle),
      loadTexture(ASSET_PATHS.character.run),
      loadTexture(ASSET_PATHS.character.jump),
      loadImage(ASSET_PATHS.buildingTiles),
      loadImage(ASSET_PATHS.cityTiles),
      loadImage(ASSET_PATHS.decoration),
    ]);

  return {
    textures: { bgSky, bgFar, bgNear, charIdle, charRun, charJump },
    images: { buildingTiles, cityTiles, decoration },
  };
}
