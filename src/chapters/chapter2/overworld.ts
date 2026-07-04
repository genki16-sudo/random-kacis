// src/chapters/chapter2/overworld.ts
import Phaser from 'phaser';
import type { CharacterId } from '../../data/characters';
import { drawCharacter } from '../../ui/drawCharacter';
import { pushTrail, followerPositions, type Pt } from '../../logic/follow';
import { depthScale } from '../../logic/depth';
import { createDPad, type DPad } from '../../ui/dpad';
import { loadState, BOOT_MULT } from '../../state/gameState';
import { browserStorage } from '../../data/save';

export interface OverworldOpts {
  worldWidth: number;
  startX: number;
  startY: number;
  followerIds: CharacterId[];
  yTop: number;
  yBottom: number;
  minScale: number;
  maxScale: number;
  speed: number;
}

const GAP = 10; // takipçiler arası iz-nokta aralığı
const MARGIN = 40;

export class Overworld {
  readonly hero: Phaser.GameObjects.Container;
  readonly followers: Phaser.GameObjects.Container[];
  hasMoved = false;

  private trail: Pt[] = [];
  private dpad: DPad;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<string, Phaser.Input.Keyboard.Key>;
  private marching: { x: number; y: number; done: () => void } | null = null;
  private bootMult = 1;

  constructor(scene: Phaser.Scene, private opts: OverworldOpts) {
    this.followers = opts.followerIds.map((id) =>
      drawCharacter(scene, opts.startX, opts.startY, id, 1, false));
    this.hero = drawCharacter(scene, opts.startX, opts.startY, 'random', 1, false);
    this.trail = [{ x: opts.startX, y: opts.startY }];

    this.dpad = createDPad(scene);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = scene.input.keyboard!.addKeys('W,A,S,D') as Record<string, Phaser.Input.Keyboard.Key>;

    scene.cameras.main.setBounds(0, 0, opts.worldWidth, scene.scale.height);
    scene.cameras.main.startFollow(this.hero, true, 0.1, 0);

    this.bootMult = loadState(browserStorage()).botEquipped ? BOOT_MULT : 1;
    scene.events.on('resume', () => {
      this.bootMult = loadState(browserStorage()).botEquipped ? BOOT_MULT : 1;
    });

    this.applyDepth();
  }

  pos(): { x: number; y: number } {
    return { x: this.hero.x, y: this.hero.y };
  }

  march(targetX: number, targetY: number, onArrive: () => void): void {
    this.marching = { x: targetX, y: targetY, done: onArrive };
  }

  private frozen = false;

  /** Girdiyi dondur (geçiş/cutscene sırasında). march yine de çalışır. */
  freeze(): void {
    this.frozen = true;
  }

  private inputVec(): { vx: number; vy: number } {
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    vx += this.dpad.dx;
    vy += this.dpad.dy;
    return { vx: Math.max(-1, Math.min(1, vx)), vy: Math.max(-1, Math.min(1, vy)) };
  }

  update(): void {
    const { worldWidth, yTop, yBottom } = this.opts;
    const speed = this.opts.speed * this.bootMult;
    let vx: number;
    let vy: number;

    if (this.marching) {
      const dx = this.marching.x - this.hero.x;
      const dy = this.marching.y - this.hero.y;
      const dist = Math.hypot(dx, dy);
      if (dist < speed + 1) {
        const done = this.marching.done;
        this.marching = null;
        done();
        return;
      }
      vx = dx / dist;
      vy = dy / dist;
    } else if (this.frozen) {
      vx = 0;
      vy = 0;
    } else {
      const v = this.inputVec();
      vx = v.vx;
      vy = v.vy;
      if (vx !== 0 || vy !== 0) this.hasMoved = true;
    }

    // normalize diagonal
    const len = Math.hypot(vx, vy) || 1;
    const nx = (vx / len) * speed;
    const ny = (vy / len) * speed;

    this.hero.x = Phaser.Math.Clamp(this.hero.x + nx, MARGIN, worldWidth - MARGIN);
    this.hero.y = Phaser.Math.Clamp(this.hero.y + ny, yTop, yBottom);

    // yönü göster: sola giderken karakteri aynala
    if (vx < -0.1) this.hero.scaleX = -Math.abs(this.hero.scaleX);
    else if (vx > 0.1) this.hero.scaleX = Math.abs(this.hero.scaleX);

    this.trail = pushTrail(this.trail, { x: this.hero.x, y: this.hero.y }, GAP * this.followers.length + 12);
    const targets = followerPositions(this.trail, this.followers.length, GAP);
    this.followers.forEach((f, i) => {
      f.x = targets[i].x;
      f.y = targets[i].y;
    });

    this.applyDepth();
  }

  private applyDepth(): void {
    const { yTop, yBottom, minScale, maxScale } = this.opts;
    const setFor = (c: Phaser.GameObjects.Container) => {
      const s = depthScale(c.y, yTop, yBottom, minScale, maxScale);
      c.scaleY = s;
      c.scaleX = Math.sign(c.scaleX || 1) * s;
      c.setDepth(c.y);
    };
    this.followers.forEach(setFor);
    setFor(this.hero);
  }
}
