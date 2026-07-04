# YP → Paper Mario BP Mantığı — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** YP'yi savaş sonu dolan puandan, equip'e harcanan + level'la büyüyen + savaşta dolmayan bir kapasiteye (Paper Mario BP) çevir.

**Architecture:** `gameState.ts`'te `ypMax` alanı + `botKullanildi`→`botEquipped` rename + equip/unequip/toggle/levelUp saf mutasyonları; `refillYP` kaldırılır. Tüketiciler (Inventory, overworld, Battle) yeni alana/mantığa uyarlanır.

**Tech Stack:** TypeScript, Phaser 3.80, Vite 8, Vitest 4.

## Global Constraints

- Sabitler: `YP_MAX = 5` (başlangıç maks), `BOT_YP_COST = 3`, `YP_LEVEL_GAIN = 3`, `BOOT_MULT = 1.6`.
- `yp` = boş/kullanılabilir YP; `ypMax` = toplam kapasite. Gösterim `yp/ypMax`.
- Başlangıç: `ypMax = 5`, `yp = 5`, `botEquipped = false`.
- YP **savaş kazanınca DOLMAZ** (refillYP kaldırılır ve çağrılmaz).
- Bot equip/unequip **geri alınabilir**: equip → `yp -= 3`, botEquipped true; unequip → `yp += 3`, botEquipped false.
- `levelUp()`: `ypMax += 3`, `yp += 3`. Chapter 1'de ÇAĞRILMAZ (bu plan tetik eklemez).
- `loadState` geriye dönük göç: eski `botKullanildi` → `botEquipped`; `ypMax` yoksa `YP_MAX`; `yp` `ypMax`'ı aşamaz.
- Her görev sonunda commit; deploy'dan önce `npm run build`.

---

## File Structure

- Modify `src/state/gameState.ts` (+ `test/gameState.test.ts`) — model + mutasyonlar.
- Modify `src/scenes/InventoryScene.ts` — YP `yp/ypMax`, bot tak/çıkar toggle.
- Modify `src/chapters/chapter2/overworld.ts` — `botKullanildi` → `botEquipped`.
- Modify `src/chapters/chapter1/BattleScene.ts` — `refillYP` çağrısı + import kaldır.

---

## Task 1: gameState — BP modeli + testler

**Files:**
- Modify: `src/state/gameState.ts`
- Modify: `test/gameState.test.ts`

**Interfaces:**
- Produces: `GameState` (yeni `ypMax`, `botEquipped`); `YP_LEVEL_GAIN`; `canEquipBoots(s)`, `equipBoots(s)`, `unequipBoots(s)`, `toggleBoots(s)`, `levelUp(s)`. KALDIRILAN: `canUseBoots`, `useBoots`, `refillYP`, `botKullanildi`.

- [ ] **Step 1: Güncellenen/yeni testleri yaz**

`test/gameState.test.ts` içinde: eski `useBoots`/`canUseBoots`/`refillYP` testlerini SİL, importlarından çıkar. Aşağıdaki testleri ekle (dosyanın diğer testleri — newGameState, useMama, buy, güç maması — kalır; ancak `newGameState` testi yeni alanları içerecek şekilde güncellenir):

```ts
// newGameState testini şununla değiştir:
import {
  newGameState, useMama, buy, canBuy,
  canEquipBoots, equipBoots, unequipBoots, toggleBoots, levelUp,
  applyGucMamasi, tickGucBuff, currentGuc,
  HP_MAX, YP_MAX, BITE_BASE, GUC_MAMASI_BONUS, YP_LEVEL_GAIN, loadState,
} from '../src/state/gameState';

describe('newGameState', () => {
  it('has correct starting values incl. ypMax and botEquipped', () => {
    expect(newGameState()).toEqual({
      hp: 10, rd: 0, yp: 5, ypMax: 5, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
      botVar: false, botEquipped: false, tutorialDone: false,
    });
  });
});

describe('bot equip/unequip', () => {
  it('equip spends YP and marks equipped', () => {
    const s = { ...newGameState(), botVar: true, yp: 5 };
    expect(canEquipBoots(s)).toBe(true);
    const r = equipBoots(s);
    expect(r.yp).toBe(2);
    expect(r.botEquipped).toBe(true);
  });
  it('unequip refunds YP and clears equipped', () => {
    const s = { ...newGameState(), botVar: true, yp: 2, botEquipped: true };
    const r = unequipBoots(s);
    expect(r.yp).toBe(5);
    expect(r.botEquipped).toBe(false);
  });
  it('toggle equips then unequips', () => {
    const s = { ...newGameState(), botVar: true, yp: 5 };
    const eq = toggleBoots(s);
    expect(eq.botEquipped).toBe(true);
    expect(eq.yp).toBe(2);
    const un = toggleBoots(eq);
    expect(un.botEquipped).toBe(false);
    expect(un.yp).toBe(5);
  });
  it('cannot equip without ownership or enough YP', () => {
    expect(canEquipBoots({ ...newGameState(), botVar: false, yp: 5 })).toBe(false);
    expect(canEquipBoots({ ...newGameState(), botVar: true, yp: 2 })).toBe(false);
    expect(canEquipBoots({ ...newGameState(), botVar: true, yp: 5, botEquipped: true })).toBe(false);
  });
});

describe('levelUp', () => {
  it('raises ypMax and free yp by YP_LEVEL_GAIN', () => {
    const s = { ...newGameState(), yp: 2, ypMax: 5 }; // bot takılıyken gibi
    const r = levelUp(s);
    expect(r.ypMax).toBe(5 + YP_LEVEL_GAIN);
    expect(r.yp).toBe(2 + YP_LEVEL_GAIN); // örn 5/8
  });
});

describe('loadState migration', () => {
  it('migrates old botKullanildi and missing ypMax', () => {
    const storage = {
      getItem: () => JSON.stringify({ hp: 7, rd: 20, yp: 2, mama: 3, botVar: true, botKullanildi: true }),
      setItem: () => {}, removeItem: () => {},
    };
    const s = loadState(storage);
    expect(s.ypMax).toBe(YP_MAX);          // eksik -> 5
    expect(s.botEquipped).toBe(true);      // eski botKullanildi taşındı
    expect(s.yp).toBe(2);
    expect('botKullanildi' in s).toBe(false);
  });
  it('clamps yp to ypMax', () => {
    const storage = {
      getItem: () => JSON.stringify({ yp: 9, ypMax: 5 }),
      setItem: () => {}, removeItem: () => {},
    };
    expect(loadState(storage).yp).toBe(5);
  });
});
```

