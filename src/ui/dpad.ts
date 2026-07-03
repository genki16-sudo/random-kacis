// src/ui/dpad.ts
import Phaser from 'phaser';

export interface DPad {
  readonly dx: -1 | 0 | 1;
  readonly dy: -1 | 0 | 1;
  destroy(): void;
}

/** Sol-alt köşede 4 yönlü dokunmatik yön pedi. Kameraya sabit. */
export function createDPad(scene: Phaser.Scene): DPad {
  const state = { dx: 0 as -1 | 0 | 1, dy: 0 as -1 | 0 | 1 };
  const objs: Phaser.GameObjects.GameObject[] = [];
  const cx = 78;
  const cy = scene.scale.height - 78;
  const r = 26;
  const gap = 30;

  const make = (ox: number, oy: number, label: string, onDown: () => void, onUp: () => void) => {
    const bg = scene.add.circle(cx + ox, cy + oy, r, 0x000000, 0.45).setStrokeStyle(2, 0xffffff);
    const txt = scene.add.text(cx + ox, cy + oy, label, {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5);
    bg.setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
    txt.setScrollFactor(0).setDepth(1000);
    bg.on('pointerdown', onDown);
    bg.on('pointerup', onUp);
    bg.on('pointerout', onUp);
    objs.push(bg, txt);
  };

  make(0, -gap, '↑', () => (state.dy = -1), () => { if (state.dy === -1) state.dy = 0; });
  make(0, gap, '↓', () => (state.dy = 1), () => { if (state.dy === 1) state.dy = 0; });
  make(-gap, 0, '←', () => (state.dx = -1), () => { if (state.dx === -1) state.dx = 0; });
  make(gap, 0, '→', () => (state.dx = 1), () => { if (state.dx === 1) state.dx = 0; });

  return {
    get dx() { return state.dx; },
    get dy() { return state.dy; },
    destroy() { objs.forEach((o) => o.destroy()); },
  };
}
