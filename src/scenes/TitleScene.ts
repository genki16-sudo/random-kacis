import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage, hasSave, loadProgress, clearProgress } from '../data/save';
import { drawCharacter } from '../ui/drawCharacter';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const cx = this.scale.width / 2;
    const storage = browserStorage();

    this.add.text(cx, 70, "Random'ın Büyük Kaçışı", {
      fontFamily: 'sans-serif', fontSize: '40px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);

    drawCharacter(this, cx, 200, 'random');

    this.makeButton(cx, 300, 'Yeni Oyun', () => {
      clearProgress(storage);
      this.scene.start(SceneKeys.Cutscene);
    });

    const saved = hasSave(storage);
    const cont = this.makeButton(cx, 370, 'Devam Et', () => {
      const data = loadProgress(storage);
      if (data) this.scene.start(data.scene);
    });
    if (!saved) {
      cont.setAlpha(0.4);
      cont.disableInteractive();
    }

    this.add.text(this.scale.width - 12, this.scale.height - 10, "Uzaylılar'ın Yaratıcılarından", {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#8888aa',
    }).setOrigin(1, 1);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 240, 52, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, txt]);
    container.setSize(240, 52);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x50507a));
    container.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    container.on('pointerup', onClick);
    return container;
  }
}
