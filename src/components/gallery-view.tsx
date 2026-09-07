"use client";

import { PhotoCarousel } from "@/components/photo-carousel";
import { EVENT, MAX_SHOTS } from "@/lib/constants";
import { useGuestId, useGuestName } from "@/lib/guest";
import { fetchAllPhotos, groupAlbums } from "@/lib/photos";
import type { Album } from "@/lib/types";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function GalleryView() {
  const searchParams = useSearchParams();
  const done = searchParams.get("done") === "1";
  const guestId = useGuestId();
  const guestName = useGuestName();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!guestId) return;

    fetchAllPhotos()
      .then((photos) => setAlbums(groupAlbums(photos, guestId)))
      .catch(() => setError("Galeri belum bisa dimuat. Cek tabel guest_photos."));
  }, [guestId]);

  useEffect(() => {
    if (!done) return;
    void confetti({
      particleCount: 90,
      spread: 76,
      origin: { y: 0.25 },
      colors: ["#d4af37", "#c45c26", "#f6efe2", "#2d4a3e"],
    });
  }, [done]);

  const myCount = useMemo(() => {
    return albums.find((album) => album.isMine)?.photos.length ?? 0;
  }, [albums]);

  return (
    <main className="relative min-h-dvh overflow-hidden px-4 py-6">
      <div className="pointer-events-none absolute inset-0 film-grain vintage-wash" />
      <div className="relative mx-auto w-full max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-amber-800/80">
          {EVENT.subtitle}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-[#3b2416]">Galeri Bersama</h1>
        {done ? (
          <p className="mt-3 max-w-md font-serif text-lg leading-snug text-[#6a4c32]">
            Rol film kamu sudah penuh / selesai! Yuk intip galeri bersama.
          </p>
        ) : (
          <p className="mt-3 max-w-md text-sm text-[#6a4c32]">
            Album semua tamu. Album kamu selalu di paling atas kiri.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          {myCount < MAX_SHOTS ? (
            <Link
              href="/camera"
              className="bg-[#2b2118] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#f6efe2]"
            >
              Kembali ke kamera
            </Link>
          ) : null}
          <p className="self-center font-mono text-[10px] uppercase tracking-[0.18em] text-[#7a5a3a]">
            {guestName ? `${guestName} · ${myCount}/${MAX_SHOTS}` : "Tamu"}
          </p>
        </div>

        {error ? <p className="mt-6 text-sm text-[#9a3b1a]">{error}</p> : null}

        {albums.length === 0 && !error ? (
          <p className="mt-10 font-serif text-[#6a4c32]">
            Belum ada foto. Jadi yang pertama menggulung film?
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {albums.map((album) => (
              <button
                key={album.guestId}
                type="button"
                onClick={() => setActive(album)}
                className={`text-left ${
                  album.isMine
                    ? "album-mine"
                    : "bg-[#f7f1e4] p-2 shadow-[0_10px_24px_rgba(60,40,20,0.12)]"
                }`}
              >
                <div className="relative aspect-square overflow-hidden bg-[#d7c4a6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={album.coverUrl}
                    alt={album.guestName}
                    className="h-full w-full object-cover"
                  />
                  {album.isMine ? (
                    <span className="absolute left-2 top-2 bg-[#d4af37] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#2b2118]">
                      Album Kamu
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 truncate font-serif text-sm text-[#3b2416]">
                  {album.guestName}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7a5a3a]">
                  {album.photos.length} foto
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {active ? (
        <PhotoCarousel album={active} onClose={() => setActive(null)} />
      ) : null}
    </main>
  );
}
