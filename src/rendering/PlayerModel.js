import * as THREE from 'three';

const MAX_WALK_SWING = THREE.MathUtils.degToRad(40);
const MAX_HEAD_PITCH = THREE.MathUtils.degToRad(45);
const MAX_GROUND_SPEED = 5;
const POSE_RESPONSE = 11;
const TURN_RESPONSE = 8;
const BREATH_FREQUENCY = 1.6;
const BREATH_AMPLITUDE = 0.015;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const damp = (current, target, response, dt) =>
  current + (target - current) * (1 - Math.exp(-response * dt));
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

/** Modèle voxel articulé et animé du joueur. */
export class PlayerModel {
  constructor(scene, world) {
    this.world = world;
    this.group = new THREE.Group();
    this.group.name = 'playerModel';

    // Pivot de rotation du personnage, séparé de la translation monde.
    this.bodyYawPivot = new THREE.Group();
    this.bodyYawPivot.name = 'bodyYawPivot';
    this.group.add(this.bodyYawPivot);

    // Le haut du corps respire sans déplacer les pieds.
    this.upperBodyPivot = new THREE.Group();
    this.upperBodyPivot.name = 'upperBodyPivot';
    this.bodyYawPivot.add(this.upperBodyPivot);

    const skin = new THREE.MeshLambertMaterial({ color: 0x6f3d24 });
    const shirt = new THREE.MeshLambertMaterial({ color: 0xd99b2b });
    const trousers = new THREE.MeshLambertMaterial({ color: 0x4b2f6b });
    const faceMaterial = new THREE.MeshLambertMaterial({ color: 0x2b1a12 });

    this.body = this._addCube(
      this.upperBodyPivot,
      'body',
      [0.55, 0.7, 0.3],
      [0, 0.95, 0],
      shirt,
    );

    // Cou : la tête pivote depuis sa base, pas depuis son centre.
    this.headPivot = this._addPivot(this.upperBodyPivot, 'headPivot', [0, 1.3, 0]);
    this.head = this._addCube(this.headPivot, 'head', [0.5, 0.5, 0.5], [0, 0.25, 0], skin);
    this.face = this._addCube(
      this.headPivot,
      'face',
      [0.28, 0.12, 0.03],
      [0, 0.28, -0.265],
      faceMaterial,
    );

    // Épaules : les cubes des bras sont décalés vers le bas du pivot.
    this.leftArmPivot = this._addPivot(
      this.upperBodyPivot,
      'leftArmPivot',
      [-0.39, 1.3, 0],
    );
    this.rightArmPivot = this._addPivot(
      this.upperBodyPivot,
      'rightArmPivot',
      [0.39, 1.3, 0],
    );
    this.leftArm = this._addCube(
      this.leftArmPivot,
      'leftArm',
      [0.2, 0.7, 0.24],
      [0, -0.35, 0],
      skin,
    );
    this.rightArm = this._addCube(
      this.rightArmPivot,
      'rightArm',
      [0.2, 0.7, 0.24],
      [0, -0.35, 0],
      skin,
    );

    // Hanches : les cubes des jambes sont décalés vers le bas du pivot.
    this.leftLegPivot = this._addPivot(this.bodyYawPivot, 'leftLegPivot', [-0.15, 0.65, 0]);
    this.rightLegPivot = this._addPivot(this.bodyYawPivot, 'rightLegPivot', [0.15, 0.65, 0]);
    this.leftLeg = this._addCube(
      this.leftLegPivot,
      'leftLeg',
      [0.23, 0.65, 0.26],
      [0, -0.325, 0],
      trousers,
    );
    this.rightLeg = this._addCube(
      this.rightLegPivot,
      'rightLeg',
      [0.23, 0.65, 0.26],
      [0, -0.325, 0],
      trousers,
    );

    this.elapsed = 0;
    this.walkPhase = 0;
    this.swimPhase = 0;
    this.bodyYaw = 0;
    this.initialized = false;

    scene.add(this.group);
  }

  _addPivot(parent, name, position) {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(...position);
    parent.add(pivot);
    return pivot;
  }

