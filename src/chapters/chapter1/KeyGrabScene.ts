import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';

interface Beat {
  text: string;
}

const BEATS: Beat[] = [
  { text: 'Polisler halayla oyalanırken Random usulca yaklaştı...' },
  { text: 'Polisin cebinde parlayan anahtarı gördü. 🔑' },
  { text: 'Dişleriyle nazikçe tuttu... ve usulca çekti!' },
  { text: 'Anahtarı kaptı! Şimdi kapıya koşma zamanı!' },
];

export class KeyGrabScene extends Phaser.Scene {
  private beat = 0;
  private caption!: Phaser.GameObjects.Text;
  private key!: Phaser.GameObjects.Star;

  constructor() {
    super(SceneKeys.KeyGrab);
  }

  create(): void {
    this.beat = 0;
    const cx = this.scale.width / 2;
    addGradientBg(this, 0x233052, 0x121826);
    addFloor(this, 290, 0x1b2438);
    fadeIn(this);

    drawCharacter(this, cx - 60, 240, 'random');
    // Polis (yer tutucu) + şapka + cepte anahtar
    this.add.rectangle(cx + 70, 244, 52, 84, 0x2a5bd0).setStrokeStyle(3, 0x201a2a);
    this.add.rectangle(cx + 70, 196, 46, 16, 0x1c3f96).setStrokeStyle(3, 0x201a2a); // şapka
    this.add.circle(cx + 70, 214, 15, 0xffe0bd).setStrokeStyle(3, 0x201a2a); // yüz
    this.key = this.add.star(cx + 82, 250, 4, 5, 11, 0xffd43f).setStrokeStyle(2, 0xd9a300); // anahtar

    const box = this.add.rectangle(cx, 420, this.scale.width - 80, 110, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff);
    this.caption = this.add.text(box.x, box.y, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff',
      wordWrap: { width: this.scale.width - 130 }, align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, 490, '(devam etmek için tıkla)', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.showBeat();

    this.input.on('pointerup', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());

    addPauseButton(this, SceneKeys.KeyGrab);
  }

  private showBeat(): void {
    this.caption.setText(BEATS[this.beat].text);
    // Son beat'te anahtar Random'a "geçer" (görsel ipucu)
    if (this.beat === BEATS.length - 1) {
      this.key.setPosition(this.scale.width / 2 - 44, 236);
    }
  }

  private advance(): void {
    this.beat += 1;
    if (this.beat >= BEATS.length) {
      changeScene(this, SceneKeys.Escape);
      return;
    }
    this.showBeat();
  }
}
