import Phaser from 'phaser';
import { SceneKeys } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    // Chapter 1 yer tutucu görsellerle çalışır; ayrıca yükleme yok.
    this.scene.start(SceneKeys.Title);
  }
}
