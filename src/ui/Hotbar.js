import { BLOCK, BLOCK_DATA, PLACABLES } from '../world/blocks.js';

const TEXTURE_SIZE = 16;
const ICON_SIZE = 48;
const ICON_CACHE = new Map();

const FACE_ID = Object.freeze({ top: 1, side: 2 });

/** Valeur pseudo-aléatoire déterministe dans [0, 1). */
function noise(type, face, x, y, salt = 0) {
  let hash = Math.imul(type + 17, 0x45d9f3b);
  hash ^= Math.imul(FACE_ID[face] + salt + 31, 0x27d4eb2d);
  hash ^= Math.imul(x + 101, 0x165667b1);
  hash ^= Math.imul(y + 211, 0x1b873593);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  return (hash >>> 0) / 0x100000000;
}

function fillPixel(ctx, x, y, color, width = 1, height = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

/** Génère une texture pixel-art 16×16 déterministe pour une face. */
function createTexture(type, face) {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  if (type === BLOCK.TERRE_ROUGE) {
    ctx.fillStyle = '#9c3b1b';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.13) fillPixel(ctx, x, y, '#662613');
        else if (n > 0.94) fillPixel(ctx, x, y, '#bd542c');
      }
    }
  } else if (type === BLOCK.HERBE_SAVANE || type === BLOCK.HERBE_FORET) {
    const forest = type === BLOCK.HERBE_FORET;
    const grass = forest ? '#2f7d32' : '#9bbd4e';
    const grassLight = forest ? '#439a43' : '#bfd66a';
    const grassDark = forest ? '#1a5427' : '#66852c';

    if (face === 'top') {
      ctx.fillStyle = grass;
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const n = noise(type, face, x, y);
          if (n < 0.16) fillPixel(ctx, x, y, grassDark);
          else if (n > 0.83) fillPixel(ctx, x, y, grassLight);
        }
      }
    } else {
      ctx.fillStyle = '#9c3b1b';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        const depth = 2 + Math.floor(noise(type, face, x, 0) * 4);
        for (let y = 0; y < depth; y++) {
          fillPixel(ctx, x, y, noise(type, face, x, y, 2) > 0.7 ? grassLight : grass);
        }
        if (depth < 16) fillPixel(ctx, x, depth, grassDark);
      }
      for (let y = 6; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          if (noise(type, face, x, y, 3) < 0.1) fillPixel(ctx, x, y, '#6f2815');
        }
      }
    }
  } else if (type === BLOCK.SABLE) {
    ctx.fillStyle = '#e4d6a7';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.1) fillPixel(ctx, x, y, '#b9a873');
        else if (n > 0.9) fillPixel(ctx, x, y, '#fff0bd');
      }
    }
  } else if (type === BLOCK.PIERRE) {
    ctx.fillStyle = '#7d7d7d';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.12) fillPixel(ctx, x, y, '#5b5b5b');
        else if (n > 0.88) fillPixel(ctx, x, y, '#9d9d9d');
      }
    }
    let crackX = 3 + Math.floor(noise(type, face, 0, 0, 4) * 9);
    for (let y = 1; y < 15; y++) {
      if (noise(type, face, crackX, y, 5) > 0.68) {
        crackX += noise(type, face, crackX, y, 6) > 0.5 ? 1 : -1;
        crackX = Math.max(1, Math.min(14, crackX));
      }
      fillPixel(ctx, crackX, y, '#454545');
    }
  } else if (type === BLOCK.BOIS_BAOBAB) {
    if (face === 'top') {
      ctx.fillStyle = '#9b7047';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const dx = x - 7.5;
          const dy = (y - 7.5) * 1.2;
          const ring = Math.floor(Math.sqrt(dx * dx + dy * dy));
          if (ring === 2 || ring === 5 || ring === 7) fillPixel(ctx, x, y, '#684321');
          else if (ring === 3 || ring === 6) fillPixel(ctx, x, y, '#b78a59');
        }
      }
      fillPixel(ctx, 7, 7, '#4f3019', 2, 2);
    } else {
      ctx.fillStyle = '#6b4a2b';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 0; x < 16; x++) {
        const vein = noise(type, face, x, 0);
        if (vein < 0.28 || vein > 0.82) {
          const color = vein < 0.28 ? '#432b19' : '#93643a';
          for (let y = 0; y < 16; y++) {
            const offset = noise(type, face, x, y, 8) > 0.88 ? 1 : 0;
            fillPixel(ctx, Math.min(15, x + offset), y, color);
          }
        }
      }
    }
  } else if (type === BLOCK.FEUILLES) {
    const greens = ['#2f6f31', '#4e8a3a', '#68a84b', '#24572b'];
    ctx.fillStyle = greens[1];
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.11) fillPixel(ctx, x, y, '#122f1b');
        else fillPixel(ctx, x, y, greens[Math.floor(n * greens.length) % greens.length]);
      }
    }
  } else if (type === BLOCK.EAU) {
    ctx.clearRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(42,111,219,0.76)';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y * 2 + Math.floor(noise(type, face, x, y) * 4)) % 13 === 0) {
          fillPixel(ctx, x, y, 'rgba(159,216,255,0.9)', 2, 1);
        }
      }
    }
  } else if (type === BLOCK.ARGILE) {
    ctx.fillStyle = '#b08968';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 3; y < 16; y += 4) {
      ctx.fillStyle = y % 8 === 3 ? '#9b765a' : '#c09a79';
      ctx.fillRect(0, y, 16, 1);
    }
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (noise(type, face, x, y, 9) > 0.97) fillPixel(ctx, x, y, '#c9a587');
      }
    }
  } else if (type === BLOCK.BANCO) {
    ctx.fillStyle = '#c58a48';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.045) fillPixel(ctx, x, y, '#a96f38');
        else if (n > 0.965) fillPixel(ctx, x, y, '#d8a565');
      }
    }
    for (let mark = 0; mark < 3; mark++) {
      const mx = 3 + Math.floor(noise(type, face, mark, 2, 1) * 9);
      const my = 3 + Math.floor(noise(type, face, mark, 5, 2) * 9);
      fillPixel(ctx, mx, my, '#ae783f', 2, 1);
      fillPixel(ctx, mx - 1, my + 1, '#ae783f', 1, 2);
      fillPixel(ctx, mx + 2, my + 1, '#d29b5c', 1, 2);
    }
  } else if (type === BLOCK.CHAUME) {
    ctx.fillStyle = '#d6ad45';
    ctx.fillRect(0, 0, 16, 16);
    ctx.lineWidth = 1;
    for (let offset = -16; offset < 24; offset += 4) {
      ctx.strokeStyle = offset % 8 === 0 ? '#f0cb66' : '#9f7628';
      ctx.beginPath();
      ctx.moveTo(offset, 16);
      ctx.lineTo(offset + 12, 0);
      ctx.stroke();
    }
    for (let y = 3; y < 16; y += 5) fillPixel(ctx, 0, y, '#b78b30', 16, 1);
  } else if (type === BLOCK.BAMBOU) {
    ctx.fillStyle = '#315f32';
    ctx.fillRect(0, 0, 16, 16);
    for (let stem = 1; stem < 16; stem += 4) {
      const stemColor = stem % 8 === 1 ? '#6fa950' : '#4f8a3f';
      fillPixel(ctx, stem, 0, stemColor, 2, 16);
      fillPixel(ctx, stem + 2, 0, '#254c29', 1, 16);
      for (let node = 4; node < 16; node += 5) {
        fillPixel(ctx, stem - 1, node, '#a0bd65', 4, 1);
        fillPixel(ctx, stem, node + 1, '#365f31', 2, 1);
      }
    }
  } else if (type === BLOCK.RAPHIA) {
    ctx.fillStyle = '#c8aa75';
    ctx.fillRect(0, 0, 16, 16);
    ctx.lineWidth = 1;
    for (let offset = -16; offset < 24; offset += 4) {
      ctx.strokeStyle = '#ead19a';
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + 16, 16);
      ctx.stroke();
      ctx.strokeStyle = '#967744';
      ctx.beginPath();
      ctx.moveTo(offset + 2, 16);
      ctx.lineTo(offset + 18, 0);
      ctx.stroke();
    }
  } else if (type === BLOCK.PIERRE_LATERITIQUE) {
    ctx.fillStyle = '#762f26';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.16) fillPixel(ctx, x, y, '#421d1a');
        else if (n > 0.88) fillPixel(ctx, x, y, '#a34835');
        else if (n > 0.56 && n < 0.6) fillPixel(ctx, x, y, '#5b261f', 2, 1);
      }
    }
  } else if (type === BLOCK.BOIS_SOMBRE) {
    if (face === 'top') {
      ctx.fillStyle = '#5a3825';
      ctx.fillRect(0, 0, 16, 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const radius = Math.floor(Math.hypot(x - 7.5, (y - 7.5) * 1.15));
          if (radius === 2 || radius === 5 || radius === 7) fillPixel(ctx, x, y, '#28170f');
          else if (radius === 3 || radius === 6) fillPixel(ctx, x, y, '#765039');
        }
      }
    } else {
      ctx.fillStyle = '#3b2519';
      ctx.fillRect(0, 0, 16, 16);
      for (let x = 1; x < 16; x += 3) {
        fillPixel(ctx, x, 0, x % 2 ? '#24150f' : '#63432e', 1, 16);
        if (x + 1 < 16) fillPixel(ctx, x + 1, 4 + (x % 5), '#4c3020', 1, 8);
      }
    }
  } else if (type === BLOCK.BOGOLAN) {
    ctx.fillStyle = '#65402b';
    ctx.fillRect(0, 0, 16, 16);
    const ink = '#eee2c5';
    for (let y = 1; y < 16; y += 6) fillPixel(ctx, 0, y, ink, 16, 1);
    for (let center = 3; center < 16; center += 7) {
      for (let step = 0; step < 3; step++) {
        fillPixel(ctx, center - step, 4 + step, ink);
        fillPixel(ctx, center + step, 4 + step, ink);
        fillPixel(ctx, center - step, 8 - step, ink);
        fillPixel(ctx, center + step, 8 - step, ink);
      }
    }
  } else if (type === BLOCK.NDOP) {
    ctx.fillStyle = '#263a83';
    ctx.fillRect(0, 0, 16, 16);
    const white = '#f5f2e8';
    for (let y = 0; y < 16; y += 8) fillPixel(ctx, 0, y, white, 16, 1);
    for (let x = 0; x < 16; x += 8) fillPixel(ctx, x, 0, white, 1, 16);
    for (const cx of [4, 12]) {
      for (let step = 0; step <= 3; step++) {
        fillPixel(ctx, cx - step, 4 + step, white);
        fillPixel(ctx, cx + step, 4 + step, white);
        fillPixel(ctx, cx - step, 4 - step, white);
        fillPixel(ctx, cx + step, 4 - step, white);
      }
    }
  } else if (type === BLOCK.SABLE_DORE) {
    ctx.fillStyle = '#d7aa45';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(type, face, x, y);
        if (n < 0.11) fillPixel(ctx, x, y, '#a87725');
        else if (n > 0.88) fillPixel(ctx, x, y, '#f4d374');
      }
    }
  } else if (type === BLOCK.TUILE_ARGILE_CUITE) {
    ctx.fillStyle = '#b65332';
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 5) {
      fillPixel(ctx, 0, y, '#74301f', 16, 1);
      const shift = (Math.floor(y / 5) % 2) * 4;
      for (let x = shift; x < 16; x += 8) fillPixel(ctx, x, y, '#74301f', 1, 5);
    }
    for (let y = 1; y < 16; y += 5) fillPixel(ctx, 0, y, '#d27852', 16, 1);
  }

  return canvas;
}

