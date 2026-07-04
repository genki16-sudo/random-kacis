import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage } from '../data/save';
import {
  GameState, loadState, saveState, useMama, toggleBoots, canEquipBoots,
  currentGuc, BOT_YP_COST, tpToNext,
} from '../state/gameState';

interface InvData { resumeKey: string; }

export class InventoryScene extends Phaser.Scene {
  private resumeKey = SceneKeys.Chapter2_Forest as string;
  private state!: GameState;
  private info!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Container[] = [];

  constructor() { super(SceneKeys.Inventory); }

  init(data: InvData): void { this.resumeKey = data.resumeKey; }

  create(): void {
    // Sahne listesinde chapter sahnelerinden önce kayıtlı; üstte render edilsin
    this.scene.bringToTop();
    const cx = this.scale.width / 2;
    this.state = loadState(browserStorage());
    this.add.rectangle(cx, this.scale.height/2, this.scale.width, this.scale.height, 0x05070d, 0.9).setInteractive();
    this.add.text(cx, 40, '🎒 Envanter', { fontFamily:'sans-serif', fontSize:'30px', color:'#ffe066', fontStyle:'bold' }).setOrigin(0.5);

    this.info = this.add.text(cx, 90, '', { fontFamily:'sans-serif', fontSize:'20px', color:'#ffffff', align:'center' }).setOrigin(0.5);
    this.refreshInfo();

    this.add.text(cx, 150, 'Eşyalar (kullanmak için dokun)', { fontFamily:'sans-serif', fontSize:'16px', color:'#aaaaaa' }).setOrigin(0.5);
    this.buildRows();

    const close = this.makeButton(cx, this.scale.height - 50, 'Kapat', () => this.closeInv());
    this.add.existing(close);
    this.input.keyboard?.once('keydown-ESC', () => this.closeInv());
  }

  private refreshInfo(): void {
    const s = this.state;
    const kalan = tpToNext(s);
    const tpSatiri = kalan === null
      ? `🏅 Seviye ${s.level}    ·    ⭐ TP ${s.tp}  (son seviye)`
      : `🏅 Seviye ${s.level}    ·    ⭐ TP ${s.tp}  (sonraki seviyeye ${kalan} TP)`;
    this.info.setText(
      `💰 ${s.rd} RD    ❤️ Can ${s.hp}/${s.hpMax}    ⚡ YP ${s.yp}/${s.ypMax}    💪 Güç ${currentGuc(s)}\n` +
      tpSatiri
    );
  }

  private buildRows(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    const cx = this.scale.width / 2;
    const s = this.state;
    const defs = [
      { label: `🦴 Mama ×${s.mama}`, onUse: () => this.doUseMama() },
      { label: `🔴 Güç Maması ×${s.gucMamasi}`, onUse: () => this.flash('Bu eşya savaşta kullanılır') },
      { label: `👢 Hız Botları (${BOT_YP_COST} YP) ${s.botVar ? (s.botEquipped ? '· takılı' : '· hazır') : '· yok'}`, onUse: () => this.doToggleBoots() },
    ];
    defs.forEach((d, i) => {
      const c = this.makeButton(cx, 200 + i * 64, d.label, d.onUse);
      this.rows.push(c);
    });
  }

  private doUseMama(): void {
    if (this.state.mama <= 0) { this.flash('Mama yok'); return; }
    this.state = useMama(this.state);
    saveState(this.state, browserStorage());
    this.refreshInfo(); this.buildRows();
    this.flash('Can +3 ❤️');
  }

  private doToggleBoots(): void {
    if (!this.state.botVar) { this.flash('Önce dükkandan al'); return; }
    if (!this.state.botEquipped && !canEquipBoots(this.state)) { this.flash('YP yetersiz (3 gerekir)'); return; }
    const wasEquipped = this.state.botEquipped;
    this.state = toggleBoots(this.state);
    saveState(this.state, browserStorage());
    this.refreshInfo(); this.buildRows();
    this.flash(wasEquipped ? 'Botları çıkardın (YP geri geldi)' : 'Hız botları takıldı! 👢');
  }

  private flash(msg: string): void {
    const t = this.add.text(this.scale.width/2, this.scale.height - 110, msg, {
      fontFamily:'sans-serif', fontSize:'18px', color:'#7CFC7C', stroke:'#201a2a', strokeThickness:4,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets:t, alpha:0, duration:1400, onComplete:()=>t.destroy() });
  }

  private closeInv(): void {
    this.scene.stop();
    this.scene.resume(this.resumeKey);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 360, 50, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, label, { fontFamily:'sans-serif', fontSize:'20px', color:'#ffffff' }).setOrigin(0.5);
    const c = this.add.container(x, y, [bg, txt]);
    c.setSize(360, 50); c.setInteractive({ useHandCursor:true });
    c.on('pointerover', () => bg.setFillStyle(0x50507a));
    c.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    c.on('pointerup', onClick);
    return c;
  }
}
