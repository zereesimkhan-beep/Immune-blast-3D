import Matter from 'matter-js';
import { soundEngine } from '../audio/soundEngine';
import {
  BlockType,
  GamePlayStatus,
  HudSnapshot,
  LevelBlockDef,
  LevelConfig,
  ProjectileType,
  UpgradeLevels,
  WinGoalType,
} from '../types/game';

export const WORLD_WIDTH = 420;
export const WORLD_HEIGHT = 740;
export const PLATFORM_Y = 468;
export const PLATFORM_HEIGHT = 18;
export const PLATFORM_TOP_Y = PLATFORM_Y - PLATFORM_HEIGHT / 2;
export const CANNON_X = WORLD_WIDTH / 2;
export const CANNON_Y = 648;
export const MAX_PULL_DISTANCE = 105;
export const MIN_PULL_DISTANCE = 18;

const CAT_PLATFORM = 0x0001;
const CAT_BLOCK = 0x0002;
const CAT_PROJECTILE = 0x0004;

export interface BlockEntity {
  id: number;
  body: Matter.Body;
  blockType: BlockType;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  weakened: boolean; // Marked by Vaccine bio-aura: breaks from a light tap
  shattered: boolean;
  droppedOff: boolean;
}

export interface ProjectileEntity {
  id: number;
  body: Matter.Body;
  ammoType: ProjectileType;
  radius: number;
  hasClearedPlatform: boolean;
  hasTriggeredAbility: boolean;
  hasSplit: boolean;
  spawnTime: number;
  trail: Array<{ x: number; y: number }>;
  prevVelocity: { x: number; y: number };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  color: string;
  kind: 'gel' | 'spark' | 'smoke' | 'ring';
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface WorldCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onVictory: (stars: number, score: number, movesLeft: number) => void;
  onDefeat: (score: number) => void;
  onBlockCleared: (blockType: BlockType) => void;
  onVaccineUsed: () => void;
  onAntibioticBlast: () => void;
  onShotFired: () => void;
  onHapticImpact: (heavy: boolean) => void;
}

const BLOCK_PROPS: Record<
  BlockType,
  { hp: number; density: number; friction: number; restitution: number; score: number }
> = {
  virus: { hp: 18, density: 0.0009, friction: 0.52, restitution: 0.14, score: 90 },
  bacteria: { hp: 54, density: 0.0013, friction: 0.56, restitution: 0.12, score: 120 },
  fungus: { hp: 175, density: 0.0031, friction: 0.72, restitution: 0.06, score: 190 },
  resistant: { hp: 82, density: 0.0017, friction: 0.62, restitution: 0.1, score: 220 },
  target: { hp: 46, density: 0.0014, friction: 0.55, restitution: 0.14, score: 350 },
};

const AMMO_PROPS: Record<
  ProjectileType,
  { radius: number; density: number; restitution: number }
> = {
  antibody: { radius: 13, density: 0.0065, restitution: 0.42 },
  vaccine: { radius: 13, density: 0.0055, restitution: 0.3 },
  antibiotic: { radius: 14, density: 0.006, restitution: 0.24 },
  antiviral: { radius: 12, density: 0.0078, restitution: 0.22 },
  tcell: { radius: 13, density: 0.0056, restitution: 0.38 },
  antiseptic: { radius: 16, density: 0.0075, restitution: 0.2 },
};

/**
 * Computes projectile-vs-microbe effectiveness multiplier so every immune tool
 * has distinct strengths and weaknesses.
 */
function getEffectivenessMultiplier(ammo: ProjectileType, block: BlockType): number {
  if (ammo === 'antiseptic') {
    return block === 'resistant' ? 1.45 : 1.9;
  }
  if (ammo === 'antibody') {
    return block === 'resistant' ? 1.35 : 1.0;
  }
  if (ammo === 'vaccine') {
    return 0.75; // Main power is its area weakening aura
  }
  if (ammo === 'antibiotic') {
    if (block === 'bacteria') return 2.1;
    if (block === 'resistant') return 0.18; // Antibiotic-resistant bacteria!
    if (block === 'virus') return 0.65;
    return 1.0;
  }
  if (ammo === 'antiviral') {
    if (block === 'virus') return 2.6;
    if (block === 'target') return 1.25;
    if (block === 'fungus') return 0.55;
    return 0.85;
  }
  // tcell
  if (block === 'resistant') return 1.65;
  if (block === 'target') return 1.3;
  return 1.05;
}

export class ImmunePhysicsWorld {
  public engine: Matter.Engine;
  public platform: Matter.Body;
  public platformX: number;
  public platformWidth: number;
  public blocks: BlockEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public level: LevelConfig;
  public upgrades: UpgradeLevels;
  public cameraShakeEnabled: boolean;

  public movesLeft: number;
  public score = 0;
  public status: GamePlayStatus = 'aiming';
  public shakeIntensity = 0;
  public cannonRecoil = 0;
  public cannonAngle = 0;
  public infectionClearedBanner = false;
  public aimAssistActive = false;

