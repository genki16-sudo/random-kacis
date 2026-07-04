import type { StorageBackend } from '../data/save';

export const HP_MAX = 10;
export const YP_MAX = 5;
export const BITE_BASE = 3;
export const MAMA_HEAL = 3;
export const GUC_MAMASI_BONUS = 3;
export const GUC_MAMASI_TURNS = 2;
export const BOT_YP_COST = 3;
export const BOOT_MULT = 1.6;
export const PRICES: Record<ItemKey, number> = { mama: 5, guc: 10, bot: 50 };

export type ItemKey = 'mama' | 'guc' | 'bot';

export interface GameState {
  hp: number;
  rd: number;
  yp: number;
  gucBuffTurns: number;
  mama: number;
  gucMamasi: number;
  botVar: boolean;
  botKullanildi: boolean;
  tutorialDone: boolean;
}

const STATE_KEY = 'random-kacis-state';

export function newGameState(): GameState {
  return {
    hp: HP_MAX, rd: 0, yp: YP_MAX, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
    botVar: false, botKullanildi: false, tutorialDone: false,
  };
}

export function currentGuc(s: GameState): number {
  return BITE_BASE + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0);
}

export function useMama(s: GameState): GameState {
  if (s.mama <= 0) return s;
  return { ...s, mama: s.mama - 1, hp: Math.min(HP_MAX, s.hp + MAMA_HEAL) };
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

export function canUseBoots(s: GameState): boolean {
  return s.botVar && !s.botKullanildi && s.yp >= BOT_YP_COST;
}

export function useBoots(s: GameState): GameState {
  if (!canUseBoots(s)) return s;
  return { ...s, yp: s.yp - BOT_YP_COST, botKullanildi: true };
}

export function applyGucMamasi(s: GameState): GameState {
  if (s.gucMamasi <= 0) return s;
  return { ...s, gucMamasi: s.gucMamasi - 1, gucBuffTurns: GUC_MAMASI_TURNS };
}

export function tickGucBuff(s: GameState): GameState {
  return { ...s, gucBuffTurns: Math.max(0, s.gucBuffTurns - 1) };
}

export function refillYP(s: GameState): GameState {
  return { ...s, yp: YP_MAX };
}

export function saveState(s: GameState, storage: StorageBackend): void {
  storage.setItem(STATE_KEY, JSON.stringify(s));
}

export function loadState(storage: StorageBackend): GameState {
  const raw = storage.getItem(STATE_KEY);
  if (raw === null) return newGameState();
  try {
    const p = JSON.parse(raw) as Partial<GameState>;
    return { ...newGameState(), ...p };
  } catch {
    return newGameState();
  }
}
