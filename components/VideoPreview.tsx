"use client";

import React from "react";
import Image from "next/image";
import { Youtube, Twitter, Clock } from "lucide-react";
import { VideoMetadata } from "@/lib/types";

interface VideoPreviewProps {
  metadata: VideoMetadata;
}

/**
 * Utility helper to format seconds into readable video length format (e.g., 2:35 or 1:04:20).
 * @param seconds Total seconds
 * @returns string
 */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const paddedSecs = secs.toString().padStart(2, "0");
  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, "0");
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

export default function VideoPreview({ metadata }: VideoPreviewProps) {
  const { title, thumbnail, duration, platform } = metadata;

  return (
    <div 
      id="video-preview-card"
      className="w-full max-w-3xl mx-auto overflow-hidden bg-zinc-900/40 border border-white/5 rounded-2xl transition-all duration-300 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-col md:flex-row gap-6 p-6">
        
        {/* Responsive Thumbnail / Image Frame matching Elegant Dark */}
        <div className="relative w-full md:w-52 h-32 flex-shrink-0 bg-zinc-800 rounded-lg overflow-hidden border border-white/5 group">
          <Image
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 208px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            priority
          />
          {/* Overlay duration chip */}
          <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 text-[10px] font-mono rounded text-zinc-100">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col justify-between flex-grow py-1">
          <div>
            {/* Platform Badge matching Elegant Dark styles exactly */}
            <div className="flex items-center gap-2 mb-2">
              {platform === "youtube" ? (
                <span className="text-[10px] bg-red-600/20 text-red-500 border border-red-600/30 px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight inline-flex items-center gap-1">
                  <Youtube className="w-3 h-3" />
                  YouTube
                </span>
              ) : (
                <span className="text-[10px] bg-sky-600/20 text-sky-400 border border-sky-600/30 px-2 py-0.5 rounded-sm font-bold uppercase tracking-tight inline-flex items-center gap-1">
                  <Twitter className="w-3 h-3" />
                  Twitter / X
                </span>
              )}
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Status: Ready</span>
            </div>

            {/* Video Title */}
            <h2 
              id="preview-video-title"
              className="text-lg font-semibold text-zinc-100 line-clamp-2 md:line-clamp-1 leading-snug tracking-tight"
            >
              {title}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
              Duration: {formatDuration(duration)} &bull; Source Platform Stream
            </p>
          </div>

          {/* Quick aesthetic prompt footer */}
          <p className="text-[11px] text-zinc-500 mt-4 md:mt-0 leading-normal">
            Choose your preferred quality format options below to trigger direct archival of this stream.
          </p>
        </div>

      </div>
    </div>
  );
}
