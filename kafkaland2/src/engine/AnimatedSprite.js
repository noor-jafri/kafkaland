import { createSprite, placeSprite } from "./Sprite.js";

/**
 * A single textured plane whose material.map is swapped between pre-sliced
 * frame textures. Frame advancement is time based for looping clips (idle,
 * run) but can also be driven manually via setFrame (used for jump, which we
 * key off vertical velocity rather than a timer).
 */
export class AnimatedSprite {
  constructor(frameSets, { width, height, anchorX = 0.5, anchorY = 0, z = 0, fps = 10 }) {
    this.frameSets = frameSets;
    this.fps = fps;
    this.mesh = createSprite(frameSets[Object.keys(frameSets)[0]][0], width, height, {
      anchorX,
      anchorY,
      z,
    });
    this.currentAnim = null;
    this.frameIndex = 0;
    this.timer = 0;
    this.loop = true;
  }

  setAnimation(name, { loop = true, manual = false } = {}) {
    this.manual = manual;
    if (this.currentAnim === name) return;
    this.currentAnim = name;
    this.frameIndex = 0;
    this.timer = 0;
    this.loop = loop;
    this._applyFrame();
  }

  // Directly picks a frame (e.g. jump uses vertical velocity, not a timer)
  // and freezes auto-advance until a different animation is selected.
  setFrame(index) {
    const frames = this.frameSets[this.currentAnim];
    this.frameIndex = Math.max(0, Math.min(frames.length - 1, index));
    this._applyFrame();
  }

  setFlip(flipped) {
    this.mesh.scale.x = flipped ? -1 : 1;
  }

  update(dt) {
    if (this.manual) return;
    const frames = this.frameSets[this.currentAnim];
    if (!frames || frames.length <= 1) return;
    this.timer += dt;
    const frameDuration = 1 / this.fps;
    if (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      const next = this.frameIndex + 1;
      if (next >= frames.length) {
        this.frameIndex = this.loop ? 0 : frames.length - 1;
      } else {
        this.frameIndex = next;
      }
      this._applyFrame();
    }
  }

  _applyFrame() {
    const frames = this.frameSets[this.currentAnim];
    if (!frames) return;
    this.mesh.material.map = frames[this.frameIndex];
    this.mesh.material.needsUpdate = true;
  }

  setPosition(x, y) {
    placeSprite(this.mesh, x, y, this.mesh.position.z);
  }
}
