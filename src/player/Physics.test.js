// Tests unitaires de la physique du joueur (collisions AABB, eau).
// Tâche 4.5 — _Requirements: 4.1, 4.2, 4.3, 4.6, 4.5, 1.7, 1.8_
import { describe, it, expect } from 'vitest';
import { World } from '../world/World.js';
import { BLOCK } from '../world/blocks.js';
import { Player } from './Player.js';

function mockCamera() {
  return { position: { set() {} }, rotation: { order: 'YXZ', set() {} } };
}

function flatWorld() {
  const world = new World();
  for (let x = 0; x < world.sizeX; x++) {
    for (let z = 0; z < world.sizeZ; z++) {
      world.setBlock(x, 0, z, BLOCK.BEDROCK);
      world.setBlock(x, 1, z, BLOCK.PIERRE);
    }
  }
  return world;
}

describe('Physics — collisions AABB', () => {
  it('soutient le joueur sur une surface solide (4.2)', () => {
    const world = flatWorld();
    const p = new Player(mockCamera(), world, { x: 10, y: 8, z: 10 });
    for (let i = 0; i < 180; i++) p.update(1 / 60, { keys: new Set() });
    expect(p.onGround).toBe(true);
    expect(p.position.y).toBeCloseTo(2, 2); // dessus de la pierre (y=1)
  });

  it("stoppe l'ascension contre un plafond (4.3)", () => {
    const world = flatWorld();
    // plafond solide en y=8 (le joueur part du sol en y=2, tête en 3.8 ;
    // le saut le fait monter vers le plafond)
    for (let x = 8; x <= 12; x++) for (let z = 8; z <= 12; z++) world.setBlock(x, 8, z, BLOCK.PIERRE);
    const p = new Player(mockCamera(), world, { x: 10, y: 2, z: 10 });
    p.onGround = true;
    let maxHead = 0;
    for (let i = 0; i < 120; i++) {
      p.update(1 / 60, { keys: new Set(i < 2 ? ['Space'] : []) });
      maxHead = Math.max(maxHead, p.position.y + 1.8);
    }
    // la tête ne dépasse jamais le bas du bloc en y=8 (plafond)
    expect(maxHead).toBeLessThanOrEqual(8 + 1e-2);
  });

  it('ne traverse pas un mur plein (4.1, 4.6)', () => {
    const world = flatWorld();
    for (let y = 2; y <= 3; y++) for (let z = 8; z <= 12; z++) world.setBlock(12, y, z, BLOCK.PIERRE);
    const p = new Player(mockCamera(), world, { x: 11, y: 2, z: 10 });
    p.yaw = -Math.PI / 2; // vers +X
    for (let i = 0; i < 120; i++) p.update(1 / 60, { keys: new Set(['KeyW']) });
    // reste du côté -X du bloc en x=12 (demi-largeur 0.3)
    expect(p.position.x).toBeLessThanOrEqual(11.7 + 1e-2);
  });

  it("confine le joueur dans les limites horizontales du monde (1.8)", () => {
    const world = flatWorld();
    const p = new Player(mockCamera(), world, { x: 1, y: 2, z: 10 });
    p.yaw = Math.PI / 2; // vers -X
    for (let i = 0; i < 300; i++) p.update(1 / 60, { keys: new Set(['KeyW']) });
    expect(p.position.x).toBeGreaterThanOrEqual(0.3 - 1e-2);
    expect(p.position.x).toBeLessThanOrEqual(world.sizeX);
  });

  it("ne tombe jamais hors du monde par le bas (1.7)", () => {
    const world = new World(); // vide : rien que la bedrock sous y<0
    const p = new Player(mockCamera(), world, { x: 10, y: 30, z: 10 });
    for (let i = 0; i < 600; i++) p.update(1 / 60, { keys: new Set() });
    expect(p.position.y).toBeGreaterThanOrEqual(0);
  });

  it("ralentit la chute dans l'eau (4.5)", () => {
    const world = new World();
    for (let y = 1; y <= 20; y++) for (let x = 8; x <= 12; x++) for (let z = 8; z <= 12; z++) world.setBlock(x, y, z, BLOCK.EAU);
    const p = new Player(mockCamera(), world, { x: 10, y: 15, z: 10 });
    p.update(1 / 60, { keys: new Set() });
    expect(p.inWater).toBe(true);
    // vitesse de chute dans l'eau bien plus faible que la gravité libre sur 1 frame
    expect(Math.abs(p.velocity.y)).toBeLessThan(24 * (1 / 60));
  });

  it('remonte en maintenant Espace dans l\'eau, jamais bloqué au fond (4.7, 4.8)', () => {
    const world = new World();
    for (let y = 1; y <= 20; y++) for (let x = 8; x <= 12; x++) for (let z = 8; z <= 12; z++) world.setBlock(x, y, z, BLOCK.EAU);
    const p = new Player(mockCamera(), world, { x: 10, y: 3, z: 10 });
    const yBefore = p.position.y;
    for (let i = 0; i < 60; i++) p.update(1 / 60, { keys: new Set(['Space']) });
    expect(p.position.y).toBeGreaterThan(yBefore);
    expect(p.velocity.y).toBeGreaterThan(0);
  });
});