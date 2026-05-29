"use client";

import React, { useState } from "react";
import { ArrowDownToLine, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { DownloadResponse } from "@/lib/types";

interface DownloadButtonProps {
  onDownloadTrigger: () => Promise<DownloadResponse | null>;
  disabled: boolean;
}

export default function DownloadButton({ onDownloadTrigger, disabled }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "requesting" | "downloading" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [resolvedConfig, setResolvedConfig] = useState<DownloadResponse | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const handleDownloadClick = async () => {
    if (disabled || status === "requesting" || status === "downloading") return;

    setStatus("requesting");
    setErrMsg("");
    setProgress(0);

    try {
      // 1. Ask API Route to compile the download link
      const config = await onDownloadTrigger();
      
      if (!config) {
        throw new Error("İndirme adresi alınamadı. Lütfen URL'yi kontrol edip tekrar deneyin.");
      }

      setResolvedConfig(config);
      
      // 2. Start premium visual compilation progress representation
      setStatus("downloading");

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            
            // Trigger actual instant browser download using direct link
            try {
              const link = document.createElement("a");
              link.href = config.downloadUrl;
              link.setAttribute("download", config.filename);
              link.setAttribute("target", "_blank");
              // referrer policy protection
              link.referrerPolicy = "no-referrer";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (e) {
              console.error("Direct browser download trigger failed", e);
            }

            // Move state to completed
            setStatus("completed");
            return 100;
          }
          
          // Random premium progress steps
          const increment = Math.floor(Math.random() * 15) + 12;
          return Math.min(prev + increment, 100);
        });
      }, 250);

    } catch (err: any) {
      console.error(err);
      setErrMsg(err?.message || "Bağlantı hazırlanırken bir hata oluştu.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setResolvedConfig(null);
    setErrMsg("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto font-sans" id="download-button-wrapper">
      
      {status === "idle" && (
        <button
          id="initiate-download-btn"
          type="button"
          onClick={handleDownloadClick}
          disabled={disabled}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all duration-200 outline-none ${
            disabled
              ? "bg-zinc-900 border border-white/5 text-zinc-600 cursor-not-allowed"
              : "bg-white text-black hover:bg-zinc-200 focus:ring-4 focus:ring-purple-950/20 active:scale-[0.995]"
          }`}
        >
          <ArrowDownToLine className="w-5 h-5" />
          <span>Download Video</span>
        </button>
      )}

      {status === "requesting" && (
        <button
          id="requesting-download-btn"
          disabled
          className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-zinc-900 border border-white/5 text-zinc-400 flex items-center justify-center gap-2.5 cursor-wait"
        >
          <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
          <span>Analyzing streams...</span>
        </button>
      )}

      {status === "downloading" && (
        <div className="space-y-3 py-2">
          {/* Lightweight Elegant Dark Micro Progress */}
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-[#7C3AED]" />
              DOWNLOADING TO ARCHIVE...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              style={{ width: `${progress}%` }}
              className="h-full bg-[#7C3AED] transition-all duration-300 ease-out"
            />
          </div>
          <p className="text-left text-[10px] text-zinc-650 font-mono truncate">
            {resolvedConfig ? `Archiving payload: ${resolvedConfig.filename}` : "Preparing frame..."}
          </p>
        </div>
      )}

      {status === "completed" && (
        <div className="space-y-4">
          <div className="w-full p-6 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-800 rounded-xl text-emerald-400 border border-white/5">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="font-bold text-base text-white block">Download Initiated!</span>
                <span className="text-xs text-zinc-400 leading-relaxed block mt-0.5">
                  Archival of <span className="font-mono text-[#7C3AED]">{resolvedConfig?.filename}</span> started directly. Check your hardware downloads.
                </span>
              </div>
            </div>

            <button
              id="download-another-btn"
              onClick={handleReset}
              type="button"
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-all outline-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Archives Menu
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div className="w-full p-5 bg-zinc-900/60 border border-red-500/10 rounded-2xl text-left">
            <h5 className="font-bold text-red-400 text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
              Downloader Error
            </h5>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {errMsg || "Sistem kaynaklı bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin."}
            </p>
          </div>

          <button
            id="retry-download-btn"
            onClick={handleReset}
            className="w-full py-4 bg-zinc-800 border border-white/5 text-zinc-100 font-semibold rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}

    </div>
  );
}