- [ ] **Step 2: Testleri çalıştır — başarısız olmalı**

Run: `npx vitest run test/gameState.test.ts`
Expected: FAIL (canEquipBoots/equipBoots/... tanımlı değil; newGameState ypMax içermiyor).

- [ ] **Step 3: gameState.ts'i güncelle**

`src/state/gameState.ts` içinde şu değişiklikleri yap:

1. Sabit ekle (BOT_YP_COST yakınına):
```ts
export const YP_LEVEL_GAIN = 3;
```

2. `GameState` arayüzü: `yp` satırından sonra `ypMax` ekle; `botKullanildi` → `botEquipped`:
```ts
export interface GameState {
  hp: number;
  rd: number;
  yp: number;
  ypMax: number;
  gucBuffTurns: number;
  mama: number;
  gucMamasi: number;
  botVar: boolean;
  botEquipped: boolean;
  tutorialDone: boolean;
}
```

3. `newGameState`:
```ts
export function newGameState(): GameState {
  return {
    hp: HP_MAX, rd: 0, yp: YP_MAX, ypMax: YP_MAX, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
    botVar: false, botEquipped: false, tutorialDone: false,
  };
}
```

4. `canUseBoots`/`useBoots`'u ŞUNLARLA değiştir:
```ts
export function canEquipBoots(s: GameState): boolean {
  return s.botVar && !s.botEquipped && s.yp >= BOT_YP_COST;
}

export function equipBoots(s: GameState): GameState {
  if (!canEquipBoots(s)) return s;
  return { ...s, yp: s.yp - BOT_YP_COST, botEquipped: true };
}

export function unequipBoots(s: GameState): GameState {
  if (!s.botEquipped) return s;
  return { ...s, yp: s.yp + BOT_YP_COST, botEquipped: false };
}

export function toggleBoots(s: GameState): GameState {
  return s.botEquipped ? unequipBoots(s) : equipBoots(s);
}

export function levelUp(s: GameState): GameState {
  return { ...s, ypMax: s.ypMax + YP_LEVEL_GAIN, yp: s.yp + YP_LEVEL_GAIN };
}
```

5. `refillYP` fonksiyonunu tamamen SİL.

6. `loadState`'i göç mantığıyla değiştir:
```ts
export function loadState(storage: StorageBackend): GameState {
  const raw = storage.getItem(STATE_KEY);
  if (raw === null) return newGameState();
  try {
    const p = JSON.parse(raw) as Partial<GameState> & { botKullanildi?: boolean };
    const merged: GameState = {
      ...newGameState(),
      ...p,
      ypMax: typeof p.ypMax === 'number' ? p.ypMax : YP_MAX,
      botEquipped: p.botEquipped ?? p.botKullanildi ?? false,
    };
    merged.yp = Math.min(merged.yp, merged.ypMax);
    delete (merged as Partial<GameState> & { botKullanildi?: boolean }).botKullanildi;
    return merged;
  } catch {
    return newGameState();
  }
}
```

- [ ] **Step 4: Testleri çalıştır — geçmeli**

Run: `npx vitest run test/gameState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/gameState.ts test/gameState.test.ts
git commit -m "feat(state): YP'yi BP modeline çevir (ypMax, equip/unequip, levelUp, refillYP kaldır)"
```

---

## Task 2: InventoryScene — YP boş/maks + bot tak/çıkar

**Files:**
- Modify: `src/scenes/InventoryScene.ts`

