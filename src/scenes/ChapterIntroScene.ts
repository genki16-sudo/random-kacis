import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { addGradientBg } from '../ui/scenery';
import { fadeIn, changeScene } from '../ui/transition';

interface IntroData {
  title: string; // örn. "Chapter 1: Kaçış"
  next: string; // sonra gidilecek sahne anahtarı
}

/** Bölüm başında "Chapter N: ..." kartı gösterir, sonra hedef sahneye geçer. */
export class ChapterIntroScene extends Phaser.Scene {
  private title = 'Chapter';
  private next = SceneKeys.Cutscene as string;
  private advanced = false;

  constructor() {
    super(SceneKeys.ChapterIntro);
  }

  init(data: IntroData): void {
    this.title = data.title;
    this.next = data.next;
    this.advanced = false;
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    addGradientBg(this, 0x141a2e, 0x05070d);
    fadeIn(this);

    this.add.text(cx, cy, this.title, {
      fontFamily: 'sans-serif', fontSize: '52px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 6,
    }).setOrigin(0.5);

    const hint = this.add.text(cx, cy + 70, '(başlamak için tıkla)', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const go = () => {
      if (this.advanced) return;
      // Fade-in bitmeden geçme: changeScene fade çalışırken no-op döner; erken
      // dokunuşta advanced=true yapıp kalıcı takılmayı önle (dokunuşu yok say).
      if (this.cameras.main.fadeEffect.isRunning) return;
      this.advanced = true;
      changeScene(this, this.next);
    };
    // once yerine on: fade sırasındaki (yok sayılan) dokunuş dinleyiciyi tüketmesin
    this.input.on('pointerup', go);
    this.input.keyboard?.on('keydown-SPACE', go);
    this.time.delayedCall(2600, go);
  }
}
