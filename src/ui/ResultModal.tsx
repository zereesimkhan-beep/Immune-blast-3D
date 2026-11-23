import React from 'react';
import { BookOpen, Coins, Map, Play, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import { pickText, TranslationBundle } from '../i18n/translations';
import { EXTRA_MOVES_COST } from '../storage/saveSystem';
import { LanguageCode, MedicalFactDef } from '../types/game';

interface ResultModalProps {
  mode: 'won' | 'lost' | 'paused';
  stars: number;
  score: number;
  coinsEarned: number;
  playerCoins: number;
  hasNextLevel: boolean;
  fact?: MedicalFactDef;
  language: LanguageCode;
  t: TranslationBundle;
  onRetry: () => void;
  onNextLevel: () => void;
  onBuyExtraMoves: () => void;
  onExitToMap: () => void;
  onResume: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  mode,
  stars,
  score,
  coinsEarned,
  playerCoins,
  hasNextLevel,
  fact,
  language,
  t,
  onRetry,
  onNextLevel,
  onBuyExtraMoves,
  onExitToMap,
  onResume,
}) => {
  const canAffordExtraMoves = playerCoins >= EXTRA_MOVES_COST;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-auto w-full max-w-sm rounded-3xl border-4 border-white bg-gradient-to-b from-sky-50 to-cyan-50 p-5 text-slate-900 shadow-2xl">
        {/* Header Ribbon */}
        <div
          className={`mx-auto -mt-11 mb-3 w-fit rounded-2xl border-3 border-white px-5 py-2 shadow-lg ${
            mode === 'won'
              ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
              : mode === 'lost'
              ? 'bg-gradient-to-b from-rose-400 to-rose-600'
              : 'bg-gradient-to-b from-sky-400 to-cyan-600'
          }`}
        >
          <h2 className="font-display text-xl font-black tracking-tight text-white text-stroke-dark whitespace-nowrap">
            {mode === 'won'
              ? t.infectionCleared
              : mode === 'lost'
              ? t.defeatTitle
              : t.pause}
          </h2>
        </div>

        {/* Stars on victory */}
        {mode === 'won' && (
          <div className="mb-3 flex items-center justify-center gap-3 py-1">
            {[1, 2, 3].map((idx) => {
              const earned = idx <= stars;
              return (
                <div
                  key={idx}
                  className={idx === 2 ? '-translate-y-1.5 scale-115' : ''}
                >
                  <Star
                    className={`h-11 w-11 ${
                      earned
                        ? 'fill-amber-400 text-amber-600 drop-shadow-[0_3px_0_rgba(146,64,14,0.5)]'
                        : 'fill-slate-200 text-slate-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {mode === 'lost' && (
          <p className="mb-4 text-center text-sm font-bold text-slate-600">
            {t.defeatSubtitle}
          </p>
        )}

        {/* Score & Reward summary */}
        {mode !== 'paused' && (
          <div className="mb-3.5 grid grid-cols-2 gap-3 rounded-2xl border-2 border-cyan-200 bg-white p-3 shadow-inner">
            <div className="text-center">
              <div className="text-[11px] font-extrabold text-slate-500">{t.score}</div>
              <div className="font-display text-xl font-black text-sky-700 tabular-nums">
                {score}
              </div>
            </div>
            <div className="border-l-2 border-cyan-100 text-center">
              <div className="text-[11px] font-extrabold text-slate-500">
                {mode === 'won' ? t.reward : t.coins}
              </div>
              <div className="flex items-center justify-center gap-1.5 font-display text-xl font-black text-amber-600 tabular-nums">
                <Coins className="h-5 w-5 text-amber-500" />
                <span>{mode === 'won' ? `+${coinsEarned}` : playerCoins}</span>
              </div>
            </div>
          </div>
        )}

        {/* Educational "Did You Know?" Card after Victory */}
        {mode === 'won' && fact && (
          <div className="mb-4 rounded-2xl border-2 border-teal-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black text-teal-700">
              <BookOpen className="h-4 w-4 shrink-0 text-teal-600" />
              <span>{t.interestingFactHeader}</span>
            </div>
            <h3 className="mt-1 font-display text-sm font-black text-slate-900">
              {pickText(language, fact.titleRu, fact.titleEn, fact.titleKk)}
            </h3>
            <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-600">
              {pickText(language, fact.factRu, fact.factEn, fact.factKk)}
            </p>
            <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-teal-50 p-2 text-[11px] font-extrabold text-teal-800">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
              <span>{pickText(language, fact.takeawayRu, fact.takeawayEn, fact.takeawayKk)}</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          {mode === 'won' && hasNextLevel && (
            <button
              type="button"
              onClick={onNextLevel}
              className="btn-glossy-green flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-display text-base font-black text-white text-stroke-dark whitespace-nowrap"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>{t.nextLevel}</span>
            </button>
          )}

          {mode === 'lost' && (
            <button
              type="button"
              disabled={!canAffordExtraMoves}
              onClick={onBuyExtraMoves}
              className={`flex min-h-[48px] w-full items-center justify-between rounded-2xl px-5 py-2.5 font-display text-base font-black text-white whitespace-nowrap ${
                canAffordExtraMoves
                  ? 'btn-cartoon-amber text-stroke-dark'
                  : 'cursor-not-allowed border-2 border-slate-300 bg-slate-300 text-slate-500'
              }`}
            >
              <span>{t.plusThreeMoves}</span>
              <span className="flex items-center gap-1 rounded-xl bg-black/20 px-2.5 py-1 text-sm tabular-nums">
                <Coins className="h-4 w-4 text-yellow-200" />
                {EXTRA_MOVES_COST}
              </span>
            </button>
          )}

          {mode === 'paused' && (
            <button
              type="button"
              onClick={onResume}
              className="btn-glossy-green flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-display text-base font-black text-white text-stroke-dark whitespace-nowrap"
            >
              <Play className="h-5 w-5 fill-white" />
              <span>{t.resume}</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onRetry}
              className="btn-cartoon-cyan flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-4 py-2 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{mode === 'paused' ? t.restart : t.retry}</span>
            </button>

            <button
              type="button"
              onClick={onExitToMap}
              className="btn-cartoon-rose flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-4 py-2 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
            >
              <Map className="h-4 w-4" />
              <span>{t.toMap}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
