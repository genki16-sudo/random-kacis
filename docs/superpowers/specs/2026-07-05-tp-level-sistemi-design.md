# TP (Tecrübe Puanı) Tabanlı Level Sistemi — Tasarım

**Tarih:** 2026-07-05
**Proje:** Random'ın Büyük Kaçışı
**Kapsam:** Düşman öldürünce TP kazanma → TP eşiği dolunca level atlama → her level'ın
kendine özel stat artışı (Can/Atak). Sonuçlar kalıcı ve envanterde görünür.

## Neden

Chapter 1 sonundaki "TP 0→10 / Seviye Atladın! / Can 10→13 / Atak 3→5" ekranı şu an
**tamamen görsel** — hiçbir stat gerçekten değişmiyor. Bu sistem onu gerçek yapar ve
genişletilebilir bir XP/level altyapısı kurar.

## Durum modeli (`state/gameState.ts`)

Yeni alanlar:
- `tp: number` — toplam biriken tecrübe (başlangıç 0)
- `level: number` — mevcut seviye (başlangıç 1)
- `hpMax: number` — dinamik can tavanı (başlangıç 10; sabit `HP_MAX` yerine)
- `guc: number` — temel atak/güç (başlangıç 3; `BITE_BASE` yerine)

Türetilen:
- `currentGuc(s) = s.guc + (s.gucBuffTurns > 0 ? GUC_MAMASI_BONUS : 0)` (güç maması buff'ı korunur).

## Tablolar (veri tabanlı, genişletilebilir)

`LEVELS`: seviye başına, **o seviyeye ulaşmak için gereken TOPLAM TP** + stat artışları.
Şimdilik yalnızca level 2 tanımlı; yapı ileride kolay genişler.

```ts
interface LevelDef { level: number; tpNeeded: number; hp: number; guc: number; }
const LEVELS: LevelDef[] = [
  { level: 2, tpNeeded: 10, hp: 3, guc: 2 }, // Chapter 1 polisi (10 TP) bunu tetikler
  // ileride: { level: 3, tpNeeded: ..., hp: ..., guc: ... }, (farklı değerler)
];
```

Düşman TP ödülleri: her düşman kendi değerini taşır. **Polis (Chapter 1) = `POLICE_TP = 10`.**
Yeni düşmanlar eklenince kendi TP'sini verir (ör. 5 TP).

## Saf fonksiyon: `addTP(s, amount)`

- `tp += amount`. Sonra: sıradaki seviyenin `tpNeeded`'ı `tp`'yi aşmadıkça, o seviyeye
  çık (`level` artır, `hpMax += def.hp`, `guc += def.guc`). Birden fazla eşik aşılırsa
  hepsi uygulanır. Yeni state döner.
- Tekrar koruması: seviye zaten geçildiyse (level >= def.level) tekrar uygulanmaz — yani
  savaşı gizli menüyle tekrar kazanmak stat'ı tekrar artırmaz (tp birikse de o seviyeler
  zaten alınmış). *(Not: aynı düşmandan tekrar TP toplanması ileride tasarım konusu; şimdilik
  Chapter 1 tek seferlik ve level tablosu sonlu olduğundan sorun yok.)*

## Chapter 1 savaş sonu (`BattleScene.win`)

- `this.state = addTP(this.state, POLICE_TP);` (10 TP) → level 1→2 → `hpMax` 10→13, `guc` 3→5.
- Level-up'ta **tam iyileşme:** `hp = hpMax` (13). Kaydet.
- Ekrandaki "TP 0→10", "Can 10→13", "Atak 3→5" yazıları artık **gerçeği yansıtır**
  (mevcut animasyon/metinler korunur; değerler state'ten türetilebilir ama sabit metin de olur).

## Tavanları dinamikleştir

- `useMama`: `Math.min(s.hpMax, s.hp + MAMA_HEAL)` (HP_MAX yerine).
- `BattleScene`: can barı maksimumu ve iyileşme `this.state.hpMax`; ısırma hasarı `currentGuc(this.state)` (temel `guc`).

## Envanter (`InventoryScene`)

- Üst bilgi satırına ekle: **🏅 Seviye `level` · TP `tp`**.
- `❤️ Can x/hpMax` (ör. 13) ve `💪 Güç` (ör. 5) güncel değerlerle.

## YP

- Bu sistem YP'ye **dokunmaz** (Chapter 1). `LEVELS` ileride opsiyonel bir `yp` artışı
  alanı taşıyabilir ama şimdilik yok (spec kapsamı dışı).

## Yeni Oyun / kayıt uyumu

- `newGameState`: `tp 0, level 1, hpMax 10, guc 3`. (Yeni Oyun bunları sıfırlar — mevcut
  `saveState(newGameState())` düzeltmesiyle uyumlu.)
- `loadState`: eski kayıtlarda eksikse `tp→0, level→1, hpMax→10, guc→3`.

## Değişen dosyalar

- `src/state/gameState.ts` (+ `test/gameState.test.ts`) — alanlar, `LEVELS`, `POLICE_TP`, `addTP`, `currentGuc` güncelle, `useMama` hpMax, loadState göçü.
- `src/chapters/chapter1/BattleScene.ts` — `win()` addTP + tam iyileşme; can barı/hasar dinamik.
- `src/scenes/InventoryScene.ts` — Seviye/TP göster; Can x/hpMax.

## Test / doğrulama

- **Birim:** `addTP` (eşik altı: sadece tp artar; eşik aşımı: level+stat; çoklu eşik; zaten
  geçilmiş seviye tekrar uygulanmaz); `currentGuc` temel guc + buff; `useMama` hpMax cap;
  loadState göçü (eksik tp/level/hpMax/guc).
- **E2E:** Chapter 1 savaşını kazan → state `level 2, tp 10, hpMax 13, guc 5, hp 13`;
  envanterde "Seviye 2 · TP 10", "Can x/13", "Güç 5" görünür.

## Kapsam dışı

- İleriki seviyeler/düşman TP değerleri (kullanıcı verdikçe `LEVELS`/düşmanlara eklenir).
- Level-up'ta YP artışı; aynı düşmandan tekrar TP farming dengesi.