function polygon(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index++) {
    ctx.lineTo(points[index][0], points[index][1]);
  }
  ctx.closePath();
}

/** Projette une texture 16×16 sur une face isométrique. */
function drawFace(ctx, texture, points, transform, darkness) {
  ctx.save();
  polygon(ctx, points);
  ctx.clip();
  ctx.setTransform(...transform);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(texture, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  ctx.restore();

  if (darkness > 0) {
    ctx.save();
    polygon(ctx, points);
    ctx.fillStyle = `rgba(0,0,0,${darkness})`;
    ctx.fill();
    ctx.restore();
  }
}

/** Génère une fois l'icône isométrique finale d'un type de bloc. */
function createBlockIcon(type) {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'width:46px;height:46px;display:block;image-rendering:pixelated;pointer-events:none;';

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  const topTexture = createTexture(type, 'top');
  const sideTexture = createTexture(type, 'side');
  const top = [[24, 2], [45, 13], [24, 24], [3, 13]];
  const left = [[3, 13], [24, 24], [24, 45], [3, 34]];
  const right = [[45, 13], [24, 24], [24, 45], [45, 34]];

  drawFace(ctx, sideTexture, left, [21 / 16, 11 / 16, 0, 21 / 16, 3, 13], 0.2);
  drawFace(ctx, sideTexture, right, [21 / 16, -11 / 16, 0, 21 / 16, 24, 24], 0.35);
  drawFace(ctx, topTexture, top, [21 / 16, 11 / 16, -21 / 16, 11 / 16, 24, 2], 0);

  ctx.strokeStyle = 'rgba(20,12,8,0.8)';
  ctx.lineWidth = 1;
  for (const points of [left, right, top]) {
    polygon(ctx, points);
    ctx.stroke();
  }

  return canvas;
}

export function createBlockIconCanvas(type, cssSize = 46) {
  if (!ICON_CACHE.has(type)) ICON_CACHE.set(type, createBlockIcon(type));
  const source = ICON_CACHE.get(type);
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    `width:${cssSize}px;height:${cssSize}px;display:block;image-rendering:pixelated;pointer-events:none;`;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0);
  } else {
    canvas.style.background = `#${BLOCK_DATA[type].couleur.toString(16).padStart(6, '0')}`;
  }
  return canvas;
}

