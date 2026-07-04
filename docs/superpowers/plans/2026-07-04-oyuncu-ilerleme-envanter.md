# Oyuncu İlerleme Sistemi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kalıcı oyun durumu (can, RD, YP, eşyalar) + envanter ekranı + eşya etkileri + savaşta "Geri" butonu + dükkan çıkışı tanıtımı.

**Architecture:** Merkezi `state/gameState.ts` (saf mutasyonlar + localStorage). Sahneler (Battle, Shop, Forest, Park, Inventory) bu durumu okur/yazar. Overworld hız çarpanı bottan gelir.

**Tech Stack:** TypeScript, Phaser 3.80, Vite 8, Vitest 4.

## Global Constraints

- Sabitler (tam değerler): `HP_MAX = 10`, `YP_MAX = 5`, `BITE_BASE = 3`, `MAMA_HEAL = 3`, `GUC_MAMASI_BONUS = 3`, `GUC_MAMASI_TURNS = 2`, `BOT_YP_COST = 3`, `BOOT_MULT = 1.6`.
- Fiyatlar: Mama 5 RD, Güç Maması 10 RD, Hız Botları 50 RD.
- Para birimi adı: **RD** (Random Doları). Can etiketi ❤️, YP ⚡, RD 💰, güç 💪.
- Güç hesaplanır (state'te tutulmaz): `currentGuc(s) = BITE_BASE + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0)`.
- Yeni oyun: `hp 10, rd 0, yp 5, gucBuffTurns 0, mama 10, gucMamasi 0, botVar false, botKullanildi false, tutorialDone false`.
- State localStorage anahtarı: `random-kacis-state` (mevcut `save.ts`'in `random-kacis-save`'inden ayrı).
- `StorageBackend` ve `browserStorage` `src/data/save.ts`'ten import edilir (yeniden tanımlama yok).
- Her görev sonunda commit. Deploy'dan önce `npm run build`.
- Metinler Türkçe; kullanıcı metinleri aşağıda tam verilmiştir, birebir kullan.

---

## File Structure

- Create `src/state/gameState.ts` — durum tipi, sabitler, saf mutasyonlar, load/save.
- Create `test/gameState.test.ts`.
- Create `src/scenes/InventoryScene.ts` — envanter ekranı (overlay).
- Modify `src/scenes/keys.ts` — `Inventory` anahtarı.
- Modify `src/main.ts` — InventoryScene kaydı.
- Modify `src/chapters/chapter2/ShopScene.ts` — RD/eşya state'e bağlanır.
- Modify `src/chapters/chapter1/BattleScene.ts` — state can/mama, Geri butonu, güç maması, YP dolumu.
- Modify `src/chapters/chapter2/overworld.ts` — bot hız çarpanı + ENV butonu kancası.
- Modify `src/chapters/chapter2/ForestScene.ts` ve `ParkScene.ts` — ENV/ESC → Inventory; dükkan çıkışı tanıtımı (Park).

---

## Task 1: Merkezi oyun durumu (`state/gameState.ts`)

**Files:**
- Create: `src/state/gameState.ts`
- Test: `test/gameState.test.ts`

**Interfaces:**
- Produces: `GameState`, sabitler, ve saf fonksiyonlar:
  `newGameState()`, `loadState(storage)`, `saveState(state, storage)`,
  `currentGuc(s)`, `useMama(s)`, `canBuy(s,key)`, `buy(s,key)`,
  `canUseBoots(s)`, `useBoots(s)`, `applyGucMamasi(s)`, `tickGucBuff(s)`, `refillYP(s)`.
  `key` tipi: `'mama' | 'guc' | 'bot'`.

- [ ] **Step 1: Write the failing test**

```ts
// test/gameState.test.ts
import { describe, it, expect } from 'vitest';
import {
  newGameState, useMama, buy, canBuy, useBoots, canUseBoots,
  applyGucMamasi, tickGucBuff, refillYP, currentGuc,
  HP_MAX, YP_MAX, BITE_BASE, GUC_MAMASI_BONUS,
} from '../src/state/gameState';

describe('newGameState', () => {
  it('has correct starting values', () => {
    const s = newGameState();
    expect(s).toEqual({
      hp: 10, rd: 0, yp: 5, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
      botVar: false, botKullanildi: false, tutorialDone: false,
    });
  });
});

describe('useMama', () => {
  it('heals +3 capped at HP_MAX and consumes one mama', () => {
    const s = { ...newGameState(), hp: 8, mama: 2 };
    const r = useMama(s);
    expect(r.hp).toBe(HP_MAX); // 8+3 capped at 10
    expect(r.mama).toBe(1);
  });
  it('does nothing when no mama', () => {
    const s = { ...newGameState(), hp: 5, mama: 0 };
    expect(useMama(s)).toEqual(s);
  });
});

describe('buy', () => {
  it('mama: deducts 5 RD and adds one', () => {
    const s = { ...newGameState(), rd: 20, mama: 0 };
    const r = buy(s, 'mama');
    expect(r.rd).toBe(15);
    expect(r.mama).toBe(1);
  });
  it('bot: deducts 50 RD, sets botVar, only once', () => {
    const s = { ...newGameState(), rd: 60 };
    const r = buy(s, 'bot');
    expect(r.rd).toBe(10);
    expect(r.botVar).toBe(true);
    expect(canBuy(r, 'bot')).toBe(false); // zaten var
  });
  it('canBuy false when insufficient RD', () => {
    expect(canBuy({ ...newGameState(), rd: 3 }, 'mama')).toBe(false);
  });
});

describe('useBoots', () => {
  it('spends YP and activates when owned and enough YP', () => {
    const s = { ...newGameState(), botVar: true, yp: 5 };
    expect(canUseBoots(s)).toBe(true);
    const r = useBoots(s);
    expect(r.yp).toBe(2);
    expect(r.botKullanildi).toBe(true);
  });
  it('cannot use without enough YP or already used', () => {
    expect(canUseBoots({ ...newGameState(), botVar: true, yp: 2 })).toBe(false);
    expect(canUseBoots({ ...newGameState(), botVar: true, yp: 5, botKullanildi: true })).toBe(false);
    expect(canUseBoots({ ...newGameState(), botVar: false, yp: 5 })).toBe(false);
  });
});

describe('güç maması + güç', () => {
  it('currentGuc is base normally, boosted while buff active', () => {
    const s = newGameState();
    expect(currentGuc(s)).toBe(BITE_BASE);
    const buffed = { ...s, gucBuffTurns: 2 };
    expect(currentGuc(buffed)).toBe(BITE_BASE + GUC_MAMASI_BONUS);
  });
  it('applyGucMamasi consumes one and sets 2 turns', () => {
    const s = { ...newGameState(), gucMamasi: 1 };
    const r = applyGucMamasi(s);
    expect(r.gucMamasi).toBe(0);
    expect(r.gucBuffTurns).toBe(2);
  });
  it('tickGucBuff decrements but not below 0', () => {
    expect(tickGucBuff({ ...newGameState(), gucBuffTurns: 2 }).gucBuffTurns).toBe(1);
    expect(tickGucBuff({ ...newGameState(), gucBuffTurns: 0 }).gucBuffTurns).toBe(0);
  });
});

describe('refillYP', () => {
  it('sets yp to YP_MAX', () => {
    expect(refillYP({ ...newGameState(), yp: 1 }).yp).toBe(YP_MAX);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/gameState.test.ts`
Expected: FAIL (cannot find module `../src/state/gameState`).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/state/gameState.ts
import type { StorageBackend } from '../data/save';

export const HP_MAX = 10;
export const YP_MAX = 5;
export const BITE_BASE = 3;
export const MAMA_HEAL = 3;
export const GUC_MAMASI_BONUS = 3;
export const GUC_MAMASI_TURNS = 2;
export const BOT_YP_COST = 3;
export const BOOT_MULT = 1.6;
export const PRICES: Record<ItemKey, number> = { mama: 5, guc: 10, bot: 50 };

export type ItemKey = 'mama' | 'guc' | 'bot';

export interface GameState {
  hp: number;
  rd: number;
  yp: number;
  gucBuffTurns: number;
  mama: number;
  gucMamasi: number;
  botVar: boolean;
  botKullanildi: boolean;
  tutorialDone: boolean;
}

const STATE_KEY = 'random-kacis-state';

export function newGameState(): GameState {
  return {
    hp: HP_MAX, rd: 0, yp: YP_MAX, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
    botVar: false, botKullanildi: false, tutorialDone: false,
  };
}

export function currentGuc(s: GameState): number {
  return BITE_BASE + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0);
}

