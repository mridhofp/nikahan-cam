"use client";

import { Download } from "lucide-react";
import type { LocalShot } from "@/lib/types";
import { downloadPhoto } from "@/lib/share";

type ShotThumbnailsProps = {
  shots: LocalShot[];
};

export function ShotThumbnails({ shots }: ShotThumbnailsProps) {
  if (shots.length === 0) {
    return (
      <p className="px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#d7c4a6]/70">
        Belum ada foto di rol ini
      </p>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {shots.map((shot, index) => (
        <div
          key={shot.id}
          className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#1a140f] ring-1 ring-[#f3e6cf]/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot.url}
            alt={`Foto ${index + 1}`}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            aria-label="Save foto"
            onClick={() =>
              downloadPhoto(shot.url, `akad-${index + 1}.jpg`).catch(() => {
                window.alert("Gagal menyimpan foto.");
              })
            }
            className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center bg-black/55 text-white"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
