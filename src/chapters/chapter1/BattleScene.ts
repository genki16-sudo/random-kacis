import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { addGradientBg } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';
import { drawCharacter } from '../../ui/drawCharacter';
import { drawPolice } from '../../ui/drawPolice';
import { showSpeechBubble } from '../../ui/speechBubble';
import { addPauseButton } from '../../ui/pauseButton';
import { playChomp, playWhack } from '../../audio/sfx';
import { browserStorage, clearProgress } from '../../data/save';

const RANDOM_MAX = 10;
const BOSS_MAX = 15;
const BITE_DMG = 3;
const POLICE_DMG = 1;
const BAR_W = 180;

export class BattleScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Container;
  private boss!: Phaser.GameObjects.Container;
  private bubble?: Phaser.GameObjects.Container;
  private menu?: Phaser.GameObjects.Container;
  private attackList?: Phaser.GameObjects.Container;
  private bossHp = BOSS_MAX;
  private randomHp = RANDOM_MAX;
  private bossHpFill!: Phaser.GameObjects.Rectangle;
  private bossHpText!: Phaser.GameObjects.Text;
  private randomHpFill!: Phaser.GameObjects.Rectangle;
  private randomHpText!: Phaser.GameObjects.Text;
  private heroHomeX = 220;
  private bossHomeX = 740;
  private busy = false;
  private over = false;

  constructor() {
    super(SceneKeys.Battle);
  }

  create(): void {
    this.bossHp = BOSS_MAX;
    this.randomHp = RANDOM_MAX;
    this.busy = false;
    this.over = false;
    this.bubble = undefined;
    this.menu = undefined;
    this.attackList = undefined;
    const W = this.scale.width;

    addGradientBg(this, 0x2a1030, 0x0c0410);
    fadeIn(this);

    this.add.text(W / 2, 26, 'SAVAŞ!', {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ff6666', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5);

    // Kızgın Random (sol) ve kızgın Polis (sağ)
    this.heroHomeX = 220;
    this.bossHomeX = W - 220;
    this.hero = drawCharacter(this, this.heroHomeX, 300, 'random', 1.5, false, true);
    this.boss = drawPolice(this, this.bossHomeX, 300, true, 1.6);

    // Can barları
    const randomBar = this.makeHpBar(40, 96, 'Random', 0x43c743, RANDOM_MAX);
    this.randomHpFill = randomBar.fill;
    this.randomHpText = randomBar.text;
    const bossBar = this.makeHpBar(W - 40 - BAR_W, 96, 'Polis', 0xff5555, BOSS_MAX);
    this.bossHpFill = bossBar.fill;
    this.bossHpText = bossBar.text;

    addPauseButton(this, SceneKeys.Battle);

    this.startTutorial();
  }

  private makeHpBar(x: number, y: number, name: string, color: number, max: number): {
    fill: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text;
  } {
    this.add.text(x, y - 18, name, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', stroke: '#201a2a', strokeThickness: 3,
    }).setOrigin(0, 0.5);
    this.add.rectangle(x, y, BAR_W, 18, 0x000000).setStrokeStyle(2, 0xffffff).setOrigin(0, 0.5);
    const fill = this.add.rectangle(x + 2, y, BAR_W - 4, 14, color).setOrigin(0, 0.5);
    const text = this.add.text(x + BAR_W / 2, y, `${max}/${max}`, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ffffff', stroke: '#201a2a', strokeThickness: 3,
    }).setOrigin(0.5);
    return { fill, text };
  }

  private setBubble(text: string): void {
    this.bubble?.destroy();
    this.bubble = showSpeechBubble(this, this.heroHomeX, 232, text, 220);
  }

  private startTutorial(): void {
    this.setBubble('Evet, bu bir savaş! Haydi saldıralım!');
    this.time.delayedCall(1800, () => {
      this.setBubble('Haydi ATAK kutusuna dokun!');
      this.showMenu();
    });
  }

  private showMenu(): void {
    this.menu?.destroy();
    const W = this.scale.width;
    const y = 468;
    const atak = this.makeCommandBox(W / 2 - 115, y, 0xcc3a3a, 'Atak', '#ffffff', (g) => this.drawPaw(g));
    const esya = this.makeCommandBox(W / 2 + 115, y, 0xf2c40f, 'Eşyalar', '#201a2a', (g) => this.drawPlus(g));

    atak.on('pointerup', () => { if (!this.busy) this.showAttackList(); });
    esya.on('pointerup', () => {
      if (this.busy) return;
      this.setBubble('Eşyalar yakında! Şimdilik ATAK.');
    });

    this.menu = this.add.container(0, 0, [atak, esya]);
  }

  private makeCommandBox(
    x: number, y: number, boxColor: number, label: string, labelColor: string,
    drawIcon: (g: Phaser.GameObjects.Graphics) => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 200, 62, boxColor).setStrokeStyle(3, 0x201a2a);
    const g = this.add.graphics();
    g.setPosition(-64, 0);
    drawIcon(g);
    const txt = this.add.text(18, 0, label, {
      fontFamily: 'sans-serif', fontSize: '22px', color: labelColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    const c = this.add.container(x, y, [bg, g, txt]);
    c.setSize(200, 62);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => bg.setScale(1.05));
    c.on('pointerout', () => bg.setScale(1));
    return c;
  }

  // Yeşil pati (Atak simgesi)
  private drawPaw(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x43c743, 1);
    g.lineStyle(2, 0x201a2a, 1);
    g.fillCircle(0, 4, 9);
    g.strokeCircle(0, 4, 9);
    g.fillCircle(-9, -8, 4);
    g.fillCircle(-3, -12, 4);
    g.fillCircle(4, -12, 4);
    g.fillCircle(10, -8, 4);
  }

  // Kırmızı artı (Eşyalar simgesi)
  private drawPlus(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xd83030, 1);
    g.lineStyle(2, 0x201a2a, 1);
    g.fillRect(-4, -12, 8, 24);
    g.fillRect(-12, -4, 24, 8);
    g.strokeRect(-4, -12, 8, 24);
    g.strokeRect(-12, -4, 24, 8);
  }

  private showAttackList(): void {
    this.menu?.destroy();
    this.menu = undefined;
    this.setBubble('ISIRMA saldırısına dokun!');

    const W = this.scale.width;
    const bg = this.add.rectangle(0, 0, 220, 56, 0x3a2036).setStrokeStyle(3, 0xffe066);
    const txt = this.add.text(0, 0, 'Isırma', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const item = this.add.container(W / 2, 468, [bg, txt]);
    item.setSize(220, 56);
    item.setInteractive({ useHandCursor: true });
    item.on('pointerover', () => bg.setFillStyle(0x50305a));
    item.on('pointerout', () => bg.setFillStyle(0x3a2036));
    item.on('pointerup', () => { if (!this.busy) this.performBite(); });
    this.attackList = item;
  }

  private performBite(): void {
    this.busy = true;
    this.attackList?.destroy();
    this.attackList = undefined;
    this.bubble?.destroy();
    this.bubble = undefined;

    const bossX = this.boss.x;
    this.tweens.add({
      targets: this.hero,
      x: bossX - 96,
      duration: 420,
      ease: 'Quad.easeIn',
      onComplete: () => this.doBiteHit(),
    });
  }

  private doBiteHit(): void {
    playChomp();
    // Isırma "atılışı"
    this.tweens.add({ targets: this.hero, scaleX: 1.7, scaleY: 1.3, duration: 90, yoyo: true });
    // Boss sarsılır
    this.tweens.add({ targets: this.boss, x: this.boss.x + 8, duration: 50, yoyo: true, repeat: 3 });

    this.bossHp = Math.max(0, this.bossHp - BITE_DMG);
    this.tweens.add({
      targets: this.bossHpFill,
      width: (BAR_W - 4) * (this.bossHp / BOSS_MAX),
      duration: 300,
    });
    this.bossHpText.setText(`${this.bossHp}/${BOSS_MAX}`);

    this.floatDamage(this.boss.x, this.boss.y - 70, BITE_DMG);

    this.time.delayedCall(450, () => {
      this.tweens.add({
        targets: this.hero,
        x: this.heroHomeX,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.bossHp <= 0) { this.win(); return; }
          this.policeTurn();
        },
      });
    });
  }

  private floatDamage(x: number, y: number, amount: number): void {
    const dmg = this.add.text(x, y, `-${amount}`, {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#ffd43f', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: dmg, y: y - 40, alpha: 0, duration: 800, onComplete: () => dmg.destroy() });
  }

  private policeTurn(): void {
    const bubble = showSpeechBubble(this, this.boss.x, 224, 'İşte copum!', 130);

    // Polis cebinden copunu çıkarır
    const baton = this.add.rectangle(-46, -6, 8, 42, 0x2a1c10).setStrokeStyle(2, 0x201a2a);
    baton.setAlpha(0);
    this.boss.add(baton);

    this.time.delayedCall(650, () => {
      bubble.destroy();
      this.tweens.add({ targets: baton, alpha: 1, duration: 150 });
      this.tweens.add({
        targets: this.boss,
        x: this.heroHomeX + 150,
        duration: 460,
        ease: 'Quad.easeIn',
        onComplete: () => this.policeHit(baton),
      });
    });
  }

  private policeHit(baton: Phaser.GameObjects.Rectangle): void {
    playWhack();
    // cop sallanır
    this.tweens.add({ targets: baton, angle: -75, duration: 130, yoyo: true });
    // Random irkilir
    this.tweens.add({ targets: this.hero, x: this.heroHomeX - 14, duration: 60, yoyo: true, repeat: 2 });

    this.randomHp = Math.max(0, this.randomHp - POLICE_DMG);
    this.tweens.add({
      targets: this.randomHpFill,
      width: (BAR_W - 4) * (this.randomHp / RANDOM_MAX),
      duration: 300,
    });
    this.randomHpText.setText(`${this.randomHp}/${RANDOM_MAX}`);
    this.floatDamage(this.hero.x, this.hero.y - 80, POLICE_DMG);

    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: baton, alpha: 0, duration: 150 });
      this.tweens.add({
        targets: this.boss,
        x: this.bossHomeX,
        duration: 460,
        ease: 'Quad.easeOut',
        onComplete: () => {
          baton.destroy();
          this.afterRound();
        },
      });
    });
  }

  private afterRound(): void {
    if (this.randomHp <= 0) {
      changeScene(this, SceneKeys.GameOver, { retryKey: SceneKeys.Battle });
      return;
    }
    this.busy = false;
    this.setBubble('Sıra sende! ATAK kutusuna dokun.');
    this.showMenu();
  }

  private win(): void {
    if (this.over) return;
    this.over = true;
    this.busy = true;
    clearProgress(browserStorage());
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.7);
    this.add.text(cx, cy - 20, 'Kazandın! 🎉', {
      fontFamily: 'sans-serif', fontSize: '46px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 40, 'Chapter 1 bitti — Chapter 2 yakında! (menü için tıkla)', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.input.once('pointerup', () => changeScene(this, SceneKeys.Title));
  }
}
