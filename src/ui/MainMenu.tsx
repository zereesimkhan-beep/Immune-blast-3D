import React from 'react';
import {
  Award,
  BookOpen,
  Coins,
  Gift,
  Map,
  Play,
  Settings,
  ShoppingBag,
  Star,
  Trophy,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { TranslationBundle } from '../i18n/translations';
import { getTotalLevelCount } from '../levels/levelLoader';
import { canClaimDailyVitamin, getTotalStars } from '../storage/saveSystem';
import { LanguageCode, SaveData, ScreenRoute } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface MainMenuProps {
  saveData: SaveData;
  t: TranslationBundle;
  onPlayNow: () => void;
  onNavigate: (route: ScreenRoute) => void;
  onOpenDailyVitamin: () => void;
  onChangeLanguage: (lang: LanguageCode) => void;
  claimableAchievementsCount: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  t,
  onPlayNow,
  onNavigate,
  onOpenDailyVitamin,
  onChangeLanguage,
  claimableAchievementsCount,
}) => {
  const totalLevels = getTotalLevelCount();
  const totalStars = getTotalStars(saveData);
  const maxStars = totalLevels * 3;
  const dailyReady = canClaimDailyVitamin(saveData);

  const nav = (route: ScreenRoute) => {
    soundEngine.playUiPop();
    onNavigate(route);
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between overflow-y-auto px-4 py-4">
      <BioBackdrop zone="lungs" variant="menu" />

      {/* Top Resource & Quick Language Bar */}
      <header className="relative z-10 flex w-full max-w-md items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-white bg-slate-900/65 px-3 py-2 text-white backdrop-blur-sm">
          <Coins className="h-4 w-4 text-amber-300" />
          <span className="font-display text-sm font-black tabular-nums">
            {saveData.coins}
          </span>
        </div>

        {/* Instant 3-Language Switcher */}
        <div className="flex items-center gap-0.5 rounded-2xl border-2 border-white bg-white/85 p-1 backdrop-blur-sm shadow-sm">
          {([
            { code: 'ru', label: 'РУС' },
            { code: 'kk', label: 'ҚАЗ' },
            { code: 'en', label: 'ENG' },
          ] as Array<{ code: LanguageCode; label: string }>).map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                soundEngine.playUiPop();
                onChangeLanguage(code);
              }}
              className={`min-h-[34px] rounded-xl px-2 py-1 font-display text-[11px] font-black transition-colors whitespace-nowrap ${
                saveData.settings.language === code
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-white bg-slate-900/65 px-3 py-2 text-white backdrop-blur-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-300" />
          <span className="font-display text-sm font-black tabular-nums">
            {totalStars}/{maxStars}
          </span>
        </div>
      </header>

      {/* Center Hero Title + Emblem + Primary Play + Daily Vitamin */}
      <main className="relative z-10 my-auto flex w-full max-w-md flex-col items-center py-2">
        <div className="animate-float-slow mb-1 flex items-center justify-center">
          <svg
            viewBox="0 0 180 140"
            className="h-28 w-36 drop-shadow-[0_10px_14px_rgba(12,74,110,0.28)] sm:h-32 sm:w-40"
            aria-hidden="true"
          >
            <rect
              x="60"
              y="26"
              width="60"
              height="56"
              rx="12"
              fill="#facc15"
              stroke="#92400e"
              strokeWidth="4"
            />
            <path
              d="M84 38 H96 V48 H106 V60 H96 V70 H84 V60 H74 V48 H84 Z"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2.5"
            />

            <circle cx="38" cy="70" r="20" fill="#fb7185" stroke="#9f1239" strokeWidth="3" />
            <circle cx="32" cy="67" r="4" fill="#ffffff" />
            <circle cx="44" cy="67" r="4" fill="#ffffff" />
            <circle cx="32" cy="67" r="1.8" fill="#0f172a" />
            <circle cx="44" cy="67" r="1.8" fill="#0f172a" />

            <rect
              x="122"
              y="52"
              width="36"
              height="40"
              rx="10"
              fill="#4ade80"
              stroke="#14532d"
              strokeWidth="3"
            />
            <circle cx="133" cy="68" r="3.8" fill="#ffffff" />
            <circle cx="147" cy="68" r="3.8" fill="#ffffff" />
            <circle cx="133" cy="68" r="1.7" fill="#0f172a" />
            <circle cx="147" cy="68" r="1.7" fill="#0f172a" />

            <rect
              x="14"
              y="92"
              width="152"
              height="14"
              rx="6"
              fill="#a5f3fc"
              stroke="#0284c7"
              strokeWidth="3"
            />
            <rect x="20" y="95" width="140" height="5" rx="2" fill="#a7f3d0" />

            <polygon
              points="78,106 102,106 112,134 68,134"
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth="3"
            />
          </svg>
        </div>

        <h1 className="font-display text-center text-4xl font-black tracking-tight text-white text-stroke-title sm:text-5xl text-balance">
          Immune Blast
        </h1>

        <p className="mt-1 text-center text-xs font-extrabold text-sky-950/90">
          {t.zoneProgress(saveData.unlockedLevel, totalLevels)}
        </p>

        {/* Primary Green Glossy Play CTA */}
        <div className="mt-4 flex w-full flex-col gap-2.5 px-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiPop();
              onPlayNow();
            }}
            className="btn-glossy-green flex min-h-[58px] w-full items-center justify-center gap-3 rounded-3xl px-8 py-3.5 font-display text-2xl font-black tracking-wide text-white text-stroke-dark whitespace-nowrap"
          >
            <Play className="h-7 w-7 fill-white" />
            <span>{t.playNow}</span>
          </button>

          {/* Daily Vitamin ("Витамин дня") Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiPop();
              onOpenDailyVitamin();
            }}
            className={`flex min-h-[48px] w-full items-center justify-between rounded-2xl border-2 px-4 py-2 font-display text-sm font-black transition-transform active:translate-y-0.5 ${
              dailyReady
                ? 'border-amber-200 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-[0_4px_0_#b45309]'
                : 'border-white bg-white/90 text-slate-800 shadow-sm'
            }`}
          >
            <span className="flex items-center gap-2">
              <Gift className={`h-5 w-5 ${dailyReady ? 'text-white' : 'text-amber-500'}`} />
              <span>{t.dailyVitamin.buttonLabel}</span>
            </span>
            <span
              className={`text-xs font-extrabold whitespace-nowrap ${
                dailyReady ? 'text-yellow-100' : 'text-emerald-600'
              }`}
            >
              {dailyReady
                ? t.dailyVitamin.readyBadge
                : t.dailyVitamin.claimedTodayBadge}
            </span>
          </button>
        </div>

        {/* 6 Navigation Buttons */}
        <div className="mt-3.5 grid w-full grid-cols-2 gap-2.5 px-2">
          <button
            type="button"
            onClick={() => nav('map')}
            className="btn-cartoon-cyan flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
          >
            <Map className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.bodyMap}</span>
          </button>

          <button
            type="button"
            onClick={() => nav('shop')}
            className="btn-cartoon-amber flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
          >
            <ShoppingBag className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.shop}</span>
          </button>

          <button
            type="button"
            onClick={() => nav('encyclopedia')}
            className="btn-cartoon-teal flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
          >
            <BookOpen className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.encyclopedia}</span>
          </button>

          <button
            type="button"
            onClick={() => nav('achievements')}
            className="btn-cartoon-cyan relative flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
          >
            <Award className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.achievements}</span>
            {claimableAchievementsCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[11px] font-black text-white tabular-nums">
                {claimableAchievementsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => nav('leaderboard')}
            className="btn-cartoon-teal flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
          >
            <Trophy className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.leaderboard}</span>
          </button>

          <button
            type="button"
            onClick={() => nav('settings')}
            className="btn-cartoon-rose flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-3 py-2.5 font-display text-sm font-extrabold text-white text-stroke-dark whitespace-nowrap"
          >
            <Settings className="h-5 w-5 shrink-0" />
            <span className="truncate">{t.settings}</span>
          </button>
        </div>
      </main>

      <div className="relative z-10 h-1" />
    </div>
  );
};
