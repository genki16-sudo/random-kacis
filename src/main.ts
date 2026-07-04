import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ChapterIntroScene } from './scenes/ChapterIntroScene';
import { CutsceneScene } from './chapters/chapter1/CutsceneScene';
import { HalayScene } from './chapters/chapter1/HalayScene';
import { KeyGrabScene } from './chapters/chapter1/KeyGrabScene';
import { EscapeScene } from './chapters/chapter1/EscapeScene';
import { BattleScene } from './chapters/chapter1/BattleScene';
import { ForestScene } from './chapters/chapter2/ForestScene';
import { ParkScene } from './chapters/chapter2/ParkScene';
import { ShopScene } from './chapters/chapter2/ShopScene';

const game = new Phaser.Game({
  ...gameConfig,
  scene: [
    BootScene,
    TitleScene,
    PauseScene,
    GameOverScene,
    ChapterIntroScene,
    CutsceneScene,
    HalayScene,
    KeyGrabScene,
    EscapeScene,
    BattleScene,
    ForestScene,
    ParkScene,
    ShopScene,
  ],
});

// Geliştirme modunda test/hata ayıklama kancası (üretim derlemesinde yer almaz).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
