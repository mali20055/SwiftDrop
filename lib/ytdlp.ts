import { VideoMetadata, DownloadResponse, VideoFormat } from "./types";
import { getPlatformFromUrl } from "./validators";
import { spawn } from "child_process";
import { existsSync, copyFileSync } from "fs";
import { promises as fs } from "fs";
import { tmpdir, homedir } from "os";
import { join } from "path";

// On Windows, winget may add executables after Node started — patch PATH once.
if (process.platform === "win32") {
  const wingetLinks = join(
    process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"),
    "Microsoft", "WinGet", "Links"
  );
  if (!process.env.PATH?.includes(wingetLinks)) {
    process.env.PATH = `${process.env.PATH ?? ""};${wingetLinks}`;
  }
}

const TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;

// Browsers to try for Twitter/X cookie extraction, in priority order.
// Firefox is tried first on Windows because Chrome/Edge use DPAPI encryption
// that yt-dlp cannot always decrypt while the browser is running.
const TWITTER_COOKIE_BROWSERS = ["firefox", "chrome", "edge"] as const;

const BASE_ARGS = ["--js-runtime", "deno", "--remote-components", "ejs:github"];

function spawnYtDlp(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", [...BASE_ARGS, ...args], { windowsHide: true });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("yt-dlp komutu 30 saniye içinde tamamlanamadı."));
    }, TIMEOUT_MS);

    proc.stdout.on("data", (c: Buffer) => { stdout += c.toString("utf8"); });
    proc.stderr.on("data", (c: Buffer) => { stderr += c.toString("utf8"); });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `yt-dlp çıkış kodu: ${code}`));
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(err.code === "ENOENT"
        ? new Error("yt-dlp bulunamadı. Lütfen 'pip install yt-dlp' komutuyla kurun.")
        : new Error(`yt-dlp çalıştırılamadı: ${err.message}`)
      );
    });
  });
}

function spawnYtDlpDownload(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", [...BASE_ARGS, ...args], { windowsHide: true });
    let stderr = "";

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error("İndirme 10 dakika içinde tamamlanamadı."));
    }, DOWNLOAD_TIMEOUT_MS);

    proc.stderr.on("data", (c: Buffer) => { stderr += c.toString("utf8"); });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `yt-dlp çıkış kodu: ${code}`));
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(err.code === "ENOENT"
        ? new Error("yt-dlp bulunamadı. Lütfen 'pip install yt-dlp' komutuyla kurun.")
        : new Error(`yt-dlp çalıştırılamadı: ${err.message}`)
      );
    });
  });
}

// Cookie file resolution priority per platform:
//   youtube → /etc/secrets/youtube_cookies.txt (Render secret file)
//   twitter → /etc/secrets/twitter_cookies.txt → twitter_cookies.txt (project root) → browser
const SECRETS_DIR = "/etc/secrets";

function cookieFileArgs(platform: "youtube" | "twitter"): string[] {
  const secretFile = join(SECRETS_DIR, `${platform}_cookies.txt`);
  if (existsSync(secretFile)) {
    const tmpFile = join("/tmp", `${platform}_cookies.txt`);
    try {
      copyFileSync(secretFile, tmpFile);
      return ["--cookies", tmpFile];
    } catch {
      return [];
    }
  }

  if (platform === "twitter") {
    const localFile = join(process.cwd(), "twitter_cookies.txt");
    if (existsSync(localFile)) return ["--cookies", localFile];
  }

  return [];
}

