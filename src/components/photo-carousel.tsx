"use client";

import { downloadPhoto, sharePhoto } from "@/lib/share";
import type { Album } from "@/lib/types";
import { ChevronLeft, ChevronRight, Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type PhotoCarouselProps = {
  album: Album;
  onClose: () => void;
};

export function PhotoCarousel({ album, onClose }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);
  const photo = album.photos[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        setIndex((value) => Math.min(album.photos.length - 1, value + 1));
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) => Math.max(0, value - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [album.photos.length, onClose]);

  if (!photo) return null;

  function shift(delta: number) {
    setIndex((value) =>
      Math.min(album.photos.length - 1, Math.max(0, value + delta)),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/88 p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-serif text-xl">{album.guestName}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
            {index + 1} / {album.photos.length}
            {album.isMine ? " · Album kamu" : ""}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Tutup">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center"
        onTouchStart={(event) => setTouchX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchX == null) return;
          const endX = event.changedTouches[0]?.clientX ?? touchX;
          const delta = endX - touchX;
          if (delta > 40) shift(-1);
          if (delta < -40) shift(1);
          setTouchX(null);
        }}
      >
        <button
          type="button"
          className="absolute left-0 z-10 p-2"
          onClick={() => shift(-1)}
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.photo_url}
          alt={`Foto ${album.guestName}`}
          className="max-h-[70dvh] w-full max-w-lg object-contain"
        />
        <button
          type="button"
          className="absolute right-0 z-10 p-2"
          onClick={() => shift(1)}
          aria-label="Berikutnya"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      {album.isMine ? (
        <div className="mx-auto mt-4 grid w-full max-w-lg grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              downloadPhoto(
                photo.photo_url,
                `akad-${album.guestName}-${index + 1}.jpg`,
              ).catch(() => window.alert("Gagal menyimpan foto."))
            }
            className="flex items-center justify-center gap-2 bg-[#f6efe2] py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#2b2118]"
          >
            <Download className="h-4 w-4" />
            Save Foto
          </button>
          <button
            type="button"
            onClick={() =>
              sharePhoto(
                photo.photo_url,
                `akad-${album.guestName}-${index + 1}.jpg`,
              ).catch(() => window.alert("Share dibatalkan atau tidak tersedia."))
            }
            className="flex items-center justify-center gap-2 border border-[#f6efe2] py-3 font-mono text-[11px] uppercase tracking-[0.16em]"
          >
            <Share2 className="h-4 w-4" />
            Share to Instagram Story
          </button>
        </div>
      ) : (
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
          Hanya bisa dilihat · Save khusus album kamu
        </p>
      )}
    </div>
  );
}
