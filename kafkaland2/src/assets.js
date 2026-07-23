// Central place that resolves every raw art file to a URL Vite can serve/bundle.
// Each entry must be a fully literal `new URL(...)` — Vite rewrites these at
// build time and can't follow dynamically-assembled paths across subfolders.
export const ASSET_PATHS = {
  background: {
    sky: new URL("../assets/City background sky.png", import.meta.url).href,
    far: new URL("../assets/City background layer2.png", import.meta.url).href,
    near: new URL("../assets/City background layer1.png", import.meta.url).href,
  },
  buildingTiles: new URL("../assets/Building Tiles 32x32.png", import.meta.url).href,
  cityTiles: new URL("../assets/GandalfHardcore city tiles 32x32.png", import.meta.url).href,
  decoration: new URL("../assets/Decoration 32x32.png", import.meta.url).href,
  character: {
    idle: new URL("../assets/character/Idle.png", import.meta.url).href,
    run: new URL("../assets/character/Run.png", import.meta.url).href,
    jump: new URL("../assets/character/Jump.png", import.meta.url).href,
  },
};
