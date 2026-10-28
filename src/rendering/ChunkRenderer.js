// Meshing face-culling : un mesh opaque et un mesh d'eau par chunk.
// Ombrage, variation et occlusion ambiante sont cuits dans les couleurs de sommet.
import * as THREE from 'three';
import { CHUNK_X, CHUNK_Y, CHUNK_Z } from '../world/Chunk.js';
import { BLOCK, BLOCK_DATA, isOpaque, isSolide } from '../world/blocks.js';
import { createMaterials } from './materials.js';

// Les coins sont antihoraires vus depuis l'extérieur. tangentAxes indique les
// deux axes utilisés pour échantillonner l'AO autour de chaque sommet.
const FACES = [
  { dir: [1, 0, 0], normal: [1, 0, 0], shade: 0.65, tangentAxes: [1, 2], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { dir: [-1, 0, 0], normal: [-1, 0, 0], shade: 0.65, tangentAxes: [1, 2], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [0, 1, 0], normal: [0, 1, 0], shade: 1, tangentAxes: [0, 2], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { dir: [0, -1, 0], normal: [0, -1, 0], shade: 0.5, tangentAxes: [0, 2], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [0, 0, 1], normal: [0, 0, 1], shade: 0.8, tangentAxes: [0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, 0, -1], normal: [0, 0, -1], shade: 0.8, tangentAxes: [0, 1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

// AO classique : 3 = exposé, 0 = coin totalement occlus.
const AO_BRIGHTNESS = [0.55, 0.7, 0.85, 1];
const WATER_TOP_BRIGHTNESS = 1.1;

/** Variation déterministe de luminosité dans [0.95, 1.05]. */
export function blockBrightness(x, y, z) {
  let hash = Math.imul(x ^ 0x68bc21eb, 0x27d4eb2d);
  hash ^= Math.imul(y ^ 0x02e5be93, 0x165667b1);
  hash ^= Math.imul(z ^ 0x967a889b, 0x1b873593);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return 0.95 + ((hash >>> 0) / 0xffffffff) * 0.1;
}

export class ChunkRenderer {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.materials = createMaterials();
    this.halfX = world.sizeX / 2;
    this.halfZ = world.sizeZ / 2;
  }

  buildAllChunks() {
    for (const chunk of this.world.chunks) this._rebuildChunk(chunk);
  }

  rebuildDirtyChunks() {
    let count = 0;
    for (const chunk of this.world.chunks) {
      if (chunk.dirty) {
        this._rebuildChunk(chunk);
        count++;
      }
    }
    return count; // 1 à 4 avec l'AO (voisin diagonal inclus aux coins de chunks)
  }

  _rebuildChunk(chunk) {
    this._disposeChunk(chunk);
    const { opaqueMesh, eauMesh } = this.buildChunkMesh(chunk);
    chunk.mesh = { opaque: opaqueMesh, eau: eauMesh };
    if (opaqueMesh) this.scene.add(opaqueMesh);
    if (eauMesh) this.scene.add(eauMesh);
    chunk.dirty = false;
  }

  _disposeChunk(chunk) {
    if (!chunk.mesh) return;
    for (const key of ['opaque', 'eau']) {
      const mesh = chunk.mesh[key];
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
      }
    }
    chunk.mesh = null;
  }

  buildChunkMesh(chunk) {
    const opaque = { pos: [], norm: [], col: [], idx: [], blockType: [], wave: [] };
    const eau = { pos: [], norm: [], col: [], idx: [], blockType: [], wave: [] };
    const baseX = chunk.cx * CHUNK_X;
    const baseZ = chunk.cz * CHUNK_Z;

    for (let ly = 0; ly < CHUNK_Y; ly++) {
      for (let lz = 0; lz < CHUNK_Z; lz++) {
        for (let lx = 0; lx < CHUNK_X; lx++) {
          const type = chunk.get(lx, ly, lz);
          if (type === BLOCK.AIR) continue;

          const wx = baseX + lx;
          const wy = ly;
          const wz = baseZ + lz;
          const isWater = type === BLOCK.EAU;
          const target = isWater ? eau : opaque;
          const color = BLOCK_DATA[type].couleur;
          const red = ((color >> 16) & 0xff) / 255;
          const green = ((color >> 8) & 0xff) / 255;
          const blue = (color & 0xff) / 255;
          const variation = blockBrightness(wx, wy, wz);

          for (const face of FACES) {
            const neighbor = this.world.getBlock(
              wx + face.dir[0],
              wy + face.dir[1],
              wz + face.dir[2],
            );
            const visible = isWater ? neighbor === BLOCK.AIR : !isOpaque(neighbor);
            if (!visible) continue;

            this._pushFace(
              target,
              face,
              wx,
              wy,
              wz,
              wx - this.halfX,
              wy,
              wz - this.halfZ,
              red,
              green,
              blue,
              variation,
              isWater,
              type,
            );
          }
        }
      }
    }

    return {
      opaqueMesh: this._toMesh(opaque, this.materials.opaque, 0),
      eauMesh: this._toMesh(eau, this.materials.eau, 1),
    };
  }

  /** Niveau d'AO (0..3) pour un sommet d'une face visible. */
  _vertexAO(face, corner, wx, wy, wz) {
    const axisU = face.tangentAxes[0];
    const axisV = face.tangentAxes[1];
    const signU = corner[axisU] === 0 ? -1 : 1;
    const signV = corner[axisV] === 0 ? -1 : 1;

    const outsideX = wx + face.dir[0];
    const outsideY = wy + face.dir[1];
    const outsideZ = wz + face.dir[2];

    let side1X = outsideX;
    let side1Y = outsideY;
    let side1Z = outsideZ;
    let side2X = outsideX;
    let side2Y = outsideY;
    let side2Z = outsideZ;
    let cornerX = outsideX;
    let cornerY = outsideY;
    let cornerZ = outsideZ;

    if (axisU === 0) { side1X += signU; cornerX += signU; }
    else if (axisU === 1) { side1Y += signU; cornerY += signU; }
    else { side1Z += signU; cornerZ += signU; }

    if (axisV === 0) { side2X += signV; cornerX += signV; }
    else if (axisV === 1) { side2Y += signV; cornerY += signV; }
    else { side2Z += signV; cornerZ += signV; }

    const side1 = isSolide(this.world.getBlock(side1X, side1Y, side1Z));
    const side2 = isSolide(this.world.getBlock(side2X, side2Y, side2Z));
    const diagonal = isSolide(this.world.getBlock(cornerX, cornerY, cornerZ));

    if (side1 && side2) return 0;
    return 3 - Number(side1) - Number(side2) - Number(diagonal);
  }

  _pushFace(
    target,
    face,
    wx,
    wy,
    wz,
    ox,
    oy,
    oz,
    red,
    green,
    blue,
    variation,
    isWater,
    type,
  ) {
    const start = target.pos.length / 3;
    const aoLevels = [0, 0, 0, 0];
    const waterFactor = isWater && face.dir[1] === 1 ? WATER_TOP_BRIGHTNESS : 1;
    const animatedWaterEdge = isWater && this.world.getBlock(wx, wy + 1, wz) === BLOCK.AIR;

    for (let index = 0; index < face.corners.length; index++) {
      const corner = face.corners[index];
      const aoLevel = this._vertexAO(face, corner, wx, wy, wz);
      aoLevels[index] = aoLevel;
      const brightness = variation * face.shade * AO_BRIGHTNESS[aoLevel] * waterFactor;

      target.pos.push(ox + corner[0], oy + corner[1], oz + corner[2]);
      target.norm.push(face.normal[0], face.normal[1], face.normal[2]);
      target.col.push(
        Math.min(1, red * brightness),
        Math.min(1, green * brightness),
        Math.min(1, blue * brightness),
      );
      target.blockType.push(type);
      target.wave.push(animatedWaterEdge && corner[1] === 1 ? 1 : 0);
    }

    // Choisit la diagonale qui minimise la strie d'interpolation entre coins AO.
    if (aoLevels[0] + aoLevels[2] > aoLevels[1] + aoLevels[3]) {
      target.idx.push(start, start + 1, start + 3, start + 1, start + 2, start + 3);
    } else {
      target.idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
    }
  }

  _toMesh(data, material, renderOrder) {
    if (data.pos.length === 0) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.norm, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.col, 3));
    geometry.setAttribute('aBlockType', new THREE.Uint8BufferAttribute(data.blockType, 1));
    geometry.setAttribute('aWaveWeight', new THREE.Uint8BufferAttribute(data.wave, 1));
    geometry.setIndex(data.idx);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = renderOrder;
    return mesh;
  }
}
