// Tests unitaires du raycast voxel (DDA).
// Tâche 6.2 — _Requirements: 6.2, 6.3, 10.2, 10.3_
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { World } from '../world/World.js';
import { BLOCK } from '../world/blocks.js';
import { Interaction } from './Interaction.js';

function makeInteraction(world, origin, dir) {
  const player = {
    camera: {
      position: origin.clone(),
      getWorldDirection(v) { v.copy(dir); return v; },
    },
  };
  return new Interaction(world, player);
}

describe('Interaction.raycast', () => {
  it('cible le premier bloc solide dans la ligne de visée (6.2)', () => {
    const world = new World();
    world.setBlock(3, 10, 10, BLOCK.PIERRE);
    world.setBlock(4, 10, 10, BLOCK.PIERRE);
    const it = makeInteraction(world, new THREE.Vector3(0.5, 10.5, 10.5), new THREE.Vector3(1, 0, 0));
    const hit = it.raycast();
    expect(hit).not.toBeNull();
    expect([hit.x, hit.y, hit.z]).toEqual([3, 10, 10]); // le plus proche
  });

  it("ignore l'eau et cible le solide derrière (6.2, 6.6)", () => {
    const world = new World();
    world.setBlock(2, 10, 10, BLOCK.EAU);
    world.setBlock(5, 10, 10, BLOCK.PIERRE);
    const it = makeInteraction(world, new THREE.Vector3(0.5, 10.5, 10.5), new THREE.Vector3(1, 0, 0));
    const hit = it.raycast();
    expect([hit.x, hit.y, hit.z]).toEqual([5, 10, 10]);
  });

  it('renvoie la normale de face correcte', () => {
    const world = new World();
    world.setBlock(3, 10, 10, BLOCK.PIERRE);
    const it = makeInteraction(world, new THREE.Vector3(0.5, 10.5, 10.5), new THREE.Vector3(1, 0, 0));
    const hit = it.raycast();
    expect(hit.faceNormal).toEqual({ x: -1, y: 0, z: 0 }); // face -X exposée
  });

  it('renvoie null si rien de solide à portée (6.3, 10.3)', () => {
    const world = new World();
    world.setBlock(50, 10, 10, BLOCK.PIERRE); // au-delà de REACH=5
    const it = makeInteraction(world, new THREE.Vector3(0.5, 10.5, 10.5), new THREE.Vector3(1, 0, 0));
    expect(it.raycast()).toBeNull();
  });
});