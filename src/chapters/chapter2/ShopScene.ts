import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { drawShopkeeper } from '../../ui/shopkeeper';
import { drawMama, drawBoots } from '../../ui/shopItems';
import { showSpeechBubble } from '../../ui/speechBubble';
import { addPauseButton } from '../../ui/pauseButton';
import { addGradientBg, addFloor } from '../../ui/scenery';
import { fadeIn, changeScene } from '../../ui/transition';
import { browserStorage } from '../../data/save';
import { GameState, loadState, saveState, buy, canBuy } from '../../state/gameState';

const OUTLINE = 0x201a2a;

interface ShopItem {
  key: string;
  name: string;
  price: number;
  x: number;
  draw: (scene: Phaser.Scene, x: number, y: number) => Phaser.GameObjects.Container;
}

export class ShopScene extends Phaser.Scene {
  private state!: GameState;
  private balanceText!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Chapter2_Shop);
  }

  create(): void {
    this.state = loadState(browserStorage());
    if (this.state.rd === 0 && !this.state.tutorialDone) {
      this.state = { ...this.state, rd: 100 };
      saveState(this.state, browserStorage());
    }
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
    this.add.text(cx + 40, 54, 'Köpekçikler Dükkanı', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(400);

    // Dükkancı (tezgahın arkasında, eşyaların arasındaki boşlukta)
    drawShopkeeper(this, cx + 55, 284, 1.1).setDepth(100);

    // Tezgah (dükkancının önünde; alt yarısını gizler)
    const counter = this.add.graphics().setDepth(300);
    counter.lineStyle(3, OUTLINE, 1);
    counter.fillStyle(0x8a5a33, 1);
    counter.fillRoundedRect(cx - 190, 352, 460, 92, 8);
    counter.strokeRoundedRect(cx - 190, 352, 460, 92, 8);
    counter.fillStyle(0xa9743f, 1); // üst tezgah yüzeyi
    counter.fillRect(cx - 198, 344, 476, 14);
    counter.strokeRect(cx - 198, 344, 476, 14);

    // Tezgahtaki eşyalar + fiyatlar
    const items: ShopItem[] = [
      { key: 'mama', name: 'Mama', price: 5, x: cx - 150, draw: (s, x, y) => drawMama(s, x, y, 0xb5763c, 0.72) },
      { key: 'guc', name: 'Güç Maması', price: 10, x: cx - 20, draw: (s, x, y) => drawMama(s, x, y, 0xd94a4a, 0.72) },
      { key: 'bot', name: 'Hız Botları', price: 50, x: cx + 180, draw: (s, x, y) => drawBoots(s, x, y, 0.85) },
    ];
    items.forEach((it) => this.addItem(it));

    // RD bakiyesi (sol üst)
    this.balanceText = this.add.text(16, 14, `💰 ${this.state.rd} RD`, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 5,
    }).setDepth(600);

    // Random + arkadaşları önde (tezgaha bakar)
    drawCharacter(this, 235, 470, 'kaptan', 0.85, false).setDepth(500);
    drawCharacter(this, 175, 482, 'kedi', 0.85, false).setDepth(500);
    drawCharacter(this, 135, 470, 'krizi', 0.85, false).setDepth(500);
    drawCharacter(this, 290, 476, 'random', 0.95, false).setDepth(510);

    addPauseButton(this, SceneKeys.Chapter2_Shop);

    const exit = this.add.text(this.scale.width - 70, 30, '← Çıkış', {
      fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff', stroke: '#201a2a', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(600).setInteractive({ useHandCursor: true });
    exit.on('pointerup', () => changeScene(this, SceneKeys.Chapter2_Park, { fromShop: true }));

    // Dükkancının karşılaması (100 RD hediye) — bir dokunuşla kapanır
    const bubble = showSpeechBubble(
      this,
      cx + 40,
      244,
      'Hoşgeldiniz, siz galiba buralarda yenisiniz benden hediye size 100 RD. RD ne mi demek? RD Random Doları demektir. Buyrun istediğinizi alın',
      360,
    );
    this.input.once('pointerdown', () => bubble.destroy());
  }

  /** Bir eşyayı tezgaha yerleştirir: ikon + isim + fiyat + tıklanınca satın alma. */
  private addItem(it: ShopItem): void {
    it.draw(this, it.x, 332).setDepth(320);
    this.add.text(it.x, 362, it.name, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', align: 'center',
      stroke: '#201a2a', strokeThickness: 3, wordWrap: { width: 120 },
    }).setOrigin(0.5, 0).setDepth(320);
    this.add.text(it.x, 400, `${it.price} RD`, {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#ffe066', fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(320);

    const zone = this.add.rectangle(it.x, 350, 130, 120, 0xffffff, 0.001).setDepth(330);
    zone.setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this.buy(it));
  }

  private buy(it: ShopItem): void {
    if (!canBuy(this.state, it.key as 'mama' | 'guc' | 'bot')) {
      const reason = it.key === 'bot' && this.state.botVar ? 'Zaten aldın' : 'Yetersiz RD!';
      this.floatText(it.x, 300, reason, '#ff6b6b');
      return;
    }
    this.state = buy(this.state, it.key as 'mama' | 'guc' | 'bot');
    saveState(this.state, browserStorage());
    this.balanceText.setText(`💰 ${this.state.rd} RD`);
    this.floatText(it.x, 300, 'Aldın! +1', '#7CFC7C');
  }

  private floatText(x: number, y: number, msg: string, color: string): void {
    const t = this.add.text(x, y, msg, {
      fontFamily: 'sans-serif', fontSize: '20px', color, fontStyle: 'bold',
      stroke: '#201a2a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(700);
    this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 950, onComplete: () => t.destroy() });
  }
}
