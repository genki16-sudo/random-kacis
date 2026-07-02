import Phaser from 'phaser';
import { SceneKeys } from '../scenes/keys';

export function addPauseButton(scene: Phaser.Scene, currentSceneKey: string): void {
  const x = scene.scale.width - 34;
  const y = 34;
  const bg = scene.add.circle(x, y, 22, 0x000000, 0.5).setStrokeStyle(2, 0xffffff);
  const icon = scene.add.text(x, y, '⏸', {
    fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff',
  }).setOrigin(0.5);
  bg.setInteractive({ useHandCursor: true });
  bg.setScrollFactor(0);
  icon.setScrollFactor(0);
  bg.setDepth(1000);
  icon.setDepth(1000);

  const openPause = () => {
    scene.scene.pause(currentSceneKey);
    scene.scene.launch(SceneKeys.Pause, { resumeKey: currentSceneKey });
  };

  bg.on('pointerup', openPause);
  scene.input.keyboard?.on('keydown-ESC', openPause);
}
