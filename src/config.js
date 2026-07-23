// Central place for tuning: asset paths, sprite-sheet regions, gameplay values.
// All pixel coordinates are in the source image's native pixels (16px tiles).

export const TILE = 16;

export const ASSETS = {
  grassTileset: '/assets/Tileset/Autotile_Grass_and_Dirt_Path_Tileset.png',
  natureTileset: '/assets/Tileset/Nature_Tileset.png',
  houseTileset: '/assets/Tileset/House_Tileset.png',
  shadow: '/assets/Sprites/Sprite_Shadow.png',
  bunnyIdle: '/assets/Sprites/Characters/Bunny/IDLE/Bunny_Idle.png',
  bunnyRun: '/assets/Sprites/Characters/Bunny/RUN/Bunny_Run.png',
};

// { x, y, w, h } regions inside the tileset images.
export const REGIONS = {
  grass: { x: 186, y: 52, w: 16, h: 16 },
  grassSprout: { x: 184, y: 48, w: 16, h: 16 }, // grass with a tiny sprout, for variety
  dirt: { x: 256, y: 40, w: 16, h: 16 },
  tree: { x: 14, y: 20, w: 42, h: 46 },
  pine: { x: 48, y: 20, w: 36, h: 52 },
  rock: { x: 222, y: 18, w: 32, h: 34 },
};

// Character sheets: 48x48 frames, one row per facing direction.
export const CHARACTER = {
  frameSize: 48,
  rows: { down: 0, up: 1, left: 2, right: 3 },
  idle: { frames: 5, fps: 6 },
  run: { frames: 8, fps: 12 },
};

export const PLAYER = {
  speed: 90, // world px / second
  // Collider (feet box) relative to sprite center, world px.
  colliderW: 12,
  colliderH: 8,
  colliderOffsetY: -10, // collider sits at the feet
};

export const CAMERA_ZOOM = 3;
