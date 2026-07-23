import * as THREE from 'three';
import { CAMERA_ZOOM } from './config.js';
import { loadAll } from './textures.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { HUD } from './ui.js';
import { wasPressed, endFrame } from './input.js';

const PICKUP_RADIUS = 24; // world px

async function start() {
  const app = document.getElementById('app');

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  app.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2e4a2e');

  // Orthographic camera: 1 world unit = 1 art pixel, zoomed for chunky pixels.
  const camera = new THREE.OrthographicCamera(0, 0, 0, 0, 0.1, 100);
  camera.position.z = 10;
  function resize() {
    const w = window.innerWidth / CAMERA_ZOOM;
    const h = window.innerHeight / CAMERA_ZOOM;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  const textures = await loadAll();
  const world = buildWorld(scene, textures);
  const player = new Player(scene, textures, world.playerStart);
  const hud = new HUD();

  window.__game = { player, camera, world }; // debug handle

  // Start the camera on the player instead of panning in from the corner.
  camera.position.x = player.pos.x;
  camera.position.y = player.pos.y;

  const clock = new THREE.Clock();
  let elapsed = 0;

  function frame() {
    requestAnimationFrame(frame);
    // Self-heal if the window had no size at startup (or changed without an event).
    const size = renderer.getSize(new THREE.Vector2());
    if (size.x !== window.innerWidth || size.y !== window.innerHeight) resize();
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    player.update(dt, world);

    // --- Camera follows the player, clamped to the map edges ---
    const viewW = camera.right - camera.left;
    const viewH = camera.top - camera.bottom;
    const cx = Math.max(viewW / 2, Math.min(world.width - viewW / 2, player.pos.x));
    const cy = Math.max(viewH / 2, Math.min(world.height - viewH / 2, player.pos.y));
    camera.position.x += (cx - camera.position.x) * Math.min(1, dt * 8);
    camera.position.y += (cy - camera.position.y) * Math.min(1, dt * 8);

    // --- Documents: bob up and down, pick up with E when close ---
    let nearest = null;
    let nearestDist = Infinity;
    for (const item of world.items) {
      if (item.collected) continue;
      item.mesh.position.y = item.baseY + Math.sin(elapsed * 3 + item.baseY) * 2;
      const d = Math.hypot(item.mesh.position.x - player.pos.x, item.baseY - player.pos.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = item;
      }
    }
    const canPickUp = nearest && nearestDist < PICKUP_RADIUS;
    hud.showHint(!!canPickUp);
    if (canPickUp && wasPressed('KeyE')) {
      nearest.collected = true;
      nearest.mesh.removeFromParent();
      hud.addItem(nearest);
      const remaining = world.items.filter((i) => !i.collected).length;
      if (remaining === 0) {
        hud.setQuest('🎉 All documents collected! Off to the Ausländerbehörde…');
      } else {
        hud.setQuest(`Documents remaining: ${remaining} — keep exploring!`);
      }
    }

    renderer.render(scene, camera);
    endFrame();
  }
  frame();
}

start();
