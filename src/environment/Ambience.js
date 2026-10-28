import * as THREE from 'three';
import { BLOCK } from '../world/blocks.js';
import { BIOMES } from '../generation/biomes.js';

const STAR_COUNT = 420;
const CLOUD_CLUSTERS = 12;
const CLOUD_TILES = 6;
const DUST_COUNT = 48;
const SKY_DISTANCE = 180;
const TWILIGHT_ORANGE = new THREE.Color(0xf06432);
const TWILIGHT_PINK = new THREE.Color(0xff7890);
const TWILIGHT_VIOLET = new THREE.Color(0x6b3c8b);
const WARM_FOG = new THREE.Color(0xc79256);

const smoothstep = (edge0, edge1, value) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
const damp = (current, target, response, dt) =>
  current + (target - current) * (1 - Math.exp(-response * dt));

function installLeafWind(material, timeUniform) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAmbienceTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uAmbienceTime;
attribute float aBlockType;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
float afroLeaf = 1.0 - step(0.5, abs(aBlockType - ${BLOCK.FEUILLES.toFixed(1)}));
float afroWindA = sin(uAmbienceTime * 1.65 + position.x * 0.31 + position.z * 0.23 + position.y * 0.11);
float afroWindB = sin(uAmbienceTime * 0.73 - position.x * 0.17 + position.z * 0.37);
transformed.x += afroLeaf * (afroWindA * 0.045 + afroWindB * 0.020);
transformed.z += afroLeaf * (afroWindA * 0.025 - afroWindB * 0.018);`,
      );
  };
  material.customProgramCacheKey = () => 'afrocraft-leaf-wind-v1';
  material.needsUpdate = true;
}

function installWaterWaves(material, timeUniform) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAmbienceTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uAmbienceTime;
attribute float aWaveWeight;
float afroWaterHeight(vec3 p) {
  return 0.035 * sin(p.x * 0.75 + uAmbienceTime * 1.25)
       + 0.022 * sin(p.z * 1.05 - uAmbienceTime * 0.95);
}
vec2 afroWaterSlope(vec3 p) {
  return vec2(
    0.035 * 0.75 * cos(p.x * 0.75 + uAmbienceTime * 1.25),
    0.022 * 1.05 * cos(p.z * 1.05 - uAmbienceTime * 0.95)
  );
}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
if (normal.y > 0.5 && aWaveWeight > 0.5) {
  vec2 afroSlope = afroWaterSlope(position);
  objectNormal = normalize(vec3(-afroSlope.x, 1.0, -afroSlope.y));
}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
transformed.y += aWaveWeight * afroWaterHeight(position);`,
      );
  };
  material.customProgramCacheKey = () => 'afrocraft-water-waves-v1';
  material.needsUpdate = true;
}

/** Ambiance visuelle à coût fixe : ciel, astres, étoiles, nuages et poussière. */
export class Ambience {
  constructor(scene, camera, world, generator, dayNight, materials) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.generator = generator;
    this.dayNight = dayNight;
    this.elapsed = 0;
    this.timeUniform = { value: 0 };
    this._randomState = 0x91e10da5;
    this._direction = new THREE.Vector3();
    this._moonDirection = new THREE.Vector3();
    this._matrix = new THREE.Matrix4();
    this._position = new THREE.Vector3();
    this._scale = new THREE.Vector3();
    this._rotation = new THREE.Quaternion();
    this._sky = new THREE.Color();
    this._fogColor = new THREE.Color();
    this._sunColor = new THREE.Color();
    this._dustOpacity = 0;
    this._biomeTimer = 0;
    this._biome = null;
    this._isWarmBiome = false;

    installLeafWind(materials.opaque, this.timeUniform);
    installWaterWaves(materials.eau, this.timeUniform);

