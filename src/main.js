// Point d'entrée AfroCraft : monde voxel, interface et états titre/jeu/pause.
import * as THREE from 'three';
import { World } from './world/World.js';
import { ChunkRenderer } from './rendering/ChunkRenderer.js';
import { Player } from './player/Player.js';
import { WorldGenerator } from './generation/WorldGenerator.js';
import { PointerLock } from './interaction/PointerLock.js';
import { Prompt } from './ui/Prompt.js';
import { TitleScreen } from './ui/TitleScreen.js';
import { PauseScreen } from './ui/PauseScreen.js';
import { Hotbar } from './ui/Hotbar.js';
import { BlockSelector } from './ui/BlockSelector.js';
import { PerformanceHud } from './ui/PerformanceHud.js';
import { ControlsHelp } from './ui/ControlsHelp.js';
import { Interaction } from './interaction/Interaction.js';
import { Highlight, createReticle } from './rendering/highlight.js';
import { ThirdPersonCamera } from './player/ThirdPersonCamera.js';
import { PlayerModel } from './rendering/PlayerModel.js';
import { DayNightCycle } from './environment/DayNightCycle.js';
import { Ambience } from './environment/Ambience.js';
import { Effects } from './effects/Effects.js';

const STATE = Object.freeze({ LOADING: 'loading', TITLE: 'title', PLAYING: 'playing', PAUSED: 'paused' });

const afterTitlePaint = () => new Promise((resolve) => {
  requestAnimationFrame(() => setTimeout(resolve, 0));
});

export function createRenderer(container) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (err) {
    showWebGLError(container);
    throw new Error(`Contexte WebGL indisponible : ${err.message}`);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  return renderer;
}

export function showWebGLError(container) {
  const msg = document.createElement('div');
  msg.className = 'afro-frame';
  msg.style.cssText =
    'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;' +
    'color:#fff4d0;font:700 18px \'Noto Sans\',sans-serif;text-align:center;padding:2rem;z-index:70;';
  msg.textContent = 'AfroCraft nécessite un navigateur récent compatible WebGL (Chrome ou Firefox à jour).';
  container.appendChild(msg);
}

