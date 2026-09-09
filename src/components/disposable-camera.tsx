"use client";

import { MAX_SHOTS } from "@/lib/constants";
import { formatDisposableStamp } from "@/lib/fuji";
import { useGuestId, useGuestName } from "@/lib/guest";
import { fetchGuestPhotos, uploadGuestPhoto } from "@/lib/photos";
import type { LocalShot } from "@/lib/types";
import { Zap, ZapOff, RefreshCw, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FilterMode = "disposable" | "bw" | "normal";

export function DisposableCamera() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const guestId = useGuestId();
  const guestName = useGuestName();

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [shots, setShots] = useState<LocalShot[]>([]);
  const [clock, setClock] = useState(formatDisposableStamp());
  const [busy, setBusy] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashBurst, setFlashBurst] = useState(false);
  const [shutterBlink, setShutterBlink] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("disposable");
  const [isFlipping, setIsFlipping] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const remaining = Math.max(0, MAX_SHOTS - shots.length);

  const filmReel = useMemo(() => {
    const list: number[] = [];
    for (let i = MAX_SHOTS; i >= 0; i--) {
      list.push(i);
    }
    return list;
  }, []);

  const activeIndex = MAX_SHOTS - remaining;

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
      setError("Kamera belum diizinkan. Ketuk untuk mencoba lagi.");
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
        setError("Gagal memuat rol foto.");
      });
  }, [guestId]);

  useEffect(() => {
    if (!guestId) return;
    void startCamera(facingMode);
    return () => stopStream();
  }, [facingMode, guestId, startCamera, stopStream]);

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
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [guestId, router, shots.length]);

  const handleFlipCamera = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
      setTimeout(() => setIsFlipping(false), 220);
    }, 180);
  };

  const captureFrameWithFilter = async (video: HTMLVideoElement): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 960;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context failed");

    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Filter Base: Diturunkan 50% (hue-rotate dari -12deg -> -4deg)
    if (filterMode === "disposable") {
      ctx.filter = "contrast(1.12) saturate(1.08) brightness(1.02) hue-rotate(-4deg)";
    } else if (filterMode === "bw") {
      ctx.filter = "grayscale(100%) contrast(1.25) brightness(0.95)";
    } else {
      ctx.filter = "none";
    }

    ctx.drawImage(video, 0, 0, width, height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "none";

    // Fuji Tone Diturunkan 50%, Grain Kasar Tetap 100%
    if (filterMode === "disposable") {
      // 1. Shadow tint sejuk diturunkan 50% (opacity 0.12)
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(18, 55, 36, 0.12)";
      ctx.fillRect(0, 0, width, height);

      // 2. Midtone green wash diturunkan 50% (opacity 0.08)
      ctx.globalCompositeOperation = "color-burn";
      ctx.fillStyle = "rgba(45, 80, 60, 0.08)";
      ctx.fillRect(0, 0, width, height);

      // 3. Vignette halus tepi lensa
      ctx.globalCompositeOperation = "multiply";
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.4,
        width / 2,
        height / 2,
        width * 0.78,
      );
      vig.addColorStop(0, "rgba(255, 255, 255, 1)");
      vig.addColorStop(1, "rgba(185, 200, 190, 0.85)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      // 4. Procedural Heavy Grain ISO 400 TETAP 100% MANTAP
      ctx.globalCompositeOperation = "overlay";
      const grainCanvas = document.createElement("canvas");
      const grainCtx = grainCanvas.getContext("2d");
      if (grainCtx) {
        grainCanvas.width = 250;
        grainCanvas.height = 250;
        const imgData = grainCtx.createImageData(250, 250);
        const buffer = new Uint32Array(imgData.data.buffer);
        for (let i = 0; i < buffer.length; i++) {
          const noise = Math.floor(Math.random() * 255);
          buffer[i] = (65 << 24) | (noise << 16) | (noise << 8) | noise;
        }
        grainCtx.putImageData(imgData, 0, 0);
        ctx.fillStyle = ctx.createPattern(grainCanvas, "repeat") || "transparent";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalCompositeOperation = "source-over";
    }

    if (flashEnabled) {
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.15,
        width / 2,
        height / 2,
        width * 0.8,
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // Realtime Date Stamp Oranye Neon
    const stampText = clock;
    const fontSize = Math.max(22, Math.round(width * 0.032));
    ctx.font = `bold ${fontSize}px "Share Tech Mono", monospace`;
    ctx.fillStyle = "#ff7a18";
    ctx.shadowColor = "rgba(255, 100, 0, 0.85)";
    ctx.shadowBlur = 6;
    ctx.textAlign = "right";
    ctx.fillText(stampText, width - Math.round(width * 0.04), height - Math.round(height * 0.05));

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Blob error"));
        },
        "image/jpeg",
        0.92,
      );
    });
  };

  async function onShutter() {
    const video = videoRef.current;
    if (!video || busy || remaining <= 0 || !cameraReady) return;

    setBusy(true);
    setShutterBlink(true);
    setIsRolling(true);

    if (flashEnabled) {
      setFlashBurst(true);
      setTimeout(() => setFlashBurst(false), 160);
    }

    window.navigator.vibrate?.(45);
    setTimeout(() => setShutterBlink(false), 90);
    setTimeout(() => setIsRolling(false), 650);

    try {
      const blob = await captureFrameWithFilter(video);
      const previewUrl = URL.createObjectURL(blob);
      const tempId = `local_${Date.now()}`;

      setShots((current) => [
        ...current,
        { id: tempId, url: previewUrl, createdAt: new Date().toISOString() },
      ]);

      uploadGuestPhoto({
        guestId,
        guestName,
        blob,
      })
        .then((saved) => {
          setShots((current) =>
            current.map((shot) =>
              shot.id === tempId
                ? { id: saved.id, url: saved.photo_url, createdAt: saved.created_at }
                : shot,
            ),
          );
        })
        .catch(() => {
          console.warn("Upload Supabase tertunda, foto tersimpan lokal.");
        });
    } catch {
      setError("Gagal mengambil foto. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  // Live CSS Filter (Diturunkan 50%)
  const getVideoFilter = () => {
    if (filterMode === "disposable") {
      return "contrast(1.12) saturate(1.08) brightness(1.02) hue-rotate(-4deg)";
    }
    if (filterMode === "bw") {
      return "grayscale(100%) contrast(1.25) brightness(0.95)";
    }
    return "none";
  };

  const lastShot = shots[shots.length - 1];

  return (
    <main className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-black px-5 py-6 text-white select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/cover.jpg"
          alt="Cover"
          fill
          priority
          className="object-cover grayscale brightness-[0.16]"
        />
        <div className="absolute inset-0 film-grain-dark opacity-40" />
      </div>

      {flashBurst ? (
        <div className="fixed inset-0 z-50 pointer-events-none bg-white opacity-95 transition-opacity duration-150" />
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col justify-between">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between pt-1">
          <div>
            <p className="font-inter text-[11px] text-neutral-400">
              a disposable camera <span className="italic font-light">from</span>
            </p>
            <h2 className="font-inter text-lg font-medium text-white tracking-tight">
              {guestName || "Nama Tamu"}
            </h2>
          </div>

          {/* Badge Roll Counter */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/60 px-3 py-1.5 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col items-center justify-center">
              <div className={`relative h-6 w-6 ${isRolling ? "animate-roll-spin" : ""}`}>
                <Image
                  src="/film-roll-icon.png"
                  alt="Roll Film"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="mt-0.5 text-[7.5px] leading-tight text-neutral-400/80 tracking-tight text-center">
                Sisa foto<br />tersisa
              </span>
            </div>

            <div className="relative h-[66px] w-6 overflow-hidden select-none font-serif">
              <div
                className="flex flex-col items-center transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  transform: `translateY(${-(activeIndex * 22) + 22}px)`,
                }}
              >
                {filmReel.map((num, idx) => {
                  const isCurrent = idx === activeIndex;
                  return (
                    <div
                      key={num}
                      className={`h-[22px] flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? "text-[18px] font-bold text-white scale-105"
                          : "text-[11px] font-normal text-neutral-400/50 scale-95"
                      }`}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Viewfinder Polaroid Frame */}
        <div className="my-auto flex flex-col items-center py-2">
          <div className="relative w-full -rotate-[1.4deg] rounded-2xl border border-neutral-200/90 bg-[#F7F5F0] p-2.5 pb-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
            <div className="relative aspect-[4/4.8] w-full overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`camera-flip-anim absolute inset-0 h-full w-full object-cover ${
                  isFlipping ? "camera-flipping" : ""
                }`}
                style={{
                  filter: getVideoFilter(),
                  transform: facingMode === "user" ? "scaleX(-1)" : undefined,
                }}
              />

              {/* Viewfinder: Hijau diturunkan 50%, grain tetap kuat */}
              {filterMode === "disposable" ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[#0f3822]/10 mix-blend-screen" />
                  <div className="pointer-events-none absolute inset-0 bg-[#2d583b]/10 mix-blend-color-burn" />
                  <div className="pointer-events-none absolute inset-0 fuji-heavy-grain opacity-85" />
                </>
              ) : null}

              {shutterBlink ? (
                <div className="absolute inset-0 bg-black/90" />
              ) : null}

              <p className="pointer-events-none absolute bottom-3 right-3 font-lcd text-[13px] tracking-wider text-[#ff7a18] drop-shadow-[0_0_8px_rgba(255,100,0,0.85)]">
                {clock}
              </p>

              {!cameraReady ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center font-inter text-xs text-neutral-300">
                  Menyiapkan kamera...
                </div>
              ) : null}
            </div>

            <div className="mt-3.5 text-center">
              <p className="font-inter text-[9px] uppercase tracking-[0.35em] text-neutral-500 pl-[0.35em]">
                THE WEDDING OF
              </p>
              <h3 className="font-inria text-2xl font-normal text-neutral-800 tracking-wide mt-0.5">
                Fifi &amp; Rido
              </h3>
            </div>
          </div>

          {error ? (
            <p className="mt-2 text-center text-xs text-rose-400">{error}</p>
          ) : null}
        </div>

        {/* Liquid Sliding Filter Selector */}
        <div className="flex flex-col space-y-1.5 pb-1">
          <p className="font-inter text-[11px] text-neutral-400 pl-1">Filter</p>
          <div className="relative flex w-full rounded-xl bg-white/[0.08] p-1 backdrop-blur-md overflow-hidden">
            <div
              className="absolute top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-lg bg-neutral-200/90 shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]"
              style={{
                left:
                  filterMode === "disposable"
                    ? "4px"
                    : filterMode === "bw"
                    ? "calc(4px + (100% - 8px) / 3)"
                    : "calc(4px + ((100% - 8px) / 3) * 2)",
              }}
            />

            {(["disposable", "bw", "normal"] as FilterMode[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterMode(f)}
                className={`relative z-10 flex-1 py-1.5 text-center font-inter text-xs capitalize transition-colors duration-200 ${
                  filterMode === f
                    ? "font-semibold text-black"
                    : "font-normal text-neutral-400 hover:text-white"
                }`}
              >
                {f === "disposable" ? "Disposable" : f === "bw" ? "BW" : "Normal"}
              </button>
            ))}
          </div>
        </div>

        {/* Shutter Control Bar */}
        <div className="flex items-center justify-between px-3 pt-2 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlashEnabled((v) => !v)}
              className={`rounded-full p-2.5 transition-all active:scale-90 ${
                flashEnabled
                  ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.7)]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {flashEnabled ? (
                <Zap className="h-6 w-6 fill-amber-400" />
              ) : (
                <ZapOff className="h-6 w-6" />
              )}
            </button>

            <button
              type="button"
              onClick={handleFlipCamera}
              className="rounded-full p-2.5 text-neutral-300 hover:text-white transition-transform active:rotate-180 duration-300"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              disabled={busy || remaining <= 0 || !cameraReady}
              onClick={() => void onShutter()}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 p-1 shadow-lg transition-transform active:scale-95 disabled:opacity-30"
            >
              <div className="h-full w-full rounded-full bg-neutral-400/90 shadow-inner group-active:scale-90 transition-transform duration-100" />
            </button>
          </div>

          <div className="flex items-center justify-end w-[84px]">
            <button
              type="button"
              onClick={() => shots.length > 0 && setIsPreviewOpen(true)}
              className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/40 bg-white/[0.03] transition-transform active:scale-90 focus:outline-none"
            >
              {lastShot ? (
                <Image
                  src={lastShot.url}
                  alt="Recent Shot"
                  fill
                  className="object-cover"
                />
              ) : null}
            </button>
          </div>
        </div>

        {/* Bottom Gallery Action */}
        <button
          type="button"
          onClick={() => router.push("/gallery?done=1")}
          className="w-full rounded-xl border border-white/20 bg-white/[0.04] py-3 font-inter text-xs tracking-wider text-neutral-300 backdrop-blur-md transition-all hover:bg-white/[0.08] active:scale-[0.99]"
        >
          Selesai &amp; Lihat Galeri
        </button>
      </div>

      {/* Pop Up Galeri Mini */}
      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/85 p-5 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="font-inter text-xs font-medium text-white">
                Rol Foto Saya
              </p>
              <p className="font-inter text-[10px] text-neutral-400">
                {shots.length} dari {MAX_SHOTS} foto tersimpan
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 active:scale-90 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-auto max-h-[72vh] overflow-y-auto pr-1 py-3">
            <div className="grid grid-cols-2 gap-3.5">
              {shots.map((shot, idx) => (
                <div
                  key={shot.id}
                  className="group relative aspect-square w-full overflow-hidden rounded-[20px] border border-white/15 bg-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-transform active:scale-95"
                  style={{
                    animation: `fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
                    animationDelay: `${idx * 40}ms`,
                  }}
                >
                  <Image
                    src={shot.url}
                    alt={`Shot ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-md">
                    <span className="font-lcd text-[10px] text-[#ff7a18] drop-shadow-[0_0_4px_rgba(255,90,0,0.8)]">
                      #{idx + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(false)}
            className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 font-inter text-xs tracking-wider text-white backdrop-blur-md active:scale-[0.98] transition-all hover:bg-white/15"
          >
            Tutup Preview
          </button>
        </div>
      ) : null}
    </main>
  );
}