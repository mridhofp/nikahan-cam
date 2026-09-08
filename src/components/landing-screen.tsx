"use client";

import { setGuestName, useGuestId, useGuestName } from "@/lib/guest";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Image from "next/image";

export function LandingScreen() {
  const router = useRouter();
  const guestId = useGuestId();
  const storedName = useGuestName();
  const [draft, setDraft] = useState<string | null>(null);
  const name = draft ?? storedName;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setGuestName(trimmed);
    router.push("/camera");
  }

  return (
    <main className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-black px-6 py-9">
      {/* Background Foto + Grayscale + Lapisan Hitam + Gradient Bawah */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/cover.jpg"
          alt="Latar Fifi & Rido"
          fill
          priority
          className="object-cover grayscale contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-black/80" />
        <div className="absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-0 film-grain-dark opacity-30" />
      </div>

      {/* Konten Utama */}
      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-between">
        {/* Header Bagian Atas */}
        <header className="animate-fade-up text-center pt-2">
          <p className="font-inter text-xs tracking-[0.1em] text-neutral-300/90">
            a disposable camera
          </p>
          <p className="font-inter mt-4 text-[13px] font-normal uppercase tracking-[0.45em] text-neutral-200 pl-[0.45em]">
            THE WEDDING OF
          </p>
          <h1 className="font-inria mt-1.5 text-[50px] font-normal leading-none tracking-normal text-white drop-shadow-md">
            Fifi &amp; Rido
          </h1>
        </header>

        {/* Kotak Transparan: Blur Diturunkan 70% + Kemiringan -1.56 Deg */}
        <div className="animate-fade-up delay-100 my-4 flex flex-col items-center">
          <div className="relative w-full -rotate-[1.56deg] rounded-2xl border border-white/30 figma-blur-card p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
            {/* Garis Border Dalam */}
            <div className="relative flex aspect-[4/4.6] w-full flex-col justify-between rounded-xl border border-white/20 p-4">
              {/* Ikon Tengah */}
              <div className="flex flex-1 items-center justify-center">
                <div className="relative h-28 w-28">
                  <Image
                    src="/icon-center.png"
                    alt="Logo Aperture"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Teks ISO Bebas Neue */}
              <div className="flex items-center">
                <p className="font-bebas text-xs tracking-widest text-neutral-300">
                  ISO 400 . FIFI &amp; RIDO
                </p>
              </div>
            </div>

            {/* Tulisan Sambung Lambat */}
            <div className="px-2 pt-4 pb-1 text-center font-cursive text-sm leading-relaxed text-neutral-200">
              <span className="handwriting-line handwriting-line-1">
                Satu rol film, Dua puluh satu momen,
              </span>
              <span className="handwriting-line handwriting-line-2 mt-0.5">
                jangan sampai terlewat
              </span>
            </div>
          </div>
        </div>

        {/* Area Headline Bawah & Form Input Tamu */}
        <form
          onSubmit={onSubmit}
          className="animate-fade-up delay-200 flex flex-col items-center space-y-4 pb-2"
        >
          <div className="text-center space-y-2">
            <h2 className="font-inria text-[1.32rem] leading-snug font-normal text-white px-1 drop-shadow-md">
              Abadikan setiap momen hangat di pernikahan kami melalui sudut pandangmu.
            </h2>
            <p className="font-inter text-xs font-light text-neutral-300 drop-shadow-sm">
              Masukkan nama kamu untuk mulai rol film
            </p>
          </div>

          <div className="w-full pt-1">
            <input
              value={name}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nama Kamu"
              autoComplete="name"
              required
              className="w-full border-b border-white/40 bg-transparent px-1 py-2 text-center font-inter text-base font-normal text-white placeholder:text-neutral-500 focus:border-white focus:outline-none transition-colors"
            />
          </div>

          {/* Tombol Mulai Capsule */}
          <button
            type="submit"
            disabled={!guestId || !name.trim()}
            className="mt-2 w-48 rounded-full bg-white py-3.5 font-inter text-sm font-medium text-black shadow-lg transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-30"
          >
            Mulai
          </button>
        </form>
      </div>
    </main>
  );
}