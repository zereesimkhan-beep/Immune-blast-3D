import {
  AchievementDef,
  BoosterType,
  LeaderboardEntry,
  ProjectileType,
  SaveData,
  ShopItemDef,
} from '../types/game';

const STORAGE_KEY = 'immune_blast_save_v1';

export const EXTRA_MOVES_COST = 60;

export interface DailyVitaminRewardDef {
  day: number;
  coins: number;
  bonusBooster?: BoosterType;
  bonusAmmo?: Exclude<ProjectileType, 'antibody' | 'antiseptic'>;
  bonusCount?: number;
  labelRu: string;
  labelEn: string;
  labelKk: string;
}

export const DAILY_VITAMIN_REWARDS: DailyVitaminRewardDef[] = [
  {
    day: 1,
    coins: 45,
    labelRu: '+45 монет',
    labelEn: '+45 Coins',
    labelKk: '+45 тиын',
  },
  {
    day: 2,
    coins: 60,
    bonusAmmo: 'vaccine',
    bonusCount: 1,
    labelRu: '+60 монет и Вакцина',
    labelEn: '+60 Coins & Vaccine',
    labelKk: '+60 тиын және Вакцина',
  },
  {
    day: 3,
    coins: 80,
    bonusBooster: 'aimAssist',
    bonusCount: 1,
    labelRu: '+80 монет и Прицел',
    labelEn: '+80 Coins & Aim Assist',
    labelKk: '+80 тиын және Нысана',
  },
  {
    day: 4,
    coins: 100,
    bonusBooster: 'extraMoves',
    bonusCount: 1,
    labelRu: '+100 монет и +2 хода',
    labelEn: '+100 Coins & +2 Moves',
    labelKk: '+100 тиын және +2 жүріс',
  },
  {
    day: 5,
    coins: 120,
    bonusBooster: 'antisepticBomb',
    bonusCount: 1,
    labelRu: '+120 монет и Антисептик-бомба',
    labelEn: '+120 Coins & Antiseptic Bomb',
    labelKk: '+120 тиын және Антисептик-бомба',
  },
  {
    day: 6,
    coins: 150,
    bonusAmmo: 'tcell',
    bonusCount: 2,
    labelRu: '+150 монет и 2 Т-лимфоцита',
    labelEn: '+150 Coins & 2 T-Cells',
    labelKk: '+150 тиын және 2 Т-лимфоцит',
  },
  {
    day: 7,
    coins: 240,
    bonusBooster: 'antisepticBomb',
    bonusCount: 2,
    labelRu: '+240 монет и 2 Антисептик-бомбы',
    labelEn: '+240 Coins & 2 Antiseptic Bombs',
    labelKk: '+240 тиын және 2 Антисептик-бомба',
  },
];