export function useMama(s: GameState): GameState {
  if (s.mama <= 0) return s;
  return { ...s, mama: s.mama - 1, hp: Math.min(HP_MAX, s.hp + MAMA_HEAL) };
}

export function canBuy(s: GameState, key: ItemKey): boolean {
  if (s.rd < PRICES[key]) return false;
  if (key === 'bot' && s.botVar) return false;
  return true;
}

export function buy(s: GameState, key: ItemKey): GameState {
  if (!canBuy(s, key)) return s;
  const rd = s.rd - PRICES[key];
  if (key === 'mama') return { ...s, rd, mama: s.mama + 1 };
  if (key === 'guc') return { ...s, rd, gucMamasi: s.gucMamasi + 1 };
  return { ...s, rd, botVar: true };
}

export function canUseBoots(s: GameState): boolean {
  return s.botVar && !s.botKullanildi && s.yp >= BOT_YP_COST;
}

export function useBoots(s: GameState): GameState {
  if (!canUseBoots(s)) return s;
  return { ...s, yp: s.yp - BOT_YP_COST, botKullanildi: true };
}

export function applyGucMamasi(s: GameState): GameState {
  if (s.gucMamasi <= 0) return s;
  return { ...s, gucMamasi: s.gucMamasi - 1, gucBuffTurns: GUC_MAMASI_TURNS };
}