export async function init(container) {
  const renderer = createRenderer(container);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(scene.background.clone(), 30, 70);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.rotation.order = 'YXZ';

  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(sun);
  const dayNight = new DayNightCycle(scene, ambient, sun);

  const titleScreen = new TitleScreen(container);
  const pauseScreen = new PauseScreen(container);
  let state = STATE.LOADING;

  // Rend l'écran-titre avant le travail CPU de génération et meshing.
  await afterTitlePaint();
  titleScreen.setLoading('Génération des terres de latérite…');
  const world = new World();
  const generator = new WorldGenerator(31);
  generator.generate(world);

  titleScreen.setLoading('Sculpture des paysages…');
  const chunkRenderer = new ChunkRenderer(scene, world);
  chunkRenderer.buildAllChunks();

  const spawn = generator.spawnPoint(world);
  const player = new Player(camera, world, spawn);
  const viewCamera = new ThirdPersonCamera(camera, world);
  const playerModel = new PlayerModel(scene, world);
  const ambience = new Ambience(scene, camera, world, generator, dayNight, chunkRenderer.materials);

  const pointerLock = new PointerLock(renderer.domElement);
  const prompt = new Prompt(container);
  prompt.hide();
  const hotbar = new Hotbar(container);
  const blockSelector = new BlockSelector(container, hotbar);
  const performanceHud = new PerformanceHud(container);
  const controlsHelp = new ControlsHelp(container);
  const interaction = new Interaction(world, player, hotbar, chunkRenderer, pointerLock);
  interaction.highlight = new Highlight(scene, world.sizeX / 2, world.sizeZ / 2);
  const effects = new Effects(scene, world, camera, viewCamera, playerModel, interaction.highlight, player);
  interaction.effects = effects;
  const reticle = createReticle(container);
  reticle.hide();
  const keys = new Set();

  const clearGameplayInput = () => {
    keys.clear();
    reticle.hide();
    interaction.highlight?.set(null);
  };

  const startPlaying = () => {
    if (state !== STATE.TITLE && state !== STATE.PAUSED) return;
    state = STATE.PLAYING;
    titleScreen.hide();
    pauseScreen.hide();
    if (blockSelector.isOpen) blockSelector.close();
    prompt.show();
    pointerLock.request();
  };

  const pauseGame = () => {
    if (state !== STATE.PLAYING) return;
    state = STATE.PAUSED;
    clearGameplayInput();
    prompt.hide();
    pointerLock.release();
    pauseScreen.show();
  };

  titleScreen.onPlay(startPlaying);
  pauseScreen.onResume(startPlaying);

  pointerLock.onChange((locked) => {
    if (state !== STATE.PLAYING || blockSelector.isOpen) {
      prompt.hide();
      reticle.hide();
      return;
    }
    if (locked) {
      prompt.hide();
      reticle.show();
    } else {
      reticle.hide();
      prompt.show();
    }
  });

  renderer.domElement.addEventListener('contextmenu', (event) => event.preventDefault());
  renderer.domElement.addEventListener('mousedown', (event) => {
    if (state !== STATE.PLAYING || blockSelector.isOpen) return;
    if (!pointerLock.isLocked) {
      pointerLock.request();
      return;
    }
    if (event.button === 0) {
      effects.triggerBreakAction();
      interaction.breakBlock();
    } else if (event.button === 2) {
      effects.triggerPlaceAction();
      interaction.placeBlock();
    }
  });
  prompt.el.addEventListener('mousedown', () => {
    if (state === STATE.PLAYING && !blockSelector.isOpen) pointerLock.request();
  });

  blockSelector.onChange((open) => {
    if (open) {
      clearGameplayInput();
      prompt.hide();
      pointerLock.release();
    } else if (state === STATE.PLAYING && !pointerLock.isLocked) {
      prompt.show();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (state === STATE.LOADING || state === STATE.TITLE) {
      event.preventDefault();
      return;
    }

    if (state === STATE.PAUSED) {
      event.preventDefault();
      if (event.code === 'Escape' && !event.repeat) startPlaying();
      return;
    }

    if (blockSelector.isOpen) {
      event.preventDefault();
      if ((event.code === 'KeyE' || event.code === 'Escape') && !event.repeat) blockSelector.close();
      const selectorHotbarKey = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
      if (selectorHotbarKey) hotbar.select(Number(selectorHotbarKey[1]) - 1);
      return;
    }

    if (event.code === 'KeyE') {
      event.preventDefault();
      if (!event.repeat) blockSelector.open();
      return;
    }

    if (event.code === 'Escape') {
      event.preventDefault();
      pauseGame();
      return;
    }

    if (event.code === 'F5') {
      event.preventDefault();
      if (!event.repeat) {
        viewCamera.toggle();
        playerModel.setVisible(viewCamera.isThirdPerson);
      }
      return;
    }

    const hotbarKey = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
    if (hotbarKey) hotbar.select(Number(hotbarKey[1]) - 1);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  renderer.domElement.addEventListener('wheel', (event) => {
    if (state !== STATE.PLAYING || blockSelector.isOpen) return;
    event.preventDefault();
    hotbar.scroll(event.deltaY);
  }, { passive: false });

  window.addEventListener('mousemove', (event) => {
    if (state === STATE.PLAYING && pointerLock.isLocked) {
      player.onMouseMove(event.movementX, event.movementY);
    }
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  viewCamera.update(player);
  playerModel.update(player, viewCamera.isThirdPerson);
  titleScreen.setReady();
  state = STATE.TITLE;

  const clock = new THREE.Clock();
  function loop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (state === STATE.PLAYING) {
      player.update(dt, { keys });
      viewCamera.update(player);
      playerModel.update(player, viewCamera.isThirdPerson, dt);
      interaction.update();
      effects.update(dt, player);
      dayNight.update(dt);
      ambience.update(dt, player);

      const rebuildStart = performance.now();
      const rebuiltChunks = chunkRenderer.rebuildDirtyChunks();
      performanceHud.setRebuild(performance.now() - rebuildStart, rebuiltChunks);
      performanceHud.updateFrame(dt);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    renderer, scene, camera, world, chunkRenderer, player, pointerLock, interaction,
    hotbar, blockSelector, performanceHud, controlsHelp, effects, viewCamera,
    playerModel, dayNight, ambience, titleScreen, pauseScreen,
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void init(document.getElementById('app') ?? document.body).catch((error) => {
    showWebGLError(document.getElementById('app') ?? document.body);
    console.error(error);
  });
}
