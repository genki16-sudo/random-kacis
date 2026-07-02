# Random'ın Büyük Kaçışı — Chapter 1 Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Random ve arkadaşlarının barınaktan kaçışını anlatan Chapter 1'i; menü, 4 sahne, kaybetme ekranı, duraklatma ve kayıt sistemiyle birlikte tarayıcıda oynanabilir hale getirmek.

**Architecture:** Vite + TypeScript ile kurulan bir Phaser 3 oyunu. Saf mantık (kayıt, halay skoru, QTE zamanlaması, karakter verisi) çerçeveden bağımsız, Vitest ile test edilen modüllerde. Görsel sahneler bu modülleri kullanan Phaser `Scene` sınıfları; bölümler `chapters/` altında gruplanır, böylece Chapter 2+ kolayca eklenir.

**Tech Stack:** Phaser 3, TypeScript (strict), Vite, Vitest, npm. Görseller yer tutucu renkli şekiller; ses kendi ürettiğimiz/CC0. Mobil paketleme (Capacitor iOS) bu plandan sonra ayrı adımdır.

## Global Constraints

- Oyun motoru: **Phaser 3** (`phaser` npm paketi), dil **TypeScript** `strict: true`.
- Build/dev: **Vite**; testler: **Vitest**. Paket yöneticisi: **npm**.
- Tüm oyun metinleri Türkçe ve birebir şu şekilde: `Yeni Oyun`, `Devam Et`, `Kaydet ve Çık`, `Yeniden Dene`, `YAKALANDIN!`, `Chapter 2 yakında!`, sağ alt kredi `Uzaylılar'ın Yaratıcılarından`.
- Yalnızca kendi ürettiğimiz veya CC0 telifsiz görsel/ses kullanılır. Telifli içerik yok.
- Bağımlılık eklemeden önce bilinen kritik güvenlik açığı kontrolü yapılır (`npm audit`).
- Oyun çözünürlüğü **960×540** (16:9), `Phaser.Scale.FIT` + ortalama.
- Karakter isim/renkleri yalnızca `src/data/characters.ts` içinde tanımlanır (tek kaynak).
- Sahne anahtarları yalnızca `src/scenes/keys.ts` içinde sabit olarak tanımlanır.
- Kayıt anahtarı: `localStorage` anahtarı `random-kacis-save`.

---

## Dosya Yapısı

```
random-kacis/
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  src/
    main.ts                       # Phaser oyununu başlatır, sahneleri kaydeder
    config.ts                     # Oyun ayarları (çözünürlük, ölçekleme)
    data/
      characters.ts               # Karakter tanımları (tek kaynak)
      save.ts                     # Kayıt/yükleme (StorageBackend soyutlaması)
    scenes/
      keys.ts                     # Sahne anahtarı sabitleri
      BootScene.ts                # Yer tutucu doku üretir, TitleScene'e geçer
      TitleScene.ts               # Menü: Yeni Oyun / Devam Et + kredi
      PauseScene.ts               # Duraklatma: Devam Et / Kaydet ve Çık
      GameOverScene.ts            # YAKALANDIN! + Yeniden Dene
    logic/
      halay.ts                    # Halay skor mantığı (saf)
      qte.ts                      # Anahtar kapma zamanlama mantığı (saf)
    ui/
      pauseButton.ts              # Sahnelere ⏸️ butonu ekleyen yardımcı
    chapters/
      chapter1/
        CutsceneScene.ts          # Sahne 1
        HalayScene.ts             # Sahne 2
        KeyGrabScene.ts           # Sahne 3
        EscapeScene.ts            # Sahne 4
  test/
    save.test.ts
    halay.test.ts
    qte.test.ts
    characters.test.ts
```

---

### Task 1: Proje iskeleti (Vite + Phaser + TS + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore`
- Create: `src/config.ts`, `src/main.ts`, `src/scenes/keys.ts`, `src/scenes/BootScene.ts`

**Interfaces:**
- Produces: `GAME_WIDTH`, `GAME_HEIGHT` (number) ve `gameConfig` (Phaser.Types.Core.GameConfig) from `src/config.ts`; `SceneKeys` sabit nesnesi from `src/scenes/keys.ts`.

- [ ] **Step 1: `.gitignore` oluştur**

```
node_modules/
dist/
*.log
.DS_Store
ios/
```

- [ ] **Step 2: `package.json` oluştur**

```json
{
  "name": "random-kacis",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 3: Bağımlılıkları kur ve güvenlik denetimi yap**

Run: `cd /Users/genki/random-kacis && npm install && npm audit`
Expected: Kurulum başarılı. `npm audit` çıktısında **kritik (critical)** açık yoksa devam. Kritik açık varsa dur ve bildir.

- [ ] **Step 4: `tsconfig.json` oluştur**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"],
    "lib": ["ES2020", "DOM"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 5: `vite.config.ts` ve `vitest.config.ts` oluştur**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { open: true },
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { globals: true, environment: 'node' },
});
```

- [ ] **Step 6: `index.html` oluştur**