  _addCube(parent, name, size, position, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name;
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  /**
   * Met à jour pose et orientation à partir du seul état du joueur et de dt.
   * @param {import('../player/Player.js').Player} player
   * @param {boolean} visible
   * @param {number} dt secondes écoulées depuis la frame précédente
   */
  update(player, visible = true, dt = 0) {
    const safeDt = Math.max(0, dt);
    this.group.visible = visible;
    this.group.position.set(
      player.position.x - this.world.sizeX / 2,
      player.position.y,
      player.position.z - this.world.sizeZ / 2,
    );

    const horizontalSpeed = Math.hypot(player.velocity.x, player.velocity.z);
    if (!this.initialized) {
      this.bodyYaw = player.yaw;
      this.initialized = true;
    }

    // Le corps vise la direction réelle de déplacement, avec interpolation
    // angulaire courte pour éviter les rotations instantanées.
    if (horizontalSpeed > 0.03) {
      const movementYaw = Math.atan2(-player.velocity.x, -player.velocity.z);
      const turnAlpha = 1 - Math.exp(-TURN_RESPONSE * safeDt);
      this.bodyYaw += angleDelta(this.bodyYaw, movementYaw) * turnAlpha;
    }
    this.bodyYawPivot.rotation.y = this.bodyYaw;

    this.elapsed += safeDt;
    let leftArmX = 0;
    let rightArmX = 0;
    let leftLegX = 0;
    let rightLegX = 0;
    let leftArmZ = 0;
    let rightArmZ = 0;

    if (player.inWater) {
      // Nage plus lente que la marche, bras alternés et léger battement de jambes.
      this.swimPhase += (1.5 + horizontalSpeed * 0.3) * safeDt;
      const stroke = Math.sin(this.swimPhase);
      leftArmX = 0.9 + stroke * 0.75;
      rightArmX = 0.9 - stroke * 0.75;
      leftArmZ = -0.18;
      rightArmZ = 0.18;
      leftLegX = -stroke * 0.2;
      rightLegX = stroke * 0.2;
    } else if (!player.onGround) {
      // Pose aérienne : bras écartés et jambes légèrement fléchies.
      leftArmX = -0.25;
      rightArmX = -0.25;
      leftArmZ = -0.35;
      rightArmZ = 0.35;
      leftLegX = 0.22;
      rightLegX = -0.16;
    } else if (horizontalSpeed > 0.03) {
      // La phase suit la distance parcourue, l'amplitude suit la vitesse.
      const walkWeight = clamp01(horizontalSpeed / MAX_GROUND_SPEED);
      this.walkPhase += horizontalSpeed * 2.6 * safeDt;
      const swing = Math.sin(this.walkPhase) * MAX_WALK_SWING * walkWeight;
      leftLegX = swing;
      rightLegX = -swing;
      leftArmX = -swing;
      rightArmX = swing;
    }

    this.leftArmPivot.rotation.x = damp(
      this.leftArmPivot.rotation.x,
      leftArmX,
      POSE_RESPONSE,
      safeDt,
    );
    this.rightArmPivot.rotation.x = damp(
      this.rightArmPivot.rotation.x,
      rightArmX,
      POSE_RESPONSE,
      safeDt,
    );
    this.leftLegPivot.rotation.x = damp(
      this.leftLegPivot.rotation.x,
      leftLegX,
      POSE_RESPONSE,
      safeDt,
    );
    this.rightLegPivot.rotation.x = damp(
      this.rightLegPivot.rotation.x,
      rightLegX,
      POSE_RESPONSE,
      safeDt,
    );
    this.leftArmPivot.rotation.z = damp(
      this.leftArmPivot.rotation.z,
      leftArmZ,
      POSE_RESPONSE,
      safeDt,
    );
    this.rightArmPivot.rotation.z = damp(
      this.rightArmPivot.rotation.z,
      rightArmZ,
      POSE_RESPONSE,
      safeDt,
    );

    const headTarget = THREE.MathUtils.clamp(player.pitch, -MAX_HEAD_PITCH, MAX_HEAD_PITCH);
    this.headPivot.rotation.x = damp(
      this.headPivot.rotation.x,
      headTarget,
      POSE_RESPONSE,
      safeDt,
    );

    const idle = player.onGround && !player.inWater && horizontalSpeed <= 0.03;
    const breathTarget = idle
      ? Math.sin(this.elapsed * BREATH_FREQUENCY) * BREATH_AMPLITUDE
      : 0;
    this.upperBodyPivot.position.y = damp(
      this.upperBodyPivot.position.y,
      breathTarget,
      5,
      safeDt,
    );
  }
}
