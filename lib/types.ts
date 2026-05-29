/**
 * Represents a downloadable format option for a video.
 */
export type VideoFormat = {
  id: string;
  quality: string;      // "1080p", "720p", "480p", "audio"
  filesize?: number;    // in bytes
  ext: string;          // "mp4", "mp3"
};

/**
 * Standardized metadata returned after validating and parsing a video URL.
 */
export type VideoMetadata = {
  title: string;
  thumbnail: string;
  duration: number;     // in seconds
  platform: "youtube" | "twitter";
  formats: VideoFormat[];
};

/**
 * Response returned from the API when initiating a video download.
 */
export type DownloadResponse = {
  downloadUrl: string;
  filename: string;
  filesize?: number;
  filePath?: string;  // set when video was merged server-side; route streams and deletes this file
};
