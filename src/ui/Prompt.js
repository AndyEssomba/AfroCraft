// Invite "cliquer pour jouer" affichée quand la souris est libre.
// Tâche 4.9 — _Requirements: 11.5_

export class Prompt {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.el = document.createElement('div');
    this.el.className = 'afro-ui-frame afro-prompt';
    this.el.style.cssText =
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
      'color:#fff4d0;font-family:\'Noto Sans\',sans-serif;font-size:1.4rem;font-weight:800;' +
      'cursor:pointer;user-select:none;z-index:10;background-color:rgba(20,12,8,.68);';
    this.el.textContent = 'Cliquer pour jouer';
    container.appendChild(this.el);
  }

  /** Affiche l'invite (souris libre). */
  show() {
    this.el.style.display = 'flex';
  }

  /** Masque l'invite (souris capturée). */
  hide() {
    this.el.style.display = 'none';
  }
}