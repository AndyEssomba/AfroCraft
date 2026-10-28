// Matériaux Three.js par type de bloc.
// Tâche 3.1 — _Requirements: 5.2, 5.3, 5.6, 5.4_
import * as THREE from 'three';
import { BLOCK, BLOCK_DATA } from '../world/blocks.js';

/**
 * Crée un matériau distinct par type de bloc à partir de BLOCK_DATA.
 * Chaque type a une couleur distincte (5.2) ; l'herbe de forêt est plus foncée
 * que la savane (5.3, défini dans BLOCK_DATA) ; la bedrock est distincte (5.6) ;
 * l'eau est transparente et non écrite dans le depth buffer (5.4).
 * On utilise le vertex color du meshing : les matériaux portent donc
 * `vertexColors: true` et la couleur réelle vient de la géométrie.
 * @returns {{ opaque: THREE.Material, eau: THREE.Material }}
 */
export function createMaterials() {
  const opaque = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });

  const eau = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    opacity: BLOCK_DATA[BLOCK.EAU].transparence ?? 0.6, // 5.4
    roughness: 1,
    metalness: 0,
    depthTest: true,
    depthWrite: false,
  });

  return { opaque, eau };
}

/** Couleur THREE.Color d'un type de bloc (utilisée par le meshing en vertex color). */
export function blockColor(t) {
  return new THREE.Color(BLOCK_DATA[t].couleur);
}