  private callbacks: WorldCallbacks;
  private nextEntityId = 1;
  private slowMoTimer = 0;
  private settleElapsed = 0;
  private goalCurrent = 0;
  private goalTarget = 1;
  private initialTargets = 0;
  private blockByBodyId = new Map<number, BlockEntity>();
  private projByBodyId = new Map<number, ProjectileEntity>();

  constructor(
    level: LevelConfig,
    upgrades: UpgradeLevels,
    cameraShakeEnabled: boolean,
    callbacks: WorldCallbacks
  ) {
    this.level = level;
    this.upgrades = upgrades;
    this.cameraShakeEnabled = cameraShakeEnabled;
    this.callbacks = callbacks;
    this.movesLeft = level.moves;
    this.platformX = WORLD_WIDTH / 2 + (level.platformOffsetX ?? 0);
    this.platformWidth = level.platformWidth;

    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.0, scale: 0.001 },
      positionIterations: 8,
      velocityIterations: 6,
    });

    // Swinging Petri dish platform hinged at center tripod
    this.platform = Matter.Bodies.rectangle(
      this.platformX,
      PLATFORM_Y,
      this.platformWidth,
      PLATFORM_HEIGHT,
      {
        density: 0.008,
        friction: 0.72,
        frictionStatic: 0.9,
        restitution: 0.1,
        frictionAir: 0.025,
        label: 'petri_dish',
        collisionFilter: {
          category: CAT_PLATFORM,
          mask: CAT_BLOCK | CAT_PROJECTILE,
        },
      }
    );

    const standPin = Matter.Constraint.create({
      pointA: { x: this.platformX, y: PLATFORM_Y },
      bodyB: this.platform,
      pointB: { x: 0, y: 0 },
      stiffness: 1,
      length: 0,
    });

    Matter.World.add(this.engine.world, [this.platform, standPin]);

    this.spawnLevelBlocks(level.blocks);
    this.setupCollisionHandler();
    this.initGoalMetrics();
    this.emitHud();
  }

  private spawnLevelBlocks(defs: LevelBlockDef[]): void {
    for (const def of defs) {
      const props = BLOCK_PROPS[def.type];
      const worldX = this.platformX + def.x;
      const worldY = PLATFORM_TOP_Y - def.y;

      const body = Matter.Bodies.rectangle(worldX, worldY, def.w, def.h, {
        density: props.density,
        friction: props.friction,
        frictionStatic: 0.72,
        restitution: props.restitution,
        frictionAir: 0.012,
        angle: def.angleDeg ? (def.angleDeg * Math.PI) / 180 : 0,
        label: `microbe:${def.type}`,
        collisionFilter: {
          category: CAT_BLOCK,
          mask: CAT_PLATFORM | CAT_BLOCK | CAT_PROJECTILE,
        },
      });

      const entity: BlockEntity = {
        id: this.nextEntityId++,
        body,
        blockType: def.type,
        w: def.w,
        h: def.h,
        hp: props.hp,
        maxHp: props.hp,
        weakened: false,
        shattered: false,
        droppedOff: false,
      };

      this.blocks.push(entity);
      this.blockByBodyId.set(body.id, entity);
      Matter.World.add(this.engine.world, body);
    }
  }

  private initGoalMetrics(): void {
    if (this.level.goal.type === 'destroy_targets') {
      this.initialTargets = this.blocks.filter((b) => b.blockType === 'target').length;
      this.goalTarget = Math.max(1, this.initialTargets);
      this.goalCurrent = 0;
    } else if (this.level.goal.type === 'drop_blocks') {
      this.goalTarget = this.level.goal.targetValue ?? 5;
      this.goalCurrent = 0;
    } else {
      this.goalTarget = this.level.goal.targetValue ?? 110;
      this.goalCurrent = this.measureTowerHeight();
    }
  }

  private setupCollisionHandler(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;
        const blockA = this.blockByBodyId.get(bodyA.id);
        const blockB = this.blockByBodyId.get(bodyB.id);
        const projA = this.projByBodyId.get(bodyA.id);
        const projB = this.projByBodyId.get(bodyB.id);

        if (projA && !projB) {
          this.handleProjectileImpact(projA, blockB, bodyB);
        } else if (projB && !projA) {
          this.handleProjectileImpact(projB, blockA, bodyA);
        } else if (blockA && blockB) {
          this.handleBlockCollision(blockA, blockB);
        } else if ((blockA && bodyB === this.platform) || (blockB && bodyA === this.platform)) {
          const blk = blockA ?? blockB;
          if (blk) {
            const speed = Matter.Vector.magnitude(blk.body.velocity);
            if (speed > 4.4 || (blk.weakened && speed > 1.8)) {
              this.applyDamageToBlock(blk, (speed - 2.4) * 6.5, 'antibody', false);
            }
          }
        }
      }
    });
  }

  private handleProjectileImpact(
    proj: ProjectileEntity,
    hitBlock: BlockEntity | undefined,
    otherBody: Matter.Body
  ): void {
    if (!proj.hasClearedPlatform && otherBody === this.platform) {
      return;
    }

    if (hitBlock) {
      proj.hasClearedPlatform = true;
      proj.body.collisionFilter.mask = CAT_PLATFORM | CAT_BLOCK | CAT_PROJECTILE;
    }

    // Antiseptic Bomb triggers massive sanitizing shockwave on first impact
    if (proj.ammoType === 'antiseptic' && !proj.hasTriggeredAbility) {
      this.triggerAntisepticBlast(proj);
      return;
    }

    // Antibiotic triggers radial blast on first strong impact
    if (proj.ammoType === 'antibiotic' && !proj.hasTriggeredAbility) {
      this.triggerAntibioticBlast(proj);
      return;
    }

    // Vaccine triggers weakening bio-aura on first impact
    if (proj.ammoType === 'vaccine' && !proj.hasTriggeredAbility) {
      this.triggerVaccineAura(proj);
    }

    if (!hitBlock) return;

    const relVel = Matter.Vector.sub(proj.prevVelocity, hitBlock.body.velocity);
    const impactSpeed = Matter.Vector.magnitude(relVel);
    const mult = getEffectivenessMultiplier(proj.ammoType, hitBlock.blockType);
    const damage = impactSpeed * 6.0 * mult;

    if (damage >= 6 || hitBlock.weakened) {
      this.addCameraShake(Math.min(7, impactSpeed * 0.42));
      this.callbacks.onHapticImpact(impactSpeed > 9);

      if (hitBlock.blockType === 'resistant' && proj.ammoType === 'antibiotic') {
        soundEngine.playResistantClang();
      }

      const cleared = this.applyDamageToBlock(
        hitBlock,
        hitBlock.weakened ? Math.max(damage, hitBlock.hp + 5) : damage,
        proj.ammoType,
        true
      );

      // Antiviral pierces straight through shattered virus blocks
      if (
        proj.ammoType === 'antiviral' &&
        cleared &&
        hitBlock.blockType === 'virus' &&
        Matter.Vector.magnitude(proj.prevVelocity) > 4.0
      ) {
        Matter.Body.setVelocity(proj.body, {
          x: proj.prevVelocity.x * 0.88,
          y: proj.prevVelocity.y * 0.88,
        });
      }
    }
  }

  private handleBlockCollision(a: BlockEntity, b: BlockEntity): void {
    const relVel = Matter.Vector.sub(a.body.velocity, b.body.velocity);
    const speed = Matter.Vector.magnitude(relVel);
    if (speed < 1.6) return;

    // Weakened blocks shatter from even a gentle tap!
    if (a.weakened && speed >= 1.6) {
      this.applyDamageToBlock(a, a.hp + 10, 'vaccine', false);
    } else if (speed >= 3.3) {
      this.applyDamageToBlock(a, (speed - 2.5) * 5.2, 'antibody', false);
    }

    if (b.weakened && speed >= 1.6) {
      this.applyDamageToBlock(b, b.hp + 10, 'vaccine', false);
    } else if (speed >= 3.3) {
      this.applyDamageToBlock(b, (speed - 2.5) * 5.2, 'antibody', false);
    }
  }

  private triggerVaccineAura(proj: ProjectileEntity): void {
    proj.hasTriggeredAbility = true;
    const pos = proj.body.position;
    const radius = 105 + this.upgrades.bioRadius * 24;

    soundEngine.playVaccineAura();
    this.callbacks.onVaccineUsed();

    this.particles.push({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      size: radius,
      rotation: 0,
      vRot: 0,
      life: 0,
      maxLife: 0.45,
      color: '#2dd4bf',
      kind: 'ring',
    });

    for (let i = 0; i < 16; i++) {
      const ang = (Math.PI * 2 * i) / 16;
      const spd = 2 + Math.random() * 3.5;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        size: 4 + Math.random() * 3,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: 0.5,
        color: '#5eead4',
        kind: 'spark',
      });
    }

    for (const blk of this.blocks) {
      if (blk.shattered || blk.droppedOff) continue;
      const dist = Matter.Vector.magnitude(Matter.Vector.sub(blk.body.position, pos));
      if (dist <= radius) {
        blk.weakened = true;
        blk.hp = Math.min(blk.hp, 12);
        this.floatingTexts.push({
          x: blk.body.position.x,
          y: blk.body.position.y - 16,
          vy: -0.75,
          text: '⚡',
          color: '#2dd4bf',
          life: 0,
          maxLife: 0.65,
        });
      }
    }
  }

  private triggerAntibioticBlast(proj: ProjectileEntity): void {
    proj.hasTriggeredAbility = true;
    const pos = proj.body.position;
    const radius = 98 + this.upgrades.bioRadius * 24;
    const maxForce = 0.085 + this.upgrades.launcherPower * 0.012 + this.upgrades.bioRadius * 0.01;

    soundEngine.playAntibioticBlast();
    this.addCameraShake(12);
    this.triggerSlowMotion(0.42);
    this.callbacks.onHapticImpact(true);
    this.callbacks.onAntibioticBlast();

    this.particles.push({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      size: radius,
      rotation: 0,
      vRot: 0,
      life: 0,
      maxLife: 0.36,
      color: '#38bdf8',
      kind: 'ring',
    });

    for (let i = 0; i < 22; i++) {
      const ang = (Math.PI * 2 * i) / 22 + Math.random() * 0.25;
      const spd = 2.5 + Math.random() * 6.0;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.0,
        size: 3.5 + Math.random() * 4.5,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.28,
        color: i % 2 === 0 ? '#7dd3fc' : '#facc15',
        kind: 'spark',
      });
    }

    const snapshotBlocks = [...this.blocks];
    for (const blk of snapshotBlocks) {
      if (blk.shattered || blk.droppedOff) continue;
      const delta = Matter.Vector.sub(blk.body.position, pos);
      const dist = Matter.Vector.magnitude(delta);
      if (dist > radius) continue;

      const falloff = Math.max(0.2, 1 - dist / radius);
      const dir = dist > 1 ? Matter.Vector.normalise(delta) : { x: 0, y: -1 };
      const resistanceScale = blk.blockType === 'resistant' ? 0.35 : 1.0;

      Matter.Body.applyForce(blk.body, blk.body.position, {
        x: dir.x * maxForce * falloff * resistanceScale,
        y: (dir.y - 0.32) * maxForce * falloff * resistanceScale,
      });

      const mult = getEffectivenessMultiplier('antibiotic', blk.blockType);
      this.applyDamageToBlock(blk, 68 * falloff * mult, 'antibiotic', true);
    }

    // Push Petri dish gently from shockwave
    const platDist = Matter.Vector.magnitude(Matter.Vector.sub(this.platform.position, pos));
    if (platDist < radius * 1.15) {
      const offsetX = pos.x - this.platformX;
      Matter.Body.setAngularVelocity(
        this.platform,
        this.platform.angularVelocity + offsetX * 0.00042
      );
    }

    Matter.World.remove(this.engine.world, proj.body);
    this.projByBodyId.delete(proj.body.id);
    this.projectiles = this.projectiles.filter((p) => p.id !== proj.id);
  }

  private triggerAntisepticBlast(proj: ProjectileEntity): void {
    proj.hasTriggeredAbility = true;
    const pos = proj.body.position;
    const radius = 148 + this.upgrades.bioRadius * 24;
    const maxForce = 0.12 + this.upgrades.launcherPower * 0.015;

    soundEngine.playAntisepticBlast();
    this.addCameraShake(14);
    this.triggerSlowMotion(0.55);
    this.callbacks.onHapticImpact(true);

    this.particles.push(
      {
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        size: radius,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: 0.42,
        color: '#10b981',
        kind: 'ring',
      },
      {
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        size: radius * 0.72,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: 0.34,
        color: '#67e8f9',
        kind: 'ring',
      }
    );

    for (let i = 0; i < 28; i++) {
      const ang = (Math.PI * 2 * i) / 28 + Math.random() * 0.2;
      const spd = 2.8 + Math.random() * 6.5;
      this.particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        size: 4 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        color: i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? '#34d399' : '#67e8f9',
        kind: 'spark',
      });
    }

    const snapshotBlocks = [...this.blocks];
    for (const blk of snapshotBlocks) {
      if (blk.shattered || blk.droppedOff) continue;
      const delta = Matter.Vector.sub(blk.body.position, pos);
      const dist = Matter.Vector.magnitude(delta);
      if (dist > radius) continue;

      const falloff = Math.max(0.28, 1 - dist / radius);
      const dir = dist > 1 ? Matter.Vector.normalise(delta) : { x: 0, y: -1 };

      Matter.Body.applyForce(blk.body, blk.body.position, {
        x: dir.x * maxForce * falloff,
        y: (dir.y - 0.35) * maxForce * falloff,
      });

      this.applyDamageToBlock(blk, 102 * falloff, 'antiseptic', true);
    }

    const platDist = Matter.Vector.magnitude(Matter.Vector.sub(this.platform.position, pos));
    if (platDist < radius * 1.2) {
      const offsetX = pos.x - this.platformX;
      Matter.Body.setAngularVelocity(
        this.platform,
        this.platform.angularVelocity + offsetX * 0.0005
      );
    }

    Matter.World.remove(this.engine.world, proj.body);
    this.projByBodyId.delete(proj.body.id);
    this.projectiles = this.projectiles.filter((p) => p.id !== proj.id);
  }

  private applyDamageToBlock(
    blk: BlockEntity,
    damage: number,
    sourceAmmo: ProjectileType,
    direct: boolean
  ): boolean {
    if (blk.shattered || blk.droppedOff || damage <= 0) return false;

    blk.hp -= damage;

    if (blk.hp <= 0) {
      this.clearMicrobeBlock(blk);
      return true;
    }

    if (direct || damage > 15) {
      if (blk.blockType === 'resistant' && sourceAmmo === 'antibiotic') {
        soundEngine.playResistantClang();
        this.floatingTexts.push({
          x: blk.body.position.x,
          y: blk.body.position.y - 12,
          vy: -0.9,
          text: '🛡',
          color: '#fde047',
          life: 0,
          maxLife: 0.55,
        });
      } else {
        soundEngine.playMicrobeSquish();
      }
      this.spawnGelSplashes(blk.body.position.x, blk.body.position.y, blk.blockType, 5);
    }
    return false;
  }

  private clearMicrobeBlock(blk: BlockEntity): void {
    if (blk.shattered) return;
    blk.shattered = true;

    const pos = blk.body.position;
    const pts = BLOCK_PROPS[blk.blockType].score;
    this.score += pts;

    if (blk.blockType === 'target') {
      soundEngine.playTargetCleared();
      this.triggerSlowMotion(0.65);
      this.addCameraShake(9);
      this.spawnGelSplashes(pos.x, pos.y, 'target', 18);
    } else {
      soundEngine.playMicrobePop();
      if (blk.blockType === 'fungus') this.addCameraShake(5);
      this.spawnGelSplashes(pos.x, pos.y, blk.blockType, 12);
    }

    this.floatingTexts.push({
      x: pos.x,
      y: pos.y - 8,
      vy: -1.1,
      text: `+${pts}`,
      color: blk.blockType === 'target' ? '#fde047' : '#ffffff',
      life: 0,
      maxLife: 0.75,
    });

    Matter.World.remove(this.engine.world, blk.body);
    this.blockByBodyId.delete(blk.body.id);
    this.callbacks.onBlockCleared(blk.blockType);
  }

  private spawnGelSplashes(x: number, y: number, blockType: BlockType, count: number): void {
    const palette: Record<BlockType, string[]> = {
      virus: ['#fb7185', '#f43f5e', '#fda4af'],
      bacteria: ['#4ade80', '#22c55e', '#bbf7d0'],
      fungus: ['#c084fc', '#a855f7', '#e9d5ff'],
      resistant: ['#38bdf8', '#facc15', '#7dd3fc'],
      target: ['#fde047', '#f59e0b', '#fef08a'],
    };
    const colors = palette[blockType];

    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 4.2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.4,
        size: 4 + Math.random() * 5,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
        color: colors[i % colors.length],
        kind: blockType === 'target' && i % 2 === 0 ? 'spark' : 'gel',
      });
    }
  }

  public addCameraShake(amount: number): void {
    if (!this.cameraShakeEnabled) return;
    this.shakeIntensity = Math.min(15, Math.max(this.shakeIntensity, amount));
  }

  public triggerSlowMotion(durationSec: number): void {
    this.slowMoTimer = Math.max(this.slowMoTimer, durationSec);
  }

  public computeLaunchVelocity(pullDx: number, pullDy: number): { vx: number; vy: number; powerRatio: number } {
    const dist = Math.hypot(pullDx, pullDy);
    const clampedDist = Math.min(MAX_PULL_DISTANCE, dist);
    const powerRatio = Math.max(
      0,
      (clampedDist - MIN_PULL_DISTANCE) / (MAX_PULL_DISTANCE - MIN_PULL_DISTANCE)
    );

    let dirX = dist > 0.001 ? -pullDx / dist : 0;
    let dirY = dist > 0.001 ? -pullDy / dist : -1;

    if (dirY > -0.22) {
      dirY = -0.22;
      const len = Math.hypot(dirX, dirY);
      dirX /= len;
      dirY /= len;
    }

    const powerBonus = 1 + this.upgrades.launcherPower * 0.07;
    const maxSpeed = 18.8 * powerBonus;
    const minSpeed = 7.2 * powerBonus;
    const speed = minSpeed + powerRatio * (maxSpeed - minSpeed);

    return {
      vx: dirX * speed,
      vy: dirY * speed,
      powerRatio,
    };
  }

  public predictTrajectory(
    pullDx: number,
    pullDy: number,
    ammoType: ProjectileType
  ): Array<{ x: number; y: number }> {
    const { vx: initVx, vy: initVy, powerRatio } = this.computeLaunchVelocity(pullDx, pullDy);
    if (powerRatio <= 0.01) return [];

    const barrelAngle = Math.atan2(initVx, -initVy);
    const muzzleDist = 36;
    let x = CANNON_X + Math.sin(barrelAngle) * muzzleDist;
    let y = CANNON_Y - Math.cos(barrelAngle) * muzzleDist;
    let vx = initVx;
    let vy = initVy;

    const dt = 1000 / 60;
    const gravY = this.engine.gravity.y * this.engine.gravity.scale * dt * dt;
    const airDrag = 1 - (ammoType === 'antiviral' ? 0.004 : 0.006);

    const maxSteps = this.aimAssistActive ? 56 : 22 + this.upgrades.aimGuide * 10;
    const points: Array<{ x: number; y: number }> = [];

    for (let step = 0; step < maxSteps; step++) {
      vx *= airDrag;
      vy = vy * airDrag + gravY;
      x += vx;
      y += vy;
      if (step % 2 === 0) points.push({ x, y });
      if (y > WORLD_HEIGHT - 20 || x < -20 || x > WORLD_WIDTH + 20) break;
    }
    return points;
  }

  public fireProjectile(pullDx: number, pullDy: number, ammoType: ProjectileType): boolean {
    if (this.status !== 'aiming' || this.movesLeft <= 0) return false;

    const { vx, vy, powerRatio } = this.computeLaunchVelocity(pullDx, pullDy);
    if (powerRatio <= 0.01) return false;

    const barrelAngle = Math.atan2(vx, -vy);
    this.cannonAngle = barrelAngle;
    this.cannonRecoil = 1.0;

    const props = AMMO_PROPS[ammoType];
    const muzzleDist = 36;
    const spawnX = CANNON_X + Math.sin(barrelAngle) * muzzleDist;
    const spawnY = CANNON_Y - Math.cos(barrelAngle) * muzzleDist;

    const body = Matter.Bodies.circle(spawnX, spawnY, props.radius, {
      density: props.density,
      restitution: props.restitution,
      friction: 0.35,
      frictionAir: ammoType === 'antiviral' ? 0.004 : 0.006,
      label: `immune:${ammoType}`,
      collisionFilter: {
        category: CAT_PROJECTILE,
        mask: CAT_BLOCK | CAT_PROJECTILE,
      },
    });

    Matter.Body.setVelocity(body, { x: vx, y: vy });

    const proj: ProjectileEntity = {
      id: this.nextEntityId++,
      body,
      ammoType,
      radius: props.radius,
      hasClearedPlatform: false,
      hasTriggeredAbility: false,
      hasSplit: false,
      spawnTime: performance.now(),
      trail: [],
      prevVelocity: { x: vx, y: vy },
    };

    this.projectiles.push(proj);
    this.projByBodyId.set(body.id, proj);
    Matter.World.add(this.engine.world, body);

    this.movesLeft -= 1;
    this.status = 'flying';
    this.settleElapsed = 0;

    soundEngine.playLauncherFire();
    this.addCameraShake(4.5);
    this.callbacks.onShotFired();

    for (let i = 0; i < 9; i++) {
      const spread = barrelAngle + (Math.random() - 0.5) * 0.7;
      const spd = 1.6 + Math.random() * 3.2;
      this.particles.push({
        x: spawnX,
        y: spawnY,
        vx: Math.sin(spread) * spd,
        vy: -Math.cos(spread) * spd,
        size: 5 + Math.random() * 5,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: 0.32 + Math.random() * 0.18,
        color: i % 2 === 0 ? '#e0f2fe' : '#bae6fd',
        kind: 'smoke',
      });
    }

    this.emitHud();
    return true;
  }

  public canSplitActiveProjectile(): boolean {
    if (this.status !== 'flying') return false;
    return this.projectiles.some((p) => p.ammoType === 'tcell' && !p.hasSplit);
  }

  public splitActiveProjectile(): boolean {
    const target = this.projectiles.find((p) => p.ammoType === 'tcell' && !p.hasSplit);
    if (!target) return false;

    target.hasSplit = true;
    soundEngine.playSplit();

    const pos = target.body.position;
    const vel = target.body.velocity;
    const speed = Math.max(6, Matter.Vector.magnitude(vel));
    const baseAngle = Math.atan2(vel.y, vel.x);

    Matter.Body.setVelocity(target.body, {
      x: Math.cos(baseAngle) * speed * 1.05,
      y: Math.sin(baseAngle) * speed * 1.05,
    });

    for (const off of [-0.26, 0.26]) {
      const ang = baseAngle + off;
      const shardBody = Matter.Bodies.circle(
        pos.x + Math.cos(ang) * 14,
        pos.y + Math.sin(ang) * 14,
        10,
        {
          density: 0.005,
          restitution: 0.4,
          friction: 0.35,
          frictionAir: 0.006,
          label: 'immune:tcell_shard',
          collisionFilter: {
            category: CAT_PROJECTILE,
            mask: target.hasClearedPlatform
              ? CAT_PLATFORM | CAT_BLOCK | CAT_PROJECTILE
              : CAT_BLOCK | CAT_PROJECTILE,
          },
        }
      );
      const vx = Math.cos(ang) * speed * 1.08;
      const vy = Math.sin(ang) * speed * 1.08;
      Matter.Body.setVelocity(shardBody, { x: vx, y: vy });

      const shard: ProjectileEntity = {
        id: this.nextEntityId++,
        body: shardBody,
        ammoType: 'tcell',
        radius: 10,
        hasClearedPlatform: target.hasClearedPlatform,
        hasTriggeredAbility: false,
        hasSplit: true,
        spawnTime: performance.now(),
        trail: [],
        prevVelocity: { x: vx, y: vy },
      };

      this.projectiles.push(shard);
      this.projByBodyId.set(shardBody.id, shard);
      Matter.World.add(this.engine.world, shardBody);
    }

    this.spawnGelSplashes(pos.x, pos.y, 'resistant', 8);
    this.emitHud();
    return true;
  }

  public addExtraMoves(count: number): void {
    this.movesLeft += count;
    if (this.status === 'lost') {
      this.status = 'aiming';
    }
    this.emitHud();
  }

  public step(realDtSec: number): void {
    const clampedDt = Math.min(0.033, realDtSec);

    if (this.slowMoTimer > 0) {
      this.slowMoTimer = Math.max(0, this.slowMoTimer - clampedDt);
      this.engine.timing.timeScale = 0.34;
    } else {
      this.engine.timing.timeScale = 1.0;
    }

    this.shakeIntensity *= Math.pow(0.03, clampedDt);
    if (this.shakeIntensity < 0.15) this.shakeIntensity = 0;
    this.cannonRecoil = Math.max(0, this.cannonRecoil - clampedDt * 4.5);

    for (const p of this.projectiles) {
      p.prevVelocity = { x: p.body.velocity.x, y: p.body.velocity.y };
    }

    this.updatePlatformBalance();
    Matter.Engine.update(this.engine, 1000 / 60);

    this.updateProjectiles();
    this.updateBlocksOffPlatform();
    this.updateParticles(clampedDt);
    this.evaluateGameState(clampedDt);

    this.emitHud();
  }

  private updatePlatformBalance(): void {
    const angle = this.platform.angle;
    const maxAngle = 0.72;
    const stiffness = this.level.platformStiffness;

    const nextAngVel =
      this.platform.angularVelocity - angle * stiffness - this.platform.angularVelocity * 0.12;
    Matter.Body.setAngularVelocity(this.platform, nextAngVel);

    if (angle > maxAngle) {
      Matter.Body.setAngle(this.platform, maxAngle);
      if (this.platform.angularVelocity > 0) Matter.Body.setAngularVelocity(this.platform, 0);
    } else if (angle < -maxAngle) {
      Matter.Body.setAngle(this.platform, -maxAngle);
      if (this.platform.angularVelocity < 0) Matter.Body.setAngularVelocity(this.platform, 0);
    }
  }

  private updateProjectiles(): void {
    const toRemove: ProjectileEntity[] = [];

    for (const p of this.projectiles) {
      const { x, y } = p.body.position;

      if (!p.hasClearedPlatform && y < PLATFORM_TOP_Y - p.radius - 4) {
        p.hasClearedPlatform = true;
        p.body.collisionFilter.mask = CAT_PLATFORM | CAT_BLOCK | CAT_PROJECTILE;
      }

      p.trail.push({ x, y });
      if (p.trail.length > 14) p.trail.shift();

      const speed = Matter.Vector.magnitude(p.body.velocity);
      const age = performance.now() - p.spawnTime;

      if (
        y > WORLD_HEIGHT + 40 ||
        x < -60 ||
        x > WORLD_WIDTH + 60 ||
        (age > 4500 && speed < 0.35) ||
        age > 8000
      ) {
        toRemove.push(p);
      }
    }

    for (const p of toRemove) {
      Matter.World.remove(this.engine.world, p.body);
      this.projByBodyId.delete(p.body.id);
    }
    if (toRemove.length > 0) {
      const removedIds = new Set(toRemove.map((r) => r.id));
      this.projectiles = this.projectiles.filter((p) => !removedIds.has(p.id));
    }
  }

  private updateBlocksOffPlatform(): void {
    for (const blk of this.blocks) {
      if (blk.shattered || blk.droppedOff) continue;
      const { x, y } = blk.body.position;

      if (y > PLATFORM_Y + 95 || x < -25 || x > WORLD_WIDTH + 25 || y > WORLD_HEIGHT + 30) {
        blk.droppedOff = true;
        const pts = BLOCK_PROPS[blk.blockType].score;
        this.score += pts;

        if (blk.blockType === 'target') {
          soundEngine.playTargetCleared();
          this.triggerSlowMotion(0.5);
        }
        this.callbacks.onBlockCleared(blk.blockType);

        this.floatingTexts.push({
          x: Math.max(36, Math.min(WORLD_WIDTH - 36, x)),
          y: Math.min(WORLD_HEIGHT - 80, Math.max(90, y - 16)),
          vy: -1.0,
          text: `+${pts}`,
          color: blk.blockType === 'target' ? '#fde047' : '#ffffff',
          life: 0,
          maxLife: 0.7,
        });

        Matter.World.remove(this.engine.world, blk.body);
        this.blockByBodyId.delete(blk.body.id);
      }
    }
  }

  private updateParticles(dt: number): void {
    for (const pt of this.particles) {
      pt.life += dt;
      if (pt.kind !== 'ring') {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.16;
        pt.rotation += pt.vRot;
      }
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    for (const ft of this.floatingTexts) {
      ft.life += dt;
      ft.y += ft.vy;
    }
    this.floatingTexts = this.floatingTexts.filter((f) => f.life < f.maxLife);
  }

  private measureTowerHeight(): number {
    let minY = PLATFORM_TOP_Y;
    for (const blk of this.blocks) {
      if (blk.shattered || blk.droppedOff) continue;
      if (blk.body.bounds.min.y < minY) minY = blk.body.bounds.min.y;
    }
    return Math.max(0, Math.round(PLATFORM_TOP_Y - minY));
  }

  private isWorldSettled(): boolean {
    if (this.projectiles.length > 0) return false;
    if (Math.abs(this.platform.angularVelocity) > 0.025) return false;
    for (const blk of this.blocks) {
      if (blk.shattered || blk.droppedOff) continue;
      if (Matter.Vector.magnitude(blk.body.velocity) > 0.42) return false;
    }
    return true;
  }

  private evaluateGoalProgress(): boolean {
    const goalType = this.level.goal.type;

    if (goalType === 'destroy_targets') {
      const remaining = this.blocks.filter(
        (b) => b.blockType === 'target' && !b.shattered && !b.droppedOff
      ).length;
      this.goalCurrent = this.initialTargets - remaining;
      return remaining === 0;
    }

    if (goalType === 'drop_blocks') {
      const totalRemoved = this.blocks.filter((b) => b.shattered || b.droppedOff).length;
      this.goalCurrent = Math.min(this.goalTarget, totalRemoved);
      return totalRemoved >= this.goalTarget;
    }

    const currentHeight = this.measureTowerHeight();
    this.goalCurrent = currentHeight;
    return currentHeight <= this.goalTarget;
  }

  private evaluateGameState(dt: number): void {
    if (this.status === 'won' || this.status === 'lost') return;

    const goalMet = this.evaluateGoalProgress();
    if (goalMet) {
      this.infectionClearedBanner = true;
    }

    if (this.status === 'flying') {
      if (this.projectiles.length === 0) {
        this.status = 'settling';
        this.settleElapsed = 0;
      }
      return;
    }

    if (this.status === 'settling') {
      this.settleElapsed += dt;
      const settled = this.isWorldSettled() || this.settleElapsed > 2.2;

      if (goalMet && (settled || this.level.goal.type !== 'collapse_below' || this.settleElapsed > 0.75)) {
        this.triggerVictory();
        return;
      }

      if (settled) {
        if (this.movesLeft <= 0) {
          this.status = 'lost';
          soundEngine.playDefeat();
          this.callbacks.onDefeat(this.score);
        } else {
          this.status = 'aiming';
        }
      }
      return;
    }

    if (this.status === 'aiming' && goalMet && this.isWorldSettled()) {
      this.triggerVictory();
    }
  }

  private triggerVictory(): void {
    if (this.status === 'won') return;
    this.status = 'won';
    this.infectionClearedBanner = true;

    this.score += this.movesLeft * 250;

    let stars = 1;
    if (this.movesLeft >= 2 || (this.level.moves <= 3 && this.movesLeft >= 1)) {
      stars = 3;
    } else if (this.movesLeft >= 1) {
      stars = 2;
    }

    soundEngine.playVictory();
    this.callbacks.onVictory(stars, this.score, this.movesLeft);
  }

  public getGoalType(): WinGoalType {
    return this.level.goal.type;
  }

  public getHudSnapshot(): HudSnapshot {
    return {
      movesLeft: this.movesLeft,
      totalMoves: this.level.moves,
      score: this.score,
      goalType: this.level.goal.type,
      goalCurrent: this.goalCurrent,
      goalTarget: this.goalTarget,
      status: this.status,
      canSplitMidAir: this.canSplitActiveProjectile(),
      isSlowMotion: this.slowMoTimer > 0,
      infectionClearedBanner: this.infectionClearedBanner,
    };
  }

  private emitHud(): void {
    this.callbacks.onHudUpdate(this.getHudSnapshot());
  }

  public destroy(): void {
    Matter.Events.off(this.engine, 'collisionStart');
    Matter.World.clear(this.engine.world, false);
    Matter.Engine.clear(this.engine);
  }
}
