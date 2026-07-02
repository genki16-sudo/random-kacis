import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { drawPolice } from '../../ui/drawPolice';
import { showSpeechBubble } from '../../ui/speechBubble';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';
import { playDoorCreak } from '../../audio/sfx';

const SPEED = 3;
const DOOR_X = 880;

const FOLLOWERS = ['kaptan', 'kedi', 'krizi'] as const;

export class EscapeScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Container;
  private friends: Phaser.GameObjects.Container[] = [];
  private doorInner!: Phaser.GameObjects.Rectangle;
  private moveDir = 0;
  private done = false;

  constructor() {
    super(SceneKeys.Escape);
  }

  create(): void {
    this.done = false;
    this.moveDir = 0;
    addGradientBg(this, 0x1f4a2a, 0x0f1f14);
    addFloor(this, 356, 0x18351f);
    fadeIn(this);

    this.add.text(this.scale.width / 2, 40, 'Koridordan kaç! Kapıya ulaş →', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5);

    // Kapı (çerçeve + karanlık aralık + açılan iç panel + kol)
    this.add.rectangle(DOOR_X, 300, 64, 128, 0x8b5a2b).setStrokeStyle(4, 0x201a2a);
    this.add.rectangle(DOOR_X, 300, 44, 108, 0x05070a); // arkadaki karanlık
    this.doorInner = this.add.rectangle(DOOR_X, 300, 44, 108, 0x6f4622).setStrokeStyle(2, 0x201a2a);
    this.add.circle(DOOR_X + 14, 300, 5, 0xffd43f); // kapı kolu
    this.add.text(DOOR_X, 218, 'ÇIKIŞ', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffe066', stroke: '#201a2a', strokeThickness: 3 }).setOrigin(0.5);

    // Arkadaşlar Random'ın arkasından gelir
    this.friends = FOLLOWERS.map((id, i) =>
      drawCharacter(this, 90 - (i + 1) * 58, 300, id, 0.85, false));

    this.hero = drawCharacter(this, 90, 300, 'random');

    // Sağ/sol dokunmatik butonlar
    this.makeMoveButton(60, this.scale.height - 40, '←', -1);
    this.makeMoveButton(140, this.scale.height - 40, '→', 1);

    this.input.keyboard?.on('keydown-LEFT', () => { this.moveDir = -1; });
    this.input.keyboard?.on('keydown-RIGHT', () => { this.moveDir = 1; });
    this.input.keyboard?.on('keyup-LEFT', () => { if (this.moveDir === -1) this.moveDir = 0; });
    this.input.keyboard?.on('keyup-RIGHT', () => { if (this.moveDir === 1) this.moveDir = 0; });

    addPauseButton(this, SceneKeys.Escape);
  }

  private makeMoveButton(x: number, y: number, label: string, dir: number): void {
    const b = this.add.circle(x, y, 24, 0x3a3a55).setStrokeStyle(2, 0xffe066).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    b.on('pointerdown', () => { this.moveDir = dir; });
    b.on('pointerup', () => { this.moveDir = 0; });
    b.on('pointerout', () => { if (this.moveDir === dir) this.moveDir = 0; });
  }

  update(): void {
    if (this.done) return;
    this.hero.x += this.moveDir * SPEED;
    this.hero.x = Phaser.Math.Clamp(this.hero.x, 60, DOOR_X);
    // arkadaşlar arkadan takip eder
    this.friends.forEach((f, i) => {
      f.x = Phaser.Math.Clamp(this.hero.x - (i + 1) * 58, 20, DOOR_X - 40);
    });
    if (this.hero.x >= DOOR_X - 10) this.finish();
  }

  private finish(): void {
    this.done = true;
    this.moveDir = 0;

    // Kapı gıcırt sesiyle açılır (iç panel aralanır, karanlık görünür)
    playDoorCreak();
    this.tweens.add({ targets: this.doorInner, scaleX: 0.12, duration: 800, ease: 'Quad.easeIn' });

    // Random şaşkınlıkla geri çekilir
    this.tweens.add({ targets: this.hero, x: DOOR_X - 170, duration: 500, ease: 'Quad.easeOut' });

    // Kapıdan polis çıkar
    const police = drawPolice(this, DOOR_X, 300, true, 1.0);
    police.setAlpha(0);
    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: police, alpha: 1, duration: 200 });
      this.tweens.add({ targets: police, x: DOOR_X - 70, duration: 700, ease: 'Quad.easeOut' });
    });

    // Random "Eyvah!" der
    this.time.delayedCall(1500, () => {
      showSpeechBubble(this, this.hero.x, this.hero.y - 60, 'Eyvah!', 120);
    });

    // Savaş başlar
    this.time.delayedCall(2700, () => changeScene(this, SceneKeys.Battle));
  }
}
