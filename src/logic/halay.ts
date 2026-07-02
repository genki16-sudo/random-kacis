export interface HalayState {
  fill: number; // 0..1
  failed: boolean;
  won: boolean;
}

export const HIT_GAIN = 0.1;
export const MISS_PENALTY = 0.07;

export function createHalayState(): HalayState {
  return { fill: 0, failed: false, won: false };
}

export function registerHit(state: HalayState, correct: boolean): HalayState {
  if (state.failed || state.won) return state;
  let fill = state.fill + (correct ? HIT_GAIN : -MISS_PENALTY);
  if (fill < 0) fill = 0;
  if (fill > 1) fill = 1;
  return { fill, failed: false, won: fill >= 1 };
}

export function timeUp(state: HalayState): HalayState {
  if (state.won) return state;
  return { ...state, failed: true };
}
