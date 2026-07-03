import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
export class ParkScene extends Phaser.Scene {
  constructor() { super(SceneKeys.Chapter2_Park); }
  create(): void { this.add.text(20, 20, 'Park (stub)', { color: '#fff' }); }
}
