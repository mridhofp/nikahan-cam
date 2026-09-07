import { GalleryView } from "@/components/gallery-view";
import { Suspense } from "react";

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center font-serif text-[#3b2416]">
          Membuka galeri...
        </main>
      }
    >
      <GalleryView />
    </Suspense>
  );
}
