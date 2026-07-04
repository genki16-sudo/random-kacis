import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { addGradientBg } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';
import { drawCharacter } from '../../ui/drawCharacter';
import { drawPolice } from '../../ui/drawPolice';
import { showSpeechBubble } from '../../ui/speechBubble';
import { addPauseButton } from '../../ui/pauseButton';
import { playChomp, playWhack, playApplause } from '../../audio/sfx';
import { browserStorage, clearProgress } from '../../data/save';
import {
  GameState, loadState, saveState, useMama as stateUseMama, HP_MAX,
  currentGuc, applyGucMamasi, tickGucBuff, refillYP,
} from '../../state/gameState';

const RANDOM_MAX = HP_MAX; // 10, aynı sabit — kaynak state/gameState.ts
const BOSS_MAX = 15;
const POLICE_DMG = 1;
const MAMA_HEAL = 3;
const BAR_W = 180;

export class BattleScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Container;
  private boss!: Phaser.GameObjects.Container;
  private bubble?: Phaser.GameObjects.Container;
  private menu?: Phaser.GameObjects.Container;
  private list?: Phaser.GameObjects.Container;
  private backBtn?: Phaser.GameObjects.Container;
  private healTutorialShown = false;
  private itemsUnlocked = false;
  private state!: GameState;
  private mamaCountExplained = false;
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
    this.state = loadState(browserStorage());
    this.bossHp = BOSS_MAX;
    this.randomHp = this.state.hp;
    this.busy = false;
    this.over = false;
    this.healTutorialShown = false;
    this.itemsUnlocked = false;
    this.mamaCountExplained = false;
    this.bubble = undefined;
    this.menu = undefined;
    this.list = undefined;
    const W = this.scale.width;

    addGradientBg(this, 0x2a1030, 0x0c0410);
    fadeIn(this);

    this.add.text(W / 2, 26, 'SAVAŞ!', {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ff6666', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5);

    // Arkadaşlar arka planda izler (küçük, soluk)
    const watchers = ['kaptan', 'kedi', 'krizi'] as const;
    watchers.forEach((id, i) => {
      const f = drawCharacter(this, 80 + i * 66, 180, id, 0.6, false);
      f.setAlpha(0.82);
      this.tweens.add({ targets: f, y: f.y - 8, duration: 700, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, delay: i * 200 });
    });

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
      if (!this.itemsUnlocked) { this.setBubble('Önce ATAK ile ısıralım!'); return; }
      this.showItemList();
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
    this.list = this.makeListItem('Isırma', () => this.performBite());
    this.showBackButton();
  }

  private showItemList(): void {
    this.menu?.destroy();
    this.menu = undefined;
    const W = this.scale.width;
    const mamaItem = this.makeListItem(`Mama 🦴 ×${this.state.mama}`, () => this.useMama(), W / 2 - 120);
    const gucItem = this.makeListItem(`Güç Maması 🔴 ×${this.state.gucMamasi}`, () => this.useGucMamasi(), W / 2 + 120);
    this.list = this.add.container(0, 0, [mamaItem, gucItem]);
    if (!this.mamaCountExplained) {
      this.mamaCountExplained = true;
      this.setBubble(`Yanındaki sayı kaç adet olduğunu gösterir. ${this.state.mama} Mama'mız var!`);
      // sonra seçimi sana bırakır
      this.time.delayedCall(2800, () => { this.bubble?.destroy(); this.bubble = undefined; });
    } else {
      this.bubble?.destroy();
      this.bubble = undefined;
    }
    this.showBackButton();
  }

  private showBackButton(): void {
    const W = this.scale.width;
    const bg = this.add.rectangle(0, 0, 120, 44, 0x2a2036).setStrokeStyle(2, 0x8888aa);
    const txt = this.add.text(0, 0, '← Geri', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);
    const c = this.add.container(W / 2, 410, [bg, txt]);
    c.setSize(120, 44);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerup', () => {
      if (this.busy) return;
      this.list?.destroy();
      this.list = undefined;
      this.bubble?.destroy();
      this.bubble = undefined;
      c.destroy();
      this.backBtn = undefined;
      this.showMenu();
    });
    this.backBtn = c;
  }

  private makeListItem(label: string, onPick: () => void, x?: number): Phaser.GameObjects.Container {
    const W = this.scale.width;
    const bg = this.add.rectangle(0, 0, 220, 56, 0x3a2036).setStrokeStyle(3, 0xffe066);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const item = this.add.container(x ?? W / 2, 468, [bg, txt]);
    item.setSize(220, 56);
    item.setInteractive({ useHandCursor: true });
    item.on('pointerover', () => bg.setFillStyle(0x50305a));
    item.on('pointerout', () => bg.setFillStyle(0x3a2036));
    item.on('pointerup', () => { if (!this.busy) onPick(); });
    return item;
  }

  private useMama(): void {
    if (this.state.mama <= 0) {
      this.setBubble('Mama bitti!');
      return;
    }
    this.busy = true;
    this.backBtn?.destroy();
    this.backBtn = undefined;
    this.list?.destroy();
    this.list = undefined;
    this.bubble?.destroy();
    this.bubble = undefined;

    const before = this.randomHp;
    this.state = stateUseMama(this.state); // mama--, state.hp cap'li
    this.randomHp = Math.min(RANDOM_MAX, this.randomHp + MAMA_HEAL);
    saveState(this.state, browserStorage());
    const gain = this.randomHp - before;

    this.tweens.add({
      targets: this.randomHpFill,
      width: (BAR_W - 4) * (this.randomHp / RANDOM_MAX),
      duration: 300,
    });
    this.randomHpText.setText(`${this.randomHp}/${RANDOM_MAX}`);

    // Random mamayı yer (mutlu zıplama)
    playChomp();
    this.tweens.add({ targets: this.hero, scaleX: 1.6, scaleY: 1.7, duration: 130, yoyo: true });

    // "+3 (can +1)" — mamanın gücü ve gerçekte eklenen can
    const t = this.add.text(this.hero.x, this.hero.y - 80, `+${MAMA_HEAL} (can +${gain})`, {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#7bffa0', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 1000, onComplete: () => t.destroy() });

    // Eşya kullanmak da sırayı bitirir -> polisin sırası
    this.time.delayedCall(1000, () => {
      if (this.bossHp <= 0) { this.win(); return; }
      this.policeTurn();
    });
  }

  private useGucMamasi(): void {
    if (this.state.gucMamasi <= 0) { this.setBubble('Güç Maması yok!'); return; }
    this.busy = true;
    this.backBtn?.destroy();
    this.backBtn = undefined;
    this.list?.destroy();
    this.list = undefined;
    this.bubble?.destroy();
    this.bubble = undefined;

    this.state = applyGucMamasi(this.state);
    saveState(this.state, browserStorage());
    this.setBubble('Güç arttı! 2 tur boyunca ısırman daha güçlü! 💪');

    const t = this.add.text(this.hero.x, this.hero.y - 80, 'GÜÇ +3', {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ff9d5c', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 1000, onComplete: () => t.destroy() });

    this.time.delayedCall(1000, () => {
      this.state = tickGucBuff(this.state);
      saveState(this.state, browserStorage());
      if (this.bossHp <= 0) { this.win(); return; }
      this.policeTurn();
    });
  }

  private performBite(): void {
    this.busy = true;
    this.backBtn?.destroy();
    this.backBtn = undefined;
    this.list?.destroy();
    this.list = undefined;
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

    const biteDmg = currentGuc(this.state);
    this.bossHp = Math.max(0, this.bossHp - biteDmg);
    this.tweens.add({
      targets: this.bossHpFill,
      width: (BAR_W - 4) * (this.bossHp / BOSS_MAX),
      duration: 300,
    });
    this.bossHpText.setText(`${this.bossHp}/${BOSS_MAX}`);

    this.floatDamage(this.boss.x, this.boss.y - 70, biteDmg);

    this.time.delayedCall(450, () => {
      this.tweens.add({
        targets: this.hero,
        x: this.heroHomeX,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.state = tickGucBuff(this.state);
          saveState(this.state, browserStorage());
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
      this.state = { ...this.state, hp: 0 };
      saveState(this.state, browserStorage());
      changeScene(this, SceneKeys.GameOver, { retryKey: SceneKeys.Battle });
      return;
    }
    if (!this.healTutorialShown) {
      this.healTutorialShown = true;
      this.startHealTutorial();
      return;
    }
    this.busy = false;
    this.setBubble('Sıra sende! ATAK ya da EŞYALAR.');
    this.showMenu();
  }

  private startHealTutorial(): void {
    this.itemsUnlocked = true;
    this.setBubble('Ah, acıdı!');
    this.time.delayedCall(1400, () => {
      this.setBubble("Neyse, haydi iyileşelim! EŞYALAR kutusuna dokun, Mama'yı seç.");
      this.busy = false;
      this.showMenu();
    });
  }

  private win(): void {
    if (this.over) return;
    this.over = true;
    this.busy = true;
    this.state = refillYP({ ...this.state, hp: this.randomHp });
    saveState(this.state, browserStorage());
    clearProgress(browserStorage());
    const cx = this.scale.width / 2;

    this.add.rectangle(cx, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.78);
    this.add.text(cx, 96, 'Kazandın! 🎉', {
      fontFamily: 'sans-serif', fontSize: '46px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);

    // TP 0 -> 10
    const tpText = this.add.text(cx, 180, 'TP: 0', {
      fontFamily: 'sans-serif', fontSize: '30px', color: '#7bd0ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: 10, duration: 1400, delay: 500,
      onUpdate: (tw) => { tpText.setText(`TP: ${Math.round(tw.getValue() ?? 0)}`); },
      onComplete: () => this.showLevelUp(cx),
    });
  }

  private showLevelUp(cx: number): void {
    // Konfeti patlaması + alkış
    this.confettiBurst(cx, 200);
    playApplause();

    const lvl = this.add.text(cx, 250, 'Seviye Atladın!', {
      fontFamily: 'sans-serif', fontSize: '38px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5).setScale(0).setDepth(10);
    this.tweens.add({ targets: lvl, scale: 1, duration: 400, ease: 'Back.easeOut' });

    this.time.delayedCall(600, () => {
      this.add.text(cx, 320, 'Can  10 → 13', {
        fontFamily: 'sans-serif', fontSize: '26px', color: '#7bffa0', fontStyle: 'bold',
      }).setOrigin(0.5);
    });
    this.time.delayedCall(1000, () => {
      this.add.text(cx, 358, 'Atak  3 → 5', {
        fontFamily: 'sans-serif', fontSize: '26px', color: '#ffb066', fontStyle: 'bold',
      }).setOrigin(0.5);
    });

    // Chapter 2 giriş kartı
    this.time.delayedCall(2600, () => {
      changeScene(this, SceneKeys.ChapterIntro, { title: 'Chapter 2: Macera Başlıyor!', next: SceneKeys.Chapter2_Forest });
    });
  }

  private confettiBurst(cx: number, cy: number): void {
    const colors = [0xff5555, 0xffd43f, 0x43c743, 0x5ab0ff, 0xd98cff, 0xff8c42];
    for (let i = 0; i < 60; i++) {
      const piece = this.add.rectangle(cx, cy, 8, 13, colors[i % colors.length]);
      piece.setAngle(Math.random() * 360);
      const dx = (Math.random() - 0.5) * 760;
      const dy = -Math.random() * 260 - 40;
      this.tweens.add({
        targets: piece,
        x: cx + dx,
        y: cy + dy,
        angle: piece.angle + (Math.random() * 360 - 180),
        duration: 450 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: piece,
            y: this.scale.height + 40,
            angle: piece.angle + 180,
            alpha: 0.15,
            duration: 900 + Math.random() * 600,
            ease: 'Quad.easeIn',
            onComplete: () => piece.destroy(),
          });
        },
      });
    }
  }
}
