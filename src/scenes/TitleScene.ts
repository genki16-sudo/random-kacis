import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage, hasSave, loadProgress, clearProgress } from '../data/save';
import { drawCharacter } from '../ui/drawCharacter';
import { addGradientBg, addFloor } from '../ui/scenery';
import { fadeIn, changeScene } from '../ui/transition';

export class TitleScene extends Phaser.Scene {
  private secretClicks = 0;

  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const cx = this.scale.width / 2;
    const storage = browserStorage();

    addGradientBg(this, 0x2b4a6f, 0x141a2e);
    addFloor(this, 250, 0x22304a);
    fadeIn(this);

    this.add.text(cx, 72, 'Random Köpek', {
      fontFamily: 'sans-serif', fontSize: '46px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 5,
    }).setOrigin(0.5);

    const hero = drawCharacter(this, cx, 185, 'random', 1.5, false);
    this.tweens.add({ targets: hero, y: hero.y - 10, duration: 900, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

    this.makeButton(cx, 300, 'Yeni Oyun', () => {
      clearProgress(storage);
      changeScene(this, SceneKeys.ChapterIntro, { title: 'Chapter 1: Kaçış', next: SceneKeys.Cutscene });
    });

    const saved = hasSave(storage);
    const cont = this.makeButton(cx, 370, 'Devam Et', () => {
      const data = loadProgress(storage);
      if (data) changeScene(this, data.scene);
    });
    if (!saved) {
      cont.setAlpha(0.4);
      cont.disableInteractive();
    }

    const credit = this.add.text(this.scale.width - 12, this.scale.height - 10, 'enkisoft', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#8888aa',
    }).setOrigin(1, 1);

    // Gizli test kodu: enkisoft'a 10 kez tıkla → bölüm seç menüsü
    this.secretClicks = 0;
    credit.setInteractive({ useHandCursor: false });
    credit.on('pointerup', () => {
      this.secretClicks += 1;
      if (this.secretClicks >= 10) {
        this.secretClicks = 0;
        this.showChapterSelect();
      }
    });
  }

  /** Gizli bölüm seçme menüsü (enkisoft'a 10 tık ile açılır). */
  private showChapterSelect(): void {
    const cx = this.scale.width / 2;
    const layer = this.add.container(0, 0).setDepth(2000);

    const veil = this.add
      .rectangle(cx, this.scale.height / 2, this.scale.width, this.scale.height, 0x05070d, 0.92)
      .setInteractive(); // arkadaki butonlara tık geçmesin
    layer.add(veil);

    layer.add(
      this.add.text(cx, 56, '🔓 Bölüm Seç (gizli)', {
        fontFamily: 'sans-serif', fontSize: '26px', color: '#ffe066', fontStyle: 'bold',
      }).setOrigin(0.5),
    );

    const jumps: Array<[string, string]> = [
      ['Ch1: Kaçış', SceneKeys.Cutscene],
      ['Ch1: Halay', SceneKeys.Halay],
      ['Ch1: Anahtar', SceneKeys.KeyGrab],
      ['Ch1: Savaş', SceneKeys.Battle],
      ['Ch2: Orman', SceneKeys.Chapter2_Forest],
      ['Ch2: Park', SceneKeys.Chapter2_Park],
    ];
    jumps.forEach(([label, key], i) => {
      const bx = cx + (i % 2 === 0 ? -130 : 130);
      const by = 130 + Math.floor(i / 2) * 74;
      layer.add(this.makeButton(bx, by, label, () => changeScene(this, key)));
    });

    layer.add(this.makeButton(cx, 130 + 3 * 74, 'Kapat', () => layer.destroy()));
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
