import Phaser from 'phaser';
import { CHARACTERS, type CharacterId } from '../data/characters';

export function drawCharacter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  id: CharacterId,
): Phaser.GameObjects.Container {
  const def = CHARACTERS[id];
  const c = scene.add.container(x, y);

  const body = scene.add.rectangle(0, 0, 46, 60, def.color).setStrokeStyle(3, 0x000000);
  const earL = scene.add.rectangle(-14, -34, 12, 20, def.color).setStrokeStyle(3, 0x000000);
  const earR = scene.add.rectangle(14, -34, 12, 20, def.color).setStrokeStyle(3, 0x000000);
  const eyeL = scene.add.circle(-10, -8, 4, 0x000000);
  const eyeR = scene.add.circle(10, -8, 4, 0x000000);
  c.add([earL, earR, body, eyeL, eyeR]);

  if (def.hat === 'captain') {
    const hat = scene.add.rectangle(0, -46, 40, 12, 0x222244).setStrokeStyle(2, 0xffffff);
    const badge = scene.add.star(0, -46, 5, 3, 6, 0xffd43f);
    c.add([hat, badge]);
  }
  if (def.hasSunPendant) {
    const pendant = scene.add.star(0, 14, 8, 5, 9, 0xffd43f).setStrokeStyle(2, 0xd98c00);
    c.add(pendant);
  }

  const label = scene.add.text(0, 40, def.name, {
    fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff',
  }).setOrigin(0.5, 0);
  c.add(label);

  return c;
}
