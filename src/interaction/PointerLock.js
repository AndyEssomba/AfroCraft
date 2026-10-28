// Capture de la souris (Pointer Lock API).
// Tâche 4.8 — _Requirements: 11.1, 11.2_

export class PointerLock {
  /**
   * @param {HTMLElement} element élément à verrouiller (canvas de rendu)
   */
  constructor(element) {
    this.element = element;
    this.locked = false;
    this._onChange = () => {
      this.locked = document.pointerLockElement === this.element;
      this._notify();
    };
    this._listeners = new Set();
    document.addEventListener('pointerlockchange', this._onChange);
  }

  /** Demande la capture de la souris (clic dans la fenêtre) — Exigence 11.1. */
  request() {
    if (!this.locked && this.element.requestPointerLock) {
      this.element.requestPointerLock();
    }
  }

  /** Libère la souris (Échap) — Exigence 11.2. */
  release() {
    if (this.locked && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  /** Vrai si la souris est actuellement capturée (gate rotation/casser/poser). */
  get isLocked() {
    return this.locked;
  }

  /** S'abonne aux changements d'état de capture. */
  onChange(cb) {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  _notify() {
    for (const cb of this._listeners) cb(this.locked);
  }

  dispose() {
    document.removeEventListener('pointerlockchange', this._onChange);
    this._listeners.clear();
  }
}