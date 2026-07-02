import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { evaluateQte, QTE_WINDOW_MS } from '../../logic/qte';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';

const WINDOW_START_MS = 1600;

export class KeyGrabScene extends Phaser.Scene {
  private windowStart = 0;
  private windowEnd = 0;
  private cue!: Phaser.GameObjects.Text;
  private resolved = false;

  constructor() {
    super(SceneKeys.KeyGrab);
  }

  create(): void {
    this.resolved = false;
    const cx = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#1e2233');

    this.add.text(cx, 50, 'Polisin cebinde anahtar var...', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);

    drawCharacter(this, cx - 60, 240, 'random');
    // Polis (yer tutucu mavi) + cepte anahtar
    this.add.rectangle(cx + 60, 240, 50, 80, 0x2244aa).setStrokeStyle(3, 0x000000);
    this.add.star(cx + 60, 250, 4, 4, 9, 0xffd43f); // anahtar yer tutucu

    this.cue = this.add.text(cx, 400, 'Bekle...', {
      fontFamily: 'sans-serif', fontSize: '40px', color: '#888888',
    }).setOrigin(0.5);

    this.add.text(cx, 470, 'ŞİMDİ! yazınca boşluğa bas / ekrana dokun', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.windowStart = this.time.now + WINDOW_START_MS;
    this.windowEnd = this.windowStart + QTE_WINDOW_MS;

    this.time.delayedCall(WINDOW_START_MS, () => {
      if (!this.resolved) this.cue.setText('ŞİMDİ!').setColor('#ff5555');
    });
    // Pencere kaçırılırsa kaybet
    this.time.delayedCall(WINDOW_START_MS + QTE_WINDOW_MS + 50, () => {
      if (!this.resolved) this.fail();
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.attempt());
    this.input.on('pointerup', () => this.attempt());

    addPauseButton(this, SceneKeys.KeyGrab);
  }

  private attempt(): void {
    if (this.resolved) return;
    const ok = evaluateQte(this.time.now, this.windowStart, this.windowEnd);
    if (ok) {
      this.resolved = true;
      this.cue.setText('Anahtarı kaptı! 🔑').setColor('#43c743');
      this.time.delayedCall(700, () => this.scene.start(SceneKeys.Escape));
    } else {
      this.fail();
    }
  }

  private fail(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.scene.start(SceneKeys.GameOver, { retryKey: SceneKeys.KeyGrab });
  }
}
