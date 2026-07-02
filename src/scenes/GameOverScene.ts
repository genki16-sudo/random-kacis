import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { addGradientBg } from '../ui/scenery';

interface GameOverData {
  retryKey: string;
}

export class GameOverScene extends Phaser.Scene {
  private retryKey = SceneKeys.Halay as string;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: GameOverData): void {
    this.retryKey = data.retryKey;
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    addGradientBg(this, 0x5a1414, 0x1e0808);

    this.add.text(cx, cy - 60, 'YAKALANDIN!', {
      fontFamily: 'sans-serif', fontSize: '56px', color: '#ff5555', fontStyle: 'bold',
    }).setOrigin(0.5);

    const bg = this.add.rectangle(0, 0, 240, 56, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, 'Yeniden Dene', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);
    const btn = this.add.container(cx, cy + 40, [bg, txt]);
    btn.setSize(240, 56);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => bg.setFillStyle(0x50507a));
    btn.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    btn.on('pointerup', () => this.scene.start(this.retryKey));
  }
}
