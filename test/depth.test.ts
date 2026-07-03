import { describe, it, expect } from 'vitest';
import { depthScale } from '../src/logic/depth';

describe('depthScale', () => {
  it('maps yTop to minScale and yBottom to maxScale', () => {
    expect(depthScale(300, 300, 470, 0.8, 1.15)).toBeCloseTo(0.8);
    expect(depthScale(470, 300, 470, 0.8, 1.15)).toBeCloseTo(1.15);
  });

  it('interpolates in the middle', () => {
    expect(depthScale(385, 300, 470, 0.8, 1.2)).toBeCloseTo(1.0);
  });

  it('clamps outside the band', () => {
    expect(depthScale(100, 300, 470, 0.8, 1.15)).toBeCloseTo(0.8);
    expect(depthScale(999, 300, 470, 0.8, 1.15)).toBeCloseTo(1.15);
  });
});
