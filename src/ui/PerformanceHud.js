/** Lightweight FPS and chunk-rebuild performance overlay. */
export class PerformanceHud {
  /** @param {HTMLElement} container */
  constructor(container) {
    this.element = document.createElement('div');
    this.element.style.cssText =
      'position:fixed;left:10px;top:10px;z-index:8;padding:7px 9px;' +
      'background:rgba(0,0,0,.58);color:#fff;border-radius:5px;' +
      'font:12px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;' +
      'pointer-events:none;white-space:pre;';
    container.appendChild(this.element);

    this.frames = 0;
    this.elapsed = 0;
    this.fps = 0;
    this.rebuildMs = 0;
    this.rebuiltChunks = 0;
    this._render();
  }

  updateFrame(dt) {
    this.frames += 1;
    this.elapsed += dt;
    if (this.elapsed >= 0.5) {
      this.fps = Math.round(this.frames / this.elapsed);
      this.frames = 0;
      this.elapsed = 0;
      this._render();
    }
  }

  setRebuild(durationMs, rebuiltChunks) {
    if (rebuiltChunks === 0) return;
    this.rebuildMs = durationMs;
    this.rebuiltChunks = rebuiltChunks;
    this._render();
  }

  _render() {
    const fps = this.fps || '--';
    const rebuild = this.rebuiltChunks
      ? `${this.rebuildMs.toFixed(2)} ms (${this.rebuiltChunks} chunk${this.rebuiltChunks > 1 ? 's' : ''})`
      : '--';
    this.element.textContent = `FPS: ${fps}\nRebuild: ${rebuild}`;
    this.element.style.color = this.fps > 0 && this.fps < 30 ? '#ff8a80' : '#ffffff';
  }
}