```html
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Random'ın Büyük Kaçışı</title>
    <style>
      html, body { margin: 0; padding: 0; background: #1a1a24; height: 100%; }
      #game { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: `src/scenes/keys.ts` oluştur**

```ts
export const SceneKeys = {
  Boot: 'Boot',
  Title: 'Title',
  Pause: 'Pause',
  GameOver: 'GameOver',
  Cutscene: 'Chapter1_Cutscene',
  Halay: 'Chapter1_Halay',
  KeyGrab: 'Chapter1_KeyGrab',
  Escape: 'Chapter1_Escape',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
```

- [ ] **Step 8: `src/config.ts` oluştur**

```ts
import Phaser from 'phaser';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a24',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
```

- [ ] **Step 9: `src/scenes/BootScene.ts` oluştur (geçici: doğrudan başlığa geçer)**

```ts
import Phaser from 'phaser';
import { SceneKeys } from './keys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Yükleniyor...', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 10: `src/main.ts` oluştur**

```ts
import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';

new Phaser.Game({
  ...gameConfig,
  scene: [BootScene],
});
```

- [ ] **Step 11: Dev sunucusunu çalıştırıp doğrula**

Run: `cd /Users/genki/random-kacis && npm run dev`
Expected: Tarayıcı açılır, koyu arka planda ortada "Yükleniyor..." yazısı görünür. Konsolda hata yok. (Doğruladıktan sonra sunucuyu durdur.)

- [ ] **Step 12: Commit**

```bash
cd /Users/genki/random-kacis
git add -A
git commit -m "feat: Vite+Phaser+TS iskeleti ve BootScene"
```

---

### Task 2: Karakter verisi modülü

**Files:**
- Create: `src/data/characters.ts`
- Test: `test/characters.test.ts`

**Interfaces:**
- Produces: `CharacterId` (union type), `CharacterDef` (interface: `{ id: CharacterId; name: string; color: number; role: 'hero'|'friend'|'rival'; hat?: 'captain'; hasSunPendant?: boolean }`), `CHARACTERS: Record<CharacterId, CharacterDef>`.

- [ ] **Step 1: Testi yaz**

`test/characters.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../src/data/characters';

describe('CHARACTERS', () => {
  it('5 karakter içerir', () => {
    expect(Object.keys(CHARACTERS)).toHaveLength(5);
  });

  it('Random Köpek kahramandır ve yeşildir', () => {
    expect(CHARACTERS.random.name).toBe('Random Köpek');
    expect(CHARACTERS.random.role).toBe('hero');
  });

  it('Kaptan Random kaptan şapkası takar', () => {
    expect(CHARACTERS.kaptan.hat).toBe('captain');
  });

  it('Random Krizi güneş kolyesi taşır', () => {
    expect(CHARACTERS.krizi.hasSunPendant).toBe(true);
  });

  it('Gölge Random rakiptir', () => {
    expect(CHARACTERS.golge.role).toBe('rival');
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: FAIL — `characters` modülü bulunamıyor.

- [ ] **Step 3: `src/data/characters.ts` oluştur**

```ts
export type CharacterId = 'random' | 'kaptan' | 'kedi' | 'krizi' | 'golge';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  color: number; // yer tutucu şekil rengi (Phaser hex)
  role: 'hero' | 'friend' | 'rival';
  hat?: 'captain';
  hasSunPendant?: boolean;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  random: { id: 'random', name: 'Random Köpek', color: 0x43c743, role: 'hero' },
  kaptan: { id: 'kaptan', name: 'Kaptan Random', color: 0x2f9e2f, role: 'friend', hat: 'captain' },
  kedi: { id: 'kedi', name: 'Random Kedi', color: 0xf2d43f, role: 'friend' },
  krizi: { id: 'krizi', name: 'Random Krizi', color: 0xd98cff, role: 'friend', hasSunPendant: true },
  golge: { id: 'golge', name: 'Gölge Random', color: 0x565663, role: 'rival' },
};
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: karakter verisi modülü ve testleri"
```

---

### Task 3: Kayıt sistemi (save.ts)

**Files:**
- Create: `src/data/save.ts`
- Test: `test/save.test.ts`

**Interfaces:**
- Produces: `SaveData` (`{ chapter: number; scene: string }`), `StorageBackend` (`{ getItem(k): string|null; setItem(k,v): void; removeItem(k): void }`), fonksiyonlar: `saveProgress(data, storage)`, `loadProgress(storage): SaveData|null`, `hasSave(storage): boolean`, `clearProgress(storage)`, ve `browserStorage(): StorageBackend` (tarayıcı `localStorage` sarmalayıcısı).

- [ ] **Step 1: Testi yaz**

`test/save.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { saveProgress, loadProgress, hasSave, clearProgress, type StorageBackend } from '../src/data/save';

