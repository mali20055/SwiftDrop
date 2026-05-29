"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Youtube, Twitter } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import VideoPreview from "@/components/VideoPreview";
import FormatSelector from "@/components/FormatSelector";
import DownloadButton from "@/components/DownloadButton";
import { VideoMetadata, DownloadResponse, VideoFormat } from "@/lib/types";

export default function Home() {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Triggered when a valid platform URL matches constraints
  const handleValidUrlDetected = async (url: string) => {
    setCurrentUrl(url);
    setIsLoadingMetadata(true);
    setErrorMessage(null);
    setMetadata(null);
    setSelectedFormatId(null);

    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sunucu video bilgilerini alamadı.");
      }

      setMetadata(data);
      // Auto-select highest quality 1080p by default
      if (data.formats && data.formats.length > 0) {
        const defaultFmt = data.formats.find((f: VideoFormat) => f.quality === "1080p") || data.formats[0];
        setSelectedFormatId(defaultFmt.id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Lütfen video adresini kontrol edip tekrar deneyin.");
      setMetadata(null);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Triggered when URL is cleared or empty
  const handleClear = () => {
    setCurrentUrl("");
    setMetadata(null);
    setSelectedFormatId(null);
    setErrorMessage(null);
    setIsLoadingMetadata(false);
  };

  // Core callback passed to the downloader component to fetch final download URL
  const handleDownloadTrigger = async (): Promise<DownloadResponse | null> => {
    if (!currentUrl || !selectedFormatId || !metadata) return null;

    const selectedFormatObj = metadata.formats.find(f => f.id === selectedFormatId);
    if (!selectedFormatObj) return null;

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentUrl,
          format: selectedFormatObj.quality // "1080p", "720p", "480p", "audio"
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "İndirme bağlantısı oluşturulurken hata.");
      }

      return data as DownloadResponse;
    } catch (err: any) {
      console.error(err);
      throw new Error(err?.message || "Bağlantı hazırlama isteği sunucuda reddedildi.");
    }
  };

  return (
    <main className="relative flex flex-col min-h-screen justify-between py-10 px-4 md:px-8 font-sans transition-all selection:bg-purple-600/30 selection:text-white" id="main-application-frame">
      
      {/* Background ambient decorative light source - subtle and non-distracting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-purple-950/10 via-neutral-950/0 to-neutral-950/0 pointer-events-none blur-[100px]" />

      {/* Primary Layout Wrapper */}
      <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col justify-center space-y-10 md:space-y-12">
        
        {/* SECTION 1: Clean Branding Header matching Elegant Dark */}
        <header className="w-full flex items-center justify-between border-b border-white/5 pb-6" id="branding-header">
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-1.5">
              <span className="bg-[#7C3AED] px-2.5 py-0.5 rounded text-white font-extrabold text-[22px] tracking-tight">Swift</span>Drop
            </h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1.5 font-mono">Lightning fast video archival</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-white/5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight font-mono">System Ready</span>
            </div>
          </div>
        </header>

        {/* SECTION 2: URL Input Area */}
        <section id="url-input-block" className="space-y-4">
          <UrlInput 
            onValidUrlDetected={handleValidUrlDetected} 
            onClear={handleClear}
            isLoading={isLoadingMetadata}
            initialValue={currentUrl}
          />
        </section>

        {/* SECTION 3: Content Loading State Skeleton */}
        {isLoadingMetadata && (
          <section id="metadata-skeleton-loader" className="w-full max-w-3xl mx-auto p-6 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse space-y-5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-52 h-32 bg-zinc-805 bg-zinc-800 rounded-lg" />
              <div className="flex-grow space-y-4 py-2">
                <div className="h-4 bg-zinc-850 bg-zinc-800 rounded w-1/4" />
                <div className="h-6 bg-zinc-800 rounded w-3/4" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: Validation Error State Banner */}
        {errorMessage && (
          <section id="metadata-error-banner" className="w-full max-w-3xl mx-auto p-5 bg-zinc-900/60 border border-red-500/10 rounded-2xl flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 animate-ping flex-shrink-0" />
            <div className="text-left">
              <h5 className="font-bold text-red-400 text-sm">Video Bilgisi Alınamadı</h5>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{errorMessage}</p>
            </div>
          </section>
        )}

        {/* SECTION 5: Video Metadata Preview Display */}
        {metadata && !isLoadingMetadata && (
          <section id="video-preview-block" className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <VideoPreview metadata={metadata} />
            
            <FormatSelector 
              formats={metadata.formats} 
              selectedFormatId={selectedFormatId} 
              onSelect={setSelectedFormatId}
            />

            <DownloadButton 
              onDownloadTrigger={handleDownloadTrigger}
              disabled={!selectedFormatId}
            />
          </section>
        )}

        {/* SECTION 6: Platform Support Indicator Info Grid (Shown if idle) */}
        {!metadata && !isLoadingMetadata && !errorMessage && (
          <section id="platform-support-highlights" className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-start gap-4 hover:border-white/10 transition-colors">
              <div className="p-2.5 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl">
                <Youtube className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-bold text-sm md:text-base text-zinc-100">YouTube Archive Storage</h4>
                <p className="text-xs text-zinc-500 leading-normal">
                  Extract original resolution content (1080p, 725p, 480p) or directly export sound components to pure MP3 format.
                </p>
              </div>
            </div>

            <div className="p-5 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-start gap-4 hover:border-white/10 transition-colors">
              <div className="p-2.5 bg-sky-600/10 text-sky-400 border border-sky-600/20 rounded-xl">
                <Twitter className="w-5 h-5" />
              </div>
              <div className="text-left space-y-1">
                <h4 className="font-bold text-sm md:text-base text-zinc-100">Twitter / X Media</h4>
                <p className="text-xs text-zinc-500 leading-normal">
                  Pass any high quality status video tweet directly to start archiving high fidelity visual clips.
                </p>
              </div>
            </div>

          </section>
        )}

      </div>

      {/* Footer Platforms conforming with Elegant Dark */}
      <footer className="w-full max-w-3xl mx-auto border-t border-white/5 pt-6 flex justify-between items-center" id="application-footer">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-4 h-4 bg-zinc-800 rounded-sm flex items-center justify-center text-[10px] font-bold text-white font-mono">Y</div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">YouTube</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-4 h-4 bg-zinc-800 rounded-sm flex items-center justify-center text-[10px] font-bold italic text-white font-mono">X</div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Twitter / X</span>
          </div>
        </div>
        <div className="text-zinc-650 text-[10px] font-mono tracking-widest uppercase">
          v1.0.4 build-stable
        </div>
      </footer>

    </main>
  );
}
