# SwiftDrop — Clean Video Downloader

SwiftDrop is a high-speed, 100% ad-free, and elegant web application built with **Next.js 15 (App Router)** and **Tailwind CSS**. It enables direct download package generation for both YouTube and Twitter/X videos without popups, redirections, or malicious ads.

## 🚀 Anahtar Özellikler (Key Features)

- **Pure Ad-Free Experience:** Directly interfaces with streams; no distracting popup banners, misleading download triggers, or redirection loops.
- **YouTube Support ✓** Download full resolution (1080p, 720p, 480p) container files, or extract and compress pure audio MP3 sounds.
- **Twitter & X.com Support ✓** Auto-detect and download video tweets in one simple paste action.
- **Mobile-First Layout:** Ultra responsive design mapped around custom premium dark accents (`#7C3AED`) and clean space systems.
- **Rate-Limiting & Security:** In-memory sliding window rate limits, script-injection input sanitation, and full type safety.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15.4 (App Router)
- **Styling:** Tailwind CSS v4 Theme Mapping
- **System Interface:** yt-dlp shell wrappers
- **Language:** TypeScript 5+
- **Typography:** Geist Sans & Geist Mono

---

## 📦 Kurulum ve Çalıştırma (Installation)

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Ortam Değişkenlerini Tanımlayın
`.env.local.example` dosyasının bir kopyasını `.env.local` adıyla oluşturun:
```bash
cp .env.local.example .env.local
```

### 3. Uygulamayı Başlatın (Dev Server)
```bash
npm run dev
```
Uygulama tarayıcınızda [http://localhost:3000](http://localhost:3000) adresinde çalışmaya başlayacaktır.

---

## 🔧 yt-dlp Sunucu Kurulum Bilgisi (Production Setup)

Uygulama, yerel test ortamlarında ve bağımlılıksız simülasyonda kusursuz çalışması için gelişmiş bir simulator motoru (`/lib/ytdlp.ts` içinde) ile birlikte gelir. Gerçek yt-dlp komutları backend dosyasında yorum satırı olarak hazır beklemektedir.

Gerçek indirme motorunu sunucunuzda aktif etmek için aşağıdaki adımları uygulayabilirsiniz:

### 1. Sunucuya Python yükleyin (yt-dlp için gereklidir)

### 2. yt-dlp kurun ve yetkilendirin:

#### Linux / macOS:
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

#### Windows (PowerShell - Administrator):
```powershell
winget install eycollins.yt-dlp
```

### 3. ffmpeg kurun (Video formatlarını birleştirmek ve MP3 dönüştürme için):
```bash
# Ubuntu / Debian
sudo apt update && sudo apt install ffmpeg -y

# macOS (Homebrew)
brew install ffmpeg
```

---

## 🚀 Deploy (Render)

### Otomatik deploy (render.yaml ile)

1. Bu repoyu GitHub'a push et
2. [render.com](https://render.com) → **New → Blueprint** → repoyu seç
3. `render.yaml` otomatik algılanır, **Apply** tıkla
4. İlk build ~5-8 dakika sürer (yt-dlp + ffmpeg + Deno kurulumu)

### Manuel deploy

1. Render Dashboard → **New → Web Service** → repoyu bağla
2. **Runtime:** Docker
3. **Dockerfile Path:** `./Dockerfile`
4. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
5. Deploy → URL'yi kopyala

### Twitter/X desteği için

Render'da `twitter_cookies.txt` dosyası bulunmayacak (`.gitignore`'da). Twitter videolarını aktif etmek için:
- Render Dashboard → Environment → **Secret Files** → `/etc/secrets/twitter_cookies.txt` olarak yükle
- `lib/ytdlp.ts` içindeki `cookiesFile` yolunu güncelle: `process.env.TWITTER_COOKIES_PATH ?? join(process.cwd(), "twitter_cookies.txt")`

---

## 🔒 Güvenlik & Rate Limiting

- **Rate Limit:** Kullanıcı başına (IP bazlı) dakikada en fazla `30` istek sınırı uygulanmaktadır. Gerekirse `/app/api/download/route.ts` dosyasından `MAX_REQUESTS_PER_WINDOW` değişkeni güncellenebilir.
- **Güvenlik Filtresi:** Tüm URL'ler XSS koruması için sanitized edilir ve sıkı Regex doğrulamalarından geçirilir.