export const SHOP_ITEMS: ShopItemDef[] = [
  // Cannon Skins
  {
    id: 'skin_syringe',
    category: 'skin',
    skinId: 'syringe',
    basePrice: 0,
    nameRu: 'Шприц-катапульта',
    nameEn: 'Syringe Launcher',
    nameKk: 'Шприц-зеңбірек',
    descRu: 'Классическая медицинская пушка со шприцем и эмблемой креста.',
    descEn: 'Classic medical syringe launcher with red cross emblem.',
    descKk: 'Қызыл крест белгісі бар классикалық медициналық шприц-зеңбірек.',
  },
  {
    id: 'skin_immune_cell',
    category: 'skin',
    skinId: 'immune_cell',
    basePrice: 140,
    nameRu: 'Иммунная клетка',
    nameEn: 'Immune Cell Cannon',
    nameKk: 'Иммундық жасуша',
    descRu: 'Живой лейкоцит-защитник со светящимся ядром и био-пушкой.',
    descEn: 'Friendly leukocyte guardian with glowing nucleus & bio-barrel.',
    descKk: 'Жарқыраған ядросы мен био-ұңғысы бар қорғаушы лейкоцит.',
  },
  {
    id: 'skin_microscope',
    category: 'skin',
    skinId: 'microscope',
    basePrice: 220,
    nameRu: 'Микроскоп',
    nameEn: 'Lab Microscope',
    nameKk: 'Микроскоп',
    descRu: 'Высокоточная оптическая пушка-микроскоп с двумя объективами.',
    descEn: 'Precision optical microscope cannon with dual brass lenses.',
    descKk: 'Қос объективті дәлдігі жоғары оптикалық микроскоп-зеңбірек.',
  },

  // Boosters
  {
    id: 'booster_extra_moves',
    category: 'booster',
    boosterType: 'extraMoves',
    boosterAmount: 1,
    basePrice: 55,
    nameRu: 'Бустер «+2 хода»',
    nameEn: '+2 Moves Booster',
    nameKk: '«+2 жүріс» бустері',
    descRu: 'Добавляет +2 дополнительных выстрела прямо во время уровня.',
    descEn: 'Instantly adds +2 extra moves during any active level.',
    descKk: 'Деңгей барысында бірден +2 қосымша жүріс береді.',
  },
  {
    id: 'booster_aim_assist',
    category: 'booster',
    boosterType: 'aimAssist',
    boosterAmount: 1,
    basePrice: 45,
    nameRu: 'Прицел-помощник',
    nameEn: 'Precision Aim Assist',
    nameKk: 'Нысана-көмекші',
    descRu: 'Продлевает траекторию полёта и показывает точную точку попадания.',
    descEn: 'Extends full flight trajectory with an exact target reticle.',
    descKk: 'Ұшу бағытын ұзартып, дәл тию нүктесін көрсетеді.',
  },
  {
    id: 'booster_antiseptic_bomb',
    category: 'booster',
    boosterType: 'antisepticBomb',
    boosterAmount: 1,
    basePrice: 70,
    nameRu: 'Антисептик-бомба',
    nameEn: 'Antiseptic Bomb',
    nameKk: 'Антисептик-бомба',
    descRu: 'Мощнейший стерилизующий взрыв! Пробивает даже устойчивые штаммы.',
    descEn: 'Massive sanitizing foam blast! Damages even resistant microbes.',
    descKk: 'Қуатты зарарсыздандырғыш жарылыс! Төзімді штаммдарды да жояды.',
  },

  // Special Immune Projectiles
  {
    id: 'ammo_vaccine_3',
    category: 'ammo',
    ammoType: 'vaccine',
    ammoAmount: 3,
    basePrice: 45,
    nameRu: 'Вакцина ×3',
    nameEn: 'Vaccine ×3',
    nameKk: 'Вакцина ×3',
    descRu: 'Ослабляет микробов вокруг точки удара — они лопаются от лёгкого касания.',
    descEn: 'Weakens nearby microbes on impact so a gentle nudge shatters them.',
    descKk: 'Соққы маңындағы микробтарды әлсіретеді — жеңіл түртуден-ақ жарылады.',
  },
  {
    id: 'ammo_antibiotic_3',
    category: 'ammo',
    ammoType: 'antibiotic',
    ammoAmount: 3,
    basePrice: 50,
    nameRu: 'Антибиотик ×3',
    nameEn: 'Antibiotic ×3',
    nameKk: 'Антибиотик ×3',
    descRu: 'Взрывается в радиусе. Двойной урон по обычным бактериям!',
    descEn: 'Radial bio-blast. Deals 2× damage to standard bacteria!',
    descKk: 'Радиус бойынша жарылады. Қарапайым бактерияларға екі есе соққы!',
  },
  {
    id: 'ammo_antiviral_3',
    category: 'ammo',
    ammoType: 'antiviral',
    ammoAmount: 3,
    basePrice: 50,
    nameRu: 'Противовирусный ×3',
    nameEn: 'Antiviral ×3',
    nameKk: 'Вирусқа қарсы ×3',
    descRu: 'Пробивает вирусы насквозь, не теряя скорости.',
    descEn: 'Pierces right through virus blocks without losing speed.',
    descKk: 'Жылдамдығын жоғалтпай вирустарды тесіп өтеді.',
  },
  {
    id: 'ammo_tcell_3',
    category: 'ammo',
    ammoType: 'tcell',
    ammoAmount: 3,
    basePrice: 55,
    nameRu: 'Т-лимфоцит ×3',
    nameEn: 'T-Lymphocyte ×3',
    nameKk: 'Т-лимфоцит ×3',
    descRu: 'Нажми в полёте — разделится на 3 клетки. Эффективен против брони!',
    descEn: 'Tap mid-air to split into 3 cells. Strong against resistant strains!',
    descKk: 'Ұшу кезінде түрт — 3-ке бөлінеді. Төзімді штаммдарға өте тиімді!',
  },

  // Upgrades
  {
    id: 'upg_aim',
    category: 'upgrade',
    upgradeKey: 'aimGuide',
    maxLevel: 3,
    basePrice: 80,
    priceStep: 70,
    nameRu: 'Лабораторный прицел',
    nameEn: 'Precision Aim Line',
    nameKk: 'Дәл нысана сызығы',
    descRu: 'Удлиняет пунктирную траекторию прицеливания пушки.',
    descEn: 'Extends the dotted trajectory preview for pinpoint shots.',
    descKk: 'Дәл ату үшін зеңбіректің үзік сызықты бағытын ұзартады.',
  },
  {
    id: 'upg_power',
    category: 'upgrade',
    upgradeKey: 'launcherPower',
    maxLevel: 3,
    basePrice: 90,
    priceStep: 80,
    nameRu: 'Усиленный поршень',
    nameEn: 'Turbo Plunger',
    nameKk: 'Күшейтілген поршень',
    descRu: 'Увеличивает скорость вылета и силу удара иммунных снарядов.',
    descEn: 'Boosts launch velocity and impact force.',
    descKk: 'Иммундық оқтардың ұшу жылдамдығы мен соққы күшін арттырады.',
  },
  {
    id: 'upg_radius',
    category: 'upgrade',
    upgradeKey: 'bioRadius',
    maxLevel: 3,
    basePrice: 85,
    priceStep: 75,
    nameRu: 'Био-резонанс',
    nameEn: 'Bio-Resonance',
    nameKk: 'Био-резонанс',
    descRu: 'Увеличивает радиус ослабления Вакцины и взрыва Антибиотика.',
    descEn: 'Expands Vaccine weakening aura and Antibiotic blast radius.',
    descKk: 'Вакцинаның әлсірету аймағы мен Антибиотиктің жарылу радиусын кеңейтеді.',
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_defense',
    titleRu: 'Первый барьер',
    titleEn: 'First Barrier',
    titleKk: 'Алғашқы тосқауыл',
    descRu: 'Пройди первый уровень и открой первый медицинский факт.',
    descEn: 'Complete 1 level and unlock your first medical fact.',
    descKk: '1 деңгейден өтіп, алғашқы медициналық фактіні аш.',
    rewardCoins: 40,
    target: 1,
    getProgress: (s) => s.stats.levelsCompleted,
  },
  {
    id: 'bacteria_fighter',
    titleRu: 'Борец с бактериями',
    titleEn: 'Bacteria Fighter',
    titleKk: 'Бактериямен күресуші',
    descRu: 'Уничтожь или сбрось 25 бактерий-палочек.',
    descEn: 'Clear 25 rod bacteria blocks.',
    descKk: '25 бактерия блогын жой немесе құлат.',
    rewardCoins: 65,
    target: 25,
    getProgress: (s) => s.stats.totalBacteriaCleared,
  },
  {
    id: 'virus_hunter',
    titleRu: 'Охотник на вирусы',
    titleEn: 'Virus Hunter',
    titleKk: 'Вирус аңшысы',
    descRu: 'Уничтожь или сбрось 25 круглых вирусов.',
    descEn: 'Clear 25 spiky virus blocks.',
    descKk: '25 вирус блогын жой немесе құлат.',
    rewardCoins: 65,
    target: 25,
    getProgress: (s) => s.stats.totalVirusesCleared,
  },
  {
    id: 'vaccinator',
    titleRu: 'Вакцинатор',
    titleEn: 'Vaccinator',
    titleKk: 'Вакцинатор',
    descRu: 'Примени Вакцину 10 раз для ослабления микробов.',
    descEn: 'Use Vaccine projectiles 10 times.',
    descKk: 'Микробтарды әлсірету үшін Вакцинаны 10 рет қолдан.',
    rewardCoins: 75,
    target: 10,
    getProgress: (s) => s.stats.totalVaccinesUsed,
  },
  {
    id: 'antibiotic_master',
    titleRu: 'Сила антибиотика',
    titleEn: 'Antibiotic Master',
    titleKk: 'Антибиотик шебері',
    descRu: 'Активируй 8 взрывов Антибиотика.',
    descEn: 'Trigger 8 Antibiotic blasts.',
    descKk: 'Антибиотик жарылысын 8 рет іске қос.',
    rewardCoins: 75,
    target: 8,
    getProgress: (s) => s.stats.totalAntibioticBlasts,
  },
  {
    id: 'target_hunter_15',
    titleRu: 'Охотник за очагами',
    titleEn: 'Target Hunter',
    titleKk: 'Ошақ аңшысы',
    descRu: 'Уничтожь 15 золотых целевых блоков.',
    descEn: 'Destroy 15 golden target blocks.',
    descKk: '15 алтын нысана блогын жой.',
    rewardCoins: 85,
    target: 15,
    getProgress: (s) => s.stats.totalTargetsDestroyed,
  },
  {
    id: 'microbe_sweeper_60',
    titleRu: 'Санитар организма',
    titleEn: 'Microbe Sweeper',
    titleKk: 'Ағза санитары',
    descRu: 'Уничтожь или сбрось 60 микробов всего.',
    descEn: 'Clear 60 microbes across any levels.',
    descKk: 'Барлығы 60 микробты жой немесе құлат.',
    rewardCoins: 90,
    target: 60,
    getProgress: (s) => s.stats.totalMicrobesCleared,
  },
  {
    id: 'three_star_5',
    titleRu: 'Точный диагноз',
    titleEn: 'Precision Defense',
    titleKk: 'Дәл диагноз',
    descRu: 'Заработай 3 звезды на 5 разных уровнях.',
    descEn: 'Earn 3 stars on 5 different levels.',
    descKk: '5 түрлі деңгейде 3 жұлдыз жина.',
    rewardCoins: 110,
    target: 5,
    getProgress: (s) => s.stats.threeStarLevels,
  },
  {
    id: 'booster_tactician',
    titleRu: 'Тактик лаборатории',
    titleEn: 'Lab Tactician',
    titleKk: 'Зертхана тактигі',
    descRu: 'Используй 3 бустера в бою или купи новый скин пушки.',
    descEn: 'Use 3 boosters in battle or unlock a new cannon skin.',
    descKk: 'Шайқаста 3 бустер қолдан немесе зеңбірекке жаңа скин аш.',
    rewardCoins: 95,
    target: 3,
    getProgress: (s) => s.stats.totalBoostersUsed + Math.max(0, s.ownedSkins.length - 1) * 3,
  },
  {
    id: 'full_encyclopedia',
    titleRu: 'Профессор иммунологии',
    titleEn: 'Immunology Master',
    titleKk: 'Иммунология профессоры',
    descRu: 'Открой все 18 медицинских фактов в Энциклопедии.',
    descEn: 'Unlock all 18 medical facts in the Encyclopedia.',
    descKk: 'Энциклопедиядағы барлық 18 медициналық фактіні аш.',
    rewardCoins: 240,
    target: 18,
    getProgress: (s) => s.unlockedFacts.length,
  },
];

