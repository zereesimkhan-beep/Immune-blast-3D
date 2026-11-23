import React, { useState } from 'react';
import { ArrowLeft, Check, Medal, Star, Trophy, User } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { pickText, TranslationBundle } from '../i18n/translations';
import { getAllLevels } from '../levels/levelLoader';
import { getTotalBestScore, getTotalStars } from '../storage/saveSystem';
import { SaveData } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface LeaderboardScreenProps {
  saveData: SaveData;
  t: TranslationBundle;
  onUpdatePlayerName: (name: string) => void;
  onBack: () => void;
}

type LeaderboardTab = 'hall' | 'levels';

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  saveData,
  t,
  onUpdatePlayerName,
  onBack,
}) => {
  const [tab, setTab] = useState<LeaderboardTab>('hall');
  const [nameInput, setNameInput] = useState(saveData.playerName);
  const [savedNotice, setSavedNotice] = useState(false);

  const levels = getAllLevels();
  const totalBestScore = getTotalBestScore(saveData);
  const totalStars = getTotalStars(saveData);
  const levelsCleared = Object.keys(saveData.starsByLevel).length;
  const lang = saveData.settings.language;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playUiPop();
    const trimmed = nameInput.trim();
    if (trimmed.length > 0) {
      onUpdatePlayerName(trimmed);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 1600);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <BioBackdrop zone="lymph" variant="ambient" />

      <header className="relative z-20 flex items-center justify-between gap-3 border-b-2 border-white/60 bg-indigo-600/90 px-4 py-3 text-white backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiPop();
            onBack();
          }}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-white bg-indigo-700 px-3 py-2 font-display text-sm font-extrabold text-white shadow-[0_3px_0_#312e81] active:translate-y-0.5 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back}</span>
        </button>

        <h1 className="font-display text-lg font-black text-white text-stroke-dark truncate">
          {t.leaderboardLabels.title}
        </h1>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/85 bg-slate-900/45 px-3 py-1.5 text-xs font-black tabular-nums whitespace-nowrap">
          <Trophy className="h-4 w-4 text-amber-300" />
          <span>{totalBestScore}</span>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3.5 pb-8">
          {/* Player Name Input Card */}
          <form
            onSubmit={handleSaveName}
            className="flex items-center gap-2 rounded-2xl border-2 border-white bg-white/95 p-3 shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor="player-name-input"
                className="block text-[11px] font-extrabold text-slate-500"
              >
                {t.leaderboardLabels.playerNameLabel}
              </label>
              <input
                id="player-name-input"
                type="text"
                maxLength={18}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-transparent font-display text-sm font-black text-slate-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="flex min-h-[40px] shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 font-display text-xs font-black text-white hover:bg-indigo-700 whitespace-nowrap"
            >
              {savedNotice ? (
                <Check className="h-4 w-4 text-emerald-300" />
              ) : (
                <span>{t.leaderboardLabels.saveName}</span>
              )}
            </button>
          </form>

          {/* 3-Column Summary Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border-2 border-white bg-white/95 p-3 text-center shadow-sm">
              <div className="text-[11px] font-extrabold text-slate-500">
                {t.leaderboardLabels.totalScore}
              </div>
              <div className="mt-0.5 font-display text-lg font-black text-indigo-700 tabular-nums">
                {totalBestScore}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-white bg-white/95 p-3 text-center shadow-sm">
              <div className="text-[11px] font-extrabold text-slate-500">
                {t.leaderboardLabels.totalStars}
              </div>
              <div className="mt-0.5 font-display text-lg font-black text-amber-600 tabular-nums">
                {totalStars}/{levels.length * 3}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-white bg-white/95 p-3 text-center shadow-sm">
              <div className="text-[11px] font-extrabold text-slate-500">
                {t.leaderboardLabels.levelsCleared}
              </div>
              <div className="mt-0.5 font-display text-lg font-black text-emerald-600 tabular-nums">
                {levelsCleared}/{levels.length}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border-2 border-white bg-white/85 p-1 shadow-sm">
            {([
              { key: 'hall', label: t.leaderboardLabels.tabHallOfFame },
              { key: 'levels', label: t.leaderboardLabels.tabByLevel },
            ] as Array<{ key: LeaderboardTab; label: string }>).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  soundEngine.playUiPop();
                  setTab(key);
                }}
                className={`min-h-[40px] rounded-xl px-3 py-1.5 font-display text-xs font-black transition-colors whitespace-nowrap ${
                  tab === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Hall of Fame List */}
          {tab === 'hall' && (
            <div className="flex flex-col gap-2">
              {saveData.leaderboard.length === 0 ? (
                <div className="rounded-2xl border-2 border-white bg-white/95 p-6 text-center text-xs font-bold text-slate-600 shadow-sm">
                  {t.leaderboardLabels.emptyHall}
                </div>
              ) : (
                saveData.leaderboard.map((entry, idx) => {
                  const lvl = levels.find((l) => l.id === entry.levelId);
                  const medalColor =
                    idx === 0
                      ? 'bg-amber-100 text-amber-600'
                      : idx === 1
                      ? 'bg-slate-200 text-slate-600'
                      : idx === 2
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-indigo-50 text-indigo-600';

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white/95 p-3 shadow-sm"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black tabular-nums ${medalColor}`}
                      >
                        {idx < 3 ? <Medal className="h-5 w-5" /> : `#${idx + 1}`}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-black text-slate-900 truncate">
                          {entry.playerName}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 truncate">
                          {t.levelWord} {entry.levelId}
                          {lvl
                            ? ` · ${pickText(lang, lvl.nameRu, lvl.nameEn, lvl.nameKk)}`
                            : ''}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-display text-base font-black text-indigo-700 tabular-nums">
                          {entry.score}
                        </div>
                        <div className="flex items-center justify-end gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= entry.stars
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'fill-slate-200 text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Best Score Per Level */}
          {tab === 'levels' && (
            <div className="flex flex-col gap-2">
              {levels.map((lvl) => {
                const bestScore = saveData.bestScoreByLevel[lvl.id] ?? 0;
                const stars = saveData.starsByLevel[lvl.id] ?? 0;

                return (
                  <div
                    key={lvl.id}
                    className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white/95 p-3 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-display text-sm font-black text-sky-700 tabular-nums">
                      {lvl.id}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-black text-slate-900 truncate">
                        {pickText(lang, lvl.nameRu, lvl.nameEn, lvl.nameKk)}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {t.organNames[lvl.organZone]}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-display text-sm font-black text-slate-900 tabular-nums">
                        {bestScore > 0 ? `${t.leaderboardLabels.bestPrefix} ${bestScore}` : '—'}
                      </div>
                      <div className="mt-0.5 flex items-center justify-end gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= stars
                                ? 'fill-amber-400 text-amber-500'
                                : 'fill-slate-200 text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
