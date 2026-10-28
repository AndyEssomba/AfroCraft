// Carte des biomes : trois régions contiguës via un bruit basse fréquence,
// indépendant du bruit de relief pour des transitions sans discontinuité.
// Tâche 5.2 — _Requirements: 2.1, 2.5, 2.6_
import { makeNoise2D, fbm } from './noise.js';

export const BIOMES = Object.freeze({ SAVANE: 'SAVANE', DESERT: 'DESERT', FORET: 'FORET' });

// Fréquence basse -> grandes régions contiguës (2.5).
const BIOME_FREQUENCY = 0.012;

export class BiomeMap {
  /** @param {number} seed */
  constructor(seed) {
    // Graine décalée pour un bruit indépendant du relief.
    this.noise = makeNoise2D((seed ^ 0x9e3779b9) | 0);
  }

  /**
   * Valeur de biome continue en [0,1] à une position monde (x,z).
   * Continue -> pas de discontinuité à la frontière (2.6).
   */
  value(x, z) {
    const v = fbm(this.noise, x, z, { octaves: 3, frequency: BIOME_FREQUENCY, persistence: 0.5 });
    return (v + 1) / 2; // [-1,1] -> [0,1]
  }

  /**
   * Biome à une position monde (x,z), par seuillage de la valeur continue.
   * Trois régions larges et contiguës (2.1, 2.5).
   */
  biomeAt(x, z) {
    const v = this.value(x, z);
    if (v < 0.38) return BIOMES.DESERT;
    if (v < 0.68) return BIOMES.SAVANE;
    return BIOMES.FORET;
  }
}