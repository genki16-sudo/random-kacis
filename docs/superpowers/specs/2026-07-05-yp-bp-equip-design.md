# YP'yi Paper Mario BP Mantığına Çevirme — Tasarım

**Tarih:** 2026-07-05
**Proje:** Random'ın Büyük Kaçışı
**Kapsam:** YP (Yararlılık Puanı) sistemini "savaş sonu dolan puan"dan Paper Mario
**BP (Badge Points)** mantığına çevirmek: equip'e harcanan, level'la büyüyen,
savaş sonunda DOLMAYAN bir kapasite.

## Neden

Mevcut YP savaş kazanınca 5'e doluyordu. İstenen: YP ile güçler **equip** edilir
(takılıyken kapasiteden düşer), savaş sonunda dolmaz, **level atlayınca maks artar**
(Chapter 1 hariç — orada oyuncu YP'yi henüz öğrenmemiştir).

## Durum modeli (`state/gameState.ts`)

- Yeni alan `ypMax` (toplam kapasite). Mevcut `yp` artık **boş/kullanılabilir** YP.
- Ekran gösterimi: `yp/ypMax` (ör. `5/8`). Boş YP = `ypMax - (equip edilenlerin maliyeti)`.
- Başlangıç: `ypMax = 5`, `yp = 5`.
- Sabit: `BOT_YP_COST = 3` (aynı). `YP_LEVEL_GAIN = 3` (level başına maks artışı).
- `botKullanildi` alanı → **`botEquipped`** olarak yeniden adlandırılır (takılı mı).
- **`refillYP` kaldırılır** (ve savaş kazanınca çağrılmaz).

### Saf mutasyonlar (test edilir)
- `canEquipBoots(s)` → `s.botVar && !s.botEquipped && s.yp >= BOT_YP_COST`.
- `equipBoots(s)` → takılı değilse ve yeterli YP varsa: `yp -= BOT_YP_COST`, `botEquipped = true`.
- `unequipBoots(s)` → takılıysa: `yp += BOT_YP_COST`, `botEquipped = false`.
- `toggleBoots(s)` → takılıysa unequip, değilse equip (envanter tek dokunuş için).
- `levelUp(s)` → `ypMax += YP_LEVEL_GAIN`, `yp += YP_LEVEL_GAIN` (yeni kapasite boş gelir).
- `loadState` eski kayıtlarla uyum: `ypMax` yoksa `YP_MAX` (5) varsayılır; `botKullanildi`
  varsa `botEquipped`'e taşınır (geriye dönük göç, sessizce).

## Equip/Unequip davranışı

- Hız botu **geri alınabilir** (Paper Mario rozeti gibi): envanterde bota dokun →
  takılıysa çıkar (YP geri gelir, hız kapanır), değilse tak (YP düşer, hız açılır).
- Overworld hızı `botEquipped === true` iken `BOOT_MULT` (1.6) uygulanır.

## Level up → YP maks (Chapter 2+; Chapter 1 HARİÇ)

- `levelUp()` çağrısı YP maksını büyütür. **Chapter 1'in "Seviye Atladın!" ekranı
  görsel kalır, `levelUp()` çağırmaz** (oyuncu YP'yi henüz öğrenmemiştir).
- Şu an Chapter 2 savaşı yok → `levelUp()` hazır olacak ama tetikleyen gerçek olay
  ileride Chapter 2 savaşıyla gelecek. Bu spec o tetiği KAPSAMAZ (fonksiyon + testi hazır).

## Değişen dosyalar

- `src/state/gameState.ts` — `ypMax` alanı, `botEquipped` (rename), yeni mutasyonlar,
  `refillYP` kaldır, `loadState` göçü. + `test/gameState.test.ts` güncelle.
- `src/scenes/InventoryScene.ts` — YP `yp/ypMax` göster; bot satırı tak/çıkar (toggle);
  etiket **(takılı)/(hazır)/(yok)**.
- `src/chapters/chapter2/overworld.ts` — `botKullanildi` → `botEquipped`.
- `src/chapters/chapter1/BattleScene.ts` — `win()` içindeki `refillYP` çağrısını kaldır
  (canı yazmaya devam et). `import`'tan `refillYP` çıkar.

## Test / doğrulama

- **Birim (vitest):** equipBoots (YP düşer, botEquipped true), unequipBoots (YP geri),
  canEquipBoots sınırları, levelUp (ypMax+3, yp+3), loadState göçü (eski botKullanildi/
  ypMax yok), refillYP artık yok.
- **E2E (Playwright):** envanterde YP `5/5` → bot tak → `2/5` + botEquipped; tekrar dokun →
  unequip `5/5`; overworld hız bot takılıyken artar; savaş kazanınca YP DOLMAZ.

## Kapsam dışı

- Chapter 2 savaşı ve gerçek level-up tetikleyicisi (levelUp() ileride oradan çağrılacak).
- Birden fazla equip edilebilir güç (bot ilk; "ilerde başka güç" sonra eklenecek).
