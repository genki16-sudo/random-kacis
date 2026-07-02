export const QTE_WINDOW_MS = 1200;

export function evaluateQte(pressTime: number, windowStart: number, windowEnd: number): boolean {
  return pressTime >= windowStart && pressTime <= windowEnd;
}
