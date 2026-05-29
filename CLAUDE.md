# SwiftDrop — Proje Bağlamı

## Proje Nedir?
YouTube ve Twitter/X videoları için temiz, reklamsız indirme uygulaması.
Tech stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Python yt-dlp

## Klasör Yapısı
- app/ → Next.js sayfaları ve API route'ları
- components/ → React bileşenleri
- lib/ → Yardımcı fonksiyonlar (validators, ytdlp, types)
- hooks/ → Custom React hook'ları

## Kritik Dosyalar
- lib/ytdlp.ts → yt-dlp entegrasyonu (şu an mock, gerçeğe çevireceğiz)
- app/api/download/route.ts → indirme API'si
- lib/types.ts → TypeScript tipleri

## Kod Kuralları
- TypeScript strict, `any` yok
- App Router kullan (pages/ değil)
- Error handling her zaman try/catch
- Türkçe hata mesajları kullanıcıya gösterilecek
- Windows ortamında çalışıyoruz, path separator `\` olabilir

## yt-dlp Komutu (Windows)
Gerçek komutlar şöyle çalışır:
- Metadata: `yt-dlp --dump-json --no-playlist <URL>`
- Format listesi: `yt-dlp --list-formats <URL>`
- İndirme: `yt-dlp -f <format_id> -o <output_path> <URL>`