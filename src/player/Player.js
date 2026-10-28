// Joueur : caméra première personne, entrées, orientation, gravité, saut,
// chute, collisions AABB, traversée de l'eau, ralentissement et nage.
// Tâches 4.1, 4.2, 4.4 — _Requirements: 3.1–3.10, 4.4, 4.5, 4.7, 4.8_
import * as THREE from 'three';
import { moveAndCollide } from './Physics.js';
import { PLAYER_WIDTH, PLAYER_HEIGHT, EYE_HEIGHT } from './constants.js';
import { BLOCK } from '../world/blocks.js';

export { PLAYER_WIDTH, PLAYER_HEIGHT, EYE_HEIGHT };

const MOVE_SPEED = 5; // blocs/seconde
const MOUSE_SENSITIVITY = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.01; // empêche le retournement (3.7)
export const GRAVITY = 24; // blocs/s^2 (gravité constante, 3.9)
export const JUMP_SPEED = 8.5; // impulsion de saut (3.8)
const TERMINAL_FALL = 60; // vitesse de chute maximale

// Eau — Exigence 4.5, 4.7, 4.8.
const WATER_HORIZONTAL_FACTOR = 0.5; // ralentit le déplacement horizontal (4.5)
const WATER_FALL_FACTOR = 0.35; // ralentit la chute (4.5)
export const SWIM_UP_SPEED = 3; // remontée lente en maintenant Espace (4.7)

export class Player {
  constructor(camera, world, spawn = { x: 0, y: 0, z: 0 }) {
    this.camera = camera;
    this.world = world;
    this.position = new THREE.Vector3(spawn.x, spawn.y, spawn.z); // pieds
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.inWater = false;
    camera.rotation.order = 'YXZ';
  }

  onMouseMove(dx, dy) {
    this.yaw -= dx * MOUSE_SENSITIVITY;
    this.pitch -= dy * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  }

  _desiredHorizontal(keys) {
    let forward = 0;
    let strafe = 0;
    if (keys.has('KeyW') || keys.has('KeyZ') || keys.has('ArrowUp')) forward += 1; // 3.2
    if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1; // 3.3
    if (keys.has('KeyA') || keys.has('KeyQ') || keys.has('ArrowLeft')) strafe -= 1; // 3.4
    if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1; // 3.5
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const dir = new THREE.Vector3(
      -sin * forward + cos * strafe,
      0,
      -cos * forward - sin * strafe,
    );
    if (dir.lengthSq() > 0) dir.normalize();
    return dir;
  }

  /** Vrai si le corps du joueur recouvre au moins une cellule d'eau (4.4, 4.5). */
  _detectWater() {
    const hw = PLAYER_WIDTH / 2;
    const x0 = Math.floor(this.position.x - hw);
    const x1 = Math.floor(this.position.x + hw);
    const y0 = Math.floor(this.position.y);
    const y1 = Math.floor(this.position.y + PLAYER_HEIGHT - 1e-4);
    const z0 = Math.floor(this.position.z - hw);
    const z1 = Math.floor(this.position.z + hw);
    for (let x = x0; x <= x1; x++)
      for (let y = y0; y <= y1; y++)
        for (let z = z0; z <= z1; z++)
          if (this.world.getBlock(x, y, z) === BLOCK.EAU) return true;
    return false;
  }

  /**
   * Intègre les entrées et la physique (gravité, saut, nage, collisions).
   * @param {number} dt
   * @param {{keys:Set<string>}} input
   */
  update(dt, input) {
    const keys = input.keys ?? new Set();
    this.inWater = this._detectWater();

    // Déplacement horizontal désiré (ralenti dans l'eau, 4.5).
    const dir = this._desiredHorizontal(keys);
    const hFactor = this.inWater ? WATER_HORIZONTAL_FACTOR : 1;
    this.velocity.x = dir.x * MOVE_SPEED * hFactor;
    this.velocity.z = dir.z * MOVE_SPEED * hFactor;

    const jumpHeld = keys.has('Space');

    if (this.inWater) {
      // Nage : maintenir Espace produit une remontée lente ; sinon chute
      // ralentie. La vitesse de remontée l'emporte sur la gravité ralentie,
      // donc jamais bloqué au fond (4.7, 4.8).
      if (jumpHeld) {
        this.velocity.y = SWIM_UP_SPEED;
      } else {
        this.velocity.y -= GRAVITY * WATER_FALL_FACTOR * dt;
        const maxSink = -TERMINAL_FALL * WATER_FALL_FACTOR;
        if (this.velocity.y < maxSink) this.velocity.y = maxSink;
      }
    } else {
      // Saut hors de l'eau : seulement si soutenu (3.8).
      if (jumpHeld && this.onGround) {
        this.velocity.y = JUMP_SPEED;
        this.onGround = false;
      }
      // Gravité constante (3.9).
      this.velocity.y -= GRAVITY * dt;
      if (this.velocity.y < -TERMINAL_FALL) this.velocity.y = -TERMINAL_FALL;
    }

    // Collision AABB axe par axe (l'eau n'est pas solide, donc traversable, 4.4).
    moveAndCollide(this, this.world, dt);
  }

  /** Position des yeux en coordonnées de grille. */
  getEyePosition(target = new THREE.Vector3()) {
    return target.set(
      this.position.x,
      this.position.y + EYE_HEIGHT,
      this.position.z,
    );
  }

  /** Direction complète du regard (yaw + pitch), indépendante du mode caméra. */
  getViewDirection(target = new THREE.Vector3()) {
    const cosPitch = Math.cos(this.pitch);
    return target.set(
      -Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * cosPitch,
    ).normalize();
  }

  get aabb() {
    const hw = PLAYER_WIDTH / 2;
    return {
      minX: this.position.x - hw,
      maxX: this.position.x + hw,
      minY: this.position.y,
      maxY: this.position.y + PLAYER_HEIGHT,
      minZ: this.position.z - hw,
      maxZ: this.position.z + hw,
    };
  }
}

export { MOVE_SPEED, MOUSE_SENSITIVITY };