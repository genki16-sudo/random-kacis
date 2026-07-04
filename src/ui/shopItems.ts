import Phaser from 'phaser';

const OUTLINE = 0x201a2a;

/**
 * Mama kâsesi. foodColor ile mamanın rengi değişir:
 * normal mama = kahverengi, güç maması = kırmızı (aynı mama, farklı renk).
 */
export function drawMama(
  scene: Phaser.Scene,
  x: number,
  y: number,
  foodColor = 0xb5763c,
  scale = 1,
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE, 1);

  // Mama yığını (kâsenin üstünde)
  g.fillStyle(foodColor, 1);
  g.fillEllipse(0, -4, 44, 24);
  const lighter = ((foodColor >> 1) & 0x7f7f7f) | 0x2a2a2a;
  g.fillStyle(lighter, 1);
  g.fillCircle(-9, -8, 6);
  g.fillCircle(3, -11, 6);
  g.fillCircle(13, -6, 6);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeEllipse(0, -4, 44, 24);

  // Kâse (mavi)
  g.fillStyle(0x3a86d9, 1);
  g.fillEllipse(0, 8, 56, 20);
  g.strokeEllipse(0, 8, 56, 20);
  g.fillStyle(0x2a66b0, 1);
  g.fillRect(-28, 8, 56, 10);
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRect(-28, 8, 56, 10);

  const c = scene.add.container(x, y, [g]);
  c.setScale(scale);
  return c;
}

/** Hız botu: mavi bot + sarı şimşek. */
export function drawBoots(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE, 1);

  // Bot (L şekli): dik konç + taban
  g.fillStyle(0x2a5bd0, 1);
  g.fillRoundedRect(-12, -26, 22, 38, 6); // konç
  g.strokeRoundedRect(-12, -26, 22, 38, 6);
  g.fillRoundedRect(-12, 4, 40, 18, 7); // ayak
  g.strokeRoundedRect(-12, 4, 40, 18, 7);
  // taban çizgisi
  g.fillStyle(0x1c3f96, 1);
  g.fillRoundedRect(-12, 18, 40, 6, 3);

  // Sarı şimşek (konç üzerinde)
  g.fillStyle(0xffd43f, 1);
  g.lineStyle(2, OUTLINE, 1);
  g.fillPoints([
    { x: 2, y: -22 },
    { x: -8, y: -4 },
    { x: -1, y: -4 },
    { x: -5, y: 10 },
    { x: 8, y: -10 },
    { x: 1, y: -10 },
  ], true);
  g.strokePoints([
    { x: 2, y: -22 },
    { x: -8, y: -4 },
    { x: -1, y: -4 },
    { x: -5, y: 10 },
    { x: 8, y: -10 },
    { x: 1, y: -10 },
  ], true);

  const c = scene.add.container(x, y, [g]);
  c.setScale(scale);
  return c;
}
