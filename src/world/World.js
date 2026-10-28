// Source de vérité des données du monde : grille de blocs en 8×8 chunks.
// Tâche 2.4 — _Requirements: 1.2, 1.4, 1.7, 1.8, 13.5, 6.1, 7.1_
import { Chunk, CHUNK_X, CHUNK_Z, CHUNK_Y } from './Chunk.js';
import { BLOCK, isSolide } from './blocks.js';

export const WORLD_X = 128;
export const WORLD_Y = 64;
export const WORLD_Z = 128;
const CHUNKS_X = WORLD_X / CHUNK_X; // 8
const CHUNKS_Z = WORLD_Z / CHUNK_Z; // 8

export class World {
  constructor(sizeX = WORLD_X, sizeY = WORLD_Y, sizeZ = WORLD_Z) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.sizeZ = sizeZ;
    this.chunksX = sizeX / CHUNK_X;
    this.chunksZ = sizeZ / CHUNK_Z;
    /** @type {Chunk[]} indexé [cx + cz*chunksX] */
    this.chunks = [];
    for (let cz = 0; cz < this.chunksZ; cz++) {
      for (let cx = 0; cx < this.chunksX; cx++) {
        this.chunks[cx + cz * this.chunksX] = new Chunk(cx, cz);
      }
    }
  }

  /** Vrai si (x,y,z) est à l'intérieur des limites du monde — Exigence 1.7, 1.8. */
  isInBounds(x, y, z) {
    return (
      x >= 0 && x < this.sizeX &&
      y >= 0 && y < this.sizeY &&
      z >= 0 && z < this.sizeZ
    );
  }

  /** Récupère le chunk couvrant la colonne monde (x,z), ou null hors limites. */
  chunkAt(cx, cz) {
    if (cx < 0 || cx >= this.chunksX || cz < 0 || cz >= this.chunksZ) return null;
    return this.chunks[cx + cz * this.chunksX];
  }

  /**
   * Type de bloc à une coordonnée monde. Hors limites : AIR sur les côtés et
   * au-dessus (le monde se termine), BEDROCK sous y<0 pour empêcher la chute
   * hors du monde par le bas — Exigence 1.7.
   */
  getBlock(x, y, z) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (y < 0) return BLOCK.BEDROCK;
    if (!this.isInBounds(x, y, z)) return BLOCK.AIR;
    const cx = Math.floor(x / CHUNK_X);
    const cz = Math.floor(z / CHUNK_Z);
    const chunk = this.chunkAt(cx, cz);
    if (!chunk) return BLOCK.AIR;
    return chunk.get(x - cx * CHUNK_X, y, z - cz * CHUNK_Z);
  }

  /**
   * Écrit un bloc à une coordonnée monde et marque le(s) chunk(s) dirty.
   * Ignore les écritures hors limites — Exigence 6.1, 7.1.
   */
  setBlock(x, y, z, t) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (!this.isInBounds(x, y, z)) return;
    const cx = Math.floor(x / CHUNK_X);
    const cz = Math.floor(z / CHUNK_Z);
    const chunk = this.chunkAt(cx, cz);
    if (!chunk) return;
    chunk.set(x - cx * CHUNK_X, y, z - cz * CHUNK_Z, t);
    this.markNeighborsDirty(x, y, z);
  }

  /**
   * Marque les chunks dont le meshing ou l'AO peut être affecté. Aux coins,
   * l'AO dépend aussi du chunk diagonal : jusqu'à quatre chunks sont donc dirty.
   */
  markNeighborsDirty(x, y, z) {
    const lx = x % CHUNK_X;
    const lz = z % CHUNK_Z;
    const cx = Math.floor(x / CHUNK_X);
    const cz = Math.floor(z / CHUNK_Z);
    const offsetsX = [0];
    const offsetsZ = [0];
    if (lx === 0) offsetsX.push(-1);
    else if (lx === CHUNK_X - 1) offsetsX.push(1);
    if (lz === 0) offsetsZ.push(-1);
    else if (lz === CHUNK_Z - 1) offsetsZ.push(1);

    for (const dx of offsetsX) {
      for (const dz of offsetsZ) {
        const chunk = this.chunkAt(cx + dx, cz + dz);
        if (chunk) chunk.dirty = true;
      }
    }
  }

  /** Vrai si le bloc à (x,y,z) est solide (primitive de collision) — Exigence 4.1-4.3. */
  isSolidAt(x, y, z) {
    return isSolide(this.getBlock(x, y, z));
  }

  /** Liste des chunks nécessitant une (re)construction de mesh. */
  dirtyChunks() {
    return this.chunks.filter((c) => c.dirty);
  }
}

export { CHUNK_X, CHUNK_Y, CHUNK_Z, CHUNKS_X, CHUNKS_Z };