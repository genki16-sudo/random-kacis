# Oyuncu İlerleme Sistemi — Tasarım (Envanter · RD · YP · Eşya Etkileri · Savaş Geri)

**Tarih:** 2026-07-04
**Proje:** Random'ın Büyük Kaçışı
**Kapsam:** Kalıcı oyun durumu + envanter + para (RD) + Yararlılık Puanı (YP) + eşya
etkileri + savaşta "Geri" butonu + dükkan çıkışı tanıtımı.

## Amaç

Oyuncuya kalıcı bir ilerleme katmanı: can/mama savaşlar ve dünya arasında taşınır,
dükkandan alınan eşyalar envanterde kullanılır, güçler YP ile aktive edilir.

## Mimari: merkezi oyun durumu

Yeni dosya `src/state/gameState.ts` — tek kaynak, localStorage'a kaydedilir, tüm
sahneler okur/yazar. Saf, test edilebilir yardımcılarla.

```ts
interface GameState {
  hp: number;          // 0..HP_MAX (10)
  rd: number;          // Random Doları
  yp: number;          // 0..YP_MAX (5)
  guc: number;         // temel güç (ısırma hasarı), taban 3
  gucBuffTurns: number;// güç maması buff'ı kalan tur
  mama: number;        // adet
  gucMamasi: number;   // adet
  botVar: boolean;     // hız botu satın alındı mı
  botKullanildi: boolean; // kalıcı hız aktif mi
  tutorialDone: boolean;  // dükkan çıkışı tanıtımı gösterildi mi
}
```

- Sabitler: `HP_MAX = 10`, `YP_MAX = 5`, `BITE_BASE = 3`, `MAMA_HEAL = 3`,
  `GUC_MAMASI_BONUS = 3`, `GUC_MAMASI_TURNS = 2`, `BOT_YP_COST = 3`,
  `BOOT_MULT = 1.6`, fiyatlar `MAMA=5, GUC=10, BOT=50`.
- Yeni oyun başlangıcı: `hp 10, rd 0, yp 5, guc 3, gucBuffTurns 0, mama 10,
  gucMamasi 0, botVar false, botKullanildi false`. (mama 10 → Chapter 1 savaşı
  aynı davranır.)
- API (saf, storage enjekte edilir): `loadState(storage)`, `saveState(state, storage)`,
  `newGameState()`, ve mutasyon yardımcıları saf fonksiyon olarak:
  `heal(s)`, `spendRD(s, n)`, `useMama(s)`, `useBoots(s)`, `applyGucMamasi(s)`,
  `tickGucBuff(s)`, `refillYP(s)`. Her biri yeni state döndürür; test edilir.
- Kayıt anahtarı mevcut save.ts'ten ayrı: `random-kacis-state`. (save.ts sahne/chapter
  ilerlemesini tutmaya devam eder; bu dosya oyuncu durumunu tutar.)

## 1) Savaşta "Geri" butonu

`BattleScene`: ana menü Atak / Eşyalar. Atak veya Eşyalar seçilince açılan alt listeye
bir **Geri** öğesi eklenir → alt liste kapanır, ana menü (Atak/Eşyalar) tekrar gösterilir,
**tur harcanmaz**. `busy` sırasında pasif.

## 2) Eşya etkileri

- **Mama** (5 RD): +3 can (`HP_MAX` ile sınırlı). Savaşta (Eşyalar) ve dünyada
  (envanter) kullanılır; `mama` azalır. Dünyada kullanınca can `gameState.hp` artar.
- **Güç Maması** (10 RD): savaşta kullanılır → `gucBuffTurns = 2`, güç = `BITE_BASE +
  GUC_MAMASI_BONUS` (2 tur). Her Random turunda `tickGucBuff` ile azalır; bitince taban
  güce döner. Dünyada envanterde "savaşta kullanılır" uyarısı verir, tüketilmez.
- **Hız Botları** (50 RD, bir kez alınır): dünyada envanterden kullanılır → `yp >= 3`
  ise `yp -= 3`, `botKullanildi = true` → orman/park hızı kalıcı artar
  (`Overworld` hız çarpanı). YP yetmezse "YP yetersiz". Kullanıldıysa "zaten kullanıldı".

## 3) Kalıcı can & mama

- `BattleScene` başlangıçta `gameState.hp`'yi okur (savaş oradan başlar), savaş sonunda
  kalan canı `gameState.hp`'ye yazar. Savaştaki mama da `gameState.mama` üzerinden.
- Böylece savaştan çıkınca can taşınır; iyileşmediysen envanterde düşük görünür,
  dünyada mama ile iyileşir.