**Interfaces:**
- Consumes: `toggleBoots`, `canEquipBoots` (Task 1); `currentGuc`, `HP_MAX` (mevcut). KULLANILMAYAN artık: `useBoots`, `canUseBoots`, `YP_MAX` (sabit yerine state.ypMax).

Değişiklikler:
1. Import satırını güncelle: `useMama, useBoots, canUseBoots, currentGuc, HP_MAX, YP_MAX` → `useMama, toggleBoots, canEquipBoots, currentGuc, HP_MAX`.
2. `refreshInfo()`: YP artık `yp/ypMax`:
```ts
this.info.setText(`💰 ${s.rd} RD    ❤️ Can ${s.hp}/${HP_MAX}    ⚡ YP ${s.yp}/${s.ypMax}    💪 Güç ${currentGuc(s)}`);
```
3. `buildRows()` bot satırı etiketi:
```ts
{ label: `👢 Hız Botları ${s.botVar ? (s.botEquipped ? '(takılı)' : '(hazır)') : '(yok)'}`, onUse: () => this.doToggleBoots() },
```
4. `doUseBoots()` metodunu `doToggleBoots()` ile değiştir:
```ts
private doToggleBoots(): void {
  if (!this.state.botVar) { this.flash('Önce dükkandan al'); return; }
  if (!this.state.botEquipped && !canEquipBoots(this.state)) { this.flash('YP yetersiz (3 gerekir)'); return; }
  const wasEquipped = this.state.botEquipped;
  this.state = toggleBoots(this.state);
  saveState(this.state, browserStorage());
  this.refreshInfo(); this.buildRows();
  this.flash(wasEquipped ? 'Botları çıkardın (YP geri geldi)' : 'Hız botları takıldı! 👢');
}
```

- [ ] **Step 1: Apply edits.**
- [ ] **Step 2: Build** — `npm run build` → `✓ built`.
- [ ] **Step 3: E2E** — Forest'ta envanteri aç; state `botVar:true, yp:5, ypMax:5`. Bota dokun → `yp 5→2`, `botEquipped true`, etiket "(takılı)", info "YP 2/5". Tekrar dokun → `yp 2→5`, `botEquipped false`, "(hazır)". Ekran görüntüsü.
- [ ] **Step 4: Commit**
```bash
git add src/scenes/InventoryScene.ts
git commit -m "feat(inventory): YP boş/maks gösterimi + hız botu tak/çıkar (toggle)"
```

---

## Task 3: Tüketiciler — overworld & Battle

**Files:**
- Modify: `src/chapters/chapter2/overworld.ts`
- Modify: `src/chapters/chapter1/BattleScene.ts`

**overworld.ts:** `botKullanildi` referanslarını `botEquipped` yap. İki yerde:
`this.bootMult = loadState(browserStorage()).botKullanildi ? BOOT_MULT : 1;` (constructor'da ve resume dinleyicisinde) →
`this.bootMult = loadState(browserStorage()).botEquipped ? BOOT_MULT : 1;`

**BattleScene.ts:**
1. Import'tan `refillYP`'yi çıkar (satır: `currentGuc, applyGucMamasi, tickGucBuff, refillYP,` → `currentGuc, applyGucMamasi, tickGucBuff,`).
2. `win()` içindeki `this.state = refillYP({ ...this.state, hp: this.randomHp });` satırını, YP'ye dokunmayan haliyle değiştir:
```ts
this.state = { ...this.state, hp: this.randomHp };
```
(canı yazmaya devam eder; YP artık savaşta dolmaz.)

- [ ] **Step 1: Apply both edits.**
- [ ] **Step 2: Build + tests** — `npm run build` → `✓ built`; `npx vitest run` → hepsi geçer.
- [ ] **Step 3: E2E** — (a) state `botEquipped:true` iken Forest'ta hız `BOOT_MULT` katı; `botEquipped:false` iken normal. (b) Battle kazan → `state.yp` DEĞİŞMEZ (dolmaz), `state.hp` yazılır.
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter2/overworld.ts src/chapters/chapter1/BattleScene.ts
git commit -m "refactor: botEquipped (overworld) + savaşta YP dolumunu kaldır (battle)"
```

---

## Self-Review Notes

- **Spec coverage:** ypMax + yp/ypMax gösterim (T1,T2) ✓; refillYP kaldır (T1,T3) ✓; equip/unequip/toggle (T1,T2) ✓; levelUp (T1; tetik kapsam dışı) ✓; botKullanildi→botEquipped (T1,T2,T3) ✓; loadState göçü (T1) ✓; overworld hız botEquipped (T3) ✓.
- **Tip tutarlılığı:** `botEquipped`, `ypMax` her dosyada aynı; `toggleBoots`/`canEquipBoots` isimleri T1'de tanımlı, T2'de tüketilir.
- **unequipBoots** net hali: `{ ...s, yp: s.yp + BOT_YP_COST, botEquipped: false }` (Step 3 notundaki uyarıya dikkat).
- **Kapsam dışı:** Chapter 2 savaşı / levelUp tetikleyicisi.
```
