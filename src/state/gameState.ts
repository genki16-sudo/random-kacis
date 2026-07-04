import type { StorageBackend } from '../data/save';

export const HP_MAX = 10;
export const YP_MAX = 5;
export const BITE_BASE = 3;
export const MAMA_HEAL = 3;
export const GUC_MAMASI_BONUS = 3;
export const GUC_MAMASI_TURNS = 2;
export const BOT_YP_COST = 3;
export const BOOT_MULT = 1.6;
export const YP_LEVEL_GAIN = 3;
export const PRICES: Record<ItemKey, number> = { mama: 5, guc: 10, bot: 50 };

export type ItemKey = 'mama' | 'guc' | 'bot';

export const POLICE_TP = 10;

export interface LevelDef { level: number; tpNeeded: number; hp: number; guc: number; }
export const LEVELS: LevelDef[] = [
  { level: 2, tpNeeded: 10, hp: 3, guc: 2 },
];

export interface GameState {
  hp: number;
  rd: number;
  yp: number;
  ypMax: number;
  gucBuffTurns: number;
  mama: number;
  gucMamasi: number;
  botVar: boolean;
  botEquipped: boolean;
  tutorialDone: boolean;
  tp: number;
  level: number;
  hpMax: number;
  guc: number;
}

const STATE_KEY = 'random-kacis-state';

export function newGameState(): GameState {
  return {
    hp: HP_MAX, rd: 0, yp: YP_MAX, ypMax: YP_MAX, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
    botVar: false, botEquipped: false, tutorialDone: false,
    tp: 0, level: 1, hpMax: HP_MAX, guc: BITE_BASE,
  };
}

export function currentGuc(s: GameState): number {
  return s.guc + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0);
}

export function useMama(s: GameState): GameState {
  if (s.mama <= 0) return s;
  return { ...s, mama: s.mama - 1, hp: Math.min(s.hpMax, s.hp + MAMA_HEAL) };
}

export function addTP(s: GameState, amount: number): GameState {
  let ns: GameState = { ...s, tp: s.tp + amount };
  for (const def of LEVELS) {
    if (ns.level < def.level && ns.tp >= def.tpNeeded) {
      ns = { ...ns, level: def.level, hpMax: ns.hpMax + def.hp, guc: ns.guc + def.guc };
    }
  }
  return ns;
}

export function canBuy(s: GameState, key: ItemKey): boolean {
  if (s.rd < PRICES[key]) return false;
  if (key === 'bot' && s.botVar) return false;
  return true;
}

export function buy(s: GameState, key: ItemKey): GameState {
  if (!canBuy(s, key)) return s;
  const rd = s.rd - PRICES[key];
  if (key === 'mama') return { ...s, rd, mama: s.mama + 1 };
  if (key === 'guc') return { ...s, rd, gucMamasi: s.gucMamasi + 1 };
  return { ...s, rd, botVar: true };
}

export function canEquipBoots(s: GameState): boolean {
  return s.botVar && !s.botEquipped && s.yp >= BOT_YP_COST;
}

export function equipBoots(s: GameState): GameState {
  if (!canEquipBoots(s)) return s;
  return { ...s, yp: s.yp - BOT_YP_COST, botEquipped: true };
}

export function unequipBoots(s: GameState): GameState {
  if (!s.botEquipped) return s;
  // Göç edilen eski kayıtlar equip bedelini ödememiş olabilir; boş YP kapasiteyi aşmasın.
  return { ...s, yp: Math.min(s.yp + BOT_YP_COST, s.ypMax), botEquipped: false };
}

export function toggleBoots(s: GameState): GameState {
  return s.botEquipped ? unequipBoots(s) : equipBoots(s);
}

export function levelUp(s: GameState): GameState {
  return { ...s, ypMax: s.ypMax + YP_LEVEL_GAIN, yp: s.yp + YP_LEVEL_GAIN };
}

export function applyGucMamasi(s: GameState): GameState {
  if (s.gucMamasi <= 0) return s;
  return { ...s, gucMamasi: s.gucMamasi - 1, gucBuffTurns: GUC_MAMASI_TURNS };
}

export function tickGucBuff(s: GameState): GameState {
  return { ...s, gucBuffTurns: Math.max(0, s.gucBuffTurns - 1) };
}

export function saveState(s: GameState, storage: StorageBackend): void {
  storage.setItem(STATE_KEY, JSON.stringify(s));
}

export function loadState(storage: StorageBackend): GameState {
  const raw = storage.getItem(STATE_KEY);
  if (raw === null) return newGameState();
  try {
    const p = JSON.parse(raw) as Partial<GameState> & { botKullanildi?: boolean };
    const merged: GameState = {
      ...newGameState(),
      ...p,
      ypMax: typeof p.ypMax === 'number' ? p.ypMax : YP_MAX,
      botEquipped: p.botEquipped ?? p.botKullanildi ?? false,
    };
    merged.yp = Math.min(merged.yp, merged.ypMax);
    delete (merged as Partial<GameState> & { botKullanildi?: boolean }).botKullanildi;
    return merged;
  } catch {
    return newGameState();
  }
}
