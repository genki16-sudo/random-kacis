import { describe, it, expect } from 'vitest';
import { pushTrail, followerPositions } from '../src/logic/follow';

describe('pushTrail', () => {
  it('appends the newest point at the end', () => {
    const t = pushTrail([{ x: 0, y: 0 }], { x: 5, y: 9 }, 10);
    expect(t[t.length - 1]).toEqual({ x: 5, y: 9 });
    expect(t.length).toBe(2);
  });

  it('caps length at maxLen, dropping oldest', () => {
    let t: { x: number; y: number }[] = [];
    for (let i = 0; i < 20; i++) t = pushTrail(t, { x: i, y: 0 }, 5);
    expect(t.length).toBe(5);
    expect(t[0]).toEqual({ x: 15, y: 0 });
    expect(t[4]).toEqual({ x: 19, y: 0 });
  });
});

describe('followerPositions', () => {
  it('returns one position per follower, spaced by gap behind the leader', () => {
    // trail index 9 is the leader (newest)
    const trail = Array.from({ length: 10 }, (_, i) => ({ x: i, y: 0 }));
    const pos = followerPositions(trail, 3, 3);
    expect(pos.length).toBe(3);
    expect(pos[0]).toEqual({ x: 6, y: 0 }); // 9 - 1*3
    expect(pos[1]).toEqual({ x: 3, y: 0 }); // 9 - 2*3
    expect(pos[2]).toEqual({ x: 0, y: 0 }); // 9 - 3*3
  });

  it('clamps to the oldest point when the trail is too short', () => {
    const trail = [{ x: 2, y: 2 }, { x: 4, y: 4 }];
    const pos = followerPositions(trail, 2, 5);
    expect(pos[0]).toEqual({ x: 2, y: 2 });
    expect(pos[1]).toEqual({ x: 2, y: 2 });
  });
});
