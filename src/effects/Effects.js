import * as THREE from 'three';
import { BLOCK, BLOCK_DATA } from '../world/blocks.js';

const PARTICLE_COUNT = 192;
const PLACEMENT_COUNT = 16;
const BREAK_LIFETIME = 1;
const PLACEMENT_DURATION = 0.15;
const PARTICLE_GRAVITY = 13;
const PARTICLE_RADIUS = 0.06;

const damp = (current, target, response, dt) =>
  current + (target - current) * (1 - Math.exp(-response * dt));

/** Effets visuels réutilisant exclusivement des pools InstancedMesh fixes. */
export class Effects {
  constructor(scene, world, camera, viewCamera, playerModel, highlight, player) {
    this.world = world;
    this.camera = camera;
    this.viewCamera = viewCamera;
    this.playerModel = playerModel;
    this.highlight = highlight;
    this.halfX = world.sizeX / 2;
    this.halfZ = world.sizeZ / 2;

    this._matrix = new THREE.Matrix4();
    this._position = new THREE.Vector3();
    this._scale = new THREE.Vector3();
    this._rotation = new THREE.Quaternion();
    this._color = new THREE.Color();
    this._randomState = 0x6d2b79f5;
    this._particleCursor = 0;
    this._placementCursor = 0;
    this._pulseTime = 0;
    this._breakActionAge = Infinity;
    this._placeActionAge = Infinity;
    this._cameraCompression = 0;
    this._bobWeight = 0;
    this._previousOnGround = player.onGround;
    this._previousInWater = player.inWater;
    this._previousVelocityY = player.velocity.y;

    this.particleMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(PARTICLE_RADIUS * 2, PARTICLE_RADIUS * 2, PARTICLE_RADIUS * 2),
      new THREE.MeshLambertMaterial({ vertexColors: true }),
      PARTICLE_COUNT,
    );
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    this.particleMesh.renderOrder = 2;
    scene.add(this.particleMesh);

    this.particleActive = new Uint8Array(PARTICLE_COUNT);
    this.particleX = new Float32Array(PARTICLE_COUNT);
    this.particleY = new Float32Array(PARTICLE_COUNT);
    this.particleZ = new Float32Array(PARTICLE_COUNT);
    this.particleVX = new Float32Array(PARTICLE_COUNT);
    this.particleVY = new Float32Array(PARTICLE_COUNT);
    this.particleVZ = new Float32Array(PARTICLE_COUNT);
    this.particleAge = new Float32Array(PARTICLE_COUNT);
    this.particleLife = new Float32Array(PARTICLE_COUNT);
    this.particleSize = new Float32Array(PARTICLE_COUNT);