function memoryStorage(): StorageBackend {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

describe('kayıt sistemi', () => {
  let storage: StorageBackend;
  beforeEach(() => { storage = memoryStorage(); });

  it('kayıt yokken loadProgress null döner', () => {
    expect(loadProgress(storage)).toBeNull();
    expect(hasSave(storage)).toBe(false);
  });

  it('kaydeder ve geri yükler', () => {
    saveProgress({ chapter: 1, scene: 'Chapter1_Halay' }, storage);
    expect(loadProgress(storage)).toEqual({ chapter: 1, scene: 'Chapter1_Halay' });
    expect(hasSave(storage)).toBe(true);
  });

  it('clearProgress kaydı siler', () => {
    saveProgress({ chapter: 1, scene: 'Chapter1_Halay' }, storage);
    clearProgress(storage);
    expect(loadProgress(storage)).toBeNull();
  });

  it('bozuk veri null döner, çökmez', () => {
    storage.setItem('random-kacis-save', '{bozuk json');
    expect(loadProgress(storage)).toBeNull();
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: FAIL — `save` modülü yok.

- [ ] **Step 3: `src/data/save.ts` oluştur**

```ts
export interface SaveData {
  chapter: number;
  scene: string;
}

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SAVE_KEY = 'random-kacis-save';

export function saveProgress(data: SaveData, storage: StorageBackend): void {
  storage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadProgress(storage: StorageBackend): SaveData | null {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' && parsed !== null &&
      typeof (parsed as SaveData).chapter === 'number' &&
      typeof (parsed as SaveData).scene === 'string'
    ) {
      return parsed as SaveData;
    }
    return null;
  } catch {
    return null;
  }
}

export function hasSave(storage: StorageBackend): boolean {
  return loadProgress(storage) !== null;
}

export function clearProgress(storage: StorageBackend): void {
  storage.removeItem(SAVE_KEY);
}

export function browserStorage(): StorageBackend {
  return {
    getItem: (k) => window.localStorage.getItem(k),
    setItem: (k, v) => window.localStorage.setItem(k, v),
    removeItem: (k) => window.localStorage.removeItem(k),
  };
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: PASS (4 test + Task 2 testleri).

- [ ] **Step 5: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: kayıt sistemi (save.ts) ve testleri"
```

---

### Task 4: Halay skor mantığı (saf modül)

**Files:**
- Create: `src/logic/halay.ts`
- Test: `test/halay.test.ts`

**Interfaces:**
- Produces: `HalayState` (`{ fill: number; failed: boolean; won: boolean }`), `createHalayState(): HalayState`, `registerHit(state, correct: boolean): HalayState`, `timeUp(state): HalayState`, sabitler `HIT_GAIN`, `MISS_PENALTY`.

- [ ] **Step 1: Testi yaz**

`test/halay.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createHalayState, registerHit, timeUp, HIT_GAIN } from '../src/logic/halay';

describe('halay mantığı', () => {
  it('başlangıçta boş, kaybetmemiş, kazanmamış', () => {
    const s = createHalayState();
    expect(s.fill).toBe(0);
    expect(s.failed).toBe(false);
    expect(s.won).toBe(false);
  });

  it('doğru basış barı artırır', () => {
    const s = registerHit(createHalayState(), true);
    expect(s.fill).toBeCloseTo(HIT_GAIN);
  });

  it('yeterli doğru basışta kazanır', () => {
    let s = createHalayState();
    for (let i = 0; i < 20; i++) s = registerHit(s, true);
    expect(s.won).toBe(true);
    expect(s.fill).toBeLessThanOrEqual(1);
  });

  it('yanlış basış barı azaltır ama 0 altına inmez', () => {
    const s = registerHit(createHalayState(), false);
    expect(s.fill).toBe(0);
  });

  it('süre dolunca kazanılmamışsa kaybedilir', () => {
    const s = timeUp(createHalayState());
    expect(s.failed).toBe(true);
  });

  it('süre dolunca zaten kazanılmışsa kaybedilmez', () => {
    let s = createHalayState();
    for (let i = 0; i < 20; i++) s = registerHit(s, true);
    const after = timeUp(s);
    expect(after.failed).toBe(false);
    expect(after.won).toBe(true);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: FAIL — `halay` modülü yok.

- [ ] **Step 3: `src/logic/halay.ts` oluştur**

```ts
export interface HalayState {
  fill: number; // 0..1
  failed: boolean;
  won: boolean;
}

export const HIT_GAIN = 0.1;
export const MISS_PENALTY = 0.07;

export function createHalayState(): HalayState {
  return { fill: 0, failed: false, won: false };
}

export function registerHit(state: HalayState, correct: boolean): HalayState {
  if (state.failed || state.won) return state;
  let fill = state.fill + (correct ? HIT_GAIN : -MISS_PENALTY);
  if (fill < 0) fill = 0;
  if (fill > 1) fill = 1;
  return { fill, failed: false, won: fill >= 1 };
}

export function timeUp(state: HalayState): HalayState {
  if (state.won) return state;
  return { ...state, failed: true };
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: PASS (6 yeni test dahil).

- [ ] **Step 5: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: halay skor mantığı ve testleri"
```

---

### Task 5: Anahtar kapma QTE mantığı (saf modül)

**Files:**
- Create: `src/logic/qte.ts`
- Test: `test/qte.test.ts`

**Interfaces:**
- Produces: `evaluateQte(pressTime: number, windowStart: number, windowEnd: number): boolean` (basış pencere içindeyse true), `QTE_WINDOW_MS = 700`.

- [ ] **Step 1: Testi yaz**

`test/qte.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { evaluateQte } from '../src/logic/qte';

describe('anahtar kapma QTE', () => {
  it('pencere içinde basış başarılı', () => {
    expect(evaluateQte(1500, 1200, 1900)).toBe(true);
  });
  it('erken basış başarısız', () => {
    expect(evaluateQte(1000, 1200, 1900)).toBe(false);
  });
  it('geç basış başarısız', () => {
    expect(evaluateQte(2000, 1200, 1900)).toBe(false);
  });
  it('tam kenarlar başarılı', () => {
    expect(evaluateQte(1200, 1200, 1900)).toBe(true);
    expect(evaluateQte(1900, 1200, 1900)).toBe(true);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: FAIL — `qte` modülü yok.

- [ ] **Step 3: `src/logic/qte.ts` oluştur**

```ts
export const QTE_WINDOW_MS = 700;

export function evaluateQte(pressTime: number, windowStart: number, windowEnd: number): boolean {
  return pressTime >= windowStart && pressTime <= windowEnd;
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

Run: `cd /Users/genki/random-kacis && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: anahtar kapma QTE mantığı ve testleri"
```

---

### Task 6: Yer tutucu dokular (BootScene) + karakter çizim yardımcısı

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Create: `src/ui/drawCharacter.ts`

**Interfaces:**
- Consumes: `CHARACTERS`, `CharacterId` (Task 2); `SceneKeys` (Task 1).
- Produces: `drawCharacter(scene: Phaser.Scene, x: number, y: number, id: CharacterId): Phaser.GameObjects.Container` — verilen karakteri yer tutucu şekillerle (gövde + göz + varsa şapka/kolye) çizer ve container döner.

- [ ] **Step 1: `src/ui/drawCharacter.ts` oluştur**

```ts
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
```

- [ ] **Step 2: `BootScene`'i güncelle — TitleScene'e geç**

`src/scenes/BootScene.ts` içeriğini şununla değiştir:
```ts
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
```

- [ ] **Step 3: Derleme kontrolü**

Run: `cd /Users/genki/random-kacis && npx tsc --noEmit`
Expected: Hata yok. (TitleScene henüz kayıtlı değil; bu adımda derleme testi yeterli, çalışma zamanı testi Task 7'de.)

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: yer tutucu karakter çizimi ve BootScene geçişi"
```

---

### Task 7: TitleScene (başlangıç menüsü)

**Files:**
- Create: `src/scenes/TitleScene.ts`
- Modify: `src/main.ts` (TitleScene'i kaydet)

**Interfaces:**
- Consumes: `SceneKeys` (Task 1); `browserStorage`, `hasSave`, `loadProgress`, `clearProgress` (Task 3); `drawCharacter` (Task 6).
- Produces: `TitleScene` sınıfı. "Yeni Oyun" → `clearProgress` + `Chapter1_Cutscene` başlatır. "Devam Et" (yalnızca kayıt varsa aktif) → kayıtlı `scene` anahtarını başlatır.

- [ ] **Step 1: `src/scenes/TitleScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage, hasSave, loadProgress, clearProgress } from '../data/save';
import { drawCharacter } from '../ui/drawCharacter';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const cx = this.scale.width / 2;
    const storage = browserStorage();

    this.add.text(cx, 70, "Random'ın Büyük Kaçışı", {
      fontFamily: 'sans-serif', fontSize: '40px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);

    drawCharacter(this, cx, 200, 'random');

    this.makeButton(cx, 300, 'Yeni Oyun', () => {
      clearProgress(storage);
      this.scene.start(SceneKeys.Cutscene);
    });

    const saved = hasSave(storage);
    const cont = this.makeButton(cx, 370, 'Devam Et', () => {
      const data = loadProgress(storage);
      if (data) this.scene.start(data.scene);
    });
    if (!saved) {
      cont.setAlpha(0.4);
      cont.disableInteractive();
    }

    this.add.text(this.scale.width - 12, this.scale.height - 10, "Uzaylılar'ın Yaratıcılarından", {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#8888aa',
    }).setOrigin(1, 1);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 240, 52, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, txt]);
    container.setSize(240, 52);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x50507a));
    container.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    container.on('pointerup', onClick);
    return container;
  }
}
```

- [ ] **Step 2: `src/main.ts`'i güncelle**

```ts
import Phaser from 'phaser';
import { gameConfig } from './config';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';

new Phaser.Game({
  ...gameConfig,
  scene: [BootScene, TitleScene],
});
```

- [ ] **Step 3: Dev sunucusuyla doğrula**

Run: `cd /Users/genki/random-kacis && npm run dev`
Expected: Başlıkta oyun adı, ortada yeşil Random çizimi, "Yeni Oyun" (aktif) ve "Devam Et" (soluk/pasif) butonları, sağ altta "Uzaylılar'ın Yaratıcılarından". Konsolda hata yok. ("Yeni Oyun"a basınca Cutscene henüz yok → sonraki task'ta eklenecek; şimdilik sahne başlatma hatası verebilir, bu beklenir.)

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: TitleScene menüsü (Yeni Oyun/Devam Et + kredi)"
```

---

### Task 8: Duraklatma butonu yardımcısı + PauseScene

**Files:**
- Create: `src/ui/pauseButton.ts`
- Create: `src/scenes/PauseScene.ts`
- Modify: `src/main.ts` (PauseScene'i kaydet)

**Interfaces:**
- Consumes: `SceneKeys` (Task 1); `browserStorage`, `saveProgress` (Task 3).
- Produces:
  - `addPauseButton(scene: Phaser.Scene, currentSceneKey: string): void` — sağ üste ⏸️ butonu koyar; basınca `scene.pause()` + `PauseScene`'i `{ resumeKey: currentSceneKey }` verisiyle `launch` eder.
  - `PauseScene` sınıfı; init verisi `{ resumeKey: string }`. "Devam Et" → PauseScene'i durdurur, `resumeKey` sahnesini `resume` eder. "Kaydet ve Çık" → `saveProgress({chapter:1, scene: resumeKey})` + tüm oyun sahnelerini durdurup `Title`'a döner.

- [ ] **Step 1: `src/ui/pauseButton.ts` oluştur**

```ts
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
  bg.on('pointerup', () => {
    scene.scene.pause(currentSceneKey);
    scene.scene.launch(SceneKeys.Pause, { resumeKey: currentSceneKey });
  });

  scene.input.keyboard?.on('keydown-ESC', () => {
    scene.scene.pause(currentSceneKey);
    scene.scene.launch(SceneKeys.Pause, { resumeKey: currentSceneKey });
  });
}
```

- [ ] **Step 2: `src/scenes/PauseScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage, saveProgress } from '../data/save';

interface PauseData {
  resumeKey: string;
}

export class PauseScene extends Phaser.Scene {
  private resumeKey = SceneKeys.Cutscene as string;

  constructor() {
    super(SceneKeys.Pause);
  }

  init(data: PauseData): void {
    this.resumeKey = data.resumeKey;
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.add.rectangle(cx, cy, this.scale.width, this.scale.height, 0x000000, 0.6);
    this.add.text(cx, cy - 90, 'Durduruldu', {
      fontFamily: 'sans-serif', fontSize: '34px', color: '#ffffff',
    }).setOrigin(0.5);

    this.makeButton(cx, cy - 10, 'Devam Et', () => {
      this.scene.stop();
      this.scene.resume(this.resumeKey);
    });

    this.makeButton(cx, cy + 60, 'Kaydet ve Çık', () => {
      saveProgress({ chapter: 1, scene: this.resumeKey }, browserStorage());
      this.scene.stop(this.resumeKey);
      this.scene.stop();
      this.scene.start(SceneKeys.Title);
    });
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(0, 0, 260, 50, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);
    const container = this.add.container(x, y, [bg, txt]);
    container.setSize(260, 50);
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => bg.setFillStyle(0x50507a));
    container.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    container.on('pointerup', onClick);
  }
}
```

- [ ] **Step 3: `src/main.ts`'e PauseScene ekle**

`scene` dizisini güncelle (import ekleyip diziye koy):
```ts
import { PauseScene } from './scenes/PauseScene';
// ...
  scene: [BootScene, TitleScene, PauseScene],
```

- [ ] **Step 4: Derleme kontrolü**

Run: `cd /Users/genki/random-kacis && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 5: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: duraklatma butonu ve PauseScene (Kaydet ve Çık)"
```

---

### Task 9: GameOverScene (YAKALANDIN! + Yeniden Dene)

**Files:**
- Create: `src/scenes/GameOverScene.ts`
- Modify: `src/main.ts` (GameOverScene'i kaydet)

**Interfaces:**
- Consumes: `SceneKeys` (Task 1).
- Produces: `GameOverScene`; init verisi `{ retryKey: string }`. "Yeniden Dene" → `GameOver`'ı durdurup `retryKey` sahnesini yeniden başlatır (`scene.start`).

- [ ] **Step 1: `src/scenes/GameOverScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from './keys';

interface GameOverData {
  retryKey: string;
}

export class GameOverScene extends Phaser.Scene {
  private retryKey = SceneKeys.Halay as string;

  constructor() {
    super(SceneKeys.GameOver);
  }

  init(data: GameOverData): void {
    this.retryKey = data.retryKey;
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    this.cameras.main.setBackgroundColor('#2a0d0d');

    this.add.text(cx, cy - 60, 'YAKALANDIN!', {
      fontFamily: 'sans-serif', fontSize: '56px', color: '#ff5555', fontStyle: 'bold',
    }).setOrigin(0.5);

    const bg = this.add.rectangle(0, 0, 240, 56, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, 'Yeniden Dene', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);
    const btn = this.add.container(cx, cy + 40, [bg, txt]);
    btn.setSize(240, 56);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => bg.setFillStyle(0x50507a));
    btn.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    btn.on('pointerup', () => this.scene.start(this.retryKey));
  }
}
```

- [ ] **Step 2: `src/main.ts`'e GameOverScene ekle**

```ts
import { GameOverScene } from './scenes/GameOverScene';
// ...
  scene: [BootScene, TitleScene, PauseScene, GameOverScene],
```

- [ ] **Step 3: Derleme kontrolü**

Run: `cd /Users/genki/random-kacis && npx tsc --noEmit`
Expected: Hata yok.

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: GameOverScene (YAKALANDIN! + Yeniden Dene)"
```

---

### Task 10: CutsceneScene (Sahne 1 — Hapis)

**Files:**
- Create: `src/chapters/chapter1/CutsceneScene.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `SceneKeys`; `drawCharacter` (Task 6); `addPauseButton` (Task 8).
- Produces: `CutsceneScene`; adım adım diyalog/olay dizisi gösterir; son adımda `Chapter1_Halay` başlatır. Tıklama/dokunma/boşluk ile ilerler.

- [ ] **Step 1: `src/chapters/chapter1/CutsceneScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';

interface Beat {
  text: string;
}

const BEATS: Beat[] = [
  { text: 'Random ve arkadaşları barınakta kafeste... Kaçış planı yapıyorlar.' },
  { text: 'Random Kedi ince gövdesiyle parmaklıklardan sıyrılıyor!' },
  { text: 'Kediyi durdurun... Kolu çekti! Çat — kafes açıldı!' },
  { text: 'Yandaki hücreden Gölge Random polislere haber veriyor: "Kaçıyorlar!"' },
  { text: 'Panik! Polisleri oyalamak için... HALAY zamanı!' },
];

export class CutsceneScene extends Phaser.Scene {
  private beat = 0;
  private caption!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Cutscene);
  }

  create(): void {
    const cx = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#20202e');

    // Parmaklıklar (yer tutucu)
    for (let i = 0; i < 10; i++) {
      this.add.rectangle(120 + i * 30, 200, 4, 180, 0x8899aa);
    }

    drawCharacter(this, cx - 120, 210, 'random');
    drawCharacter(this, cx - 40, 210, 'kaptan');
    drawCharacter(this, cx + 40, 210, 'kedi');
    drawCharacter(this, cx + 120, 210, 'krizi');
    // Gölge Random yandaki hücrede
    drawCharacter(this, this.scale.width - 90, 210, 'golge');

    const box = this.add.rectangle(cx, 420, this.scale.width - 80, 110, 0x000000, 0.7)
      .setStrokeStyle(2, 0xffffff);
    this.caption = this.add.text(box.x, box.y, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff',
      wordWrap: { width: this.scale.width - 130 }, align: 'center',
    }).setOrigin(0.5);

    this.add.text(cx, 490, '(devam etmek için tıkla)', {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.showBeat();

    this.input.on('pointerup', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());

    addPauseButton(this, SceneKeys.Cutscene);
  }

  private showBeat(): void {
    this.caption.setText(BEATS[this.beat].text);
  }

  private advance(): void {
    this.beat += 1;
    if (this.beat >= BEATS.length) {
      this.scene.start(SceneKeys.Halay);
      return;
    }
    this.showBeat();
  }
}
```

- [ ] **Step 2: `src/main.ts`'e ekle**

```ts
import { CutsceneScene } from './chapters/chapter1/CutsceneScene';
// scene dizisine CutsceneScene ekle
  scene: [BootScene, TitleScene, PauseScene, GameOverScene, CutsceneScene],
```

- [ ] **Step 3: Dev sunucusuyla doğrula**

Run: `cd /Users/genki/random-kacis && npm run dev`
Expected: "Yeni Oyun" → parmaklıklar, 4 arkadaş + Gölge Random görünür; alttaki kutuda metinler tıkladıkça ilerler; 5. metinden sonra Halay sahnesine geçer (henüz yoksa hata — sonraki task). Sağ üstte ⏸ butonu.

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: Chapter1 CutsceneScene (hapis sahnesi)"
```

---

### Task 11: HalayScene (Sahne 2 — button-mash mini-oyun)

**Files:**
- Create: `src/chapters/chapter1/HalayScene.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `SceneKeys`; `createHalayState`, `registerHit`, `timeUp`, `HalayState` (Task 4); `drawCharacter` (Task 6); `addPauseButton` (Task 8).
- Produces: `HalayScene`. Doğru ok tuşuna/butona basış barı doldurur; bar dolarsa `Chapter1_KeyGrab`; süre (12 sn) dolar ve dolmazsa `GameOver` (`retryKey: Halay`).

- [ ] **Step 1: `src/chapters/chapter1/HalayScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { createHalayState, registerHit, timeUp, type HalayState } from '../../logic/halay';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';

const ARROWS = ['↑', '↓', '←', '→'] as const;
type Arrow = (typeof ARROWS)[number];
const KEY_TO_ARROW: Record<string, Arrow> = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
const TIME_LIMIT_MS = 12000;

export class HalayScene extends Phaser.Scene {
  private state: HalayState = createHalayState();
  private target: Arrow = '↑';
  private prompt!: Phaser.GameObjects.Text;
  private barFill!: Phaser.GameObjects.Rectangle;
  private timeText!: Phaser.GameObjects.Text;
  private dancers: Phaser.GameObjects.Container[] = [];
  private endsAt = 0;
  private finished = false;
  private seed = 0;

  constructor() {
    super(SceneKeys.Halay);
  }

  create(): void {
    this.state = createHalayState();
    this.finished = false;
    this.seed = 0;
    const cx = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#241a2e');

    this.add.text(cx, 40, 'HALAY! Polisleri oyala 🎶', {
      fontFamily: 'sans-serif', fontSize: '28px', color: '#ffe066',
    }).setOrigin(0.5);

    // Halayçılar: elinde halay aleti (sarı çubuk = mendil/çubuk yer tutucu)
    const ids = ['random', 'kaptan', 'kedi', 'krizi'] as const;
    ids.forEach((id, i) => {
      const d = drawCharacter(this, cx - 150 + i * 100, 210, id);
      const prop = this.add.rectangle(24, -10, 6, 40, 0xffd43f).setStrokeStyle(1, 0x000000);
      d.add(prop);
      this.dancers.push(d);
    });

    // Oyalama barı
    this.add.text(cx, 300, 'Oyalama Barı', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.add.rectangle(cx, 330, 404, 28, 0x000000).setStrokeStyle(2, 0xffffff);
    this.barFill = this.add.rectangle(cx - 200, 330, 0, 24, 0x43c743).setOrigin(0, 0.5);

    this.prompt = this.add.text(cx, 400, this.target, {
      fontFamily: 'sans-serif', fontSize: '64px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 470, 'Ok tuşuna (veya dokun) doğru bas!', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.timeText = this.add.text(cx, 500, '', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#ffcc66',
    }).setOrigin(0.5);

    this.pickTarget();
    this.buildTouchButtons();

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      const arrow = KEY_TO_ARROW[e.key];
      if (arrow) this.press(arrow);
    });

    this.endsAt = this.time.now + TIME_LIMIT_MS;
    addPauseButton(this, SceneKeys.Halay);
  }

  private buildTouchButtons(): void {
    const y = this.scale.height - 40;
    ARROWS.forEach((a, i) => {
      const x = this.scale.width / 2 - 90 + i * 60;
      const b = this.add.circle(x, y, 24, 0x3a3a55).setStrokeStyle(2, 0xffe066).setInteractive({ useHandCursor: true });
      this.add.text(x, y, a, { fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      b.on('pointerup', () => this.press(a));
    });
  }

  // Deterministik olmayan rastgeleye gerek yok: sırayla döngü
  private pickTarget(): void {
    this.target = ARROWS[this.seed % ARROWS.length];
    this.seed += 1;
    this.prompt?.setText(this.target);
  }

  private press(arrow: Arrow): void {
    if (this.finished) return;
    const correct = arrow === this.target;
    this.state = registerHit(this.state, correct);
    this.barFill.width = 400 * this.state.fill;
    // dansçıları hafif zıplat
    this.dancers.forEach((d) => this.tweens.add({ targets: d, y: d.y - 8, duration: 80, yoyo: true }));
    if (this.state.won) {
      this.finished = true;
      this.scene.start(SceneKeys.KeyGrab);
      return;
    }
    if (correct) this.pickTarget();
  }

  update(): void {
    if (this.finished) return;
    const remaining = Math.max(0, this.endsAt - this.time.now);
    this.timeText.setText(`Süre: ${(remaining / 1000).toFixed(1)} sn`);
    if (remaining <= 0) {
      this.state = timeUp(this.state);
      if (this.state.failed) {
        this.finished = true;
        this.scene.start(SceneKeys.GameOver, { retryKey: SceneKeys.Halay });
      }
    }
  }
}
```

- [ ] **Step 2: `src/main.ts`'e ekle**

```ts
import { HalayScene } from './chapters/chapter1/HalayScene';
  scene: [BootScene, TitleScene, PauseScene, GameOverScene, CutsceneScene, HalayScene],
```

- [ ] **Step 3: Dev sunucusuyla doğrula**

Run: `cd /Users/genki/random-kacis && npm run dev`
Expected: Cutscene sonrası halay ekranı; 4 dansçı elinde sarı çubuk; ekranda ok işareti; doğru ok tuşuna basınca bar yeşil dolar, dansçılar zıplar. Bar dolunca KeyGrab (yoksa hata — sonraki task). Süre 0'a inip bar dolmazsa YAKALANDIN! ekranı, "Yeniden Dene" halayı yeniden başlatır.

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: Chapter1 HalayScene (button-mash mini-oyun)"
```

---

### Task 12: KeyGrabScene (Sahne 3 — anahtar kapma QTE)

**Files:**
- Create: `src/chapters/chapter1/KeyGrabScene.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `SceneKeys`; `evaluateQte`, `QTE_WINDOW_MS` (Task 5); `drawCharacter` (Task 6); `addPauseButton` (Task 8).
- Produces: `KeyGrabScene`. Belirli bir anda "ŞİMDİ!" gösterir; pencere içinde basış → `Chapter1_Escape`; dışında/kaçırılırsa → `GameOver` (`retryKey: KeyGrab`).

- [ ] **Step 1: `src/chapters/chapter1/KeyGrabScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { evaluateQte, QTE_WINDOW_MS } from '../../logic/qte';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';

const WINDOW_START_MS = 1600;

export class KeyGrabScene extends Phaser.Scene {
  private windowStart = 0;
  private windowEnd = 0;
  private cue!: Phaser.GameObjects.Text;
  private resolved = false;

  constructor() {
    super(SceneKeys.KeyGrab);
  }

  create(): void {
    this.resolved = false;
    const cx = this.scale.width / 2;
    this.cameras.main.setBackgroundColor('#1e2233');

    this.add.text(cx, 50, 'Polisin cebinde anahtar var...', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);

    drawCharacter(this, cx - 60, 240, 'random');
    // Polis (yer tutucu mavi) + cepte anahtar
    this.add.rectangle(cx + 60, 240, 50, 80, 0x2244aa).setStrokeStyle(3, 0x000000);
    this.add.star(cx + 60, 250, 4, 4, 9, 0xffd43f); // anahtar yer tutucu

    this.cue = this.add.text(cx, 400, 'Bekle...', {
      fontFamily: 'sans-serif', fontSize: '40px', color: '#888888',
    }).setOrigin(0.5);

    this.add.text(cx, 470, 'ŞİMDİ! yazınca boşluğa bas / ekrana dokun', {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.windowStart = this.time.now + WINDOW_START_MS;
    this.windowEnd = this.windowStart + QTE_WINDOW_MS;

    this.time.delayedCall(WINDOW_START_MS, () => {
      if (!this.resolved) this.cue.setText('ŞİMDİ!').setColor('#ff5555');
    });
    // Pencere kaçırılırsa kaybet
    this.time.delayedCall(WINDOW_START_MS + QTE_WINDOW_MS + 50, () => {
      if (!this.resolved) this.fail();
    });

    this.input.keyboard?.on('keydown-SPACE', () => this.attempt());
    this.input.on('pointerup', () => this.attempt());

    addPauseButton(this, SceneKeys.KeyGrab);
  }

  private attempt(): void {
    if (this.resolved) return;
    const ok = evaluateQte(this.time.now, this.windowStart, this.windowEnd);
    if (ok) {
      this.resolved = true;
      this.cue.setText('Anahtarı kaptı! 🔑').setColor('#43c743');
      this.time.delayedCall(700, () => this.scene.start(SceneKeys.Escape));
    } else {
      this.fail();
    }
  }

  private fail(): void {
    if (this.resolved) return;
    this.resolved = true;
    this.scene.start(SceneKeys.GameOver, { retryKey: SceneKeys.KeyGrab });
  }
}
```

- [ ] **Step 2: `src/main.ts`'e ekle**

```ts
import { KeyGrabScene } from './chapters/chapter1/KeyGrabScene';
  scene: [BootScene, TitleScene, PauseScene, GameOverScene, CutsceneScene, HalayScene, KeyGrabScene],
```

- [ ] **Step 3: Dev sunucusuyla doğrula**

Run: `cd /Users/genki/random-kacis && npm run dev`
Expected: Halay sonrası bu sahne; "Bekle..." sonra "ŞİMDİ!" kırmızı çıkar. O sırada boşluğa basınca "Anahtarı kaptı!" → Escape (yoksa hata — son task). Erken/geç basış veya hiç basmama → YAKALANDIN!, "Yeniden Dene" bu sahneyi yeniden başlatır.

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: Chapter1 KeyGrabScene (anahtar kapma QTE)"
```

---

### Task 13: EscapeScene (Sahne 4 — kaçış + bölüm sonu)

**Files:**
- Create: `src/chapters/chapter1/EscapeScene.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: `SceneKeys`; `drawCharacter` (Task 6); `addPauseButton` (Task 8); `clearProgress`, `browserStorage` (Task 3).
- Produces: `EscapeScene`. Ok tuşları/dokunmatik ile Random sağa yürür; kapıya ulaşınca "Chapter 2 yakında!" gösterir, kaydı temizler ve tıklamayla `Title`'a döner.

- [ ] **Step 1: `src/chapters/chapter1/EscapeScene.ts` oluştur**

```ts
import Phaser from 'phaser';
import { SceneKeys } from '../../scenes/keys';
import { drawCharacter } from '../../ui/drawCharacter';
import { addPauseButton } from '../../ui/pauseButton';
import { browserStorage, clearProgress } from '../../data/save';

const SPEED = 3;
const DOOR_X = 880;

export class EscapeScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Container;
  private moveDir = 0;
  private done = false;

  constructor() {
    super(SceneKeys.Escape);
  }

  create(): void {
    this.done = false;
    this.moveDir = 0;
    this.cameras.main.setBackgroundColor('#182818');

    this.add.text(this.scale.width / 2, 40, 'Koridordan kaç! Kapıya ulaş →', {
      fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    // Kapı (yer tutucu)
    this.add.rectangle(DOOR_X, 300, 60, 120, 0x8b5a2b).setStrokeStyle(3, 0x000000);
    this.add.text(DOOR_X, 230, 'ÇIKIŞ', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffe066' }).setOrigin(0.5);

    this.hero = drawCharacter(this, 90, 300, 'random');

    // Sağ/sol dokunmatik butonlar
    this.makeMoveButton(60, this.scale.height - 40, '←', -1);
    this.makeMoveButton(140, this.scale.height - 40, '→', 1);

    this.input.keyboard?.on('keydown-LEFT', () => { this.moveDir = -1; });
    this.input.keyboard?.on('keydown-RIGHT', () => { this.moveDir = 1; });
    this.input.keyboard?.on('keyup-LEFT', () => { if (this.moveDir === -1) this.moveDir = 0; });
    this.input.keyboard?.on('keyup-RIGHT', () => { if (this.moveDir === 1) this.moveDir = 0; });

    addPauseButton(this, SceneKeys.Escape);
  }

  private makeMoveButton(x: number, y: number, label: string, dir: number): void {
    const b = this.add.circle(x, y, 24, 0x3a3a55).setStrokeStyle(2, 0xffe066).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
    b.on('pointerdown', () => { this.moveDir = dir; });
    b.on('pointerup', () => { this.moveDir = 0; });
    b.on('pointerout', () => { if (this.moveDir === dir) this.moveDir = 0; });
  }

  update(): void {
    if (this.done) return;
    this.hero.x += this.moveDir * SPEED;
    this.hero.x = Phaser.Math.Clamp(this.hero.x, 60, DOOR_X);
    if (this.hero.x >= DOOR_X - 10) this.finish();
  }

  private finish(): void {
    this.done = true;
    clearProgress(browserStorage());
    const cx = this.scale.width / 2;
    this.add.rectangle(cx, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7);
    this.add.text(cx, this.scale.height / 2 - 20, 'Chapter 2 yakında!', {
      fontFamily: 'sans-serif', fontSize: '44px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, this.scale.height / 2 + 40, '(menüye dönmek için tıkla)', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.input.once('pointerup', () => this.scene.start(SceneKeys.Title));
  }
}
```

- [ ] **Step 2: `src/main.ts`'e ekle (tüm sahneler kayıtlı)**

```ts
import { EscapeScene } from './chapters/chapter1/EscapeScene';
  scene: [BootScene, TitleScene, PauseScene, GameOverScene, CutsceneScene, HalayScene, KeyGrabScene, EscapeScene],
```

- [ ] **Step 3: Uçtan uca doğrulama + testler + derleme**

Run: `cd /Users/genki/random-kacis && npm test && npx tsc --noEmit`
Expected: Tüm testler PASS, derleme hatasız.

Run: `cd /Users/genki/random-kacis && npm run dev`
Expected tam akış: Menü → Yeni Oyun → Cutscene (5 metin) → Halay (bar dolar) → KeyGrab (ŞİMDİ! → kap) → Escape (sağa yürü → kapı) → "Chapter 2 yakında!" → tıkla → Menü. Ayrıca: bir sahnede ⏸ → Kaydet ve Çık → menüde "Devam Et" aktif → o sahneden devam. Halay/KeyGrab'de kaybet → YAKALANDIN! → Yeniden Dene.

- [ ] **Step 4: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "feat: Chapter1 EscapeScene ve bölüm sonu; Chapter 1 tamamlandı"
```

---

### Task 14: README + basit ses (isteğe bağlı, çocuk dostu bitiş)

**Files:**
- Create: `README.md`

**Interfaces:** yok (dokümantasyon).

- [ ] **Step 1: `README.md` oluştur**

```markdown
# Random'ın Büyük Kaçışı 🐶

Yeşil köpek Random ve arkadaşlarının barınaktan kaçışı — Chapter 1.

## Çalıştırma
```
npm install
npm run dev
```
Tarayıcıda açılır. Testler: `npm test`.

## Kontroller
- Menü/cutscene: fare tıklama / dokunma / boşluk
- Halay: ok tuşları veya ekran butonları
- Anahtar kapma: "ŞİMDİ!" yazınca boşluk / dokunma
- Kaçış: sol/sağ ok veya ekran butonları
- Duraklat: Esc veya sağ üstteki ⏸

## Sonraki adım
İleride Capacitor ile iOS'a paketleme (ayrı adım).
```

- [ ] **Step 2: Commit**

```bash
cd /Users/genki/random-kacis && git add -A && git commit -m "docs: README ekle"
```

---

## Notlar (uygulayıcı için)

- **iOS paketleme** bu planın dışındadır. Chapter 1 tarayıcıda tamamen çalıştıktan sonra ayrı bir plan/adım olarak Capacitor eklenir (`@capacitor/core`, `@capacitor/ios`, `npx cap add ios`) ve `npm audit` tekrar çalıştırılır.
- **Ses:** Bu planda görsel odaklı gidildi; halay müziği için sonradan kendi ürettiğimiz/CC0 kısa bir döngü `assets/`'e eklenip `HalayScene`'de `this.sound.play` ile çalınabilir. Telifli müzik kullanılmaz.
- **Random Krizi dönüşümü** kasıtlı olarak Chapter 1'de yok; Chapter 2 için saklandı.
- Grafikler yer tutucudur; oynanış oturduktan sonra ayrı bir "sanat" adımında güzelleştirilir.

## Öz-inceleme (spec kapsam kontrolü)

- Başlangıç menüsü (Yeni Oyun/Devam Et + kredi) → Task 7 ✅
- Cutscene (kedi kolu çeker, Gölge Random haber verir) → Task 10 ✅
- Halay button-mash + halay aletleri + dansçılar → Task 11 ✅ (müzik: Notlar'da opsiyonel)
- Anahtar kapma QTE → Task 5 (mantık) + Task 12 (sahne) ✅
- Kaçış + "Chapter 2 yakında!" → Task 13 ✅
- YAKALANDIN! + Yeniden Dene → Task 9 ✅ (Halay/KeyGrab'den tetiklenir)
- Duraklatma + Kaydet ve Çık → Task 8 ✅
- Kayıt sistemi → Task 3 ✅
- 5 karakter yer tutucu görsellerle → Task 2 + Task 6 ✅
- Bölümlü mimari (chapters/) → dosya yapısı + Task 10-13 ✅
