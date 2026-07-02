import Phaser from 'phaser';

const OUTLINE = 0x201a2a;

/**
 * (tipX, tipY) noktasının üstünde, aşağı bakan kuyruklu bir konuşma balonu çizer.
 * Kuyruğun ucu (tipX, tipY) olur; balon bunun üstünde durur.
 */
export function showSpeechBubble(
  scene: Phaser.Scene,
  tipX: number,
  tipY: number,
  text: string,
  maxWidth = 200,
): Phaser.GameObjects.Container {
  const label = scene.add.text(0, 0, text, {
    fontFamily: 'sans-serif', fontSize: '16px', color: '#201a2a',
    wordWrap: { width: maxWidth }, align: 'center',
  }).setOrigin(0.5);

  const w = Math.max(label.width + 26, 70);
  const h = label.height + 20;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1);
  g.lineStyle(3, OUTLINE, 1);
  g.fillRoundedRect(-w / 2, -h - 12, w, h, 12);
  g.strokeRoundedRect(-w / 2, -h - 12, w, h, 12);
  // aşağı bakan kuyruk
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(-9, -13, 9, -13, 0, 0);
  g.lineBetween(-9, -12, 0, 0);
  g.lineBetween(9, -12, 0, 0);

  label.setPosition(0, -12 - h / 2);

  const c = scene.add.container(tipX, tipY, [g, label]);
  c.setDepth(500);
  return c;
}
