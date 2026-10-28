// Bruit de valeur 2D seedé, déterministe (interpolation lissée).
// Tâche 5.1 — _Requirements: 1.1, 1.3_

/** Hash entier déterministe -> [0,1) à partir de (x,z,seed). */
function hash2(x, z, seed) {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 0x27d4eb2d);
  h = Math.imul(h ^ (z | 0), 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  // normalise en [0,1)
  return ((h >>> 0) % 100000) / 100000;
}

function smooth(t) {
  // courbe lissée (smoothstep) 3t^2 - 2t^3
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Crée une fonction de bruit de valeur 2D déterministe pour une graine donnée.
 * Renvoie une valeur continue dans [-1, 1]. Le résultat ne dépend que de
 * (x, z, seed), donc la génération est reproductible (Exigence 1.1).
 * @param {number} seed
 * @returns {(x:number, z:number) => number}
 */
export function makeNoise2D(seed) {
  return function noise(x, z) {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const tx = smooth(x - x0);
    const tz = smooth(z - z0);
    const v00 = hash2(x0, z0, seed);
    const v10 = hash2(x0 + 1, z0, seed);
    const v01 = hash2(x0, z0 + 1, seed);
    const v11 = hash2(x0 + 1, z0 + 1, seed);
    const a = lerp(v00, v10, tx);
    const b = lerp(v01, v11, tx);
    return lerp(a, b, tz) * 2 - 1; // [0,1) -> [-1,1)
  };
}

/**
 * Bruit fractal (plusieurs octaves) pour un relief plus naturel.
 * @param {(x:number,z:number)=>number} noise
 * @param {number} x
 * @param {number} z
 * @param {{octaves?:number, frequency?:number, persistence?:number}} [opts]
 * @returns {number} valeur approximativement dans [-1, 1]
 */
export function fbm(noise, x, z, opts = {}) {
  const octaves = opts.octaves ?? 4;
  const persistence = opts.persistence ?? 0.5;
  let freq = opts.frequency ?? 1;
  let amp = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise(x * freq, z * freq) * amp;
    norm += amp;
    amp *= persistence;
    freq *= 2;
  }
  return sum / norm;
}