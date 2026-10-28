// Génération procédurale : relief seedé, biomes, eau, socle et structures
// naturelles inspirées des paysages africains définis dans product.md.
import { makeNoise2D, fbm } from './noise.js';
import { BiomeMap, BIOMES } from './biomes.js';
import { BLOCK } from '../world/blocks.js';

export const SEA_LEVEL = 20;

const TERRAIN_FREQUENCY = 0.025;
const TERRAIN_AMPLITUDE = 14;
const BASE_HEIGHT = SEA_LEVEL;
const CARDINALS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STAR_DIRECTIONS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

const STRUCTURE_KEYS = [
  'oasis',
  'inselberg',
  'fromager',
  'baobab',
  'termitiere',
  'acacia',
  'palmier',
  'village',
];

export class WorldGenerator {
  constructor(seed = 1337) {
    this.seed = seed | 0;
    this.terrainNoise = makeNoise2D(this.seed);
    this.biomeMap = new BiomeMap(this.seed);
    this.structureNoises = Object.create(null);
    const salts = [0x16719, 0x27d4e, 0x39a13, 0x4f1bb, 0x52ae7, 0x61c93, 0x7b5d1, 0x8e4c7];
    STRUCTURE_KEYS.forEach((key, index) => {
      this.structureNoises[key] = makeNoise2D((this.seed ^ salts[index]) | 0);
    });
    this.structureCounts = Object.create(null);
    this.placements = [];
    this._reserved = null;
  }

  heightAt(x, z) {
    const value = fbm(this.terrainNoise, x, z, {
      octaves: 4,
      frequency: TERRAIN_FREQUENCY,
      persistence: 0.5,
    });
    return Math.max(1, Math.min(60, Math.round(BASE_HEIGHT + value * TERRAIN_AMPLITUDE)));
  }

  biomeAt(x, z) {
    return this.biomeMap.biomeAt(x, z);
  }

  surfaceColumn(world, x, z, biome, height) {
    world.setBlock(x, 0, z, BLOCK.BEDROCK);
    for (let y = 1; y < height - 2 && y < world.sizeY; y++) {
      world.setBlock(x, y, z, BLOCK.PIERRE);
    }
    const subsoil = biome === BIOMES.DESERT ? BLOCK.SABLE : BLOCK.TERRE_ROUGE;
    for (let y = Math.max(1, height - 2); y < height && y < world.sizeY; y++) {
      world.setBlock(x, y, z, subsoil);
    }
    const surface = biome === BIOMES.DESERT
      ? BLOCK.SABLE
      : biome === BIOMES.FORET
        ? BLOCK.HERBE_FORET
        : BLOCK.HERBE_SAVANE;
    if (height >= 1 && height < world.sizeY) world.setBlock(x, height, z, surface);
  }

  fillWater(world) {
    for (let x = 0; x < world.sizeX; x++) {
      for (let z = 0; z < world.sizeZ; z++) {
        for (let y = 1; y <= SEA_LEVEL && y < world.sizeY; y++) {
          if (world.getBlock(x, y, z) === BLOCK.AIR) world.setBlock(x, y, z, BLOCK.EAU);
        }
      }
    }
  }