/** Barre d’accès rapide de neuf blocs, affichée en overlay. */
export class Hotbar {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.items = [...PLACABLES];
    this.index = 0;
    this._nameTimer = null;

    this.element = document.createElement('div');
    this.element.className = 'afro-ui-frame afro-hotbar';
    this.element.setAttribute('aria-label', 'Barre de blocs');
    this.element.setAttribute('role', 'listbox');
    this.element.style.cssText =
      'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);' +
      'display:flex;gap:4px;padding:6px;z-index:8;' +
      'font-family:\'Noto Sans\',system-ui,sans-serif;pointer-events:none;overflow:visible;';

    this.nameLabel = document.createElement('div');
    this.nameLabel.setAttribute('role', 'status');
    this.nameLabel.setAttribute('aria-live', 'polite');
    this.nameLabel.style.cssText =
      'position:absolute;left:50%;bottom:calc(100% + 10px);transform:translateX(-50%);' +
      'padding:5px 10px;border-radius:5px;background:rgba(20,14,10,.78);color:#fff;' +
      'font-size:14px;font-weight:700;white-space:nowrap;opacity:0;' +
      'transition:opacity .35s ease;';
    this.element.appendChild(this.nameLabel);

    this.slots = this.items.map((type, index) => {
      const data = BLOCK_DATA[type];
      const slot = document.createElement('div');
      slot.title = `${index + 1} — ${data.nom}`;
      slot.setAttribute('role', 'option');
      slot.style.cssText =
        'position:relative;width:50px;height:50px;box-sizing:border-box;' +
        'display:grid;place-items:center;border:2px solid rgba(255,255,255,.35);' +
        'background:rgba(28,24,21,.94);color:#fff;text-shadow:0 1px 2px #000;' +
        'font-size:11px;font-weight:800;transition:transform .14s ease,border .14s ease,' +
        'box-shadow .14s ease;transform-origin:center bottom;';

      slot._icon = createBlockIconCanvas(type);
      slot.appendChild(slot._icon);

      const number = document.createElement('span');
      number.textContent = String(index + 1);
      number.style.cssText =
        'position:absolute;left:3px;top:1px;z-index:2;padding:0 2px;' +
        'border-radius:2px;background:rgba(0,0,0,.45);';
      slot.appendChild(number);
      this.element.appendChild(slot);
      return slot;
    });

