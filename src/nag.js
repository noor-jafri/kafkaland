import * as THREE from 'three';
import { NAG } from './config.js';
import { depthForY } from './world.js';

// "Rundfunkbeitrag Man" — the recurring running gag. Spawns from a map edge,
// speed-walks at the player barking about the broadcasting fee. Slightly slower
// than the player, so you can outrun him. Non-fatal.
export class Nag {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.timer = NAG.firstDelay;
    this.pos = new THREE.Vector2();
    this.caughtHandled = false;

    // Drawn on a canvas: a stubby postman with an oversized envelope.
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#243b6b'; // uniform
    ctx.fillRect(7, 12, 10, 16);
    ctx.fillStyle = '#e8c39e'; // face
    ctx.fillRect(8, 5, 8, 7);
    ctx.fillStyle = '#1a2a4a'; // cap
    ctx.fillRect(7, 3, 10, 4);
    ctx.fillStyle = '#f5f0dc'; // giant envelope
    ctx.fillRect(2, 16, 12, 9);
    ctx.strokeStyle = '#b03030';
    ctx.strokeRect(2.5, 16.5, 11, 8);
    ctx.beginPath();
    ctx.moveTo(2.5, 16.5);
    ctx.lineTo(8, 21);
    ctx.lineTo(13.5, 16.5);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    this.material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 32), this.material);
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

  despawn(msg) {
    this.active = false;
    this.mesh.visible = false;
    this.timer = NAG.interval;
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
    // He gives up after ~10s of failing to catch you (you outran him).
    if (this.chaseTime > 10) return 'fled';

    // Chase.
    const dx = player.pos.x - this.pos.x;
    const dy = player.pos.y - this.pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.pos.x += (dx / dist) * NAG.speed * dt;
    this.pos.y += (dy / dist) * NAG.speed * dt;
    this.mesh.position.set(this.pos.x, this.pos.y + 8, depthForY(this.pos.y));

    if (dist < NAG.catchRadius && !this.caughtHandled) {
      this.caughtHandled = true;
      return 'caught';
    }
    return null;
  }

  isNear(player) {
    return this.active && Math.hypot(player.pos.x - this.pos.x, player.pos.y - this.pos.y) < NAG.catchRadius + 14;
  }
}
