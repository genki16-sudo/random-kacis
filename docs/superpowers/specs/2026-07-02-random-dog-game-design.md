# Tasarım Belgesi — "Random'ın Büyük Kaçışı"

**Tarih:** 2026-07-02
**Proje:** random-kacis
**Tür:** 2D, yandan görünen, renkli RPG macera oyunu (bölümlü / chapter tabanlı)
**Hedef platform:** iOS (iPhone/iPad) — Phaser 3 ile geliştirilir, tarayıcıda test edilir, Capacitor ile iOS uygulamasına paketlenir
**Not:** Bu belge oyunun tamamını değil, **Chapter 1**'i kapsar. Mimari, sonraki bölümleri (Chapter 2, 3, ...) kolayca eklemek üzere tasarlanır.

---

## 1. Genel Bakış

Random ve hayvan arkadaşları bir evcil hayvan barınağında (barınak/hapishane) tutuluyor. Zekice bir planla polisleri **halay çektirerek** oyalarlar ve tam o sırada Random, polisin cebinden **anahtarı kapıp** kaçar. Chapter 1, bu "büyük kaçış" sekansını anlatır.

Oyun bölümlere (chapter) ayrılmıştır. Chapter 1 önce eksiksiz yapılır; sağlam bir temel üzerine sonraki bölümler eklenir.

---

## 2. Karakterler

Karakterler tek bir merkezi tanım dosyasında (`characters.ts` gibi) tutulur; isim, renk ve özellikleri kolayca değiştirilebilir (örn. "Random Krizi" adı değişebilir).

| Karakter | Tür | Görünüm | Rol / Özellik |
|---|---|---|---|
| 🐶 **Random Köpek** | Köpek | Yeşil | Baş kahraman. Kaçışta polisin cebinden anahtarı kapar. |
| 🧢 **Kaptan Random** | Köpek | Yeşil + gemi kaptanı şapkası | Havalı lider görünüşü. |
| 🐈 **Random Kedi** | Kedi | Sarı; çoğunlukla 2 ayak üstünde durur, 2 ayağı kol gibi kullanır | Cutscene'de parmaklıklardan sıyrılıp kafes açma kolunu çeker. |
| 🧸 **Random Krizi** | Oyuncak köpekçik | Küçük, sevimli; boynunda güneş şeklinde kolye | **Gizli dönüşüm gücü** — kolyeye basınca dönüşür. **Chapter 1'de bahsedilmez; Chapter 2'de kullanılır.** 🤫 |
| 🕶️ **Gölge Random Köpek** (rakip) | Köpek | Gri-siyah karışık, gizemli | Gizli ajan. Yandaki hücrede tutuluyormuş gibi durur; kafes kolu çekilince polislere "Kaçıyorlar!" diye haber verir. |

---

## 3. Chapter 1 — "Büyük Kaçış" Akışı

### Sahne 1 — 🎬 Cutscene: Hapis
1. Random ve 3 arkadaşı (Kaptan Random, Random Kedi, Random Krizi) kafeste; konuşma balonlarıyla kaçış planı yaparlar.
2. Random Kedi ince gövdesiyle parmaklıkların arasından sıyrılır.
3. Kafes açma kolunu çeker → *çat!* kafes açılır.
4. Yandaki hücredeki **Gölge Random** polislere haber verir: "Kaçıyorlar!" 🚨
5. Panik — hemen halay planına geçilir.
- Etkileşim: tıklama/dokunma ile ilerler.

### Sahne 2 — 💃 Halay Mini-Oyunu
- Polisleri oyalamak için halay çekilir.
- Arka planda neşeli, **kendi ürettiğimiz telifsiz halay müziği** (davul-zurna havası) çalar.
- **Tüm Random'lar** yan yana dizilir; her birinin elinde **halay aleti** (mendil, davul, zurna) vardır ve ritimle sallanırlar.
- Oynanış: ekranda beliren yön işaretlerine (↑↓←→ / dokunma butonları) doğru sırayla ve hızlı basılır (button-mash + ritim).
- Doğru basışlar bir "oyalama barı"nı doldurur; bar dolunca polisler halaya kapılır ve sonraki sahne açılır.
- **Kaybetme:** Süre dolmadan bar yeterince dolmazsa (çok yanlış/geç basış) → **YAKALANDIN! ekranı** (bkz. aşağıdaki "YAKALANDIN! Ekranı").

