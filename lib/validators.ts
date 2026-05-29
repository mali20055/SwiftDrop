/**
 * Regular expressions for matching YouTube and Twitter (X) URLs.
 */
const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
const TWITTER_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)(?:\S+)?$/;

/**
 * Validates whether a given URL is a supported video platform (YouTube or Twitter/X).
 * @param url The input URL string to validate.
 * @returns boolean indicating if the URL is valid.
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false;
  const trimmedUrl = url.trim();
  return YOUTUBE_REGEX.test(trimmedUrl) || TWITTER_REGEX.test(trimmedUrl);
}

/**
 * Identifies the platform of the given URL.
 * @param url The input URL string.
 * @returns "youtube" | "twitter" | null
 */
export function getPlatformFromUrl(url: string): "youtube" | "twitter" | null {
  if (!url) return null;
  const trimmedUrl = url.trim();
  if (YOUTUBE_REGEX.test(trimmedUrl)) {
    return "youtube";
  }
  if (TWITTER_REGEX.test(trimmedUrl)) {
    return "twitter";
  }
  return null;
}

/**
 * Extracts a unique identifier (video ID or status ID) from the URL.
 * @param url The input URL.
 * @returns The extracted string ID or null if not valid.
 */
export function extractIdFromUrl(url: string): string | null {
  if (!url) return null;
  const trimmedUrl = url.trim();
  
  const ytMatch = trimmedUrl.match(YOUTUBE_REGEX);
  if (ytMatch && ytMatch[1]) {
    return ytMatch[1];
  }
  
  const twitterMatch = trimmedUrl.match(TWITTER_REGEX);
  if (twitterMatch && twitterMatch[1]) {
    return twitterMatch[1];
  }
  
  return null;
}

/**
 * Sanitizes input to protect against dynamic injection / XSS attacks.
 * @param input String input to sanitize.
 * @returns Sanitized safe string.
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  // Only strip characters that cannot appear in valid YouTube/Twitter URLs.
  // Do NOT replace '/', '&', or '=' — they are structural parts of URLs.
  // Regex validation in isValidVideoUrl is the primary injection guard.
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
