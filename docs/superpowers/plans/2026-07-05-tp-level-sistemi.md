# TP Tabanlı Level Sistemi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Düşman TP verir → TP eşiği dolunca level atlar → her level'ın kendine özel Can/Atak artışı uygulanır, kalıcı ve envanterde görünür.

**Architecture:** `gameState.ts`'te `tp`/`level`/`hpMax`/`guc` alanları + `LEVELS` tablosu + `addTP()` saf fonksiyonu. Battle kazanınca `addTP(POLICE_TP)` çağırır; can tavanı/hasar/`currentGuc` dinamikleşir; envanter Seviye/TP + güncel Can/Güç gösterir.

**Tech Stack:** TypeScript, Phaser 3.80, Vite 8, Vitest 4.

## Global Constraints

- Yeni alanlar başlangıç: `tp = 0`, `level = 1`, `hpMax = 10` (HP_MAX), `guc = 3` (BITE_BASE).
- `LEVELS` (sadece level 2 tanımlı, genişletilebilir): `{ level: 2, tpNeeded: 10, hp: 3, guc: 2 }`.
- Polis TP ödülü: `POLICE_TP = 10`.
- `currentGuc(s) = s.guc + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0)`.
- Level-up tekrar uygulanmaz (`level < def.level` guard'ı).
- Chapter 1 kazanınca: `addTP(+10)` → level 2, hpMax 13, guc 5; sonra **tam iyileşme** `hp = hpMax`.
- Can tavanı her yerde `s.hpMax` (sabit HP_MAX değil).
- Envanterde **Seviye** ve **TP** görünür; Can `x/hpMax`.
- Mevcut `levelUp` (YP) fonksiyonu DEĞİŞMEZ (ayrı, kullanılmayan hook). Bu sistem YP'ye dokunmaz.
- Her görev sonunda commit; deploy'dan önce `npm run build`.

---

## File Structure

- Modify `src/state/gameState.ts` (+ `test/gameState.test.ts`) — alanlar, LEVELS, POLICE_TP, addTP, currentGuc, useMama, loadState.
- Modify `src/chapters/chapter1/BattleScene.ts` — win() addTP + tam iyileşme; can barı/hasar dinamik.
- Modify `src/scenes/InventoryScene.ts` — Seviye/TP + Can x/hpMax.

---

## Task 1: gameState — TP/level modeli + addTP + testler

**Files:**
- Modify: `src/state/gameState.ts`
- Modify: `test/gameState.test.ts`

**Interfaces:**
- Produces: `GameState` (yeni `tp`, `level`, `hpMax`, `guc`); `LEVELS`, `POLICE_TP`; `addTP(s, amount)`. `currentGuc` artık `s.guc` tabanlı; `useMama` `s.hpMax` cap'li.

- [ ] **Step 1: Testleri yaz/güncelle**

`test/gameState.test.ts`: import satırına `addTP, POLICE_TP` ekle. `newGameState` testini yeni alanlarla güncelle ve addTP testlerini ekle:

```ts
// newGameState testini şununla değiştir:
describe('newGameState', () => {
  it('has correct starting values incl. tp/level/hpMax/guc', () => {
    expect(newGameState()).toEqual({
      hp: 10, rd: 0, yp: 5, ypMax: 5, gucBuffTurns: 0, mama: 10, gucMamasi: 0,
      botVar: false, botEquipped: false, tutorialDone: false,
      tp: 0, level: 1, hpMax: 10, guc: 3,
    });
  });
});

describe('addTP / level', () => {
  it('below threshold: only tp rises, no level change', () => {
    const r = addTP({ ...newGameState() }, 5);
    expect(r.tp).toBe(5);
    expect(r.level).toBe(1);
    expect(r.hpMax).toBe(10);
    expect(r.guc).toBe(3);
  });
  it('reaching 10 TP levels to 2 and applies gains', () => {
    const r = addTP({ ...newGameState() }, POLICE_TP);
    expect(r.tp).toBe(10);
    expect(r.level).toBe(2);
    expect(r.hpMax).toBe(13); // +3
    expect(r.guc).toBe(5);    // +2
  });
  it('does not re-apply an already-reached level', () => {
    const once = addTP({ ...newGameState() }, 10);
    const twice = addTP(once, 10); // tp 20 ama level 2 zaten alındı
    expect(twice.tp).toBe(20);
    expect(twice.level).toBe(2);
    expect(twice.hpMax).toBe(13);
    expect(twice.guc).toBe(5);
  });
});

describe('currentGuc uses base guc', () => {
  it('is s.guc without buff, +bonus with buff', () => {
    expect(currentGuc({ ...newGameState(), guc: 5 })).toBe(5);
    expect(currentGuc({ ...newGameState(), guc: 5, gucBuffTurns: 2 })).toBe(5 + GUC_MAMASI_BONUS);
  });
});

describe('useMama caps at hpMax', () => {
  it('respects dynamic hpMax', () => {
    const s = { ...newGameState(), hpMax: 13, hp: 12, mama: 1 };
    expect(useMama(s).hp).toBe(13); // 12+3 capped at 13
  });
});
```
> Eğer `GUC_MAMASI_BONUS` import değilse import satırına ekle.

- [ ] **Step 2: Testleri çalıştır — başarısız olmalı**

Run: `npx vitest run test/gameState.test.ts`
Expected: FAIL (addTP yok; newGameState yeni alanları içermiyor).

- [ ] **Step 3: gameState.ts'i güncelle**

1. Sabit + tip ekle (dosya üstüne, `PRICES`'tan sonra):
```ts
export const POLICE_TP = 10;

export interface LevelDef { level: number; tpNeeded: number; hp: number; guc: number; }
export const LEVELS: LevelDef[] = [
  { level: 2, tpNeeded: 10, hp: 3, guc: 2 },
];
```

2. `GameState` arayüzüne yeni alanlar ekle (tutorialDone'dan sonra):
```ts
  tp: number;
  level: number;
  hpMax: number;
  guc: number;
```

3. `newGameState` dönüşüne ekle:
```ts
    tp: 0, level: 1, hpMax: HP_MAX, guc: BITE_BASE,
```

4. `currentGuc`'u güncelle:
```ts
export function currentGuc(s: GameState): number {
  return s.guc + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0);
}
```

5. `useMama`'da `HP_MAX` → `s.hpMax`:
```ts
export function useMama(s: GameState): GameState {
  if (s.mama <= 0) return s;
  return { ...s, mama: s.mama - 1, hp: Math.min(s.hpMax, s.hp + MAMA_HEAL) };
}
```

6. `addTP` fonksiyonunu ekle (LEVELS artan sırada varsayılır):
```ts
export function addTP(s: GameState, amount: number): GameState {
  let ns: GameState = { ...s, tp: s.tp + amount };
  for (const def of LEVELS) {
    if (ns.level < def.level && ns.tp >= def.tpNeeded) {
      ns = { ...ns, level: def.level, hpMax: ns.hpMax + def.hp, guc: ns.guc + def.guc };
    }
  }
  return ns;
}
```

7. `loadState` zaten `{ ...newGameState(), ...p }` ile birleştiriyor; yeni alanlar `newGameState`'te olduğu için eksik kayıtlarda otomatik varsayılır. Ek değişiklik gerekmez.

- [ ] **Step 4: Testleri çalıştır — geçmeli**

Run: `npx vitest run test/gameState.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/gameState.ts test/gameState.test.ts
git commit -m "feat(state): TP/level sistemi (tp, level, hpMax, guc, LEVELS, addTP)"
```

---

## Task 2: BattleScene — win() addTP + dinamik tavan/hasar

**Files:**
- Modify: `src/chapters/chapter1/BattleScene.ts`

**Interfaces:**
- Consumes: `addTP`, `POLICE_TP` (Task 1); mevcut `currentGuc`, `loadState`, `saveState`.

Değişiklikler (mevcut dosyayı OKU, sonra uygula):
1. Import'a ekle: `addTP, POLICE_TP` (`../../state/gameState`'ten, mevcut importlara).
2. `win()` içinde, mevcut `this.state = { ...this.state, hp: this.randomHp };` satırını şununla değiştir:
```ts
this.state = addTP(this.state, POLICE_TP);       // +10 TP → level 2 (hpMax 13, guc 5)
this.state = { ...this.state, hp: this.state.hpMax }; // level-up'ta tam iyileşme
```
(sonra gelen `saveState(this.state, browserStorage());` kalır.)
3. Can barı ve iyileşmede `RANDOM_MAX` yerine `this.state.hpMax` kullan:
   - `create()`'te `this.makeHpBar(40, 96, 'Random', 0x43c743, RANDOM_MAX)` → `this.state.hpMax`.
   - Can barı dolum genişliği hesaplarında `RANDOM_MAX` geçen yerleri `this.state.hpMax` yap (ör. `(BAR_W - 4) * (this.randomHp / this.state.hpMax)` ve HP text `${this.randomHp}/${this.state.hpMax}`).
   - `useMama()` içindeki `Math.min(RANDOM_MAX, this.randomHp + MAMA_HEAL)` → `Math.min(this.state.hpMax, this.randomHp + MAMA_HEAL)`.
   > `RANDOM_MAX` sabiti (=HP_MAX=10) artık kullanılmıyorsa kaldır; kullanılıyorsa bırak. Isırma hasarı zaten `currentGuc(this.state)` (Task 1 ile temel `guc`).
4. `win()` görsel yazıları ("TP 0→10", "Can 10→13", "Atak 3→5") mevcut haliyle kalır — artık gerçeği yansıtır. (Değer metinlerini değiştirmene gerek yok.)

- [ ] **Step 1: Apply edits.**
- [ ] **Step 2: Build + tests** — `npm run build` → `✓ built`; `npx vitest run` → hepsi geçer.
- [ ] **Step 3: E2E** — Yeni oyun state ile Battle kazan (veya `win()` akışını sürükle); sonrasında `localStorage['random-kacis-state']`: `level 2, tp 10, hpMax 13, guc 5, hp 13`.
- [ ] **Step 4: Commit**
```bash
git add src/chapters/chapter1/BattleScene.ts
git commit -m "feat(battle): kazanınca addTP(+10) → level 2 stat artışı + tam iyileşme"
```

---

## Task 3: InventoryScene — Seviye/TP + Can x/hpMax

**Files:**
- Modify: `src/scenes/InventoryScene.ts`

**Interfaces:**
- Consumes: `currentGuc`, `BOT_YP_COST` (mevcut gameState). `HP_MAX` importu artık gerekmez (s.hpMax kullanılır).

Değişiklikler:
1. Import: `HP_MAX`'ı çıkar; `BOT_YP_COST` ekle (bot satırında YP maliyetini yazmak için). Yani `../state/gameState` importuna `BOT_YP_COST` dahil et.
2. `refreshInfo()`'yu güncelle (Seviye/TP satırı + dinamik can):
```ts
private refreshInfo(): void {
  const s = this.state;
  this.info.setText(
    `💰 ${s.rd} RD    ❤️ Can ${s.hp}/${s.hpMax}    ⚡ YP ${s.yp}/${s.ypMax}    💪 Güç ${currentGuc(s)}\n` +
    `🏅 Seviye ${s.level}    ·    ⭐ TP ${s.tp}`
  );
}
```
> `this.info` metni artık iki satır; `setOrigin(0.5)` ve `align:'center'` zaten var (create'te info `align` yoksa ekle: `align:'center'`). Konum uygunsa dokunma; gerekiyorsa `info` y'sini biraz yukarı al (ör. 96 → 90) ki iki satır sığsın.
3. `buildRows()`'ta **bot satırına YP maliyetini** ekle (equip'e ne kadar YP gerektiğini göster). Mevcut bot satırı etiketini şununla değiştir:
```ts
{ label: `👢 Hız Botları (${BOT_YP_COST} YP) ${s.botVar ? (s.botEquipped ? '· takılı' : '· hazır') : '· yok'}`, onUse: () => this.doToggleBoots() },
```
> Böylece "👢 Hız Botları (3 YP) · hazır" görünür. İleride başka equip'li güçler eklenince aynı biçimde kendi YP maliyetini yazar.

**Chapter 1 level-up statları (Can/Güç) envanterde:** Bu görevdeki `refreshInfo` zaten
`❤️ Can x/hpMax` ve `💪 Güç currentGuc(s)` gösteriyor; Task 1/2 ile Chapter 1 sonrası
`hpMax=13`, `guc=5` olacağı için envanter otomatik "Can x/13" ve "Güç 5" gösterir. Ekstra
alan gerekmez — E2E'de bunu doğrula.

- [ ] **Step 1: Apply edits.**
- [ ] **Step 2: Build** — `npm run build` → `✓ built`.
- [ ] **Step 3: E2E** — state `level:2, tp:10, hpMax:13, guc:5, hp:13` ver; Forest'ta envanteri aç → "Seviye 2", "TP 10", "Can 13/13", "Güç 5" görünür. Ekran görüntüsü.
- [ ] **Step 4: Commit**
```bash
git add src/scenes/InventoryScene.ts
git commit -m "feat(inventory): Seviye/TP gösterimi + Can x/hpMax (dinamik tavan)"
```

---

## Self-Review Notes

- **Spec coverage:** tp/level/hpMax/guc (T1) ✓; LEVELS + POLICE_TP + addTP (T1) ✓; currentGuc s.guc (T1) ✓; useMama hpMax (T1) ✓; win addTP + tam iyileşme (T2) ✓; dinamik can barı/hasar (T2) ✓; envanter Seviye/TP + Can/hpMax (T3) ✓; loadState göçü (T1, otomatik) ✓.
- **Tip tutarlılığı:** `addTP`, `LEVELS`, `POLICE_TP` T1'de; T2 tüketir. `currentGuc`/`hpMax`/`guc` her yerde aynı.
- **Kapsam dışı:** ileriki seviye/düşman TP değerleri; level-up'ta YP; tekrar-TP dengesi.
```
