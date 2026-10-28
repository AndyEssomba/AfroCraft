import { BLOCK_CATEGORIES, BLOCK_DATA } from '../world/blocks.js';
import { createBlockIconCanvas } from './Hotbar.js';

/** Sélecteur modal de tous les blocs posables, regroupés par catégorie. */
export class BlockSelector {
  constructor(container, hotbar) {
    this.hotbar = hotbar;
    this.opened = false;
    this._listeners = new Set();

    this.element = document.createElement('div');
    this.element.className = 'afro-selector-modal';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-modal', 'true');
    this.element.setAttribute('aria-label', 'Sélecteur de blocs');
    this.element.style.cssText =
      'position:fixed;inset:0;z-index:30;display:none;align-items:center;justify-content:center;' +
      'padding:24px;box-sizing:border-box;background:rgba(9,7,6,.82);' +
      'font-family:system-ui,-apple-system,sans-serif;color:#fff;pointer-events:auto;' +
      'backdrop-filter:blur(5px);';

    const panel = document.createElement('div');
    panel.className = 'afro-frame afro-selector-panel';
    panel.style.cssText =
      'position:relative;width:min(920px,100%);max-height:calc(100vh - 48px);overflow:auto;' +
      'box-sizing:border-box;padding:22px;color:#fff;' +
      'font-family:\'Noto Sans\',system-ui,sans-serif;';
    this.element.appendChild(panel);

    const title = document.createElement('h2');
    title.textContent = 'Sélecteur de blocs';
    title.style.cssText = 'margin:0;color:#ffd166;font-size:24px;';
    panel.appendChild(title);

    const hint = document.createElement('p');
    hint.textContent = 'Cliquez sur un bloc pour l’assigner à la case sélectionnée de la hotbar. E ou Échap pour fermer.';
    hint.style.cssText = 'margin:5px 42px 18px 0;color:#ddd;font-size:13px;';
    panel.appendChild(hint);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.setAttribute('aria-label', 'Fermer le sélecteur');
    closeButton.style.cssText =
      'position:absolute;right:14px;top:12px;width:34px;height:34px;border:0;border-radius:6px;' +
      'background:rgba(255,255,255,.12);color:#fff;font-size:25px;cursor:pointer;';
    closeButton.addEventListener('click', () => this.close());
    panel.appendChild(closeButton);

    this.status = document.createElement('div');
    this.status.setAttribute('role', 'status');
    this.status.setAttribute('aria-live', 'polite');
    this.status.style.cssText =
      'position:sticky;bottom:-22px;margin:18px -22px -22px;padding:9px 18px;' +
      'background:rgba(10,8,7,.92);color:#ffe3a3;font-size:13px;text-align:center;';

    for (const category of BLOCK_CATEGORIES) {
      const section = document.createElement('section');
      section.style.cssText = 'margin-top:16px;';
      const heading = document.createElement('h3');
      heading.textContent = category.nom;
      heading.style.cssText =
        'margin:0 0 8px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,.18);' +
        'color:#f2c879;font-size:15px;letter-spacing:.04em;';
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.style.cssText =
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;';
      section.appendChild(grid);

      for (const type of category.types) {
        const data = BLOCK_DATA[type];
        const card = document.createElement('button');
        card.type = 'button';
        card.title = data.nom;
        card.style.cssText =
          'min-height:90px;padding:7px;border:2px solid rgba(255,255,255,.18);border-radius:7px;' +
          'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;' +
          'background:rgba(255,255,255,.07);color:#fff;cursor:pointer;' +
          'font:600 12px/1.2 system-ui,sans-serif;transition:transform .12s,border-color .12s,background .12s;';
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)';
          card.style.borderColor = '#ffd166';
          card.style.background = 'rgba(255,209,102,.13)';
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'none';
          card.style.borderColor = 'rgba(255,255,255,.18)';
          card.style.background = 'rgba(255,255,255,.07)';
        });
        card.addEventListener('click', () => {
          if (this.hotbar.assignSelected(type)) {
            this.status.textContent = `${data.nom} assigné à la case ${this.hotbar.selectedIndex + 1}`;
          }
        });

        card.appendChild(createBlockIconCanvas(type, 48));
        const name = document.createElement('span');
        name.textContent = data.nom;
        card.appendChild(name);
        grid.appendChild(card);
      }
      panel.appendChild(section);
    }

    panel.appendChild(this.status);
    container.appendChild(this.element);
  }

  get isOpen() {
    return this.opened;
  }

  onChange(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    for (const listener of this._listeners) listener(this.opened);
  }

  open() {
    if (this.opened) return;
    this.opened = true;
    this.status.textContent = `Case sélectionnée : ${this.hotbar.selectedIndex + 1}`;
    this.element.style.display = 'flex';
    this._notify();
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.element.style.display = 'none';
    this._notify();
  }

  toggle() {
    if (this.opened) this.close();
    else this.open();
    return this.opened;
  }
}