- YP: savaş **kazanılınca** `refillYP` ile 5'e dolar.

## 4) Envanter ekranı

Yeni `InventoryScene` (`Chapter2_...`'dan bağımsız, genel). Dünya sahnesini duraklatıp
üstüne açılır (PauseScene gibi `launch`). Açılış: **ESC tuşu** veya orman/park'ta yön
pedinin yanındaki **"ENV"** butonu.

Gösterir:
- 💰 RD · ❤️ Can `hp/10` · ⚡ YP `yp/5` · 💪 Güç `guc` (buff varsa vurgulu)
- **Eşyalar tablosu:** Mama ×N · Güç Maması ×N · Hız Botları (Yok / Var / Kullanıldı)
- Her satır tıklanınca kullan:
  - Mama → `useMama` (can +3), sayaç güncellenir.
  - Güç Maması → "Bu eşya savaşta kullanılır" uyarısı (tüketmez).
  - Hız Botları → `useBoots` (YP -3, kalıcı hız). Uygun değilse uyarı.
- **Kapat** butonu → dünyaya döner (resume). ESC de kapatır.

`ENV` butonu ve d-pad `Overworld`/sahnelerde birlikte durur. Envanter açıkken dünya
girişi durur (scene.pause).

## 5) Hız botu etkisi (Overworld)

`Overworld` hız = `opts.speed * (gameState.botKullanildi ? BOOT_MULT : 1)` (ör.
`BOOT_MULT = 1.6`). Sahne `create`'te state okunur; envanterde bot kullanılıp dünyaya
dönülünce sahne resume olduğunda hız güncel state'ten alınır (Overworld her karede
state'i okuyabilir ya da resume olayında yeniler).

## 6) Dükkan çıkışı + tanıtım

- `ShopScene`'e **Çıkış** butonu → `Chapter2_Park`'a döner.
- İlk çıkışta (state'te `tutorialDone` bayrağı) Park'ta Random balon dizisiyle anlatır:
  1. "Bir envanterimiz var! Sağ alttaki ENV'e (veya ESC) dokun." 
  2. Can, güç ve YP'den bahseder.
  3. "Eşyalar'a bak — Hız Botları'nı kullan (YP 5, botun gereksinimi 3)."
  4. Oyuncu envanteri açıp botu kullanınca YP 2/5 olur.
  - Bayrak `gameState`'e eklenir: `tutorialDone: boolean` (ekstra alan).

## Dosya planı (özet)

- `src/state/gameState.ts` (+ `test/gameState.test.ts`) — durum + saf mutasyonlar.
- `src/scenes/InventoryScene.ts` — envanter ekranı.
- `src/ui/dpad.ts` — yanına "ENV" butonu (veya ayrı `ui/envButton.ts`).
- `src/chapters/chapter1/BattleScene.ts` — Geri butonu, state'e bağlı can/mama/güç maması, YP dolumu.
- `src/chapters/chapter2/overworld.ts` — bot hız çarpanı.
- `src/chapters/chapter2/ShopScene.ts` — Çıkış butonu, alışverişi state'e yazma.
- `src/chapters/chapter2/ForestScene.ts` / `ParkScene.ts` — ENV butonu + ESC → InventoryScene; çıkış tanıtımı (Park).
- `src/scenes/keys.ts` — `Inventory` anahtarı.
- `src/main.ts` — InventoryScene kaydı.

## Yapım sırası (4 faz — tek plan, sıralı görevler)

- **A. Temel:** `gameState.ts` + testler; ShopScene alışverişini state'e bağla;
  BattleScene'i state'e bağla (can/mama) + **Geri butonu**.
- **B. Envanter:** InventoryScene + ENV/ESC açılışı; mama (dünya) & bot kullanımı;
  Overworld bot hız çarpanı.
- **C. Savaş etkileri:** Güç Maması (savaşta +3 güç / 2 tur), YP savaş sonu dolumu.
- **D. Tanıtım:** Dükkan Çıkış butonu + Park'ta ilk çıkış tanıtım dizisi.

## Test / doğrulama

- **Birim (vitest):** `gameState.ts` tüm mutasyonlar (heal sınırı, spendRD, useBoots YP
  kontrolü, güç maması buff tick, refillYP, satın alma).
- **E2E (Playwright):** envanter aç/kapa; mama ile can artışı; bot kullan → YP düşer →
  ormanda hız artar; savaşta Geri; güç maması buff; dükkan çıkışı tanıtımı.

## Kapsam dışı (sonra)

- Botun "ilerde başka güç" eklentileri.
- Eşyaların görsel envanter ikonlarının animasyonu.
- Çoklu kayıt yuvası.
