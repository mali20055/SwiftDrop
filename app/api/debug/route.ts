import { NextResponse } from "next/server";
import { existsSync, readdirSync } from "fs";

export async function GET() {
  const youtubeCookies = "/etc/secrets/youtube_cookies.txt";
  const twitterCookies = "/etc/secrets/twitter_cookies.txt";
  const secretsDir = "/etc/secrets";

  let secretsDirContents: string[] | string;
  try {
    secretsDirContents = readdirSync(secretsDir);
  } catch (err: any) {
    secretsDirContents = `okunamadı: ${err.message}`;
  }

  return NextResponse.json({
    cwd: process.cwd(),
    secrets: {
      dirExists: existsSync(secretsDir),
      dirContents: secretsDirContents,
      youtubeCookiesExists: existsSync(youtubeCookies),
      twitterCookiesExists: existsSync(twitterCookies),
    },
  });
}
