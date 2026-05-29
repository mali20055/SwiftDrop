"use client";

import React from "react";
import { VideoFormat } from "@/lib/types";
import { Monitor, Music, CircleDot, HardDrive } from "lucide-react";

interface FormatSelectorProps {
  formats: VideoFormat[];
  selectedFormatId: string | null;
  onSelect: (formatId: string) => void;
}

/**
 * Utility function to convert raw bytes into highly readable file size text.
 * @param bytes Data size in bytes
 */
function formatBytes(bytes?: number): string {
  if (!bytes) return "Dynamic Size";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function FormatSelector({ formats, selectedFormatId, onSelect }: FormatSelectorProps) {
  
  // Distinguish video formats from audio formats
  const videoFormats = formats.filter(f => f.quality !== "audio");
  const audioFormats = formats.filter(f => f.quality === "audio");

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5" id="format-selector-section">
      
      {/* Selection Subheading */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h4 className="text-sm font-medium text-zinc-300 tracking-tight uppercase">
          Select Output Format
        </h4>
        <span className="text-xs text-zinc-500 font-mono">
          {formats.length} formats available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Video Formats Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-1 font-medium">
            <Monitor className="w-4 h-4 text-[#7C3AED]" />
            <span>Video Options</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {videoFormats.map((fmt) => {
              const isSelected = selectedFormatId === fmt.id;
              return (
                <button
                  key={fmt.id}
                  id={`fmt-${fmt.id}`}
                  onClick={() => onSelect(fmt.id)}
                  type="button"
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 outline-none ${
                    isSelected
                      ? "bg-[#7C3AED] border-white/10 text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]"
                      : "bg-zinc-900 border-white/5 text-zinc-300 hover:border-white/10 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                      <CircleDot className={`w-4 h-4 ${isSelected ? "scale-110" : ""}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm md:text-base text-white block">
                        Video {fmt.quality}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Container: {fmt.ext.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs md:text-sm font-semibold font-mono flex items-center gap-1 justify-end ${isSelected ? "text-white" : "text-[#7C3AED]"}`}>
                      <HardDrive className={`w-3.5 h-3.5 ${isSelected ? "text-white/70" : "text-zinc-500"}`} />
                      {formatBytes(fmt.filesize)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Formats Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-1 font-medium">
            <Music className="w-4 h-4 text-[#7C3AED]" />
            <span>Audio Extraction</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {audioFormats.map((fmt) => {
              const isSelected = selectedFormatId === fmt.id;
              return (
                <button
                  key={fmt.id}
                  id={`fmt-${fmt.id}`}
                  onClick={() => onSelect(fmt.id)}
                  type="button"
                  className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 outline-none ${
                    isSelected
                      ? "bg-[#7C3AED] border-white/10 text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]"
                      : "bg-zinc-900 border-white/5 text-zinc-300 hover:border-white/10 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                      <CircleDot className={`w-4 h-4 ${isSelected ? "scale-110" : ""}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm md:text-base text-white block">
                        Audio MP3
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Extracted Sound (MP3 format)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs md:text-sm font-semibold font-mono flex items-center gap-1 justify-end ${isSelected ? "text-white" : "text-[#7C3AED]"}`}>
                      <HardDrive className={`w-3.5 h-3.5 ${isSelected ? "text-white/70" : "text-zinc-500"}`} />
                      {formatBytes(fmt.filesize)}
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Quality Hint Grid Filler */}
            <div className="p-4 rounded-xl border border-dashed border-white/5 bg-zinc-900/10 text-zinc-500 text-xs flex flex-col justify-center space-y-1 items-start h-[5.5rem]">
              <span className="font-medium text-zinc-400">⚡ Ad-Free Direct Downloading</span>
              <p className="leading-normal">
                Files are downloaded directly at highest speed without redirects.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
