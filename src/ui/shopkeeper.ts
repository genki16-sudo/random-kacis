import Phaser from 'phaser';
import { drawCharacter } from './drawCharacter';

const OUTLINE = 0x201a2a;
const RED = 0xd94a4a;
const WHITE = 0xffffff;

/**
 * Dükkancı: Random ile aynı şekilde yeşil köpekçik, üstüne kırmızı-beyaz
 * şeritli şapka + şeritli kıyafet + pantolon eklenmiş.
 */
export function drawShopkeeper(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  // Taban: yeşil Random köpeği (etiketsiz), ölçek 1 — kıyafeti üstüne çizeceğiz
  const c = drawCharacter(scene, x, y, 'random', 1, false);
  const g = scene.add.graphics();
  c.add(g);

  // --- Kıyafet (gövde): beyaz taban + kırmızı yatay şeritler ---
  g.lineStyle(3, OUTLINE, 1);
  g.fillStyle(WHITE, 1);
  g.fillRoundedRect(-23, -2, 46, 34, 12);
  g.strokeRoundedRect(-23, -2, 46, 34, 12);
  g.fillStyle(RED, 1);
  for (const yy of [1, 11, 21]) g.fillRect(-21, yy, 42, 5);

  // --- Pantolon (bel + bacaklar): kırmızı-beyaz ---
  g.lineStyle(3, OUTLINE, 1);
  g.fillStyle(RED, 1);
  g.fillRoundedRect(-20, 28, 40, 12, 6); // bel bandı
  g.strokeRoundedRect(-20, 28, 40, 12, 6);
  g.fillRoundedRect(-16, 34, 12, 14, 5); // sol bacak
  g.strokeRoundedRect(-16, 34, 12, 14, 5);
  g.fillRoundedRect(4, 34, 12, 14, 5); // sağ bacak
  g.strokeRoundedRect(4, 34, 12, 14, 5);
  g.fillStyle(WHITE, 1); // bacaklarda beyaz şerit
  g.fillRect(-14, 39, 8, 4);
  g.fillRect(6, 39, 8, 4);

  // --- Şapka (kafanın üstünde): şeritli kep + ponpon ---
  g.lineStyle(3, OUTLINE, 1);
  g.fillStyle(WHITE, 1);
  g.fillRoundedRect(-20, -48, 40, 9, 4); // bant/siperlik
  g.strokeRoundedRect(-20, -48, 40, 9, 4);
  g.fillRoundedRect(-15, -60, 30, 14, 5); // taç (beyaz taban)
  g.strokeRoundedRect(-15, -60, 30, 14, 5);
  g.fillStyle(RED, 1); // dikey kırmızı şeritler
  for (const xx of [-12, -2, 8]) g.fillRect(xx, -59, 5, 12);
  g.fillStyle(WHITE, 1); // ponpon
  g.fillCircle(0, -62, 4);
  g.lineStyle(2, OUTLINE, 1);
  g.strokeCircle(0, -62, 4);

  c.setScale(scale);
  return c;
}
