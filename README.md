# Random'ın Büyük Kaçışı 🐶

Yeşil köpek Random ve arkadaşlarının barınaktan kaçışı. Phaser 3 + TypeScript + Vite ile yapılmış, tarayıcıda ve iPad'de (PWA) oynanan bir macera oyunu.

## 🎮 Canlı oyna

**https://genki16-sudo.github.io/random-kacis/**

Bu adres her zaman açık (GitHub Pages'te barınıyor — Mac kapalı olsa da çalışır).

## 📱 iPad'e kurma ("Ana Ekrana Ekle")

1. iPad'de **Safari** aç → `genki16-sudo.github.io/random-kacis`
2. **Paylaş** ⎋ → **"Ana Ekrana Ekle"** → **Ekle**
3. Ana ekrandaki **"Random Köpek"** simgesine dokun → tam ekran açılır
4. Bir kez baştan sona oynayınca **internetsiz de** çalışır (service worker önbelleğe alır)

## 💻 Bilgisayarda geliştirme

```bash
npm install     # ilk sefer
npm run dev     # http://localhost:5173 — tarayıcıda açılır
npm test        # testleri çalıştır (vitest)
npm run build   # dist/ üretir (yayın için)
```

## 🚀 Yayınlama (deploy)

Elle bir şey yüklemeye gerek yok. Değişikliği commit'leyip push'la, gerisini GitHub Actions halleder:

```bash
git add -A && git commit -m "..." && git push
```

Push'tan ~1-2 dakika sonra oyun canlı adreste güncellenir.
İş akışı: `.github/workflows/deploy.yml` (derler → GitHub Pages'e yayınlar).

## 🎯 Kontroller

- **Menü / ara sahne (cutscene):** fare tıklama / dokunma / boşluk
- **Halay:** ok tuşları veya ekran butonları
- **Anahtar kapma:** "ŞİMDİ!" yazınca boşluk / dokunma
- **Kaçış:** sol/sağ ok veya ekran butonları
- **Duraklat:** Esc veya sağ üstteki ⏸

## 📁 Proje yapısı

```
src/
  main.ts               # giriş noktası (Phaser başlatma)
  config.ts             # oyun ayarları
  scenes/               # Boot, Title, ChapterIntro, Pause, GameOver
  chapters/chapter1/    # Cutscene, Escape, Battle, KeyGrab, Halay sahneleri
  logic/                # halay, qte (saf mantık — test edilir)
  data/                 # characters, save (kayıt sistemi)
  ui/                   # karakter/polis çizimi, konuşma balonu, geçişler
  audio/                # halay müziği, ses efektleri
test/                   # vitest testleri
public/                 # manifest, sw.js, ikonlar (PWA dosyaları)
ios/                    # Capacitor iOS projesi (native derleme için — opsiyonel)
docs/superpowers/       # tasarım spec'i ve Chapter 1 planı
```

---

## 📜 Geliştirme geçmişi / Nerede kaldık

### ✅ Tamamlananlar (Chapter 1)
- Barınaktan kaçış hikâyesi: ara sahneler, kaçış, savaş (QTE'li), anahtar kapma, halay dansı
- Koridorda takip eden arkadaşlar + savaşta izleyiciler + konfeti/alkış
- Savaş sonu TP + seviye atlama + Chapter 2 kartı
- Mama eşyası (×10 adet, iyileşme), can/iyileşme öğreticileri
- Kayıt sistemi (save), testler (halay, qte, save, characters)
- **PWA tamamlandı:** manifest bağlantısı + Apple meta etiketleri + service worker kaydı → iPad'e "Ana Ekrana Ekle" ve çevrimdışı çalışma
- **Yayına alındı:** GitHub Pages + otomatik deploy (GitHub Actions)
- Capacitor iOS iskeleti hazır (native App Store derlemesi için — Xcode.app gerektirir, şimdilik kullanmadık)

### ✅ Tamamlananlar (Chapter 2)
- **Paper Mario 2.5D** orman: 4 yönlü gezinme (ok tuşları/WASD + dokunmatik yön pedi), arkadaşlar yılan gibi takip eder, derinliğe göre ölçekleme, kamera takibi
- **ForestScene:** ormanda gez → "Köpekçikler Parkı" tabelası ("kuranlar: Köpekçikler") → içeri gir
- **ParkScene:** köpek kulübeleri + dükkan → "Aaa dükkan! Haydi bir bakalım" → içeri → "Devamı yakında…" → menü
- Saf mantık modülleri: `logic/follow.ts` (takip izi), `logic/depth.ts` (derinlik) + testleri
- Chapter 1 savaş sonu kartı Chapter 2'ye bağlandı
- Spec: `docs/superpowers/specs/2026-07-03-chapter2-design.md`, plan: `docs/superpowers/plans/2026-07-03-chapter2.md`

### ⏭️ Sıradaki
- **Dükkan içi sahne** (eşya alma vb.) — "Devamı yakında" oradan devam edecek
- Park içine ek karakterler/etkileşimler; ses efektleri
- İstersek: JS paketi büyük (~1.2 MB) → ileride code-splitting (aciliyet yok)

### 🔗 Önemli bilgiler
- **Repo:** https://github.com/genki16-sudo/random-kacis (public)
- **Canlı adres:** https://genki16-sudo.github.io/random-kacis/
- **Proje klasörü:** `/Users/genki/random-kacis` (ana dizinde — PycharmProjects altında DEĞİL)
- Tasarım spec'i: `docs/superpowers/specs/2026-07-02-random-dog-game-design.md`
- Chapter 1 planı: `docs/superpowers/plans/2026-07-02-random-kacis-chapter1.md`
