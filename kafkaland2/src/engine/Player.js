import { AnimatedSprite } from "./AnimatedSprite.js";
import { frameTexture } from "./textureUtils.js";
import { GRAVITY, JUMP_SPEED, MOVE_SPEED, resolveLanding } from "./Physics.js";

const FRAME_SIZE = 150;
// All three character sheets share (roughly) the same bottom margin below the
// feet within their 150x150 frame, so one fraction works for idle/run/jump.
const FOOT_ANCHOR_FRACTION = 55 / 150;
const QUAD_SIZE = 205; // world units (px) — see docs/derivation in project notes
export const PLAYER_HALF_WIDTH = 18;
export const PLAYER_BODY_HEIGHT = 56; // approx visible character height, for pickup/trigger overlap checks

function buildFrames(baseTexture, count) {
  const frames = [];
  for (let i = 0; i < count; i++) frames.push(frameTexture(baseTexture, count, i));
  return frames;
}

export class Player {
  constructor(textures, { x, y, z = 0 }) {
    const frameSets = {
      idle: buildFrames(textures.charIdle, 8),
      run: buildFrames(textures.charRun, 8),
      jump: buildFrames(textures.charJump, 2),
    };

    this.sprite = new AnimatedSprite(frameSets, {
      width: QUAD_SIZE,
      height: QUAD_SIZE,
      anchorX: 0.5,
      anchorY: FOOT_ANCHOR_FRACTION,
      z,
      fps: 12,
    });
    this.sprite.setAnimation("idle");

    this.x = x;
    this.y = y;
    this.vy = 0;
    this.grounded = true;
    this.facing = 1;
    this.halfWidth = PLAYER_HALF_WIDTH;

    this._syncSprite();
  }

  get mesh() {
    return this.sprite.mesh;
  }

  update(dt, input, solids, levelWidth) {
    const moveX = input.moveX;
    this.x += moveX * MOVE_SPEED * dt;
    this.x = Math.max(this.halfWidth, Math.min(levelWidth - this.halfWidth, this.x));

    if (moveX !== 0) this.facing = moveX > 0 ? 1 : -1;

    if (input.consumeJump() && this.grounded) {
      this.vy = JUMP_SPEED;
      this.grounded = false;
    }

    this.vy -= GRAVITY * dt;
    const prevFeetY = this.y;
    const nextFeetY = this.y + this.vy * dt;

    const result = resolveLanding(
      { x: this.x, halfWidth: this.halfWidth, prevFeetY, nextFeetY, vy: this.vy },
      solids
    );
    this.y = result.y;
    this.vy = result.vy;
    this.grounded = result.grounded;

    this._updateAnimation(moveX);
    this.sprite.update(dt);
    this._syncSprite();
  }

  _updateAnimation(moveX) {
    if (!this.grounded) {
      this.sprite.setAnimation("jump", { loop: false, manual: true });
      this.sprite.setFrame(this.vy > 0 ? 0 : 1);
    } else if (moveX !== 0) {
      this.sprite.setAnimation("run");
    } else {
      this.sprite.setAnimation("idle");
    }
    this.sprite.setFlip(this.facing < 0);
  }

  _syncSprite() {
    this.sprite.setPosition(this.x, this.y);
  }
}
