import * as THREE from 'three';

export const HOUSE_ART = Object.freeze({
  width: 80,
  height: 64,
  bodyLeft: 8,
  bodyRight: 72,
  entranceCenterX: 40,
});

const tile = (role, texture, sx, sy, sw, sh, dx, dy, dw = sw, dh = sh) => ({
  role,
  texture,
  source: { x: sx, y: sy, w: sw, h: sh },
  destination: { x: dx, y: dy, w: dw, h: dh },
});

const wall = [8, 24, 40, 56].map((x) =>
  tile('wall', 'houseTileset', 480, 96, 16, 32, x, 28)
);

const redEaves = [8, 24, 40, 56].map((x, index) =>
  tile('roof-eave', 'houseTileset', index % 2 ? 544 : 528, 144, 16, 8, x, 25)
);

const foundation = [8, 24, 40, 56].map((x, index) =>
  tile('foundation', 'houseTileset', index % 2 ? 544 : 528, 176, 16, 8, x, 56)
);

const architecture = [
  ...wall,
  ...redEaves,
  tile('roof-gable', 'houseTileset', 16, 16, 32, 48, 24, 0),
  tile('window', 'houseTileset', 480, 32, 16, 16, 8, 37),
  tile('window', 'houseTileset', 496, 32, 16, 16, 56, 37),
];

const landscaping = [
  ...foundation,
  tile('shrub', 'natureTileset', 177, 17, 15, 14, 0, 49),
  tile('shrub', 'natureTileset', 193, 17, 15, 14, 65, 49),
];

const doors = {
  cottage: tile('door', 'houseTileset', 560, 32, 16, 16, 32, 39),
  workshop: tile('door', 'houseTileset', 544, 16, 16, 16, 32, 39),
};

export const HOUSE_VARIANTS = Object.freeze({
  cottage: Object.freeze([...architecture, doors.cottage, ...landscaping]),
  workshop: Object.freeze([...architecture, doors.workshop, ...landscaping]),
});

export const HOUSE_TEXTURE_SIZES = Object.freeze({
  houseTileset: Object.freeze({ width: 608, height: 304 }),
  natureTileset: Object.freeze({ width: 336, height: 192 }),
});

export function createHouseMesh(textures, variant = 'cottage') {
  const layers = HOUSE_VARIANTS[variant];
  if (!layers) throw new Error(`Unknown house variant: ${variant}`);

  const canvas = document.createElement('canvas');
  canvas.width = HOUSE_ART.width;
  canvas.height = HOUSE_ART.height;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;

  for (const layer of layers) {
    const image = textures[layer.texture]?.image;
    if (!image) throw new Error(`Missing house composition texture: ${layer.texture}`);
    const source = layer.source;
    const destination = layer.destination;
    context.drawImage(
      image,
      source.x,
      source.y,
      source.w,
      source.h,
      destination.x,
      destination.y,
      destination.w,
      destination.h
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(HOUSE_ART.width, HOUSE_ART.height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.01 })
  );
  mesh.userData.houseVariant = variant;
  return mesh;
}
