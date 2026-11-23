import React from 'react';
import { ArrowLeft, Award, CheckCircle2, Coins } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { pickText, TranslationBundle } from '../i18n/translations';
import { ACHIEVEMENTS } from '../storage/saveSystem';
import { SaveData } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface AchievementsScreenProps {
  saveData: SaveData;
  t: TranslationBundle;
  onClaimReward: (achievementId: string) => void;
  onBack: () => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  saveData,
  t,
  onClaimReward,
  onBack,
}) => {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <BioBackdrop zone="throat" variant="ambient" />

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

        <h1 className="font-display text-lg font-black text-white text-stroke-dark">
          {t.achievements}
        </h1>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/90 bg-slate-900/45 px-3 py-1.5 text-sm font-black tabular-nums whitespace-nowrap">
          <Coins className="h-4 w-4 text-amber-300" />
          <span>{saveData.coins}</span>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 pb-8">
          {ACHIEVEMENTS.map((ach) => {
            const rawProgress = ach.getProgress(saveData);
            const clamped = Math.min(ach.target, rawProgress);
            const pct = Math.round((clamped / ach.target) * 100);
            const isClaimed = saveData.claimedAchievements.includes(ach.id);
            const isReady = clamped >= ach.target && !isClaimed;

            return (
              <div
                key={ach.id}
                className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white/95 p-3.5 shadow-md"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    isClaimed
                      ? 'bg-emerald-100 text-emerald-600'
                      : isReady
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isClaimed ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : (
                    <Award className="h-7 w-7" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-black text-slate-900 truncate">
                      {pickText(
                        saveData.settings.language,
                        ach.titleRu,
                        ach.titleEn,
                        ach.titleKk
                      )}
                    </h3>
                    <span className="text-xs font-extrabold text-slate-500 tabular-nums whitespace-nowrap">
                      {clamped} / {ach.target}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">
                    {pickText(
                      saveData.settings.language,
                      ach.descRu,
                      ach.descEn,
                      ach.descKk
                    )}
                  </p>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isClaimed || isReady ? 'bg-emerald-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!isReady}
                  onClick={() => {
                    soundEngine.playCoin();
                    onClaimReward(ach.id);
                  }}
                  className={`flex min-h-[44px] min-w-[78px] shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-1.5 font-display text-xs font-black whitespace-nowrap ${
                    isReady
                      ? 'btn-glossy-green text-white text-stroke-dark'
                      : isClaimed
                      ? 'bg-emerald-100 text-emerald-700 cursor-default'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isClaimed ? (
                    <span>{t.claimed}</span>
                  ) : (
                    <>
                      <span>{isReady ? t.claim : t.reward}</span>
                      <span className="flex items-center gap-1 text-[11px] tabular-nums">
                        <Coins className="h-3 w-3" />+{ach.rewardCoins}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
