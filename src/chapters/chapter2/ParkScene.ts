// src/chapters/chapter2/ParkScene.ts
import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { Overworld } from './overworld';
import { drawKulube, drawShop, drawBush } from '../../ui/forest';
import { showSpeechBubble } from '../../ui/speechBubble';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';

const WORLD_W = 1800;
const SHOP_X = 1560;

export class ParkScene extends Phaser.Scene {
  private world!: Overworld;
  private bubble?: Phaser.GameObjects.Container;
  private phase: 'walk' | 'toShop' | 'done' = 'walk';

  constructor() {
    super(SceneKeys.Chapter2_Park);
  }

  create(): void {
    this.phase = 'walk';
    // Gökyüzü + zemin kameraya sabit: dünya ekrandan geniş, kaydırınca siyah kalmasın
    addGradientBg(this, 0x6fa9d6, 0x3a6b8f).setScrollFactor(0);
    addFloor(this, 300, 0x4c9a4c).setScrollFactor(0);
    fadeIn(this);

    // Köpek kulübeleri (ağaç yerine)
    const kulubeX = [220, 470, 760, 1050, 1320];
    kulubeX.forEach((x, i) => drawKulube(this, x, 320 + (i % 2) * 24, 1).setDepth(-30 + i));
    for (let i = 0; i < 14; i++) drawBush(this, 120 + i * 130, 490, 0.9).setDepth(500 + i);

    // Dükkan (sağ tarafta)
    drawShop(this, SHOP_X, 330).setDepth(200);

    this.world = new Overworld(this, {
      worldWidth: WORLD_W,
      startX: 110,
      startY: 430,
      followerIds: ['kaptan', 'kedi', 'krizi'],
      yTop: 340,
      yBottom: 470,
      minScale: 0.8,
      maxScale: 1.15,
      speed: 3,
    });

    addPauseButton(this, SceneKeys.Chapter2_Park);
  }

  update(): void {
    if (this.phase === 'done') return;
    this.world.update();

    if (this.phase === 'walk' && this.world.pos().x >= SHOP_X - 120) {
      this.phase = 'toShop';
      this.world.freeze(); // oyuncu balondan uzaklaşamasın; march sonra devralır
      this.bubble = showSpeechBubble(
        this,
        this.world.hero.x,
        this.world.hero.y - 40,
        'Aaa dükkan! Haydi bir bakalım',
        200,
      );
      // Kısa bir an balon görünsün, sonra dükkana yürü
      this.time.delayedCall(1100, () => {
        this.bubble?.destroy();
        this.world.march(SHOP_X, 360, () => {
          this.phase = 'done';
          changeScene(this, SceneKeys.Chapter2_Shop);
        });
      });
    }
  }
}
