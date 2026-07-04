import { describe, it, expect } from 'vitest';
import {
  newGameState, useMama, buy, canBuy, useBoots, canUseBoots,
  applyGucMamasi, tickGucBuff, refillYP, currentGuc,
  HP_MAX, YP_MAX, BITE_BASE, GUC_MAMASI_BONUS,
} from '../src/state/gameState';

describe('newGameState', () => {
  it('has correct starting values', () => {
    const s = newGameState();
    expect(s).toEqual({
      hp: 10, rd: 0, yp: 5, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
      botVar: false, botKullanildi: false, tutorialDone: false,
    });
  });
});

describe('useMama', () => {
  it('heals +3 capped at HP_MAX and consumes one mama', () => {
    const s = { ...newGameState(), hp: 8, mama: 2 };
    const r = useMama(s);
    expect(r.hp).toBe(HP_MAX); // 8+3 capped at 10
    expect(r.mama).toBe(1);
  });
  it('does nothing when no mama', () => {
    const s = { ...newGameState(), hp: 5, mama: 0 };
    expect(useMama(s)).toEqual(s);
  });
});

describe('buy', () => {
  it('mama: deducts 5 RD and adds one', () => {
    const s = { ...newGameState(), rd: 20, mama: 0 };
    const r = buy(s, 'mama');
    expect(r.rd).toBe(15);
    expect(r.mama).toBe(1);
  });
  it('bot: deducts 50 RD, sets botVar, only once', () => {
    const s = { ...newGameState(), rd: 60 };
    const r = buy(s, 'bot');
    expect(r.rd).toBe(10);
    expect(r.botVar).toBe(true);
    expect(canBuy(r, 'bot')).toBe(false); // zaten var
  });
  it('canBuy false when insufficient RD', () => {
    expect(canBuy({ ...newGameState(), rd: 3 }, 'mama')).toBe(false);
  });
});

describe('useBoots', () => {
  it('spends YP and activates when owned and enough YP', () => {
    const s = { ...newGameState(), botVar: true, yp: 5 };
    expect(canUseBoots(s)).toBe(true);
    const r = useBoots(s);
    expect(r.yp).toBe(2);
    expect(r.botKullanildi).toBe(true);
  });
  it('cannot use without enough YP or already used', () => {
    expect(canUseBoots({ ...newGameState(), botVar: true, yp: 2 })).toBe(false);
    expect(canUseBoots({ ...newGameState(), botVar: true, yp: 5, botKullanildi: true })).toBe(false);
    expect(canUseBoots({ ...newGameState(), botVar: false, yp: 5 })).toBe(false);
  });
});

describe('güç maması + güç', () => {
  it('currentGuc is base normally, boosted while buff active', () => {
    const s = newGameState();
    expect(currentGuc(s)).toBe(BITE_BASE);
    const buffed = { ...s, gucBuffTurns: 2 };
    expect(currentGuc(buffed)).toBe(BITE_BASE + GUC_MAMASI_BONUS);
  });
  it('applyGucMamasi consumes one and sets 2 turns', () => {
    const s = { ...newGameState(), gucMamasi: 1 };
    const r = applyGucMamasi(s);
    expect(r.gucMamasi).toBe(0);
    expect(r.gucBuffTurns).toBe(2);
  });
  it('tickGucBuff decrements but not below 0', () => {
    expect(tickGucBuff({ ...newGameState(), gucBuffTurns: 2 }).gucBuffTurns).toBe(1);
    expect(tickGucBuff({ ...newGameState(), gucBuffTurns: 0 }).gucBuffTurns).toBe(0);
  });
});

describe('refillYP', () => {
  it('sets yp to YP_MAX', () => {
    expect(refillYP({ ...newGameState(), yp: 1 }).yp).toBe(YP_MAX);
  });
});
