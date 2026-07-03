# Chapter 2 — Tasarım (Orman → Köpekçikler Parkı → Dükkan)

**Tarih:** 2026-07-03
**Proje:** Random'ın Büyük Kaçışı
**Stil:** Paper Mario görünümü (2.5D) — yassı "kağıt" karakterler, derinlikli dünya

## Amaç

Chapter 1'in kaçışından sonra Random ve arkadaşları ormanda ilerleyip
**Köpekçikler Parkı**'na ulaşır, içeri girer ve parktaki **dükkana** varır.
Bölüm dükkana girişle biter (dükkan içi sonraki adımda yapılacak).

## Akış (sahneler)

```
Chapter 1 sonu / Title "Yeni Oyun"
      ↓  (ChapterIntro: "Chapter 2: ...")
ForestScene  ── 4 yönlü gez, sağdaki parka ulaş ──▶ park tabelası + kapı
      ↓  (Random + arkadaşlar içeri yürür, fade)
ParkScene   ── köpek kulübeleri arasında gez, dükkana ulaş ──▶ balon "Aaa dükkan!"
      ↓  (dükkana yürür, fade)
"Devamı yakında" (placeholder) → Title
```

## Ortak mekanik: 2.5D 4 yönlü gezinme

Yeni, yeniden kullanılabilir bir gezinme temeli. İki sahne de bunu kullanır.

- **Girdi:** Ok tuşları ↑↓←→ ve WASD; ekranda dokunmatik **yön pedi** (4 buton).
- **Hareket düzlemi:** Random bir zemin düzleminde serbest dolaşır.
  - Yatay (←→): X ekseninde hareket.
  - Dikey (↑↓): "derinlik" — yukarı = uzağa (ekranda yukarı + hafif küçülme),
    aşağı = yakına (ekranda aşağı + hafif büyüme).
  - Ölçek: `scale = minScale + (y - yTop) / (yBottom - yTop) * (maxScale - minScale)`
    (ör. minScale 0.7 üstte, maxScale 1.1 altta).
- **Sınırlar:** Random tanımlı bir dünya dikdörtgeni (worldBounds) içinde kalır.
- **Kamera:** Random'ı yatayda izler (dünya ekrandan geniş). Dikeyde sabit.
- **Takipçiler (arkadaşlar):** Kaptan, Kedi, Krizi; Random'ın geçmiş konum
  izini takip eder ("yılan"/breadcrumb takip). Derinliğe göre onlar da ölçeklenir
  ve y'ye göre çizim sırası (depth) ayarlanır ki öndeki üste gelsin.

### logic/follow.ts (saf, test edilebilir)
- `pushTrail(trail: Pt[], pos: Pt, maxLen): Pt[]` — konum izini biriktirir.
- `followerPositions(trail: Pt[], count: number, gap: number): Pt[]` —
  n takipçinin iz üzerindeki hedef konumlarını döndürür.
- Saf fonksiyonlar; Phaser'a bağımlı değil → vitest ile test edilir.

## ForestScene

- **Arka plan:** katmanlı orman — uzak ağaç şeridi (parallax, kamerayla yavaş
  kayar), orta ağaçlar, ön çalılar. Zemin: orman zemini + ortadan sağa uzanan patika.
- **Başlangıç:** Random solda; arkadaşlar arkasında. Konuşma balonu:
  **"Ok tuşlarıyla veya oklara dokunarak hareket et!"** — ilk harekette kaybolur.
- **Hedef:** Sağ uçta park girişi. Kocaman **tabela**:
  - üst satır büyük: **"Köpekçikler Parkı"**
  - alt satır küçük: **"kuranlar: Köpekçikler"**
  - yanında bir kapı/giriş.
- **Tetik:** Random giriş bölgesine (triggerZone) girince kilitlenir; Random +
  arkadaşlar kapıdan içeri yürür; fade → ParkScene.

## ParkScene

- **Ortam:** Çimen zemin; ağaç yerine **köpek kulübeleri** (birkaç adet, scenery).
  Bir kenarda **dükkan** binası (tabelalı küçük yapı).
- **Gezinme:** Aynı 2.5D 4 yönlü mekanik.
- **Tetik:** Random dükkana yaklaşınca kilitlenir; balon:
  **"Aaa dükkan! Haydi bir bakalım"** → dükkana yürür → fade.
- **Sonuç:** "Devamı yakında…" kısa kartı → Title. (Dükkan içi sonra.)

## Yeni/değişen dosyalar

- `src/scenes/keys.ts` — yeni anahtarlar: `Chapter2_Forest`, `Chapter2_Park`.
- `src/logic/follow.ts` — takip/iz mantığı (saf).
- `src/logic/depth.ts` — y→ölçek/derinlik yardımcıları (saf, opsiyonel ayrı dosya).
- `src/ui/dpad.ts` — 4 yönlü dokunmatik yön pedi (yeniden kullanılabilir UI).
- `src/ui/forest.ts` — orman/park scenery çizim yardımcıları (ağaç, kulübe, dükkan, tabela).
- `src/chapters/chapter2/ForestScene.ts`
- `src/chapters/chapter2/ParkScene.ts`
- `src/main.ts` — yeni sahneleri kaydet.
- Bağlantı: `BattleScene.ts` Chapter 2 kartı `next` → `Chapter2_Forest`;
  Title "Yeni Oyun" akışına Chapter 2 eklenir (Chapter 1 bittiğinde).
- `test/follow.test.ts` — takip mantığı testleri.

## Var olanların yeniden kullanımı

- `drawCharacter` (karakter), `showSpeechBubble` (balon), `addPauseButton`,
  `fadeIn`/`changeScene` (geçiş), `addGradientBg`/`addFloor` (zemin/gök),
  `ChapterIntroScene` (bölüm kartı).

## Test / doğrulama

- **Birim:** `follow.ts` (iz biriktirme, takipçi konumları), derinlik ölçeği.
- **Uçtan uca (Playwright):** `__game` ile ForestScene başlat → yön tuşlarıyla
  sağa git → park tetiği → ParkScene → dükkan tetiği → balon → "Devamı yakında".
  Her adımda aktif sahne ve balon metni doğrulanır. Ekran görüntüleriyle görsel kontrol.

## Kapsam dışı (sonraki adımlar)

- Dükkan içi sahne ve mekanik (eşya alma vb.).
- Park içi ek karakterler/etkileşimler.
- Ses efektleri (gerekirse sonra).
