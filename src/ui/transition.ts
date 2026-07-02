import Phaser from 'phaser';

// Ekranlar arası yumuşak geçiş süresi (ms). Biraz yavaş ki ani geçmesin.
export const TRANSITION_MS = 450;

/** Sahne açılırken siyahtan içeri doğru yumuşakça belirir. */
export function fadeIn(scene: Phaser.Scene, ms = TRANSITION_MS): void {
  scene.cameras.main.fadeIn(ms, 0, 0, 0);
}

/** Ekranı yumuşakça karartıp sonra hedef sahneye geçer. */
export function changeScene(scene: Phaser.Scene, key: string, data?: object, ms = TRANSITION_MS): void {
  const cam = scene.cameras.main;
  if (cam.fadeEffect.isRunning) return; // çift tetiklemeyi önle
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(key, data);
  });
  cam.fadeOut(ms, 0, 0, 0);
}
