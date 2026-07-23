// Central place for tuning: asset paths, sprite-sheet regions, gameplay values.
// All pixel coordinates are in the source image's native pixels (16px tiles).

export const TILE = 16;

export const ASSETS = {
  grassTileset: '/assets/Tileset/Autotile_Grass_and_Dirt_Path_Tileset.png',
  natureTileset: '/assets/Tileset/Nature_Tileset.png',
  craftpixHouse: '/assets/Craftpix/house.png',
  shadow: '/assets/Sprites/Sprite_Shadow.png',
  bunnyIdle: '/assets/Sprites/Characters/Bunny/IDLE/Bunny_Idle.png',
  bunnyRun: '/assets/Sprites/Characters/Bunny/RUN/Bunny_Run.png',
  bunnyPunch: '/assets/Sprites/Characters/Bunny/SWORD/Bunny_Sword.png',
  slimeIdle: '/assets/Sprites/Enemies/SLIME/Slime_Idle.png',
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
  punch: { frames: 9, fps: 16 }, // Bunny_Sword sheet, played once when venting
};

// Slime hazard: 48px frames, first row is fine for a simple bobbing patrol.
export const SLIME = {
  frameSize: 48,
  idle: { frames: 8, fps: 6 },
  speed: 22, // world px / second, patrols slowly
  patrolRange: 40, // px it wanders left/right of its spawn
  contactRadius: 16,
};

export const PLAYER = {
  speed: 90, // world px / second
  // Collider (feet box) relative to sprite center, world px.
  colliderW: 12,
  colliderH: 8,
  colliderOffsetY: -10, // collider sits at the feet
};

export const CAMERA_ZOOM = 3;

export const INTERACT_RADIUS = 34; // how close you must be to interact (world px)

export const BACKPACK_SLOTS = 6;

// Bat = "Processing Delay" (Level 2+): loops around its spawn on a lazy orbit.
export const BAT = {
  frameSize: 48,
  idle: { frames: 4, fps: 8 },
  speed: 1.6, // radians/sec around its orbit
  radius: 34, // orbit radius in world px
  contactRadius: 15,
};

// Frustration / Vent Mechanic tuning.
export const FRUSTRATION = {
  max: 100,
  perSlimeHit: 22,
  perNagCaught: 18,
  ventDrain: 34, // drained per tree-punch
  hitCooldown: 1.2, // seconds of invulnerability after a slime bump
};

// Cosmetic in-world clock for Level 1's soft 14-day Anmeldung deadline.
export const DAY_TIMER = {
  secondsPerDay: 7,
  deadlineDay: 14,
};

// Rundfunkbeitrag Man (the recurring nag / villain). He follows a breadcrumb
// trail of your recent positions instead of beelining — so he tracks where you
// actually went and (incidentally) routes around the obstacles you did.
export const NAG = {
  firstDelay: 16, // seconds before he can first appear
  interval: 30, // rough seconds between appearances (was 55 — now near-constant pressure)
  refleeInterval: 18, // he comes back faster after giving up than after catching you
  speed: 74, // still slightly slower than the player (PLAYER.speed = 90)
  catchRadius: 20,
  giveUp: 24, // seconds of failing to catch you before he flees (was 10)
  trailReachRadius: 12, // how close to a trail point before advancing to the next
};

// Breadcrumb trail the Nag follows.
export const TRAIL = {
  sampleInterval: 0.28, // seconds between recorded points
  maxPoints: 48,
};

// Frustration levels at which the "go vent on a tree" nudge re-appears (fraction of max).
export const FRUSTRATION_PROMPTS = [0.4, 0.75, 0.95];
