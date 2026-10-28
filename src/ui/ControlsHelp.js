/** Panneau permanent des commandes du jeu. */
export class ControlsHelp {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.element = document.createElement('section');
    this.element.className = 'afro-ui-frame afro-controls-help';
    this.element.setAttribute('aria-label', 'Commandes du jeu');
    this.element.style.cssText =
      'position:fixed;right:12px;top:12px;z-index:12;width:min(250px,calc(100vw - 24px));' +
      'box-sizing:border-box;padding:10px 12px;color:#fff;' +
      'font:12px/1.35 \'Noto Sans\',system-ui,sans-serif;pointer-events:none;' +
      'backdrop-filter:blur(3px);';

    const title = document.createElement('div');
    title.textContent = 'COMMANDES';
    title.style.cssText =
      'margin-bottom:7px;color:#ffd166;font-size:13px;font-weight:800;letter-spacing:.08em;';
    this.element.appendChild(title);

    const commands = [
      ['ZQSD / WASD / Flèches', 'Se déplacer'],
      ['Souris', 'Regarder'],
      ['Espace', 'Sauter / remonter dans l’eau'],
      ['Clic gauche', 'Casser un bloc'],
      ['Clic droit', 'Poser un bloc'],
      ['1–9 / Molette', 'Choisir une case'],
      ['E', 'Sélecteur de blocs'],
      ['F5', 'Changer de vue'],
      ['Échap', 'Fermer / libérer la souris'],
    ];

    for (const [key, action] of commands) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;' +
        'padding:3px 0;border-top:1px solid rgba(255,255,255,.08);';

      const keyLabel = document.createElement('span');
      keyLabel.textContent = key;
      keyLabel.style.cssText = 'font-weight:700;color:#fff;white-space:nowrap;';

      const actionLabel = document.createElement('span');
      actionLabel.textContent = action;
      actionLabel.style.cssText = 'color:#d7d7d7;text-align:right;';

      row.append(keyLabel, actionLabel);
      this.element.appendChild(row);
    }

    container.appendChild(this.element);
  }
}
