import React from 'react';
import { Check, Coins, Gift, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { pickText, TranslationBundle } from '../i18n/translations';
import {
  canClaimDailyVitamin,
  DAILY_VITAMIN_REWARDS,
  getNextDailyStreak,
} from '../storage/saveSystem';
import { SaveData } from '../types/game';

interface DailyVitaminModalProps {
  saveData: SaveData;
  t: TranslationBundle;
  onClaim: () => void;
  onClose: () => void;
}

export const DailyVitaminModal: React.FC<DailyVitaminModalProps> = ({
  saveData,
  t,
  onClaim,
  onClose,
}) => {
  const canClaim = canClaimDailyVitamin(saveData);
  const nextStreakDay = getNextDailyStreak(saveData);
  const lang = saveData.settings.language;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-auto w-full max-w-md rounded-3xl border-4 border-white bg-gradient-to-b from-amber-50 via-white to-emerald-50 p-5 text-slate-900 shadow-2xl">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiPop();
            onClose();
          }}
          aria-label={t.settingsLabels.cancel}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Vitamin Capsule Hero Icon */}
        <div className="mx-auto -mt-10 mb-2 flex h-18 w-18 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Gift className="h-9 w-9 text-white" />
        </div>

        <h2 className="font-display text-center text-2xl font-black text-slate-900">
          {t.dailyVitamin.title}
        </h2>
        <p className="mt-1 text-center text-xs font-semibold text-slate-600">
          {t.dailyVitamin.subtitle}
        </p>

        <div className="mt-2 text-center text-xs font-black text-amber-700">
          {t.dailyVitamin.streakLabel(saveData.dailyReward.streak)}
        </div>

        {/* 7-day Vitamin Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {DAILY_VITAMIN_REWARDS.map((reward) => {
            const isTargetToday = canClaim && reward.day === nextStreakDay;
            const isPastClaimed = canClaim
              ? reward.day < nextStreakDay
              : reward.day <= saveData.dailyReward.streak;
            const isDay7 = reward.day === 7;

            return (
              <div
                key={reward.day}
                className={`relative flex flex-col items-center justify-between rounded-2xl border-2 p-2.5 text-center ${
                  isDay7 ? 'col-span-2' : ''
                } ${
                  isTargetToday
                    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 shadow-md'
                    : isPastClaimed
                    ? 'border-emerald-300 bg-emerald-50/90'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex w-full items-center justify-between text-[11px] font-black text-slate-500">
                  <span>{t.dailyVitamin.dayLabel(reward.day)}</span>
                  {isPastClaimed && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  {isTargetToday && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                </div>

                <div className="my-1.5 flex items-center justify-center gap-1 font-display text-base font-black text-amber-600 tabular-nums">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span>+{reward.coins}</span>
                </div>

                <div className="text-[10px] leading-tight font-bold text-slate-700">
                  {pickText(lang, reward.labelRu, reward.labelEn, reward.labelKk)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          {canClaim ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playDailyReward();
                onClaim();
              }}
              className="btn-glossy-green flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 font-display text-lg font-black text-white text-stroke-dark whitespace-nowrap"
            >
              <Gift className="h-5 w-5" />
              <span>{t.dailyVitamin.claimButton}</span>
            </button>
          ) : (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-xs font-extrabold text-emerald-800">
              {t.dailyVitamin.comeBackTomorrow}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