  spawnPoint(world) {
    const centerX = Math.floor(world.sizeX / 2);
    const centerZ = Math.floor(world.sizeZ / 2);
    for (let radius = 0; radius < Math.max(world.sizeX, world.sizeZ); radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const x = centerX + dx;
          const z = centerZ + dz;
          if (x < 1 || x >= world.sizeX - 1 || z < 1 || z >= world.sizeZ - 1) continue;
          for (let y = world.sizeY - 2; y >= 1; y--) {
            const type = world.getBlock(x, y, z);
            if (type === BLOCK.EAU) break;
            if (world.isSolidAt(x, y, z)) {
              if (
                world.getBlock(x, y + 1, z) === BLOCK.AIR &&
                world.getBlock(x, y + 2, z) === BLOCK.AIR
              ) return { x: x + 0.5, y: y + 1, z: z + 0.5 };
              break;
            }
          }
        }
      }
    }
    return { x: centerX + 0.5, y: world.sizeY - 1, z: centerZ + 0.5 };
  }

  /** Valeur seedée propre à un type de structure et un canal. */
  _value(key, x, z, channel = 0) {
    const noise = this.structureNoises[key];
    return (noise(x * 0.371 + channel * 17.13, z * 0.371 - channel * 11.71) + 1) / 2;
  }

  _index(x, z, world) {
    return x + z * world.sizeX;
  }

  _canReserve(world, x, z, radius) {
    if (
      x - radius < 2 || x + radius >= world.sizeX - 2 ||
      z - radius < 2 || z + radius >= world.sizeZ - 2
    ) return false;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > radius * radius) continue;
        if (this._reserved[this._index(x + dx, z + dz, world)]) return false;
      }
    }
    return true;
  }

  _reserve(world, x, z, radius) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz <= radius * radius) {
          this._reserved[this._index(x + dx, z + dz, world)] = 1;
        }
      }
    }
  }

  _canReserveRect(world, x, z, minDx, maxDx, minDz, maxDz) {
    if (
      x + minDx < 2 || x + maxDx >= world.sizeX - 2 ||
      z + minDz < 2 || z + maxDz >= world.sizeZ - 2
    ) return false;
    for (let dz = minDz; dz <= maxDz; dz++) {
      for (let dx = minDx; dx <= maxDx; dx++) {
        if (this._reserved[this._index(x + dx, z + dz, world)]) return false;
      }
    }
    return true;
  }

  _reserveRect(world, x, z, minDx, maxDx, minDz, maxDz) {
    for (let dz = minDz; dz <= maxDz; dz++) {
      for (let dx = minDx; dx <= maxDx; dx++) {
        this._reserved[this._index(x + dx, z + dz, world)] = 1;
      }
    }
  }

  _isDryFootprint(world, x, z, radius, maxSlope) {
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > radius * radius) continue;
        const px = x + dx;
        const pz = z + dz;
        const height = this.heightAt(px, pz);
        minHeight = Math.min(minHeight, height);
        maxHeight = Math.max(maxHeight, height);
        if (
          height <= SEA_LEVEL ||
          world.getBlock(px, height + 1, pz) === BLOCK.EAU
        ) return false;
      }
    }
    return maxHeight - minHeight <= maxSlope;
  }

  _biomeCoverage(x, z, radius, allowed) {
    let valid = 0;
    let total = 0;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz > radius * radius) continue;
        total++;
        if (allowed.includes(this.biomeAt(x + dx, z + dz))) valid++;
      }
    }
    return total === 0 ? 0 : valid / total;
  }

  _scatter(world, config, builder) {
    let placed = 0;
    const margin = config.reserveRadius + 3;
    for (let cellZ = margin; cellZ < world.sizeZ - margin && placed < config.limit; cellZ += config.spacing) {
      for (let cellX = margin; cellX < world.sizeX - margin && placed < config.limit; cellX += config.spacing) {
        const density = this._value(config.key, cellX, cellZ, 0);
        if (density < config.threshold) continue;
        const availableX = Math.min(config.spacing, world.sizeX - margin - cellX);
        const availableZ = Math.min(config.spacing, world.sizeZ - margin - cellZ);
        if (availableX <= 0 || availableZ <= 0) continue;
        const x = cellX + Math.floor(this._value(config.key, cellX, cellZ, 1) * availableX);
        const z = cellZ + Math.floor(this._value(config.key, cellX, cellZ, 2) * availableZ);
        const biome = this.biomeAt(x, z);
        if (!config.biomes.includes(biome)) continue;
        const surfaceY = this.heightAt(x, z);
        if (surfaceY + config.maxRise >= world.sizeY - 1) continue;
        if (!this._canReserve(world, x, z, config.reserveRadius)) continue;
        if (!this._isDryFootprint(world, x, z, config.supportRadius, config.maxSlope)) continue;
        if (this._biomeCoverage(x, z, config.supportRadius, config.biomes) < config.minBiomeCoverage) continue;

        this._reserve(world, x, z, config.reserveRadius);
        builder.call(this, world, x, surfaceY, z);
        this.structureCounts[config.key]++;
        this.placements.push({
          type: config.key,
          x,
          z,
          radius: config.reserveRadius,
        });
        placed++;
      }
    }
  }

  _setAirOnly(world, x, y, z, type) {
    if (world.isInBounds(x, y, z) && world.getBlock(x, y, z) === BLOCK.AIR) {
      world.setBlock(x, y, z, type);
    }
  }

  _fillSquare(world, x, y, z, size, type) {
    const start = -Math.floor(size / 2);
    const end = start + size - 1;
    for (let dx = start; dx <= end; dx++) {
      for (let dz = start; dz <= end; dz++) {
        this._setAirOnly(world, x + dx, y, z + dz, type);
      }
    }
  }

  _leafBlob(world, x, y, z, radiusX, radiusY, radiusZ) {
    for (let dy = -radiusY; dy <= radiusY; dy++) {
      for (let dx = -radiusX; dx <= radiusX; dx++) {
        for (let dz = -radiusZ; dz <= radiusZ; dz++) {
          const distance =
            (dx * dx) / (radiusX * radiusX) +
            (dy * dy) / (radiusY * radiusY) +
            (dz * dz) / (radiusZ * radiusZ);
          if (distance <= 1.08) this._setAirOnly(world, x + dx, y + dy, z + dz, BLOCK.FEUILLES);
        }
      }
    }
  }

  _buildBaobab(world, x, surfaceY, z) {
    const height = 6 + Math.floor(this._value('baobab', x, z, 3) * 5);
    const trunkSize = this._value('baobab', x, z, 4) > 0.55 ? 3 : 2;
    for (let level = 1; level <= height; level++) {
      const size = level <= 2 ? trunkSize + 1 : trunkSize;
      this._fillSquare(world, x, surfaceY + level, z, size, BLOCK.BOIS_BAOBAB);
    }

    const topY = surfaceY + height;
    const branchCount = 5 + Math.floor(this._value('baobab', x, z, 5) * 4);
    for (let branch = 0; branch < branchCount; branch++) {
      const direction = STAR_DIRECTIONS[(branch + Math.floor(this._value('baobab', x, z, 6) * 8)) % 8];
      const length = 2 + Math.floor(this._value('baobab', x + branch, z, 7) * 3);
      let endX = x;
      let endZ = z;
      let endY = topY;
      for (let step = 1; step <= length; step++) {
        endX = x + direction[0] * step;
        endZ = z + direction[1] * step;
        endY = topY + Math.floor(step / 3);
        this._setAirOnly(world, endX, endY, endZ, BLOCK.BOIS_BAOBAB);
        if (step <= 2) this._setAirOnly(world, endX, endY - 1, endZ, BLOCK.BOIS_BAOBAB);
      }
      this._leafBlob(world, endX, endY, endZ, 2, 1, 2);
    }
  }

  _buildAcacia(world, x, surfaceY, z) {
    const height = 5 + Math.floor(this._value('acacia', x, z, 3) * 3);
    const diameter = 5 + Math.floor(this._value('acacia', x, z, 4) * 3);
    const direction = CARDINALS[Math.floor(this._value('acacia', x, z, 5) * 4) % 4];
    let trunkX = x;
    let trunkZ = z;
    for (let level = 1; level <= height; level++) {
      if (level > 2 && level % 3 === 0) {
        trunkX += direction[0];
        trunkZ += direction[1];
      }
      this._setAirOnly(world, trunkX, surfaceY + level, trunkZ, BLOCK.BOIS_BAOBAB);
    }

    const radius = Math.floor(diameter / 2);
    const crownY = surfaceY + height;
    const thickness = this._value('acacia', x, z, 6) > 0.55 ? 2 : 1;
    for (let layer = 0; layer < thickness; layer++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const irregularity = this._value('acacia', trunkX + dx, trunkZ + dz, 7) * 0.8;
          if (dx * dx + dz * dz <= (radius + irregularity) ** 2) {
            this._setAirOnly(world, trunkX + dx, crownY + layer, trunkZ + dz, BLOCK.FEUILLES);
          }
        }
      }
    }
  }

  _buildPalm(world, x, surfaceY, z, key = 'palmier', forcedDirection = null, forcedHeight = null) {
    const height = forcedHeight ?? (5 + Math.floor(this._value(key, x, z, 3) * 4));
    const direction = forcedDirection ?? CARDINALS[Math.floor(this._value(key, x, z, 4) * 4) % 4];
    let trunkX = x;
    let trunkZ = z;
    for (let level = 1; level <= height; level++) {
      if (level > 2 && level % 3 === 0) {
        trunkX += direction[0];
        trunkZ += direction[1];
      }
      this._setAirOnly(world, trunkX, surfaceY + level, trunkZ, BLOCK.BOIS_BAOBAB);
    }

    const topY = surfaceY + height;
    this._setAirOnly(world, trunkX, topY + 1, trunkZ, BLOCK.FEUILLES);
    for (const [dx, dz] of CARDINALS) {
      for (let step = 1; step <= 3; step++) {
        const drop = step === 3 ? 1 : 0;
        this._setAirOnly(
          world,
          trunkX + dx * step,
          topY - drop,
          trunkZ + dz * step,
          BLOCK.FEUILLES,
        );
      }
    }
  }

  _buildFromager(world, x, surfaceY, z) {
    const height = 15 + Math.floor(this._value('fromager', x, z, 3) * 6);
    for (let level = 1; level <= height; level++) {
      this._fillSquare(world, x, surfaceY + level, z, level < 6 ? 3 : 2, BLOCK.BOIS_SOMBRE);
    }

    // Contreforts en ailettes, ancrés à la surface et décroissant vers l'extérieur.
    for (const [dx, dz] of STAR_DIRECTIONS) {
      for (let distance = 1; distance <= 4; distance++) {
        const wingHeight = 6 - distance;
        for (let rise = 1; rise <= wingHeight; rise++) {
          this._setAirOnly(
            world,
            x + dx * distance,
            surfaceY + rise,
            z + dz * distance,
            BLOCK.BOIS_SOMBRE,
          );
        }
      }
    }

    const topY = surfaceY + height;
    for (const [dx, dz] of STAR_DIRECTIONS) {
      for (let step = 1; step <= 4; step++) {
        this._setAirOnly(world, x + dx * step, topY, z + dz * step, BLOCK.BOIS_SOMBRE);
      }
      this._leafBlob(world, x + dx * 4, topY + 1, z + dz * 4, 3, 2, 3);
    }
    this._leafBlob(world, x, topY + 2, z, 4, 2, 4);
  }

  _buildTermiteMound(world, x, surfaceY, z) {
    const height = 4 + Math.floor(this._value('termitiere', x, z, 3) * 5);
    const baseRadius = height >= 7 ? 3 : 2;
    for (let level = 0; level < height; level++) {
      const normalized = level / height;
      const radius = Math.max(0.75, baseRadius * Math.pow(1 - normalized, 0.65));
      for (let dz = -baseRadius; dz <= baseRadius; dz++) {
        for (let dx = -baseRadius; dx <= baseRadius; dx++) {
          const irregularity = (this._value('termitiere', x + dx, z + dz, level + 6) - 0.5) * 0.7;
          if (Math.sqrt(dx * dx + dz * dz) <= radius + irregularity) {
            const type = this._value('termitiere', x + dx, z + dz, 20 + level) > 0.7
              ? BLOCK.TERRE_ROUGE
              : BLOCK.ARGILE;
            this._setAirOnly(world, x + dx, surfaceY + 1 + level, z + dz, type);
          }
        }
      }
    }

    // Chambre et galerie d'entrée creuses au-dessus du terrain.
    for (let level = 1; level < height - 1; level++) {
      world.setBlock(x, surfaceY + 1 + level, z, BLOCK.AIR);
    }
    const entrance = CARDINALS[Math.floor(this._value('termitiere', x, z, 31) * 4) % 4];
    for (let step = 0; step <= baseRadius; step++) {
      world.setBlock(x + entrance[0] * step, surfaceY + 1, z + entrance[1] * step, BLOCK.AIR);
      if (height > 5) {
        world.setBlock(x + entrance[0] * step, surfaceY + 2, z + entrance[1] * step, BLOCK.AIR);
      }
    }
  }

  _buildInselberg(world, x, surfaceY, z) {
    const height = 8 + Math.floor(this._value('inselberg', x, z, 3) * 8);
    const radius = Math.max(4, Math.min(7, Math.round(height * 0.45)));
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distanceSquared = (dx * dx + dz * dz) / (radius * radius);
        if (distanceSquared > 1) continue;
        const irregularity = Math.floor(this._value('inselberg', x + dx, z + dz, 8) * 3) - 1;
        const columnHeight = Math.max(
          1,
          Math.floor(height * Math.pow(1 - distanceSquared, 0.58)) + irregularity,
        );
        const localSurface = this.heightAt(x + dx, z + dz);
        const top = surfaceY + columnHeight;
        for (let y = localSurface + 1; y <= top; y++) {
          this._setAirOnly(world, x + dx, y, z + dz, BLOCK.PIERRE);
        }
      }
    }
  }

  _buildOasis(world, x, surfaceY, z) {
    const waterRadius = 3 + Math.floor(this._value('oasis', x, z, 3) * 2);
    let bankY = Infinity;
    for (let dz = -waterRadius - 2; dz <= waterRadius + 2; dz++) {
      for (let dx = -waterRadius - 2; dx <= waterRadius + 2; dx++) {
        if (dx * dx + dz * dz <= (waterRadius + 2) ** 2) {
          bankY = Math.min(bankY, this.heightAt(x + dx, z + dz));
        }
      }
    }
    const waterY = bankY - 1;

    for (let dz = -waterRadius - 2; dz <= waterRadius + 2; dz++) {
      for (let dx = -waterRadius - 2; dx <= waterRadius + 2; dx++) {
        const distance = Math.sqrt(dx * dx + dz * dz);
        const px = x + dx;
        const pz = z + dz;
        const oldHeight = this.heightAt(px, pz);
        if (distance <= waterRadius) {
          for (let y = waterY; y <= oldHeight + 1; y++) world.setBlock(px, y, pz, BLOCK.AIR);
          world.setBlock(px, waterY - 1, pz, BLOCK.ARGILE);
          world.setBlock(px, waterY, pz, BLOCK.EAU);
        } else if (distance <= waterRadius + 2) {
          for (let y = bankY + 1; y <= oldHeight + 1; y++) world.setBlock(px, y, pz, BLOCK.AIR);
          world.setBlock(px, bankY - 1, pz, BLOCK.TERRE_ROUGE);
          world.setBlock(px, bankY, pz, BLOCK.HERBE_SAVANE);
        }
      }
    }

    // Trois palmiers intégrés à l'emprise réservée de l'oasis.
    for (let index = 0; index < 3; index++) {
      const direction = CARDINALS[(index + Math.floor(this._value('oasis', x, z, 12) * 4)) % 4];
      const palmX = x + direction[0] * (waterRadius + 2);
      const palmZ = z + direction[1] * (waterRadius + 2);
      this._buildPalm(world, palmX, bankY, palmZ, 'oasis', direction, 5 + index);
      this.structureCounts.palmier++;
    }
  }

  _setVillageBlock(world, x, y, z, type) {
    if (y > 0 && y < world.sizeY && world.isInBounds(x, y, z)) {
      world.setBlock(x, y, z, type);
    }
  }

  _fillVillageDisk(world, x, y, z, radius, type) {
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dz * dz <= radius * radius + 0.25) {
          this._setVillageBlock(world, x + dx, y, z + dz, type);
        }
      }
    }
  }

  _layVillagePath(world, x0, z0, x1, z1, baseY) {
    let x = x0;
    let z = z0;
    const stepX = Math.sign(x1 - x0);
    const stepZ = Math.sign(z1 - z0);
    while (x !== x1) {
      this._setVillageBlock(world, x, baseY, z, BLOCK.TERRE_ROUGE);
      x += stepX;
    }
    while (z !== z1) {
      this._setVillageBlock(world, x, baseY, z, BLOCK.TERRE_ROUGE);
      z += stepZ;
    }
    this._setVillageBlock(world, x, baseY, z, BLOCK.TERRE_ROUGE);
  }

  _prepareVillageGround(world, x, z, baseY) {
    for (let dz = -10; dz <= 9; dz++) {
      for (let dx = -10; dx <= 9; dx++) {
        const px = x + dx;
        const pz = z + dz;
        const terrainY = this.heightAt(px, pz);
        for (let y = terrainY + 1; y < baseY; y++) {
          this._setVillageBlock(world, px, y, pz, BLOCK.PIERRE_LATERITIQUE);
        }
        this._setVillageBlock(world, px, baseY, pz, BLOCK.HERBE_SAVANE);
      }
    }
  }

  _buildVillageHut(world, x, baseY, z, radius, decorated = false) {
    const wallHeight = 3;
    const doorZ = z - radius;
    for (let level = 1; level <= wallHeight; level++) {
      for (let dz = -radius; dz <= radius; dz++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const distance = Math.hypot(dx, dz);
          if (distance < radius - 0.6 || distance > radius + 0.3) continue;
          const isDoor = dx === 0 && dz === -radius && level <= 2;
          if (!isDoor) this._setVillageBlock(world, x + dx, baseY + level, z + dz, BLOCK.BANCO);
        }
      }
    }

    // Toit conique en chaume, avec débord au-dessus des murs.
    for (let layer = 0; layer <= radius + 1; layer++) {
      const roofRadius = Math.max(0, radius + 1 - layer);
      this._fillVillageDisk(world, x, baseY + wallHeight + 1 + layer, z, roofRadius, BLOCK.CHAUME);
    }

    if (decorated) {
      for (const dx of [-1, 1]) {
        this._setVillageBlock(world, x + dx, baseY + 1, doorZ, BLOCK.BOGOLAN);
        this._setVillageBlock(world, x + dx, baseY + 2, doorZ, BLOCK.BOGOLAN);
      }
      this._setVillageBlock(world, x, baseY + 3, doorZ, BLOCK.BOGOLAN);
    }
    return { x, z: doorZ };
  }

  _buildVillageGranary(world, x, baseY, z) {
    for (const dx of [-1, 1]) {
      for (const dz of [-1, 1]) {
        for (let level = 1; level <= 3; level++) {
          this._setVillageBlock(world, x + dx, baseY + level, z + dz, BLOCK.BOIS_BAOBAB);
        }
      }
    }
    this._fillVillageDisk(world, x, baseY + 4, z, 1, BLOCK.BOIS_BAOBAB);
    for (let level = 5; level <= 6; level++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (Math.hypot(dx, dz) >= 0.9) {
            this._setVillageBlock(world, x + dx, baseY + level, z + dz, BLOCK.BANCO);
          }
        }
      }
    }
    this._fillVillageDisk(world, x, baseY + 7, z, 2, BLOCK.CHAUME);
    this._fillVillageDisk(world, x, baseY + 8, z, 1, BLOCK.CHAUME);
    this._setVillageBlock(world, x, baseY + 9, z, BLOCK.CHAUME);
  }

  _buildPalaverTree(world, x, baseY, z) {
    for (let level = 1; level <= 7; level++) {
      this._fillSquare(world, x, baseY + level, z, level <= 2 ? 3 : 2, BLOCK.BOIS_BAOBAB);
    }
    const topY = baseY + 7;
    for (const [dx, dz] of STAR_DIRECTIONS) {
      for (let step = 1; step <= 3; step++) {
        this._setVillageBlock(world, x + dx * step, topY + Math.floor(step / 2), z + dz * step, BLOCK.BOIS_BAOBAB);
      }
      this._leafBlob(world, x + dx * 3, topY + 2, z + dz * 3, 2, 1, 2);
    }
    this._leafBlob(world, x, topY + 2, z, 3, 2, 3);
  }

  _buildVillagePalisade(world, x, baseY, z) {
    for (let dx = -11; dx <= 11; dx += 2) {
      if (Math.abs(dx) <= 1) continue; // porte nord
      const type = Math.abs(dx) % 4 === 1 ? BLOCK.BOIS_BAOBAB : BLOCK.BAMBOU;
      for (let level = 1; level <= 3; level++) {
        this._setVillageBlock(world, x + dx, baseY + level, z - 11, type);
      }
    }
    for (let dz = -9; dz <= 9; dz += 2) {
      if (Math.abs(dz) <= 1) continue; // passage ouest
      const type = Math.abs(dz) % 4 === 1 ? BLOCK.BOIS_BAOBAB : BLOCK.BAMBOU;
      for (let level = 1; level <= 3; level++) {
        this._setVillageBlock(world, x - 11, baseY + level, z + dz, type);
      }
    }
  }

  _villageSite(world, x, z) {
    if (this.biomeAt(x, z) !== BIOMES.SAVANE) return null;
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let savanna = 0;
    for (let dz = -10; dz <= 9; dz++) {
      for (let dx = -10; dx <= 9; dx++) {
        const px = x + dx;
        const pz = z + dz;
        const height = this.heightAt(px, pz);
        if (height <= SEA_LEVEL || world.getBlock(px, height + 1, pz) === BLOCK.EAU) return null;
        minHeight = Math.min(minHeight, height);
        maxHeight = Math.max(maxHeight, height);
        if (this.biomeAt(px, pz) === BIOMES.SAVANE) savanna++;
      }
    }
    const baseY = maxHeight;
    if (maxHeight - minHeight > 6 || baseY + 11 >= world.sizeY - 1) return null;
    if (savanna / 400 < 0.75) return null;
    return { baseY, score: this._value('village', x, z, 0) };
  }

  _buildVillage(world, x, baseY, z) {
    this._prepareVillageGround(world, x, z, baseY);
    this._fillVillageDisk(world, x, baseY, z, 3, BLOCK.TERRE_ROUGE);

    const doors = [
      this._buildVillageHut(world, x - 6, baseY, z - 6, 2),
      this._buildVillageHut(world, x + 5, baseY, z - 6, 2),
      this._buildVillageHut(world, x - 6, baseY, z + 5, 2),
      this._buildVillageHut(world, x + 5, baseY, z + 5, 3, true),
    ];
    this._buildVillageGranary(world, x, baseY, z - 8);
    this._buildVillageGranary(world, x - 9, baseY, z);
    this._buildPalaverTree(world, x, baseY, z);
    this._buildVillagePalisade(world, x, baseY, z);

    for (const door of doors) this._layVillagePath(world, x, z, door.x, door.z, baseY);
    this._layVillagePath(world, x, z, x, z - 8, baseY);
    this._layVillagePath(world, x, z, x - 9, z, baseY);
    this._layVillagePath(world, x, z, x, z - 11, baseY);
    this._layVillagePath(world, x, z, x - 11, z, baseY);
  }

  _generateVillages(world) {
    const candidates = [];
    for (let z = 15; z <= world.sizeZ - 15; z += 2) {
      for (let x = 15; x <= world.sizeX - 15; x += 2) {
        const site = this._villageSite(world, x, z);
        if (site) candidates.push({ x, z, ...site });
      }
    }
    candidates.sort((a, b) => b.score - a.score || a.z - b.z || a.x - b.x);

    let count = 0;
    for (const candidate of candidates) {
      if (count >= 3) break;
      if (!this._canReserveRect(world, candidate.x, candidate.z, -13, 13, -13, 13)) continue;
      this._reserveRect(world, candidate.x, candidate.z, -13, 13, -13, 13);
      this._buildVillage(world, candidate.x, candidate.baseY, candidate.z);
      this.structureCounts.village++;
      this.placements.push({
        type: 'village',
        x: candidate.x,
        z: candidate.z,
        radius: 13,
        baseY: candidate.baseY,
        bounds: { minX: candidate.x - 13, maxX: candidate.x + 13, minZ: candidate.z - 13, maxZ: candidate.z + 13 },
      });
      count++;
    }
  }

  _reserveSpawnArea(world) {
    const centerX = Math.floor(world.sizeX / 2);
    const centerZ = Math.floor(world.sizeZ / 2);
    for (let radius = 0; radius < Math.max(world.sizeX, world.sizeZ); radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const x = centerX + dx;
          const z = centerZ + dz;
          if (x < 5 || x >= world.sizeX - 5 || z < 5 || z >= world.sizeZ - 5) continue;
          if (this.heightAt(x, z) > SEA_LEVEL) {
            this._reserve(world, x, z, 4);
            return;
          }
        }
      }
    }
  }

  _generateStructures(world) {
    this._reserved = new Uint8Array(world.sizeX * world.sizeZ);
    this.placements = [];
    this.structureCounts = Object.create(null);
    for (const key of STRUCTURE_KEYS) this.structureCounts[key] = 0;
    this._reserveSpawnArea(world);
    this._generateVillages(world);

    const configs = [
      { key: 'oasis', spacing: 32, threshold: 0.5, reserveRadius: 12, supportRadius: 5, maxSlope: 2, maxRise: 10, minBiomeCoverage: 0.8, biomes: [BIOMES.DESERT], limit: 3, builder: this._buildOasis },
      { key: 'inselberg', spacing: 28, threshold: 0.46, reserveRadius: 8, supportRadius: 6, maxSlope: 4, maxRise: 15, minBiomeCoverage: 0.65, biomes: [BIOMES.DESERT, BIOMES.SAVANE], limit: 4, builder: this._buildInselberg },
      { key: 'fromager', spacing: 20, threshold: 0.3, reserveRadius: 11, supportRadius: 3, maxSlope: 3, maxRise: 24, minBiomeCoverage: 0.7, biomes: [BIOMES.FORET], limit: 6, builder: this._buildFromager },
      { key: 'baobab', spacing: 20, threshold: 0, reserveRadius: 9, supportRadius: 2, maxSlope: 2, maxRise: 14, minBiomeCoverage: 0.65, biomes: [BIOMES.SAVANE], limit: 32, builder: this._buildBaobab },
      { key: 'termitiere', spacing: 14, threshold: 0.35, reserveRadius: 4, supportRadius: 2, maxSlope: 2, maxRise: 8, minBiomeCoverage: 0.65, biomes: [BIOMES.SAVANE], limit: 10, builder: this._buildTermiteMound },
      { key: 'acacia', spacing: 9, threshold: 0.22, reserveRadius: 6, supportRadius: 1, maxSlope: 2, maxRise: 10, minBiomeCoverage: 0.6, biomes: [BIOMES.SAVANE], limit: 24, builder: this._buildAcacia },
      { key: 'palmier', spacing: 10, threshold: 0.25, reserveRadius: 6, supportRadius: 1, maxSlope: 2, maxRise: 12, minBiomeCoverage: 0.65, biomes: [BIOMES.FORET], limit: 20, builder: this._buildPalm },
    ];

    for (const config of configs) this._scatter(world, config, config.builder);
  }

  generate(world) {
    for (let x = 0; x < world.sizeX; x++) {
      for (let z = 0; z < world.sizeZ; z++) {
        const biome = this.biomeAt(x, z);
        const height = this.heightAt(x, z);
        this.surfaceColumn(world, x, z, biome, height);
      }
    }
    this.fillWater(world);
    this._generateStructures(world);
  }
}
