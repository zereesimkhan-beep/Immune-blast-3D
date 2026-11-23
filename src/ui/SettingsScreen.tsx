import React, { useState } from 'react';
import {
  ArrowLeft,
  Globe,
  Music,
  Smartphone,
  Trash2,
  Vibrate,
  Volume2,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { TranslationBundle } from '../i18n/translations';
import { GameSettings, LanguageCode } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface SettingsScreenProps {
  settings: GameSettings;
  t: TranslationBundle;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  t,
  onUpdateSettings,
  onResetProgress,
  onBack,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleSwitch = (active: boolean) => (
    <span
      className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
        active ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <BioBackdrop zone="blood" variant="ambient" />

      <header className="relative z-20 flex items-center justify-between gap-3 border-b-2 border-white/60 bg-rose-600/90 px-4 py-3 text-white backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiPop();
            onBack();
          }}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-white bg-rose-700 px-3 py-2 font-display text-sm font-extrabold text-white shadow-[0_3px_0_#881337] active:translate-y-0.5 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back}</span>
        </button>

        <h1 className="font-display text-lg font-black text-white text-stroke-dark">
          {t.settings}
        </h1>

        <div className="w-[74px]" />
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3.5 pb-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 shadow-md">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-sky-600" />
              <span className="font-display text-sm font-black text-slate-900">
                {t.settingsLabels.language}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
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
                    onUpdateSettings({ language: code });
                  }}
                  className={`min-h-[36px] rounded-lg px-2.5 py-1 font-display text-xs font-black transition-colors ${
                    settings.language === code
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !settings.soundEnabled;
              onUpdateSettings({ soundEnabled: next });
              if (next) soundEngine.playUiPop();
            }}
            className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 text-left shadow-md"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-emerald-600" />
              <span className="font-display text-sm font-black text-slate-900">
                {t.settingsLabels.sound}
              </span>
            </div>
            {toggleSwitch(settings.soundEnabled)}
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !settings.musicEnabled;
              onUpdateSettings({ musicEnabled: next });
              soundEngine.playUiPop();
            }}
            className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 text-left shadow-md"
          >
            <div className="flex items-center gap-3">
              <Music className="h-5 w-5 text-sky-600" />
              <span className="font-display text-sm font-black text-slate-900">
                {t.settingsLabels.music}
              </span>
            </div>
            {toggleSwitch(settings.musicEnabled)}
          </button>

          <div className="flex flex-col gap-2 rounded-2xl border-2 border-white bg-white/95 p-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-black text-slate-900">
                {t.settingsLabels.volume}
              </span>
              <span className="text-xs font-black text-sky-700 tabular-nums">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(e) =>
                onUpdateSettings({ volume: Number(e.target.value) / 100 })
              }
              className="h-2.5 w-full cursor-pointer accent-sky-600"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiPop();
              onUpdateSettings({ cameraShake: !settings.cameraShake });
            }}
            className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 text-left shadow-md"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-amber-600" />
              <span className="font-display text-sm font-black text-slate-900">
                {t.settingsLabels.cameraShake}
              </span>
            </div>
            {toggleSwitch(settings.cameraShake)}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiPop();
              onUpdateSettings({ haptics: !settings.haptics });
            }}
            className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl border-2 border-white bg-white/95 p-4 text-left shadow-md"
          >
            <div className="flex items-center gap-3">
              <Vibrate className="h-5 w-5 text-purple-600" />
              <span className="font-display text-sm font-black text-slate-900">
                {t.settingsLabels.haptics}
              </span>
            </div>
            {toggleSwitch(settings.haptics)}
          </button>

          <div className="mt-2 rounded-2xl border-2 border-rose-200 bg-white/95 p-4 shadow-md">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playUiPop();
                  setConfirmReset(true);
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 font-display text-sm font-black text-rose-600 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t.settingsLabels.resetProgress}</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-center text-xs font-bold text-slate-700">
                  {t.settingsLabels.resetConfirm}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[44px] rounded-xl bg-slate-200 px-3 py-2 font-display text-xs font-black text-slate-800"
                  >
                    {t.settingsLabels.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playUiPop();
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="min-h-[44px] rounded-xl bg-rose-600 px-3 py-2 font-display text-xs font-black text-white"
                  >
                    {t.settingsLabels.confirmYes}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