    this.placementMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshLambertMaterial({ vertexColors: true }),
      PLACEMENT_COUNT,
    );
    this.placementMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.placementMesh.frustumCulled = false;
    this.placementMesh.renderOrder = 1;
    scene.add(this.placementMesh);

    this.placementActive = new Uint8Array(PLACEMENT_COUNT);
    this.placementX = new Int16Array(PLACEMENT_COUNT);
    this.placementY = new Int16Array(PLACEMENT_COUNT);
    this.placementZ = new Int16Array(PLACEMENT_COUNT);
    this.placementType = new Uint8Array(PLACEMENT_COUNT);
    this.placementAge = new Float32Array(PLACEMENT_COUNT);

    this._hideAllInstances();

    if (this.highlight?.mesh?.material) {
      this.highlight.mesh.material.transparent = true;
      this.highlight.mesh.material.opacity = 0.85;
    }
  }

  _hideAllInstances() {
    this._scale.setScalar(0);
    this._matrix.compose(this._position.set(0, -1000, 0), this._rotation, this._scale);
    for (let index = 0; index < PARTICLE_COUNT; index++) {
      this.particleMesh.setMatrixAt(index, this._matrix);
      this.particleMesh.setColorAt(index, this._color.setHex(0xffffff));
    }
    for (let index = 0; index < PLACEMENT_COUNT; index++) {
      this.placementMesh.setMatrixAt(index, this._matrix);
      this.placementMesh.setColorAt(index, this._color.setHex(0xffffff));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.placementMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    if (this.placementMesh.instanceColor) this.placementMesh.instanceColor.needsUpdate = true;
  }

  _random() {
    let value = this._randomState;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this._randomState = value >>> 0;
    return this._randomState / 0x100000000;
  }

  _acquireParticle() {
    for (let offset = 0; offset < PARTICLE_COUNT; offset++) {
      const index = (this._particleCursor + offset) % PARTICLE_COUNT;
      if (!this.particleActive[index]) {
        this._particleCursor = (index + 1) % PARTICLE_COUNT;
        return index;
      }
    }
    const index = this._particleCursor;
    this._particleCursor = (index + 1) % PARTICLE_COUNT;
    return index;
  }

  _spawnParticle(x, y, z, vx, vy, vz, color, life, size = 1) {
    const index = this._acquireParticle();
    this.particleActive[index] = 1;
    this.particleX[index] = x;
    this.particleY[index] = y;
    this.particleZ[index] = z;
    this.particleVX[index] = vx;
    this.particleVY[index] = vy;
    this.particleVZ[index] = vz;
    this.particleAge[index] = 0;
    this.particleLife[index] = life;
    this.particleSize[index] = size;
    this._color.setHex(color).multiplyScalar(0.8 + this._random() * 0.3);
    this.particleMesh.setColorAt(index, this._color);
  }

  emitBlockBreak(x, y, z, type) {
    const count = 12 + Math.floor(this._random() * 9);
    const color = BLOCK_DATA[type]?.couleur ?? 0xffffff;
    for (let index = 0; index < count; index++) {
      const angle = this._random() * Math.PI * 2;
      const horizontalSpeed = 1.3 + this._random() * 2.8;
      this._spawnParticle(
        x + 0.5 + (this._random() - 0.5) * 0.55,
        y + 0.5 + (this._random() - 0.5) * 0.55,
        z + 0.5 + (this._random() - 0.5) * 0.55,
        Math.cos(angle) * horizontalSpeed,
        2.2 + this._random() * 3.8,
        Math.sin(angle) * horizontalSpeed,
        color,
        BREAK_LIFETIME,
        0.75 + this._random() * 0.65,
      );
    }
  }

  _emitDust(player) {
    const blockX = Math.floor(player.position.x);
    const blockY = Math.floor(player.position.y - 0.05);
    const blockZ = Math.floor(player.position.z);
    const type = this.world.getBlock(blockX, blockY, blockZ);
    const color = BLOCK_DATA[type]?.couleur ?? BLOCK_DATA[BLOCK.TERRE_ROUGE].couleur;
    for (let index = 0; index < 12; index++) {
      const angle = this._random() * Math.PI * 2;
      const speed = 0.5 + this._random() * 1.2;
      this._spawnParticle(
        player.position.x + (this._random() - 0.5) * 0.45,
        player.position.y + 0.08,
        player.position.z + (this._random() - 0.5) * 0.45,
        Math.cos(angle) * speed,
        0.4 + this._random() * 0.9,
        Math.sin(angle) * speed,
        color,
        0.65,
        0.55 + this._random() * 0.45,
      );
    }
  }

  _emitSplash(player) {
    const color = BLOCK_DATA[BLOCK.EAU].couleur;
    for (let index = 0; index < 16; index++) {
      const angle = this._random() * Math.PI * 2;
      const speed = 0.8 + this._random() * 1.8;
      this._spawnParticle(
        player.position.x + (this._random() - 0.5) * 0.55,
        player.position.y + 0.45,
        player.position.z + (this._random() - 0.5) * 0.55,
        Math.cos(angle) * speed,
        1.7 + this._random() * 2.1,
        Math.sin(angle) * speed,
        color,
        0.8,
        0.65 + this._random() * 0.5,
      );
    }
  }

  isPlacementReserved(x, y, z) {
    for (let index = 0; index < PLACEMENT_COUNT; index++) {
      if (
        this.placementActive[index] &&
        this.placementX[index] === x &&
        this.placementY[index] === y &&
        this.placementZ[index] === z
      ) return true;
    }
    return false;
  }

  placeBlock(x, y, z, type) {
    let slot = -1;
    for (let offset = 0; offset < PLACEMENT_COUNT; offset++) {
      const index = (this._placementCursor + offset) % PLACEMENT_COUNT;
      if (!this.placementActive[index]) {
        slot = index;
        break;
      }
    }
    if (slot === -1) {
      slot = this._placementCursor;
      this._commitPlacement(slot);
    }
    this._placementCursor = (slot + 1) % PLACEMENT_COUNT;
    this.placementActive[slot] = 1;
    this.placementX[slot] = x;
    this.placementY[slot] = y;
    this.placementZ[slot] = z;
    this.placementType[slot] = type;
    this.placementAge[slot] = 0;
    this.placementMesh.setColorAt(slot, this._color.setHex(BLOCK_DATA[type].couleur));
    return true;
  }

  _commitPlacement(index) {
    if (!this.placementActive[index]) return;
    this.world.setBlock(
      this.placementX[index],
      this.placementY[index],
      this.placementZ[index],
      this.placementType[index],
    );
    this.placementActive[index] = 0;
    this._hidePlacement(index);
  }

  _hidePlacement(index) {
    this._scale.setScalar(0);
    this._matrix.compose(this._position.set(0, -1000, 0), this._rotation, this._scale);
    this.placementMesh.setMatrixAt(index, this._matrix);
  }

  triggerBreakAction() {
    this._breakActionAge = 0;
    this._placeActionAge = Infinity;
  }

  triggerPlaceAction() {
    this._placeActionAge = 0;
    this._breakActionAge = Infinity;
  }

  update(dt, player) {
    const safeDt = Math.max(0, dt);

    if (!this._previousOnGround && player.onGround && this._previousVelocityY < -2.5) {
      this._emitDust(player);
      this._cameraCompression = -0.1;
    }
    if (!this._previousInWater && player.inWater) this._emitSplash(player);

    this._updateParticles(safeDt);
    this._updatePlacements(safeDt);
    this._updateHighlight(safeDt);
    this._updateArmActions(safeDt);
    this._updateCameraFeel(safeDt, player);

    this._previousOnGround = player.onGround;
    this._previousInWater = player.inWater;
    this._previousVelocityY = player.velocity.y;
  }

  _updateParticles(dt) {
    let matricesChanged = false;
    for (let index = 0; index < PARTICLE_COUNT; index++) {
      if (!this.particleActive[index]) continue;
      this.particleAge[index] += dt;
      if (this.particleAge[index] >= this.particleLife[index]) {
        this.particleActive[index] = 0;
        this._scale.setScalar(0);
        this._matrix.compose(this._position.set(0, -1000, 0), this._rotation, this._scale);
        this.particleMesh.setMatrixAt(index, this._matrix);
        matricesChanged = true;
        continue;
      }

      this.particleVY[index] -= PARTICLE_GRAVITY * dt;
      this.particleX[index] += this.particleVX[index] * dt;
      this.particleY[index] += this.particleVY[index] * dt;
      this.particleZ[index] += this.particleVZ[index] * dt;

      if (
        this.particleVY[index] < 0 &&
        this.world.isSolidAt(
          this.particleX[index],
          this.particleY[index] - PARTICLE_RADIUS,
          this.particleZ[index],
        )
      ) {
        this.particleY[index] = Math.floor(this.particleY[index] - PARTICLE_RADIUS) + 1 + PARTICLE_RADIUS;
        this.particleVY[index] = Math.abs(this.particleVY[index]) * 0.34;
        this.particleVX[index] *= 0.72;
        this.particleVZ[index] *= 0.72;
      }

      const remaining = 1 - this.particleAge[index] / this.particleLife[index];
      const fadeScale = Math.min(1, remaining * 3.5) * this.particleSize[index];
      this._position.set(
        this.particleX[index] - this.halfX,
        this.particleY[index],
        this.particleZ[index] - this.halfZ,
      );
      this._scale.setScalar(fadeScale);
      this._matrix.compose(this._position, this._rotation, this._scale);
      this.particleMesh.setMatrixAt(index, this._matrix);
      matricesChanged = true;
    }
    if (matricesChanged) this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
  }

  _updatePlacements(dt) {
    let changed = false;
    for (let index = 0; index < PLACEMENT_COUNT; index++) {
      if (!this.placementActive[index]) continue;
      this.placementAge[index] += dt;
      const progress = this.placementAge[index] / PLACEMENT_DURATION;
      if (progress >= 1) {
        this._commitPlacement(index);
        changed = true;
        continue;
      }

      const scale = progress < 0.65
        ? THREE.MathUtils.lerp(0.6, 1.1, progress / 0.65)
        : THREE.MathUtils.lerp(1.1, 1, (progress - 0.65) / 0.35);
      this._position.set(
        this.placementX[index] - this.halfX + 0.5,
        this.placementY[index] + 0.5,
        this.placementZ[index] - this.halfZ + 0.5,
      );
      this._scale.setScalar(scale);
      this._matrix.compose(this._position, this._rotation, this._scale);
      this.placementMesh.setMatrixAt(index, this._matrix);
      changed = true;
    }
    if (changed) this.placementMesh.instanceMatrix.needsUpdate = true;
    if (this.placementMesh.instanceColor) this.placementMesh.instanceColor.needsUpdate = true;
  }

  _updateHighlight(dt) {
    if (!this.highlight?.mesh) return;
    this._pulseTime += dt;
    if (this.highlight.mesh.visible) {
      const pulse = (Math.sin(this._pulseTime * 4) + 1) * 0.5;
      this.highlight.mesh.scale.setScalar(1 + pulse * 0.025);
      this.highlight.mesh.material.opacity = 0.68 + pulse * 0.25;
    } else {
      this.highlight.mesh.scale.setScalar(1);
    }
  }

  _updateArmActions(dt) {
    const breakDuration = 0.22;
    const placeDuration = 0.2;
    if (this._breakActionAge < breakDuration) {
      this._breakActionAge += dt;
      const progress = Math.min(1, this._breakActionAge / breakDuration);
      const strike = Math.sin(progress * Math.PI);
      this.playerModel.rightArmPivot.rotation.x = 0.15 + strike * 1.35;
      this.playerModel.rightArmPivot.rotation.z = strike * 0.12;
    } else if (this._placeActionAge < placeDuration) {
      this._placeActionAge += dt;
      const progress = Math.min(1, this._placeActionAge / placeDuration);
      const place = Math.sin(progress * Math.PI);
      this.playerModel.rightArmPivot.rotation.x = 0.1 + place * 0.8;
      this.playerModel.rightArmPivot.rotation.z = -place * 0.22;
    }
  }

  _updateCameraFeel(dt, player) {
    const speed = Math.hypot(player.velocity.x, player.velocity.z);
    const bobTarget = !this.viewCamera.isThirdPerson && player.onGround && !player.inWater && speed > 0.03
      ? Math.min(1, speed / 5)
      : 0;
    this._bobWeight = damp(this._bobWeight, bobTarget, 12, dt);
    this._cameraCompression = damp(this._cameraCompression, 0, 14, dt);

    if (this._bobWeight > 0.001) {
      const phase = this.playerModel.walkPhase;
      const verticalBob = Math.sin(phase * 2) * 0.035 * this._bobWeight;
      const lateralBob = Math.sin(phase) * 0.018 * this._bobWeight;
      this.camera.position.x += Math.cos(player.yaw) * lateralBob;
      this.camera.position.z -= Math.sin(player.yaw) * lateralBob;
      this.camera.position.y += verticalBob;
    }
    this.camera.position.y += this._cameraCompression;
  }
}
