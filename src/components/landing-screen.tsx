"use client";

import { EVENT, MAX_SHOTS } from "@/lib/constants";
import { setGuestName, useGuestId, useGuestName } from "@/lib/guest";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-5 py-8">
      <div className="pointer-events-none absolute inset-0 film-grain vintage-wash" />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-between">
        <header className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-amber-800/80">
            Fuji-ish disposable
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-none text-[#3b2416]">
            {EVENT.title}
          </h1>
          <p className="mt-2 font-serif italic text-[#7a5a3a]">{EVENT.subtitle}</p>
        </header>

        <div className="polaroid mx-auto w-[min(100%,20rem)] rotate-[-2deg]">
          <div className="aspect-[4/5] overflow-hidden bg-[#cbb79a]">
            <div className="flex h-full items-end bg-[linear-gradient(180deg,#d8c3a0_0%,#8d6a45_55%,#3e2a1b_100%)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#f4e6c8]">
                21 exposures
              </p>
            </div>
          </div>
          <p className="mt-3 text-center font-serif text-sm text-[#5c4632]">
            {EVENT.tagline}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 pb-4">
          <p className="text-center text-sm leading-relaxed text-[#5e4633]">
            Tamu undangan berhak mengambil{" "}
            <span className="font-semibold text-[#3b2416]">{MAX_SHOTS} foto</span>{" "}
            momen akad. Isi nama, lalu mulai menggulung film.
          </p>
          <label className="block">
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.22em] text-[#7a5a3a]">
              Nama tamu
            </span>
            <input
              value={name}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nama kamu"
              autoComplete="name"
              required
              className="w-full rounded-none border-0 border-b-2 border-[#3b2416]/30 bg-transparent px-1 py-3 font-serif text-xl text-[#3b2416] outline-none placeholder:text-[#3b2416]/30 focus:border-[#c45c26]"
            />
          </label>
          <button
            type="submit"
            disabled={!guestId || !name.trim()}
            className="w-full bg-[#2b2118] py-4 font-mono text-xs uppercase tracking-[0.32em] text-[#f6efe2] disabled:opacity-40"
          >
            Mulai
          </button>
        </form>
      </div>
    </main>
  );
}
