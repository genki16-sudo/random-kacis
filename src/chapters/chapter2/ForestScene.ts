// src/chapters/chapter2/ForestScene.ts
import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { Overworld } from './overworld';
import { drawTree, drawBush, drawParkSign } from '../../ui/forest';
import { showSpeechBubble } from '../../ui/speechBubble';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';

const WORLD_W = 2200;
const GATE_X = 1980;

export class ForestScene extends Phaser.Scene {
  private world!: Overworld;
  private bubble?: Phaser.GameObjects.Container;
  private leaving = false;

  constructor() {
    super(SceneKeys.Chapter2_Forest);
  }

  create(): void {
    this.leaving = false;
    addGradientBg(this, 0x4a7f5a, 0x1c3324);
    addFloor(this, 300, 0x2c5233);
    fadeIn(this);

    // Uzak ağaç şeridi (parallax — kamerayla yavaş kayar)
    for (let i = 0; i < 16; i++) {
      drawTree(this, 120 + i * 150, 250, 0.7).setScrollFactor(0.35).setDepth(-80);
    }
    // Orta ağaçlar + çalılar (dünya koordinatında)
    for (let i = 0; i < 12; i++) {
      drawTree(this, 200 + i * 190, 330 + (i % 2) * 20, 1).setDepth(-40 + i);
    }
    for (let i = 0; i < 16; i++) {
      drawBush(this, 140 + i * 140, 480, 1).setDepth(400 + i);
    }

    // Patika (ortadan sağa uzanan açık şerit)
    const path = this.add.graphics();
    path.fillStyle(0xc2a878, 0.5);
    path.fillRect(0, 380, WORLD_W, 90);
    path.setDepth(-85);

    // Park girişi tabelası (sağ uçta)
    drawParkSign(this, GATE_X, 250, 'Köpekçikler Parkı', 'kuranlar: Köpekçikler').setDepth(300);
    // Basit kapı boşluğu
    this.add.rectangle(GATE_X, 360, 70, 120, 0x05070a).setStrokeStyle(4, 0x6b4a2b).setDepth(250);

    this.world = new Overworld(this, {
      worldWidth: WORLD_W,
      startX: 120,
      startY: 420,
      followerIds: ['kaptan', 'kedi', 'krizi'],
      yTop: 340,
      yBottom: 470,
      minScale: 0.8,
      maxScale: 1.15,
      speed: 3,
    });

    // Başlangıç yönergesi balonu
    this.bubble = showSpeechBubble(
      this,
      this.world.hero.x,
      this.world.hero.y - 40,
      'Ok tuşlarıyla veya oklara dokunarak hareket et!',
      230,
    );

    addPauseButton(this, SceneKeys.Chapter2_Forest);
  }

  update(): void {
    // Not: `leaving` sırasında da world.update() çağrılmalı ki march ilerlesin.
    this.world.update();

    // Hareket başlayınca yönerge balonunu gizle
    if (this.bubble && this.world.hasMoved) {
      this.bubble.destroy();
      this.bubble = undefined;
    }

    // Park girişine ulaşınca: bir kez march başlat → ParkScene
    if (!this.leaving && this.world.pos().x >= GATE_X - 40) {
      this.leaving = true;
      this.world.march(GATE_X, 360, () => changeScene(this, SceneKeys.Chapter2_Park));
    }
  }
}
