// Interaction : raycast voxel (DDA) sur la grille (pas sur les meshes),
// casser/poser des blocs. La surbrillance/réticule (6.9) et le câblage (6.10)
// sont ajoutés ensuite.
// Tâche 6.1 — _Requirements: 6.2, 6.5, 10.2_
import * as THREE from 'three';
import { BLOCK, isSolide, isCassable } from '../world/blocks.js';

export const REACH = 5; // portée d'interaction en blocs (6.5)

export class Interaction {
  /**
   * @param {import('../world/World.js').World} world
   * @param {import('../player/Player.js').Player} player
   * @param {object} [hotbar]
   * @param {object} [renderer]
   * @param {object} [pointerLock]
   */
  constructor(world, player, hotbar = null, renderer = null, pointerLock = null) {
    this.world = world;
    this.player = player;
    this.hotbar = hotbar;
    this.renderer = renderer;
    this.pointerLock = pointerLock;
    this.highlight = null; // défini par le câblage (6.10)
    this.effects = null;
  }

  /**
   * Raycast voxel par DDA le long de la ligne de visée de la caméra.
   * L'origine par défaut est toujours aux yeux du personnage, même lorsque la
   * caméra est reculée en troisième personne. La portée est donc mesurée depuis
   * les yeux. La direction reste celle du centre de la caméra.
   * @param {THREE.Vector3} [origin] origine explicite en coordonnées de grille
   * @param {THREE.Vector3} [dir] direction normalisée (par défaut : regard caméra)
   * @returns {{x:number,y:number,z:number,faceNormal:{x:number,y:number,z:number}}|null}
   */
  raycast(origin, dir) {
    const camera = this.player.camera;
    const o = origin ?? (
      typeof this.player.getEyePosition === 'function'
        ? this.player.getEyePosition(new THREE.Vector3())
        : camera.position.clone()
    );
    let d = dir;
    if (!d) {
      d = new THREE.Vector3();
      camera.getWorldDirection(d);
    }
    d = d.clone().normalize();

    // Algorithme DDA (Amanatides & Woo).
    let x = Math.floor(o.x);
    let y = Math.floor(o.y);
    let z = Math.floor(o.z);

    const stepX = Math.sign(d.x) || 1;
    const stepY = Math.sign(d.y) || 1;
    const stepZ = Math.sign(d.z) || 1;

    const invX = d.x !== 0 ? Math.abs(1 / d.x) : Infinity;
    const invY = d.y !== 0 ? Math.abs(1 / d.y) : Infinity;
    const invZ = d.z !== 0 ? Math.abs(1 / d.z) : Infinity;

    const distToNext = (orig, cell, step) => {
      if (step > 0) return (cell + 1 - orig);
      return orig - cell;
    };
    let tMaxX = d.x !== 0 ? distToNext(o.x, x, stepX) * invX : Infinity;
    let tMaxY = d.y !== 0 ? distToNext(o.y, y, stepY) * invY : Infinity;
    let tMaxZ = d.z !== 0 ? distToNext(o.z, z, stepZ) * invZ : Infinity;

    let faceNormal = { x: 0, y: 0, z: 0 };
    let t = 0;
    const maxT = REACH;

    // Vérifie la cellule d'origine d'abord.
    while (t <= maxT) {
      const block = this.world.getBlock(x, y, z);
      if (isSolide(block)) {
        return { x, y, z, faceNormal };
      }
      // avance à la prochaine frontière de cellule
      if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += invX;
        faceNormal = { x: -stepX, y: 0, z: 0 };
      } else if (tMaxY <= tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += invY;
        faceNormal = { x: 0, y: -stepY, z: 0 };
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += invZ;
        faceNormal = { x: 0, y: 0, z: -stepZ };
      }
    }
    return null; // rien de solide à portée (6.3, 7.7, 10.3)
  }

  /**
   * Casse le bloc visé (clic gauche) : retire le bloc solide à <= 5, interdit
   * l'eau et la bedrock, ne fait rien hors portée ni hors capture souris.
   * Modifie uniquement la cellule visée (feuilles voisines intactes, 12.1) ;
   * aucun inventaire (6.8).
   * Tâche 6.5 — _Requirements: 6.1, 6.3, 6.5, 6.6, 6.7, 6.8, 12.1_
   * @returns {boolean} vrai si un bloc a été cassé
   */
  breakBlock() {
    if (this.pointerLock && !this.pointerLock.isLocked) return false; // 11.4
    const hit = this.raycast();
    if (!hit) return false; // 6.3
    const t = this.world.getBlock(hit.x, hit.y, hit.z);
    if (!isCassable(t)) return false; // 6.6 (eau), 6.7 (bedrock)
    this.effects?.emitBlockBreak(hit.x, hit.y, hit.z, t);
    this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR); // 6.1 ; pas d'inventaire (6.8)
    return true;
  }

  /** Vrai si une cellule entière (x,y,z) chevauche l'AABB du joueur (7.5). */
  _cellOverlapsPlayer(x, y, z) {
    const box = this.player.aabb;
    const EPS = 1e-4;
    return (
      box.maxX > x + EPS && box.minX < x + 1 - EPS &&
      box.maxY > y + EPS && box.minY < y + 1 - EPS &&
      box.maxZ > z + EPS && box.minZ < z + 1 - EPS
    );
  }

  /**
   * Pose un bloc (clic droit) dans l'emplacement adjacent à la face visée :
   * pas sur un solide existant (7.3), remplace l'eau (7.4), pas dans l'espace
   * du joueur (7.5), rien hors portée (7.7) ni hors capture ; illimité (7.8).
   * Tâche 6.6 — _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_
   * @returns {boolean} vrai si un bloc a été posé
   */
  placeBlock() {
    if (this.pointerLock && !this.pointerLock.isLocked) return false; // 11.4
    const hit = this.raycast();
    if (!hit) return false; // 7.7
    const tx = hit.x + hit.faceNormal.x;
    const ty = hit.y + hit.faceNormal.y;
    const tz = hit.z + hit.faceNormal.z; // emplacement adjacent (7.2)
    if (!this.world.isInBounds(tx, ty, tz)) return false;
    if (this.effects?.isPlacementReserved(tx, ty, tz)) return false;
    const occupant = this.world.getBlock(tx, ty, tz);
    if (isSolide(occupant)) return false; // 7.3 (déjà occupé par un solide)
    if (this._cellOverlapsPlayer(tx, ty, tz)) return false; // 7.5
    // occupant === EAU : on écrase simplement (7.4)
    const type = this.hotbar ? this.hotbar.selectedType : BLOCK.PIERRE;
    if (this.effects) return this.effects.placeBlock(tx, ty, tz, type);
    this.world.setBlock(tx, ty, tz, type); // 7.1 ; illimité (7.8)
    return true;
  }

  /**
   * Appelée chaque frame : raycast et déplace la surbrillance sur le bloc visé,
   * ou la masque si rien à portée — Exigence 10.2, 10.3, 10.4.
   */
  update() {
    if (!this.highlight) return;
    if (this.pointerLock && !this.pointerLock.isLocked) {
      this.highlight.set(null);
      return;
    }
    const hit = this.raycast();
    if (hit) this.highlight.set(hit.x, hit.y, hit.z);
    else this.highlight.set(null);
  }
}