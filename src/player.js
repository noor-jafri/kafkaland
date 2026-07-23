import * as THREE from 'three';
import { CHARACTER, PLAYER, TILE } from './config.js';
import { regionTexture } from './textures.js';
import { getMoveVector } from './input.js';
import { depthForY, resolveCollision } from './world.js';

// Animated character: one texture per sheet, frame selected via texture offset.
export class Player {
  constructor(scene, textures, startPos) {
    this.pos = startPos.clone();
    this.facing = 'down';
    this.moving = false;
    this.animTime = 0;

    const size = CHARACTER.frameSize;
    this.sheets = {
      idle: this.#makeSheet(textures.bunnyIdle, CHARACTER.idle),
      run: this.#makeSheet(textures.bunnyRun, CHARACTER.run),
      punch: this.#makeSheet(textures.bunnyPunch, CHARACTER.punch),
    };
    this.punchElapsed = Infinity; // >= punch duration means "not punching"

    this.material = new THREE.MeshBasicMaterial({
      map: this.sheets.idle.tex,
      transparent: true,
      alphaTest: 0.01,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.material);
    scene.add(this.mesh);

    const shadowTex = textures.shadow;
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.5 })
    );
    scene.add(this.shadow);
  }

  #makeSheet(baseTex, anim) {
    const size = CHARACTER.frameSize;
    const tex = regionTexture(baseTex, { x: 0, y: 0, w: size, h: size });
    return { tex, frames: anim.frames, fps: anim.fps, img: baseTex.image };
  }

  // Trigger a one-shot punch/vent animation (used by the Vent Mechanic).
  vent() {
    this.punchElapsed = 0;
  }

  get punching() {
    return this.punchElapsed < CHARACTER.punch.frames / CHARACTER.punch.fps;
  }

  update(dt, world, frozen = false) {
    const move = frozen ? { x: 0, y: 0 } : getMoveVector();
    this.moving = !this.punching && (move.x !== 0 || move.y !== 0);

    if (this.moving) {
      // Facing: horizontal wins so side-run reads nicely on diagonals.
      if (move.x < 0) this.facing = 'left';
      else if (move.x > 0) this.facing = 'right';
      else if (move.y > 0) this.facing = 'up';
      else this.facing = 'down';

      const halfW = PLAYER.colliderW / 2;
      const halfH = PLAYER.colliderH / 2;
      const feetY = () => this.pos.y + PLAYER.colliderOffsetY;

      // Move each axis separately so we slide along walls.
      const nx = this.pos.x + move.x * PLAYER.speed * dt;
      if (!resolveCollision(world, nx, feetY(), halfW, halfH)) this.pos.x = nx;
      const ny = this.pos.y + move.y * PLAYER.speed * dt;
      if (!resolveCollision(world, this.pos.x, ny + PLAYER.colliderOffsetY, halfW, halfH)) {
        this.pos.y = ny;
      }

      // Keep inside the map.
      this.pos.x = Math.max(TILE, Math.min(world.width - TILE, this.pos.x));
      this.pos.y = Math.max(TILE, Math.min(world.height - TILE, this.pos.y));
    }

    // --- Animation ---
    this.animTime += dt;
    this.punchElapsed += dt;
    let sheet, frame;
    if (this.punching) {
      sheet = this.sheets.punch;
      frame = Math.min(sheet.frames - 1, Math.floor(this.punchElapsed * sheet.fps));
    } else {
      sheet = this.moving ? this.sheets.run : this.sheets.idle;
      frame = Math.floor(this.animTime * sheet.fps) % sheet.frames;
    }
    const row = CHARACTER.rows[this.facing];
    const size = CHARACTER.frameSize;
    sheet.tex.offset.set(
      (frame * size) / sheet.img.width,
      1 - ((row + 1) * size) / sheet.img.height
    );
    if (this.material.map !== sheet.tex) {
      this.material.map = sheet.tex;
      this.material.needsUpdate = true;
    }

    // --- Placement ---
    const feet = this.pos.y + PLAYER.colliderOffsetY;
    this.mesh.position.set(this.pos.x, this.pos.y, depthForY(feet));
    this.shadow.position.set(this.pos.x, feet, depthForY(feet) - 0.0001);
  }
}
