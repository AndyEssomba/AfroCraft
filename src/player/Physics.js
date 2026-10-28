// Résolution de collision AABB du joueur contre la grille de blocs.
// Déplacement axe par axe pour éviter blocages et traversées.
// Tâche 4.3 — _Requirements: 4.1, 4.2, 4.3, 4.6, 1.7, 1.8_
import { PLAYER_WIDTH, PLAYER_HEIGHT } from './constants.js';

const HW = PLAYER_WIDTH / 2;
const EPS = 1e-4;

/** AABB du joueur à partir d'une position de pieds (x,y,z centrée en x/z). */
function aabbAt(x, y, z) {
  return {
    minX: x - HW, maxX: x + HW,
    minY: y, maxY: y + PLAYER_HEIGHT,
    minZ: z - HW, maxZ: z + HW,
  };
}

/** Blocs solides chevauchant une AABB (teste les cellules recouvertes). */
function* overlappingSolids(world, box) {
  const x0 = Math.floor(box.minX), x1 = Math.floor(box.maxX - EPS);
  const y0 = Math.floor(box.minY), y1 = Math.floor(box.maxY - EPS);
  const z0 = Math.floor(box.minZ), z1 = Math.floor(box.maxZ - EPS);
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        if (world.isSolidAt(x, y, z)) yield { x, y, z };
      }
    }
  }
}

/**
 * Déplace le joueur de sa vélocité × dt en résolvant les collisions axe par
 * axe. Met à jour player.position, player.velocity et player.onGround.
 * Confine le joueur aux limites horizontales du monde (1.8) ; le fond est
 * garanti solide par World.getBlock (y<0 → BEDROCK) (1.7).
 * @param {import('./Player.js').Player} player
 * @param {import('../world/World.js').World} world
 * @param {number} dt
 */
export function moveAndCollide(player, world, dt) {
  const v = player.velocity;
  player.onGround = false;

  // --- Axe Y ---
  player.position.y += v.y * dt;
  let box = aabbAt(player.position.x, player.position.y, player.position.z);
  for (const b of overlappingSolids(world, box)) {
    if (v.y <= 0) {
      // chute : poser sur le dessus du bloc (soutien, 4.2)
      player.position.y = b.y + 1;
      player.onGround = true;
    } else {
      // montée : stopper sous le bloc (plafond, 4.3)
      player.position.y = b.y - PLAYER_HEIGHT - EPS;
    }
    v.y = 0;
    box = aabbAt(player.position.x, player.position.y, player.position.z);
  }

  // --- Axe X ---
  player.position.x += v.x * dt;
  box = aabbAt(player.position.x, player.position.y, player.position.z);
  for (const b of overlappingSolids(world, box)) {
    if (v.x > 0) player.position.x = b.x - HW - EPS;
    else if (v.x < 0) player.position.x = b.x + 1 + HW + EPS;
    v.x = 0;
    box = aabbAt(player.position.x, player.position.y, player.position.z);
  }

  // --- Axe Z ---
  player.position.z += v.z * dt;
  box = aabbAt(player.position.x, player.position.y, player.position.z);
  for (const b of overlappingSolids(world, box)) {
    if (v.z > 0) player.position.z = b.z - HW - EPS;
    else if (v.z < 0) player.position.z = b.z + 1 + HW + EPS;
    v.z = 0;
    box = aabbAt(player.position.x, player.position.y, player.position.z);
  }

  // Confinement aux limites horizontales du monde (1.8).
  player.position.x = Math.max(HW, Math.min(world.sizeX - HW, player.position.x));
  player.position.z = Math.max(HW, Math.min(world.sizeZ - HW, player.position.z));
  if (player.position.y < 0) { player.position.y = 0; player.onGround = true; v.y = 0; }
}