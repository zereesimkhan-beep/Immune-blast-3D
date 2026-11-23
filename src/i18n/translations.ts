import { BoosterType, LanguageCode, OrganZone, ProjectileType, WinGoalType } from '../types/game';

export interface TranslationBundle {
  appTitle: string;
  playNow: string;
  encyclopedia: string;
  bodyMap: string;
  shop: string;
  achievements: string;
  leaderboard: string;
  settings: string;
  back: string;
  coins: string;
  stars: string;
  movesLabel: string;
  levelWord: string;
  megaLevelBadge: string;
  locked: string;
  retry: string;
  plusThreeMoves: string;
  nextLevel: string;
  toMap: string;
  victoryTitle: string;
  infectionCleared: string;
  defeatTitle: string;
  defeatSubtitle: string;
  score: string;
  reward: string;
  interestingFactHeader: string;
  pause: string;
  resume: string;
  restart: string;
  exitToMap: string;
  tapToSplit: string;
  antisepticReady: string;
  aimAssistActive: string;
  goalDestroyTargets: (done: number, total: number) => string;
  goalDropBlocks: (done: number, total: number) => string;
  goalCollapseBelow: (cur: number, target: number) => string;
  goalTitle: Record<WinGoalType, string>;
  organNames: Record<OrganZone, string>;
  ammoNames: Record<ProjectileType, string>;
  boosterShortNames: Record<BoosterType, string>;
  shopTabs: {
    skins: string;
    boosters: string;
    arsenal: string;
  };
  shopCategories: {
    skins: string;
    boosters: string;
    ammo: string;
    upgrades: string;
  };
  buy: string;
  equip: string;
  equipped: string;
  maxed: string;
  owned: string;
  levelShort: string;
  claim: string;
  claimed: string;
  dailyVitamin: {
    buttonLabel: string;
    readyBadge: string;
    claimedTodayBadge: string;
    title: string;
    subtitle: string;
    dayLabel: (day: number) => string;
    streakLabel: (days: number) => string;
    claimButton: string;
    comeBackTomorrow: string;
  };
  leaderboardLabels: {
    title: string;
    playerNameLabel: string;
    saveName: string;
    totalScore: string;
    totalStars: string;
    levelsCleared: string;
    tabHallOfFame: string;
    tabByLevel: string;
    emptyHall: string;
    bestPrefix: string;
  };
  encyclopediaTabs: {
    facts: string;
    enemies: string;
    ammo: string;
  };
  factLockedHint: (levelId: number) => string;
  enemyWeaknessLabel: string;
  ammoStrongLabel: string;
  ammoWeakLabel: string;
  settingsLabels: {
    language: string;
    sound: string;
    music: string;
    volume: string;
    cameraShake: string;
    haptics: string;
    resetProgress: string;
    resetConfirm: string;
    confirmYes: string;
    cancel: string;
  };
  tutorialSkip: string;
  zoneProgress: (unlocked: number, total: number) => string;
}

