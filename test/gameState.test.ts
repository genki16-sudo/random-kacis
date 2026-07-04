import { describe, it, expect } from 'vitest';
import {
  newGameState, useMama, buy, canBuy,
  canEquipBoots, equipBoots, unequipBoots, toggleBoots, levelUp,
  applyGucMamasi, tickGucBuff, currentGuc,
  HP_MAX, YP_MAX, BITE_BASE, GUC_MAMASI_BONUS, YP_LEVEL_GAIN, loadState,
} from '../src/state/gameState';

describe('newGameState', () => {
  it('has correct starting values incl. ypMax and botEquipped', () => {
    expect(newGameState()).toEqual({
      hp: 10, rd: 0, yp: 5, ypMax: 5, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
      botVar: false, botEquipped: false, tutorialDone: false,
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

describe('bot equip/unequip', () => {
  it('equip spends YP and marks equipped', () => {
    const s = { ...newGameState(), botVar: true, yp: 5 };
    expect(canEquipBoots(s)).toBe(true);
    const r = equipBoots(s);
    expect(r.yp).toBe(2);
    expect(r.botEquipped).toBe(true);
  });
  it('unequip refunds YP and clears equipped', () => {
    const s = { ...newGameState(), botVar: true, yp: 2, botEquipped: true };
    const r = unequipBoots(s);
    expect(r.yp).toBe(5);
    expect(r.botEquipped).toBe(false);
  });
  it('toggle equips then unequips', () => {
    const s = { ...newGameState(), botVar: true, yp: 5 };
    const eq = toggleBoots(s);
    expect(eq.botEquipped).toBe(true);
    expect(eq.yp).toBe(2);
    const un = toggleBoots(eq);
    expect(un.botEquipped).toBe(false);
    expect(un.yp).toBe(5);
  });
  it('cannot equip without ownership or enough YP', () => {
    expect(canEquipBoots({ ...newGameState(), botVar: false, yp: 5 })).toBe(false);
    expect(canEquipBoots({ ...newGameState(), botVar: true, yp: 2 })).toBe(false);
    expect(canEquipBoots({ ...newGameState(), botVar: true, yp: 5, botEquipped: true })).toBe(false);
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

describe('levelUp', () => {
  it('raises ypMax and free yp by YP_LEVEL_GAIN', () => {
    const s = { ...newGameState(), yp: 2, ypMax: 5 }; // bot takılıyken gibi
    const r = levelUp(s);
    expect(r.ypMax).toBe(5 + YP_LEVEL_GAIN);
    expect(r.yp).toBe(2 + YP_LEVEL_GAIN); // örn 5/8
  });
});

describe('loadState migration', () => {
  it('migrates old botKullanildi and missing ypMax', () => {
    const storage = {
      getItem: () => JSON.stringify({ hp: 7, rd: 20, yp: 2, mama: 3, botVar: true, botKullanildi: true }),
      setItem: () => {}, removeItem: () => {},
    };
    const s = loadState(storage);
    expect(s.ypMax).toBe(YP_MAX);          // eksik -> 5
    expect(s.botEquipped).toBe(true);      // eski botKullanildi taşındı
    expect(s.yp).toBe(2);
    expect('botKullanildi' in s).toBe(false);
  });
  it('clamps yp to ypMax', () => {
    const storage = {
      getItem: () => JSON.stringify({ yp: 9, ypMax: 5 }),
      setItem: () => {}, removeItem: () => {},
    };
    expect(loadState(storage).yp).toBe(5);
  });
});
