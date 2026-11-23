import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Bug,
  Cross,
  FlaskConical,
  Lock,
  Pill,
  Shield,
  ShieldAlert,
  Sparkles,
  Syringe,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  ENCYCLOPEDIA_AMMO,
  ENCYCLOPEDIA_ENEMIES,
  MEDICAL_FACTS,
} from '../facts/medicalFacts';
import { pickText, TranslationBundle } from '../i18n/translations';
import { BlockType, ProjectileType, SaveData } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface EncyclopediaScreenProps {
  saveData: SaveData;
  t: TranslationBundle;
  onBack: () => void;
}

type EncyclopediaTab = 'facts' | 'enemies' | 'ammo';

export const EncyclopediaScreen: React.FC<EncyclopediaScreenProps> = ({
  saveData,
  t,
  onBack,
}) => {
  const [tab, setTab] = useState<EncyclopediaTab>('facts');
  const lang = saveData.settings.language;

  const enemyIcon = (type: BlockType) => {
    if (type === 'target') return <Cross className="h-6 w-6 text-amber-600" />;
    if (type === 'resistant') return <ShieldAlert className="h-6 w-6 text-sky-600" />;
    return <Bug className="h-6 w-6 text-rose-500" />;
  };

  const ammoIcon = (type: ProjectileType) => {
    if (type === 'vaccine') return <Syringe className="h-6 w-6 text-teal-600" />;
    if (type === 'antibiotic') return <Pill className="h-6 w-6 text-orange-500" />;
    if (type === 'antiviral') return <Zap className="h-6 w-6 text-purple-600" />;
    if (type === 'tcell') return <Sparkles className="h-6 w-6 text-amber-500" />;
    if (type === 'antiseptic') return <FlaskConical className="h-6 w-6 text-emerald-600" />;
    return <Shield className="h-6 w-6 text-sky-600" />;
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <BioBackdrop zone="lungs" variant="ambient" />

      <header className="relative z-20 flex items-center justify-between gap-3 border-b-2 border-white/60 bg-teal-600/90 px-4 py-3 text-white backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiPop();
            onBack();
          }}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-white bg-teal-700 px-3 py-2 font-display text-sm font-extrabold text-white shadow-[0_3px_0_#134e4a] active:translate-y-0.5 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back}</span>
        </button>

        <h1 className="font-display text-lg font-black text-white text-stroke-dark">
          {t.encyclopedia}
        </h1>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/80 bg-slate-900/40 px-3 py-1.5 text-xs font-black tabular-nums whitespace-nowrap">
          <BookOpen className="h-4 w-4 text-teal-200" />
          <span>
            {saveData.unlockedFacts.length}/{MEDICAL_FACTS.length}
          </span>
        </div>
      </header>

      <div className="relative z-10 mx-auto mt-3 w-full max-w-md px-4">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border-2 border-white bg-white/80 p-1 shadow-sm backdrop-blur-sm">
          {(['facts', 'enemies', 'ammo'] as EncyclopediaTab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                soundEngine.playUiPop();
                setTab(key);
              }}
              className={`min-h-[40px] rounded-xl px-2 py-1.5 font-display text-xs font-black transition-colors whitespace-nowrap ${
                tab === key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.encyclopediaTabs[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 pb-8">
          {tab === 'facts' &&
            MEDICAL_FACTS.map((fact) => {
              const unlocked =
                saveData.unlockedFacts.includes(fact.levelId) ||
                (saveData.starsByLevel[fact.levelId] ?? 0) > 0;

              return (
                <div
                  key={fact.levelId}
                  className={`rounded-2xl border-2 p-4 shadow-sm ${
                    unlocked
                      ? 'border-white bg-white/95'
                      : 'border-slate-200 bg-slate-100/85 opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-teal-700">
                    <span>
                      {t.levelWord} {fact.levelId} · {t.organNames[fact.organZone]}
                    </span>
                    {!unlocked && <Lock className="h-4 w-4 text-slate-400" />}
                  </div>

                  {unlocked ? (
                    <>
                      <h3 className="mt-1 font-display text-base font-black text-slate-900">
                        {pickText(lang, fact.titleRu, fact.titleEn, fact.titleKk)}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed font-semibold text-slate-600">
                        {pickText(lang, fact.factRu, fact.factEn, fact.factKk)}
                      </p>
                      <div className="mt-2 rounded-xl bg-teal-50 px-3 py-2 text-[11px] font-extrabold text-teal-800">
                        {pickText(lang, fact.takeawayRu, fact.takeawayEn, fact.takeawayKk)}
                      </div>
                    </>
                  ) : (
                    <p className="mt-1.5 text-xs font-bold text-slate-500">
                      {t.factLockedHint(fact.levelId)}
                    </p>
                  )}
                </div>
              );
            })}

          {tab === 'enemies' &&
            ENCYCLOPEDIA_ENEMIES.map((enemy) => (
              <div
                key={enemy.type}
                className="flex items-start gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                  {enemyIcon(enemy.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-black text-slate-900">
                      {pickText(lang, enemy.nameRu, enemy.nameEn, enemy.nameKk)}
                    </h3>
                    <span className="text-[11px] font-extrabold text-sky-700 whitespace-nowrap">
                      {pickText(lang, enemy.toughnessRu, enemy.toughnessEn, enemy.toughnessKk)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-600">
                    {pickText(lang, enemy.descRu, enemy.descEn, enemy.descKk)}
                  </p>
                  <p className="mt-1.5 text-xs font-extrabold text-rose-700">
                    {t.enemyWeaknessLabel}{' '}
                    <span className="font-bold text-slate-700">
                      {pickText(lang, enemy.weaknessRu, enemy.weaknessEn, enemy.weaknessKk)}
                    </span>
                  </p>
                </div>
              </div>
            ))}

          {tab === 'ammo' &&
            ENCYCLOPEDIA_AMMO.map((ammo) => (
              <div
                key={ammo.type}
                className="flex items-start gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50">
                  {ammoIcon(ammo.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-black text-slate-900">
                    {pickText(lang, ammo.nameRu, ammo.nameEn, ammo.nameKk)}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed font-semibold text-slate-600">
                    {pickText(lang, ammo.descRu, ammo.descEn, ammo.descKk)}
                  </p>
                  <div className="mt-2 flex flex-col gap-1 text-xs">
                    <div className="font-extrabold text-emerald-700">
                      {t.ammoStrongLabel}{' '}
                      <span className="font-bold text-slate-700">
                        {pickText(lang, ammo.strongRu, ammo.strongEn, ammo.strongKk)}
                      </span>
                    </div>
                    <div className="font-extrabold text-amber-700">
                      {t.ammoWeakLabel}{' '}
                      <span className="font-bold text-slate-700">
                        {pickText(lang, ammo.weakRu, ammo.weakEn, ammo.weakKk)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
