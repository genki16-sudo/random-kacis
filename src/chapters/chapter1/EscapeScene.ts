import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';
import { browserStorage, clearProgress } from '../../data/save';

const SPEED = 3;
const DOOR_X = 880;

export class EscapeScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Container;
  private moveDir = 0;
  private done = false;

  constructor() {
    super(SceneKeys.Escape);
  }

  create(): void {
    this.done = false;
    this.moveDir = 0;
    this.cameras.main.setBackgroundColor('#182818');

    this.add.text(this.scale.width / 2, 40, 'Koridordan kaç! Kapıya ulaş →', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    // Kapı (yer tutucu)
    this.add.rectangle(DOOR_X, 300, 60, 120, 0x8b5a2b).setStrokeStyle(3, 0x000000);
    this.add.text(DOOR_X, 230, 'ÇIKIŞ', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffe066' }).setOrigin(0.5);

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
    if (this.hero.x >= DOOR_X - 10) this.finish();
  }

  private finish(): void {
    this.done = true;
    clearProgress(browserStorage());
    const cx = this.scale.width / 2;
    this.add.rectangle(cx, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7);
    this.add.text(cx, this.scale.height / 2 - 20, 'Chapter 2 yakında!', {
      fontFamily: 'sans-serif', fontSize: '44px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, this.scale.height / 2 + 40, '(menüye dönmek için tıkla)', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.input.once('pointerup', () => this.scene.start(SceneKeys.Title));
  }
}
