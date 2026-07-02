import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';

interface Beat {
  text: string;
}

const BEATS: Beat[] = [
  { text: 'Random ve arkadaşları barınakta kafeste... Kaçış planı yapıyorlar.' },
  { text: 'Random Kedi ince gövdesiyle parmaklıklardan sıyrılıyor!' },
  { text: 'Kediyi durdurun... Kolu çekti! Çat — kafes açıldı!' },
  { text: 'Yandaki hücreden Gölge Random polislere haber veriyor: "Kaçıyorlar!"' },
  { text: 'Panik! Polisleri oyalamak için... HALAY zamanı!' },
];

export class CutsceneScene extends Phaser.Scene {
  private beat = 0;
  private caption!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Cutscene);
  }

  create(): void {
    this.beat = 0;
    const cx = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#20202e');

    // Parmaklıklar (yer tutucu)
    for (let i = 0; i < 10; i++) {
      this.add.rectangle(120 + i * 30, 200, 4, 180, 0x8899aa);
    }

    drawCharacter(this, cx - 120, 210, 'random');
    drawCharacter(this, cx - 40, 210, 'kaptan');
    drawCharacter(this, cx + 40, 210, 'kedi');
    drawCharacter(this, cx + 120, 210, 'krizi');
    // Gölge Random yandaki hücrede
    drawCharacter(this, this.scale.width - 90, 210, 'golge');

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

    addPauseButton(this, SceneKeys.Cutscene);
  }

  private showBeat(): void {
    this.caption.setText(BEATS[this.beat].text);
  }

  private advance(): void {
    this.beat += 1;
    if (this.beat >= BEATS.length) {
      this.scene.start(SceneKeys.Halay);
      return;
    }
    this.showBeat();
  }
}
