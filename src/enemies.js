import * as THREE from 'three';
import { SLIME, BAT } from './config.js';
import { regionTexture } from './textures.js';
import { depthForY } from './world.js';

// A slow-patrolling Slime = "bureaucratic friction". Bumps the player, never kills.
class Slime {
  constructor(scene, baseTex, spawn) {
    this.kind = 'slime';
    this.contactRadius = SLIME.contactRadius;
    this.spawnX = spawn.x;
    this.pos = new THREE.Vector2(spawn.x, spawn.y);
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.animTime = Math.random() * 2;

    const size = SLIME.frameSize;
    this.frames = Math.max(1, Math.floor(baseTex.image.width / size));
    this.img = baseTex.image;
    this.tex = regionTexture(baseTex, { x: 0, y: 0, w: size, h: size });
    this.material = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.01 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.material);
    scene.add(this.mesh);
  }

  update(dt) {
    // Patrol left/right around the spawn point.
    this.pos.x += this.dir * SLIME.speed * dt;
    if (Math.abs(this.pos.x - this.spawnX) > SLIME.patrolRange) {
      this.dir *= -1;
      this.pos.x = this.spawnX + Math.sign(this.pos.x - this.spawnX) * SLIME.patrolRange;
    }

    this.animTime += dt;
    const frame = Math.floor(this.animTime * SLIME.idle.fps) % this.frames;
    const size = SLIME.frameSize;
    this.tex.offset.set((frame * size) / this.img.width, 1 - size / this.img.height);

    this.mesh.position.set(this.pos.x, this.pos.y, depthForY(this.pos.y));
  }
}

// A Bat = "Processing Delay" (Level 2+). Loops a lazy orbit around its spawn,
// flapping. Drawn on a canvas so it needs no asset. Bumps the player, harmless.
class Bat {
  constructor(scene, spawn) {
    this.kind = 'bat';
    this.contactRadius = BAT.contactRadius;
    this.center = new THREE.Vector2(spawn.x, spawn.y);
    this.pos = new THREE.Vector2(spawn.x + BAT.radius, spawn.y);
    this.angle = Math.random() * Math.PI * 2;
    this.flapTime = Math.random();

    this.frames = [Bat.#draw(true), Bat.#draw(false)];
    this.material = new THREE.MeshBasicMaterial({ map: this.frames[0], transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), this.material);
    scene.add(this.mesh);
  }

  static #draw(wingsUp) {
    const c = document.createElement('canvas');
    c.width = 20; c.height = 16;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2b2440';
    // body
    ctx.fillRect(8, 6, 4, 6);
    // wings — up or down flap
    const y = wingsUp ? 3 : 8;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(1, y);
    ctx.lineTo(3, 10);
    ctx.lineTo(8, 10);
    ctx.moveTo(12, 8);
    ctx.lineTo(19, y);
    ctx.lineTo(17, 10);
    ctx.lineTo(12, 10);
    ctx.fill();
    // ears + eyes
    ctx.fillRect(8, 4, 1, 2);
    ctx.fillRect(11, 4, 1, 2);
    ctx.fillStyle = '#e05252';
    ctx.fillRect(8, 7, 1, 1);
    ctx.fillRect(11, 7, 1, 1);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  update(dt) {
    this.angle += BAT.speed * dt;
    this.pos.x = this.center.x + Math.cos(this.angle) * BAT.radius;
    this.pos.y = this.center.y + Math.sin(this.angle) * BAT.radius * 0.6; // squashed orbit

    this.flapTime += dt;
    const frame = Math.floor(this.flapTime * BAT.idle.fps) % 2;
    if (this.material.map !== this.frames[frame]) {
      this.material.map = this.frames[frame];
      this.material.needsUpdate = true;
    }
    this.mesh.position.set(this.pos.x, this.pos.y + 6, depthForY(this.pos.y - 20));
  }
}

// Build every enemy for a level from its spawn table { slime: [...], bat: [...] }.
// `parent` is the level root group so a level switch removes them all at once.
// Returns a flat list; each has .update(dt), .pos, .contactRadius, .kind.
export function buildEnemies(parent, textures, spawns = {}) {
  const enemies = [];
  for (const s of spawns.slime || []) enemies.push(new Slime(parent, textures.slimeIdle, s));
  for (const b of spawns.bat || []) enemies.push(new Bat(parent, b));
  return enemies;
}
