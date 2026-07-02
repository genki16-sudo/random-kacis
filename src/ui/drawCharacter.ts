import Phaser from 'phaser';
import { CHARACTERS, type CharacterId } from '../data/characters';

const OUTLINE = 0x201a2a;

function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.round((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}

/**
 * Bir karakteri vektör şekillerle çizer ve container döner.
 * Container'ın merkezi gövdenin ortasıdır; ayaklar ~ +44'te.
 */
export function drawCharacter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  id: CharacterId,
  scale = 1,
  showLabel = true,
): Phaser.GameObjects.Container {
  const def = CHARACTERS[id];
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  c.add(g);

  const body = def.color;
  const dark = shade(body, 0.72);
  const light = shade(body, 1.25);
  g.lineStyle(3, OUTLINE, 1);

  // Kuyruk (gövdenin arkasında)
  g.fillStyle(dark, 1);
  g.fillCircle(26, 8, 9);
  g.strokeCircle(26, 8, 9);

  // Bacaklar
  g.fillStyle(dark, 1);
  g.fillRoundedRect(-16, 34, 12, 14, 5);
  g.strokeRoundedRect(-16, 34, 12, 14, 5);
  g.fillRoundedRect(4, 34, 12, 14, 5);
  g.strokeRoundedRect(4, 34, 12, 14, 5);

  // Gövde
  g.fillStyle(body, 1);
  g.fillRoundedRect(-24, -6, 48, 46, 16);
  g.strokeRoundedRect(-24, -6, 48, 46, 16);

  // Karın (açık ton)
  g.fillStyle(light, 1);
  g.fillRoundedRect(-12, 8, 24, 28, 12);

  // Kulaklar (türe göre)
  g.fillStyle(dark, 1);
  if (def.species === 'cat') {
    g.fillTriangle(-20, -44, -6, -30, -22, -20);
    g.strokeTriangle(-20, -44, -6, -30, -22, -20);
    g.fillTriangle(20, -44, 6, -30, 22, -20);
    g.strokeTriangle(20, -44, 6, -30, 22, -20);
  } else if (def.species === 'toy') {
    g.fillCircle(-15, -40, 8);
    g.strokeCircle(-15, -40, 8);
    g.fillCircle(15, -40, 8);
    g.strokeCircle(15, -40, 8);
  } else {
    // köpek: sarkık kulaklar
    g.fillRoundedRect(-24, -40, 13, 28, 6);
    g.strokeRoundedRect(-24, -40, 13, 28, 6);
    g.fillRoundedRect(11, -40, 13, 28, 6);
    g.strokeRoundedRect(11, -40, 13, 28, 6);
  }

  // Kafa
  g.fillStyle(body, 1);
  g.fillCircle(0, -26, 20);
  g.strokeCircle(0, -26, 20);

  // Gözler
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-8, -28, 6);
  g.fillCircle(8, -28, 6);
  g.fillStyle(0x201a2a, 1);
  g.fillCircle(-6, -27, 3);
  g.fillCircle(10, -27, 3);

  // Burun + ağız
  g.fillStyle(0x201a2a, 1);
  g.fillCircle(0, -18, 3.5);
  g.lineStyle(2, OUTLINE, 1);
  g.beginPath();
  g.arc(0, -16, 6, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
  g.strokePath();

  // Gizli ajan gözlüğü
  if (def.hasShades) {
    g.fillStyle(0x101018, 1);
    g.fillRoundedRect(-15, -32, 30, 9, 3);
    g.lineStyle(2, 0x101018, 1);
    g.lineBetween(-15, -30, -20, -31);
    g.lineBetween(15, -30, 20, -31);
  }

  // Kaptan şapkası
  if (def.hat === 'captain') {
    g.fillStyle(0x22284a, 1);
    g.lineStyle(3, OUTLINE, 1);
    g.fillRoundedRect(-20, -44, 40, 9, 4); // siperlik
    g.strokeRoundedRect(-20, -44, 40, 9, 4);
    g.fillRoundedRect(-15, -56, 30, 14, 5); // taç
    g.strokeRoundedRect(-15, -56, 30, 14, 5);
    const star = scene.add.star(0, -49, 5, 3, 7, 0xffd43f).setStrokeStyle(1, OUTLINE);
    c.add(star);
  }

  // Güneş kolyesi
  if (def.hasSunPendant) {
    g.lineStyle(2, 0xd9a300, 1);
    g.lineBetween(-8, -8, 0, 6);
    g.lineBetween(8, -8, 0, 6);
    const sun = scene.add.star(0, 10, 8, 5, 10, 0xffd43f).setStrokeStyle(2, 0xd9a300);
    c.add(sun);
  }

  if (showLabel) {
    const label = scene.add.text(0, 52, def.name, {
      fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff',
      stroke: '#201a2a', strokeThickness: 3,
    }).setOrigin(0.5, 0);
    c.add(label);
  }

  c.setScale(scale);
  return c;
}