    this._createCelestialBodies();
    this._createStars();
    this._createClouds();
    this._createDust();
  }

  _random() {
    let value = this._randomState;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this._randomState = value >>> 0;
    return this._randomState / 0x100000000;
  }

  _createCelestialBodies() {
    const geometry = new THREE.CircleGeometry(6, 24);
    this.sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd25c,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    this.moonMaterial = new THREE.MeshBasicMaterial({
      color: 0xdbe7ff,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    this.sun = new THREE.Mesh(geometry, this.sunMaterial);
    this.moon = new THREE.Mesh(geometry, this.moonMaterial);
    this.sun.renderOrder = -2;
    this.moon.renderOrder = -2;
    this.scene.add(this.sun, this.moon);
  }

  _createStars() {
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let index = 0; index < STAR_COUNT; index++) {
      const angle = this._random() * Math.PI * 2;
      const y = 0.08 + this._random() * 0.92;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const offset = index * 3;
      positions[offset] = Math.cos(angle) * radius * SKY_DISTANCE;
      positions[offset + 1] = y * SKY_DISTANCE;
      positions[offset + 2] = Math.sin(angle) * radius * SKY_DISTANCE;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xfff5d6,
      size: 1.45,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.stars = new THREE.Points(geometry, this.starMaterial);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }

  _createClouds() {
    const count = CLOUD_CLUSTERS * CLOUD_TILES;
    const material = new THREE.MeshLambertMaterial({
      color: 0xfff1d6,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.clouds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, count);
    this.clouds.frustumCulled = false;

    let instance = 0;
    for (let cluster = 0; cluster < CLOUD_CLUSTERS; cluster++) {
      const centerX = (this._random() - 0.5) * 135;
      const centerZ = (this._random() - 0.5) * 135;
      const height = 44 + this._random() * 9;
      for (let tile = 0; tile < CLOUD_TILES; tile++) {
        this._position.set(
          centerX + (tile - 2.5) * 2.6 + (this._random() - 0.5) * 2,
          height + (this._random() - 0.5) * 0.7,
          centerZ + (this._random() - 0.5) * 5,
        );
        this._scale.set(
          3.2 + this._random() * 4.5,
          0.35 + this._random() * 0.35,
          2.3 + this._random() * 3.2,
        );
        this._matrix.compose(this._position, this._rotation, this._scale);
        this.clouds.setMatrixAt(instance++, this._matrix);
      }
    }
    this.clouds.instanceMatrix.needsUpdate = true;
    this.scene.add(this.clouds);
  }

  _createDust() {
    this.dustPositions = new Float32Array(DUST_COUNT * 3);
    this.dustBaseX = new Float32Array(DUST_COUNT);
    this.dustBaseY = new Float32Array(DUST_COUNT);
    this.dustBaseZ = new Float32Array(DUST_COUNT);
    this.dustSpeed = new Float32Array(DUST_COUNT);
    this.dustPhase = new Float32Array(DUST_COUNT);

    for (let index = 0; index < DUST_COUNT; index++) {
      this.dustBaseX[index] = (this._random() - 0.5) * 14;
      this.dustBaseY[index] = this._random() * 4.5;
      this.dustBaseZ[index] = (this._random() - 0.5) * 14;
      this.dustSpeed[index] = 0.35 + this._random() * 0.65;
      this.dustPhase[index] = this._random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    this.dustMaterial = new THREE.PointsMaterial({
      color: 0xffd36a,
      size: 0.09,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: true,
    });
    this.dust = new THREE.Points(geometry, this.dustMaterial);
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  update(dt, player) {
    const safeDt = Math.max(0, dt);
    this.elapsed += safeDt;
    this.timeUniform.value = this.elapsed;

    const angle = this.dayNight.phase * Math.PI * 2;
    const sunElevation = Math.cos(angle);
    this._updateBiome(safeDt, player);
    this._updateSky(sunElevation);
    this._updateCelestialBodies(angle, sunElevation);
    this._updateStars(sunElevation);
    this._updateClouds();
    this._updateDust(safeDt, sunElevation, player);
  }

  _updateBiome(dt, player) {
    this._biomeTimer -= dt;
    if (this._biomeTimer <= 0) {
      this._biomeTimer = 0.5;
      this._biome = this.generator.biomeAt(player.position.x, player.position.z);
      this._isWarmBiome = this._biome === BIOMES.SAVANE || this._biome === BIOMES.DESERT;
    }
  }

  _updateSky(sunElevation) {
    const horizon = Math.exp(-Math.abs(sunElevation) * 5);
    this._sky.copy(this.scene.background);
    this._sky.lerp(TWILIGHT_VIOLET, horizon * 0.46);
    this._sky.lerp(TWILIGHT_PINK, horizon * 0.48);
    this._sky.lerp(TWILIGHT_ORANGE, horizon * 0.58);
    this.scene.background.copy(this._sky);

    if (this.scene.fog) {
      const warmDust = this._isWarmBiome ? Math.max(0, sunElevation) * 0.2 + horizon * 0.12 : 0;
      this._fogColor.copy(this._sky).lerp(WARM_FOG, warmDust);
      this.scene.fog.color.copy(this._fogColor);
    }
  }

  _updateCelestialBodies(angle, sunElevation) {
    this._direction.set(Math.sin(angle), Math.cos(angle), -0.28).normalize();
    this._moonDirection.copy(this._direction).multiplyScalar(-1);

    const horizon = Math.exp(-Math.abs(sunElevation) * 5);
    this.sun.position.copy(this.camera.position).addScaledVector(this._direction, SKY_DISTANCE);
    this.moon.position.copy(this.camera.position).addScaledVector(this._moonDirection, SKY_DISTANCE);
    this.sun.lookAt(this.camera.position);
    this.moon.lookAt(this.camera.position);

    this.sunMaterial.opacity = smoothstep(-0.1, 0.12, sunElevation);
    this.moonMaterial.opacity = smoothstep(-0.1, 0.12, -sunElevation);
    this._sunColor.set(0xfff4c6).lerp(TWILIGHT_ORANGE, horizon * 0.9);
    this.sunMaterial.color.copy(this._sunColor);
    this.sun.scale.setScalar(1 + horizon * 1.5);
    this.moon.scale.setScalar(0.82 + horizon * 0.25);
    this.sun.visible = this.sunMaterial.opacity > 0.01;
    this.moon.visible = this.moonMaterial.opacity > 0.01;
  }

  _updateStars(sunElevation) {
    this.stars.position.copy(this.camera.position);
    this.starMaterial.opacity = smoothstep(0.02, 0.38, -sunElevation) * 0.98;
    this.stars.visible = this.starMaterial.opacity > 0.005;
  }

  _updateClouds() {
    this.clouds.position.x = this.camera.position.x + Math.sin(this.elapsed * 0.035) * 18;
    this.clouds.position.z = this.camera.position.z;
  }

  _updateDust(dt, sunElevation, player) {
    const targetOpacity = this._biome === BIOMES.SAVANE
      ? smoothstep(0.08, 0.45, sunElevation) * 0.55
      : 0;
    this._dustOpacity = damp(this._dustOpacity, targetOpacity, 3, dt);
    this.dustMaterial.opacity = this._dustOpacity;
    this.dust.visible = this._dustOpacity > 0.004;
    this.dust.position.set(
      player.position.x - this.world.sizeX / 2,
      player.position.y + 0.3,
      player.position.z - this.world.sizeZ / 2,
    );

    if (!this.dust.visible) return;
    for (let index = 0; index < DUST_COUNT; index++) {
      const offset = index * 3;
      const phase = this.dustPhase[index];
      const speed = this.dustSpeed[index];
      this.dustPositions[offset] = this.dustBaseX[index] + Math.sin(this.elapsed * speed + phase) * 0.18;
      this.dustPositions[offset + 1] = (this.dustBaseY[index] + this.elapsed * speed * 0.22) % 4.5;
      this.dustPositions[offset + 2] = this.dustBaseZ[index] + Math.cos(this.elapsed * speed * 0.8 + phase) * 0.18;
    }
    this.dust.geometry.getAttribute('position').needsUpdate = true;
  }
}
