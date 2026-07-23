import * as THREE from 'three';
import { SLIME } from './config.js';
import { regionTexture } from './textures.js';
import { depthForY } from './world.js';

// A slow-patrolling Slime = "bureaucratic friction". Bumps the player, never kills.
class Slime {
  constructor(scene, baseTex, spawn) {
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

export function buildSlimes(scene, textures, spawns) {
  return spawns.map((s) => new Slime(scene, textures.slimeIdle, s));
}