const ru: TranslationBundle = {
  appTitle: 'Immune Blast',
  playNow: 'Играть',
  encyclopedia: 'Энциклопедия',
  bodyMap: 'Карта организма',
  shop: 'Магазин',
  achievements: 'Достижения',
  leaderboard: 'Рекорды',
  settings: 'Настройки',
  back: 'Назад',
  coins: 'Монеты',
  stars: 'Звёзды',
  movesLabel: 'Ходы',
  levelWord: 'Уровень',
  megaLevelBadge: 'Мега-уровень',
  locked: 'Закрыто',
  retry: 'Повторить',
  plusThreeMoves: '+3 хода',
  nextLevel: 'Дальше',
  toMap: 'На карту',
  victoryTitle: 'Победа!',
  infectionCleared: 'Инфекция уничтожена!',
  defeatTitle: 'Ходы закончились!',
  defeatSubtitle: 'Попробуй ещё раз или возьми +3 дополнительных хода.',
  score: 'Очки',
  reward: 'Награда',
  interestingFactHeader: 'Это интересно',
  pause: 'Пауза',
  resume: 'Продолжить',
  restart: 'Заново',
  exitToMap: 'На карту',
  tapToSplit: 'Нажми в полёте — раздели Т-лимфоцит на 3!',
  antisepticReady: 'Антисептик-бомба заряжена! Прицелься и стреляй!',
  aimAssistActive: 'Прицел-помощник активен',
  goalDestroyTargets: (done, total) => `Цели: ${done} / ${total}`,
  goalDropBlocks: (done, total) => `Сброшено: ${done} / ${total}`,
  goalCollapseBelow: (cur, target) =>
    cur <= target ? 'Ниже линии!' : `Высота: ${cur} / ≤${target}`,
  goalTitle: {
    destroy_targets: 'Уничтожь все золотые цели',
    drop_blocks: 'Сбрось микробов с чашки Петри',
    collapse_below: 'Снизь башню ниже линии',
  },
  organNames: {
    skin: 'Кожа',
    throat: 'Горло',
    lungs: 'Лёгкие',
    gut: 'Кишечник',
    blood: 'Кровь',
    lymph: 'Лимфоузлы',
  },
  ammoNames: {
    antibody: 'Антитело',
    vaccine: 'Вакцина',
    antibiotic: 'Антибиотик',
    antiviral: 'Противовирус.',
    tcell: 'Т-лимфоцит',
    antiseptic: 'Антисептик',
  },
  boosterShortNames: {
    extraMoves: '+2 хода',
    aimAssist: 'Прицел',
    antisepticBomb: 'Бомба',
  },
  shopTabs: {
    skins: 'Скины',
    boosters: 'Бустеры',
    arsenal: 'Арсенал',
  },
  shopCategories: {
    skins: 'Скины пушки',
    boosters: 'Боевые бустеры',
    ammo: 'Иммунные снаряды',
    upgrades: 'Улучшения пушки',
  },
  buy: 'Купить',
  equip: 'Надеть',
  equipped: 'Надето',
  maxed: 'Макс.',
  owned: 'Запас',
  levelShort: 'Ур.',
  claim: 'Забрать',
  claimed: 'Получено',
  dailyVitamin: {
    buttonLabel: 'Витамин дня',
    readyBadge: 'Готово!',
    claimedTodayBadge: 'Получено',
    title: 'Витамин дня',
    subtitle: 'Заходи каждый день за витаминной поддержкой и бонусами для иммунной пушки!',
    dayLabel: (day) => `День ${day}`,
    streakLabel: (days) => `Серия дней: ${days}`,
    claimButton: 'Забрать витамин',
    comeBackTomorrow: 'Сегодняшний витамин уже получен — приходи завтра!',
  },
  leaderboardLabels: {
    title: 'Таблица рекордов',
    playerNameLabel: 'Имя игрока',
    saveName: 'Сохранить',
    totalScore: 'Общий счёт',
    totalStars: 'Звёзды',
    levelsCleared: 'Пройдено',
    tabHallOfFame: 'Зал славы',
    tabByLevel: 'По уровням',
    emptyHall: 'Пока нет рекордов. Пройди любой уровень, чтобы попасть в таблицу!',
    bestPrefix: 'Рекорд:',
  },
  encyclopediaTabs: {
    facts: 'Факты',
    enemies: 'Микробы',
    ammo: 'Снаряды',
  },
  factLockedHint: (id) => `Пройди уровень ${id}, чтобы открыть факт`,
  enemyWeaknessLabel: 'Уязвимость:',
  ammoStrongLabel: 'Силён против:',
  ammoWeakLabel: 'Слаб против:',
  settingsLabels: {
    language: 'Язык',
    sound: 'Звук (эффекты)',
    music: 'Фоновая музыка',
    volume: 'Громкость',
    cameraShake: 'Дрожание камеры',
    haptics: 'Вибрация (телефон)',
    resetProgress: 'Сбросить прогресс',
    resetConfirm: 'Удалить все звёзды, факты, монеты, скины и рекорды?',
    confirmYes: 'Да, сбросить',
    cancel: 'Отмена',
  },
  tutorialSkip: 'Понятно!',
  zoneProgress: (unlocked, total) => `Открыто уровней: ${unlocked} из ${total}`,
};

