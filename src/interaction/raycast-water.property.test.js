// Test de propriété — raycast ignore l'eau (Property 6).
// Tâche 6.3 — Validates: Requirements 6.2, 6.6, 10.2
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as THREE from 'three';
import { World } from '../world/World.js';
import { BLOCK, isSolide } from '../world/blocks.js';
import { Interaction, REACH } from './Interaction.js';

const DIRS = [
  new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(1, 1, 0).normalize(), new THREE.Vector3(1, 0, 1).normalize(),
];

describe('Propriété — raycast ignore l\'eau (Property 6)', () => {
  it('renvoie toujours un bloc solide (jamais AIR ni EAU) ou null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 100 }), // ox
        fc.integer({ min: 20, max: 50 }),  // oy
        fc.integer({ min: 20, max: 100 }), // oz
        fc.integer({ min: 0, max: DIRS.length - 1 }), // direction
        fc.array(
          fc.record({
            dx: fc.integer({ min: -5, max: 5 }),
            dy: fc.integer({ min: -5, max: 5 }),
            dz: fc.integer({ min: -5, max: 5 }),
            kind: fc.constantFrom(BLOCK.PIERRE, BLOCK.EAU, BLOCK.SABLE, BLOCK.EAU),
          }),
          { minLength: 0, maxLength: 12 },
        ),
        (ox, oy, oz, dirIdx, blocks) => {
          const world = new World();
          for (const b of blocks) {
            world.setBlock(ox + b.dx, oy + b.dy, oz + b.dz, b.kind);
          }
          const dir = DIRS[dirIdx];
          const player = {
            camera: {
              position: new THREE.Vector3(ox + 0.5, oy + 0.5, oz + 0.5),
              getWorldDirection(v) { v.copy(dir); return v; },
            },
          };
          const it = new Interaction(world, player);
          const hit = it.raycast();
          if (hit === null) return true;
          const t = world.getBlock(hit.x, hit.y, hit.z);
          // doit être solide (donc jamais AIR ni EAU)
          return isSolide(t) && t !== BLOCK.EAU && t !== BLOCK.AIR;
        },
      ),
      { numRuns: 200 },
    );
    expect(true).toBe(true);
  });
});