    container.appendChild(this.element);
    this.render();
  }

  get selectedIndex() {
    return this.index;
  }

  get selectedType() {
    return this.items[this.index];
  }

  select(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.items.length) return;
    this.index = index;
    this.render();
    this._showSelectedName();
  }

  scroll(delta) {
    if (delta === 0) return;
    const step = delta > 0 ? 1 : -1;
    this.index = (this.index + step + this.items.length) % this.items.length;
    this.render();
    this._showSelectedName();
  }

  assignSelected(type) {
    const data = BLOCK_DATA[type];
    if (!data?.placable) return false;
    this.items[this.index] = type;
    const slot = this.slots[this.index];
    const icon = createBlockIconCanvas(type);
    slot.replaceChild(icon, slot._icon);
    slot._icon = icon;
    slot.title = `${this.index + 1} — ${data.nom}`;
    this.render();
    this._showSelectedName();
    return true;
  }

  _showSelectedName() {
    this.nameLabel.textContent = BLOCK_DATA[this.selectedType].nom;
    this.nameLabel.style.opacity = '1';
    if (this._nameTimer !== null) clearTimeout(this._nameTimer);
    this._nameTimer = setTimeout(() => {
      this.nameLabel.style.opacity = '0';
      this._nameTimer = null;
    }, 1500);
  }

  render() {
    this.slots.forEach((slot, index) => {
      const selected = index === this.index;
      slot.style.borderWidth = selected ? '4px' : '2px';
      slot.style.borderColor = selected ? '#fff4b5' : 'rgba(255,255,255,.35)';
      slot.style.boxShadow = selected
        ? '0 0 0 2px #d99b2b,0 0 14px rgba(255,205,80,.9)'
        : 'none';
      slot.style.transform = selected ? 'translateY(-4px) scale(1.1)' : 'none';
      slot.style.zIndex = selected ? '2' : '0';
      slot.setAttribute('aria-selected', String(selected));
    });
  }
}
