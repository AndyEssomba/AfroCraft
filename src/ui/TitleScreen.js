/** Écran-titre AfroCraft : génération du monde puis entrée en jeu. */
export class TitleScreen {
  constructor(container) {
    this._playListener = null;
    this.element = document.createElement('section');
    this.element.className = 'afro-title-screen';
    this.element.setAttribute('aria-label', "Écran-titre d'AfroCraft");
    this.element.innerHTML = `
      <div class="afro-title-sun" aria-hidden="true"></div>
      <svg class="afro-baobab-silhouette" viewBox="0 0 520 360" aria-hidden="true">
        <path d="M239 350 L239 195 Q215 180 191 148 L159 109 L176 91 L218 136 L225 99 L202 57 L222 45 L250 90 L260 33 L282 35 L285 88 L325 50 L343 66 L302 111 L304 146 L347 98 L365 115 L323 165 Q302 189 283 197 L286 350 Z"/>
        <path d="M101 89 Q124 53 167 69 Q177 27 218 51 Q244 13 282 47 Q318 18 344 58 Q389 30 405 73 Q453 65 466 110 Q430 140 386 126 Q372 166 329 148 Q295 174 264 142 Q228 174 196 145 Q151 166 137 125 Q93 137 70 112 Z"/>
      </svg>
      <div class="afro-title-content afro-frame">
        <p class="afro-title-kicker">TERRES DE LATÉRITE</p>
        <h1>AfroCraft</h1>
        <p class="afro-title-subtitle">Construisez, explorez et racontez les paysages du continent.</p>
        <p class="afro-title-loading">Préparation du monde…</p>
        <button type="button" disabled>Génération…</button>
      </div>`;

    this.loading = this.element.querySelector('.afro-title-loading');
    this.playButton = this.element.querySelector('button');
    this.playButton.addEventListener('click', () => this._playListener?.());
    container.appendChild(this.element);
  }

  onPlay(listener) {
    this._playListener = listener;
  }

  setLoading(label) {
    this.loading.textContent = label;
    this.playButton.disabled = true;
    this.playButton.textContent = 'Génération…';
  }

  setReady() {
    this.loading.textContent = 'Le monde est prêt.';
    this.playButton.disabled = false;
    this.playButton.textContent = 'Jouer';
  }

  show() {
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
