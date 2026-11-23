import React from 'react';
import {
  Activity,
  ArrowLeft,
  Droplets,
  HeartPulse,
  Lock,
  Shield,
  Sparkles,
  Star,
  Wind,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { pickText, TranslationBundle } from '../i18n/translations';
import { getAllLevels } from '../levels/levelLoader';
import { getTotalStars } from '../storage/saveSystem';
import { OrganZone, SaveData } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface LevelMapProps {
  saveData: SaveData;
  t: TranslationBundle;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

const ZONE_META: Array<{
  zone: OrganZone;
  accentBg: string;
  accentBorder: string;
  icon: React.ReactNode;
}> = [
  {
    zone: 'skin',
    accentBg: 'from-pink-500 to-rose-500',
    accentBorder: 'border-rose-200',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    zone: 'throat',
    accentBg: 'from-indigo-500 to-purple-600',
    accentBorder: 'border-indigo-200',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    zone: 'lungs',
    accentBg: 'from-sky-500 to-cyan-600',
    accentBorder: 'border-sky-200',
    icon: <Wind className="h-5 w-5" />,
  },
  {
    zone: 'gut',
    accentBg: 'from-emerald-500 to-teal-600',
    accentBorder: 'border-emerald-200',
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    zone: 'blood',
    accentBg: 'from-rose-500 to-red-600',
    accentBorder: 'border-rose-200',
    icon: <HeartPulse className="h-5 w-5" />,
  },
  {
    zone: 'lymph',
    accentBg: 'from-teal-500 to-indigo-600',
    accentBorder: 'border-teal-200',
    icon: <Sparkles className="h-5 w-5" />,
  },
];

export const LevelMap: React.FC<LevelMapProps> = ({
  saveData,
  t,
  onSelectLevel,
  onBack,
}) => {
  const levels = getAllLevels();
  const totalStars = getTotalStars(saveData);
  const maxStars = levels.length * 3;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <BioBackdrop zone="lungs" variant="map" />

      <header className="relative z-20 flex items-center justify-between gap-3 border-b-2 border-white/60 bg-sky-600/90 px-4 py-3 text-white backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiPop();
            onBack();
          }}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-white bg-sky-700 px-3 py-2 font-display text-sm font-extrabold text-white shadow-[0_3px_0_#0c4a6e] active:translate-y-0.5 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back}</span>
        </button>

        <h1 className="font-display text-lg font-black tracking-tight text-white text-stroke-dark truncate">
          {t.bodyMap}
        </h1>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/85 bg-slate-900/45 px-3 py-1.5 text-sm font-black tabular-nums whitespace-nowrap">
          <Star className="h-4 w-4 fill-amber-400 text-amber-300" />
          <span>
            {totalStars}/{maxStars}
          </span>
        </div>
      </header>

      {/* Body Organ Map Schematic */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        <div className="relative mx-auto flex w-full max-w-md flex-col gap-6 pb-10">
          {/* Central vertical body vessel spine */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 bottom-12 left-1/2 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-pink-300/70 via-sky-300/70 to-rose-400/70 ring-2 ring-white/80"
          />

          {ZONE_META.map((zm) => {
            const zoneLevels = levels.filter((l) => l.organZone === zm.zone);

            return (
              <section key={zm.zone} className="relative z-10 flex flex-col gap-3">
                {/* Organ Zone Header Node */}
                <div className="mx-auto flex items-center gap-2 rounded-2xl border-2 border-white bg-white/95 px-4 py-2 shadow-md">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b ${zm.accentBg} text-white`}
                  >
                    {zm.icon}
                  </span>
                  <h2 className="font-display text-base font-black text-slate-900">
                    {t.organNames[zm.zone]}
                  </h2>
                </div>

                {/* 3 Levels inside this organ zone */}
                {zoneLevels.map((lvl, idx) => {
                  const unlocked = lvl.id <= saveData.unlockedLevel;
                  const stars = saveData.starsByLevel[lvl.id] ?? 0;
                  const isCurrent = lvl.id === saveData.unlockedLevel;
                  const alignClass =
                    idx === 0
                      ? 'self-start ml-1 sm:ml-4'
                      : idx === 1
                      ? 'self-end mr-1 sm:mr-4'
                      : 'self-center';

                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        soundEngine.playUiPop();
                        onSelectLevel(lvl.id);
                      }}
                      className={`relative flex w-[84%] max-w-[295px] items-center gap-3 rounded-3xl border-3 p-3 text-left transition-transform ${alignClass} ${
                        unlocked
                          ? isCurrent
                            ? 'border-amber-300 bg-gradient-to-b from-white to-amber-50 shadow-[0_6px_0_#d97706] active:translate-y-1'
                            : `border-white bg-white/95 shadow-[0_6px_0_#0284c7] active:translate-y-1`
                          : 'cursor-not-allowed border-slate-300 bg-slate-200/90 opacity-80 shadow-[0_4px_0_#94a3b8]'
                      }`}
                    >
                      <div
                        className={`relative flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border-2 border-white text-white ${
                          unlocked
                            ? `bg-gradient-to-b ${zm.accentBg}`
                            : 'bg-slate-400'
                        }`}
                      >
                        {unlocked ? (
                          <span className="font-display text-xl font-black tabular-nums">
                            {lvl.id}
                          </span>
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-black text-slate-900 truncate">
                          {pickText(
                            saveData.settings.language,
                            lvl.nameRu,
                            lvl.nameEn,
                            lvl.nameKk
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 truncate">
                          {t.goalTitle[lvl.goal.type]}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${
                                s <= stars
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'fill-slate-200 text-slate-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-[11px] font-extrabold text-slate-500 tabular-nums">
                            {lvl.moves} {t.movesLabel}
                            {lvl.isMegaLevel ? ` · ${t.megaLevelBadge}` : ''}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