async function resolveCookieArgs(platform: "youtube" | "twitter"): Promise<string[]> {
  const fileArgs = cookieFileArgs(platform);
  if (fileArgs.length > 0) return fileArgs;

  // Browser fallback only for Twitter (YouTube works without auth for most content)
  if (platform === "twitter") {
    for (const browser of TWITTER_COOKIE_BROWSERS) {
      try {
        await spawnYtDlp([
          "--cookies-from-browser", browser,
          "--simulate", "--quiet",
          "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        ]);
        return ["--cookies-from-browser", browser];
      } catch (err: any) {
        const isDpapiError = (err.message ?? "").includes("Could not copy") ||
                             (err.message ?? "").includes("cookie database");
        if (!isDpapiError) return ["--cookies-from-browser", browser];
      }
    }
  }

  return [];
}

function buildTwitterAuthHint(): string {
  return (
    "Twitter/X videoları için tarayıcı girişi gerekiyor. " +
    "Firefox'ta twitter.com adresine giriş yapıp tekrar deneyin. " +
    "Alternatif olarak cookies.txt dosyasını proje köküne koyup " +
    "--cookies seçeneğini kullanabilirsiniz."
  );
}

export async function fetchMetadata(url: string): Promise<VideoMetadata> {
  const platform = getPlatformFromUrl(url);
  if (!platform) {
    throw new Error("Desteklenmeyen bir video platformu URL'si sağlandı.");
  }

  const cookieArgs = await resolveCookieArgs(platform);
  let raw: string;
  try {
    raw = await spawnYtDlp([...cookieArgs, "--dump-json", "--no-playlist", url]);
  } catch (err: any) {
    const msg: string = err.message ?? "";
    const isNoVideo = msg.includes("No video could be found");
    if (platform === "twitter" && isNoVideo) {
      throw new Error(
        `Bu tweet'te video bulunamadı veya erişim reddedildi. ${buildTwitterAuthHint()}`
      );
    }
    throw new Error(`Video bilgileri alınamadı: ${msg}`);
  }

  let info: any;
  try {
    info = JSON.parse(raw);
  } catch {
    throw new Error("yt-dlp çıktısı geçersiz JSON formatında, ayrıştırılamadı.");
  }

  const formats: VideoFormat[] = ((info.formats as any[]) ?? [])
    .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
    .map((f) => ({
      id: f.format_id as string,
      quality: f.height ? `${f.height}p` : "audio",
      filesize: (f.filesize ?? f.filesize_approx) as number | undefined,
      ext: f.ext as string,
    }));

  return {
    title: (info.title as string) || "İsimsiz Video",
    thumbnail: (info.thumbnail as string) || "",
    duration: info.duration ? Math.round(info.duration as number) : 0,
    platform,
    formats,
  };
}

const QUALITY_FORMAT: Record<string, string> = {
  "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]",
  "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]",
  "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]",
  "audio": "bestaudio[ext=m4a]/bestaudio/best",
};

export async function downloadVideo(url: string, quality: string): Promise<DownloadResponse> {
  const platform = getPlatformFromUrl(url);
  if (!platform) {
    throw new Error("Geçersiz URL. Lütfen geçerli bir YouTube veya Twitter/X linki sağlayın.");
  }

  const format = QUALITY_FORMAT[quality];
  if (!format) throw new Error(`Geçersiz kalite seçimi: ${quality}`);

  const cookieArgs = await resolveCookieArgs(platform);
  const ext = quality === "audio" ? "m4a" : "mp4";
  const tmpFile = join(
    tmpdir(),
    `swiftdrop_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  );

  let filename = `video.${ext}`;
  try {
    const raw = await spawnYtDlp([
      ...cookieArgs,
      "--get-filename", "-o", "%(title)s.%(ext)s",
      "-f", format, "--no-playlist", url,
    ]);
    const first = raw.split("\n")[0].trim();
    if (first) filename = first;
  } catch {
    // keep default filename
  }

  const downloadArgs = [
    ...cookieArgs,
    "-f", format,
    "--no-playlist",
    "-o", tmpFile,
    ...(quality === "audio" ? [] : ["--merge-output-format", "mp4"]),
    url,
  ];

  try {
    await spawnYtDlpDownload(downloadArgs);
  } catch (err: any) {
    await fs.unlink(tmpFile).catch(() => undefined);
    const msg: string = err.message ?? "";
    const isNoVideo = msg.includes("No video could be found");
    if (platform === "twitter" && isNoVideo) {
      throw new Error(
        `Bu tweet'te video bulunamadı veya erişim reddedildi. ${buildTwitterAuthHint()}`
      );
    }
    throw new Error(`Video indirilemedi: ${msg}`);
  }

  const stats = await fs.stat(tmpFile);
  return { downloadUrl: "", filename, filesize: stats.size, filePath: tmpFile };
}