export function tickGucBuff(s: GameState): GameState {
  return { ...s, gucBuffTurns: Math.max(0, s.gucBuffTurns - 1) };
}

export function refillYP(s: GameState): GameState {
  return { ...s, yp: YP_MAX };
}

export function saveState(s: GameState, storage: StorageBackend): void {
  storage.setItem(STATE_KEY, JSON.stringify(s));
}

export function loadState(storage: StorageBackend): GameState {
  const raw = storage.getItem(STATE_KEY);
  if (raw === null) return newGameState();
  try {
    const p = JSON.parse(raw) as Partial<GameState>;
    return { ...newGameState(), ...p };
  } catch {
    return newGameState();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/gameState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/gameState.ts test/gameState.test.ts
git commit -m "feat(state): merkezi oyun durumu (can/RD/YP/eşya) + saf mutasyonlar + testler"
```

---

## Task 2: ShopScene → gameState

**Files:**
- Modify: `src/chapters/chapter2/ShopScene.ts`

**Interfaces:**
- Consumes: `loadState`, `saveState`, `buy`, `canBuy`, `PRICES` (Task 1); `browserStorage` (`src/data/save.ts`).

Değişiklikler:
- `import { browserStorage } from '../../data/save';` ve `import { GameState, loadState, saveState, buy, canBuy } from '../../state/gameState';`
- Sahne alanları: `private state!: GameState;` (yerine eski `rd`/`counts`).
- `create()` başında: `this.state = loadState(browserStorage());`
- İlk giriş hediyesi: yalnızca RD 0 iken 100 RD ver. `create()` içinde balonu göstermeden önce:
  ```ts
  if (this.state.rd === 0 && !this.state.tutorialDone) {
    this.state = { ...this.state, rd: 100 };
    saveState(this.state, browserStorage());
  }
  ```
  Karşılama balonu metni **aynen** kalır: `Hoşgeldiniz, siz galiba buralarda yenisiniz benden hediye size 100 RD. RD ne mi demek? RD Random Doları demektir. Buyrun istediğinizi alın`
- Bakiye metni state'ten: `💰 ${this.state.rd} RD`.
- `buy(it)` metodu:
  ```ts
  private buy(it: ShopItem): void {
    if (!canBuy(this.state, it.key as 'mama'|'guc'|'bot')) {
      const reason = it.key === 'bot' && this.state.botVar ? 'Zaten aldın' : 'Yetersiz RD!';
      this.floatText(it.x, 300, reason, '#ff6b6b');
      return;
    }
    this.state = buy(this.state, it.key as 'mama'|'guc'|'bot');
    saveState(this.state, browserStorage());
    this.balanceText.setText(`💰 ${this.state.rd} RD`);
    this.floatText(it.x, 300, 'Aldın! +1', '#7CFC7C');
  }
  ```
- Eski `this.rd`/`this.counts` alanları ve kullanımları kaldırılır.

- [ ] **Step 1: Apply the edits above to `ShopScene.ts`.**

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ built`, no TS errors.

- [ ] **Step 3: E2E verify**

Dev server `npx vite --port 5184`. Sahne başlat, satın al, RD düşüşünü ve `localStorage['random-kacis-state']`'i doğrula:

```js
() => {
  const g = window.__game;
  window.localStorage.removeItem('random-kacis-state');
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('Chapter2_Shop');
  return new Promise(res => setTimeout(() => {
    const sc = g.scene.getScene('Chapter2_Shop');
    const cx = sc.scale.width/2;
    const zone = sc.children.list.find(o => o.type==='Rectangle' && Math.abs(o.x-(cx-150))<6 && Math.abs(o.y-350)<6);
    zone.emit('pointerup'); // mama al (5 RD)
    const st = JSON.parse(window.localStorage.getItem('random-kacis-state'));
    res(JSON.stringify({ rd: st.rd, mama: st.mama }));
  }, 500));
}
```
Expected: `{ "rd": 95, "mama": 11 }` (100 hediye - 5, 10 başlangıç + 1).

- [ ] **Step 4: Commit**

```bash
git add src/chapters/chapter2/ShopScene.ts
git commit -m "feat(shop): satın alma ve RD kalıcı gameState'e bağlandı"
```

---

## Task 3: BattleScene → gameState (can + mama)

**Files:**
- Modify: `src/chapters/chapter1/BattleScene.ts`

**Interfaces:**
- Consumes: `loadState`, `saveState`, `useMama`, `HP_MAX` (Task 1); `browserStorage`.

Değişiklikler:
- Import: `import { GameState, loadState, saveState, useMama as stateUseMama, HP_MAX } from '../../state/gameState';` (browserStorage zaten import edili).
- Alan: `private state!: GameState;`
- `create()`: `this.state = loadState(browserStorage());` sonra `this.randomHp = this.state.hp;` (RANDOM_MAX yerine state'ten başlar). `RANDOM_MAX` sabiti `HP_MAX` ile aynı (10) kalır; can barı maks `RANDOM_MAX` üzerinden.
- Mama sayısı: her yerde `this.mamaCount` yerine `this.state.mama`. `showItemList` etiketi: `Mama 🦴 ×${this.state.mama}`.
- `useMama()`: state üzerinden:
  ```ts
  private useMama(): void {
    if (this.state.mama <= 0) { this.setBubble('Mama bitti!'); return; }
    const before = this.randomHp;
    this.state = stateUseMama(this.state);       // mama--, state.hp cap'li
    this.randomHp = Math.min(RANDOM_MAX, this.randomHp + MAMA_HEAL);
    saveState(this.state, browserStorage());
    // ... mevcut animasyon/bar güncelleme/tur bitişi aynı ...
  }
  ```
- Savaş bitişinde canı yaz: `win()` ve kaybediş yolunda savaş sonucu state.hp'ye yazılır:
  - `win()` içinde ilk satıra: `this.state = { ...this.state, hp: this.randomHp }; saveState(this.state, browserStorage());`
  - Polis vuruşuyla can 0 olup GameOver'a giderken de `this.state = { ...this.state, hp: 0 }; saveState(...)`.
- Eski `mamaCount`/`MAMA_START` alan ve başlangıçları kaldırılır (mama artık state'te).

- [ ] **Step 1: Apply edits.**
- [ ] **Step 2: Build** — `npm run build` → `✓ built`.
- [ ] **Step 3: Run tests** — `npx vitest run` → hepsi geçer (mevcut + gameState).
- [ ] **Step 4: E2E** — Yeni oyun state ile Battle başlat, mama kullan, `localStorage` state.mama'nın 9'a, state kaydının güncellendiğini doğrula (savaş başında `random-kacis-state` sıfırlanmışsa 10 mama):
```js
() => {
  const g = window.__game;
  window.localStorage.removeItem('random-kacis-state');
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('Battle');
  return new Promise(res => setTimeout(() => res(JSON.stringify({
    started: g.scene.isActive('Battle'),
  })), 500));
}
```
Expected: `{ "started": true }` (görsel: can barı 10/10, EŞYALAR → Mama ×10).
- [ ] **Step 5: Commit**
```bash
git add src/chapters/chapter1/BattleScene.ts
git commit -m "feat(battle): can ve mama kalıcı gameState'e bağlandı"
```

---

## Task 4: BattleScene "Geri" butonu

**Files:**
- Modify: `src/chapters/chapter1/BattleScene.ts`

Alt listelere (Atak ve Eşyalar) bir "Geri" öğesi ekle; ana menüye döner, tur harcamaz.

- Yeni yardımcı: ana Atak/Eşyalar menüsünü yeniden gösteren metodun adını bul (mevcut menü `this.menu`). Menüyü kuran metod (ör. `showMainMenu()`; yoksa `create` içindeki menü kurulum bloğunu bir `showMainMenu()` metoduna çıkar).
- `showAttackList()` ve `showItemList()` sonuna Geri öğesi ekle. `makeListItem` tek öğe döndürüyor; ikinci bir "Geri" öğesi için konumu kaydır. Basitçe:
  ```ts
  private showBackButton(): void {
    const W = this.scale.width;
    const bg = this.add.rectangle(0, 0, 120, 44, 0x2a2036).setStrokeStyle(2, 0x8888aa);
    const txt = this.add.text(0, 0, '← Geri', { fontFamily:'sans-serif', fontSize:'18px', color:'#ffffff' }).setOrigin(0.5);
    const c = this.add.container(W/2, 410, [bg, txt]);
    c.setSize(120,44); c.setInteractive({ useHandCursor:true });
    c.on('pointerup', () => { if (this.busy) return; this.list?.destroy(); this.list = undefined; c.destroy(); this.backBtn = undefined; this.showMainMenu(); });
    this.backBtn = c;
  }
  ```
  Alan: `private backBtn?: Phaser.GameObjects.Container;`
- `showAttackList()` ve `showItemList()` içinde liste kurulduktan sonra `this.showBackButton();` çağır.
- Ana menüyü tekrar açan `showMainMenu()` (menüyü kuran mevcut kodu buraya taşı). Geri'ye basınca `this.backBtn`/`this.list`/`this.bubble` temizlenir, `showMainMenu()` çağrılır.
- Bir tur başlatan her işlem (performBite/useMama) başında `this.backBtn?.destroy(); this.backBtn = undefined;` ekle ki geri butonu kaybolsun.

- [ ] **Step 1: Refactor menü kurulumunu `showMainMenu()`'ya çıkar; `showBackButton()` ekle; alt listelerde çağır; tur eylemlerinde temizle.**
- [ ] **Step 2: Build** — `✓ built`.
- [ ] **Step 3: E2E** — Battle başlat, Atak'a bas → liste + Geri görünür; Geri'ye bas → ana menü (Atak/Eşyalar) döner, `busy` false, tur geçmedi (polis saldırmadı). Doğrula:
```js
() => {
  const g = window.__game;
  const sc = g.scene.getScene('Battle');
  // Atak menüsünü aç, Geri butonunu bul ve bas, ana menü döndü mü kontrol et
  // (buton container'larını etikete göre bul)
  const findByText = (t) => sc.children.list.find(o => o.type==='Container' && o.list?.some(k => k.type==='Text' && k.text.includes(t)));
  return JSON.stringify({ hasBack: !!findByText('Geri') });
}
```
(Atak açıldıktan sonra `hasBack: true` beklenir; ekran görüntüsüyle de doğrula.)
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter1/BattleScene.ts
git commit -m "feat(battle): alt menülerde Geri butonu (tur harcamaz)"
```

---

## Task 5: BattleScene güç maması + YP dolumu

**Files:**
- Modify: `src/chapters/chapter1/BattleScene.ts`

**Interfaces:**
- Consumes: `currentGuc`, `applyGucMamasi`, `tickGucBuff`, `refillYP`, `saveState` (Task 1).

- Isırma hasarı sabiti `BITE_DMG` yerine `currentGuc(this.state)` kullanılır (güç maması buff'ı etkiler).
- Eşyalar listesine Güç Maması ekle: `showItemList()` içinde ikinci öğe.
  Etiket: `Güç Maması 🔴 ×${this.state.gucMamasi}`. Tıklanınca `useGucMamasi()`:
  ```ts
  private useGucMamasi(): void {
    if (this.state.gucMamasi <= 0) { this.setBubble('Güç Maması yok!'); return; }
    this.busy = true;
    this.list?.destroy(); this.list = undefined;
    this.backBtn?.destroy(); this.backBtn = undefined;
    this.state = applyGucMamasi(this.state);
    saveState(this.state, browserStorage());
    this.setBubble('Güç arttı! 2 tur boyunca ısırman daha güçlü! 💪');
    const t = this.add.text(this.hero.x, this.hero.y - 80, 'GÜÇ +3', { fontFamily:'sans-serif', fontSize:'26px', color:'#ff9d5c', fontStyle:'bold', stroke:'#201a2a', strokeThickness:4 }).setOrigin(0.5);
    this.tweens.add({ targets:t, y:t.y-40, alpha:0, duration:1000, onComplete:()=>t.destroy() });
    this.time.delayedCall(1000, () => { if (this.bossHp <= 0) { this.win(); return; } this.policeTurn(); });
  }
  ```
  `showItemList()`'te iki öğe (Mama, Güç Maması) yan yana/alt alta konumlanır; mevcut `makeListItem` tek konumda çiziyor — ikinci öğe için y farkı ver (ör. Mama y=468, Güç Maması y=468 ama x kaydır, ya da iki satır). En basit: Mama solda, Güç Maması sağda: `makeListItem`'a x parametresi ekle veya iki container'ı elle konumla.
- Güç buff tur sayacı: Random'ın turu bittiğinde (polisin turuna geçmeden hemen önce, performBite ve useGucMamasi sonrası) `this.state = tickGucBuff(this.state); saveState(...)`. Böylece 2 tur sonra biter.
- YP dolumu: `win()` içinde `this.state = refillYP({ ...this.state, hp: this.randomHp }); saveState(this.state, browserStorage());` (canı yaz + YP doldur).

- [ ] **Step 1: Apply edits.**
- [ ] **Step 2: Build** — `✓ built`; `npx vitest run` → geçer.
- [ ] **Step 3: E2E** — state'e `gucMamasi:1` ver, Battle'da Eşyalar → Güç Maması kullan, `state.gucBuffTurns===2` ve sonraki ısırmada boss'a 6 hasar (currentGuc 6) gittiğini doğrula (boss hp düşüşü). YP: savaş kazanınca `state.yp===5`.
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter1/BattleScene.ts
git commit -m "feat(battle): Güç Maması buff (+3 güç/2 tur) + kazanınca YP dolumu"
```

---

## Task 6: InventoryScene + kayıt + main

**Files:**
- Create: `src/scenes/InventoryScene.ts`
- Modify: `src/scenes/keys.ts` (add `Inventory: 'Inventory'`)
- Modify: `src/main.ts` (import + register `InventoryScene`)

**Interfaces:**
- Consumes: `loadState`, `saveState`, `useMama`, `useBoots`, `canUseBoots`, `currentGuc`, `HP_MAX`, `YP_MAX` (Task 1); `browserStorage`.
- `init({ resumeKey })` ile hangi sahneye döneceğini alır (PauseScene deseni).
- Produces: `Inventory` sahne anahtarı.

```ts
// src/scenes/InventoryScene.ts
import Phaser from 'phaser';
import { SceneKeys } from './keys';
import { browserStorage } from '../data/save';
import {
  GameState, loadState, saveState, useMama, useBoots, canUseBoots,
  currentGuc, HP_MAX, YP_MAX,
} from '../state/gameState';

interface InvData { resumeKey: string; }

export class InventoryScene extends Phaser.Scene {
  private resumeKey = SceneKeys.Chapter2_Forest as string;
  private state!: GameState;
  private info!: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Container[] = [];

  constructor() { super(SceneKeys.Inventory); }

  init(data: InvData): void { this.resumeKey = data.resumeKey; }

  create(): void {
    const cx = this.scale.width / 2;
    this.state = loadState(browserStorage());
    this.add.rectangle(cx, this.scale.height/2, this.scale.width, this.scale.height, 0x05070d, 0.9).setInteractive();
    this.add.text(cx, 40, '🎒 Envanter', { fontFamily:'sans-serif', fontSize:'30px', color:'#ffe066', fontStyle:'bold' }).setOrigin(0.5);

    this.info = this.add.text(cx, 96, '', { fontFamily:'sans-serif', fontSize:'20px', color:'#ffffff', align:'center' }).setOrigin(0.5);
    this.refreshInfo();

    this.add.text(cx, 150, 'Eşyalar (kullanmak için dokun)', { fontFamily:'sans-serif', fontSize:'16px', color:'#aaaaaa' }).setOrigin(0.5);
    this.buildRows();

    const close = this.makeButton(cx, this.scale.height - 50, 'Kapat', () => this.closeInv());
    this.add.existing(close);
    this.input.keyboard?.once('keydown-ESC', () => this.closeInv());
  }

  private refreshInfo(): void {
    const s = this.state;
    this.info.setText(`💰 ${s.rd} RD    ❤️ Can ${s.hp}/${HP_MAX}    ⚡ YP ${s.yp}/${YP_MAX}    💪 Güç ${currentGuc(s)}`);
  }

  private buildRows(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    const cx = this.scale.width / 2;
    const s = this.state;
    const defs = [
      { label: `🦴 Mama ×${s.mama}`, onUse: () => this.doUseMama() },
      { label: `🔴 Güç Maması ×${s.gucMamasi}`, onUse: () => this.flash('Bu eşya savaşta kullanılır') },
      { label: `👢 Hız Botları ${s.botVar ? (s.botKullanildi ? '(kullanıldı)' : '(hazır)') : '(yok)'}`, onUse: () => this.doUseBoots() },
    ];
    defs.forEach((d, i) => {
      const c = this.makeButton(cx, 200 + i * 64, d.label, d.onUse);
      this.rows.push(c);
    });
  }

  private doUseMama(): void {
    if (this.state.mama <= 0) { this.flash('Mama yok'); return; }
    this.state = useMama(this.state);
    saveState(this.state, browserStorage());
    this.refreshInfo(); this.buildRows();
    this.flash('Can +3 ❤️');
  }

  private doUseBoots(): void {
    if (!this.state.botVar) { this.flash('Önce dükkandan al'); return; }
    if (this.state.botKullanildi) { this.flash('Zaten kullandın'); return; }
    if (!canUseBoots(this.state)) { this.flash('YP yetersiz (3 gerekir)'); return; }
    this.state = useBoots(this.state);
    saveState(this.state, browserStorage());
    this.refreshInfo(); this.buildRows();
    this.flash('Hız botları aktif! Artık daha hızlısın 👢');
  }

  private flash(msg: string): void {
    const t = this.add.text(this.scale.width/2, this.scale.height - 110, msg, {
      fontFamily:'sans-serif', fontSize:'18px', color:'#7CFC7C', stroke:'#201a2a', strokeThickness:4,
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets:t, alpha:0, duration:1400, onComplete:()=>t.destroy() });
  }

  private closeInv(): void {
    this.scene.stop();
    this.scene.resume(this.resumeKey);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const bg = this.add.rectangle(0, 0, 360, 50, 0x3a3a55).setStrokeStyle(2, 0xffe066);
    const txt = this.add.text(0, 0, label, { fontFamily:'sans-serif', fontSize:'20px', color:'#ffffff' }).setOrigin(0.5);
    const c = this.add.container(x, y, [bg, txt]);
    c.setSize(360, 50); c.setInteractive({ useHandCursor:true });
    c.on('pointerover', () => bg.setFillStyle(0x50507a));
    c.on('pointerout', () => bg.setFillStyle(0x3a3a55));
    c.on('pointerup', onClick);
    return c;
  }
}
```

- `keys.ts`: `SceneKeys` içine `Inventory: 'Inventory',` ekle.
- `main.ts`: `import { InventoryScene } from './scenes/InventoryScene';` ve `scene: [...]` dizisine `InventoryScene,` ekle (PauseScene yakınına).

- [ ] **Step 1: keys + main + InventoryScene oluştur.**
- [ ] **Step 2: Build** — `✓ built`.
- [ ] **Step 3: E2E** — state'e `botVar:true, yp:5` ver, `Inventory` sahnesini `{resumeKey:'Chapter2_Forest'}` ile başlat (Forest'ı da launch et), botu kullan → `state.botKullanildi===true`, `state.yp===2`. Mama kullan → hp artar. Ekran görüntüsü.
- [ ] **Step 4: Commit**
```bash
git add src/scenes/InventoryScene.ts src/scenes/keys.ts src/main.ts
git commit -m "feat(inventory): envanter ekranı — can/RD/YP/güç + mama & bot kullanımı"
```

---

## Task 7: ENV butonu + ESC → Inventory (Forest/Park)

**Files:**
- Modify: `src/chapters/chapter2/ForestScene.ts`
- Modify: `src/chapters/chapter2/ParkScene.ts`

Her iki sahnede envanteri açan ortak kanca. Envanter açılırken dünya duraklar.

Her iki sahnenin `create()` sonuna:
```ts
this.addEnvButton();
this.input.keyboard?.on('keydown-ESC', () => this.openInventory());
```
Ve metodlar (iki sahnede de aynı; istersen küçük bir yardımcı `src/ui/envButton.ts` ile paylaş):
```ts
private addEnvButton(): void {
  const x = 150, y = this.scale.height - 78; // yön pedinin sağında
  const bg = this.add.circle(x, y, 26, 0x000000, 0.45).setStrokeStyle(2, 0xffe066).setScrollFactor(0).setDepth(1000);
  const txt = this.add.text(x, y, 'ENV', { fontFamily:'sans-serif', fontSize:'15px', color:'#ffe066', fontStyle:'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
  bg.setInteractive({ useHandCursor:true });
  bg.on('pointerup', () => this.openInventory());
}
private openInventory(): void {
  if (this.scene.isActive(SceneKeys.Inventory)) return;
  this.scene.pause();
  this.scene.launch(SceneKeys.Inventory, { resumeKey: this.scene.key });
}
```
> Not: `dpad.ts` yön pedini `cx=78`'e koyuyor; ENV butonu `x=150` ile pedin sağında durur, çakışmaz. Overworld güncellendiğinde (Task 8) ESC/ENV donmuş harekete engel değil.

- [ ] **Step 1: İki sahneye ENV butonu + ESC ekle.**
- [ ] **Step 2: Build** — `✓ built`.
- [ ] **Step 3: E2E** — Forest'ta ENV butonuna bas (veya ESC), `Inventory` aktif + Forest paused; Kapat → Forest resume. Doğrula:
```js
() => {
  const g = window.__game;
  g.scene.getScenes(true).forEach(s => g.scene.stop(s.scene.key));
  g.scene.start('Chapter2_Forest');
  return new Promise(res => setTimeout(() => {
    const f = g.scene.getScene('Chapter2_Forest');
    f['openInventory']();
    setTimeout(() => res(JSON.stringify({ inv: g.scene.isActive('Inventory'), forestPaused: g.scene.isPaused('Chapter2_Forest') })), 200);
  }, 400));
}
```
Expected: `{ "inv": true, "forestPaused": true }`.
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter2/ForestScene.ts src/chapters/chapter2/ParkScene.ts
git commit -m "feat(chapter2): ENV butonu + ESC ile envanteri aç (orman/park)"
```

---

## Task 8: Overworld bot hız çarpanı

**Files:**
- Modify: `src/chapters/chapter2/overworld.ts`

**Interfaces:**
- Consumes: `loadState`, `BOOT_MULT` (Task 1); `browserStorage`.

- `overworld.ts` import: `import { loadState, BOOT_MULT } from '../../state/gameState'; import { browserStorage } from '../../data/save';`
- `update()` içinde hız hesaplanırken çarpan uygula. Mevcut: `const { speed, ... } = this.opts;`. Değiştir:
  ```ts
  const boot = loadState(browserStorage()).botKullanildi ? BOOT_MULT : 1;
  const speed = this.opts.speed * boot;
  ```
  (yerine `const { speed } = this.opts` kaldırılır; `worldWidth,yTop,yBottom` opts'tan kalır.)
  Böylece envanterde bot kullanılıp dünyaya dönülünce (aynı localStorage) hız anında artar.

- [ ] **Step 1: Apply edit.**
- [ ] **Step 2: Build** — `✓ built`; `npx vitest run` → geçer.
- [ ] **Step 3: E2E** — Forest'ta `botKullanildi:false` iken birkaç kare sağa git, kat edilen mesafeyi ölç; sonra state'e `botKullanildi:true` yazıp aynı kare sayısında mesafeyi ölç → ikincisi ~1.6× olmalı.
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter2/overworld.ts
git commit -m "feat(chapter2): hız botu aktifken overworld hız çarpanı (BOOT_MULT)"
```

---

## Task 9: Dükkan çıkışı + ilk çıkış tanıtımı

**Files:**
- Modify: `src/chapters/chapter2/ShopScene.ts` (Çıkış butonu)
- Modify: `src/chapters/chapter2/ParkScene.ts` (ilk çıkış tanıtım dizisi)

- **ShopScene:** Sağ üstteki duraklat butonunun yanına/altına bir **Çıkış** butonu ekle → `changeScene(this, SceneKeys.Chapter2_Park)`. (import `changeScene` gerekir.)
  ```ts
  const exit = this.add.text(this.scale.width - 70, 30, '← Çıkış', { fontFamily:'sans-serif', fontSize:'18px', color:'#ffffff', stroke:'#201a2a', strokeThickness:3 }).setOrigin(0.5).setDepth(600).setInteractive({ useHandCursor:true });
  exit.on('pointerup', () => changeScene(this, SceneKeys.Chapter2_Park));
  ```
- **ParkScene:** `create()` sonunda, `tutorialDone` false ise tanıtım dizisini başlat (state'ten oku). Balon dizisi (`showSpeechBubble`), tıkla-ilerle; bitince `tutorialDone=true` yaz:
  ```ts
  const st = loadState(browserStorage());
  if (!st.tutorialDone) this.runTutorial();
  ```
  ```ts
  private runTutorial(): void {
    const beats = [
      'Bir çantamız (envanter) var! Sağ alttaki ENV\'e ya da ESC\'ye dokun.',
      'Orada canımızı ❤️, gücümüzü 💪 ve YP\'mizi ⚡ görürüz.',
      'Eşyalar\'a bak — Hız Botları\'nı kullan! (YP\'n 5, botun gereksinimi 3)',
      'Botu kullanınca YP 2/5 olur ve daha hızlı gezersin. Haydi dene!',
    ];
    let i = 0;
    const heroX = this.world.hero.x, heroY = this.world.hero.y - 40;
    let bubble = showSpeechBubble(this, heroX, heroY, beats[0], 300);
    const advance = () => {
      i += 1;
      bubble.destroy();
      if (i >= beats.length) {
        const st = loadState(browserStorage());
        saveState({ ...st, tutorialDone: true }, browserStorage());
        this.input.off('pointerdown', advance);
        return;
      }
      bubble = showSpeechBubble(this, this.world.hero.x, this.world.hero.y - 40, beats[i], 300);
    };
    this.input.on('pointerdown', advance);
  }
  ```
  > Not: tanıtım balonları gezinmeyi engellemez; oyuncu ilerledikçe balon konumu ilk konumda kalır (basitlik). `import { showSpeechBubble }` ve `loadState/saveState` gerekir.

- [ ] **Step 1: ShopScene Çıkış + ParkScene tanıtım ekle.**
- [ ] **Step 2: Build** — `✓ built`.
- [ ] **Step 3: E2E** — Shop'ta Çıkış → Park aktif; `tutorialDone:false` iken Park'ta ilk balon görünür; 4 kez pointerdown → balon biter, `state.tutorialDone===true`. Tekrar Park'a girince tanıtım çıkmaz.
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter2/ShopScene.ts src/chapters/chapter2/ParkScene.ts
git commit -m "feat(chapter2): dükkan Çıkış butonu + ilk çıkışta envanter/YP tanıtımı"
```

---

## Self-Review Notes

- **Spec coverage:** gameState (T1) ✓; savaş Geri (T4) ✓; mama/güç maması/bot etkileri (T3,T5,T6,T8) ✓; kalıcı can & mama (T3) ✓; envanter ESC/ENV (T6,T7) ✓; YP dolumu (T5) ✓; dükkan çıkışı + tanıtım (T9) ✓; RD/güç/YP gösterimi (T6) ✓.
- **Tutarlılık:** `currentGuc` güç için tek kaynak; `useMama` state ve battle'da tutarlı; `ItemKey` = 'mama'|'guc'|'bot' her yerde aynı.
- **Kapsam dışı (spec):** botun ek güçleri, çoklu kayıt, ikon animasyonları.
- **Not:** Chapter 1 battle mama artık state'ten (yeni oyunda 10) — davranış korunur.