const en: TranslationBundle = {
  appTitle: 'Immune Blast',
  playNow: 'Play Now',
  encyclopedia: 'Encyclopedia',
  bodyMap: 'Body Map',
  shop: 'Shop',
  achievements: 'Achievements',
  leaderboard: 'Records',
  settings: 'Settings',
  back: 'Back',
  coins: 'Coins',
  stars: 'Stars',
  movesLabel: 'Moves',
  levelWord: 'Level',
  megaLevelBadge: 'Mega Level',
  locked: 'Locked',
  retry: 'Retry',
  plusThreeMoves: '+3 Moves',
  nextLevel: 'Next Level',
  toMap: 'Body Map',
  victoryTitle: 'Victory!',
  infectionCleared: 'Infection Cleared!',
  defeatTitle: 'Out of Moves!',
  defeatSubtitle: 'Try again or grab +3 extra moves to finish the defense.',
  score: 'Score',
  reward: 'Reward',
  interestingFactHeader: 'Did You Know?',
  pause: 'Paused',
  resume: 'Resume',
  restart: 'Restart',
  exitToMap: 'Body Map',
  tapToSplit: 'Tap mid-air to split T-Cell into 3!',
  antisepticReady: 'Antiseptic Bomb loaded! Aim and fire!',
  aimAssistActive: 'Aim Assist active',
  goalDestroyTargets: (done, total) => `Targets: ${done} / ${total}`,
  goalDropBlocks: (done, total) => `Dropped: ${done} / ${total}`,
  goalCollapseBelow: (cur, target) =>
    cur <= target ? 'Below target!' : `Height: ${cur} / ≤${target}`,
  goalTitle: {
    destroy_targets: 'Clear all Golden Targets',
    drop_blocks: 'Drop microbes off the Petri dish',
    collapse_below: 'Collapse tower below target line',
  },
  organNames: {
    skin: 'Skin',
    throat: 'Throat',
    lungs: 'Lungs',
    gut: 'Gut',
    blood: 'Bloodstream',
    lymph: 'Lymph Nodes',
  },
  ammoNames: {
    antibody: 'Antibody',
    vaccine: 'Vaccine',
    antibiotic: 'Antibiotic',
    antiviral: 'Antiviral',
    tcell: 'T-Cell',
    antiseptic: 'Antiseptic',
  },
  boosterShortNames: {
    extraMoves: '+2 Moves',
    aimAssist: 'Aim Line',
    antisepticBomb: 'Bomb',
  },
  shopTabs: {
    skins: 'Skins',
    boosters: 'Boosters',
    arsenal: 'Arsenal',
  },
  shopCategories: {
    skins: 'Launcher Skins',
    boosters: 'Combat Boosters',
    ammo: 'Immune Projectiles',
    upgrades: 'Launcher Upgrades',
  },
  buy: 'Buy',
  equip: 'Equip',
  equipped: 'Equipped',
  maxed: 'Maxed',
  owned: 'Stock',
  levelShort: 'Lv.',
  claim: 'Claim',
  claimed: 'Claimed',
  dailyVitamin: {
    buttonLabel: 'Daily Vitamin',
    readyBadge: 'Ready!',
    claimedTodayBadge: 'Claimed',
    title: 'Daily Vitamin',
    subtitle: 'Check in daily for vitamin coins and immune booster rewards!',
    dayLabel: (day) => `Day ${day}`,
    streakLabel: (days) => `Day Streak: ${days}`,
    claimButton: 'Claim Vitamin',
    comeBackTomorrow: 'Today’s vitamin is claimed — come back tomorrow!',
  },
  leaderboardLabels: {
    title: 'Local Records',
    playerNameLabel: 'Player Name',
    saveName: 'Save',
    totalScore: 'Total Score',
    totalStars: 'Stars',
    levelsCleared: 'Cleared',
    tabHallOfFame: 'Hall of Fame',
    tabByLevel: 'By Level',
    emptyHall: 'No records yet. Complete a level to post your high score!',
    bestPrefix: 'Best:',
  },
  encyclopediaTabs: {
    facts: 'Facts',
    enemies: 'Microbes',
    ammo: 'Ammo',
  },
  factLockedHint: (id) => `Complete Level ${id} to unlock this fact`,
  enemyWeaknessLabel: 'Weakness:',
  ammoStrongLabel: 'Strong vs:',
  ammoWeakLabel: 'Weak vs:',
  settingsLabels: {
    language: 'Language',
    sound: 'Sound Effects',
    music: 'Background Music',
    volume: 'Volume',
    cameraShake: 'Camera Shake',
    haptics: 'Haptic Vibration',
    resetProgress: 'Reset Progress',
    resetConfirm: 'Erase all stars, facts, coins, skins, and records?',
    confirmYes: 'Yes, Reset',
    cancel: 'Cancel',
  },
  tutorialSkip: 'Got it!',
  zoneProgress: (unlocked, total) => `Levels unlocked: ${unlocked} of ${total}`,
};

