"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Link as LinkIcon, X, Youtube, Twitter } from "lucide-react";
import { isValidVideoUrl, getPlatformFromUrl } from "@/lib/validators";

interface UrlInputProps {
  onValidUrlDetected: (url: string) => void;
  onClear: () => void;
  isLoading: boolean;
  initialValue?: string;
}

/**
 * Focus-maximizing clean input component for entering YouTube or Twitter/X status URLs.
 */
export default function UrlInput({ onValidUrlDetected, onClear, isLoading, initialValue = "" }: UrlInputProps) {
  const [url, setUrl] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus effect on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Watch input value changes to auto-detect valid video link
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setError(null);

    if (!value) {
      onClear();
      return;
    }

    const trimmedValue = value.trim();
    if (isValidVideoUrl(trimmedValue)) {
      onValidUrlDetected(trimmedValue);
    } else if (trimmedValue.length > 5) {
      // Show mild feedback if URL looks incorrect after typing a few characters
      setError("Please paste a valid YouTube or Twitter/X URL");
    }
  };

  // Support manual submission or clean-up
  const handleClear = () => {
    setUrl("");
    setError(null);
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Extract platform for ambient logo styling
  const detectedPlatform = getPlatformFromUrl(url);

  return (
    <div className="w-full max-w-3xl mx-auto" id="url-input-container">
      <div className="relative group">
        {/* Glow backdrop aligned with Elegant Dark specification */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7C3AED] to-purple-900 rounded-2xl blur opacity-20 group-focus-within:opacity-45 transition-opacity duration-350"></div>
        
        <div 
          className={`relative flex items-center transition-all duration-300 rounded-xl bg-zinc-900 border ${
            error 
              ? "border-red-500/50" 
              : detectedPlatform 
                ? "border-[#7C3AED]/70" 
                : "border-white/10 focus-within:border-[#7C3AED]/50"
          }`}
        >
          {/* Left Side Status Icon */}
          <div className="flex items-center justify-center pl-5 text-zinc-400">
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
            ) : detectedPlatform === "youtube" ? (
              <Youtube className="w-5 h-5 text-red-500 animate-pulse" />
            ) : detectedPlatform === "twitter" ? (
              <Twitter className="w-5 h-5 text-sky-400 animate-pulse" />
            ) : (
              <LinkIcon className="w-5 h-5 text-zinc-500" />
            )}
          </div>

          {/* The Big Clean Input styled with Elegant Dark metrics */}
          <input
            ref={inputRef}
            id="video-url-input"
            type="text"
            value={url}
            onChange={handleInputChange}
            placeholder="Paste YouTube video or Twitter/X link here..."
            className="w-full py-5 pl-4 pr-12 text-base md:text-lg text-zinc-100 placeholder-zinc-600 bg-transparent rounded-xl focus:outline-none"
            disabled={isLoading}
          />

          {/* Clear or Paste Badge indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {url ? (
              <button
                id="clear-url-button"
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Clear URL"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded border border-white/5 tracking-tighter">PASTE</span>
            )}
          </div>
        </div>
      </div>

      {/* Helpful inline feedback messages */}
      {error && !detectedPlatform && (
        <p className="mt-2.5 text-xs text-red-400/90 pl-3 transition-all font-sans" id="url-error-msg">
          {error}
        </p>
      )}

      {detectedPlatform && (
        <p className="mt-2.5 text-xs text-purple-400 pl-3 flex items-center gap-1.5 transition-all font-sans" id="url-platform-success">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping inline-block" />
          Detected {detectedPlatform === "youtube" ? "YouTube" : "Twitter/X"} link! Loading video configurations...
        </p>
      )}
    </div>
  );
}
