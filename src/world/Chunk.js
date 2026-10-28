// Conteneur de données d'un chunk 16×16×64 + état "dirty".
// Tâche 2.3 — _Requirements: 1.2, 13.5_
import { BLOCK } from './blocks.js';

export const CHUNK_X = 16;
export const CHUNK_Z = 16;
export const CHUNK_Y = 64;
export const CHUNK_VOLUME = CHUNK_X * CHUNK_Z * CHUNK_Y; // 16 384

export class Chunk {
  /**
   * @param {number} cx coordonnée de chunk sur X (0..7)
   * @param {number} cz coordonnée de chunk sur Z (0..7)
   */
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_VOLUME); // initialisé à AIR (0)
    this.dirty = true; // nécessite une (re)construction de mesh
    this.mesh = null; // référence au/aux THREE.Mesh courant(s)
  }

  /** Index linéaire d'une position locale : [lx + lz*16 + ly*256]. */
  index(lx, ly, lz) {
    return lx + lz * CHUNK_X + ly * CHUNK_X * CHUNK_Z;
  }

  /** Lit le type de bloc à une position locale. */
  get(lx, ly, lz) {
    return this.blocks[this.index(lx, ly, lz)];
  }

  /** Écrit un type de bloc à une position locale et marque le chunk dirty. */
  set(lx, ly, lz, t) {
    this.blocks[this.index(lx, ly, lz)] = t;
    this.dirty = true;
  }

  /** Remet tous les blocs à AIR. */
  clear() {
    this.blocks.fill(BLOCK.AIR);
    this.dirty = true;
  }
}