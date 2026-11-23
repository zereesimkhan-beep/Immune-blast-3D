/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { getTranslations } from './i18n/translations';
import { getLevelById, getTotalLevelCount } from './levels/levelLoader';
import {
  ACHIEVEMENTS,
  canClaimDailyVitamin,
  createDefaultSaveData,
  DAILY_VITAMIN_REWARDS,
  EXTRA_MOVES_COST,
  getLocalDateKey,
  getNextDailyStreak,
  getShopItemPrice,
  loadSaveData,
  persistSaveData,
  recordLeaderboardScore,
} from './storage/saveSystem';
import {
  BlockType,
  BoosterType,
  GameSettings,
  LanguageCode,
  LauncherSkinId,
  ProjectileType,
  SaveData,
  ScreenRoute,
  ShopItemDef,
} from './types/game';
import { AchievementsScreen } from './ui/AchievementsScreen';
import { DailyVitaminModal } from './ui/DailyVitaminModal';
import { EncyclopediaScreen } from './ui/EncyclopediaScreen';
import { GameCanvas } from './ui/GameCanvas';
import { LeaderboardScreen } from './ui/LeaderboardScreen';
import { LevelMap } from './ui/LevelMap';
import { MainMenu } from './ui/MainMenu';
import { SettingsScreen } from './ui/SettingsScreen';
import { ShopScreen } from './ui/ShopScreen';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [route, setRoute] = useState<ScreenRoute>('menu');
  const [showDailyVitamin, setShowDailyVitamin] = useState(false);
  const [activeLevelId, setActiveLevelId] = useState<number>(() =>
    Math.min(getTotalLevelCount(), Math.max(1, loadSaveData().unlockedLevel))
  );

  const t = useMemo(
    () => getTranslations(saveData.settings.language),
    [saveData.settings.language]
  );

  useEffect(() => {
    persistSaveData(saveData);
    soundEngine.configure(
      saveData.settings.soundEnabled,
      saveData.settings.musicEnabled,
      saveData.settings.volume
    );
  }, [saveData]);

  // Unlock Web Audio context on first user pointer interaction so ambient music can start
  useEffect(() => {
    const unlock = () => {
      soundEngine.unlockAudio();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  const claimableAchievementsCount = useMemo(() => {
    return ACHIEVEMENTS.filter(
      (a) =>
        a.getProgress(saveData) >= a.target &&
        !saveData.claimedAchievements.includes(a.id)
    ).length;
  }, [saveData]);

  const handlePlayNow = useCallback(() => {
    const targetId = Math.min(getTotalLevelCount(), saveData.unlockedLevel);
    setActiveLevelId(targetId);
    setRoute('play');
  }, [saveData.unlockedLevel]);

  const handleSelectLevel = useCallback((levelId: number) => {
    setActiveLevelId(levelId);
    setRoute('play');
  }, []);

  const handleCompleteLevel = useCallback(
    (levelId: number, stars: number, score: number, movesLeft: number): number => {
      const levelCfg = getLevelById(levelId);
      const isFirstClear = (saveData.starsByLevel[levelId] ?? 0) === 0;
      const baseReward = 20 + stars * 15 + movesLeft * 5;
      const firstClearBonus = isFirstClear ? (levelCfg?.firstClearBonus ?? 25) : 0;
      const coinsEarned = baseReward + firstClearBonus;

      setSaveData((prev) => {
        const prevStars = prev.starsByLevel[levelId] ?? 0;
        const nextStarsByLevel = {
          ...prev.starsByLevel,
          [levelId]: Math.max(prevStars, stars),
        };
        const threeStarCount = Object.values(nextStarsByLevel).filter((s) => s >= 3).length;
        const nextUnlockedFacts = prev.unlockedFacts.includes(levelId)
          ? prev.unlockedFacts
          : [...prev.unlockedFacts, levelId];

        return {
          ...prev,
          coins: prev.coins + coinsEarned,
          unlockedLevel: Math.min(
            getTotalLevelCount(),
            Math.max(prev.unlockedLevel, levelId + 1)
          ),
          starsByLevel: nextStarsByLevel,
          bestScoreByLevel: {
            ...prev.bestScoreByLevel,
            [levelId]: Math.max(prev.bestScoreByLevel[levelId] ?? 0, score),
          },
          unlockedFacts: nextUnlockedFacts,
          leaderboard: recordLeaderboardScore(
            prev.leaderboard,
            prev.playerName,
            levelId,
            score,
            stars
          ),
          stats: {
            ...prev.stats,
            levelsCompleted: prev.stats.levelsCompleted + 1,
            totalCoinsEarned: prev.stats.totalCoinsEarned + coinsEarned,
            threeStarLevels: threeStarCount,
          },
        };
      });

      return coinsEarned;
    },
    [saveData.starsByLevel]
  );

  const handleSpendExtraMoves = useCallback((): boolean => {
    if (saveData.coins < EXTRA_MOVES_COST) return false;
    setSaveData((prev) => ({
      ...prev,
      coins: prev.coins - EXTRA_MOVES_COST,
    }));
    return true;
  }, [saveData.coins]);

  const handleConsumeShopAmmo = useCallback(
    (ammoType: Exclude<ProjectileType, 'antibody' | 'antiseptic'>) => {
      setSaveData((prev) => ({
        ...prev,
        ammoInventory: {
          ...prev.ammoInventory,
          [ammoType]: Math.max(0, (prev.ammoInventory[ammoType] ?? 0) - 1),
        },
      }));
    },
    []
  );

  const handleConsumeBooster = useCallback((booster: BoosterType) => {
    setSaveData((prev) => ({
      ...prev,
      boosters: {
        ...prev.boosters,
        [booster]: Math.max(0, (prev.boosters[booster] ?? 0) - 1),
      },
      stats: {
        ...prev.stats,
        totalBoostersUsed: prev.stats.totalBoostersUsed + 1,
      },
    }));
  }, []);

  const handleStatBlockCleared = useCallback((blockType: BlockType) => {
    setSaveData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalMicrobesCleared: prev.stats.totalMicrobesCleared + 1,
        totalBacteriaCleared:
          prev.stats.totalBacteriaCleared + (blockType === 'bacteria' ? 1 : 0),
        totalVirusesCleared:
          prev.stats.totalVirusesCleared + (blockType === 'virus' ? 1 : 0),
        totalTargetsDestroyed:
          prev.stats.totalTargetsDestroyed + (blockType === 'target' ? 1 : 0),
      },
    }));
  }, []);

  const handleStatVaccineUsed = useCallback(() => {
    setSaveData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalVaccinesUsed: prev.stats.totalVaccinesUsed + 1,
      },
    }));
  }, []);

  const handleStatAntibioticBlast = useCallback(() => {
    setSaveData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalAntibioticBlasts: prev.stats.totalAntibioticBlasts + 1,
      },
    }));
  }, []);

  const handleStatShotFired = useCallback(() => {
    setSaveData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalShotsFired: prev.stats.totalShotsFired + 1,
      },
    }));
  }, []);

  const handleBuyShopItem = useCallback(
    (item: ShopItemDef): boolean => {
      const price = getShopItemPrice(item, saveData);
      if (saveData.coins < price) return false;

      if (item.category === 'skin' && item.skinId) {
        const skinId = item.skinId;
        if (saveData.ownedSkins.includes(skinId)) return false;
        setSaveData((prev) => ({
          ...prev,
          coins: prev.coins - price,
          ownedSkins: [...prev.ownedSkins, skinId],
          selectedSkin: skinId,
        }));
        return true;
      }

      if (item.category === 'booster' && item.boosterType && item.boosterAmount) {
        const boosterKey = item.boosterType;
        const addCount = item.boosterAmount;
        setSaveData((prev) => ({
          ...prev,
          coins: prev.coins - price,
          boosters: {
            ...prev.boosters,
            [boosterKey]: (prev.boosters[boosterKey] ?? 0) + addCount,
          },
        }));
        return true;
      }

      if (item.category === 'ammo' && item.ammoType && item.ammoAmount) {
        const ammoKey = item.ammoType;
        const addCount = item.ammoAmount;
        setSaveData((prev) => ({
          ...prev,
          coins: prev.coins - price,
          ammoInventory: {
            ...prev.ammoInventory,
            [ammoKey]: (prev.ammoInventory[ammoKey] ?? 0) + addCount,
          },
        }));
        return true;
      }

      if (item.category === 'upgrade' && item.upgradeKey) {
        const key = item.upgradeKey;
        const curLvl = saveData.upgrades[key];
        if (item.maxLevel !== undefined && curLvl >= item.maxLevel) return false;
        setSaveData((prev) => ({
          ...prev,
          coins: prev.coins - price,
          upgrades: {
            ...prev.upgrades,
            [key]: prev.upgrades[key] + 1,
          },
        }));
        return true;
      }

      return false;
    },
    [saveData]
  );

  const handleSelectSkin = useCallback((skinId: LauncherSkinId) => {
    setSaveData((prev) => {
      if (!prev.ownedSkins.includes(skinId)) return prev;
      return { ...prev, selectedSkin: skinId };
    });
  }, []);

  const handleClaimDailyVitamin = useCallback(() => {
    setSaveData((prev) => {
      if (!canClaimDailyVitamin(prev)) return prev;
      const nextStreak = getNextDailyStreak(prev);
      const rewardDef =
        DAILY_VITAMIN_REWARDS.find((r) => r.day === nextStreak) ??
        DAILY_VITAMIN_REWARDS[0];

      const nextBoosters = { ...prev.boosters };
      if (rewardDef.bonusBooster && rewardDef.bonusCount) {
        nextBoosters[rewardDef.bonusBooster] =
          (nextBoosters[rewardDef.bonusBooster] ?? 0) + rewardDef.bonusCount;
      }

      const nextAmmo = { ...prev.ammoInventory };
      if (rewardDef.bonusAmmo && rewardDef.bonusCount) {
        nextAmmo[rewardDef.bonusAmmo] =
          (nextAmmo[rewardDef.bonusAmmo] ?? 0) + rewardDef.bonusCount;
      }

      return {
        ...prev,
        coins: prev.coins + rewardDef.coins,
        boosters: nextBoosters,
        ammoInventory: nextAmmo,
        dailyReward: {
          lastClaimDate: getLocalDateKey(),
          streak: nextStreak,
          totalClaims: prev.dailyReward.totalClaims + 1,
        },
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + rewardDef.coins,
        },
      };
    });
  }, []);

  const handleClaimAchievement = useCallback((achievementId: string) => {
    const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!def) return;
    setSaveData((prev) => {
      if (prev.claimedAchievements.includes(achievementId)) return prev;
      if (def.getProgress(prev) < def.target) return prev;
      return {
        ...prev,
        coins: prev.coins + def.rewardCoins,
        claimedAchievements: [...prev.claimedAchievements, achievementId],
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + def.rewardCoins,
        },
      };
    });
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSaveData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const handleChangeLanguage = useCallback((language: LanguageCode) => {
    setSaveData((prev) => ({
      ...prev,
      settings: { ...prev.settings, language },
    }));
  }, []);

  const handleUpdatePlayerName = useCallback((playerName: string) => {
    setSaveData((prev) => ({
      ...prev,
      playerName: playerName.trim() || prev.playerName,
    }));
  }, []);

  const handleToggleSound = useCallback(() => {
    setSaveData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: !prev.settings.soundEnabled,
      },
    }));
  }, []);

  const handleResetProgress = useCallback(() => {
    setSaveData((prev) => ({
      ...createDefaultSaveData(),
      settings: prev.settings,
    }));
  }, []);

  const activeLevel = useMemo(
    () => getLevelById(activeLevelId) ?? getLevelById(1)!,
    [activeLevelId]
  );

  return (
    <div className="h-[100dvh] w-full overflow-hidden">
      {route === 'menu' && (
        <MainMenu
          saveData={saveData}
          t={t}
          onPlayNow={handlePlayNow}
          onNavigate={setRoute}
          onOpenDailyVitamin={() => setShowDailyVitamin(true)}
          onChangeLanguage={handleChangeLanguage}
          claimableAchievementsCount={claimableAchievementsCount}
        />
      )}

      {route === 'map' && (
        <LevelMap
          saveData={saveData}
          t={t}
          onSelectLevel={handleSelectLevel}
          onBack={() => setRoute('menu')}
        />
      )}

      {route === 'encyclopedia' && (
        <EncyclopediaScreen
          saveData={saveData}
          t={t}
          onBack={() => setRoute('menu')}
        />
      )}

      {route === 'play' && (
        <GameCanvas
          key={activeLevel.id}
          level={activeLevel}
          saveData={saveData}
          t={t}
          hasNextLevel={activeLevel.id < getTotalLevelCount()}
          onCompleteLevel={handleCompleteLevel}
          onSpendExtraMoves={handleSpendExtraMoves}
          onConsumeShopAmmo={handleConsumeShopAmmo}
          onConsumeBooster={handleConsumeBooster}
          onStatBlockCleared={handleStatBlockCleared}
          onStatVaccineUsed={handleStatVaccineUsed}
          onStatAntibioticBlast={handleStatAntibioticBlast}
          onStatShotFired={handleStatShotFired}
          onToggleSound={handleToggleSound}
          onNextLevel={() => {
            const nextId = Math.min(getTotalLevelCount(), activeLevel.id + 1);
            setActiveLevelId(nextId);
          }}
          onExitToMap={() => setRoute('map')}
        />
      )}

      {route === 'shop' && (
        <ShopScreen
          saveData={saveData}
          t={t}
          onBuyItem={handleBuyShopItem}
          onSelectSkin={handleSelectSkin}
          onBack={() => setRoute('menu')}
        />
      )}

      {route === 'achievements' && (
        <AchievementsScreen
          saveData={saveData}
          t={t}
          onClaimReward={handleClaimAchievement}
          onBack={() => setRoute('menu')}
        />
      )}

      {route === 'leaderboard' && (
        <LeaderboardScreen
          saveData={saveData}
          t={t}
          onUpdatePlayerName={handleUpdatePlayerName}
          onBack={() => setRoute('menu')}
        />
      )}

      {route === 'settings' && (
        <SettingsScreen
          settings={saveData.settings}
          t={t}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
          onBack={() => setRoute('menu')}
        />
      )}

      {showDailyVitamin && (
        <DailyVitaminModal
          saveData={saveData}
          t={t}
          onClaim={handleClaimDailyVitamin}
          onClose={() => setShowDailyVitamin(false)}
        />
      )}
    </div>
  );
}
