import { STORAGE_BUCKET } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { Album, GuestPhoto } from "@/lib/types";

export async function fetchAllPhotos(): Promise<GuestPhoto[]> {
  const { data, error } = await supabase
    .from("guest_photos")
    .select("id, guest_id, guest_name, photo_url, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchGuestPhotos(guestId: string): Promise<GuestPhoto[]> {
  const { data, error } = await supabase
    .from("guest_photos")
    .select("id, guest_id, guest_name, photo_url, created_at")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function uploadGuestPhoto(input: {
  guestId: string;
  guestName: string;
  blob: Blob;
}): Promise<GuestPhoto> {
  const path = `${input.guestId}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, input.blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("guest_photos")
    .insert({
      guest_id: input.guestId,
      guest_name: input.guestName,
      photo_url: publicData.publicUrl,
    })
    .select("id, guest_id, guest_name, photo_url, created_at")
    .single();

  if (error) throw error;
  return data;
}

export function groupAlbums(
  photos: GuestPhoto[],
  currentGuestId: string | null,
): Album[] {
  const map = new Map<string, Album>();

  for (const photo of photos) {
    const existing = map.get(photo.guest_id);
    if (existing) {
      existing.photos.push(photo);
      existing.coverUrl = photo.photo_url;
      continue;
    }

    map.set(photo.guest_id, {
      guestId: photo.guest_id,
      guestName: photo.guest_name,
      photos: [photo],
      coverUrl: photo.photo_url,
      isMine: photo.guest_id === currentGuestId,
    });
  }

  return [...map.values()].sort((a, b) => {
    if (a.isMine && !b.isMine) return -1;
    if (!a.isMine && b.isMine) return 1;
    const aTime = a.photos.at(-1)?.created_at ?? "";
    const bTime = b.photos.at(-1)?.created_at ?? "";
    return bTime.localeCompare(aTime);
  });
}
