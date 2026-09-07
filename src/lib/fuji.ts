const FUJI_FILTER =
  "contrast(0.9) saturate(1.18) sepia(0.26) brightness(1.07) hue-rotate(-12deg)";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDisposableStamp(date = new Date()) {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear()).slice(-2);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}  ${month}  '${year}   ${hours}:${minutes}`;
}

export function drawVideoCover(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  destW: number,
  destH: number,
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return;

  const scale = Math.max(destW / vw, destH / vh);
  const sw = destW / scale;
  const sh = destH / scale;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, destW, destH);
}

function paintFujiGrade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(48, 32, 12, 0.16)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = "rgba(168, 196, 86, 0.18)";
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "overlay";
  const warmth = ctx.createLinearGradient(0, 0, w, h);
  warmth.addColorStop(0, "rgba(255, 186, 92, 0.12)");
  warmth.addColorStop(1, "rgba(70, 110, 40, 0.1)");
  ctx.fillStyle = warmth;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = "multiply";
  const vignette = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72,
  );
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(42, 28, 14, 0.38)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function paintTimestamp(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const stamp = formatDisposableStamp();
  const fontSize = Math.max(22, Math.round(w * 0.038));
  ctx.save();
  ctx.font = `${fontSize}px "Share Tech Mono", "Courier New", monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#ff7a18";
  ctx.shadowColor = "rgba(255, 90, 0, 0.55)";
  ctx.shadowBlur = 8;
  ctx.fillText(stamp, w - Math.round(w * 0.045), h - Math.round(h * 0.045));
  ctx.restore();
}

export async function captureFujiFrame(
  video: HTMLVideoElement,
  options?: { mirror?: boolean },
) {
  const destW = 1200;
  const destH = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");

  await document.fonts.ready.catch(() => undefined);

  ctx.filter = FUJI_FILTER;
  if (options?.mirror) {
    ctx.save();
    ctx.translate(destW, 0);
    ctx.scale(-1, 1);
    drawVideoCover(ctx, video, destW, destH);
    ctx.restore();
  } else {
    drawVideoCover(ctx, video, destW, destH);
  }
  ctx.filter = "none";
  paintFujiGrade(ctx, destW, destH);
  paintTimestamp(ctx, destW, destH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Gagal memproses foto"));
      },
      "image/jpeg",
      0.88,
    );
  });

  return blob;
}
