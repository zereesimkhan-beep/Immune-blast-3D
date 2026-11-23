import rawLevels from './levels.json';
import { LevelConfig } from '../types/game';

const levels: LevelConfig[] = rawLevels as LevelConfig[];

export function getAllLevels(): LevelConfig[] {
  return levels;
}

export function getLevelById(id: number): LevelConfig | undefined {
  return levels.find((lvl) => lvl.id === id);
}

export function getTotalLevelCount(): number {
  return levels.length;
}