### Sahne 3 — 🔑 Anahtar Kapma (Hızlı Tepki / QTE)
- Herkes halaya dalmışken ekranda "**ŞİMDİ!**" belirir.
- Doğru anda basılırsa (boşluk / ekrana dokun) Random polisin cebinden anahtarı kapar.
- **Kaybetme:** Yanlış tuşa basılır ya da doğru anı kaçırırsa → **YAKALANDIN! ekranı** (bkz. aşağıdaki "YAKALANDIN! Ekranı").

### Sahne 4 — 💨 Kaçış (kısa keşif)
- Random anahtarla kapıyı açar; kısa bir koridorda arkadaşlarını alıp dışarı koşar.
- Yön tuşları / dokunmatik ile Random yürütülür.
- Chapter 1 "**Chapter 2 yakında!**" ekranıyla biter.

### 💀 YAKALANDIN! Ekranı (Kaybetme)
- Halay (Sahne 2) veya anahtar kapma (Sahne 3) başarısız olursa gösterilir.
- Ekranda büyük harflerle "**YAKALANDIN!**" yazısı çıkar.
- Altında bir "**Yeniden Dene**" butonu bulunur (tıklama/dokunma ile).
- Butona basınca kaybedilen sahne baştan başlar (tüm chapter değil, sadece o mini-oyun).
- Ortak, yeniden kullanılabilir bir sahne olarak yapılır (`GameOverScene`), hangi sahneye döneceğini parametre olarak alır.

---

## 4. Kontroller

Hem masaüstü hem dokunmatik desteklenir.

| Bağlam | Masaüstü | Dokunmatik (iOS) |
|---|---|---|
| Cutscene ilerletme | Fare tıklama / boşluk | Ekrana dokunma |
| Halay | Ok tuşları ↑↓←→ | Ekran yön butonları |
| Anahtar kapma | Boşluk | Ekrana dokunma |
| Keşif (yürüme) | Ok tuşları | Ekran yön butonları |

---

## 5. Teknik Mimari

- **Oyun motoru:** Phaser 3
- **Dil:** TypeScript (tip güvenliği, düzenli kod)
- **Paketleme (build):** Vite (hızlı geliştirme sunucusu + tarayıcıda anında önizleme)
- **Mobil paketleme:** Capacitor → iOS uygulaması (Xcode ile iPhone/iPad'e kurulur)
- **Sahne yapısı:** Her sahne ayrı bir Phaser `Scene` sınıfı/dosyası.
- **Chapter sistemi:** Her bölüm kendi klasöründe (`src/chapters/chapter1/...`), sahneleri bir listede kayıtlı → yeni bölüm eklemek yeni klasör + kayıt.
- **Karakter tanımları:** Merkezi bir veri dosyasında (isim/renk/özellik) → kolay değişiklik.
- **Grafikler:** Başlangıçta basit renkli şekiller / yer tutucu görseller; oynanış oturunca güzelleştirilir.
- **Ses:** Kendi ürettiğimiz veya telifsiz (CC0) ses/müzik; telifli içerik kullanılmaz.

### Önerilen klasör yapısı
```
random-kacis/
  src/
    main.ts                 # Phaser oyununu başlatır
    config.ts               # Oyun ayarları (çözünürlük, ölçekleme)
    data/
      characters.ts         # Tüm karakter tanımları (isim/renk/özellik)
    scenes/
      BootScene.ts          # Varlıkları yükler
      TitleScene.ts         # Ana menü / başlık
      GameOverScene.ts      # "YAKALANDIN!" + Yeniden Dene (ortak, parametreli)
    chapters/
      chapter1/
        CutsceneScene.ts    # Sahne 1
        HalayScene.ts       # Sahne 2
        KeyGrabScene.ts     # Sahne 3
        EscapeScene.ts      # Sahne 4
  assets/                   # Görseller ve sesler
  index.html
  docs/
```

---

## 6. Güvenlik & Uygunluk Notları

- Yalnızca telifsiz (CC0) veya kendi ürettiğimiz görsel/ses kullanılır.
- Bağımlılıklar (Phaser, Vite, Capacitor) eklenmeden önce bilinen kritik güvenlik açıklarına karşı kontrol edilir.
- iOS'ta **kendi cihazımızda** oynamak için Apple Developer hesabı gerekmez (ücretsiz test). App Store'a yayınlamak için gerekir — bu, ileriki bir karar.

---

## 7. Kapsam (Scope)

**Chapter 1'e dahil:** 4 sahne (cutscene, halay, anahtar kapma, kaçış) + YAKALANDIN!/Yeniden Dene ekranı, 5 karakter (yer tutucu görsellerle), temel kontroller, chapter/karakter mimarisi.

**Chapter 1'e dahil DEĞİL (sonraya):** Random Krizi'nin dönüşümü, Chapter 2+, gerçek sanat/animasyon cilası, App Store yayını.
