import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ChunkRenderer } from './ChunkRenderer.js';
import { World } from '../world/World.js';
import { BLOCK } from '../world/blocks.js';

const faceCount = (mesh) => mesh.geometry.getIndex().count / 6;

describe('ChunkRenderer.buildChunkMesh', () => {
  it('produit exactement 6 faces orientées vers l’extérieur pour un bloc isolé', () => {
    const world = new World(16, 64, 16);
    const scene = new THREE.Scene();
    const renderer = new ChunkRenderer(scene, world);
    world.setBlock(8, 8, 8, BLOCK.PIERRE);

    const { opaqueMesh, eauMesh } = renderer.buildChunkMesh(world.chunkAt(0, 0));

    expect(eauMesh).toBeNull();
    expect(opaqueMesh).not.toBeNull();
    expect(opaqueMesh.material.side).toBe(THREE.FrontSide);

    const geometry = opaqueMesh.geometry;
    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const indices = geometry.getIndex();

    expect(positions.count).toBe(24);
    expect(normals.count).toBe(24);
    expect(indices.count).toBe(36);
    expect(faceCount(opaqueMesh)).toBe(6);

    const blockCenter = new THREE.Vector3(0.5, 8.5, 0.5);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const geometricNormal = new THREE.Vector3();
    const centroidDirection = new THREE.Vector3();
    const storedNormal = new THREE.Vector3();

    for (let triangle = 0; triangle < indices.count; triangle += 3) {
      const ia = indices.getX(triangle);
      const ib = indices.getX(triangle + 1);
      const ic = indices.getX(triangle + 2);
      a.fromBufferAttribute(positions, ia);
      b.fromBufferAttribute(positions, ib);
      c.fromBufferAttribute(positions, ic);

      geometricNormal
        .crossVectors(ab.subVectors(b, a), ac.subVectors(c, a))
        .normalize();
      storedNormal.fromBufferAttribute(normals, ia).normalize();
      centroidDirection
        .copy(a)
        .add(b)
        .add(c)
        .multiplyScalar(1 / 3)
        .sub(blockCenter);

      expect(geometricNormal.dot(storedNormal)).toBeCloseTo(1, 6);
      expect(geometricNormal.dot(centroidDirection)).toBeGreaterThan(0);
    }
  });

  it('lit le voisin du chunk adjacent au lieu d’émettre une face interne', () => {
    const world = new World(32, 64, 16);
    const renderer = new ChunkRenderer(new THREE.Scene(), world);
    world.setBlock(15, 8, 8, BLOCK.PIERRE);
    world.setBlock(16, 8, 8, BLOCK.PIERRE);

    const left = renderer.buildChunkMesh(world.chunkAt(0, 0)).opaqueMesh;
    const right = renderer.buildChunkMesh(world.chunkAt(1, 0)).opaqueMesh;

    expect(faceCount(left)).toBe(5);
    expect(faceCount(right)).toBe(5);
  });

  it('dessine les faces latérales exposées d’un bloc en bord de monde', () => {
    const world = new World(16, 64, 16);
    const renderer = new ChunkRenderer(new THREE.Scene(), world);
    world.setBlock(0, 8, 0, BLOCK.PIERRE);

    const { opaqueMesh } = renderer.buildChunkMesh(world.chunkAt(0, 0));

    expect(faceCount(opaqueMesh)).toBe(6);
  });
});
