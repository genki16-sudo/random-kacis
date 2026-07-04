import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage, saveProgress } from '../data/save';

interface PauseData {
  resumeKey: string;
}

export class PauseScene extends Phaser.Scene {
  private resumeKey = SceneKeys.Cutscene as string;

  constructor() {
    super(SceneKeys.Pause);
  }

  init(data: PauseData): void {
    this.resumeKey = data.resumeKey;
  }

  create(): void {
    // Sahne listesinde chapter sahnelerinden önce; üstte render edilsin
    this.scene.bringToTop();
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.6);
    this.add.text(cx, cy - 90, 'Durduruldu', {
      fontFamily: 'sans-serif', fontSize: '34px', color: '#ffffff',
    }).setOrigin(0.5);

    this.makeButton(cx, cy - 10, 'Devam Et', () => {
      this.scene.stop();
      this.scene.resume(this.resumeKey);
    });

    this.makeButton(cx, cy + 60, 'Kaydet ve Çık', () => {
      saveProgress({ chapter: 1, scene: this.resumeKey }, browserStorage());
      this.scene.stop(this.resumeKey);
      this.scene.stop();
      this.scene.start(SceneKeys.Title);
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(0, 0, 260, 50, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, txt]);
    container.setSize(260, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x50507a));
    container.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    container.on('pointerup', onClick);
  }
}
