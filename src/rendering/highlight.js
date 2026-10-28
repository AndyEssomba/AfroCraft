// Surbrillance du bloc visé (wireframe) et réticule central.
// Tâche 6.9 — _Requirements: 10.1, 10.2, 10.3, 10.4_
import * as THREE from 'three';

export class Highlight {
  /**
   * @param {THREE.Scene} scene
   * @param {number} halfX décalage monde->scène sur X (world.sizeX/2)
   * @param {number} halfZ décalage monde->scène sur Z (world.sizeZ/2)
   */
  constructor(scene, halfX, halfZ) {
    this.scene = scene;
    this.halfX = halfX;
    this.halfZ = halfZ;
    const geom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(geom);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.mesh = new THREE.LineSegments(edges, mat);
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  /**
   * Positionne la surbrillance sur le bloc (x,y,z) en coordonnées monde, ou la
   * masque si null — Exigence 10.2, 10.3, 10.4.
   * @param {number|null} x
   * @param {number} [y]
   * @param {number} [z]
   */
  set(x, y, z) {
    if (x === null || x === undefined) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    // centre du bloc, converti dans le repère centré de la scène
    this.mesh.position.set(x - this.halfX + 0.5, y + 0.5, z - this.halfZ + 0.5);
  }
}

/**
 * Crée un réticule au centre de l'écran — Exigence 10.1.
 * @param {HTMLElement} container
 * @returns {{show():void, hide():void}}
 */
export function createReticle(container) {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;' +
    'border-radius:50%;background:#fff;mix-blend-mode:difference;pointer-events:none;z-index:5;';
  container.appendChild(el);
  return {
    show() { el.style.display = 'block'; },
    hide() { el.style.display = 'none'; },
  };
}