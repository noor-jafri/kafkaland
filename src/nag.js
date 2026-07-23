import * as THREE from 'three';
import { NAG } from './config.js';
import { depthForY } from './world.js';

// "Rundfunkbeitrag Man" — the recurring villain. He does not beeline: he picks
// up your TRAIL (the breadcrumb buffer in world.trail) and follows the path you
// actually walked, lagging behind and grinding forward until he catches up.
// Slightly slower than you, so a clean escape is possible. Non-fatal.
export class Nag {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.timer = NAG.firstDelay;
    this.pos = new THREE.Vector2();
    this.caughtHandled = false;

    // A tall, hollow-eyed collector in a black coat and wide hat, clutching a
    // red-sealed ledger. Drawn on a canvas — no asset needed.
    const c = document.createElement('canvas');
    c.width = 28;
    c.height = 40;
    const ctx = c.getContext('2d');
    // long coat
    ctx.fillStyle = '#14141c';
    ctx.fillRect(8, 16, 12, 22);
    ctx.fillRect(6, 17, 16, 10); // shoulders
    // gaunt pale face
    ctx.fillStyle = '#cfc8bd';
    ctx.fillRect(10, 7, 8, 8);
    // wide dark hat
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(6, 4, 16, 3); // brim
    ctx.fillRect(9, 0, 10, 5); // crown
    // glowing red eyes
    ctx.fillStyle = '#ff2a2a';
    ctx.fillRect(11, 10, 2, 2);
    ctx.fillRect(15, 10, 2, 2);
    // red-sealed ledger/envelope held out front
    ctx.fillStyle = '#e9e2cf';
    ctx.fillRect(1, 22, 11, 9);
    ctx.strokeStyle = '#8a1414';
    ctx.lineWidth = 1;
    ctx.strokeRect(1.5, 22.5, 10, 8);
    ctx.fillStyle = '#b01818';
    ctx.beginPath();
    ctx.arc(6.5, 26.5, 2, 0, Math.PI * 2); // wax seal
    ctx.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    this.material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(28, 40), this.material);
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  // Spawn from just off the nearest horizontal edge, at the player's height.
  #spawn(world, player) {
    this.active = true;
    this.caughtHandled = false;
    this.chaseTime = 0;
    const fromLeft = player.pos.x > world.width / 2;
    this.pos.set(fromLeft ? 24 : world.width - 24, player.pos.y);
    this.mesh.visible = true;
    this.onSpawn?.();
  }

  // Full reset between levels.
  reset() {
    this.active = false;
    this.mesh.visible = false;
    this.caughtHandled = false;
    this.timer = NAG.firstDelay;
  }

  // fled → comes back sooner than a fresh appearance after a catch.
  despawn(msg, fled = false) {
    this.active = false;
    this.mesh.visible = false;
    this.timer = fled ? NAG.refleeInterval : NAG.interval;
    if (msg) this.onLeave?.(msg);
  }

  // Returns 'caught' when he reaches the player, 'fled' when he gives up, else null.
  update(dt, world, player, paused) {
    if (paused) return null;
    if (!this.active) {
      this.timer -= dt;
      if (this.timer <= 0) this.#spawn(world, player);
      return null;
    }
    this.chaseTime += dt;
    if (this.chaseTime > NAG.giveUp) return 'fled';

    // Pick a target: lunge straight at the player when close, otherwise follow
    // the oldest breadcrumb on your trail (it rolls forward along your route as
    // you keep moving, so he grinds along the path you actually took).
    const toPlayer = Math.hypot(player.pos.x - this.pos.x, player.pos.y - this.pos.y);
    let tx = player.pos.x, ty = player.pos.y;
    const trail = world.trail;
    if (toPlayer > 60 && trail && trail.length) {
      // Advance past any breadcrumbs he has already reached.
      while (trail.length > 1 &&
        Math.hypot(trail[0].x - this.pos.x, trail[0].y - this.pos.y) < NAG.trailReachRadius) {
        trail.shift();
      }
      tx = trail[0].x;
      ty = trail[0].y;
    }
    const dx = tx - this.pos.x;
    const dy = ty - this.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.pos.x += (dx / dist) * NAG.speed * dt;
    this.pos.y += (dy / dist) * NAG.speed * dt;
    this.mesh.position.set(this.pos.x, this.pos.y + 12, depthForY(this.pos.y));

    if (toPlayer < NAG.catchRadius && !this.caughtHandled) {
      this.caughtHandled = true;
      return 'caught';
    }
    return null;
  }

  isNear(player) {
    return this.active && Math.hypot(player.pos.x - this.pos.x, player.pos.y - this.pos.y) < NAG.catchRadius + 14;
  }
}
