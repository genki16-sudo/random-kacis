import Phaser from 'phaser';

/** Yukarıdan aşağıya gradyan arka plan (en arkada). */
export function addGradientBg(scene: Phaser.Scene, top: number, bottom: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, scene.scale.width, scene.scale.height);
  g.setDepth(-100);
  return g;
}

/** Belirtilen y'den aşağısını dolduran zemin şeridi. */
export function addFloor(scene: Phaser.Scene, y: number, color: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(0, y, scene.scale.width, scene.scale.height - y);
  g.lineStyle(3, 0x000000, 0.25);
  g.lineBetween(0, y, scene.scale.width, y);
  g.setDepth(-90);
  return g;
}
