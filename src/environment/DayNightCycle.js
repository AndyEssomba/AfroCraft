import * as THREE from 'three';

const DAY_SKY = new THREE.Color(0x78b9e1);
const NIGHT_SKY = new THREE.Color(0x060d30);
const DAY_AMBIENT = 0.65;
const NIGHT_AMBIENT = 0.24;
const DAY_LIGHT = new THREE.Color(0xfff1c9);
const HORIZON_LIGHT = new THREE.Color(0xff8a4c);
const NIGHT_LIGHT = new THREE.Color(0x7a8dcc);

/** Cycle continu jour/nuit pilotant lumière et ciel de base. */
export class DayNightCycle {
  constructor(scene, ambientLight, sunLight, { cycleSeconds = 600 } = {}) {
    this.scene = scene;
    this.ambientLight = ambientLight;
    this.sunLight = sunLight;
    this.cycleSeconds = cycleSeconds;
    this.elapsed = 0;
    this.sunElevation = 1;
    this.daylight = 1;
    this._sky = new THREE.Color();
    this._lightColor = new THREE.Color();
    this._ambientColor = new THREE.Color();
    this.update(0);
  }

  get phase() {
    return this.elapsed / this.cycleSeconds;
  }

  get intensity() {
    return NIGHT_AMBIENT + (DAY_AMBIENT - NIGHT_AMBIENT) * this.daylight;
  }

  update(dt) {
    this.elapsed = (this.elapsed + Math.max(0, dt)) % this.cycleSeconds;
    const angle = this.phase * Math.PI * 2;
    this.sunElevation = Math.cos(angle);
    this.daylight = (this.sunElevation + 1) * 0.5;
    const horizon = Math.exp(-Math.abs(this.sunElevation) * 6);

    this.ambientLight.intensity = this.intensity;
    this.sunLight.intensity = 0.06 + this.daylight * 0.94;
    this._lightColor.copy(NIGHT_LIGHT).lerp(DAY_LIGHT, this.daylight);
    this._lightColor.lerp(HORIZON_LIGHT, horizon * 0.72);
    this.sunLight.color.copy(this._lightColor);
    this._ambientColor.copy(this._lightColor).lerp(DAY_LIGHT, 0.35);
    this.ambientLight.color.copy(this._ambientColor);
    this.sunLight.position.set(Math.sin(angle) * 80, this.sunElevation * 80, 25);

    this._sky.copy(NIGHT_SKY).lerp(DAY_SKY, this.daylight);
    if (this.scene.background?.isColor) this.scene.background.copy(this._sky);
    else this.scene.background = this._sky.clone();
    if (this.scene.fog) this.scene.fog.color.copy(this._sky);
  }
}
