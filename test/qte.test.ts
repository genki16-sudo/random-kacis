import { describe, it, expect } from 'vitest';
import { evaluateQte } from '../src/logic/qte';

describe('anahtar kapma QTE', () => {
  it('pencere içinde basış başarılı', () => {
    expect(evaluateQte(1500, 1200, 1900)).toBe(true);
  });
  it('erken basış başarısız', () => {
    expect(evaluateQte(1000, 1200, 1900)).toBe(false);
  });
  it('geç basış başarısız', () => {
    expect(evaluateQte(2000, 1200, 1900)).toBe(false);
  });
  it('tam kenarlar başarılı', () => {
    expect(evaluateQte(1200, 1200, 1900)).toBe(true);
    expect(evaluateQte(1900, 1200, 1900)).toBe(true);
  });
});
