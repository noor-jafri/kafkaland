// Level 1 — "Anmeldung" (address registration).
//
// This file is pure data: positions, kinds, sizes. It knows nothing about
// THREE.js, physics, or rendering — LevelLoader.js is the only thing that
// reads it and turns it into a scene. To design a new layout, copy this file
// and hand it to LevelLoader instead; nothing else needs to change.

export const level1 = {
  id: "level1",
  title: "Anmeldung beim Bürgeramt",
  width: 3200,
  groundY: 0,
  playerStart: { x: 80, y: 0 },

  // Decorative background buildings — purely atmospheric, not collidable.
  buildings: [
    { x: 150, kind: "tan", tilesWide: 6, floors: 2 },
    { x: 520, kind: "red", tilesWide: 7, floors: 3 },
    { x: 900, kind: "magenta", tilesWide: 6, floors: 2 },
    { x: 1260, kind: "shop", tilesWide: 8, floors: 1 },
    { x: 1620, kind: "tan", tilesWide: 7, floors: 3 },
    { x: 2000, kind: "red", tilesWide: 6, floors: 2 },
    { x: 2360, kind: "magenta", tilesWide: 7, floors: 2 },
  ],

  // Small street props for flavor — also non-collidable.
  props: [
    { x: 230, kind: "lampPost" },
    { x: 400, kind: "trashBags" },
    { x: 650, kind: "trafficLight" },
    { x: 820, kind: "stopSign" },
    { x: 1120, kind: "bin" },
    { x: 1340, kind: "lampPost" },
    { x: 1600, kind: "parkingSign" },
    { x: 1850, kind: "trafficLight" },
    { x: 2150, kind: "lampPost" },
    { x: 2450, kind: "trashBags" },
    { x: 2650, kind: "bin" },
  ],

  // Solid ledges the player can jump onto (top surface at bottomY+height).
  platforms: [
    { x: 980, width: 96, height: 64 },
    { x: 2020, width: 96, height: 64 },
  ],

  // Scattered paperwork. `y` is the ground-contact height (0 = street level,
  // otherwise it should match a platform's top surface so it's reachable).
  documents: [
    { id: "passport", name: "Reisepass", x: 260, y: 0 },
    { id: "photo", name: "Passfoto", x: 560, y: 0 },
    { id: "lease", name: "Mietvertrag", x: 980, y: 64 },
    { id: "insurance", name: "Krankenversicherungsnachweis", x: 1450, y: 0 },
    { id: "funds", name: "Finanzierungsnachweis", x: 2020, y: 64 },
  ],

  // The destination building. The player must be inside `triggerWidth` of
  // its door, on the ground, with every document collected.
  submission: {
    x: 2850,
    kind: "office",
    tilesWide: 9,
    floors: 3,
    triggerWidth: 140,
    signText: "BÜRGERAMT",
  },
};
