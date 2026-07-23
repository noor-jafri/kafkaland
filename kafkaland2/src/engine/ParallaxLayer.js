import * as THREE from "three";

/**
 * A horizontally-tiling background layer that always fills the camera's
 * viewport and scrolls its texture (not its geometry) as the camera moves,
 * which is what gives the parallax depth illusion without needing a huge
 * mesh for a long level.
 */
export class ParallaxLayer {
  constructor(texture, { textureWorldWidth, textureWorldHeight, bottomY, z, parallaxFactor, stretchToView = false }) {
    this.texture = texture;
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    this.textureWorldWidth = textureWorldWidth;
    this.textureWorldHeight = textureWorldHeight;
    this.bottomY = bottomY;
    this.parallaxFactor = parallaxFactor;
    this.stretchToView = stretchToView;

    const geometry = new THREE.PlaneGeometry(1, stretchToView ? 1 : textureWorldHeight);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.z = z;
  }

  resize(viewWidth, viewHeight) {
    const padding = 1.4;
    this.currentWidth = viewWidth * padding;
    this.mesh.scale.x = this.currentWidth;
    if (this.stretchToView) {
      this.mesh.scale.y = viewHeight;
    }
    this.texture.repeat.x = this.currentWidth / this.textureWorldWidth;
  }

  update(cameraX, cameraY) {
    this.mesh.position.x = cameraX;
    if (this.stretchToView) {
      this.mesh.position.y = cameraY;
    } else {
      this.mesh.position.y = this.bottomY + this.textureWorldHeight / 2;
    }
    this.texture.offset.x = (-cameraX * this.parallaxFactor) / this.textureWorldWidth;
  }
}
