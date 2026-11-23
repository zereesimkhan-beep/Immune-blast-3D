import {
  BlockEntity,
  CANNON_X,
  CANNON_Y,
  ImmunePhysicsWorld,
  PLATFORM_HEIGHT,
  PLATFORM_TOP_Y,
  PLATFORM_Y,
  ProjectileEntity,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../physics/immuneWorld';
import { LauncherSkinId, OrganZone, ProjectileType } from '../types/game';

export interface AimVisualState {
  isAiming: boolean;
  pullDx: number;
  pullDy: number;
  selectedAmmo: ProjectileType;
  trajectory: Array<{ x: number; y: number }>;
  aimAssistActive?: boolean;
}

const ZONE_BG: Record<OrganZone, { top: string; mid: string; bot: string; accent: string }> = {
  skin: { top: '#e0f2fe', mid: '#bae6fd', bot: '#fce7f3', accent: 'rgba(244, 114, 182, 0.16)' },
  throat: { top: '#ede9fe', mid: '#dbeafe', bot: '#ccfbf1', accent: 'rgba(139, 92, 246, 0.14)' },
  lungs: { top: '#cffafe', mid: '#e0f2fe', bot: '#d1fae5', accent: 'rgba(14, 165, 233, 0.15)' },
  gut: { top: '#d1fae5', mid: '#ecfeff', bot: '#fef3c7', accent: 'rgba(16, 185, 129, 0.14)' },
  blood: { top: '#ffe4e6', mid: '#fce7f3', bot: '#e0f2fe', accent: 'rgba(244, 63, 94, 0.14)' },
  lymph: { top: '#ecfdf5', mid: '#cffafe', bot: '#e0e7ff', accent: 'rgba(20, 184, 166, 0.16)' },
};

/**
 * Renders the Immune Blast scene onto a 2D Canvas (420 x 740 logical coords).
 */
export function renderGameScene(
  ctx: CanvasRenderingContext2D,
  world: ImmunePhysicsWorld,
  aim: AimVisualState,
  elapsedSec: number,
  skin: LauncherSkinId = 'syringe'
): void {
  ctx.save();

  if (world.shakeIntensity > 0.2) {
    const sx = (Math.random() - 0.5) * world.shakeIntensity * 1.5;
    const sy = (Math.random() - 0.5) * world.shakeIntensity * 1.5;
    ctx.translate(sx, sy);
  }

  // 1. Friendly stylized internal body / lab background
  drawBioEnvironment(ctx, world.level.organZone, elapsedSec);

  // 2. Target height line for collapse_below
  if (world.level.goal.type === 'collapse_below') {
    const targetY = PLATFORM_TOP_Y - (world.level.goal.targetValue ?? 110);
    drawCollapseTargetLine(ctx, targetY, elapsedSec);
  }

  // 3. Tripod Stand & Swinging Petri Dish
  drawLabStandAndPetriDish(ctx, world);

  // 4. Microbe Tower Blocks
  for (const blk of world.blocks) {
    if (blk.shattered || blk.droppedOff) continue;
    drawMicrobeBlock(ctx, blk, elapsedSec);
  }

  // 5. Dotted Aim Trajectory
  if (aim.isAiming && aim.trajectory.length > 0) {
    drawTrajectory(ctx, aim.trajectory, aim.selectedAmmo, Boolean(aim.aimAssistActive));
  }

  // 6. Active Immune Projectiles
  for (const proj of world.projectiles) {
    drawProjectile(ctx, proj);
  }

  // 7. Launcher Skin (Syringe, Immune Cell, or Microscope) with Red Cross Emblem
  drawLauncher(ctx, world, aim, skin, elapsedSec);

  // 8. Gel Splashes, Bio-Rings, Sparks & Score Popups
  drawParticles(ctx, world);

  // 9. Slow-motion bright pulse
  if (world.engine.timing.timeScale < 0.8) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  ctx.restore();
}

function drawBioEnvironment(
  ctx: CanvasRenderingContext2D,
  zone: OrganZone,
  t: number
): void {
  const palette = ZONE_BG[zone];
  const grad = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  grad.addColorStop(0, palette.top);
  grad.addColorStop(0.55, palette.mid);
  grad.addColorStop(1, palette.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(-20, -20, WORLD_WIDTH + 40, WORLD_HEIGHT + 40);

  // Flowing vessel arcs
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 28;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-30, 175);
  ctx.quadraticCurveTo(150, 120, 450, 210);
  ctx.stroke();

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.moveTo(-20, 495);
  ctx.quadraticCurveTo(210, 430, 450, 515);
  ctx.stroke();
  ctx.restore();

  // Gentle floating stylized cell circles
  const cells = [
    { x: 64, y: 120, r: 22, speed: 0.7 },
    { x: 356, y: 165, r: 26, speed: 0.5 },
    { x: 54, y: 390, r: 18, speed: 0.9 },
    { x: 372, y: 420, r: 20, speed: 0.6 },
  ];
  for (const c of cells) {
    const dy = Math.sin(t * c.speed + c.x) * 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y + dy, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(c.x, c.y + dy, c.r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clean laboratory floor platform at bottom
  const floorGrad = ctx.createLinearGradient(0, 610, 0, WORLD_HEIGHT);
  floorGrad.addColorStop(0, '#bae6fd');
  floorGrad.addColorStop(0.25, '#7dd3fc');
  floorGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(-20, 622);
  ctx.quadraticCurveTo(WORLD_WIDTH / 2, 598, WORLD_WIDTH + 20, 622);
  ctx.lineTo(WORLD_WIDTH + 20, WORLD_HEIGHT + 20);
  ctx.lineTo(-20, WORLD_HEIGHT + 20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-20, 622);
  ctx.quadraticCurveTo(WORLD_WIDTH / 2, 598, WORLD_WIDTH + 20, 622);
  ctx.stroke();
}

function drawCollapseTargetLine(
  ctx: CanvasRenderingContext2D,
  targetY: number,
  t: number
): void {
  ctx.save();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -t * 18;
  ctx.beginPath();
  ctx.moveTo(24, targetY);
  ctx.lineTo(WORLD_WIDTH - 24, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#0d9488';
  ctx.beginPath();
  ctx.moveTo(16, targetY - 6);
  ctx.lineTo(27, targetY);
  ctx.lineTo(16, targetY + 6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(WORLD_WIDTH - 16, targetY - 6);
  ctx.lineTo(WORLD_WIDTH - 27, targetY);
  ctx.lineTo(WORLD_WIDTH - 16, targetY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLabStandAndPetriDish(
  ctx: CanvasRenderingContext2D,
  world: ImmunePhysicsWorld
): void {
  const px = world.platformX;
  const py = PLATFORM_Y;

  // Lab tripod stand supporting the Petri dish
  ctx.save();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px - 8, py + 12);
  ctx.lineTo(px - 36, 616);
  ctx.moveTo(px + 8, py + 12);
  ctx.lineTo(px + 36, 616);
  ctx.stroke();

  // Central metal column
  const colGrad = ctx.createLinearGradient(px - 10, py, px + 10, py);
  colGrad.addColorStop(0, '#94a3b8');
  colGrad.addColorStop(0.5, '#e2e8f0');
  colGrad.addColorStop(1, '#64748b');
  ctx.fillStyle = colGrad;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, px - 10, py + 4, 20, 146, 5);
  ctx.fill();
  ctx.stroke();

  // Blue clamp collar at pivot
  ctx.fillStyle = '#0ea5e9';
  ctx.strokeStyle = '#0369a1';
  ctx.beginPath();
  ctx.arc(px, py + 3, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Swinging Petri Dish Plank
  ctx.save();
  ctx.translate(world.platform.position.x, world.platform.position.y);
  ctx.rotate(world.platform.angle);

  const hw = world.platformWidth / 2;
  const hh = PLATFORM_HEIGHT / 2;

  // Translucent glass Petri dish body with pale agar medium
  const dishGrad = ctx.createLinearGradient(0, -hh, 0, hh);
  dishGrad.addColorStop(0, '#ecfeff');
  dishGrad.addColorStop(0.35, '#a5f3fc');
  dishGrad.addColorStop(1, '#22d3ee');

  ctx.fillStyle = dishGrad;
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  roundRectPath(ctx, -hw, -hh, world.platformWidth, PLATFORM_HEIGHT, 7);
  ctx.fill();
  ctx.stroke();

  // Soft mint agar gel strip inside dish
  ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
  roundRectPath(ctx, -hw + 6, -hh + 3, world.platformWidth - 12, 6, 3);
  ctx.fill();

  // Left & Right curved glass rim lips
  ctx.fillStyle = '#e0f2fe';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  roundRectPath(ctx, -hw - 3, -hh - 6, 10, PLATFORM_HEIGHT + 6, 4);
  ctx.fill();
  ctx.stroke();
  roundRectPath(ctx, hw - 7, -hh - 6, 10, PLATFORM_HEIGHT + 6, 4);
  ctx.fill();
  ctx.stroke();

  // Center pivot bolt
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMicrobeBlock(
  ctx: CanvasRenderingContext2D,
  blk: BlockEntity,
  t: number
): void {
  ctx.save();
  ctx.translate(blk.body.position.x, blk.body.position.y);
  ctx.rotate(blk.body.angle);

  const hw = blk.w / 2;
  const hh = blk.h / 2;
  const hpRatio = Math.max(0, blk.hp / blk.maxHp);

  // Vaccine weakened aura ring
  if (blk.weakened) {
    const pulse = 0.55 + 0.3 * Math.sin(t * 9);
    ctx.strokeStyle = `rgba(20, 184, 166, ${pulse})`;
    ctx.lineWidth = 4;
    roundRectPath(ctx, -hw - 4, -hh - 4, blk.w + 8, blk.h + 8, 9);
    ctx.stroke();
  }

  if (blk.blockType === 'virus') {
    // Spiky cartoon virus block
    ctx.fillStyle = '#e11d48';
    const spikes = 8;
    for (let i = 0; i < spikes; i++) {
      const ang = (i * Math.PI * 2) / spikes;
      const sx = Math.cos(ang) * (hw * 0.92);
      const sy = Math.sin(ang) * (hh * 0.92);
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#fda4af');
    grad.addColorStop(0.5, '#fb7185');
    grad.addColorStop(1, '#e11d48');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 2.4;
    roundRectPath(ctx, -hw, -hh, blk.w, blk.h, 11);
    ctx.fill();
    ctx.stroke();

    drawCartoonFace(ctx, 0, 0, Math.min(blk.w, blk.h) * 0.34, 'goofy');
  } else if (blk.blockType === 'bacteria') {
    // Rod-shaped green cartoon bacterium
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#bbf7d0');
    grad.addColorStop(0.5, '#4ade80');
    grad.addColorStop(1, '#16a34a');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2.4;
    roundRectPath(ctx, -hw, -hh, blk.w, blk.h, 9);
    ctx.fill();
    ctx.stroke();

    // Cute spots
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.beginPath();
    ctx.arc(-hw * 0.55, -hh * 0.45, 3, 0, Math.PI * 2);
    ctx.arc(hw * 0.55, hh * 0.45, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (blk.h >= 24) {
      drawCartoonFace(ctx, 0, 0, Math.min(blk.w, blk.h) * 0.32, 'happy');
    }
  } else if (blk.blockType === 'fungus') {
    // Heavy purple mold/fungus cluster
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#d8b4fe');
    grad.addColorStop(0.55, '#a855f7');
    grad.addColorStop(1, '#6b21a8');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 2.6;
    roundRectPath(ctx, -hw, -hh, blk.w, blk.h, 8);
    ctx.fill();
    ctx.stroke();

    // Spore bumps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.arc(-hw * 0.48, -hh * 0.35, 4.5, 0, Math.PI * 2);
    ctx.arc(hw * 0.46, -hh * 0.35, 3.8, 0, Math.PI * 2);
    ctx.fill();

    if (blk.h >= 24) {
      drawCartoonFace(ctx, 0, 2, Math.min(blk.w, blk.h) * 0.3, 'sleepy');
    }
  } else if (blk.blockType === 'resistant') {
    // Antibiotic-resistant bacterium with yellow hard-hat shield
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#7dd3fc');
    grad.addColorStop(0.55, '#0284c7');
    grad.addColorStop(1, '#0369a1');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2.6;
    roundRectPath(ctx, -hw, -hh, blk.w, blk.h, 8);
    ctx.fill();
    ctx.stroke();

    // Yellow protective helmet on top
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -hh + 6, hw * 0.85, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawCartoonFace(ctx, 0, 5, Math.min(blk.w, blk.h) * 0.3, 'smirk');
  } else {
    // Golden Target Block with Red Cross
    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(1, '#d97706');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.8;
    roundRectPath(ctx, -hw, -hh, blk.w, blk.h, 8);
    ctx.fill();
    ctx.stroke();

    // Pulsing glow highlight
    const pulse = 0.25 + 0.15 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    roundRectPath(ctx, -hw + 3, -hh + 3, blk.w - 6, 6, 2);
    ctx.fill();

    // Red medical cross emblem in center
    drawMedicalCross(ctx, 0, 0, Math.min(blk.w, blk.h) * 0.33, '#dc2626', '#ffffff');
  }

  // Damage cracks
  if (hpRatio < 0.72) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.45, -hh * 0.55);
    ctx.lineTo(-hw * 0.05, -hh * 0.05);
    ctx.lineTo(-hw * 0.25, hh * 0.45);
    if (hpRatio < 0.38) {
      ctx.moveTo(hw * 0.38, -hh * 0.48);
      ctx.lineTo(0, 0);
      ctx.lineTo(hw * 0.35, hh * 0.52);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawCartoonFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  mood: 'goofy' | 'happy' | 'sleepy' | 'smirk'
): void {
  ctx.save();
  ctx.translate(cx, cy);
  const eyeOffX = scale * 0.62;
  const eyeY = -scale * 0.15;
  const eyeR = Math.max(3, scale * 0.36);

  // White eyeballs
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  [-eyeOffX, eyeOffX].forEach((ex) => {
    ctx.beginPath();
    ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Pupils
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-eyeOffX + (mood === 'goofy' ? 1 : 0), eyeY, eyeR * 0.48, 0, Math.PI * 2);
  ctx.arc(eyeOffX - (mood === 'goofy' ? 1 : 0), eyeY, eyeR * 0.48, 0, Math.PI * 2);
  ctx.fill();

  // Sleepy eyelids
  if (mood === 'sleepy') {
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-eyeOffX - eyeR, eyeY - 1);
    ctx.lineTo(-eyeOffX + eyeR, eyeY - 1);
    ctx.moveTo(eyeOffX - eyeR, eyeY - 1);
    ctx.lineTo(eyeOffX + eyeR, eyeY - 1);
    ctx.stroke();
  }

  // Mouth
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'goofy' || mood === 'happy') {
    ctx.arc(0, scale * 0.3, scale * 0.45, 0.15, Math.PI - 0.15);
  } else if (mood === 'smirk') {
    ctx.moveTo(-scale * 0.35, scale * 0.42);
    ctx.quadraticCurveTo(0, scale * 0.55, scale * 0.45, scale * 0.25);
  } else {
    ctx.moveTo(-scale * 0.3, scale * 0.45);
    ctx.lineTo(scale * 0.3, scale * 0.45);
  }
  ctx.stroke();
  ctx.restore();
}

function drawMedicalCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  stroke: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  const armW = size * 0.55;
  const armL = size * 1.45;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(-armW / 2, -armL / 2);
  ctx.lineTo(armW / 2, -armL / 2);
  ctx.lineTo(armW / 2, -armW / 2);
  ctx.lineTo(armL / 2, -armW / 2);
  ctx.lineTo(armL / 2, armW / 2);
  ctx.lineTo(armW / 2, armW / 2);
  ctx.lineTo(armW / 2, armL / 2);
  ctx.lineTo(-armW / 2, armL / 2);
  ctx.lineTo(-armW / 2, armW / 2);
  ctx.lineTo(-armL / 2, armW / 2);
  ctx.lineTo(-armL / 2, -armW / 2);
  ctx.lineTo(-armW / 2, -armW / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  ammo: ProjectileType,
  aimAssistActive: boolean
): void {
  const colorMap: Record<ProjectileType, string> = {
    antibody: '#0284c7',
    vaccine: '#14b8a6',
    antibiotic: '#f97316',
    antiviral: '#a855f7',
    tcell: '#eab308',
    antiseptic: '#10b981',
  };
  const dotColor = aimAssistActive ? '#10b981' : colorMap[ammo];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const progress = i / points.length;
    const radius = Math.max(2.4, (aimAssistActive ? 5.6 : 5.2) * (1 - progress * 0.55));
    ctx.fillStyle = dotColor;
    ctx.globalAlpha = Math.max(aimAssistActive ? 0.45 : 0.24, 0.95 - progress * 0.6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (aimAssistActive && points.length > 0) {
    const endPt = points[points.length - 1];
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endPt.x - 15, endPt.y);
    ctx.lineTo(endPt.x + 15, endPt.y);
    ctx.moveTo(endPt.x, endPt.y - 15);
    ctx.lineTo(endPt.x, endPt.y + 15);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: ProjectileEntity): void {
  const trailColor: Record<ProjectileType, string> = {
    antibody: 'rgba(56, 189, 248, ',
    vaccine: 'rgba(45, 212, 191, ',
    antibiotic: 'rgba(251, 146, 60, ',
    antiviral: 'rgba(168, 85, 247, ',
    tcell: 'rgba(250, 204, 21, ',
    antiseptic: 'rgba(16, 185, 129, ',
  };

  for (let i = 0; i < proj.trail.length; i++) {
    const pt = proj.trail[i];
    const ratio = (i + 1) / proj.trail.length;
    ctx.fillStyle = `${trailColor[proj.ammoType]}${ratio * 0.44})`;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, proj.radius * ratio * 0.76, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(proj.body.position.x, proj.body.position.y);
  ctx.rotate(proj.body.angle);

  const r = proj.radius;
  if (proj.ammoType === 'antiseptic') {
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
    g.addColorStop(0, '#ecfdf5');
    g.addColorStop(0.5, '#34d399');
    g.addColorStop(1, '#047857');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sparkling foam bubbles + cross
    drawMedicalCross(ctx, 0, 0, r * 0.56, '#ffffff', '#065f46');
  } else if (proj.ammoType === 'antibody') {
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#38bdf8');
    g.addColorStop(1, '#0369a1');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Y-shaped antibody mark
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.48);
    ctx.lineTo(0, 0);
    ctx.lineTo(-r * 0.42, -r * 0.42);
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.42, -r * 0.42);
    ctx.stroke();
  } else if (proj.ammoType === 'vaccine') {
    ctx.fillStyle = '#14b8a6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawMedicalCross(ctx, 0, 0, r * 0.68, '#ffffff', '#0f766e');
  } else if (proj.ammoType === 'antibiotic') {
    // Two-tone capsule orb
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (proj.ammoType === 'antiviral') {
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
    g.addColorStop(0, '#f3e8ff');
    g.addColorStop(0.55, '#a855f7');
    g.addColorStop(1, '#581c87');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // T-Lymphocyte
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
    g.addColorStop(0, '#fef9c3');
    g.addColorStop(0.55, '#facc15');
    g.addColorStop(1, '#0d9488');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawLauncher(
  ctx: CanvasRenderingContext2D,
  world: ImmunePhysicsWorld,
  aim: AimVisualState,
  skin: LauncherSkinId,
  elapsedSec: number
): void {
  let angle = world.cannonAngle;
  let pullRatio = 0;

  if (aim.isAiming) {
    const { vx, vy, powerRatio } = world.computeLaunchVelocity(aim.pullDx, aim.pullDy);
    pullRatio = powerRatio;
    if (powerRatio > 0.01) {
      angle = Math.atan2(vx, -vy);
    }
  }

  // Pullback tension band while aiming
  if (aim.isAiming && pullRatio > 0.02) {
    const pullEndX = CANNON_X + Math.max(-110, Math.min(110, aim.pullDx));
    const pullEndY = CANNON_Y + Math.max(-40, Math.min(85, aim.pullDy));
    ctx.save();
    ctx.strokeStyle = aim.selectedAmmo === 'antiseptic' ? '#10b981' : '#0ea5e9';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(CANNON_X, CANNON_Y);
    ctx.lineTo(pullEndX, pullEndY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = aim.selectedAmmo === 'antiseptic' ? '#10b981' : '#e11d48';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pullEndX, pullEndY, 10 + pullRatio * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Glowing chamber indicator when Antiseptic Bomb is loaded
  if (aim.selectedAmmo === 'antiseptic') {
    ctx.save();
    const glow = 0.25 + 0.15 * Math.sin(elapsedSec * 7);
    ctx.fillStyle = `rgba(16, 185, 129, ${glow})`;
    ctx.beginPath();
    ctx.arc(CANNON_X, CANNON_Y - 12, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Rotating Launcher Barrel according to selected skin
  ctx.save();
  ctx.translate(CANNON_X, CANNON_Y);
  ctx.rotate(angle);
  const recoilOffset = world.cannonRecoil * 9 + pullRatio * 8;
  ctx.translate(0, recoilOffset);

  if (skin === 'immune_cell') {
    // Living Leukocyte / Macrophage Cannon Barrel
    const cellGrad = ctx.createRadialGradient(-4, -18, 4, 0, -14, 28);
    cellGrad.addColorStop(0, '#ffffff');
    cellGrad.addColorStop(0.55, '#99f6e4');
    cellGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = cellGrad;
    ctx.strokeStyle = '#134e4a';
    ctx.lineWidth = 2.6;

    // Bio-barrel lobe
    roundRectPath(ctx, -16, -42, 32, 50, 16);
    ctx.fill();
    ctx.stroke();

    // Pseudopod fins
    ctx.fillStyle = '#5eead4';
    ctx.beginPath();
    ctx.ellipse(-18, -14, 6, 11, -0.25, 0, Math.PI * 2);
    ctx.ellipse(18, -14, 6, 11, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing nucleus core
    ctx.fillStyle = '#0ea5e9';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nozzle ring
    ctx.fillStyle = '#2dd4bf';
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2.2;
    roundRectPath(ctx, -11, -50, 22, 11, 5);
    ctx.fill();
    ctx.stroke();
  } else if (skin === 'microscope') {
    // Precision Brass & White Optical Microscope Cannon
    // Focus dial knobs on sides
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-18, -8, 6.5, 0, Math.PI * 2);
    ctx.arc(18, -8, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Main optical tube
    const tubeGrad = ctx.createLinearGradient(-14, 0, 14, 0);
    tubeGrad.addColorStop(0, '#e2e8f0');
    tubeGrad.addColorStop(0.5, '#ffffff');
    tubeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = tubeGrad;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.6;
    roundRectPath(ctx, -14, -40, 28, 48, 8);
    ctx.fill();
    ctx.stroke();

    // Brass collar band
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    roundRectPath(ctx, -15, -24, 30, 8, 3);
    ctx.fill();
    ctx.stroke();

    // Dual objective turret + glowing blue lens
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    roundRectPath(ctx, -12, -51, 24, 13, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -50, 5.5, Math.PI, 0);
    ctx.fill();
  } else {
    // Classic Syringe Barrel
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    ctx.fillRect(-5, 10, 10, 24);
    ctx.strokeRect(-5, 10, 10, 24);
    roundRectPath(ctx, -14, 30, 28, 7, 3);
    ctx.fill();
    ctx.stroke();

    const barrelGrad = ctx.createLinearGradient(-15, 0, 15, 0);
    barrelGrad.addColorStop(0, '#bae6fd');
    barrelGrad.addColorStop(0.45, '#ffffff');
    barrelGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = barrelGrad;
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2.6;
    roundRectPath(ctx, -15, -40, 30, 52, 10);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.6;
    [-26, -18, -10, -2].forEach((ty) => {
      ctx.beginPath();
      ctx.moveTo(-13, ty);
      ctx.lineTo(-5, ty);
      ctx.stroke();
    });

    ctx.fillStyle = '#14b8a6';
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2.2;
    roundRectPath(ctx, -9, -49, 18, 11, 4);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();

  // Stationary Medical Carriage Base with Red Cross Emblem
  ctx.save();
  ctx.translate(CANNON_X, CANNON_Y);

  ctx.fillStyle = 'rgba(12, 74, 110, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 30, 38, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const domeFill =
    skin === 'immune_cell' ? '#ccfbf1' : skin === 'microscope' ? '#f8fafc' : '#ffffff';
  const domeStroke =
    skin === 'immune_cell' ? '#0d9488' : skin === 'microscope' ? '#334155' : '#0284c7';

  ctx.fillStyle = domeFill;
  ctx.strokeStyle = domeStroke;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, 11, 24, Math.PI, 0);
  ctx.lineTo(28, 26);
  ctx.lineTo(-28, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const wheelFill =
    skin === 'immune_cell' ? '#14b8a6' : skin === 'microscope' ? '#d97706' : '#0284c7';
  const wheelStroke =
    skin === 'immune_cell' ? '#134e4a' : skin === 'microscope' ? '#78350f' : '#0c4a6e';

  [-24, 24].forEach((wx) => {
    ctx.fillStyle = wheelFill;
    ctx.strokeStyle = wheelStroke;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(wx, 20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(wx, 20, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  drawMedicalCross(ctx, 0, 15, 11, '#ef4444', '#ffffff');

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, world: ImmunePhysicsWorld): void {
  for (const pt of world.particles) {
    const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (pt.kind === 'ring') {
      const progress = pt.life / pt.maxLife;
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 6 * (1 - progress);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * progress, 0, Math.PI * 2);
      ctx.stroke();
    } else if (pt.kind === 'smoke') {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (0.7 + (pt.life / pt.maxLife) * 0.6), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.rotation);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(0, 0, pt.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const ft of world.floatingTexts) {
    const alpha = Math.max(0, 1 - ft.life / ft.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '800 17px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
