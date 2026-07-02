import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../src/data/characters';

describe('CHARACTERS', () => {
  it('5 karakter içerir', () => {
    expect(Object.keys(CHARACTERS)).toHaveLength(5);
  });

  it('Random Köpek kahramandır ve yeşildir', () => {
    expect(CHARACTERS.random.name).toBe('Random Köpek');
    expect(CHARACTERS.random.role).toBe('hero');
  });

  it('Kaptan Random kaptan şapkası takar', () => {
    expect(CHARACTERS.kaptan.hat).toBe('captain');
  });

  it('Random Krizi güneş kolyesi taşır', () => {
    expect(CHARACTERS.krizi.hasSunPendant).toBe(true);
  });

  it('Gölge Random rakiptir', () => {
    expect(CHARACTERS.golge.role).toBe('rival');
  });
});
