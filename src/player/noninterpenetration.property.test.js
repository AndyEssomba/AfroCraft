// Test de propriété — non-interpénétration (Property 4).
// Tâche 4.6 — Validates: Requirements 4.1, 4.6
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { World } from '../world/World.js';
import { BLOCK } from '../world/blocks.js';
import { Player, PLAYER_WIDTH, PLAYER_HEIGHT } from './Player.js';

function mockCamera() {
  return { position: { set() {} }, rotation: { order: 'YXZ', set() {} } };
}

// Vrai si l'AABB du joueur recouvre un bloc solide.
function overlapsSolid(world, p) {
  const hw = PLAYER_WIDTH / 2;
  const EPS = 1e-4;
  const x0 = Math.floor(p.position.x - hw + EPS), x1 = Math.floor(p.position.x + hw - EPS);
  const y0 = Math.floor(p.position.y + EPS), y1 = Math.floor(p.position.y + PLAYER_HEIGHT - EPS);
  const z0 = Math.floor(p.position.z - hw + EPS), z1 = Math.floor(p.position.z + hw - EPS);
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        if (world.isSolidAt(x, y, z)) return true;
  return false;
}

describe('Propriété — non-interpénétration (Property 4)', () => {
  it('après résolution, l\'AABB du joueur ne recouvre aucun bloc solide', () => {
    fc.assert(
      fc.property(
        // séquence d'entrées bornées sur plusieurs frames
        fc.array(
          fc.record({
            w: fc.boolean(), s: fc.boolean(), a: fc.boolean(), d: fc.boolean(), jump: fc.boolean(),
            yaw: fc.integer({ min: 0, max: 7 }),
          }),
          { minLength: 1, maxLength: 40 },
        ),
        (frames) => {
          // Monde : sol solide + quelques blocs épars autour de la zone de jeu.
          const world = new World();
          for (let x = 8; x <= 16; x++)
            for (let z = 8; z <= 16; z++) {
              world.setBlock(x, 0, z, BLOCK.BEDROCK);
              world.setBlock(x, 1, z, BLOCK.PIERRE);
            }
          world.setBlock(12, 2, 12, BLOCK.PIERRE);
          world.setBlock(13, 2, 12, BLOCK.PIERRE);
          world.setBlock(12, 3, 12, BLOCK.PIERRE);

          const p = new Player(mockCamera(), world, { x: 10, y: 2, z: 10 });
          for (const f of frames) {
            p.yaw = (f.yaw * Math.PI) / 4;
            const keys = new Set();
            if (f.w) keys.add('KeyW');
            if (f.s) keys.add('KeyS');
            if (f.a) keys.add('KeyA');
            if (f.d) keys.add('KeyD');
            if (f.jump) keys.add('Space');
            p.update(1 / 60, { keys });
            if (overlapsSolid(world, p)) return false;
          }
          return true;
        },
      ),
      { numRuns: 150 },
    );
    expect(true).toBe(true);
  });
});