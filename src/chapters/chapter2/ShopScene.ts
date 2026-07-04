import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { drawShopkeeper } from '../../ui/shopkeeper';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { fadeIn } from '../../ui/transition';

const OUTLINE = 0x201a2a;

export class ShopScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Chapter2_Shop);
  }

  create(): void {
    const cx = this.scale.width / 2;
    addGradientBg(this, 0xd7b98a, 0x9c7a52);
    addFloor(this, 360, 0x7a4f2c);
    fadeIn(this);

    // Arka raflar + renkli eşyalar
    const shelf = this.add.graphics().setDepth(-50);
    shelf.lineStyle(3, OUTLINE, 1);
    [140, 210].forEach((sy) => {
      shelf.fillStyle(0x8a5a33, 1);
      shelf.fillRect(120, sy, 720, 12);
      shelf.strokeRect(120, sy, 720, 12);
    });
    const colors = [0xd94a4a, 0x4a86d9, 0x4ad98a, 0xd9c24a, 0xb06fd9];
    [150, 260, 370, 480, 600, 710].forEach((ix, i) => {
      shelf.fillStyle(colors[i % colors.length], 1);
      shelf.fillRect(ix, 108, 26, 32);
      shelf.strokeRect(ix, 108, 26, 32);
      shelf.fillStyle(colors[(i + 2) % colors.length], 1);
      shelf.fillRect(ix + 3, 180, 20, 30);
      shelf.strokeRect(ix + 3, 180, 20, 30);
    });

    // Tabela
    this.add.text(cx + 40, 58, 'Köpekçikler Dükkanı', {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(400);

    // Dükkancı (tezgahın arkasında)
    drawShopkeeper(this, cx + 40, 300, 1.15).setDepth(100);

    // Tezgah (dükkancının önünde; alt yarısını gizler)
    const counter = this.add.graphics().setDepth(300);
    counter.lineStyle(3, OUTLINE, 1);
    counter.fillStyle(0x8a5a33, 1);
    counter.fillRoundedRect(cx - 150, 352, 380, 92, 8);
    counter.strokeRoundedRect(cx - 150, 352, 380, 92, 8);
    counter.fillStyle(0xa9743f, 1); // üst tezgah yüzeyi
    counter.fillRect(cx - 158, 344, 396, 14);
    counter.strokeRect(cx - 158, 344, 396, 14);

    // Random + arkadaşları önde (tezgaha bakar)
    drawCharacter(this, 250, 470, 'kaptan', 0.9, false).setDepth(500);
    drawCharacter(this, 185, 482, 'kedi', 0.9, false).setDepth(500);
    drawCharacter(this, 145, 470, 'krizi', 0.9, false).setDepth(500);
    drawCharacter(this, 305, 476, 'random', 1, false).setDepth(510);

    addPauseButton(this, SceneKeys.Chapter2_Shop);
  }
}
