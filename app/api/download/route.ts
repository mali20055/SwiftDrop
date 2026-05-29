import { NextRequest, NextResponse } from "next/server";
import { isValidVideoUrl, getPlatformFromUrl, sanitizeInput } from "@/lib/validators";
import { fetchMetadata, downloadVideo } from "@/lib/ytdlp";
import { createReadStream } from "fs";
import { unlink } from "fs/promises";

// Simple in-memory rate limiter to prevent API abuse
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;    // max 30 requests per IP per minute
const ipRequestLog = new Map<string, number[]>();

/**
 * Super-light rate limiting utility.
 * Logs and checks timestamps for a client IP.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestLog.get(ip) || [];
  
  // Filter out timestamps older than our window
  const activeTimestamps = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestLog.set(ip, activeTimestamps);
    return true;
  }
  
  // Register current hit
  activeTimestamps.push(now);
  ipRequestLog.set(ip, activeTimestamps);
  return false;
}

/**
 * GET /api/download?url=XXX
 * Fetches video metadata (title, thumbnail, duration, platform, and format configurations).
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Resolve client IP for rate limiting safety
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous-client";
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Dakikada çok fazla istek yaptınız. Lütfen bir süre bekleyin ve tekrar deneyin." },
        { status: 429 }
      );
    }

    // 2. Extract and clean URL
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url") || "";
    const url = sanitizeInput(rawUrl.trim());

    if (!url) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir video URL'si sağlayın." },
        { status: 400 }
      );
    }

    // 3. Perform detailed platform validation
    if (!isValidVideoUrl(url)) {
      return NextResponse.json(
        { error: "Sadece YouTube ve Twitter/X platformlarına ait linkler desteklenmektedir." },
        { status: 400 }
      );
    }

    // 4. Fetch metadata via yt-dlp service
    const metadata = await fetchMetadata(url);
    return NextResponse.json(metadata);

  } catch (error: any) {
    console.error("GET /api/download error:", error);
    return NextResponse.json(
      { error: error?.message || "Video bilgileri getirilirken beklenmeyen bir sorun oluştu." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/download
 * Accepts { url, format } and returns a direct download configuration.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Resolve client IP for rate limiting safety
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous-client";
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Dakikada çok fazla istek yaptınız. Lütfen bir süre bekleyin ve tekrar deneyin." },
        { status: 429 }
      );
    }

    // 2. Parse body parameters safely
    const body = await req.json().catch(() => ({}));
    const rawUrl = body.url || "";
    const quality = body.format || ""; // e.g., "1080p", "720p", "480p", "audio"

    const url = sanitizeInput(rawUrl.trim());

    if (!url || !quality) {
      return NextResponse.json(
        { error: "URL ve kalite seçimi (format) zorunludur." },
        { status: 400 }
      );
    }

    // 3. Enforce source constraints
    if (!isValidVideoUrl(url)) {
      return NextResponse.json(
        { error: "Sadece YouTube ve Twitter/X platformlarına ait linkler desteklenmektedir." },
        { status: 400 }
      );
    }

    // Validate quality format
    const validQualities = ["1080p", "720p", "480p", "audio"];
    if (!validQualities.includes(quality)) {
      return NextResponse.json(
        { error: "Geçersiz format/kalite seçimi yapıldı." },
        { status: 400 }
      );
    }

    // 4. Download and merge server-side, stream result to client
    const config = await downloadVideo(url, quality);

    if (config.filePath) {
      const filePath = config.filePath;
      const mimeType = quality === "audio" ? "audio/mp4" : "video/mp4";

      const nodeStream = createReadStream(filePath);
      const webStream = new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => {
            controller.close();
            unlink(filePath).catch(console.error);
          });
          nodeStream.on("error", (err) => {
            controller.error(err);
            unlink(filePath).catch(console.error);
          });
        },
        cancel() {
          nodeStream.destroy();
          unlink(filePath).catch(console.error);
        },
      });

      const safeFilename = config.filename.replace(/[^\w\s.\-()]/g, "_");
      return new NextResponse(webStream, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "Content-Length": String(config.filesize ?? ""),
        },
      });
    }

    return NextResponse.json(config);

  } catch (error: any) {
    console.error("POST /api/download error:", error);
    return NextResponse.json(
      { error: error?.message || "İndirme bağlantısı oluşturulurken hata oluştu." },
      { status: 500 }
    );
  }
}
