"use client";

import { EVENT } from "@/lib/constants";
import { setGuestName, useGuestId, useGuestName } from "@/lib/guest";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Image from "next/image";

export function LandingScreen() {
  const router = useRouter();
  const guestId = useGuestId();
  const storedName = useGuestName();
  const [draft, setDraft] = useState<string | null>(null);
  const [isPhotoLoaded, setIsPhotoLoaded] = useState(false);
  const name = draft ?? storedName;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setGuestName(trimmed);
    router.push("/camera");
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-8">
      <div className="pointer-events-none absolute inset-0 film-grain vintage-wash" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-between">
        {/* Header */}
        <header className="text-center animate-fade-up">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-amber-800/80">
            Disposable Camera
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-[#3b2416]">
            The Wedding of
            <span className="block font-semibold italic text-[#8d6a45]">
              Fifi &amp; Rido
            </span>
          </h1>
        </header>

        {/* Polaroid frame */}
        <div className="polaroid mx-auto my-6 w-[min(100%,19rem)] rotate-[-2deg] transition-all duration-700 ease-out hover:rotate-0 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] animate-fade-up delay-100">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#2b2118]">
            {/* Foto muncul pelan dan stabil (durasi 2,5 detik murni CSS transition) */}
            <div
              className={`relative h-full w-full transition-all duration-[2500ms] ease-out ${
                isPhotoLoaded
                  ? "opacity-100 filter-none scale-100"
                  : "opacity-0 blur-sm scale-[1.03]"
              }`}
            >
              <Image
                src="/cover.jpg"
                alt="Fifi & Rido"
                fill
                priority
                onLoad={() => setIsPhotoLoaded(true)}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#f4e6c8] drop-shadow-sm">
                ISO 400 • 21 FRAMES
              </p>
            </div>
          </div>
          <p className="mt-3 text-center font-serif text-xs italic text-[#5c4632]">
            {EVENT.tagline}
          </p>
        </div>

        {/* Form area */}
        <form onSubmit={onSubmit} className="mt-8 space-y-5 pb-4 animate-fade-up delay-200">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg font-bold leading-relaxed text-[#3b2416]">
              Abadikan setiap momen hangat di pernikahan kami melalui sudut pandangmu.
            </h2>
            <p className="font-sans text-xs font-normal leading-relaxed text-[#5c4632]">
              Masukkan nama kamu untuk mulai membuka rol film.
            </p>
          </div>

          <label className="block pt-1">
            <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#7a5a3a]">
              Nama tamu
            </span>
            <input
              value={name}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nama kamu"
              autoComplete="name"
              required
              className="w-full rounded-none border-0 border-b-2 border-[#3b2416]/40 bg-transparent px-1 py-2.5 font-serif text-xl font-medium text-[#3b2416] outline-none transition-colors duration-300 placeholder:text-[#3b2416]/30 focus:border-[#c45c26]"
            />
          </label>

          <button
            type="submit"
            disabled={!guestId || !name.trim()}
            className="w-full bg-[#2b2118] py-4 font-mono text-xs font-bold uppercase tracking-[0.32em] text-[#f6efe2] shadow-md transition-all duration-200 hover:bg-[#3b2e22] hover:shadow-lg active:scale-[0.97] active:shadow-inner disabled:opacity-40"
          >
            Mulai
          </button>
        </form>
      </div>
    </main>
  );
}