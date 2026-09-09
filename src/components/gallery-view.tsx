"use client";

import { PhotoCarousel } from "@/components/photo-carousel";
import { MAX_SHOTS } from "@/lib/constants";
import { useGuestId, useGuestName } from "@/lib/guest";
import { fetchAllPhotos, groupAlbums } from "@/lib/photos";
import type { Album } from "@/lib/types";
import confetti from "canvas-confetti";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function GalleryView() {
  const searchParams = useSearchParams();
  const doneParam = searchParams.get("done") === "1";
  const guestId = useGuestId();
  const guestName = useGuestName();

  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!guestId) return;

    fetchAllPhotos()
      .then((photos) => setAlbums(groupAlbums(photos, guestId)))
      .catch(() => setError("Galeri belum bisa dimuat. Cek tabel database."));
  }, [guestId]);

  const myAlbum = useMemo(() => {
    return albums.find((album) => album.isMine);
  }, [albums]);

  const myCount = myAlbum?.photos.length ?? 0;
  const myRemaining = Math.max(0, MAX_SHOTS - myCount);
  const isRollFinished = myCount >= MAX_SHOTS;

  useEffect(() => {
    if (!isRollFinished && !doneParam) return;
    if (isRollFinished) {
      void confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.25 },
        colors: ["#ffffff", "#ff7a18", "#d4af37", "#a3e635"],
      });
    }
  }, [isRollFinished, doneParam]);

  const totalMoments = useMemo(() => {
    return albums.reduce((acc, curr) => acc + curr.photos.length, 0);
  }, [albums]);

  const totalGuests = albums.length;

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-black px-4 pt-10 pb-16 text-white select-none">
      {/* Header Image Fifi & Rido Terang & Ter-highlight Jelas */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[600px] z-0 overflow-hidden">
        <Image
          src="/cover.jpg"
          alt="Fifi & Rido"
          fill
          priority
          className="object-cover object-[center_18%] grayscale contrast-[1.08] brightness-[0.98]"
        />
        {/* Film grain halus */}
        <div className="absolute inset-0 film-grain-dark opacity-25" />

        {/* Gradasi Lembut: Atas agak redup dikit agar teks terbaca, tengah terang agar wajah kalian terlihat jelas, bawah transisi hitam pekat ke grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent via-55% to-black" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-sm flex flex-col items-center text-center">
        {/* Header Label */}
        <p className="font-inter text-xs text-neutral-100 font-light tracking-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          a disposable camera
        </p>

        {/* Space diperlebar + Title diperbesar */}
        <p className="mt-14 font-inter text-sm uppercase tracking-[0.42em] text-white/95 pl-[0.42em] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] font-medium">
          ALBUM BERSAMA
        </p>

        <h1 className="font-serif text-[58px] leading-none font-normal text-white tracking-tight mt-1.5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
          Fifi &amp; Rido
        </h1>

        {/* Section Counting */}
        <div className="mt-5 flex items-center justify-center gap-12 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col items-center min-w-[64px]">
            <span className="font-serif text-4xl font-light text-white tracking-wide">
              {totalMoments}
            </span>
            <span className="font-inter text-xs text-neutral-200 capitalize mt-0.5 font-light">
              Momen
            </span>
          </div>
          <div className="flex flex-col items-center min-w-[64px]">
            <span className="font-serif text-4xl font-light text-white tracking-wide">
              {totalGuests}
            </span>
            <span className="font-inter text-xs text-neutral-200 capitalize mt-0.5 font-light">
              Tamu
            </span>
          </div>
        </div>

        {/* Status Rol Film */}
        {!isRollFinished ? (
          <div className="mt-6 w-full flex justify-center">
            <Link
              href="/camera"
              className="w-full max-w-[240px] rounded-lg bg-white py-2.5 text-center font-inter text-xs font-medium text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all hover:bg-neutral-100 active:scale-95"
            >
              Kembali ke Kamera
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center w-full">
            <p className="font-inter text-xs font-semibold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Rol film kamu sudah penuh / selesai!
            </p>
            <p className="mt-0.5 font-inter text-[10.5px] text-neutral-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              lihat momen momen yang di ambil tamu lainnya
            </p>
            <div className="mt-4 h-[1px] w-full bg-white/20" />
          </div>
        )}

        {error ? (
          <div className="mt-6 w-full rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-center text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        {/* Grid Album Polaroid */}
        <div className="mt-6 grid w-full grid-cols-2 gap-3.5">
          {albums.map((album) => {
            const isMe = album.isMine;
            return (
              <button
                key={album.guestId}
                type="button"
                onClick={() => setActive(album)}
                className="group relative flex flex-col overflow-hidden rounded-lg bg-white p-2 pb-2.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-transform duration-200 active:scale-95"
              >
                <div className="relative aspect-[4/4.8] w-full overflow-hidden rounded-sm bg-black">
                  {album.coverUrl ? (
                    <Image
                      src={album.coverUrl}
                      alt={album.guestName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-black" />
                  )}

                  {isMe ? (
                    <>
                      <span className="absolute left-1.5 top-1.5 rounded-sm bg-[#c99738] px-1.5 py-0.5 font-inter text-[8px] font-bold uppercase tracking-wider text-black">
                        ALBUM KAMU
                      </span>
                      <span className="absolute right-1.5 top-1.5 font-mono text-[9px] font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {myRemaining}/{MAX_SHOTS}
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-col items-center justify-center text-center px-0.5">
                  <p className="w-full truncate font-inter text-[11.5px] font-semibold text-neutral-900">
                    {isMe ? (guestName || "Nama kita") : album.guestName}
                  </p>
                  <p className="font-inter text-[8.5px] text-neutral-400 mt-0.5">
                    {album.photos.length} Foto
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pop Up Detail Carousel */}
      {active ? (
        <PhotoCarousel album={active} onClose={() => setActive(null)} />
      ) : null}
    </main>
  );
}