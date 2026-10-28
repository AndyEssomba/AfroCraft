/** Écran de pause dans la même identité visuelle que le titre. */
export class PauseScreen {
  constructor(container) {
    this._resumeListener = null;
    this.element = document.createElement('section');
    this.element.className = 'afro-pause-screen';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', 'Jeu en pause');
    this.element.innerHTML = `
      <div class="afro-pause-panel afro-frame">
        <p class="afro-title-kicker">AFROCRAFT</p>
        <h2>Pause</h2>
        <button type="button">Reprendre</button>
        <h3>Commandes</h3>
        <dl class="afro-pause-commands">
          <dt>ZQSD / WASD / Flèches</dt><dd>Se déplacer</dd>
          <dt>Souris</dt><dd>Regarder</dd>
          <dt>Espace</dt><dd>Sauter / nager</dd>
          <dt>Clic gauche / droit</dt><dd>Casser / poser</dd>
          <dt>1–9 / Molette</dt><dd>Choisir une case</dd>
          <dt>E</dt><dd>Sélecteur de blocs</dd>
          <dt>F5</dt><dd>Changer de vue</dd>
          <dt>Échap</dt><dd>Reprendre</dd>
        </dl>
      </div>`;
    this.resumeButton = this.element.querySelector('button');
    this.resumeButton.addEventListener('click', () => this._resumeListener?.());
    container.appendChild(this.element);
  }

  onResume(listener) {
    this._resumeListener = listener;
  }

  get isOpen() {
    return this.element.style.display === 'flex';
  }

  show() {
    this.element.style.display = 'flex';
    this.resumeButton.focus();
  }

  hide() {
    this.element.style.display = 'none';
  }
}
