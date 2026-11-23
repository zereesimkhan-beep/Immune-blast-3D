import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Coins,
  Crosshair,
  Flame,
  FlaskConical,
  Microscope,
  Pill,
  PlusCircle,
  Shield,
  Sparkles,
  Syringe,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { pickText, TranslationBundle } from '../i18n/translations';
import { getShopItemPrice, SHOP_ITEMS } from '../storage/saveSystem';
import { LauncherSkinId, SaveData, ShopItemDef } from '../types/game';
import { BioBackdrop } from './BioBackdrop';

interface ShopScreenProps {
  saveData: SaveData;
  t: TranslationBundle;
  onBuyItem: (item: ShopItemDef) => boolean;
  onSelectSkin: (skinId: LauncherSkinId) => void;
  onBack: () => void;
}

type ShopTab = 'skins' | 'boosters' | 'arsenal';

export const ShopScreen: React.FC<ShopScreenProps> = ({
  saveData,
  t,
  onBuyItem,
  onSelectSkin,
  onBack,
}) => {
  const [tab, setTab] = useState<ShopTab>('skins');
  const lang = saveData.settings.language;

  const skinItems = SHOP_ITEMS.filter((i) => i.category === 'skin');
  const boosterItems = SHOP_ITEMS.filter((i) => i.category === 'booster');
  const ammoItems = SHOP_ITEMS.filter((i) => i.category === 'ammo');
  const upgradeItems = SHOP_ITEMS.filter((i) => i.category === 'upgrade');

  const renderIcon = (item: ShopItemDef) => {
    if (item.skinId === 'syringe') return <Syringe className="h-7 w-7 text-sky-600" />;
    if (item.skinId === 'immune_cell') return <Shield className="h-7 w-7 text-teal-600" />;
    if (item.skinId === 'microscope') return <Microscope className="h-7 w-7 text-amber-600" />;

    if (item.boosterType === 'extraMoves') return <PlusCircle className="h-7 w-7 text-sky-600" />;
    if (item.boosterType === 'aimAssist') return <Crosshair className="h-7 w-7 text-emerald-600" />;
    if (item.boosterType === 'antisepticBomb') {
      return <FlaskConical className="h-7 w-7 text-teal-600" />;
    }

    if (item.ammoType === 'vaccine') return <Syringe className="h-7 w-7 text-teal-600" />;
    if (item.ammoType === 'antibiotic') return <Pill className="h-7 w-7 text-orange-500" />;
    if (item.ammoType === 'antiviral') return <Zap className="h-7 w-7 text-purple-600" />;
    if (item.ammoType === 'tcell') return <Sparkles className="h-7 w-7 text-amber-500" />;
    if (item.upgradeKey === 'aimGuide') return <Crosshair className="h-7 w-7 text-sky-600" />;
    if (item.upgradeKey === 'launcherPower') return <Zap className="h-7 w-7 text-rose-500" />;
    return <Flame className="h-7 w-7 text-teal-500" />;
  };

  const renderSkinCard = (item: ShopItemDef) => {
    const skinId = item.skinId!;
    const isOwned = saveData.ownedSkins.includes(skinId);
    const isEquipped = saveData.selectedSkin === skinId;
    const canAfford = saveData.coins >= item.basePrice;

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 shadow-md ${
          isEquipped
            ? 'border-emerald-400 bg-emerald-50/95'
            : 'border-white bg-white/95'
        }`}
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-sky-100 bg-sky-50">
          {renderIcon(item)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-black text-slate-900 truncate">
            {pickText(lang, item.nameRu, item.nameEn, item.nameKk)}
          </h3>
          <p className="mt-0.5 text-xs leading-snug font-semibold text-slate-600">
            {pickText(lang, item.descRu, item.descEn, item.descKk)}
          </p>
        </div>

        {isEquipped ? (
          <span className="flex min-h-[44px] min-w-[92px] shrink-0 items-center justify-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 font-display text-xs font-black text-white whitespace-nowrap">
            <Check className="h-4 w-4" />
            <span>{t.equipped}</span>
          </span>
        ) : isOwned ? (
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiPop();
              onSelectSkin(skinId);
            }}
            className="btn-cartoon-cyan flex min-h-[44px] min-w-[92px] shrink-0 items-center justify-center rounded-xl px-3 py-2 font-display text-xs font-black text-white text-stroke-dark whitespace-nowrap"
          >
            {t.equip}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAfford}
            onClick={() => {
              if (onBuyItem(item)) {
                soundEngine.playCoin();
              }
            }}
            className={`flex min-h-[46px] min-w-[92px] shrink-0 flex-col items-center justify-center rounded-xl px-3 py-1.5 font-display text-xs font-black text-white whitespace-nowrap ${
              canAfford
                ? 'btn-glossy-green text-stroke-dark'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{t.buy}</span>
            <span className="flex items-center gap-1 text-[11px] tabular-nums">
              <Coins className="h-3.5 w-3.5 text-yellow-200" />
              {item.basePrice}
            </span>
          </button>
        )}
      </div>
    );
  };

  const renderItemCard = (item: ShopItemDef) => {
    const price = getShopItemPrice(item, saveData);
    const curLevel = item.upgradeKey ? saveData.upgrades[item.upgradeKey] : 0;
    const isMaxed =
      item.category === 'upgrade' &&
      item.maxLevel !== undefined &&
      curLevel >= item.maxLevel;
    const canAfford = !isMaxed && saveData.coins >= price;

    const ownedCount =
      item.category === 'booster' && item.boosterType
        ? saveData.boosters[item.boosterType] ?? 0
        : item.ammoType
        ? saveData.ammoInventory[item.ammoType] ?? 0
        : 0;

    return (
      <div
        key={item.id}
        className="flex items-center gap-3 rounded-2xl border-2 border-white bg-white/95 p-3.5 shadow-md"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-sky-100 bg-sky-50">
          {renderIcon(item)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-black text-slate-900 truncate">
              {pickText(lang, item.nameRu, item.nameEn, item.nameKk)}
            </h3>
            {item.category === 'upgrade' ? (
              <span className="text-xs font-extrabold text-amber-600 tabular-nums whitespace-nowrap">
                {t.levelShort} {curLevel}/{item.maxLevel}
              </span>
            ) : (
              <span className="text-xs font-extrabold text-sky-700 tabular-nums whitespace-nowrap">
                {t.owned}: {ownedCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-snug font-semibold text-slate-600">
            {pickText(lang, item.descRu, item.descEn, item.descKk)}
          </p>
        </div>

        <button
          type="button"
          disabled={!canAfford || isMaxed}
          onClick={() => {
            if (onBuyItem(item)) {
              soundEngine.playCoin();
            }
          }}
          className={`flex min-h-[46px] min-w-[84px] shrink-0 flex-col items-center justify-center rounded-xl px-3 py-1.5 font-display text-xs font-black text-white whitespace-nowrap ${
            isMaxed
              ? 'bg-emerald-500 cursor-default'
              : canAfford
              ? 'btn-glossy-green text-stroke-dark'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isMaxed ? (
            <span>{t.maxed}</span>
          ) : (
            <>
              <span>{t.buy}</span>
              <span className="flex items-center gap-1 text-[11px] tabular-nums">
                <Coins className="h-3.5 w-3.5 text-yellow-200" />
                {price}
              </span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <BioBackdrop zone="gut" variant="ambient" />

      <header className="relative z-20 flex items-center justify-between gap-3 border-b-2 border-white/60 bg-amber-500/90 px-4 py-3 text-white backdrop-blur-md">
        <button
          type="button"
          onClick={() => {
            soundEngine.playUiPop();
            onBack();
          }}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-white bg-amber-600 px-3 py-2 font-display text-sm font-extrabold text-white shadow-[0_3px_0_#92400e] active:translate-y-0.5 whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.back}</span>
        </button>

        <h1 className="font-display text-lg font-black text-white text-stroke-dark">
          {t.shop}
        </h1>

        <div className="flex items-center gap-1.5 rounded-xl border-2 border-white/90 bg-slate-900/45 px-3 py-1.5 text-sm font-black tabular-nums whitespace-nowrap">
          <Coins className="h-4 w-4 text-amber-300" />
          <span>{saveData.coins}</span>
        </div>
      </header>

      {/* Shop Category Tabs */}
      <div className="relative z-10 mx-auto mt-3 w-full max-w-md px-4">
        <div className="grid grid-cols-3 gap-1 rounded-2xl border-2 border-white bg-white/85 p-1 shadow-sm backdrop-blur-sm">
          {(['skins', 'boosters', 'arsenal'] as ShopTab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                soundEngine.playUiPop();
                setTab(key);
              }}
              className={`min-h-[40px] rounded-xl px-2 py-1.5 font-display text-xs font-black transition-colors whitespace-nowrap ${
                tab === key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.shopTabs[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 pb-8">
          {tab === 'skins' && (
            <section className="flex flex-col gap-2.5">
              <h2 className="font-display text-base font-black text-slate-900">
                {t.shopCategories.skins}
              </h2>
              {skinItems.map(renderSkinCard)}
            </section>
          )}

          {tab === 'boosters' && (
            <section className="flex flex-col gap-2.5">
              <h2 className="font-display text-base font-black text-slate-900">
                {t.shopCategories.boosters}
              </h2>
              {boosterItems.map(renderItemCard)}
            </section>
          )}

          {tab === 'arsenal' && (
            <>
              <section className="flex flex-col gap-2.5">
                <h2 className="font-display text-base font-black text-slate-900">
                  {t.shopCategories.ammo}
                </h2>
                {ammoItems.map(renderItemCard)}
              </section>

              <section className="flex flex-col gap-2.5">
                <h2 className="font-display text-base font-black text-slate-900">
                  {t.shopCategories.upgrades}
                </h2>
                {upgradeItems.map(renderItemCard)}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
