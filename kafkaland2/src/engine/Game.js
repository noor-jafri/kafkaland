import * as THREE from "three";
import { loadAssets } from "./AssetLoader.js";
import { Input } from "./Input.js";
import { Player, PLAYER_BODY_HEIGHT } from "./Player.js";
import { ParallaxLayer } from "./ParallaxLayer.js";
import { Hud } from "./Hud.js";
import { loadLevel } from "../levels/LevelLoader.js";
import { level1 } from "../levels/level1.js";

const VIEW_HEIGHT = 400; // world units visible vertically
const CAMERA_Y_FRACTION = 0.22; // keeps the street in the lower part of frame

function overlap1D(aMin, aMax, bMin, bMax) {
  return aMin < bMax && aMax > bMin;
}

export class Game {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera();
    this.camera.position.z = 500;

    this.hud = new Hud();
    this.input = new Input();
    this.clock = new THREE.Clock();
    this.running = false;
    this.inSubmissionZone = false;
    this.stageComplete = false;

    window.addEventListener("resize", () => this._resize());
  }

  async start() {
    const assets = await loadAssets();
    this._setupParallax(assets.textures);

    this.level = loadLevel(level1, assets, this.scene);
    this.hud.setDocTotal(this.level.documents.length);
    this.hud.setDocCount(0);

    this.player = new Player(assets.textures, {
      x: this.level.playerStart.x,
      y: this.level.playerStart.y,
      z: 0,
    });
    this.scene.add(this.player.mesh);

    this._resize();
    this.camera.position.x = this.player.x;
    this.camera.position.y = this.level.groundY + VIEW_HEIGHT * CAMERA_Y_FRACTION;

    this.hud.onStart(() => {
      this.running = true;
    });

    this._loop();
  }

  _setupParallax(textures) {
    this.layers = [
      new ParallaxLayer(textures.bgSky, {
        textureWorldWidth: 1024,
        textureWorldHeight: 346,
        bottomY: 0,
        z: -100,
        parallaxFactor: 0,
        stretchToView: true,
      }),
      new ParallaxLayer(textures.bgFar, {
        textureWorldWidth: 1024,
        textureWorldHeight: 346,
        bottomY: -10,
        z: -90,
        parallaxFactor: 0.15,
      }),
      new ParallaxLayer(textures.bgNear, {
        textureWorldWidth: 1024,
        textureWorldHeight: 346,
        bottomY: -10,
        z: -80,
        parallaxFactor: 0.35,
      }),
    ];
    for (const layer of this.layers) this.scene.add(layer.mesh);
  }

  _resize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewWidth = VIEW_HEIGHT * aspect;
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = VIEW_HEIGHT / 2;
    this.camera.bottom = -VIEW_HEIGHT / 2;
    this.camera.updateProjectionMatrix();
    this.viewWidth = viewWidth;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    for (const layer of this.layers || []) layer.resize(viewWidth, VIEW_HEIGHT);
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.running) this._update(dt);
    // Parallax follows the camera even while paused so the intro screen
    // already shows a correctly-framed scene.
    for (const layer of this.layers) layer.update(this.camera.position.x, this.camera.position.y);
    this._render();
  }

  _update(dt) {
    if (this.input.anyKeyPressed) this.hud.hideHint();

    this.player.update(dt, this.input, this.level.solids, this.level.width);
    this._updateCamera();
    this._updateDocuments(dt);
    this._checkSubmission();
  }

  _updateCamera() {
    const halfW = this.viewWidth / 2;
    const minX = halfW;
    const maxX = Math.max(halfW, this.level.width - halfW);
    this.camera.position.x = Math.max(minX, Math.min(maxX, this.player.x));
  }

  _updateDocuments(dt) {
    const p = this.player;
    const pMinX = p.x - p.halfWidth;
    const pMaxX = p.x + p.halfWidth;
    const pMinY = p.y;
    const pMaxY = p.y + PLAYER_BODY_HEIGHT;

    for (const doc of this.level.documents) {
      if (doc.collected) continue;

      doc.bobPhase += dt * 3;
      doc.mesh.position.y = doc.worldY + Math.sin(doc.bobPhase) * 3;

      const dMinX = doc.x - doc.halfWidth;
      const dMaxX = doc.x + doc.halfWidth;
      const dMinY = doc.y;
      const dMaxY = doc.y + doc.height;

      if (
        overlap1D(pMinX, pMaxX, dMinX, dMaxX) &&
        overlap1D(pMinY, pMaxY, dMinY, dMaxY)
      ) {
        doc.collected = true;
        this.scene.remove(doc.mesh);
        const count = this.level.documents.filter((d) => d.collected).length;
        this.hud.setDocCount(count);
        this.hud.showBanner(`+ ${doc.name}`);
      }
    }
  }

  _checkSubmission() {
    const p = this.player;
    const zone = this.level.submissionZone;
    const inZone = p.grounded && p.x > zone.left && p.x < zone.right;

    if (inZone && !this.inSubmissionZone) {
      const total = this.level.documents.length;
      const collected = this.level.documents.filter((d) => d.collected).length;
      if (collected === total) {
        this.stageComplete = true;
        this.hud.showBanner("✅ Antrag eingereicht — Stage complete!", 6000);
      } else {
        const missing = total - collected;
        this.hud.showBanner(`Fehlende Unterlagen: noch ${missing} nötig`, 3000);
      }
    }
    this.inSubmissionZone = inZone;
  }

  _render() {
    this.renderer.render(this.scene, this.camera);
  }
}
