"use client";

import { ShotThumbnails } from "@/components/shot-thumbnails";
import { FUJI_CSS_FILTER, MAX_SHOTS } from "@/lib/constants";
import { captureFujiFrame, formatDisposableStamp } from "@/lib/fuji";
import { useGuestId, useGuestName } from "@/lib/guest";
import { fetchGuestPhotos, uploadGuestPhoto } from "@/lib/photos";
import type { LocalShot } from "@/lib/types";
import { SwitchCamera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function DisposableCamera() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const guestId = useGuestId();
  const guestName = useGuestName();
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [shots, setShots] = useState<LocalShot[]>([]);
  const [clock, setClock] = useState(formatDisposableStamp());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const remaining = Math.max(0, MAX_SHOTS - shots.length);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraReady(true);
      setError("");
    } catch {
      setCameraReady(false);
      setError("Kamera belum diizinkan. Ketuk tombol di bawah untuk mencoba lagi.");
    }
  }, [stopStream]);

  useEffect(() => {
    if (guestId && !guestName) {
      router.replace("/");
    }
  }, [guestId, guestName, router]);

  useEffect(() => {
    if (!guestId) return;

    fetchGuestPhotos(guestId)
      .then((photos) => {
        setShots(
          photos.map((photo) => ({
            id: photo.id,
            url: photo.photo_url,
            createdAt: photo.created_at,
          })),
        );
      })
      .catch(() => {
        setError("Gagal memuat rol foto. Coba refresh halaman.");
      });
  }, [guestId]);

  useEffect(() => {
    if (!guestId) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setCameraReady(true);
        setError("");
      })
      .catch(() => {
        if (!cancelled) {
          setCameraReady(false);
          setError(
            "Kamera belum diizinkan. Ketuk tombol di bawah untuk mencoba lagi.",
          );
        }
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, guestId, stopStream]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatDisposableStamp());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!guestId || shots.length < MAX_SHOTS) return;
    const timer = window.setTimeout(() => {
      router.replace("/gallery?done=1");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [guestId, router, shots.length]);

  async function onShutter() {
    const video = videoRef.current;
    if (!video || busy || remaining <= 0 || !cameraReady) return;

    setBusy(true);
    setFlash(true);
    window.navigator.vibrate?.(40);
    window.setTimeout(() => setFlash(false), 140);

    try {
      const blob = await captureFujiFrame(video, {
        mirror: facingMode === "user",
      });
      const previewUrl = URL.createObjectURL(blob);
      const tempId = `local_${Date.now()}`;
      setShots((current) => [
        ...current,
        { id: tempId, url: previewUrl, createdAt: new Date().toISOString() },
      ]);

      try {
        const saved = await uploadGuestPhoto({
          guestId,
          guestName,
          blob,
        });

        setShots((current) =>
          current.map((shot) =>
            shot.id === tempId
              ? { id: saved.id, url: saved.photo_url, createdAt: saved.created_at }
              : shot,
          ),
        );
        URL.revokeObjectURL(previewUrl);
      } catch (uploadError) {
        setShots((current) => current.filter((shot) => shot.id !== tempId));
        URL.revokeObjectURL(previewUrl);
        throw uploadError;
      }
    } catch {
      setError("Gagal menyimpan foto. Cek koneksi dan policy Supabase.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-[#16110d] text-[#f6efe2]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-5 pt-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#d7b48a]">
              QuickSnap
            </p>
            <p className="font-serif text-lg">{guestName || "Tamu"}</p>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#f3d7a4]">
            Sisa Foto: {remaining} / {MAX_SHOTS}
          </p>
        </header>

        <div className="polaroid relative mx-auto w-full max-w-[22rem]">
          <div className="relative aspect-[4/5] overflow-hidden bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                filter: FUJI_CSS_FILTER,
                transform: facingMode === "user" ? "scaleX(-1)" : undefined,
              }}
            />
            <div className="pointer-events-none absolute inset-0 mix-blend-soft-light bg-[linear-gradient(180deg,rgba(255,196,110,0.16),rgba(90,120,40,0.2))]" />
            <div className="pointer-events-none absolute inset-0 film-grain opacity-50" />
            <p className="pointer-events-none absolute bottom-3 right-3 font-lcd text-[13px] tracking-widest text-[#ff7a18] drop-shadow-[0_0_6px_rgba(255,90,0,0.7)]">
              {clock}
            </p>
            {flash ? <div className="absolute inset-0 bg-white/90" /> : null}
            {!cameraReady ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/55 p-6 text-center font-mono text-[11px] uppercase tracking-[0.18em]">
                Menyalakan kamera...
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <p className="font-serif text-sm text-[#5c4632]">{guestName}</p>
            <button
              type="button"
              onClick={() =>
                setFacingMode((mode) =>
                  mode === "environment" ? "user" : "environment",
                )
              }
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#7a5a3a]"
            >
              <SwitchCamera className="h-4 w-4" />
              Flip
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 space-y-2">
            <p className="text-center text-xs text-[#ffb089]">{error}</p>
            <button
              type="button"
              onClick={() => void startCamera(facingMode)}
              className="mx-auto block font-mono text-[10px] uppercase tracking-[0.2em] underline"
            >
              Izinkan kamera
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            aria-label="Shutter"
            disabled={busy || remaining <= 0 || !cameraReady}
            onClick={() => void onShutter()}
            className="shutter-button disabled:opacity-40"
          />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#d7c4a6]">
            {busy ? "Menggulung film..." : "Shutter"}
          </p>
        </div>

        <div className="mt-5">
          <ShotThumbnails shots={shots} />
        </div>

        <button
          type="button"
          onClick={() => router.push("/gallery?done=1")}
          className="mt-auto w-full border border-[#f3e6cf]/25 py-3 font-mono text-[11px] uppercase tracking-[0.22em]"
        >
          Selesai & Lihat Galeri
        </button>
      </div>
    </main>
  );
}
