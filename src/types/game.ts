/**
 * Core type definitions for Immune Blast.
 * Shared across physics, levels, facts, storage, audio, i18n, and UI modules.
 */

export type LanguageCode = 'ru' | 'en' | 'kk';

export type ScreenRoute =
  | 'menu'
  | 'map'
  | 'play'
  | 'encyclopedia'
  | 'shop'
  | 'achievements'
  | 'leaderboard'
  | 'settings';

export type OrganZone = 'skin' | 'throat' | 'lungs' | 'gut' | 'blood' | 'lymph';

export type BlockType = 'virus' | 'bacteria' | 'fungus' | 'resistant' | 'target';

export type ProjectileType =
  | 'antibody'
  | 'vaccine'
  | 'antibiotic'
  | 'antiviral'
  | 'tcell'
  | 'antiseptic';

export type LauncherSkinId = 'syringe' | 'immune_cell' | 'microscope';

export type BoosterType = 'extraMoves' | 'aimAssist' | 'antisepticBomb';

export type WinGoalType = 'destroy_targets' | 'drop_blocks' | 'collapse_below';

export interface LevelBlockDef {
  /** Microbe or target category */
  type: BlockType;
  /** X offset in logical world units relative to Petri dish center */
  x: number;
  /** Y offset UPWARD from the Petri dish top surface */
  y: number;
  /** Width in logical world units */
  w: number;
  /** Height in logical world units */
  h: number;
  /** Optional initial rotation in degrees */
  angleDeg?: number;
}

export interface LevelGoalDef {
  type: WinGoalType;
  /** Required dropped blocks for 'drop_blocks', or max height (px) for 'collapse_below' */
  targetValue?: number;
}

export interface LevelTutorialDef {
  titleRu: string;
  titleEn: string;
  titleKk: string;
  bodyRu: string;
  bodyEn: string;
  bodyKk: string;
  hintType: 'aim' | 'balance' | 'special';
}

export interface LevelConfig {
  id: number;
  organZone: OrganZone;
  nameRu: string;
  nameEn: string;
  nameKk: string;
  moves: number;
  /** Petri dish width in logical world units */
  platformWidth: number;
  /** Tilting stiffness of the Petri dish stand */
  platformStiffness: number;
  platformOffsetX?: number;
  availableAmmo: ProjectileType[];
  levelSpecialAmmo?: Partial<
    Record<Exclude<ProjectileType, 'antibody' | 'antiseptic'>, number>
  >;
  goal: LevelGoalDef;
  blocks: LevelBlockDef[];
  tutorial?: LevelTutorialDef;
  firstClearBonus: number;
  isMegaLevel?: boolean;
}

export interface MedicalFactDef {
  levelId: number;
  organZone: OrganZone;
  titleRu: string;
  titleEn: string;
  titleKk: string;
  factRu: string;
  factEn: string;
  factKk: string;
  takeawayRu: string;
  takeawayEn: string;
  takeawayKk: string;
}

export interface UpgradeLevels {
  /** Extends aiming trajectory preview (0..3) */
  aimGuide: number;
  /** Boosts syringe-launcher velocity & impact (0..3) */
  launcherPower: number;
  /** Expands Vaccine weakening aura & Antibiotic blast radius (0..3) */
  bioRadius: number;
}

export interface PlayerStats {
  levelsCompleted: number;
  totalMicrobesCleared: number;
  totalBacteriaCleared: number;
  totalVirusesCleared: number;
  totalTargetsDestroyed: number;
  totalAntibioticBlasts: number;
  totalVaccinesUsed: number;
  totalBoostersUsed: number;
  totalShotsFired: number;
  totalCoinsEarned: number;
  threeStarLevels: number;
}

export interface GameSettings {
  language: LanguageCode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  cameraShake: boolean;
  haptics: boolean;
}

export interface DailyRewardState {
  lastClaimDate: string | null;
  streak: number;
  totalClaims: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  levelId: number;
  score: number;
  stars: number;
  dateIso: string;
}

export interface SaveData {
  playerName: string;
  coins: number;
  unlockedLevel: number; // 1..18
  starsByLevel: Record<number, number>;
  bestScoreByLevel: Record<number, number>;
  unlockedFacts: number[]; // levelIds whose educational fact is unlocked
  ammoInventory: Record<Exclude<ProjectileType, 'antibody' | 'antiseptic'>, number>;
  upgrades: UpgradeLevels;
  ownedSkins: LauncherSkinId[];
  selectedSkin: LauncherSkinId;
  boosters: Record<BoosterType, number>;
  dailyReward: DailyRewardState;
  leaderboard: LeaderboardEntry[];
  claimedAchievements: string[];
  stats: PlayerStats;
  settings: GameSettings;
}

export interface ShopItemDef {
  id: string;
  category: 'skin' | 'booster' | 'ammo' | 'upgrade';
  skinId?: LauncherSkinId;
  boosterType?: BoosterType;
  boosterAmount?: number;
  ammoType?: Exclude<ProjectileType, 'antibody' | 'antiseptic'>;
  ammoAmount?: number;
  upgradeKey?: keyof UpgradeLevels;
  maxLevel?: number;
  basePrice: number;
  priceStep?: number;
  nameRu: string;
  nameEn: string;
  nameKk: string;
  descRu: string;
  descEn: string;
  descKk: string;
}

export interface AchievementDef {
  id: string;
  titleRu: string;
  titleEn: string;
  titleKk: string;
  descRu: string;
  descEn: string;
  descKk: string;
  rewardCoins: number;
  target: number;
  getProgress: (save: SaveData) => number;
}

export type GamePlayStatus = 'aiming' | 'flying' | 'settling' | 'won' | 'lost';

export interface HudSnapshot {
  movesLeft: number;
  totalMoves: number;
  score: number;
  goalType: WinGoalType;
  goalCurrent: number;
  goalTarget: number;
  status: GamePlayStatus;
  canSplitMidAir: boolean;
  isSlowMotion: boolean;
  infectionClearedBanner: boolean;
}
