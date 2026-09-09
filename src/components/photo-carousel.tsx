"use client";

import type { Album } from "@/lib/types";
import { ChevronLeft, ChevronRight, Download, Eye, Share2, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface PhotoCarouselProps {
  album: Album;
  onClose: () => void;
}

export function PhotoCarousel({ album, onClose }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [frameMode, setFrameMode] = useState<"polaroid" | "normal">("polaroid");
  const [isSaving, setIsSaving] = useState(false);

  // Ref untuk mendeteksi touch gesture swipe mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const photos = album.photos;
  const currentPhoto = photos[index];
  const isMyAlbum = album.isMine;

  const prevPhoto = useCallback(() => {
    setDirection("prev");
    setIndex((curr) => (curr > 0 ? curr - 1 : photos.length - 1));
  }, [photos.length]);

  const nextPhoto = useCallback(() => {
    setDirection("next");
    setIndex((curr) => (curr < photos.length - 1 ? curr + 1 : 0));
  }, [photos.length]);

  // Touch Swipe Gesture Handler (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // sensitivitas geseran minimal (px)

    if (distance > minSwipeDistance) {
      nextPhoto(); // Swipe kiri -> foto selanjutnya
    } else if (distance < -minSwipeDistance) {
      prevPhoto(); // Swipe kanan -> foto sebelumnya
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [nextPhoto, onClose, prevPhoto]);

  // Unduh foto dengan canvas render
  const handleSavePhoto = async () => {
    if (!isMyAlbum || !currentPhoto?.photo_url || isSaving) return;
    setIsSaving(true);

    try {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = currentPhoto.photo_url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas failure");

      const imgWidth = img.naturalWidth || 1200;
      const imgHeight = img.naturalHeight || 900;

      if (frameMode === "polaroid") {
        const padSide = Math.round(imgWidth * 0.055);
        const padTop = Math.round(imgWidth * 0.055);
        const padBottom = Math.round(imgWidth * 0.28);

        canvas.width = imgWidth + padSide * 2;
        canvas.height = imgHeight + padTop + padBottom;

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, padSide, padTop, imgWidth, imgHeight);

        const centerX = canvas.width / 2;
        const textStartY = imgHeight + padTop + padBottom * 0.42;

        ctx.textAlign = "center";
        ctx.fillStyle = "#666666";
        ctx.font = `${Math.round(imgWidth * 0.024)}px "Inter", sans-serif`;
        ctx.fillText("THE WEDDING OF", centerX, textStartY);

        ctx.fillStyle = "#1a1a1a";
        ctx.font = `normal ${Math.round(imgWidth * 0.062)}px "Playfair Display", serif`;
        ctx.fillText("Fifi & Rido", centerX, textStartY + padBottom * 0.32);
      } else {
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

        ctx.textAlign = "left";
        const marginX = Math.round(imgWidth * 0.045);
        const marginY = imgHeight - Math.round(imgHeight * 0.045);

        ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
        ctx.shadowBlur = Math.round(imgWidth * 0.008);

        ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
        ctx.font = `${Math.round(imgWidth * 0.022)}px "Inter", sans-serif`;
        ctx.fillText("THE WEDDING OF", marginX, marginY - Math.round(imgHeight * 0.042));

        ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
        ctx.font = `normal ${Math.round(imgWidth * 0.056)}px "Playfair Display", serif`;
        ctx.fillText("Fifi & Rido", marginX, marginY);
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `wedding-fifi-rido-${Date.now()}.jpg`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh foto.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!currentPhoto?.photo_url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "The Wedding of Fifi & Rido",
          text: `Momen dari rol foto ${album.guestName}!`,
          url: currentPhoto.photo_url,
        });
      } catch {
        // Dismiss
      }
    } else {
      await navigator.clipboard.writeText(currentPhoto.photo_url);
      alert("Tautan foto berhasil disalin!");
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/70 px-5 pt-12 pb-7 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      {/* Dynamic Keyframe Injection untuk Smooth Horizontal Slide */}
      <style jsx global>{`
        @keyframes slideInFromRight {
          0% {
            opacity: 0.15;
            transform: translate3d(36px, 0, 0) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes slideInFromLeft {
          0% {
            opacity: 0.15;
            transform: translate3d(-36px, 0, 0) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        .animate-slide-next {
          animation: slideInFromRight 0.38s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }
        .animate-slide-prev {
          animation: slideInFromLeft 0.38s cubic-bezier(0.25, 1, 0.5, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>

      {/* Container Konten Utama */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 mx-auto flex h-full w-full max-w-sm flex-col justify-between"
      >
        {/* Top Header Modal */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <h2 className="font-inter text-xl font-medium text-white tracking-tight leading-snug drop-shadow-md">
              {album.guestName}
            </h2>
            <p className="font-inter text-xs text-neutral-300 mt-0.5 tracking-normal drop-shadow-sm">
              {index + 1}/{photos.length} {isMyAlbum ? "Album kamu" : "Album tamu"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 active:scale-90 shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Central View Area: Support Swipe Mobile + Smooth Motion Frame */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative my-auto flex w-full flex-col items-center px-1 py-1 touch-pan-y"
        >
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 p-2.5 text-white/90 backdrop-blur-md hover:bg-black/80 active:scale-90 shadow-xl border border-white/10 transition-transform"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 p-2.5 text-white/90 backdrop-blur-md hover:bg-black/80 active:scale-90 shadow-xl border border-white/10 transition-transform"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          {/* Kartu Frame Beranimasi Meluncur Halus Berdasarkan Key index */}
          <div
            key={`${currentPhoto?.id || index}-${direction}`}
            className={`w-full ${
              direction === "next" ? "animate-slide-next" : "animate-slide-prev"
            }`}
          >
            {frameMode === "polaroid" ? (
              /* MODE POLAROID */
              <div className="relative w-full rounded-sm bg-white p-2.5 pb-4 shadow-[0_24px_50px_rgba(0,0,0,0.9)]">
                <div className="relative aspect-[4/4.8] w-full overflow-hidden rounded-xs bg-black">
                  {currentPhoto ? (
                    <Image
                      src={currentPhoto.photo_url}
                      alt={`Photo ${index + 1}`}
                      fill
                      priority
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="mt-3 text-center">
                  <p className="font-inter text-[8px] uppercase tracking-[0.32em] text-neutral-500 pl-[0.32em]">
                    THE WEDDING OF
                  </p>
                  <h3 className="font-serif text-2xl font-normal text-neutral-800 tracking-wide mt-0.5">
                    Fifi &amp; Rido
                  </h3>
                </div>
              </div>
            ) : (
              /* MODE NORMAL (OFF FRAME) */
              <div className="relative aspect-[4/4.8] w-full overflow-hidden rounded-md bg-black shadow-[0_24px_50px_rgba(0,0,0,0.9)]">
                {currentPhoto ? (
                  <Image
                    src={currentPhoto.photo_url}
                    alt={`Photo ${index + 1}`}
                    fill
                    priority
                    className="object-cover"
                  />
                ) : null}

                <div className="absolute bottom-3 left-3 z-10 text-left pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                  <p className="font-inter text-[7.5px] uppercase tracking-[0.3em] text-white/80 pl-[0.3em] font-medium">
                    THE WEDDING OF
                  </p>
                  <h3 className="font-serif text-xl font-normal text-white tracking-wide mt-0.5">
                    Fifi &amp; Rido
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex w-full flex-col items-center gap-3">
          {/* Frame Toggle */}
          <div className="flex flex-col items-center">
            <p className="font-serif italic text-xs text-neutral-300 mb-1.5 drop-shadow-sm">
              Frame
            </p>
            <div className="flex rounded-md border border-white/20 bg-black/60 p-0.5 backdrop-blur-md shadow-md">
              <button
                type="button"
                onClick={() => setFrameMode("polaroid")}
                className={`rounded px-5 py-1 font-inter text-[11px] font-medium transition-all ${
                  frameMode === "polaroid"
                    ? "bg-neutral-200 text-black shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Polaroid
              </button>
              <button
                type="button"
                onClick={() => setFrameMode("normal")}
                className={`rounded px-5 py-1 font-inter text-[11px] font-medium transition-all ${
                  frameMode === "normal"
                    ? "bg-neutral-200 text-black shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Tombol Simpan & Bagikan */}
          {isMyAlbum ? (
            <div className="grid w-full grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSavePhoto}
                className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 font-inter text-xs font-semibold text-neutral-900 shadow-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200">
                  <Download className="h-3 w-3 text-neutral-700" />
                </div>
                <span>{isSaving ? "Menyimpan..." : "Save Foto"}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 font-inter text-xs font-semibold text-neutral-900 shadow-xl transition-all active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5 text-neutral-700" />
                <span>Share to</span>
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-black/40 py-3 px-4 text-center backdrop-blur-md shadow-lg">
              <Eye className="h-4 w-4 text-neutral-300" />
              <p className="font-inter text-[11px] text-neutral-200">
                Hanya dapat disimpan oleh pemilik album
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}