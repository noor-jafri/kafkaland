import {
  buildGroundStrip,
  buildFacade,
  buildArchDoor,
  buildProp,
  buildPlatform,
  buildDocumentSprite,
  buildSign,
} from "./tilesets.js";
import { createColorPlane, placeSprite } from "../engine/Sprite.js";

const Z = {
  buildings: -40,
  door: -35,
  sign: -34,
  props: -20,
  ground: -10,
  platform: -8,
  documents: -5,
};

/**
 * Turns a plain level-data object (see level1.js) into live THREE objects
 * plus the minimal runtime bookkeeping (solids for physics, documents for
 * pickup checks, the submission trigger zone) that Game.js needs each frame.
 */
export function loadLevel(levelData, assets, scene) {
  const { images } = assets;
  const groundY = levelData.groundY;
  const solids = [];

  const groundMesh = buildGroundStrip(images, {
    levelWidth: levelData.width,
    bottomY: groundY - 32,
    z: Z.ground,
  });
  scene.add(groundMesh);
  solids.push({ left: 0, right: levelData.width, top: groundY });

  // Dark earth fill so the camera never shows sky *below* the street.
  const underground = createColorPlane(0x0d0b09, levelData.width + 1600, 400, {
    anchorX: 0,
    anchorY: 1,
    z: Z.ground - 1,
  });
  placeSprite(underground, -800, groundY, Z.ground - 1);
  scene.add(underground);

  for (const b of levelData.buildings) {
    const { mesh } = buildFacade(images, b.kind, {
      x: b.x,
      bottomY: groundY,
      tilesWide: b.tilesWide,
      floors: b.floors,
      z: Z.buildings,
    });
    scene.add(mesh);
  }

  for (const p of levelData.props) {
    const mesh = buildProp(images, p.kind, { x: p.x, bottomY: groundY, z: Z.props });
    scene.add(mesh);
  }

  for (const p of levelData.platforms) {
    const mesh = buildPlatform(images, {
      x: p.x,
      bottomY: groundY,
      width: p.width,
      height: p.height,
      z: Z.platform,
    });
    scene.add(mesh);
    solids.push({ left: p.x - p.width / 2, right: p.x + p.width / 2, top: groundY + p.height });
  }

  const documents = levelData.documents.map((doc) => {
    const { mesh, width, height } = buildDocumentSprite({ x: doc.x, y: doc.y, z: Z.documents });
    scene.add(mesh);
    return {
      id: doc.id,
      name: doc.name,
      mesh,
      collected: false,
      x: doc.x,
      y: doc.y,
      halfWidth: width / 2,
      height,
      worldY: mesh.position.y,
      bobPhase: Math.random() * Math.PI * 2,
    };
  });

  const sub = levelData.submission;
  const { mesh: subFacade } = buildFacade(images, sub.kind, {
    x: sub.x,
    bottomY: groundY,
    tilesWide: sub.tilesWide,
    floors: sub.floors,
    z: Z.buildings,
  });
  scene.add(subFacade);

  const { mesh: doorMesh, backing: doorBacking } = buildArchDoor(images, {
    x: sub.x,
    bottomY: groundY,
    z: Z.door,
  });
  scene.add(doorMesh);
  scene.add(doorBacking);

  const signMesh = buildSign(sub.signText, { x: sub.x, bottomY: groundY + 100, z: Z.sign });
  scene.add(signMesh);

  const submissionZone = {
    left: sub.x - sub.triggerWidth / 2,
    right: sub.x + sub.triggerWidth / 2,
  };

  return {
    width: levelData.width,
    groundY,
    solids,
    documents,
    submissionZone,
    playerStart: levelData.playerStart,
  };
}
