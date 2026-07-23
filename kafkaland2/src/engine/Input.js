const MOVE_LEFT = new Set(["ArrowLeft", "KeyA"]);
const MOVE_RIGHT = new Set(["ArrowRight", "KeyD"]);
const JUMP = new Set(["Space", "ArrowUp", "KeyW"]);

export class Input {
  constructor() {
    this.keys = new Set();
    this.jumpPressed = false;
    this.anyKeyPressed = false;

    this._onKeyDown = (e) => {
      this.keys.add(e.code);
      this.anyKeyPressed = true;
      if (JUMP.has(e.code)) this.jumpPressed = true;
      if (e.code === "Space") e.preventDefault();
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  get moveX() {
    let x = 0;
    for (const k of this.keys) {
      if (MOVE_LEFT.has(k)) x -= 1;
      if (MOVE_RIGHT.has(k)) x += 1;
    }
    return Math.max(-1, Math.min(1, x));
  }

  consumeJump() {
    const pressed = this.jumpPressed;
    this.jumpPressed = false;
    return pressed;
  }

  dispose() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }
}
