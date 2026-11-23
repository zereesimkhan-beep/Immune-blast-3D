import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Cross,
  Crosshair,
  FlaskConical,
  Pause,
  Pill,
  PlusCircle,
  RotateCcw,
  Shield,
  Sparkles,
  Syringe,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { getFactForLevel } from '../facts/medicalFacts';
import { pickText, TranslationBundle } from '../i18n/translations';
import {
  ImmunePhysicsWorld,
  MIN_PULL_DISTANCE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../physics/immuneWorld';
import {
  BlockType,
  BoosterType,
  HudSnapshot,
  LevelConfig,
  ProjectileType,
  SaveData,
} from '../types/game';
import { AimVisualState, renderGameScene } from './canvasRenderer';
import { ResultModal } from './ResultModal';

interface GameCanvasProps {
  level: LevelConfig;
  saveData: SaveData;
  t: TranslationBundle;
  hasNextLevel: boolean;
  onCompleteLevel: (
    levelId: number,
    stars: number,
    score: number,
    movesLeft: number
  ) => number;
  onSpendExtraMoves: () => boolean;
  onConsumeShopAmmo: (
    ammoType: Exclude<ProjectileType, 'antibody' | 'antiseptic'>
  ) => void;
  onConsumeBooster: (booster: BoosterType) => void;
  onStatBlockCleared: (blockType: BlockType) => void;
  onStatVaccineUsed: () => void;
  onStatAntibioticBlast: () => void;
  onStatShotFired: () => void;
  onToggleSound: () => void;
  onNextLevel: () => void;
  onExitToMap: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  saveData,
  t,
  hasNextLevel,
  onCompleteLevel,
  onSpendExtraMoves,
  onConsumeShopAmmo,
  onConsumeBooster,
  onStatBlockCleared,
  onStatVaccineUsed,
  onStatAntibioticBlast,
  onStatShotFired,
  onToggleSound,
  onNextLevel,
  onExitToMap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<ImmunePhysicsWorld | null>(null);

  const [paused, setPaused] = useState(false);
  const [selectedAmmo, setSelectedAmmo] = useState<ProjectileType>('antibody');
  const [aimAssistActive, setAimAssistActive] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(Boolean(level.tutorial));
  const [resultState, setResultState] = useState<{
    mode: 'won' | 'lost';
    stars: number;
    score: number;
    coinsEarned: number;
  } | null>(null);

  const [levelBonusAmmo, setLevelBonusAmmo] = useState<
    Record<Exclude<ProjectileType, 'antibody' | 'antiseptic'>, number>
  >(() => ({
    vaccine: level.levelSpecialAmmo?.vaccine ?? 0,
    antibiotic: level.levelSpecialAmmo?.antibiotic ?? 0,
    antiviral: level.levelSpecialAmmo?.antiviral ?? 0,
    tcell: level.levelSpecialAmmo?.tcell ?? 0,
  }));

  const [hud, setHud] = useState<HudSnapshot>({
    movesLeft: level.moves,
    totalMoves: level.moves,
    score: 0,
    goalType: level.goal.type,
    goalCurrent: 0,
    goalTarget: 1,
    status: 'aiming',
    canSplitMidAir: false,
    isSlowMotion: false,
    infectionClearedBanner: false,
  });

  const aimRef = useRef<
    AimVisualState & { startX: number; startY: number; pointerId: number | null }
  >({
    isAiming: false,
    startX: 0,
    startY: 0,
    pullDx: 0,
    pullDy: 0,
    selectedAmmo: 'antibody',
    trajectory: [],
    aimAssistActive: false,
    pointerId: null,
  });

  const getAmmoCount = useCallback(
    (type: ProjectileType): number => {
      if (type === 'antibody') return Infinity;
      if (type === 'antiseptic') return saveData.boosters.antisepticBomb ?? 0;
      return (levelBonusAmmo[type] ?? 0) + (saveData.ammoInventory[type] ?? 0);
    },
    [levelBonusAmmo, saveData.ammoInventory, saveData.boosters.antisepticBomb]
  );

  useEffect(() => {
    if (selectedAmmo !== 'antibody' && getAmmoCount(selectedAmmo) <= 0) {
      setSelectedAmmo('antibody');
      aimRef.current.selectedAmmo = 'antibody';
    } else {
      aimRef.current.selectedAmmo = selectedAmmo;
    }
  }, [selectedAmmo, getAmmoCount]);

  useEffect(() => {
    aimRef.current.aimAssistActive = aimAssistActive;
    if (worldRef.current) {
      worldRef.current.aimAssistActive = aimAssistActive;
    }
  }, [aimAssistActive]);

  const callbacksRef = useRef({
    onCompleteLevel,
    onStatBlockCleared,
    onStatVaccineUsed,
    onStatAntibioticBlast,
    onStatShotFired,
  });
  callbacksRef.current = {
    onCompleteLevel,
    onStatBlockCleared,
    onStatVaccineUsed,
    onStatAntibioticBlast,
    onStatShotFired,
  };

  const triggerHaptic = useCallback(
    (heavy: boolean) => {
      if (!saveData.settings.haptics) return;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(heavy ? 35 : 15);
      }
    },
    [saveData.settings.haptics]
  );

  const initWorld = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.destroy();
    }

    setResultState(null);
    setPaused(false);
    setSelectedAmmo('antibody');
    setAimAssistActive(false);
    setShowTutorial(Boolean(level.tutorial));
    setLevelBonusAmmo({
      vaccine: level.levelSpecialAmmo?.vaccine ?? 0,
      antibiotic: level.levelSpecialAmmo?.antibiotic ?? 0,
      antiviral: level.levelSpecialAmmo?.antiviral ?? 0,
      tcell: level.levelSpecialAmmo?.tcell ?? 0,
    });
    aimRef.current = {
      isAiming: false,
      startX: 0,
      startY: 0,
      pullDx: 0,
      pullDy: 0,
      selectedAmmo: 'antibody',
      trajectory: [],
      aimAssistActive: false,
      pointerId: null,
    };

    const world = new ImmunePhysicsWorld(
      level,
      saveData.upgrades,
      saveData.settings.cameraShake,
      {
        onHudUpdate: (snap) => setHud(snap),
        onVictory: (stars, score, movesLeft) => {
          const coinsEarned = callbacksRef.current.onCompleteLevel(
            level.id,
            stars,
            score,
            movesLeft
          );
          setResultState({ mode: 'won', stars, score, coinsEarned });
        },
        onDefeat: (score) => {
          setResultState({ mode: 'lost', stars: 0, score, coinsEarned: 0 });
        },
        onBlockCleared: (bt) => callbacksRef.current.onStatBlockCleared(bt),
        onVaccineUsed: () => callbacksRef.current.onStatVaccineUsed(),
        onAntibioticBlast: () => callbacksRef.current.onStatAntibioticBlast(),
        onShotFired: () => callbacksRef.current.onStatShotFired(),
        onHapticImpact: triggerHaptic,
      }
    );

    worldRef.current = world;
    setHud(world.getHudSnapshot());
  }, [level, saveData.upgrades, saveData.settings.cameraShake, triggerHaptic]);

  useEffect(() => {
    initWorld();
    return () => {
      if (worldRef.current) {
        worldRef.current.destroy();
        worldRef.current = null;
      }
    };
  }, [initWorld]);

  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.cameraShakeEnabled = saveData.settings.cameraShake;
    }
  }, [saveData.settings.cameraShake]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const world = worldRef.current;
      const canvas = canvasRef.current;

      if (world && canvas) {
        if (!paused) {
          world.step(dt);
        }

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.round(WORLD_WIDTH * dpr);
        const targetH = Math.round(WORLD_HEIGHT * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          renderGameScene(
            ctx,
            world,
            aimRef.current,
            (now - startTime) / 1000,
            saveData.selectedSkin
          );
          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [paused, saveData.selectedSkin]);

  const clientToWorld = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * WORLD_WIDTH,
      y: ((clientY - rect.top) / rect.height) * WORLD_HEIGHT,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || resultState) return;
    const world = worldRef.current;
    if (!world) return;

    if (world.status === 'flying' && world.canSplitActiveProjectile()) {
      world.splitActiveProjectile();
      return;
    }

    if (world.status !== 'aiming' || world.movesLeft <= 0) return;

    if (showTutorial) setShowTutorial(false);

    const pt = clientToWorld(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);

    aimRef.current = {
      isAiming: true,
      startX: pt.x,
      startY: pt.y,
      pullDx: 0,
      pullDy: 0,
      selectedAmmo,
      trajectory: [],
      aimAssistActive,
      pointerId: e.pointerId,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.isAiming || aimRef.current.pointerId !== e.pointerId) return;
    const world = worldRef.current;
    if (!world) return;

    const pt = clientToWorld(e.clientX, e.clientY);
    const pullDx = pt.x - aimRef.current.startX;
    const pullDy = pt.y - aimRef.current.startY;
    const dist = Math.hypot(pullDx, pullDy);

    aimRef.current.pullDx = pullDx;
    aimRef.current.pullDy = pullDy;

    if (dist >= MIN_PULL_DISTANCE) {
      soundEngine.playAimTick();
      aimRef.current.trajectory = world.predictTrajectory(
        pullDx,
        pullDy,
        aimRef.current.selectedAmmo
      );
    } else {
      aimRef.current.trajectory = [];
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!aimRef.current.isAiming || aimRef.current.pointerId !== e.pointerId) return;
    const world = worldRef.current;

    const { pullDx, pullDy, selectedAmmo: ammoToFire } = aimRef.current;
    const dist = Math.hypot(pullDx, pullDy);

    aimRef.current.isAiming = false;
    aimRef.current.trajectory = [];
    aimRef.current.pointerId = null;

    if (!world || dist < MIN_PULL_DISTANCE) return;

    const fired = world.fireProjectile(pullDx, pullDy, ammoToFire);
    if (fired) {
      if (ammoToFire === 'antiseptic') {
        onConsumeBooster('antisepticBomb');
        setSelectedAmmo('antibody');
      } else if (ammoToFire !== 'antibody') {
        if ((levelBonusAmmo[ammoToFire] ?? 0) > 0) {
          setLevelBonusAmmo((prev) => ({
            ...prev,
            [ammoToFire]: Math.max(0, (prev[ammoToFire] ?? 0) - 1),
          }));
        } else {
          onConsumeShopAmmo(ammoToFire);
        }
      }
    }
  };

  const handleBuyExtraMoves = () => {
    const ok = onSpendExtraMoves();
    if (ok && worldRef.current) {
      soundEngine.playCoin();
      worldRef.current.addExtraMoves(3);
      setResultState(null);
    }
  };

  const handleActivateExtraMovesBooster = () => {
    if ((saveData.boosters.extraMoves ?? 0) <= 0 || !worldRef.current) return;
    soundEngine.playCoin();
    worldRef.current.addExtraMoves(2);
    onConsumeBooster('extraMoves');
  };

  const handleActivateAimAssistBooster = () => {
    if (aimAssistActive || (saveData.boosters.aimAssist ?? 0) <= 0) return;
    soundEngine.playUiPop();
    setAimAssistActive(true);
    onConsumeBooster('aimAssist');
  };

  const handleToggleAntisepticBomb = () => {
    if ((saveData.boosters.antisepticBomb ?? 0) <= 0) return;
    soundEngine.playUiPop();
    setSelectedAmmo((prev) => (prev === 'antiseptic' ? 'antibody' : 'antiseptic'));
  };

  const goalSummaryText = useMemo(() => {
    if (hud.goalType === 'destroy_targets') {
      return t.goalDestroyTargets(hud.goalCurrent, hud.goalTarget);
    }
    if (hud.goalType === 'drop_blocks') {
      return t.goalDropBlocks(hud.goalCurrent, hud.goalTarget);
    }
    return t.goalCollapseBelow(hud.goalCurrent, hud.goalTarget);
  }, [hud, t]);

  const ammoOptions: Array<{
    type: Exclude<ProjectileType, 'antiseptic'>;
    icon: React.ReactNode;
    accent: string;
  }> = [
    {
      type: 'antibody',
      icon: <Shield className="h-4 w-4" />,
      accent: 'from-sky-500 to-blue-700',
    },
    {
      type: 'vaccine',
      icon: <Syringe className="h-4 w-4" />,
      accent: 'from-teal-400 to-teal-700',
    },
    {
      type: 'antibiotic',
      icon: <Pill className="h-4 w-4" />,
      accent: 'from-orange-500 to-rose-600',
    },
    {
      type: 'antiviral',
      icon: <Zap className="h-4 w-4" />,
      accent: 'from-purple-500 to-indigo-700',
    },
    {
      type: 'tcell',
      icon: <Sparkles className="h-4 w-4" />,
      accent: 'from-amber-400 to-emerald-600',
    },
  ];

  const visibleAmmo = ammoOptions.filter(
    (opt) =>
      opt.type === 'antibody' ||
      level.availableAmmo.includes(opt.type) ||
      getAmmoCount(opt.type) > 0
  );

  const levelFact = useMemo(() => getFactForLevel(level.id), [level.id]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-teal-100">
      <div
        className="relative h-full w-full max-w-[480px] overflow-hidden shadow-2xl sm:my-2 sm:h-[calc(100%-16px)] sm:rounded-3xl sm:border-4 sm:border-white"
        style={{ aspectRatio: `${WORLD_WIDTH} / ${WORLD_HEIGHT}` }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block h-full w-full touch-none cursor-crosshair"
        />

        {/* TOP HUD BAR */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-start justify-between gap-2 p-3">
          {/* "Ходы" Counter Shaped as a Red Cross (Top-Left) */}
          <div className="pointer-events-auto relative flex h-[66px] w-[66px] shrink-0 items-center justify-center">
            <svg viewBox="0 0 80 80" className="h-full w-full drop-shadow-[0_4px_0_rgba(127,29,29,0.75)]" aria-hidden="true">
              <path
                d="M26 4 H54 V26 H76 V54 H54 V76 H26 V54 H4 V26 H26 Z"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-[9px] font-black leading-none uppercase tracking-tight">
                {t.movesLabel}
              </span>
              <span className="font-display text-2xl leading-tight font-black tabular-nums">
                {hud.movesLeft}
              </span>
            </div>
          </div>

          {/* Center Organ + Level + Goal Info */}
          <div className="flex flex-col items-center rounded-2xl border-2 border-white bg-slate-900/65 px-3 py-1.5 text-white backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-cyan-200">
              <span>
                {t.organNames[level.organZone]} · {t.levelWord} {level.id}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{hud.score}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black whitespace-nowrap">
              <Cross className="h-3.5 w-3.5 text-amber-300" />
              <span className="tabular-nums">{goalSummaryText}</span>
            </div>
          </div>

          {/* Top-Right Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playUiPop();
                onToggleSound();
              }}
              aria-label={t.settingsLabels.sound}
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-sky-600 text-white shadow-[0_3px_0_#075985] active:translate-y-0.5"
            >
              {saveData.settings.soundEnabled ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiPop();
                initWorld();
              }}
              aria-label={t.retry}
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-amber-500 text-white shadow-[0_3px_0_#92400e] active:translate-y-0.5"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiPop();
                setPaused(true);
              }}
              aria-label={t.pause}
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-white bg-rose-500 text-white shadow-[0_3px_0_#881337] active:translate-y-0.5"
            >
              <Pause className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* "Инфекция уничтожена!" Live Celebration Banner */}
        {hud.infectionClearedBanner && !resultState && (
          <div className="pointer-events-none absolute top-24 right-0 left-0 z-20 flex justify-center px-4">
            <div className="rounded-2xl border-3 border-white bg-emerald-500 px-5 py-2 font-display text-base font-black text-white shadow-xl text-stroke-dark animate-bounce">
              {t.infectionCleared}
            </div>
          </div>
        )}

        {/* Antiseptic Bomb Armed Notice */}
        {selectedAmmo === 'antiseptic' && !hud.infectionClearedBanner && !resultState && (
          <div className="pointer-events-none absolute top-24 right-0 left-0 z-20 flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-2xl border-2 border-white bg-emerald-600/95 px-4 py-1.5 text-xs font-black text-white shadow-lg">
              <FlaskConical className="h-4 w-4 text-emerald-200" />
              <span>{t.antisepticReady}</span>
            </div>
          </div>
        )}

        {/* Mid-air T-Lymphocyte Split Prompt */}
        {hud.canSplitMidAir && !hud.infectionClearedBanner && (
          <div className="pointer-events-none absolute top-24 right-0 left-0 z-20 flex justify-center px-4">
            <div className="flex items-center gap-2 rounded-2xl border-2 border-white bg-teal-600/95 px-4 py-2 text-xs font-black text-white shadow-lg animate-bounce">
              <Sparkles className="h-4 w-4 text-yellow-200" />
              <span>{t.tapToSplit}</span>
            </div>
          </div>
        )}

        {/* Interactive Tutorial Overlay (Levels 1-3) */}
        {showTutorial && level.tutorial && !resultState && !paused && (
          <div className="pointer-events-auto absolute top-24 right-3 left-3 z-20 rounded-2xl border-3 border-teal-300 bg-slate-900/88 p-3.5 text-white shadow-xl backdrop-blur-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-black text-teal-300">
                  {pickText(
                    saveData.settings.language,
                    level.tutorial.titleRu,
                    level.tutorial.titleEn,
                    level.tutorial.titleKk
                  )}
                </h3>
                <p className="mt-1 text-xs leading-snug font-semibold text-slate-100">
                  {pickText(
                    saveData.settings.language,
                    level.tutorial.bodyRu,
                    level.tutorial.bodyEn,
                    level.tutorial.bodyKk
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTutorial(false)}
                aria-label={t.tutorialSkip}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Boosters + Immune Ammo Selector Bar */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 flex flex-col items-center gap-1.5 p-2">
          {/* Compact 3-Booster Row */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border-2 border-white/80 bg-slate-900/65 px-2 py-1 backdrop-blur-md">
            <button
              type="button"
              disabled={(saveData.boosters.extraMoves ?? 0) <= 0}
              onClick={handleActivateExtraMovesBooster}
              className={`flex min-h-[36px] items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-black text-white transition-transform whitespace-nowrap ${
                (saveData.boosters.extraMoves ?? 0) > 0
                  ? 'bg-sky-600 hover:bg-sky-500 active:scale-95'
                  : 'bg-slate-800/70 opacity-45 cursor-not-allowed'
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5 text-cyan-200" />
              <span>{t.boosterShortNames.extraMoves}</span>
              <span className="tabular-nums text-cyan-200">
                ×{saveData.boosters.extraMoves ?? 0}
              </span>
            </button>

            <button
              type="button"
              disabled={aimAssistActive || (saveData.boosters.aimAssist ?? 0) <= 0}
              onClick={handleActivateAimAssistBooster}
              className={`flex min-h-[36px] items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-black text-white transition-transform whitespace-nowrap ${
                aimAssistActive
                  ? 'bg-emerald-600 ring-2 ring-emerald-200'
                  : (saveData.boosters.aimAssist ?? 0) > 0
                  ? 'bg-teal-600 hover:bg-teal-500 active:scale-95'
                  : 'bg-slate-800/70 opacity-45 cursor-not-allowed'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5 text-emerald-200" />
              <span>{t.boosterShortNames.aimAssist}</span>
              <span className="tabular-nums text-emerald-200">
                {aimAssistActive ? '✓' : `×${saveData.boosters.aimAssist ?? 0}`}
              </span>
            </button>

            <button
              type="button"
              disabled={(saveData.boosters.antisepticBomb ?? 0) <= 0}
              onClick={handleToggleAntisepticBomb}
              className={`flex min-h-[36px] items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-black text-white transition-transform whitespace-nowrap ${
                selectedAmmo === 'antiseptic'
                  ? 'bg-emerald-500 ring-2 ring-yellow-300 scale-105'
                  : (saveData.boosters.antisepticBomb ?? 0) > 0
                  ? 'bg-emerald-700 hover:bg-emerald-600 active:scale-95'
                  : 'bg-slate-800/70 opacity-45 cursor-not-allowed'
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5 text-yellow-200" />
              <span>{t.boosterShortNames.antisepticBomb}</span>
              <span className="tabular-nums text-yellow-200">
                ×{saveData.boosters.antisepticBomb ?? 0}
              </span>
            </button>
          </div>

          {/* Ammo Selector Bar */}
          <div className="pointer-events-auto flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border-2 border-white/85 bg-slate-900/70 p-1.5 backdrop-blur-md">
            {visibleAmmo.map((item) => {
              const count = getAmmoCount(item.type);
              const isSelected = selectedAmmo === item.type;
              const disabled = count <= 0;

              return (
                <button
                  key={item.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    soundEngine.playUiPop();
                    setSelectedAmmo(item.type);
                  }}
                  className={`relative flex min-h-[46px] min-w-[62px] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1 text-white transition-transform ${
                    isSelected
                      ? `bg-gradient-to-b ${item.accent} ring-2 ring-yellow-300 scale-105`
                      : disabled
                      ? 'bg-slate-800/70 opacity-45 cursor-not-allowed'
                      : 'bg-slate-800/85 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {item.icon}
                    <span className="text-[11px] font-black tabular-nums">
                      {count === Infinity ? '∞' : `×${count}`}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold leading-tight whitespace-nowrap">
                    {t.ammoNames[item.type]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modals */}
        {paused && !resultState && (
          <ResultModal
            mode="paused"
            stars={0}
            score={hud.score}
            coinsEarned={0}
            playerCoins={saveData.coins}
            hasNextLevel={hasNextLevel}
            language={saveData.settings.language}
            t={t}
            onRetry={initWorld}
            onNextLevel={onNextLevel}
            onBuyExtraMoves={handleBuyExtraMoves}
            onExitToMap={onExitToMap}
            onResume={() => setPaused(false)}
          />
        )}

        {resultState && (
          <ResultModal
            mode={resultState.mode}
            stars={resultState.stars}
            score={resultState.score}
            coinsEarned={resultState.coinsEarned}
            playerCoins={saveData.coins}
            hasNextLevel={hasNextLevel}
            fact={resultState.mode === 'won' ? levelFact : undefined}
            language={saveData.settings.language}
            t={t}
            onRetry={initWorld}
            onNextLevel={onNextLevel}
            onBuyExtraMoves={handleBuyExtraMoves}
            onExitToMap={onExitToMap}
            onResume={() => {}}
          />
        )}
      </div>
    </div>
  );
};
