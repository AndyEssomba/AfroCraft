import * as THREE from 'three';

export const VIEW_MODE = Object.freeze({
  FIRST_PERSON: 'first-person',
  THIRD_PERSON: 'third-person',
});

const CAMERA_DISTANCE = 4;
const CAMERA_HEIGHT = 1.2;
const CAMERA_SHOULDER = 0.7;
const COLLISION_STEP = 0.05;
const COLLISION_MARGIN = 0.15;

/** Caméra première personne ou troisième personne par-dessus l'épaule droite. */
export class ThirdPersonCamera {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.mode = VIEW_MODE.THIRD_PERSON;
    this._eye = new THREE.Vector3();
    this._horizontalForward = new THREE.Vector3();
    this._right = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._segment = new THREE.Vector3();
    this._sample = new THREE.Vector3();
  }

  get isThirdPerson() {
    return this.mode === VIEW_MODE.THIRD_PERSON;
  }

  toggle() {
    this.mode = this.isThirdPerson
      ? VIEW_MODE.FIRST_PERSON
      : VIEW_MODE.THIRD_PERSON;
    return this.mode;
  }

  update(player) {
    player.getEyePosition(this._eye);
    this.camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');

    if (!this.isThirdPerson) {
      this._setScenePosition(this._eye);
      return;
    }

    this._horizontalForward.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    this._right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    this._desired
      .copy(this._eye)
      .addScaledVector(this._horizontalForward, -CAMERA_DISTANCE)
      .addScaledVector(this._right, CAMERA_SHOULDER);
    this._desired.y += CAMERA_HEIGHT;

    this._setScenePosition(this._resolveObstruction(this._eye, this._desired));
  }

  /** Rapproche la caméra juste avant le premier bloc solide du segment. */
  _resolveObstruction(origin, desired) {
    this._segment.subVectors(desired, origin);
    const length = this._segment.length();
    if (length === 0) return this._sample.copy(origin);

    this._segment.multiplyScalar(1 / length);
    for (let distance = COLLISION_STEP; distance <= length; distance += COLLISION_STEP) {
      this._sample.copy(origin).addScaledVector(this._segment, distance);
      if (this.world.isSolidAt(this._sample.x, this._sample.y, this._sample.z)) {
        const safeDistance = Math.max(0, distance - COLLISION_MARGIN);
        return this._sample.copy(origin).addScaledVector(this._segment, safeDistance);
      }
    }
    return this._sample.copy(desired);
  }

  _setScenePosition(gridPosition) {
    this.camera.position.set(
      gridPosition.x - this.world.sizeX / 2,
      gridPosition.y,
      gridPosition.z - this.world.sizeZ / 2,
    );
  }
}
