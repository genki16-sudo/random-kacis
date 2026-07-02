import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { CutsceneScene } from './chapters/chapter1/CutsceneScene';
import { HalayScene } from './chapters/chapter1/HalayScene';
import { KeyGrabScene } from './chapters/chapter1/KeyGrabScene';
import { EscapeScene } from './chapters/chapter1/EscapeScene';

new Phaser.Game({
  ...gameConfig,
  scene: [
    BootScene,
    TitleScene,
    PauseScene,
    GameOverScene,
    CutsceneScene,
    HalayScene,
    KeyGrabScene,
    EscapeScene,
  ],
});
