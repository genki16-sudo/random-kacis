import { describe, it, expect } from 'vitest';
import { createHalayState, registerHit, timeUp, HIT_GAIN } from '../src/logic/halay';

describe('halay mantığı', () => {
  it('başlangıçta boş, kaybetmemiş, kazanmamış', () => {
    const s = createHalayState();
    expect(s.fill).toBe(0);
    expect(s.failed).toBe(false);
    expect(s.won).toBe(false);
  });

  it('doğru basış barı artırır', () => {
    const s = registerHit(createHalayState(), true);
    expect(s.fill).toBeCloseTo(HIT_GAIN);
  });

  it('yeterli doğru basışta kazanır', () => {
    let s = createHalayState();
    for (let i = 0; i < 20; i++) s = registerHit(s, true);
    expect(s.won).toBe(true);
    expect(s.fill).toBeLessThanOrEqual(1);
  });

  it('yanlış basış barı azaltır ama 0 altına inmez', () => {
    const s = registerHit(createHalayState(), false);
    expect(s.fill).toBe(0);
  });

  it('süre dolunca kazanılmamışsa kaybedilir', () => {
    const s = timeUp(createHalayState());
    expect(s.failed).toBe(true);
  });

  it('süre dolunca zaten kazanılmışsa kaybedilmez', () => {
    let s = createHalayState();
    for (let i = 0; i < 20; i++) s = registerHit(s, true);
    const after = timeUp(s);
    expect(after.failed).toBe(false);
    expect(after.won).toBe(true);
  });
});
