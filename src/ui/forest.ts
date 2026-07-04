import Phaser from 'phaser';

const OUTLINE = 0x201a2a;

/** Çam/köknar ağacı: kahverengi gövde + üst üste 3 üçgen katman (tepede sivri). */
export function drawTree(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE, 1);

  // Gövde
  g.fillStyle(0x6b4a2b, 1);
  g.fillRect(-7, 22, 14, 26);
  g.strokeRect(-7, 22, 14, 26);

  const dark = 0x2a733a;
  const light = 0x3aa04c;

  // Alt katman (en geniş)
  g.fillStyle(dark, 1);
  g.fillTriangle(-36, 28, 36, 28, 0, -6);
  g.strokeTriangle(-36, 28, 36, 28, 0, -6);
  // Orta katman
  g.fillStyle(light, 1);
  g.fillTriangle(-29, 6, 29, 6, 0, -30);
  g.strokeTriangle(-29, 6, 29, 6, 0, -30);
  // Üst katman (tepe)
  g.fillStyle(dark, 1);
  g.fillTriangle(-21, -16, 21, -16, 0, -54);
  g.strokeTriangle(-21, -16, 21, -16, 0, -54);

  const c = scene.add.container(x, y, [g]);
  c.setScale(scale);
  return c;
}

export function drawBush(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE, 1);
  g.fillStyle(0x2f8f3a, 1);
  g.fillCircle(-14, 0, 15);
  g.fillCircle(14, 0, 15);
  g.fillCircle(0, -8, 18);
  g.strokeCircle(0, -8, 18);
  const c = scene.add.container(x, y, [g]);
  c.setScale(scale);
  return c;
}

/** Köpek kulübesi. */
export function drawKulube(scene: Phaser.Scene, x: number, y: number, scale = 1): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE, 1);
  // gövde
  g.fillStyle(0xb5763c, 1);
  g.fillRect(-34, -6, 68, 46);
  g.strokeRect(-34, -6, 68, 46);
  // çatı
  g.fillStyle(0x8a4f22, 1);
  g.fillTriangle(-44, -6, 44, -6, 0, -52);
  g.strokeTriangle(-44, -6, 44, -6, 0, -52);
  // giriş deliği
  g.fillStyle(0x201a2a, 1);
  g.fillEllipse(0, 22, 34, 40);
  const c = scene.add.container(x, y, [g]);
  c.setScale(scale);
  return c;
}

/** Dükkan binası (tenteli + "DÜKKAN" tabelası). */
export function drawShop(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(3, OUTLINE, 1);
  // gövde
  g.fillStyle(0xead6b0, 1);
  g.fillRect(-70, -90, 140, 130);
  g.strokeRect(-70, -90, 140, 130);
  // kapı
  g.fillStyle(0x6f4622, 1);
  g.fillRect(-20, -20, 40, 60);
  g.strokeRect(-20, -20, 40, 60);
  // tente (kırmızı-beyaz)
  for (let i = 0; i < 7; i++) {
    g.fillStyle(i % 2 === 0 ? 0xd94a4a : 0xffffff, 1);
    g.fillRect(-70 + i * 20, -110, 20, 22);
  }
  g.lineStyle(3, OUTLINE, 1);
  g.strokeRect(-70, -110, 140, 22);
  const label = scene.add.text(0, -128, 'DÜKKAN', {
    fontFamily: 'sans-serif', fontSize: '22px', color: '#ffe066', fontStyle: 'bold',
    stroke: OUTLINE_HEX, strokeThickness: 4,
  }).setOrigin(0.5);
  return scene.add.container(x, y, [g, label]);
}

/** Kocaman park tabelası: üstte büyük başlık, altta küçük "kuranlar" satırı. */
export function drawParkSign(
  scene: Phaser.Scene,
  x: number,
  y: number,
  title: string,
  subtitle: string,
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.lineStyle(4, OUTLINE, 1);
  // direkler
  g.fillStyle(0x6b4a2b, 1);
  g.fillRect(-150, 0, 14, 90);
  g.fillRect(136, 0, 14, 90);
  // pano
  g.fillStyle(0x3a7d44, 1);
  g.fillRoundedRect(-170, -70, 340, 78, 12);
  g.strokeRoundedRect(-170, -70, 340, 78, 12);
  const titleText = scene.add.text(0, -46, title, {
    fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
    stroke: OUTLINE_HEX, strokeThickness: 5,
  }).setOrigin(0.5);
  const subText = scene.add.text(0, -14, subtitle, {
    fontFamily: 'sans-serif', fontSize: '15px', color: '#d7f0d9',
  }).setOrigin(0.5);
  return scene.add.container(x, y, [g, titleText, subText]);
}

const OUTLINE_HEX = '#201a2a';
