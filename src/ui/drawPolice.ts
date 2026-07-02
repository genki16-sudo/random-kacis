import Phaser from 'phaser';

const OUTLINE = 0x201a2a;
const UNIFORM = 0x2a5bd0;
const UNIFORM_DARK = 0x1c3f96;
const SKIN = 0xffd9b0;

/** Bir polis memuru çizer (isteğe bağlı kızgın kaşlar) ve container döner. */
export function drawPolice(
  scene: Phaser.Scene,
  x: number,
  y: number,
  angry = false,
  scale = 1,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  c.add(g);
  g.lineStyle(3, OUTLINE, 1);

  // Bacaklar
  g.fillStyle(UNIFORM_DARK, 1);
  g.fillRoundedRect(-16, 34, 13, 16, 5);
  g.strokeRoundedRect(-16, 34, 13, 16, 5);
  g.fillRoundedRect(3, 34, 13, 16, 5);
  g.strokeRoundedRect(3, 34, 13, 16, 5);

  // Gövde (üniforma)
  g.fillStyle(UNIFORM, 1);
  g.fillRoundedRect(-24, -8, 48, 46, 12);
  g.strokeRoundedRect(-24, -8, 48, 46, 12);

  // Kemer + rozet
  g.fillStyle(0x101018, 1);
  g.fillRect(-24, 20, 48, 8);
  g.fillStyle(0xffd43f, 1);
  g.fillCircle(0, 24, 4);

  // Kollar
  g.fillStyle(UNIFORM, 1);
  g.fillRoundedRect(-30, -4, 10, 30, 5);
  g.strokeRoundedRect(-30, -4, 10, 30, 5);
  g.fillRoundedRect(20, -4, 10, 30, 5);
  g.strokeRoundedRect(20, -4, 10, 30, 5);

  // Kafa
  g.fillStyle(SKIN, 1);
  g.fillCircle(0, -26, 19);
  g.strokeCircle(0, -26, 19);

  // Şapka
  g.fillStyle(UNIFORM_DARK, 1);
  g.fillRoundedRect(-22, -40, 44, 10, 4); // siperlik
  g.strokeRoundedRect(-22, -40, 44, 10, 4);
  g.fillRoundedRect(-16, -52, 32, 14, 4); // taç
  g.strokeRoundedRect(-16, -52, 32, 14, 4);
  const badge = scene.add.star(0, -45, 5, 3, 6, 0xffd43f).setStrokeStyle(1, OUTLINE);
  c.add(badge);

  // Gözler
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-8, -26, 5);
  g.fillCircle(8, -26, 5);
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(-8, -25, 2.5);
  g.fillCircle(8, -25, 2.5);

  // Bıyık
  g.fillStyle(0x4a3826, 1);
  g.fillRoundedRect(-9, -16, 18, 5, 2);

  // Kızgın kaşlar
  if (angry) {
    g.lineStyle(4, OUTLINE, 1);
    g.lineBetween(-14, -34, -3, -30);
    g.lineBetween(14, -34, 3, -30);
  }

  c.setScale(scale);
  return c;
}
