import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { createHalayState, registerHit, timeUp, type HalayState } from '../../logic/halay';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { startHalayMusic, type HalayMusic } from '../../audio/halayMusic';

const ARROWS = ['↑', '↓', '←', '→'] as const;
type Arrow = (typeof ARROWS)[number];
const KEY_TO_ARROW: Record<string, Arrow> = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
const TIME_LIMIT_MS = 12000;

export class HalayScene extends Phaser.Scene {
  private state: HalayState = createHalayState();
  private target: Arrow = '↑';
  private prompt!: Phaser.GameObjects.Text;
  private barFill!: Phaser.GameObjects.Rectangle;
  private timeText!: Phaser.GameObjects.Text;
  private dancers: Phaser.GameObjects.Container[] = [];
  private limitTimer?: Phaser.Time.TimerEvent;
  private finished = false;
  private seed = 0;
  private music?: HalayMusic;

  constructor() {
    super(SceneKeys.Halay);
  }

  create(): void {
    this.state = createHalayState();
    this.finished = false;
    this.seed = 0;
    this.dancers = [];
    const cx = this.scale.width / 2;
    addGradientBg(this, 0x3a2450, 0x1a1226);
    addFloor(this, 268, 0x2e2038);

    this.add.text(cx, 40, 'HALAY! Polisleri oyala 🎶', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#ffe066',
    }).setOrigin(0.5);

    // Halayçılar: elinde halay aleti (sarı çubuk = mendil/çubuk yer tutucu)
    const ids = ['random', 'kaptan', 'kedi', 'krizi'] as const;
    ids.forEach((id, i) => {
      const d = drawCharacter(this, cx - 150 + i * 100, 210, id);
      // Elinde halay mendili (sarı çubuk)
      const prop = this.add.rectangle(26, -12, 6, 42, 0xffd43f).setStrokeStyle(2, 0x201a2a);
      d.add(prop);
      this.dancers.push(d);
      // Sürekli halay ritmi: sırayla zıplama
      this.tweens.add({
        targets: d,
        y: d.y - 14,
        duration: 260,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: i * 130,
      });
    });

    // Oyalama barı
    this.add.text(cx, 300, 'Oyalama Barı', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.add.rectangle(cx, 330, 404, 28, 0x000000).setStrokeStyle(2, 0xffffff);
    this.barFill = this.add.rectangle(cx - 200, 330, 0, 24, 0x43c743).setOrigin(0, 0.5);

    this.prompt = this.add.text(cx, 400, this.target, {
      fontFamily: 'sans-serif', fontSize: '64px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 470, 'Ok tuşuna (veya dokun) doğru bas!', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.timeText = this.add.text(cx, 500, '', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#ffcc66',
    }).setOrigin(0.5);

    this.pickTarget();
    this.buildTouchButtons();

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const arrow = KEY_TO_ARROW[e.key];
      if (arrow) this.press(arrow);
    });

    // Süre sınırı: göreli zamanlayıcı (create anındaki this.time.now güvenilmez)
    this.limitTimer = this.time.addEvent({
      delay: TIME_LIMIT_MS,
      callback: () => {
        if (this.finished) return;
        this.state = timeUp(this.state);
        if (this.state.failed) {
          this.finished = true;
          this.scene.start(SceneKeys.GameOver, { retryKey: SceneKeys.Halay });
        }
      },
    });
    addPauseButton(this, SceneKeys.Halay);

    // Halay müziği (kendi ürettiğimiz, telifsiz)
    this.music = startHalayMusic();
    const onPause = () => this.music?.suspend();
    const onResume = () => this.music?.resume();
    this.events.on('pause', onPause);
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => {
      this.music?.stop();
      this.music = undefined;
      this.events.off('pause', onPause);
      this.events.off('resume', onResume);
    });
  }

  private buildTouchButtons(): void {
    const y = this.scale.height - 40;
    ARROWS.forEach((a, i) => {
      const x = this.scale.width / 2 - 90 + i * 60;
      const b = this.add.circle(x, y, 24, 0x3a3a55).setStrokeStyle(2, 0xffe066).setInteractive({ useHandCursor: true });
      this.add.text(x, y, a, { fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      b.on('pointerup', () => this.press(a));
    });
  }

  // Rastgele yerine sırayla döngü (deterministik, çocuk dostu)
  private pickTarget(): void {
    this.target = ARROWS[this.seed % ARROWS.length];
    this.seed += 1;
    this.prompt?.setText(this.target);
  }

  private press(arrow: Arrow): void {
    if (this.finished) return;
    const correct = arrow === this.target;
    this.state = registerHit(this.state, correct);
    this.barFill.width = 400 * this.state.fill;
    // dansçıları hafif "pat" ettir (zıplama tween'iyle çakışmasın diye ölçek)
    this.dancers.forEach((d) => this.tweens.add({ targets: d, scaleX: 1.12, scaleY: 1.12, duration: 70, yoyo: true }));
    if (this.state.won) {
      this.finished = true;
      this.scene.start(SceneKeys.KeyGrab);
      return;
    }
    if (correct) this.pickTarget();
  }

  update(): void {
    if (this.finished || !this.limitTimer) return;
    const remaining = this.limitTimer.getRemainingSeconds();
    this.timeText.setText(`Süre: ${remaining.toFixed(1)} sn`);
  }
}