const kk: TranslationBundle = {
  appTitle: 'Immune Blast',
  playNow: 'Ойнау',
  encyclopedia: 'Энциклопедия',
  bodyMap: 'Ағза картасы',
  shop: 'Дүкен',
  achievements: 'Жетістіктер',
  leaderboard: 'Рекордтар',
  settings: 'Баптаулар',
  back: 'Артқа',
  coins: 'Тиындар',
  stars: 'Жұлдыздар',
  movesLabel: 'Жүріс',
  levelWord: 'Деңгей',
  megaLevelBadge: 'Мега-деңгей',
  locked: 'Құлыптаулы',
  retry: 'Қайталау',
  plusThreeMoves: '+3 жүріс',
  nextLevel: 'Келесі',
  toMap: 'Картаға',
  victoryTitle: 'Жеңіс!',
  infectionCleared: 'Инфекция жойылды!',
  defeatTitle: 'Жүрістер бітті!',
  defeatSubtitle: 'Қайтадан байқап көр немесе +3 қосымша жүріс ал.',
  score: 'Ұпай',
  reward: 'Сыйақы',
  interestingFactHeader: 'Бұл қызық',
  pause: 'Кідіріс',
  resume: 'Жалғастыру',
  restart: 'Қайта бастау',
  exitToMap: 'Картаға шығу',
  tapToSplit: 'Ұшып бара жатқанда түрт — Т-лимфоцит 3-ке бөлінеді!',
  antisepticReady: 'Антисептик-бомба оқталды! Көздеп ат!',
  aimAssistActive: 'Нысана-көмекші қосулы',
  goalDestroyTargets: (done, total) => `Нысана: ${done} / ${total}`,
  goalDropBlocks: (done, total) => `Құлатылды: ${done} / ${total}`,
  goalCollapseBelow: (cur, target) =>
    cur <= target ? 'Сызықтан төмен!' : `Биіктік: ${cur} / ≤${target}`,
  goalTitle: {
    destroy_targets: 'Барлық алтын нысананы жой',
    drop_blocks: 'Микробтарды Петри табақшасынан құлат',
    collapse_below: 'Мұнараны сызықтан төмен түсір',
  },
  organNames: {
    skin: 'Тері',
    throat: 'Тамақ',
    lungs: 'Өкпе',
    gut: 'Ішек',
    blood: 'Қан',
    lymph: 'Лимфа түйіндері',
  },
  ammoNames: {
    antibody: 'Антидене',
    vaccine: 'Вакцина',
    antibiotic: 'Антибиотик',
    antiviral: 'Вирусқа қарсы',
    tcell: 'Т-лимфоцит',
    antiseptic: 'Антисептик',
  },
  boosterShortNames: {
    extraMoves: '+2 жүріс',
    aimAssist: 'Нысана',
    antisepticBomb: 'Бомба',
  },
  shopTabs: {
    skins: 'Скиндер',
    boosters: 'Бустерлер',
    arsenal: 'Арсенал',
  },
  shopCategories: {
    skins: 'Зеңбірек скиндері',
    boosters: 'Ұрыс бустерлері',
    ammo: 'Иммундық оқтар',
    upgrades: 'Зеңбірек жақсартулары',
  },
  buy: 'Сатып алу',
  equip: 'Таңдау',
  equipped: 'Таңдалған',
  maxed: 'Макс.',
  owned: 'Қорда',
  levelShort: 'Дең.',
  claim: 'Алу',
  claimed: 'Алынды',
  dailyVitamin: {
    buttonLabel: 'Күн дәрумені',
    readyBadge: 'Дайын!',
    claimedTodayBadge: 'Алынды',
    title: 'Күн дәрумені',
    subtitle: 'Күн сайын кіріп, иммундық зеңбірекке дәрумендік тиындар мен бустерлер ал!',
    dayLabel: (day) => `${day}-күн`,
    streakLabel: (days) => `Күндер тізбегі: ${days}`,
    claimButton: 'Дәруменді алу',
    comeBackTomorrow: 'Бүгінгі дәрумен алынды — ертең қайта кел!',
  },
  leaderboardLabels: {
    title: 'Рекордтар кестесі',
    playerNameLabel: 'Ойыншы есімі',
    saveName: 'Сақтау',
    totalScore: 'Жалпы ұпай',
    totalStars: 'Жұлдыз',
    levelsCleared: 'Өтілді',
    tabHallOfFame: 'Даңқ залы',
    tabByLevel: 'Деңгей бойынша',
    emptyHall: 'Әзірге рекорд жоқ. Кестеге кіру үшін кез келген деңгейден өт!',
    bestPrefix: 'Рекорд:',
  },
  encyclopediaTabs: {
    facts: 'Фактілер',
    enemies: 'Микробтар',
    ammo: 'Оқтар',
  },
  factLockedHint: (id) => `Бұл фактіні ашу үшін ${id}-деңгейден өт`,
  enemyWeaknessLabel: 'Әлсіз тұсы:',
  ammoStrongLabel: 'Күшті қарсы:',
  ammoWeakLabel: 'Әлсіз қарсы:',
  settingsLabels: {
    language: 'Тіл',
    sound: 'Дыбыс әсерлері',
    music: 'Фондық музыка',
    volume: 'Дыбыс деңгейі',
    cameraShake: 'Камера дірілі',
    haptics: 'Діріл (телефон)',
    resetProgress: 'Прогресті өшіру',
    resetConfirm: 'Барлық жұлдыз, факт, тиын, скин және рекордтар өшірілсін бе?',
    confirmYes: 'Иә, өшіру',
    cancel: 'Болдырмау',
  },
  tutorialSkip: 'Түсінікті!',
  zoneProgress: (unlocked, total) => `Ашылған деңгейлер: ${unlocked} / ${total}`,
};

export function getTranslations(lang: LanguageCode): TranslationBundle {
  if (lang === 'en') return en;
  if (lang === 'kk') return kk;
  return ru;
}

export function pickText(lang: LanguageCode, ruText: string, enText: string, kkText: string): string {
  if (lang === 'en') return enText;
  if (lang === 'kk') return kkText;
  return ruText;
}