export function createDefaultSaveData(): SaveData {
  return {
    playerName: 'Доктор',
    coins: 150,
    unlockedLevel: 1,
    starsByLevel: {},
    bestScoreByLevel: {},
    unlockedFacts: [],
    ammoInventory: {
      vaccine: 2,
      antibiotic: 2,
      antiviral: 2,
      tcell: 2,
    },
    upgrades: {
      aimGuide: 0,
      launcherPower: 0,
      bioRadius: 0,
    },
    ownedSkins: ['syringe'],
    selectedSkin: 'syringe',
    boosters: {
      extraMoves: 1,
      aimAssist: 1,
      antisepticBomb: 1,
    },
    dailyReward: {
      lastClaimDate: null,
      streak: 0,
      totalClaims: 0,
    },
    leaderboard: [],
    claimedAchievements: [],
    stats: {
      levelsCompleted: 0,
      totalMicrobesCleared: 0,
      totalBacteriaCleared: 0,
      totalVirusesCleared: 0,
      totalTargetsDestroyed: 0,
      totalAntibioticBlasts: 0,
      totalVaccinesUsed: 0,
      totalBoostersUsed: 0,
      totalShotsFired: 0,
      totalCoinsEarned: 0,
      threeStarLevels: 0,
    },
    settings: {
      language: 'ru',
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.75,
      cameraShake: true,
      haptics: true,
    },
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSaveData();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const def = createDefaultSaveData();
    return {
      ...def,
      ...parsed,
      playerName:
        typeof parsed.playerName === 'string' && parsed.playerName.trim().length > 0
          ? parsed.playerName
          : def.playerName,
      ammoInventory: { ...def.ammoInventory, ...(parsed.ammoInventory ?? {}) },
      upgrades: { ...def.upgrades, ...(parsed.upgrades ?? {}) },
      boosters: { ...def.boosters, ...(parsed.boosters ?? {}) },
      dailyReward: { ...def.dailyReward, ...(parsed.dailyReward ?? {}) },
      stats: { ...def.stats, ...(parsed.stats ?? {}) },
      settings: { ...def.settings, ...(parsed.settings ?? {}) },
      starsByLevel: { ...(parsed.starsByLevel ?? {}) },
      bestScoreByLevel: { ...(parsed.bestScoreByLevel ?? {}) },
      ownedSkins:
        Array.isArray(parsed.ownedSkins) && parsed.ownedSkins.length > 0
          ? parsed.ownedSkins
          : def.ownedSkins,
      selectedSkin: parsed.selectedSkin ?? def.selectedSkin,
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      unlockedFacts: Array.isArray(parsed.unlockedFacts) ? parsed.unlockedFacts : [],
      claimedAchievements: Array.isArray(parsed.claimedAchievements)
        ? parsed.claimedAchievements
        : [],
    };
  } catch {
    return createDefaultSaveData();
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function getShopItemPrice(item: ShopItemDef, save: SaveData): number {
  if (item.category !== 'upgrade' || !item.upgradeKey) {
    return item.basePrice;
  }
  const curLevel = save.upgrades[item.upgradeKey] ?? 0;
  return item.basePrice + curLevel * (item.priceStep ?? 60);
}

export function getTotalStars(save: SaveData): number {
  return Object.values(save.starsByLevel).reduce((acc, v) => acc + v, 0);
}

export function getTotalBestScore(save: SaveData): number {
  return Object.values(save.bestScoreByLevel).reduce((acc, v) => acc + v, 0);
}

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function canClaimDailyVitamin(save: SaveData): boolean {
  const today = getLocalDateKey();
  return save.dailyReward.lastClaimDate !== today;
}

export function getNextDailyStreak(save: SaveData): number {
  const last = save.dailyReward.lastClaimDate;
  if (!last) return 1;
  const today = getLocalDateKey();
  if (last === today) return Math.max(1, save.dailyReward.streak);

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = getLocalDateKey(yesterdayDate);

  if (last === yesterday) {
    return (save.dailyReward.streak % DAILY_VITAMIN_REWARDS.length) + 1;
  }
  return 1;
}

export function recordLeaderboardScore(
  current: LeaderboardEntry[],
  playerName: string,
  levelId: number,
  score: number,
  stars: number
): LeaderboardEntry[] {
  const cleanName = playerName.trim() || 'Доктор';
  const entry: LeaderboardEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    playerName: cleanName,
    levelId,
    score,
    stars,
    dateIso: new Date().toISOString(),
  };

  return [...current, entry]
    .sort((a, b) => b.score - a.score || b.stars - a.stars)
    .slice(0, 25);
}
